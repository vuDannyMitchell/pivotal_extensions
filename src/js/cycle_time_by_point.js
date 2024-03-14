const TRACKABLE_STATES = ["started", "finished", "delivered", "accepted"];


var insertBox = () => {
    var containerElement = document.createElement("div");
    containerElement.setAttribute("class", "pe_test");
    var chartElement = document.querySelector(`.cycle-time-chart`);
    chartElement.parentNode.parentNode.parentNode.appendChild(containerElement);

}

var createContainerHTML = () => {
    var containerElement = document.createElement("div");
    containerElement.setAttribute("class", "cycle_time_by_point_container");
    containerElement.setAttribute("type", "pivotal_extensions_cycle_time_by_point");
    return containerElement;
}

var createPointColorBox = (estimate) => {
    var color;
    if(estimate === "0") {
        color = "rgb(83, 189, 235)";
    } else if (estimate === "1") {
        color = "rgb(252, 161, 0)";
    } else if (estimate === "2") {
        color = "rgb(49, 189, 130)";
    } else if (estimate === "3") {
        color = "rgb(239, 225, 41)";
    } else if (estimate === "5") {
        color = "rgb(120, 118, 225)";
    } else if (estimate === "8") {
        color = "rgb(229, 96, 31)";
    } else if (estimate === "13") {
        color = "rgb(225, 124, 172)";
    } else {
        color = "rgb(0, 0, 0)";
    }

    return(`<span style="border-top: 10px solid ${color};display:inline-block;width:10px;margin-right:5px"></span>`)
}

var capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var createTableHTML = (averageTimes, iterationsToAverage) => {
    //console.log("creating table");
    //console.log(iterationsToAverage)
    var containerElement = document.createElement("div");
    var headerElement = document.createElement("h2");
    headerElement.setAttribute("class","chart_header");
    headerElement.innerHTML = `Average Time Spent over ${iterationsToAverage} iteration(s)`;
    containerElement.appendChild(headerElement);
    var tableElement = document.createElement("table");
    tableElement.setAttribute("class","chart_table");
    var tableRowElement = document.createElement("tr");
    var columnElement = document.createElement("th");
    columnElement.innerHTML = `Estimate`;
    columnElement.setAttribute("class","chart_column_header");
    tableRowElement.appendChild(columnElement);
    
    for(state in TRACKABLE_STATES) {
        columnElement = document.createElement("th");
        columnElement.setAttribute("class","chart_column_header");
        columnElement.innerHTML = `${capitalizeFirstLetter(TRACKABLE_STATES[state])}`;
        tableRowElement.appendChild(columnElement);
    }
    tableElement.appendChild(tableRowElement);

    for(let estimate in averageTimes) {
        tableRowElement = document.createElement("tr");
        columnElement = document.createElement("td");
        columnElement.setAttribute("class","chart_column_element");
        columnElement.innerHTML = createPointColorBox(estimate);
        columnElement.innerHTML += `${estimate} (${averageTimes[estimate].count})`;
        tableRowElement.appendChild(columnElement);
        for(state in averageTimes[estimate]) {
            columnElement = document.createElement("td");
            columnElement.innerHTML = `${averageTimes[estimate][state]}`;
            tableRowElement.appendChild(columnElement);
        }
        tableElement.appendChild(tableRowElement);
    }

    containerElement.appendChild(tableElement);

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
    var gifURL = chrome.runtime.getURL("assets/loading.gif");
    containerElement.src = gifURL;
    //containerElement.insertAdjacentHTML('beforeend', `<img src="${gifURL}"></img>`);
    return containerElement;
}

// Counts 24 hours a day, minus weekends
var hoursBetweenDates = (earlier, later) => {
    const MS_IN_HR = 3600000;

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
    return Math.ceil((diff - (weekendDayCount*24*MS_IN_HR))/MS_IN_HR);
}

var determineTimeSpentInEachState = (history) => {
    var timeSpent = {};
    var trackedState = {};
    for(state in TRACKABLE_STATES) {
        timeSpent[TRACKABLE_STATES[state]] = 0;
    }
    for(let i = history.length - 1; i >= 0; i--) {        
        if(TRACKABLE_STATES.includes(history[i].highlight)) {
            if(trackedState.highlight === undefined) {
                trackedState.highlight = history[i].highlight;
                trackedState.occurred_at = history[i].occurred_at;
            } else {
                var hoursBetween = hoursBetweenDates(trackedState.occurred_at, history[i].occurred_at);
                timeSpent[trackedState.highlight] += hoursBetween;
                trackedState.highlight = history[i].highlight;
                trackedState.occurred_at = history[i].occurred_at;
            }
        }
    }
    return timeSpent;
}

var cycletimetest = async (displayChart, iterationsToAverage) => {

    removeCTBPHTML();
    if(displayChart === "true") {
        var chartElement = document.querySelector(`.cycle-time-chart`);
        var newElement = createContainerHTML();
        newElement.appendChild(createLoadingGifHTML());
        //chartElement.parentNode.appendChild(newElement);
        newElement.setAttribute("class", "cycle_time_average");
        chartElement.parentNode.parentNode.parentNode.appendChild(newElement);

        var iterations = await fetchPrecedingIterations(iterationsToAverage);
        //console.log(iterations);
        var storyStateData = {};
        for(let i = 0; i < iterations.length; i++) {
            console.log(`Processing iteration ${iterations[i].number}`);
            for(let s = 0; s < iterations[i].stories.length; s++) {
                let story = iterations[i].stories[s];
                if(story.story_type === "feature") {
                    let history = await fetchStoryHistory(story.id, false);

                    var timeSpent = determineTimeSpentInEachState(history);
                    
                    if(storyStateData[story.estimate] === undefined) {
                        storyStateData[story.estimate] = { count : 0, timeSpent : {}}
                        for(state in TRACKABLE_STATES) {
                            storyStateData[story.estimate].timeSpent[TRACKABLE_STATES[state]] = 0;
                        }
                    } else {
                        storyStateData[story.estimate].count++;
                        for(state in TRACKABLE_STATES) {
                            storyStateData[story.estimate].timeSpent[TRACKABLE_STATES[state]] += timeSpent[TRACKABLE_STATES[state]];
                        }
                    }
                }   
            }
        }
        
        var averageTimes = {}
        for(estimate in storyStateData) {
            averageTimes[estimate] = {
                count : storyStateData[estimate].count
            };
            for(state in TRACKABLE_STATES) {
                averageTimes[estimate][TRACKABLE_STATES[state]] = Math.round(storyStateData[estimate].timeSpent[TRACKABLE_STATES[state]] / storyStateData[estimate].count);
            }
        }
        //console.log(averageTimes)

        removeLoadingGif();
        
        newElement.appendChild(createTableHTML(averageTimes, iterationsToAverage));
    }   
}