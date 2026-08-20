/**
 * Data Entry Pro v1.1.0 - Enterprise Claims UI Automation Content Script
 * 
 * Features:
 * 1. Dynamic Table Scanner (Auto-detects total row count & claim codes on any form)
 * 2. "Approve All" Unconditional Batch Processing (Option A & B applied)
 * 3. Standard 3-Row Medical Evaluation Checklist (setting "Yes" radio buttons)
 * 4. Reactive Framework Event Hooks (React synthetic tracker bypass, Angular, Vue)
 * 5. On-Screen Feedback & Visual Pulse Highlighting
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
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
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
    el.style.backgroundColor = 'rgba(16, 185, 129, 0.18)';
    setTimeout(() => {
      el.style.backgroundColor = prevBg;
      el.style.transition = prevTransition;
    }, 2000);
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
  // --- Section 3: Dynamic Table Inspector & Finder ---
  // =========================================================================

  /**
   * Disambiguates and locates the actionable claim rows in the portal
   */
  function getActionableTableRows() {
    const candidateTables = Array.from(document.querySelectorAll('table'));
    let targetRows = [];

    for (const table of candidateTables) {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (rows.length > 0) {
        const text = table.innerText;
        const hasActionHeaders = text.includes('Action') && 
                                (text.includes('Package Code') || text.includes('Procedure Code') || text.includes('ICHI'));
        if (hasActionHeaders || rows.some(r => r.querySelector('select, [class*="react-select"], [class*="-control"], .css-1nxbv4n-control'))) {
          targetRows = rows;
          break;
        }
      }
    }

    if (targetRows.length === 0) {
      // Look for container rows under "Actionable details" header
      const actionableHeading = Array.from(document.querySelectorAll('div, h2, h3, h4, span'))
        .find(el => el.textContent.trim().toLowerCase() === 'actionable details');
      if (actionableHeading) {
        const section = actionableHeading.closest('.row, .col-lg-12, div');
        if (section) {
          const rows = Array.from(section.querySelectorAll('tbody tr, tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 4);
          if (rows.length > 0) targetRows = rows;
        }
      }
    }

    if (targetRows.length === 0) {
      targetRows = Array.from(document.querySelectorAll('table tbody tr'))
        .filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 5);
    }

    return targetRows;
  }

  /**
   * Scans the page to extract metadata on how many rows exist and their status
   */
  function scanTableInfo() {
    const rows = getActionableTableRows();
    const rowDetails = rows.map((row, idx) => {
      const tds = Array.from(row.querySelectorAll('td'));
      const rowNo = tds[0]?.innerText?.trim() || `${idx + 1}`;
      const code = tds[1]?.innerText?.trim() || `Item ${idx + 1}`;
      
      // Determine if already approved
      const selectText = row.querySelector('select')?.selectedOptions?.[0]?.text || 
                         row.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue')?.innerText || 
                         row.querySelector('[class*="-control"]')?.innerText || '';
      
      const isApproved = /^approve[d]?$/i.test(selectText.trim());
      return { index: idx + 1, rowNo, code, isApproved, currentText: selectText.trim() };
    });

    return {
      totalRows: rows.length,
      rows: rowDetails,
      approvedCount: rowDetails.filter(r => r.isApproved).length,
      pendingCount: rowDetails.filter(r => !r.isApproved).length
    };
  }

  // =========================================================================
  // --- Section 4: Task 1 - Tabular Dropdown Automation ---
  // =========================================================================

  /**
   * Loops through data grid/table rows and changes dropdowns to "Approve".
   * Supports 'ALL' or specific indices array.
   */
  async function approveTableItems(targetIndices = 'ALL') {
    const targetRows = getActionableTableRows();

    if (targetRows.length === 0) {
      console.warn('[Data Entry Pro] No actionable table rows found in DOM.');
      return { success: false, message: 'Action table rows not found', approvedCount: 0, totalTargeted: 0 };
    }

    // Resolve target indices list (1-based)
    let indicesToProcess = [];
    if (targetIndices === 'ALL' || !Array.isArray(targetIndices) || targetIndices.length === 0) {
      indicesToProcess = targetRows.map((_, i) => i + 1);
    } else {
      // Normalize to 1-based indexing
      const minVal = Math.min(...targetIndices);
      const isZeroBased = minVal === 0;
      indicesToProcess = isZeroBased ? targetIndices.map(n => n + 1) : targetIndices;
    }

    console.log(`[Data Entry Pro] Executing approvals on ${indicesToProcess.length} rows:`, indicesToProcess);

    let approvedCount = 0;
    const processedLog = [];

    for (const rowNum of indicesToProcess) {
      const rowIndex = rowNum - 1;
      const row = targetRows[rowIndex];

      if (!row) {
        console.warn(`[Data Entry Pro] Row #${rowNum} does not exist.`);
        processedLog.push({ index: rowNum, status: 'row_not_found' });
        continue;
      }

      highlightElement(row);

      // Case A: Standard HTML <select> element
      const selectElem = row.querySelector('select');
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
            console.log(`[Data Entry Pro] Standard <select> on row ${rowNum} changed to '${text}'.`);
            break;
          }
        }
        if (!optionFound) {
          processedLog.push({ index: rowNum, status: 'option_not_found' });
        }
        continue;
      }

      // Case B: React-Select / ARIA Combobox component
      const reactSelectControl = row.querySelector('[class*="-control"], [class*="react-select"], [role="combobox"], .css-1nxbv4n-control');
      const hiddenBackingInput = row.querySelector('input[name*="selecthidden"], input[id*="selecthidden"]');

      if (reactSelectControl) {
        try {
          // Open the dropdown menu
          reactSelectControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          reactSelectControl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          reactSelectControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

          // Micro-tick wait for React-Select menu portal rendering
          await new Promise((res) => setTimeout(res, 70));

          // Find dropdown option matching "Approve"
          const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], .select-item, [id*="-option-"]'));
          const approveOption = menuOptions.find(opt => /^approve[d]?$/i.test((opt.innerText || opt.textContent || '').trim()));

          if (approveOption) {
            approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            approvedCount++;
            processedLog.push({ index: rowNum, type: 'react_select', status: 'approved' });
            console.log(`[Data Entry Pro] Custom dropdown on row ${rowNum} set to Approve via menu option click.`);
          } else {
            // Alternative: Type "Approve" + Enter into active combobox input
            const comboboxInput = reactSelectControl.querySelector('input[role="combobox"], input[type="text"]');
            if (comboboxInput) {
              comboboxInput.focus();
              dispatchFrameworkValueChange(comboboxInput, 'Approve');
              comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
              approvedCount++;
              processedLog.push({ index: rowNum, type: 'react_select_input', status: 'approved' });
            } else {
              // If already approved, count as verified
              const currentText = (reactSelectControl.innerText || '').trim();
              if (/^approve[d]?$/i.test(currentText)) {
                approvedCount++;
                processedLog.push({ index: rowNum, type: 'react_select', status: 'already_approved' });
              }
            }
          }

          if (hiddenBackingInput) {
            dispatchFrameworkValueChange(hiddenBackingInput, 'Approve');
          }
        } catch (err) {
          console.error(`[Data Entry Pro] Error setting custom dropdown on row ${rowNum}:`, err);
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
    console.log('[Data Entry Pro] Starting checkYesRadioButtons for medical evaluation checklist.');

    const checklistSignatures = [
      'diagnosis is supported by evidence',
      'case management is as per',
      'whether duration of treatment matched'
    ];

    let checkedCount = 0;
    const checklistResults = [];
    const allRadioInputs = Array.from(document.querySelectorAll('input[type="radio"]'));

    if (allRadioInputs.length === 0) {
      console.warn('[Data Entry Pro] No radio buttons found on page.');
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

    // Fallback: bottom 3 radio groups
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
    // Mode 'ALL' or custom indices
    const targetIndices = config.indices && Array.isArray(config.indices) && config.indices.length > 0 
      ? config.indices 
      : 'ALL';

    console.log('[Data Entry Pro v1.1] === Initiating Unified Form Automation ===');
    
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

    console.log('[Data Entry Pro v1.1] === Automation Finished ===', summary);
    return summary;
  }

  // Expose global API
  window.DataEntryPro = {
    scanTableInfo,
    approveTableItems,
    checkYesRadioButtons,
    runDataEntryProAutomation
  };

  // Message listener for Popup and Background
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

  console.log('[Data Entry Pro v1.1] Content script ready & table scanner initialized.');
})();
