const MS_IN_HR = 3600000;


var hoursBetweenDates = (earlier, later) => {
    var earlierDate = new Date(earlier);
    var laterDate = new Date(later);
    var diff = laterDate - earlierDate;
    var weekendDayCount = 0;

    var counter = laterDate - (24*MS_IN_HR);
    while(counter > earlierDate) {
        let counterDate = new Date(counter);
        if(counterDate.getDay() == 0 || counterDate.getDay() == 6) {
            weekendDayCount++;
        }
        counter = counter - (24*MS_IN_HR);
    }

    //console.log(`weekend day count: ${weekendDayCount}`);
    //console.log(`diff hours ${Math.ceil(diff/MS_IN_HR)}`)
    //console.log(`diff minus weekends ${Math.ceil((diff - (weekendDayCount*24*MS_IN_HR))/MS_IN_HR)}`)
    return Math.ceil((diff - (weekendDayCount*24*MS_IN_HR))/MS_IN_HR);
}

var createContainerHTML = () => {
    var containerElement = document.createElement("div");
    containerElement.setAttribute("class", "cycle_time_by_point_container");
    containerElement.setAttribute("type", "pivotal_extensions_cycle_time_by_point");
    return containerElement;
}

var createTableHTML = (averageTimes) => {
    var containerElement = document.createElement("div");
    for(let estimate in averageTimes) {
        containerElement.insertAdjacentHTML( 'beforeend', `<p>Average for ${estimate} point stories is ${averageTimes[estimate]}</p>` );
    }
    return containerElement;
}

var removeCTBPHTML = () => {
    var old_element = document.querySelector('[type="pivotal_extensions_cycle_time_by_point"]');
    if(old_element != undefined) {
        old_element.remove();
    };
}

var removeLoadingGif = () => {
    var old_element = document.querySelector('[type="pivotal_extensions_loading_gif"]');
    if(old_element != undefined) {
        old_element.remove();
    };
}

var createLoadingGifHTML = () => {
    var containerElement = document.createElement("img");
    containerElement.setAttribute("type", "pivotal_extensions_loading_gif");
    containerElement.setAttribute("class", "cycle_time_by_point_loading_gif");
    var gifURL = browser.runtime.getURL("assets/loading.gif");
    containerElement.src = gifURL;
    //containerElement.insertAdjacentHTML('beforeend', `<img src="${gifURL}"></img>`);
    return containerElement;
}


// TODO   #187019876 is off
//        #186984278
// just track time in each state and return object for printing detailed data
var determineTimeSpent = (history) => {
    var total = 0;
    var started;
    var hours;
    //console.log(history);
    for(let i = history.length - 1; i >= 0; i--) {
        //console.log(`${i} ${history[i].highlight}`);
        if(history[i].highlight === "accepted" && started !== undefined) {
            let accepted = history[i].occurred_at;
            //console.log(`${i} ${history[i].highlight} ${accepted}`);
            hours = hoursBetweenDates(started, accepted);
            total += hours;
        } else if(history[i].highlight === "unstarted") {
            let unstarted = history[i].occurred_at;
            //console.log(`${i} ${history[i].highlight} ${unstarted}`);
            hours = hoursBetweenDates(started, unstarted);
            total += hours;
        } else if(history[i].highlight === "started") {
            started = history[i].occurred_at;
            //console.log(`${i} started ${started}`);
        } 
    }
    return total;
}

var cycletimetest = async () => {
    console.log("cycletimetest");

    removeCTBPHTML();
    var chartElement = document.querySelector(`.cycle-time-chart`);
    var newElement = createContainerHTML();
    newElement.appendChild(createLoadingGifHTML());
    chartElement.parentNode.appendChild(newElement);

    //var stories = fetchAllStories();
    //console.log(stories);
    var ITERATIONS_TO_FETCH = 1;
    const myRequest = new Request(`${BASE_URL}/projects/${extractProjectId()}/iterations?scope=done&offset=-${ITERATIONS_TO_FETCH}`);
    var response = await fetch(myRequest, requestInit);
    var iterations = await response.json();
    var storyPointCount = {};
    var storyPointTime = {};
    for(let i = 0; i < iterations.length; i++) {
    //for(let i = 0; i < 1; i++) {
        //console.log(iterations[i])
        console.log(`Processing iteration ${iterations[i].number}`);
        for(let s = 0; s < iterations[i].stories.length; s++) {
        //for(let s = 0; s < 1; s++) {
            let story = iterations[i].stories[s];
            if(story.story_type === "feature") {
            //if(story.story_type === "feature" && story.estimate === 3 && s===4) {
                let history = await fetchStoryHistory(story.id, false);
                //console.log(story)
                //console.log(history)
                var time_spent = determineTimeSpent(history);
                //console.log(`${story.name} time_spent ${time_spent}`)

                if(storyPointCount[story.estimate] === undefined) {
                    storyPointCount[story.estimate] = 0;
                }
                if(storyPointTime[story.estimate] === undefined) {
                    storyPointTime[story.estimate] = 0;
                }

                storyPointCount[story.estimate]++;
                storyPointTime[story.estimate] += time_spent;
            }
            
        }
        //console.log(storyPointCount);
        //console.log(storyPointTime);
    }
    console.log(storyPointCount);
    console.log(storyPointTime);

    let averageTimes = {};
    for(let estimate in storyPointCount) {
        averageTimes[estimate] = storyPointTime[estimate]/storyPointCount[estimate];
        console.log(`Average for ${estimate} story is ${averageTimes[estimate]} hours`);
    }
    //console.log(averageTimes);

    removeLoadingGif();
    
    newElement.appendChild(createTableHTML(averageTimes));

    
}