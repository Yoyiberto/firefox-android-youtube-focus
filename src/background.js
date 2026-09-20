// Background script for Firefox Android extension
console.log("[Android Extension] Background script loaded");

browser.runtime.onInstalled.addListener((details) => {
  console.log("[Android Extension] Installed/Updated:", details.reason);
});

// Listen for messages from popup or content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Android Extension] Received message:", request);
  if (request.action === "ping") {
    sendResponse({ status: "pong", timestamp: Date.now() });
  }
  return true;
});
