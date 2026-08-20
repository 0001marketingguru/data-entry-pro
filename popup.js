// Data Entry Pro v1.1.0 - Popup Controller

document.addEventListener('DOMContentLoaded', async () => {
  const detectionBox = document.getElementById('detectionBox');
  const detectionText = document.getElementById('detectionText');
  const approveAllUnifiedBtn = document.getElementById('approveAllUnifiedBtn');
  const approveAllUnifiedLabel = document.getElementById('approveAllUnifiedLabel');
  const approveTableOnlyBtn = document.getElementById('approveTableOnlyBtn');
  const approveTableOnlyLabel = document.getElementById('approveTableOnlyLabel');
  const checkRadiosOnlyBtn = document.getElementById('checkRadiosOnlyBtn');
  const indicesInput = document.getElementById('indicesInput');
  const approveCustomBtn = document.getElementById('approveCustomBtn');
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');

  let detectedRowCount = 0;

  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
  }

  function showStatus(title, message, isSuccess = true) {
    statusBox.classList.remove('hidden');
    statusBox.className = `status-box ${isSuccess ? 'success' : ''}`;
    statusTitle.textContent = title;
    statusMessage.innerHTML = message;
  }

  function parseIndices(str) {
    return str
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
  }

  // 1. Initial Page Scan: Query active tab for table info
  const tabId = await getActiveTabId();
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'GET_TABLE_INFO' }, (res) => {
      if (chrome.runtime.lastError || !res || res.status !== 'COMPLETED') {
        detectionText.textContent = 'Claims table ready (Auto-detection active)';
        return;
      }

      const info = res.info;
      detectedRowCount = info.totalRows;

      if (detectedRowCount > 0) {
        const approvedText = info.approvedCount > 0 ? ` (${info.approvedCount} approved, ${info.pendingCount} pending)` : '';
        detectionText.innerHTML = `<strong>${detectedRowCount} Claim Rows Found</strong>${approvedText}`;
        approveAllUnifiedLabel.textContent = `Approve All ${detectedRowCount} Rows & Checklist`;
        approveTableOnlyLabel.textContent = `Approve Table Only (${detectedRowCount})`;
      } else {
        detectionText.textContent = 'No claim rows detected on this page.';
      }
    });
  }

  // 2. Approve ALL Unified (Table + Checklist)
  approveAllUnifiedBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) {
      showStatus('Error', 'No active browser tab found.', false);
      return;
    }

    showStatus('Processing', 'Approving all detected table rows & 3 checklist radios...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'RUN_AUTOMATION', config: { indices: 'ALL' } }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Connection Failed', `Please refresh the claims portal tab and try again. (${chrome.runtime.lastError.message})`, false);
        return;
      }

      if (res && res.status === 'COMPLETED') {
        const { dropdownTask, checklistTask } = res.summary;
        const msg = `
          <strong>Dropdowns:</strong> Set <strong>${dropdownTask.approvedCount} of ${dropdownTask.totalTargeted}</strong> rows to "Approve".<br>
          <strong>Checklist:</strong> Selected "Yes" on <strong>${checklistTask.checkedCount} of ${checklistTask.expected}</strong> evaluation items.
        `;
        showStatus('All Rows Approved ✅', msg, true);
        
        // Refresh table info
        detectionText.innerHTML = `<strong>${dropdownTask.approvedCount} Rows Approved ✅</strong>`;
      } else {
        showStatus('Error', res?.error || 'Unknown error occurred.', false);
      }
    });
  });

  // 3. Approve Table Only
  approveTableOnlyBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    showStatus('Processing', 'Approving all table rows...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'APPROVE_ALL_ROWS' }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Table Approved', `Successfully approved ${res.result.approvedCount} of ${res.result.totalTargeted} rows.`, true);
      }
    });
  });

  // 4. Check Radios Only
  checkRadiosOnlyBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    showStatus('Processing', 'Setting 3 evaluation checklist items to Yes...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'CHECK_YES_RADIOS' }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Checklist Updated', `Selected "Yes" for ${res.result.checkedCount} evaluation rows.`, true);
      }
    });
  });

  // 5. Custom Indices Run
  approveCustomBtn.addEventListener('click', async () => {
    const val = indicesInput.value.trim();
    const indices = parseIndices(val);
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    if (indices.length === 0) {
      showStatus('Note', 'No specific row numbers entered. Triggering Approve All instead.', true);
      approveAllUnifiedBtn.click();
      return;
    }

    showStatus('Processing', `Approving custom rows: ${indices.join(', ')}...`, true);

    chrome.tabs.sendMessage(activeTabId, { action: 'APPROVE_CUSTOM_ROWS', indices }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Success', `Approved ${res.result.approvedCount} of ${res.result.totalTargeted} targeted rows.`, true);
      }
    });
  });
});
