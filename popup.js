// Data Entry Pro v1.4.0 - Popup Controller with Advanced Remarks & Dynamic Island HUD

document.addEventListener('DOMContentLoaded', async () => {
  const CURRENT_VERSION = 'v1.4.0';
  const GITHUB_REPO = '0001marketingguru/data-entry-pro';

  const detectionBox = document.getElementById('detectionBox');
  const detectionText = document.getElementById('detectionText');
  const updateBanner = document.getElementById('updateBanner');
  const updateText = document.getElementById('updateText');
  const updateLink = document.getElementById('updateLink');
  const approveAllUnifiedBtn = document.getElementById('approveAllUnifiedBtn');
  const approveAllUnifiedLabel = document.getElementById('approveAllUnifiedLabel');
  const approveTableOnlyBtn = document.getElementById('approveTableOnlyBtn');
  const approveTableOnlyLabel = document.getElementById('approveTableOnlyLabel');
  const checkRadiosOnlyBtn = document.getElementById('checkRadiosOnlyBtn');
  const toggleHudBtn = document.getElementById('toggleHudBtn');
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

  // 1. Live GitHub Version Checker
  async function checkForUpdates() {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!res.ok) return;

      const data = await res.json();
      const latestTag = data.tag_name;

      if (latestTag && latestTag !== CURRENT_VERSION) {
        updateText.textContent = `New Update ${latestTag} Available!`;
        updateLink.href = data.html_url || `https://github.com/${GITHUB_REPO}/releases`;
        updateBanner.classList.remove('hidden');
      }
    } catch (e) {
      console.debug('[Data Entry Pro] Update check skipped.');
    }
  }
  checkForUpdates();

  // 2. Initial Page Scan: Query active tab for table info
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
        approveAllUnifiedLabel.textContent = `Full Auto-Approve (${detectedRowCount} Rows + Checklist + Case Action)`;
        approveTableOnlyLabel.textContent = `Approve Table Only (${detectedRowCount})`;
      } else {
        detectionText.textContent = 'No claim rows detected on this page.';
      }
    });
  }

  // 3. Approve ALL Unified (All 4 Tiers)
  approveAllUnifiedBtn.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) {
      showStatus('Error', 'No active browser tab found.', false);
      return;
    }

    showStatus('Processing', 'Executing full 4-Tier approval across table, checklist, case action & remarks...', true);

    chrome.tabs.sendMessage(activeTabId, { action: 'RUN_AUTOMATION', config: { indices: 'ALL' } }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('Connection Failed', `Please refresh the claims portal tab and try again. (${chrome.runtime.lastError.message})`, false);
        return;
      }

      if (res && res.status === 'COMPLETED') {
        const { tier1_tableResult, tier2_radioResult, tier3_caseAction, tier4_remarks } = res.summary;
        const msg = `
          <strong>1. Table Rows:</strong> Set <strong>${tier1_tableResult.approvedCount} of ${tier1_tableResult.totalTargeted}</strong> rows to "Approve".<br>
          <strong>2. Checklist:</strong> Checked "Yes" on <strong>${tier2_radioResult.checkedCount} of 3</strong> evaluation questions.<br>
          <strong>3. Case Action*:</strong> Set to <strong>"${tier3_caseAction?.log?.finalText || 'Approve'}"</strong> ✅<br>
          <strong>4. Remarks [${tier4_remarks.mode}]:</strong> ${tier4_remarks.text || 'Populated standard remark.'}
        `;
        showStatus('Full Approval Finished', msg, res.summary.overallSuccess);
        detectionText.innerHTML = `<strong>${tier1_tableResult.approvedCount}/${tier1_tableResult.totalTargeted} Rows Approved ✅</strong>`;
      } else {
        showStatus('Error', res?.error || 'Unknown error occurred.', false);
      }
    });
  });

  // 4. Approve Table Only
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

  // 5. Check Radios Only
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

  // 6. Toggle HUD Button
  toggleHudBtn?.addEventListener('click', async () => {
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    chrome.tabs.sendMessage(activeTabId, { action: 'TOGGLE_HUD' }, (res) => {
      if (chrome.runtime.lastError) {
        showStatus('HUD Toggle', 'Please refresh the case tab to activate HUD.', false);
        return;
      }
      if (res?.status === 'COMPLETED') {
        showStatus('HUD Updated', `Auditor HUD is now ${res.visible ? 'Visible' : 'Hidden'}. (Shortcut: Alt+H)`, true);
      }
    });
  });

  // 7. Custom Indices Run
  approveCustomBtn.addEventListener('click', async () => {
    const val = indicesInput.value.trim();
    const indices = parseIndices(val);
    const activeTabId = await getActiveTabId();
    if (!activeTabId) return;

    if (indices.length === 0) {
      showStatus('Note', 'No specific row numbers entered. Triggering Full Auto-Approve instead.', true);
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

  // 8. Copy Diagnostic Log to Clipboard
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
    const formattedText = `### 📋 Data Entry Pro Diagnostic Log\n**Timestamp:** ${report.timestamp}\n**Overall Success:** ${report.overallSuccess}\n**Tier 1 (Table):** ${report.tier1_tableResult?.approvedCount}/${report.tier1_tableResult?.totalTargeted}\n**Tier 2 (Checklist):** ${report.tier2_radioResult?.checkedCount}/3\n**Tier 3 (Case Action):** ${report.tier3_caseAction?.log?.finalText || report.tier3_caseAction?.log?.status}\n**Tier 4 (Remarks [${report.tier4_remarks?.mode || 'AUTO'}]):** ${report.tier4_remarks?.text}\n\n\`\`\`json\n${jsonReport}\n\`\`\``;

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
