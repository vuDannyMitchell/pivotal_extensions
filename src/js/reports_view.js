const CYCLE_TIME_CHART = "cycle_time_chart"
const CYCLE_TIME_ITERATIONS = "cycle_time_iterations"

console.log("cycle_time_main");

var readPrefsFromStorageAndUpdate = (forceRefresh) => {
    
    chrome.storage.local.get([CYCLE_TIME_CHART,CYCLE_TIME_ITERATIONS]).then((result) => {
        var cycle_time_chart = result[CYCLE_TIME_CHART];
        if(!cycle_time_chart) cycle_time_chart = "true";

        var cycle_time_iterations = parseInt(result[CYCLE_TIME_ITERATIONS]);
        if(!cycle_time_iterations) cycle_time_iterations = 4;

        var preferences = {
            [CYCLE_TIME_CHART] : cycle_time_chart, 
            [CYCLE_TIME_ITERATIONS] : cycle_time_iterations
        };
        updatePage(preferences, forceRefresh);
      });
      
}

var updatePage = (preferences, forceRefresh) => {
    //console.log("Updatepage");
    //console.log(preferences);
    cycletimetest(preferences[CYCLE_TIME_CHART], preferences[CYCLE_TIME_ITERATIONS]);
    /*
    if(preferences.add_days_in_progress === "true") {
        addDaysInProgress(forceRefresh);
    } else {
        removeDaysInProgress();
    }

    if(preferences.iteration_progress === "true") {
        addIterationProgress(forceRefresh);
    } else {
        removeIterationProgress();
    }
    */
}

var handleRefreshEvent = () => {
    readPrefsFromStorageAndUpdate(false);
}

var handleForceRefreshEvent = () => {
    readPrefsFromStorageAndUpdate(true);
}

var handleSetTokenEvent = (data) => {
    setHeaders(data.token);
}

var handleMessage = (request, sender, sendResponse) => {
    switch(request.event) {
        case "refresh":
            handleRefreshEvent();
            break;
        case "set_token":
            handleSetTokenEvent(request.data);
            break;
        case "force_refresh":
            handleForceRefreshEvent();
            break;
    }
}


chrome.runtime.onMessage.addListener(handleMessage);

waitForElement(`.cycle-time-chart`).then((elm) => {
    //console.log("waited");
    readPrefsFromStorageAndUpdate(false);
});

