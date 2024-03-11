console.log("cycle_time_main");

var readPrefsFromStorageAndUpdate = (forceRefresh) => {
    /*
    chrome.storage.local.get(["add_days_in_progress","iteration_progress"]).then((result) => {
        var add_days_in_progress = result.add_days_in_progress;
        if(!add_days_in_progress) add_days_in_progress = "true";

        var iteration_progress = result.iteration_progress;
        if(!iteration_progress) iteration_progress = "true";

        var preferences = {
            add_days_in_progress : add_days_in_progress, 
            iteration_progress : iteration_progress
        };
        updatePage(preferences, forceRefresh);
      });
      */
}

var updatePage = (preferences, forceRefresh) => {
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
    console.log("waited");
    cycletimetest();
});

