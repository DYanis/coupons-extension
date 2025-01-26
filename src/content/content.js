let isSelectionEnabled = false;
let isApplyButtonSelectionEnabled = false;
let isPriceFieldSelectionEnabled = false;
let selectedElement = null;
let applyButton = null;
let priceField = null;
let automationRunning = false;
let promoCodes = [];
let popularWords = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enableSelection") {
    enableSelectionMode();
  } else if (message.action === "enableApplyButtonSelection") {
    enableApplyButtonSelectionMode();
  } else if (message.action === "enablePriceFieldSelection") {
    enablePriceFieldSelectionMode();
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

  disableApplyButtonSelectionMode();
}

function selectPriceFieldElement(event) {
  if (!isPriceFieldSelectionEnabled) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;

  priceField = element;

  element.style.outline = "2px dashed green";

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

function startAutomation(
  interval = 100,
  applyTimeout = 100,
  length = 6,
  usePopularWords = true,
  useSpecialCharacters = false
) {
  if (!selectedElement || !applyButton || !priceField) {
    alert(
      "Please select an input field, an apply button, and a price field before starting the automation."
    );
    return;
  }

  if (promoCodes.length === 0) {
    alert("No promo codes found.");
    return;
  }

  let originalPrice = priceField.textContent.trim();
  let index = 0;
  automationRunning = true;

  const automationInterval = setInterval(() => {
    if (!automationRunning) {
      clearInterval(automationInterval);
      return;
    }

    let currentCode;
    if (index < promoCodes.length) {
      currentCode = promoCodes[index];
    } else {
      currentCode = generatePromoCodes(
        length,
        usePopularWords,
        useSpecialCharacters,
        popularWords
      );
    }

    setNewPromoCode(currentCode);
    applyButton.click();

    setTimeout(() => {
      const currentPrice = priceField.textContent.trim();
      if (currentPrice !== originalPrice) {
        automationRunning = false;
        clearInterval(automationInterval);
        alert("Promo code applied successfully.");
      } else {
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

function generatePromoCodes(
  length,
  usePopularWords,
  useSpecialCharacters,
  popularWordsJson = []
) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const specials = "!@#$%^&*";

  let generatedCode = "";

  if (usePopularWords) {
    // Check if popular words are provided
    if (popularWordsJson.length === 0) {
      return;
    }

    // Select a random popular word from the provided list
    const word =
      popularWordsJson[Math.floor(Math.random() * popularWordsJson.length)];
    // Generate a number divisible by 5 between 5 and 90 and add it before or after the word
    const multiplesOfFive = Array.from(
      { length: 90 / 5 },
      (_, i) => (i + 1) * 5
    ); // [5, 10, 15, ..., 90]
    const randomDigit =
      multiplesOfFive[Math.floor(Math.random() * multiplesOfFive.length)];
    const position = Math.random() < 0.5 ? "before" : "after";

    if (position === "before") {
      generatedCode = randomDigit + word;
    } else {
      generatedCode = word + randomDigit;
    }
    // Fill the rest of the code with letters if necessary
    while (generatedCode.length < length) {
      generatedCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
  } else {
    // Generate a random string of specified length with or without special characters
    const allCharacters = useSpecialCharacters
      ? characters + specials
      : characters;
    for (let i = 0; i < length; i++) {
      generatedCode += allCharacters.charAt(
        Math.floor(Math.random() * allCharacters.length)
      );
    }
  }

  return generatedCode;
}

function setNewPromoCode(promoCode) {
  selectedElement.value = promoCode;
  selectedElement.dispatchEvent(new Event("input", { bubbles: true }));
}

// Load promo codes and popular words once at initialization
loadInitialData();
