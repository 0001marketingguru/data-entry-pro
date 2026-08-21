// Data Entry Pro v1.5.0 - Popup Controller with Audit Command Center & Multi-Modal Exporter

document.addEventListener('DOMContentLoaded', async () => {
  const CURRENT_VERSION = 'v1.5.0';
  const GITHUB_REPO = '0001marketingguru/data-entry-pro';

  // DOM Elements
  const updateBanner = document.getElementById('updateBanner');
  const updateText = document.getElementById('updateText');
  const updateLink = document.getElementById('updateLink');
  
  // KPI Elements
  const kpiClaimsCount = document.getElementById('kpiClaimsCount');
  const kpiTotalValue = document.getElementById('kpiTotalValue');
  const kpiTotalDeductions = document.getElementById('kpiTotalDeductions');
  const kpiAvgSpeed = document.getElementById('kpiAvgSpeed');

  // Actions
  const approveAllUnifiedBtn = document.getElementById('approveAllUnifiedBtn');
  const approveAllUnifiedLabel = document.getElementById('approveAllUnifiedLabel');
  const approveTableOnlyBtn = document.getElementById('approveTableOnlyBtn');
  const approveTableOnlyLabel = document.getElementById('approveTableOnlyLabel');
  const checkRadiosOnlyBtn = document.getElementById('checkRadiosOnlyBtn');
  const toggleHudBtn = document.getElementById('toggleHudBtn');
  const indicesInput = document.getElementById('indicesInput');
  const approveCustomBtn = document.getElementById('approveCustomBtn');

  // Export Hub Elements
  const downloadTodayCsvBtn = document.getElementById('downloadTodayCsvBtn');
  const copyWhatsAppSummaryBtn = document.getElementById('copyWhatsAppSummaryBtn');
  const downloadAllHistoryCsvBtn = document.getElementById('downloadAllHistoryCsvBtn');
  const clearTodayLogBtn = document.getElementById('clearTodayLogBtn');

  // Search & Recent Feed
  const searchLogInput = document.getElementById('searchLogInput');
  const recentClaimsList = document.getElementById('recentClaimsList');
  const logCountBadge = document.getElementById('logCountBadge');

  // Status & Diagnostics
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const copyDiagnosticBtn = document.getElementById('copyDiagnosticBtn');
  const copySuccessMsg = document.getElementById('copySuccessMsg');

  let todayRecords = [];
  let allVaultData = {};

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

  // =========================================================================
  // 1. Live Audit Vault Loader & KPI Calculator
  // =========================================================================
  function loadAuditVaultData() {
    const todayKey = new Date().toISOString().slice(0, 10);
    
    chrome.storage?.local?.get(['data_entry_pro_audit_vault'], (res) => {
      allVaultData = res?.data_entry_pro_audit_vault || {};
      todayRecords = allVaultData[todayKey] || [];

      // Calculate Today's KPIs
      const count = todayRecords.length;
      let totalClaimed = 0;
      let totalApproved = 0;
      let totalDeductions = 0;
      let totalSeconds = 0;

      todayRecords.forEach(r => {
        const c = parseFloat((r.claimedAmount || '0').replace(/,/g, '')) || 0;
        const a = parseFloat((r.approvedAmount || '0').replace(/,/g, '')) || 0;
        const d = parseFloat((r.deductionDelta || '0').replace(/,/g, '')) || Math.max(0, c - a);
        const s = parseInt(r.timeSpentSeconds, 10) || 15;

        totalClaimed += c;
        totalApproved += a;
        totalDeductions += d;
        totalSeconds += s;
      });

      const avgSeconds = count > 0 ? Math.round(totalSeconds / count) : 0;

      if (kpiClaimsCount) kpiClaimsCount.innerText = `${count}`;
      if (kpiTotalValue) kpiTotalValue.innerText = `₹ ${totalApproved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (kpiTotalDeductions) kpiTotalDeductions.innerText = `₹ ${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (kpiAvgSpeed) kpiAvgSpeed.innerText = `${avgSeconds}s/case`;
      if (logCountBadge) logCountBadge.innerText = `${count}`;

      renderRecentClaimsList(todayRecords);
    });
  }

  // =========================================================================
  // 2. Render Searchable Recent Claims Feed
  // =========================================================================
  function renderRecentClaimsList(records, filterQuery = '') {
    if (!recentClaimsList) return;

    let filtered = records;
    if (filterQuery.trim() !== '') {
      const q = filterQuery.toLowerCase();
      filtered = records.filter(r => 
        (r.caseId || '').toLowerCase().includes(q) || 
        (r.remarks || '').toLowerCase().includes(q) ||
        (r.decision || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      recentClaimsList.innerHTML = `<div class="empty-log-msg">${filterQuery ? 'No matching claims found.' : 'No claims processed today yet.'}</div>`;
      return;
    }

    recentClaimsList.innerHTML = filtered.map(r => {
      const statusClass = (r.status || 'approved').toLowerCase();
      return `
        <div class="claim-log-item">
          <div class="claim-log-id" title="${r.caseId}">
            <span>${r.timeFormatted || ''}</span> • <strong>${r.caseId}</strong>
          </div>
          <div class="claim-log-details">
            <span class="claim-log-val">₹ ${r.approvedAmount || '0'}</span>
            <span class="claim-log-status ${statusClass}">${r.decision || r.status || 'DONE'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  searchLogInput?.addEventListener('input', (e) => {
    renderRecentClaimsList(todayRecords, e.target.value);
  });

  // =========================================================================
  // 3. RFC-4180 CSV Exporter (with UTF-8 Byte Order Mark for Excel)
  // =========================================================================
  function exportRecordsToCsv(records, filename = 'Claims_Report.csv') {
    if (!records || records.length === 0) {
      showStatus('Export Error', 'No claims records found to export.', false);
      return;
    }

    const headers = [
      'S.No',
      'Date',
      'Time',
      'Case / Claim ID',
      'Claimed Amount (INR)',
      'Approved Amount (INR)',
      'Deductions (INR)',
      'Decision',
      'Remarks Mode',
      'Item Count',
      'Time Spent (Sec)',
      'Final Remarks Submitted',
      'Status'
    ];

    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`;

    const rows = records.map((r, idx) => [
      idx + 1,
      escapeCsv(r.date),
      escapeCsv(r.timeFormatted),
      escapeCsv(r.caseId),
      escapeCsv(r.claimedAmount),
      escapeCsv(r.approvedAmount),
      escapeCsv(r.deductionDelta),
      escapeCsv(r.decision),
      escapeCsv(r.mode),
      r.totalItems || 1,
      r.timeSpentSeconds || 0,
      escapeCsv(r.remarks),
      escapeCsv(r.status)
    ].join(','));

    // UTF-8 BOM (\uFEFF) ensures Excel reads Indian Rupee symbols & formatting perfectly
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showStatus('Export Successful', `Downloaded <strong>${records.length} claim records</strong> as ${filename}!`, true);
  }

  // 1-Click Download Today's CSV
  downloadTodayCsvBtn?.addEventListener('click', () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    exportRecordsToCsv(todayRecords, `Claims_Audit_Report_${todayKey}.csv`);
  });

  // Export Full History (All Days)
  downloadAllHistoryCsvBtn?.addEventListener('click', () => {
    let allRecords = [];
    Object.keys(allVaultData).sort().reverse().forEach(k => {
      allRecords = allRecords.concat(allVaultData[k] || []);
    });
    exportRecordsToCsv(allRecords, `Claims_Audit_Full_History.csv`);
  });

  // =========================================================================
  // 4. 1-Click WhatsApp / Slack Executive Summary Generator
  // =========================================================================
  copyWhatsAppSummaryBtn?.addEventListener('click', () => {
    const todayKey = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const count = todayRecords.length;

    if (count === 0) {
      showStatus('Note', 'No claims logged today yet. Process a claim to generate report.', false);
      return;
    }

    let totalClaimed = 0;
    let totalApproved = 0;
    let totalDeductions = 0;
    let approvedCount = 0;
    let queryCount = 0;

    todayRecords.forEach(r => {
      const c = parseFloat((r.claimedAmount || '0').replace(/,/g, '')) || 0;
      const a = parseFloat((r.approvedAmount || '0').replace(/,/g, '')) || 0;
      const d = parseFloat((r.deductionDelta || '0').replace(/,/g, '')) || Math.max(0, c - a);

      totalClaimed += c;
      totalApproved += a;
      totalDeductions += d;

      if ((r.decision || '').toUpperCase() === 'QUERY' || (r.mode || '').toUpperCase() === 'QUERY') {
        queryCount++;
      } else {
        approvedCount++;
      }
    });

    const summaryText = `📊 *CLAIMS AUDIT DAILY PERFORMANCE — ${todayKey}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Total Claims Processed:*  ${count} Claims
💰 *Total Claimed Value:*     ₹ ${totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
💎 *Total Evaluated Value:*   ₹ ${totalApproved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
⚖️ *Total Deductions:*        ₹ ${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 🟢 *Approved:* ${approvedCount} Claims
• 🟡 *Queried:*  ${queryCount} Claims
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Generated via Data Entry Pro Enterprise_`;

    navigator.clipboard.writeText(summaryText).then(() => {
      showStatus('Summary Copied! 📱', 'Shift executive summary copied to clipboard! Paste directly into WhatsApp or Slack.', true);
    });
  });

  // Reset Today's Log
  clearTodayLogBtn?.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset today's log? (Export your CSV first!)")) {
      const todayKey = new Date().toISOString().slice(0, 10);
      delete allVaultData[todayKey];
      chrome.storage?.local?.set({ data_entry_pro_audit_vault: allVaultData }, () => {
        loadAuditVaultData();
        showStatus('Log Cleared', "Today's logs have been reset.", true);
      });
    }
  });

  // =========================================================================
  // 5. GitHub Release Checker
  // =========================================================================
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

  // =========================================================================
  // 6. Automation Triggers
  // =========================================================================
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
        loadAuditVaultData();
      } else {
        showStatus('Error', res?.error || 'Unknown error occurred.', false);
      }
    });
  });

  // Table Only
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

  // Radios Only
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

  // Toggle HUD Button
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

  // Custom Indices Run
  approveCustomBtn?.addEventListener('click', async () => {
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

  // Copy Diagnostic Log to Clipboard
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
    const formattedText = `### 📋 Data Entry Pro Diagnostic Log\n**Timestamp:** ${report.timestamp}\n**Overall Success:** ${report.overallSuccess}\n**Case ID:** ${report.caseId || 'N/A'}\n**Tier 1 (Table):** ${report.tier1_tableResult?.approvedCount}/${report.tier1_tableResult?.totalTargeted}\n**Tier 2 (Checklist):** ${report.tier2_radioResult?.checkedCount}/3\n**Tier 3 (Case Action):** ${report.tier3_caseAction?.log?.finalText || report.tier3_caseAction?.log?.status}\n**Tier 4 (Remarks [${report.tier4_remarks?.mode || 'AUTO'}]):** ${report.tier4_remarks?.text}\n\n\`\`\`json\n${jsonReport}\n\`\`\``;

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

  // Initialize
  loadAuditVaultData();
});
