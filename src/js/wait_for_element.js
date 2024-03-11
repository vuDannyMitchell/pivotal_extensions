// https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
var waitForElement = (selector) => {
    console.log(`waiting for element ${selector}`);
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}