// Data Entry Pro v1.1.3 - Popup Controller

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
  const copyDiagnosticBtn = document.getElementById('copyDiagnosticBtn');
  const copySuccessMsg = document.getElementById('copySuccessMsg');

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

    showStatus('Processing', 'Executing sequential approvals across all rows...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'RUN_AUTOMATION', config: { indices: 'ALL' } }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Connection Failed', `Please refresh the claims portal tab and try again. (${chrome.runtime.lastError.message})`, false);
        return;
      }

      if (res && res.status === 'COMPLETED') {
        const { tableResult, radioResult } = res.summary;
        const msg = `
          <strong>Dropdowns:</strong> Set <strong>${tableResult.approvedCount} of ${tableResult.totalTargeted}</strong> rows to "Approve".<br>
          <strong>Checklist:</strong> Selected "Yes" on <strong>${radioResult.checkedCount} of ${radioResult.expected}</strong> evaluation items.
        `;
        showStatus('Batch Execution Finished', msg, tableResult.success);
        
        // Refresh table info
        detectionText.innerHTML = `<strong>${tableResult.approvedCount}/${tableResult.totalTargeted} Rows Approved ✅</strong>`;
      } else {
        showStatus('Error', res?.error || 'Unknown error occurred.', false);
      }
    });
  });

  // 3. Approve Table Only
  approveTableOnlyBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    showStatus('Processing', 'Approving all table rows sequentially...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'APPROVE_ALL_ROWS' }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Error', chrome.runtime.lastError.message, false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('Table Approved', `Successfully approved ${res.result.approvedCount} of ${res.result.totalTargeted} rows.`, res.result.success);
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
        showStatus('Checklist Updated', `Selected "Yes" for ${res.result.checkedCount} evaluation rows.`, res.result.success);
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
        showStatus('Success', `Approved ${res.result.approvedCount} of ${res.result.totalTargeted} targeted rows.`, res.result.success);
      }
    });
  });

  // 6. Copy Diagnostic Log to Clipboard for Testers & AI
  copyDiagnosticBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    chrome.tabs.sendMessage(activeTabId, { action: 'GET_DIAGNOSTIC_LOG' }, (res) => {
      let reportData = res?.report;
      
      if (!reportData) {
        chrome.storage?.local?.get(['lastDiagnosticReport'], (st) => {
          reportData = st?.lastDiagnosticReport;
          writeReportToClipboard(reportData);
        });
      } else {
        writeReportToClipboard(reportData);
      }
    });
  });

  function writeReportToClipboard(report) {
    if (!report) {
      navigator.clipboard.writeText("No diagnostic run logged yet. Please trigger an automation run first.");
      showCopySuccess("No run log yet (copied note)");
      return;
    }

    const jsonReport = JSON.stringify(report, null, 2);
    const formattedText = `### 📋 Data Entry Pro Diagnostic Log\n**Timestamp:** ${report.timestamp}\n**Overall Success:** ${report.overallSuccess}\n**Dropdowns Approved:** ${report.tableResult?.approvedCount}/${report.tableResult?.totalTargeted}\n\n\`\`\`json\n${jsonReport}\n\`\`\``;

    navigator.clipboard.writeText(formattedText).then(() => {
      showCopySuccess("Diagnostic log copied! Paste in chat.");
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  }

  function showCopySuccess(msg = "Copied to clipboard!") {
    copySuccessMsg.textContent = msg;
    copySuccessMsg.classList.remove('hidden');
    setTimeout(() => {
      copySuccessMsg.classList.add('hidden');
    }, 3000);
  }
});
