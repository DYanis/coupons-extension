let isSelectionEnabled = false;
let isApplyButtonSelectionEnabled = false;
let isPriceFieldSelectionEnabled = false;
let selectedElement = null;
let applyButton = null;
let priceField = null;
let automationRunning = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enableSelection") {
    enableSelectionMode();
  } else if (message.action === "enableApplyButtonSelection") {
    enableApplyButtonSelectionMode();
  } else if (message.action === "enablePriceFieldSelection") {
    enablePriceFieldSelectionMode();
  } else if (message.action === "applyCodes") {
    startAutomation();
  }
});

function enableSelectionMode() {
  isSelectionEnabled = true;
  isApplyButtonSelectionEnabled = false;
  isPriceFieldSelectionEnabled = false;
  document.body.style.cursor = "crosshair";

  document.addEventListener("mouseover", highlightElement);
  document.addEventListener("mouseout", unhighlightElement);
  document.addEventListener("click", selectInputElement);
}

function enableApplyButtonSelectionMode() {
  isApplyButtonSelectionEnabled = true;
  isSelectionEnabled = false;
  isPriceFieldSelectionEnabled = false;
  document.body.style.cursor = "pointer";

  document.addEventListener("mouseover", highlightElement);
  document.addEventListener("mouseout", unhighlightElement);
  document.addEventListener("click", selectApplyButtonElement);
}

function enablePriceFieldSelectionMode() {
  isPriceFieldSelectionEnabled = true;
  isSelectionEnabled = false;
  isApplyButtonSelectionEnabled = false;
  document.body.style.cursor = "pointer";

  document.addEventListener("mouseover", highlightElement);
  document.addEventListener("mouseout", unhighlightElement);
  document.addEventListener("click", selectPriceFieldElement);
}

function highlightElement(event) {
  const element = event.target;
  element.style.outline = "2px solid red";
}

function unhighlightElement(event) {
  const element = event.target;
  element.style.outline = "";
}

function selectInputElement(event) {
  if (!isSelectionEnabled) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;

  if (element.tagName.toLowerCase() === "input" || element.isContentEditable) {
    selectedElement = element;
    alert("Input field selected!");
  } else {
    alert("Please select a valid input field.");
  }

  disableSelectionMode();
}

function selectApplyButtonElement(event) {
  if (!isApplyButtonSelectionEnabled) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;

  applyButton = element;
  alert("Apply button selected!");

  disableApplyButtonSelectionMode();
}

function selectPriceFieldElement(event) {
  if (!isPriceFieldSelectionEnabled) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;

  priceField = element;

  element.style.outline = "2px dashed green";
  alert("Price field selected!");

  disablePriceFieldSelectionMode();
}

function disableSelectionMode() {
  isSelectionEnabled = false;
  document.body.style.cursor = "default";

  document.removeEventListener("mouseover", highlightElement);
  document.removeEventListener("mouseout", unhighlightElement);
  document.removeEventListener("click", selectInputElement);
}

function disableApplyButtonSelectionMode() {
  isApplyButtonSelectionEnabled = false;
  document.body.style.cursor = "default";

  document.removeEventListener("mouseover", highlightElement);
  document.removeEventListener("mouseout", unhighlightElement);
  document.removeEventListener("click", selectApplyButtonElement);
}

function disablePriceFieldSelectionMode() {
  isPriceFieldSelectionEnabled = false;
  document.body.style.cursor = "default";

  document.removeEventListener("mouseover", highlightElement);
  document.removeEventListener("mouseout", unhighlightElement);
  document.removeEventListener("click", selectPriceFieldElement);
}

function startAutomation() {
  if (!selectedElement || !applyButton || !priceField) {
    alert(
      "Please select an input field, an apply button, and a price field before starting the automation."
    );
    return;
  }

  const promoCodes = [
    "SAVE10",
    "WELCOME15",
    "ELECTROIT",
    "DISCOUNT20",
    "FREESHIP",
    "SUMMER25",
    "HOLIDAY30",
  ];

  let originalPrice = priceField.textContent.trim();
  let index = 0;
  automationRunning = true;

  const tryNextCode = () => {
    if (!automationRunning || index >= promoCodes.length) {
      alert("Automation stopped or all promo codes have been tested.");
      return;
    }

    const currentCode = promoCodes[index];
    selectedElement.value = currentCode;
    selectedElement.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      applyButton.click();

      setTimeout(() => {
        const currentPrice = priceField.textContent.trim();
        if (currentPrice !== originalPrice) {
          alert(`Price changed to ${currentPrice}! Stopping automation.`);
          automationRunning = false;
          return;
        }

        console.log(`Tried promo code: ${currentCode}`);
        index++;
        setTimeout(tryNextCode, 2000);
      }, 1000);
    }, 1000);
  };

  tryNextCode();
}
