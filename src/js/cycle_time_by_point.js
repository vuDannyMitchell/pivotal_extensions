//const BASE_URL = "https://www.pivotaltracker.com/services/v5";

// TODO this should be more complicated
var determineTimeSpent = (history) => {
    //console.log("history");
    //console.log(history);
    var started;
    var accepted;
    for(let i = 0; i < history.length; i++) {
        //console.log(history[i]);
        if(history[i].highlight === "started") {
            //console.log("started");
            started = Date.parse(history[i].occurred_at);
            //console.log(history[i].occurred_at);
        } 
        if(history[i].highlight === "accepted" && accepted === undefined) {
            //console.log("accepted");
            accepted = Date.parse(history[i].occurred_at);
            //console.log(history[i].occurred_at);
        } 
    }
    var hours = (accepted - started) / 3600000;
    //console.log(`hours: ${hours}`);
    if(accepted === undefined || started === undefined) {
        //console.log(started);
        //console.log(accepted);
        
        //console.log(history);
    }
    return hours;
}

var cycletimetest = async () => {
    console.log("cycletimetest");
    //var stories = fetchAllStories();
    //console.log(stories);
    var ITERATIONS_TO_FETCH = 4;
    const myRequest = new Request(`${BASE_URL}/projects/${extractProjectId()}/iterations?scope=done&offset=-${ITERATIONS_TO_FETCH}`);
    var response = await fetch(myRequest, requestInit);
    var iterations = await response.json();
    var storyPointCount = {};
    var storyPointTime = {};
    for(let i = 0; i < iterations.length; i++) {
        for(let s = 0; s < iterations[i].stories.length; s++) {
            let story = iterations[i].stories[s];
            if(story.story_type === "feature") {
                let history = await fetchStoryHistory(story.id, false);
                var time_spent = determineTimeSpent(history);

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
    //console.log(storyPointCount);
    //console.log(storyPointTime);

    //for (let key in yourobject) {
    //    console.log(key, yourobject[key]);
    //  }
    let averageTimes = {};
    for(let estimate in storyPointCount) {
        averageTimes[estimate] = storyPointTime[estimate]/storyPointCount[estimate];
        console.log(`Average for ${estimate} story is ${averageTimes[estimate]} hours`);
    }
    //console.log(averageTimes);
}