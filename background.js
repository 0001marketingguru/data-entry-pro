// Data Entry Pro v1.2.0 - Background Service Worker with Zero-Click Auto-Reload Watcher

let currentSignalTimestamp = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Data Entry Pro] Background service worker initialized.');
  initSignalTimestamp();
});

// Initialize and track the reload signal timestamp
async function initSignalTimestamp() {
  try {
    const res = await fetch(chrome.runtime.getURL('reload_signal.json') + '?_t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      currentSignalTimestamp = data.timestamp;
      console.log('[Data Entry Pro] Auto-reload watcher active. Baseline timestamp:', currentSignalTimestamp);
    }
  } catch (e) {
    // Ignore initial fetch errors if file is temporarily locked
  }
}
initSignalTimestamp();

// Periodically check reload_signal.json every 3 seconds for update.bat / rollback.bat triggers
async function checkReloadSignal() {
  try {
    const res = await fetch(chrome.runtime.getURL('reload_signal.json') + '?_t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (currentSignalTimestamp !== null && data.timestamp && data.timestamp !== currentSignalTimestamp) {
        console.log('[Data Entry Pro] ⚡ New disk update detected via reload_signal.json! Auto-reloading extension...');
        currentSignalTimestamp = data.timestamp;
        
        // Zero-click instant reload
        chrome.runtime.reload();
      } else if (currentSignalTimestamp === null) {
        currentSignalTimestamp = data.timestamp;
      }
    }
  } catch (e) {
    // Ignore fetch errors during file write
  }
}

setInterval(checkReloadSignal, 3000);

// Global keyboard shortcut listener (Alt+Shift+D)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'trigger_automation') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'RUN_AUTOMATION' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[Data Entry Pro] Content script not active on tab:', chrome.runtime.lastError.message);
        } else {
          console.log('[Data Entry Pro] Shortcut executed automation successfully:', response);
        }
      });
    }
  }
});
