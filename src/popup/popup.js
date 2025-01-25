document.getElementById("select-input").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "enableSelection" });
    window.close();
  });
});

document.getElementById("select-apply-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enableApplyButtonSelection",
    });
    window.close();
  });
});

document.getElementById("select-price-field").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enablePriceFieldSelection",
    });
    window.close();
  });
});

document.getElementById("start-automation").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "applyCodes" });
  });
});
