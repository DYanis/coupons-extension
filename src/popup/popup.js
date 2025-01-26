document.getElementById("select-input").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "enableSelection" });
  });
});

document.getElementById("select-apply-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enableApplyButtonSelection",
    });
  });
});

document.getElementById("select-price-field").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enablePriceFieldSelection",
    });
  });
});

const startButton = document.getElementById("start-automation");
let automationRunning = false;

startButton.addEventListener("click", () => {
  automationRunning = !automationRunning;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (automationRunning) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyCodes",
        interval: parseInt(document.getElementById("interval").value, 10),
        applyTimeout: parseInt(
          document.getElementById("apply-timeout").value,
          10
        ),
        length: parseInt(document.getElementById("length").value, 10),
        usePopularWords: document.getElementById("use-popular-words").checked,
        useSpecialCharacters: document.getElementById("use-special-characters")
          .checked,
      });
      startButton.innerHTML =
        '<i class="fas fa-stop-circle"></i> Stop Automation';
      startButton.style.backgroundColor = "#dc3545";
    } else {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopAutomation" });
      startButton.innerHTML =
        '<i class="fas fa-play-circle"></i> Start Automation';
      startButton.style.backgroundColor = "#007bff";
    }
  });
});
