/**
 * Data Entry Pro v1.1.2 - Enterprise Claims UI Automation Content Script
 * 
 * Specifically optimized for PMJAY Payer "Actionable details" table:
 * - Disambiguates between static summary table and interactive Actionable Grid
 * - Targets Action column dropdowns (Approve / Query / Reject)
 * - Automatically switches "Query", "Select", or "Reject" to "Approve"
 * - Selects "Yes" on all 3 standard medical evaluation checklist rows
 * - Dispatches React prototype events for controlled state sync
 */

(function () {
  'use strict';

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
      max-width: 380px;
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

  /**
   * Disambiguates between static read-only tables and the interactive Actionable Details Grid
   */
  function getActionableTableContext() {
    const candidateTables = Array.from(document.querySelectorAll('table'));
    let targetTable = null;
    let actionColIndex = -1;
    let targetRows = [];

    // Priority 1: Table containing interactive React-Select or select elements
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

    // Priority 2: Search under "Actionable details" section container
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

  /**
   * Scans table to return row details, codes (e.g. LB142, RI020), and current action status
   */
  function scanTableInfo() {
    const { rows, actionColIndex } = getActionableTableContext();
    
    const rowDetails = rows.map((row, idx) => {
      const tds = Array.from(row.querySelectorAll('td'));
      const rowNo = tds[0]?.innerText?.trim() || `${idx + 1}`;
      const code = tds[1]?.innerText?.trim() || `Item ${idx + 1}`;
      
      // Determine Action cell
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
  // --- Section 4: Task 1 - Set Action Dropdown to "Approve" ---
  // =========================================================================

  /**
   * Targets the Action dropdown in each row and changes "Query", "Select", or "Reject" to "Approve"
   */
  async function approveTableItems(targetIndices = 'ALL') {
    const { rows: targetRows, actionColIndex } = getActionableTableContext();

    if (targetRows.length === 0) {
      return { success: false, message: 'Action table rows not found', approvedCount: 0, totalTargeted: 0 };
    }

    // Determine target list (1-based indices)
    let indicesToProcess = [];
    if (targetIndices === 'ALL' || !Array.isArray(targetIndices) || targetIndices.length === 0) {
      indicesToProcess = targetRows.map((_, i) => i + 1);
    } else {
      const minVal = Math.min(...targetIndices);
      indicesToProcess = minVal === 0 ? targetIndices.map(n => n + 1) : targetIndices;
    }

    let approvedCount = 0;
    const processedLog = [];

    for (const rowNum of indicesToProcess) {
      const rowIndex = rowNum - 1;
      const row = targetRows[rowIndex];

      if (!row) {
        processedLog.push({ index: rowNum, status: 'row_not_found' });
        continue;
      }

      highlightElement(row);
      const tds = Array.from(row.querySelectorAll('td'));

      // Locate the Action cell specifically
      let actionCell = actionColIndex >= 0 && tds[actionColIndex] ? tds[actionColIndex] : null;
      if (!actionCell) {
        actionCell = tds.find(td => td.querySelector('select, [class*="-control"], [class*="react-select"], [role="combobox"]')) || row;
      }

      const currentLabel = (actionCell.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue, select')?.innerText || actionCell.innerText || '').trim();

      // Case A: Standard HTML <select>
      const selectElem = actionCell.querySelector('select') || row.querySelector('select');
      if (selectElem) {
        let optionFound = false;
        for (let i = 0; i < selectElem.options.length; i++) {
          const opt = selectElem.options[i];
          const text = (opt.text || opt.innerText || '').trim();
          const val = (opt.value || '').trim();

          if (/^approve[d]?$/i.test(text) || /^approve[d]?$/i.test(val)) {
            selectElem.selectedIndex = i;
            dispatchFrameworkValueChange(selectElem, opt.value);
            optionFound = true;
            approvedCount++;
            processedLog.push({ index: rowNum, type: 'standard_select', status: 'approved' });
            break;
          }
        }
        if (optionFound) continue;
      }

      // Case B: React-Select (Approve / Query / Reject dropdown)
      const reactSelectControl = actionCell.querySelector('[class*="-control"], [class*="react-select"], [role="combobox"], .css-1nxbv4n-control') || 
                                 row.querySelector('[class*="-control"], [class*="react-select"], [role="combobox"], .css-1nxbv4n-control');
      const hiddenBackingInput = actionCell.querySelector('input[name*="selecthidden"], input[id*="selecthidden"]') || row.querySelector('input[name*="selecthidden"]');

      if (reactSelectControl) {
        try {
          // Open dropdown menu
          reactSelectControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          reactSelectControl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          reactSelectControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

          // Wait micro-tick for React menu portal to mount
          await new Promise((res) => setTimeout(res, 80));

          // Look for "Approve" option in the document portal / menu
          const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], .select-item, [id*="-option-"], div'));
          const approveOption = menuOptions.find(opt => {
            const t = (opt.innerText || opt.textContent || '').trim().toLowerCase();
            return t === 'approve' || t === 'approved';
          });

          if (approveOption) {
            approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            approvedCount++;
            processedLog.push({ index: rowNum, type: 'react_select', status: 'approved' });
          } else {
            const comboboxInput = reactSelectControl.querySelector('input[role="combobox"], input[type="text"]');
            if (comboboxInput) {
              comboboxInput.focus();
              dispatchFrameworkValueChange(comboboxInput, 'Approve');
              comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
              approvedCount++;
              processedLog.push({ index: rowNum, type: 'react_select_input', status: 'approved' });
            } else if (/^approve[d]?$/i.test(currentLabel)) {
              approvedCount++;
              processedLog.push({ index: rowNum, type: 'react_select', status: 'already_approved' });
            }
          }

          if (hiddenBackingInput) {
            dispatchFrameworkValueChange(hiddenBackingInput, 'Approve');
          }
        } catch (err) {
          processedLog.push({ index: rowNum, status: 'error', error: err.message });
        }
      } else {
        processedLog.push({ index: rowNum, status: 'no_dropdown_element' });
      }
    }

    return {
      success: approvedCount > 0,
      approvedCount,
      totalTargeted: indicesToProcess.length,
      details: processedLog
    };
  }

  // =========================================================================
  // --- Section 5: Task 2 - Standard 3-Row Medical Evaluation Checklist ---
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
      return { success: false, message: 'No radio buttons found', checkedCount: 0, expected: 3 };
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
      details: checklistResults
    };
  }

  // =========================================================================
  // --- Section 6: Unified Trigger Runner & Extension Messaging ---
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

    const summary = {
      timestamp: new Date().toISOString(),
      dropdownTask: tableResult,
      checklistTask: radioResult,
      overallSuccess: isSuccess
    };

    return summary;
  }

  // Global API
  window.DataEntryPro = {
    scanTableInfo,
    approveTableItems,
    checkYesRadioButtons,
    runDataEntryProAutomation
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
})();
