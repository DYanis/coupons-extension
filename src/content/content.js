let isSelectionEnabled = false;
let isApplyButtonSelectionEnabled = false;
let isPriceFieldSelectionEnabled = false;
let isRemoveButtonSelectionEnabled = false;
let selectedInputSelector = null;
let applyButtonSelector = null;
let priceFieldSelector = null;
let removeButtonSelector = null;
let automationRunning = false;
let promoCodes = [];
let popularWords = [];
const usedCodes = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enableSelection") {
    enableSelectionMode("selection");
  } else if (message.action === "enableApplyButtonSelection") {
    enableSelectionMode("applyButton");
  } else if (message.action === "enablePriceFieldSelection") {
    enableSelectionMode("priceField");
  } else if (message.action === "enableRemoveButtonSelection") {
    enableSelectionMode("removeButton");
  } else if (message.action === "applyCodes") {
    startAutomation(
      message.interval,
      message.applyTimeout,
      message.length,
      message.usePopularWords,
      message.useSpecialCharacters
    );
  } else if (message.action === "stopAutomation") {
    stopAutomation();
  }
});

function blockAllEvents(event) {
  if (
    (isSelectionEnabled ||
      isApplyButtonSelectionEnabled ||
      isPriceFieldSelectionEnabled ||
      isRemoveButtonSelectionEnabled) &&
    !event.target.matches(
      "input, button, textarea, [contenteditable], div, span, p"
    )
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}

function enableSelectionMode(mode) {
  isSelectionEnabled = mode === "selection";
  isApplyButtonSelectionEnabled = mode === "applyButton";
  isPriceFieldSelectionEnabled = mode === "priceField";
  isRemoveButtonSelectionEnabled = mode === "removeButton";

  document.body.style.cursor = mode === "selection" ? "crosshair" : "pointer";

  document.addEventListener("click", blockAllEvents, true);
  document.addEventListener("mousedown", blockAllEvents, true);
  document.addEventListener("mouseup", blockAllEvents, true);
  document.addEventListener("mouseover", highlightElement);
  document.addEventListener("mouseout", unhighlightElement);

  const selectionHandler = getSelectionHandler(mode);
  if (selectionHandler) {
    document.addEventListener("click", selectionHandler, true);
  }
}

function disableSelectionMode() {
  isSelectionEnabled = false;
  isApplyButtonSelectionEnabled = false;
  isPriceFieldSelectionEnabled = false;
  isRemoveButtonSelectionEnabled = false;

  document.body.style.cursor = "default";

  document.removeEventListener("click", blockAllEvents, true);
  document.removeEventListener("mousedown", blockAllEvents, true);
  document.removeEventListener("mouseup", blockAllEvents, true);
  document.removeEventListener("mouseover", highlightElement);
  document.removeEventListener("mouseout", unhighlightElement);
  document.removeEventListener("click", selectInputElement, true);
  document.removeEventListener("click", selectApplyButtonElement, true);
  document.removeEventListener("click", selectPriceFieldElement, true);
  document.removeEventListener("click", selectRemoveButtonElement, true);
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
  event.stopImmediatePropagation();

  const element = event.target;

  if (element.tagName.toLowerCase() === "input" || element.isContentEditable) {
    selectedInputSelector = getElementSelector(element);
  } else {
    alert("Please select a valid input field.");
  }

  disableSelectionMode();
}

function selectApplyButtonElement(event) {
  if (!isApplyButtonSelectionEnabled) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const element = event.target;
  applyButtonSelector = getElementSelector(element);

  disableSelectionMode();
}

function selectPriceFieldElement(event) {
  if (!isPriceFieldSelectionEnabled) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const element = event.target;
  priceFieldSelector = getElementSelector(element);
  element.style.outline = "2px dashed green";

  disableSelectionMode();
}

function selectRemoveButtonElement(event) {
  if (!isRemoveButtonSelectionEnabled) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const element = event.target;
  removeButtonSelector = getElementSelector(element);

  disableSelectionMode();
}

function getElementSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${Array.from(element.classList).join(".")}`;
  return element.tagName.toLowerCase();
}

async function loadInitialData() {
  try {
    const promoCodesResponse = await fetch(
      chrome.runtime.getURL("data/promo-codes.json")
    );
    const promoCodesData = await promoCodesResponse.json();
    promoCodes = promoCodesData.promoCodes || [];

    const popularWordsResponse = await fetch(
      chrome.runtime.getURL("data/popular-words.json")
    );
    const popularWordsData = await popularWordsResponse.json();
    popularWords = popularWordsData.popularWords || [];
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load initial data.");
  }
}

function getSelectionHandler(mode) {
  switch (mode) {
    case "selection":
      return selectInputElement;
    case "applyButton":
      return selectApplyButtonElement;
    case "priceField":
      return selectPriceFieldElement;
    case "removeButton":
      return selectRemoveButtonElement;
    default:
      return null;
  }
}

function startAutomation(
  interval = 100,
  applyTimeout = 100,
  length = 6,
  usePopularWords = true,
  useSpecialCharacters = false
) {
  if (!selectedInputSelector || !applyButtonSelector || !priceFieldSelector) {
    alert(
      "Please select an input field, an apply button, and a price field before starting the automation."
    );
    return;
  }

  if (promoCodes.length === 0) {
    alert("No promo codes found.");
    return;
  }

  let originalPrice;
  let index = 0;
  automationRunning = true;

  const automationInterval = setInterval(() => {
    if (!automationRunning) {
      clearInterval(automationInterval);
      return;
    }

    const selectedElement = document.querySelector(selectedInputSelector);
    const applyButton = document.querySelector(applyButtonSelector);
    const priceField = document.querySelector(priceFieldSelector);

    if (!selectedElement || !applyButton || !priceField) {
      alert("One of the selected elements is missing on the page.");
      automationRunning = false;
      clearInterval(automationInterval);
      return;
    }

    originalPrice = priceField.textContent.trim();

    let currentCode;
    if (index < promoCodes.length) {
      currentCode = promoCodes[index];
    } else {
      currentCode = generateUniquePromoCode(
        length,
        usePopularWords,
        useSpecialCharacters,
        popularWords
      );
    }

    setNewPromoCode(selectedElement, currentCode);
    applyButton.click();
    usedCodes.add(currentCode);

    setTimeout(() => {
      const currentPrice = priceField.textContent.trim();
      if (currentPrice !== originalPrice) {
        automationRunning = false;
        clearInterval(automationInterval);
        alert("Promo code applied successfully.");
      } else {
        const removeButton = removeButtonSelector
          ? document.querySelector(removeButtonSelector)
          : null;
        if (removeButton) {
          removeButton.click();
        }
        index++;
      }
    }, applyTimeout);
  }, interval);
}

function stopAutomation() {
  if (automationRunning) {
    automationRunning = false;
  } else {
    alert("Automation is not running.");
  }
}

function generateUniquePromoCode(
  length,
  usePopularWords,
  useSpecialCharacters,
  popularWords
) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const specials = "!@#$%^&*";

  let generatedCode = "";

  if (usePopularWords) {
    const word = popularWords[Math.floor(Math.random() * popularWords.length)];
    const randomDigit = Math.floor(Math.random() * 18) * 5 + 5; // Generate multiples of 5 from 5 to 90
    const position = Math.random() < 0.5 ? "before" : "after";

    if (position === "before") {
      generatedCode = randomDigit + word;
    } else {
      generatedCode = word + randomDigit;
    }
  } else {
    const allCharacters = useSpecialCharacters
      ? characters + specials
      : characters;

    for (let i = 0; i < length; i++) {
      generatedCode += allCharacters.charAt(
        Math.floor(Math.random() * allCharacters.length)
      );
    }
  }

  // Ensure the code is unique
  if (usedCodes.has(generatedCode)) {
    return generateUniquePromoCode(
      length,
      usePopularWords,
      useSpecialCharacters,
      popularWords
    );
  }

  return generatedCode;
}

function setNewPromoCode(element, promoCode) {
  element.value = promoCode;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

// Load promo codes and popular words once at initialization
loadInitialData();
