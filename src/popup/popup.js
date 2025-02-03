document.getElementById("select-input").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "enableSelection" });
  });
  window.close();
});

document.getElementById("select-apply-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enableApplyButtonSelection",
    });
  });
  window.close();
});

document.getElementById("select-price-field").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "enablePriceFieldSelection",
    });
  });
  window.close();
});

document
  .getElementById("select-remove-button")
  .addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "enableRemoveButtonSelection",
      });
    });
    window.close();
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
      startButton.style.backgroundColor = "#e64a19";
    }
  });
});

// Save settings to storage
function saveSettings() {
  chrome.storage.sync.set(
    {
      interval: document.getElementById("interval").value,
      applyTimeout: document.getElementById("apply-timeout").value,
      length: document.getElementById("length").value,
      usePopularWords: document.getElementById("use-popular-words").checked,
      useSpecialCharacters: document.getElementById("use-special-characters")
        .checked,
    },
    () => {
      console.log("Settings saved.");
    }
  );
}

// Add event listeners to save settings on change
document.getElementById("interval").addEventListener("input", saveSettings);
document
  .getElementById("apply-timeout")
  .addEventListener("input", saveSettings);
document.getElementById("length").addEventListener("input", saveSettings);
document
  .getElementById("use-popular-words")
  .addEventListener("change", saveSettings);
document
  .getElementById("use-special-characters")
  .addEventListener("change", saveSettings);

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(
    {
      interval: "1000",
      applyTimeout: "500",
      length: "6",
      usePopularWords: true,
      useSpecialCharacters: false,
    },
    (settings) => {
      document.getElementById("interval").value = settings.interval;
      document.getElementById("apply-timeout").value = settings.applyTimeout;
      document.getElementById("length").value = settings.length;
      document.getElementById("use-popular-words").checked =
        settings.usePopularWords;
      document.getElementById("use-special-characters").checked =
        settings.useSpecialCharacters;
    }
  );
}

// Call loadSettings when the popup is opened
document.addEventListener("DOMContentLoaded", loadSettings);
