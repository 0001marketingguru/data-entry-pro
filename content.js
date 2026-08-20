/**
 * Data Entry Pro v1.1.3 - Enterprise Claims UI Automation Content Script
 * 
 * Specifically optimized for PMJAY Payer "Actionable details" table:
 * - Robust sequential row loop with dynamic React-Select menu polling & keyboard fallback
 * - Full detailed diagnostic logger with 1-click clipboard export
 * - Disambiguates between static summary table and interactive Actionable Grid
 * - Selects "Yes" on all 3 standard medical evaluation checklist rows
 */

(function () {
  'use strict';

  // Global Diagnostic History store
  window.__DATA_ENTRY_PRO_LOGS__ = window.__DATA_ENTRY_PRO_LOGS__ || [];

  // =========================================================================
  // --- Section 1: UI Feedback Utilities (Toast & Row Highlight) ---
  // =========================================================================

  function showOnScreenNotification(title, message, isSuccess = true) {
    const existing = document.getElementById('data-entry-pro-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'data-entry-pro-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: ${isSuccess ? '#064e3b' : '#7f1d1d'};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      max-width: 400px;
      border: 1px solid ${isSuccess ? '#059669' : '#dc2626'};
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: translateY(0);
      opacity: 1;
    `;

    toast.innerHTML = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
        <span>⚡</span> ${title}
      </div>
      <div style="color: #e2e8f0; font-size: 12px;">${message}</div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }

  function highlightElement(el) {
    if (!el) return;
    const prevTransition = el.style.transition;
    const prevBg = el.style.backgroundColor;
    el.style.transition = 'background-color 0.4s ease';
    el.style.backgroundColor = 'rgba(16, 185, 129, 0.22)';
    setTimeout(() => {
      el.style.backgroundColor = prevBg;
      el.style.transition = prevTransition;
    }, 2200);
  }

  // =========================================================================
  // --- Section 2: Framework Event Dispatchers ---
  // =========================================================================

  function dispatchFrameworkValueChange(element, value) {
    if (!element) return;
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    
    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  function dispatchFrameworkRadioClick(radioInput) {
    if (!radioInput) return;
    const checkedSetter = Object.getOwnPropertyDescriptor(radioInput, 'checked')?.set;
    const prototype = Object.getPrototypeOf(radioInput);
    const prototypeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, 'checked')?.set;

    if (prototypeCheckedSetter && checkedSetter !== prototypeCheckedSetter) {
      prototypeCheckedSetter.call(radioInput, true);
    } else if (checkedSetter) {
      checkedSetter.call(radioInput, true);
    } else {
      radioInput.checked = true;
    }

    radioInput.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    radioInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  // =========================================================================
  // --- Section 3: Semantic Table & Action Column Finder ---
  // =========================================================================

  function getActionableTableContext() {
    const candidateTables = Array.from(document.querySelectorAll('table'));
    let targetTable = null;
    let actionColIndex = -1;
    let targetRows = [];

    // Priority 1: Find table with interactive dropdown controls or inputs
    for (const table of candidateTables) {
      const hasInteractiveControls = table.querySelector('.css-1nxbv4n-control, [class*="-control"], [class*="react-select"], select, [role="combobox"]');
      if (hasInteractiveControls) {
        const ths = Array.from(table.querySelectorAll('thead th, th'));
        ths.forEach((th, idx) => {
          const thText = (th.innerText || th.textContent || '').trim().toLowerCase();
          if (thText === 'action' || thText.includes('action')) {
            actionColIndex = idx;
          }
        });

        targetTable = table;
        targetRows = Array.from(table.querySelectorAll('tbody tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 4);
        break;
      }
    }

    // Priority 2: Look under section with heading "Actionable details"
    if (targetRows.length === 0) {
      const headings = Array.from(document.querySelectorAll('div, h2, h3, h4, span, p'));
      const actionHeading = headings.find(el => el.textContent.trim().toLowerCase() === 'actionable details');
      if (actionHeading) {
        const section = actionHeading.closest('.row, .col-lg-12, div')?.parentElement || actionHeading.parentElement;
        const tables = Array.from(section?.querySelectorAll('table') || []);
        for (const t of tables) {
          const rows = Array.from(t.querySelectorAll('tbody tr, tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 4);
          if (rows.length > 0) {
            targetTable = t;
            targetRows = rows;
            break;
          }
        }
      }
    }

    return {
      table: targetTable,
      actionColIndex,
      rows: targetRows
    };
  }

  function scanTableInfo() {
    const { rows, actionColIndex } = getActionableTableContext();
    
    const rowDetails = rows.map((row, idx) => {
      const tds = Array.from(row.querySelectorAll('td'));
      const rowNo = tds[0]?.innerText?.trim() || `${idx + 1}`;
      const code = tds[1]?.innerText?.trim() || `Item ${idx + 1}`;
      
      let actionCell = actionColIndex >= 0 && tds[actionColIndex] ? tds[actionColIndex] : null;
      if (!actionCell) {
        actionCell = tds.find(td => td.querySelector('select, [class*="-control"], [class*="react-select"], [role="combobox"]')) || tds[tds.length - 4];
      }

      const selectText = actionCell?.querySelector('select')?.selectedOptions?.[0]?.text || 
                         actionCell?.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue')?.innerText || 
                         actionCell?.querySelector('[class*="-control"]')?.innerText || '';
      
      const cleanText = selectText.trim();
      const isApproved = /^approve[d]?$/i.test(cleanText);

      return {
        index: idx + 1,
        rowNo,
        code,
        isApproved,
        currentAction: cleanText || 'Select'
      };
    });

    return {
      totalRows: rows.length,
      rows: rowDetails,
      approvedCount: rowDetails.filter(r => r.isApproved).length,
      pendingCount: rowDetails.filter(r => !r.isApproved).length
    };
  }

  // =========================================================================
  // --- Section 4: Robust React-Select Setter for a Single Row ---
  // =========================================================================

  /**
   * Automates setting a single React-Select or <select> dropdown to "Approve"
   */
  async function setRowDropdownToApprove(row, rowNum, actionColIndex) {
    const startTime = Date.now();
    const tds = Array.from(row.querySelectorAll('td'));
    const code = tds[1]?.innerText?.trim() || `Row ${rowNum}`;

    let actionCell = actionColIndex >= 0 && tds[actionColIndex] ? tds[actionColIndex] : null;
    if (!actionCell) {
      actionCell = tds.find(td => td.querySelector('select, [class*="-control"], [class*="react-select"], [role="combobox"]')) || row;
    }

    const logEntry = {
      row: rowNum,
      code,
      initialText: (actionCell.innerText || '').trim().replace(/\n/g, ' '),
      method: 'none',
      status: 'pending',
      timeMs: 0
    };

    // Case 1: Standard <select>
    const selectElem = actionCell.querySelector('select') || row.querySelector('select');
    if (selectElem) {
      for (let i = 0; i < selectElem.options.length; i++) {
        const opt = selectElem.options[i];
        const t = (opt.text || opt.innerText || '').trim();
        const v = (opt.value || '').trim();
        if (/^approve[d]?$/i.test(t) || /^approve[d]?$/i.test(v)) {
          selectElem.selectedIndex = i;
          dispatchFrameworkValueChange(selectElem, opt.value);
          logEntry.method = 'standard_select';
          logEntry.status = 'approved';
          logEntry.finalText = t;
          logEntry.timeMs = Date.now() - startTime;
          return { success: true, log: logEntry };
        }
      }
    }

    // Case 2: React-Select Component
    const reactSelectControl = actionCell.querySelector('.css-1nxbv4n-control, [class*="-control"], [class*="react-select"], [role="combobox"]') ||
                               row.querySelector('.css-1nxbv4n-control, [class*="-control"]');
    const comboboxInput = actionCell.querySelector('input[role="combobox"], input[id^="react-select-"], input[type="text"]') ||
                          row.querySelector('input[role="combobox"], input[id^="react-select-"]');
    const hiddenBackingInput = actionCell.querySelector('input[name*="selecthidden"], input[id*="selecthidden"]') ||
                               row.querySelector('input[name*="selecthidden"]');

    if (!reactSelectControl && !comboboxInput) {
      logEntry.status = 'no_control_found';
      logEntry.timeMs = Date.now() - startTime;
      return { success: false, log: logEntry };
    }

    try {
      // Step A: Focus and trigger menu opening
      if (comboboxInput) {
        comboboxInput.focus();
      }

      const clickTarget = reactSelectControl || comboboxInput;
      clickTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      
      clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

      // Also dispatch Down Arrow on input to guarantee dropdown list opens
      if (comboboxInput) {
        comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
      }

      // Step B: Wait for menu portal to appear in DOM (poll up to 250ms)
      let approveOption = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(r => setTimeout(r, 45));

        const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], .select-item, [id*="-option-"], div[id^="react-select-"]'));
        approveOption = menuOptions.find(opt => {
          const t = (opt.innerText || opt.textContent || '').trim().toLowerCase();
          return t === 'approve' || t === 'approved';
        });

        if (approveOption) break;
      }

      // Step C: Click the Approve option if found
      if (approveOption) {
        approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        approveOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        logEntry.method = 'react_select_menu_click';
        logEntry.status = 'approved';
      } else {
        // Step D: Keyboard Fallback (Type "Approve" + Enter)
        if (comboboxInput) {
          comboboxInput.focus();
          dispatchFrameworkValueChange(comboboxInput, 'Approve');
          comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          logEntry.method = 'react_select_keyboard_fallback';
          logEntry.status = 'approved';
        } else {
          logEntry.status = 'menu_option_not_found';
        }
      }

      // Step E: Update hidden backing input
      if (hiddenBackingInput) {
        dispatchFrameworkValueChange(hiddenBackingInput, 'Approve');
      }

      // Wait brief cooldown so React clears the portal before next row
      await new Promise(r => setTimeout(r, 60));

      const finalText = (actionCell.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue')?.innerText || actionCell.innerText || '').trim().replace(/\n/g, ' ');
      logEntry.finalText = finalText;
      logEntry.timeMs = Date.now() - startTime;

      return { success: true, log: logEntry };
    } catch (err) {
      logEntry.status = 'error';
      logEntry.error = err.message;
      logEntry.timeMs = Date.now() - startTime;
      return { success: false, log: logEntry };
    }
  }

  // =========================================================================
  // --- Section 5: Task 1 - Set Action Dropdown to "Approve" (All Rows) ---
  // =========================================================================

  async function approveTableItems(targetIndices = 'ALL') {
    const { rows: targetRows, actionColIndex } = getActionableTableContext();

    if (targetRows.length === 0) {
      return { success: false, message: 'Action table rows not found', approvedCount: 0, totalTargeted: 0, logs: [] };
    }

    let indicesToProcess = [];
    if (targetIndices === 'ALL' || !Array.isArray(targetIndices) || targetIndices.length === 0) {
      indicesToProcess = targetRows.map((_, i) => i + 1);
    } else {
      const minVal = Math.min(...targetIndices);
      indicesToProcess = minVal === 0 ? targetIndices.map(n => n + 1) : targetIndices;
    }

    console.log(`[Data Entry Pro v1.1.3] Sequential approval processing on ${indicesToProcess.length} rows...`);

    let approvedCount = 0;
    const executionLogs = [];

    for (const rowNum of indicesToProcess) {
      const rowIndex = rowNum - 1;
      const row = targetRows[rowIndex];

      if (!row) {
        executionLogs.push({ row: rowNum, status: 'row_index_out_of_bounds' });
        continue;
      }

      highlightElement(row);

      // Execute row approval sequentially
      const { success, log } = await setRowDropdownToApprove(row, rowNum, actionColIndex);
      executionLogs.push(log);
      if (success) approvedCount++;
    }

    return {
      success: approvedCount > 0,
      approvedCount,
      totalTargeted: indicesToProcess.length,
      logs: executionLogs
    };
  }

  // =========================================================================
  // --- Section 6: Task 2 - Standard 3-Row Medical Evaluation Checklist ---
  // =========================================================================

  function checkYesRadioButtons() {
    const checklistSignatures = [
      'diagnosis is supported by evidence',
      'case management is as per',
      'whether duration of treatment matched'
    ];

    let checkedCount = 0;
    const checklistResults = [];
    const allRadioInputs = Array.from(document.querySelectorAll('input[type="radio"]'));

    if (allRadioInputs.length === 0) {
      return { success: false, message: 'No radio buttons found', checkedCount: 0, expected: 3, logs: [] };
    }

    const candidateContainers = Array.from(document.querySelectorAll('form, .row, fieldset, tr, .formgroup'));
    const matchedContainers = candidateContainers.filter(container => {
      const text = (container.innerText || container.textContent || '').toLowerCase();
      return checklistSignatures.some(sig => text.includes(sig)) && container.querySelector('input[type="radio"]');
    });

    if (matchedContainers.length > 0) {
      matchedContainers.forEach((container, idx) => {
        const radios = Array.from(container.querySelectorAll('input[type="radio"]'));
        const yesRadio = radios.find(radio => {
          const val = (radio.value || '').trim().toLowerCase();
          const id = (radio.id || '').trim().toLowerCase();
          let labelText = '';
          if (radio.id) {
            const labelEl = container.querySelector(`label[for="${radio.id}"]`) || document.querySelector(`label[for="${radio.id}"]`);
            if (labelEl) labelText = (labelEl.innerText || labelEl.textContent || '').trim().toLowerCase();
          }
          if (!labelText && radio.parentElement) {
            labelText = (radio.parentElement.innerText || '').trim().toLowerCase();
          }
          return val === 'y' || val === 'yes' || val === 'true' || val === '1' ||
                 id === 'yes' || id.includes('yes') ||
                 labelText === 'yes' || labelText.startsWith('yes');
        });

        if (yesRadio) {
          highlightElement(container);
          dispatchFrameworkRadioClick(yesRadio);
          if (yesRadio.id) {
            const labelEl = document.querySelector(`label[for="${yesRadio.id}"]`);
            if (labelEl) labelEl.click();
          }
          checkedCount++;
          checklistResults.push({ row: idx + 1, status: 'checked', id: yesRadio.id, name: yesRadio.name });
        }
      });
    }

    // Fallback: bottom 3 radio sets
    if (checkedCount === 0) {
      const radioGroups = new Map();
      allRadioInputs.forEach(radio => {
        const groupKey = radio.name || (radio.closest('form') ? radio.closest('form') : radio.parentElement);
        if (!radioGroups.has(groupKey)) radioGroups.set(groupKey, []);
        radioGroups.get(groupKey).push(radio);
      });

      const relevantGroups = Array.from(radioGroups.values()).filter(group => {
        return group.some(r => {
          const val = (r.value || '').toLowerCase();
          const id = (r.id || '').toLowerCase();
          return val === 'y' || val === 'yes' || id === 'yes';
        });
      });

      const targetGroups = relevantGroups.slice(-3);
      targetGroups.forEach((group, idx) => {
        const yesRadio = group.find(r => {
          const val = (r.value || '').toLowerCase();
          const id = (r.id || '').toLowerCase();
          const parentText = (r.parentElement?.innerText || '').toLowerCase();
          return val === 'y' || val === 'yes' || id === 'yes' || parentText.includes('yes');
        });

        if (yesRadio) {
          dispatchFrameworkRadioClick(yesRadio);
          if (yesRadio.id) {
            const label = document.querySelector(`label[for="${yesRadio.id}"]`);
            if (label) label.click();
          }
          checkedCount++;
          checklistResults.push({ row: idx + 1, status: 'checked_via_fallback', id: yesRadio.id });
        }
      });
    }

    return {
      success: checkedCount >= 3,
      checkedCount,
      expected: 3,
      logs: checklistResults
    };
  }

  // =========================================================================
  // --- Section 7: Unified Runner & Diagnostic Store ---
  // =========================================================================

  async function runDataEntryProAutomation(config = {}) {
    const targetIndices = config.indices && Array.isArray(config.indices) && config.indices.length > 0 
      ? config.indices 
      : 'ALL';

    const tableResult = await approveTableItems(targetIndices);
    const radioResult = checkYesRadioButtons();

    const isSuccess = tableResult.success && radioResult.success;
    const msg = `Approved ${tableResult.approvedCount}/${tableResult.totalTargeted} table rows & selected "Yes" on ${radioResult.checkedCount}/3 medical checklist items.`;
    
    showOnScreenNotification('Automation Complete', msg, isSuccess);

    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      tableResult,
      radioResult,
      overallSuccess: isSuccess
    };

    // Store in memory & chrome.storage for diagnostic retrieval
    window.__DATA_ENTRY_PRO_LAST_RUN__ = diagnosticReport;
    window.__DATA_ENTRY_PRO_LOGS__.unshift(diagnosticReport);
    if (window.__DATA_ENTRY_PRO_LOGS__.length > 10) window.__DATA_ENTRY_PRO_LOGS__.pop();

    chrome.storage?.local?.set({ lastDiagnosticReport: diagnosticReport });

    return diagnosticReport;
  }

  // Global API
  window.DataEntryPro = {
    scanTableInfo,
    approveTableItems,
    checkYesRadioButtons,
    runDataEntryProAutomation,
    getLastReport: () => window.__DATA_ENTRY_PRO_LAST_RUN__ || null
  };

  // Message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_TABLE_INFO') {
      try {
        const info = scanTableInfo();
        sendResponse({ status: 'COMPLETED', info });
      } catch (err) {
        sendResponse({ status: 'ERROR', error: err.message });
      }
      return false;
    }

    if (request.action === 'GET_DIAGNOSTIC_LOG') {
      chrome.storage?.local?.get(['lastDiagnosticReport'], (res) => {
        sendResponse({ status: 'COMPLETED', report: res?.lastDiagnosticReport || window.__DATA_ENTRY_PRO_LAST_RUN__ || null });
      });
      return true;
    }

    if (request.action === 'RUN_AUTOMATION') {
      runDataEntryProAutomation(request.config || {})
        .then(summary => sendResponse({ status: 'COMPLETED', summary }))
        .catch(error => sendResponse({ status: 'ERROR', error: error.message }));
      return true;
    }

    if (request.action === 'APPROVE_ALL_ROWS') {
      approveTableItems('ALL')
        .then(result => {
          showOnScreenNotification('Approve All Rows', `Approved ${result.approvedCount} of ${result.totalTargeted} rows.`, result.success);
          sendResponse({ status: 'COMPLETED', result });
        })
        .catch(error => sendResponse({ status: 'ERROR', error: error.message }));
      return true;
    }

    if (request.action === 'APPROVE_CUSTOM_ROWS') {
      approveTableItems(request.indices || [])
        .then(result => {
          showOnScreenNotification('Custom Rows Approval', `Approved ${result.approvedCount} of ${result.totalTargeted} rows.`, result.success);
          sendResponse({ status: 'COMPLETED', result });
        })
        .catch(error => sendResponse({ status: 'ERROR', error: error.message }));
      return true;
    }

    if (request.action === 'CHECK_YES_RADIOS') {
      try {
        const result = checkYesRadioButtons();
        showOnScreenNotification('Checklist Radios', `Checked "Yes" on ${result.checkedCount} evaluation rows.`, result.success);
        sendResponse({ status: 'COMPLETED', result });
      } catch (error) {
        sendResponse({ status: 'ERROR', error: error.message });
      }
      return false;
    }
  });

  console.log('[Data Entry Pro v1.1.3] Content script ready with sequential loop & diagnostic export.');
})();
