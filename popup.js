// Data Entry Pro - Popup Controller

document.addEventListener('DOMContentLoaded', () => {
  const indicesInput = document.getElementById('indicesInput');
  const runAllBtn = document.getElementById('runAllBtn');
  const runDropdownsBtn = document.getElementById('runDropdownsBtn');
  const runChecklistBtn = document.getElementById('runChecklistBtn');
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved indices from chrome.storage
  chrome.storage?.local?.get(['targetIndices'], (res) => {
    if (res && res.targetIndices) {
      indicesInput.value = res.targetIndices;
    }
  });

  // Helper to parse comma-separated numbers into array of integers
  function parseIndices(str) {
    return str
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  }

  function showStatus(title, message, isSuccess = true) {
    statusBox.classList.remove('hidden');
    statusBox.className = `status-box ${isSuccess ? 'success' : ''}`;
    statusTitle.textContent = title;
    statusMessage.innerHTML = message;
  }

  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
  }

  // Unified Run (Dropdowns + Radio Buttons)
  runAllBtn.addEventListener('click', async () => {
    const rawVal = indicesInput.value;
    const indices = parseIndices(rawVal);
    chrome.storage?.local?.set({ targetIndices: rawVal });

    const tabId = await getActiveTabId();
    if (!tabId) {
      showStatus('Error', 'No active browser tab found.', false);
      return;
    }

    showStatus('Processing', 'Executing unified form automation...', true);

    chrome.tabs.sendMessage(tabId, { action: 'RUN_AUTOMATION', config: { indices } }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Connection Failed', `Could not connect to page. Refresh the portal tab and try again. (${chrome.runtime.lastError.message})`, false);
        return;
      }

      if (res && res.status === 'COMPLETED') {
        const { dropdownTask, checklistTask } = res.summary;
        const msg = `
          <strong>Dropdowns:</strong> Approved ${dropdownTask.approvedCount} / ${dropdownTask.totalTargeted} targeted rows.<br>
          <strong>Checklist:</strong> Set ${checklistTask.checkedCount} / ${checklistTask.expected} "Yes" evaluation rows.
        `;
        showStatus('Automation Complete', msg, true);
      } else {
        showStatus('Error', res?.error || 'Unknown error occurred.', false);
      }
    });
  });

  // Dropdowns only
  runDropdownsBtn.addEventListener('click', async () => {
    const rawVal = indicesInput.value;
    const indices = parseIndices(rawVal);
    chrome.storage?.local?.set({ targetIndices: rawVal });

    const tabId = await getActiveTabId();
    if (!tabId) return;

    showStatus('Processing', 'Approving selected table rows...', true);

    chrome.tabs.sendMessage(tabId, { action: 'APPROVE_TABLE_ITEMS', indices }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Success', `Approved ${res.result.approvedCount} of ${res.result.totalTargeted} targeted rows.`, true);
      }
    });
  });

  // Checklist only
  runChecklistBtn.addEventListener('click', async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return;

    showStatus('Processing', 'Selecting Yes on 3 evaluation checklist rows...', true);

    chrome.tabs.sendMessage(tabId, { action: 'CHECK_YES_RADIOS' }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Success', `Selected "Yes" for ${res.result.checkedCount} checklist rows.`, true);
      }
    });
  });
});
