// Data Entry Pro - Background Service Worker (MV3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Data Entry Pro] Extension installed successfully.');
});

// Listen for global keyboard shortcuts (defined in manifest.json commands)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'trigger_automation') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'RUN_AUTOMATION' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[Data Entry Pro] Content script not active on this tab:', chrome.runtime.lastError.message);
        } else {
          console.log('[Data Entry Pro] Shortcut triggered automation successfully:', response);
        }
      });
    }
  }
});
