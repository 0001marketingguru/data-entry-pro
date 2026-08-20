/**
 * Data Entry Pro - Enterprise Claims UI Automation Content Script
 * 
 * Features:
 * 1. Tabular Action Dropdowns (setting "Select" -> "Approve" for dynamic target indices)
 * 2. Standard 3-Row Medical Evaluation Checklist (setting "Yes" radio buttons)
 * 3. Reactive Framework Event Hooks (React synthetic tracker bypass, Angular, Vue)
 * 4. Non-intrusive on-screen visual toast & subtle element highlighting
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
    el.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    setTimeout(() => {
      el.style.backgroundColor = prevBg;
      el.style.transition = prevTransition;
    }, 2000);
  }

  // =========================================================================
  // --- Section 2: Framework Event Dispatchers ---
  // =========================================================================

  /**
   * Overrides value setters to bypass React 16+ / Angular / Vue synthetic event
   * value-tracking wrappers and dispatches bubbling input & change events.
   */
  function dispatchFrameworkValueChange(element, value) {
    if (!element) return;
    
    // React prototype value setter bypass
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

    // Trigger full native UI event lifecycle
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  /**
   * Dispatches complete native click and check events to satisfy reactive forms
   */
  function dispatchFrameworkRadioClick(radioInput) {
    if (!radioInput) return;

    // React prototype checked setter bypass
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

    // Native mouse and form event chain
    radioInput.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    radioInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    radioInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  // =========================================================================
  // --- Section 3: Task 1 - Tabular Dropdown Automation ---
  // =========================================================================

  /**
   * Loops through data grid/table rows and changes dropdowns to "Approve".
   * Robustly handles both standard <select> tags and modern custom/react-select comboboxes.
   * 
   * @param {number[]} indices - Dynamic array of row indices to approve (e.g. [3, 7, 8, 9])
   * @returns {Promise<Object>} result - Execution metrics and status log
   */
  async function approveTableItems(indices = []) {
    console.log(`[Data Entry Pro] Starting approveTableItems for target indices:`, indices);
    
    if (!indices || indices.length === 0) {
      return { success: true, message: 'No row indices specified', approvedCount: 0, totalTargeted: 0 };
    }

    // Locate candidate actionable data tables
    const candidateTables = Array.from(document.querySelectorAll('table'));
    let targetRows = [];

    // Find table containing actionable procedure/claim items
    for (const table of candidateTables) {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (rows.length > 0) {
        const hasActionColumn = table.innerText.includes('Action') || 
                                table.innerText.includes('Procedure') || 
                                table.innerText.includes('Package Code');
        if (hasActionColumn || rows.some(r => r.querySelector('select, [class*="react-select"], [class*="-control"], [class*="container"]'))) {
          targetRows = rows;
          break;
        }
      }
    }

    // Fallback: search across all table rows if specific container wasn't isolated
    if (targetRows.length === 0) {
      targetRows = Array.from(document.querySelectorAll('table tbody tr, .table-row, [role="row"]'))
        .filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 3);
    }

    if (targetRows.length === 0) {
      console.warn('[Data Entry Pro] No actionable table rows found in DOM.');
      return { success: false, message: 'Action table rows not found', approvedCount: 0, totalTargeted: indices.length };
    }

    console.log(`[Data Entry Pro] Identified ${targetRows.length} data rows in table.`);

    // Determine 1-based vs 0-based indexing (e.g. user passing UI line numbers 3, 7, 8, 9)
    const maxIndex = Math.max(...indices);
    const minIndex = Math.min(...indices);
    const isOneBased = minIndex >= 1 && maxIndex <= targetRows.length;

    let approvedCount = 0;
    const processedLog = [];

    for (const rawIndex of indices) {
      const rowIndex = isOneBased ? rawIndex - 1 : rawIndex;
      const row = targetRows[rowIndex];

      if (!row) {
        console.warn(`[Data Entry Pro] Row at index ${rawIndex} (resolved: ${rowIndex}) does not exist.`);
        processedLog.push({ index: rawIndex, status: 'row_not_found' });
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
            processedLog.push({ index: rawIndex, type: 'standard_select', status: 'approved' });
            console.log(`[Data Entry Pro] Standard <select> on row ${rawIndex} changed to '${text}'.`);
            break;
          }
        }

        if (!optionFound) {
          console.warn(`[Data Entry Pro] 'Approve' option not found in <select> on row ${rawIndex}.`);
          processedLog.push({ index: rawIndex, status: 'option_not_found' });
        }
        continue;
      }

      // Case B: Custom React-Select / ARIA Combobox component
      const reactSelectControl = row.querySelector('[class*="-control"], [class*="react-select"], [role="combobox"], .css-1nxbv4n-control');
      const hiddenBackingInput = row.querySelector('input[name*="selecthidden"], input[id*="selecthidden"]');

      if (reactSelectControl) {
        try {
          const currentText = (reactSelectControl.innerText || '').trim();
          if (/^approve[d]?$/i.test(currentText)) {
            approvedCount++;
            processedLog.push({ index: rawIndex, type: 'react_select', status: 'already_approved' });
            continue;
          }

          // Trigger dropdown open
          reactSelectControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          reactSelectControl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          reactSelectControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

          // Micro-tick wait for dropdown menu portal rendering
          await new Promise((res) => setTimeout(res, 60));

          // Find dropdown option matching "Approve"
          const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], .select-item, [id*="-option-"]'));
          const approveOption = menuOptions.find(opt => /^approve[d]?$/i.test((opt.innerText || opt.textContent || '').trim()));

          if (approveOption) {
            approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            approvedCount++;
            processedLog.push({ index: rawIndex, type: 'react_select', status: 'approved' });
            console.log(`[Data Entry Pro] Custom dropdown on row ${rawIndex} set to Approve via menu option click.`);
          } else {
            // Fallback: Type "Approve" + Enter into active combobox input
            const comboboxInput = reactSelectControl.querySelector('input[role="combobox"], input[type="text"]');
            if (comboboxInput) {
              comboboxInput.focus();
              dispatchFrameworkValueChange(comboboxInput, 'Approve');
              comboboxInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
              approvedCount++;
              processedLog.push({ index: rawIndex, type: 'react_select_input', status: 'approved' });
            }
          }

          // Update hidden backing input if present
          if (hiddenBackingInput) {
            dispatchFrameworkValueChange(hiddenBackingInput, 'Approve');
          }
        } catch (err) {
          console.error(`[Data Entry Pro] Error setting custom dropdown on row ${rawIndex}:`, err);
          processedLog.push({ index: rawIndex, status: 'error', error: err.message });
        }
      } else {
        console.warn(`[Data Entry Pro] No recognized dropdown in row ${rawIndex}.`);
        processedLog.push({ index: rawIndex, status: 'no_dropdown_element' });
      }
    }

    return {
      success: true,
      approvedCount,
      totalTargeted: indices.length,
      details: processedLog
    };
  }

  // =========================================================================
  // --- Section 4: Task 2 - Standard 3-Row Medical Evaluation Checklist ---
  // =========================================================================

  /**
   * Automatically locates and selects the "Yes" radio button for the 3 standard
   * medical evaluation checklist rows at the bottom of the review form.
   * 
   * @returns {Object} result - Execution metrics and status
   */
  function checkYesRadioButtons() {
    console.log('[Data Entry Pro] Starting checkYesRadioButtons for medical evaluation checklist.');

    // Signatures for the 3 standard evaluation rows
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

    // Strategy 1: Find container rows matching signature text
    const candidateContainers = Array.from(document.querySelectorAll('form, .row, fieldset, tr, .formgroup'));
    const matchedContainers = candidateContainers.filter(container => {
      const text = (container.innerText || container.textContent || '').toLowerCase();
      return checklistSignatures.some(sig => text.includes(sig)) && container.querySelector('input[type="radio"]');
    });

    if (matchedContainers.length > 0) {
      console.log(`[Data Entry Pro] Found ${matchedContainers.length} checklist containers matching standard evaluation signatures.`);
      
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
          
          // Also click associated label if custom styled radio overlay is in use
          if (yesRadio.id) {
            const labelEl = document.querySelector(`label[for="${yesRadio.id}"]`);
            if (labelEl) labelEl.click();
          }

          checkedCount++;
          checklistResults.push({ row: idx + 1, status: 'checked', id: yesRadio.id, name: yesRadio.name });
          console.log(`[Data Entry Pro] Checklist Row #${idx + 1} 'Yes' radio activated.`);
        }
      });
    }

    // Strategy 2 (Fallback): Target radio groups in the bottom form area
    if (checkedCount === 0) {
      console.log('[Data Entry Pro] Running fallback radio group matching...');
      
      const radioGroups = new Map();
      allRadioInputs.forEach(radio => {
        const groupKey = radio.name || (radio.closest('form') ? radio.closest('form') : radio.parentElement);
        if (!radioGroups.has(groupKey)) {
          radioGroups.set(groupKey, []);
        }
        radioGroups.get(groupKey).push(radio);
      });

      const relevantGroups = Array.from(radioGroups.values()).filter(group => {
        return group.some(r => {
          const val = (r.value || '').toLowerCase();
          const id = (r.id || '').toLowerCase();
          return val === 'y' || val === 'yes' || id === 'yes';
        });
      });

      // Target exactly the 3 evaluation rows
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
  // --- Section 5: Unified Trigger Runner & Extension Messaging ---
  // =========================================================================

  /**
   * Unified runner executing both Tabular Dropdowns and Checklist Radio Tasks
   */
  async function runDataEntryProAutomation(config = {}) {
    const targetIndices = config.indices && Array.isArray(config.indices) && config.indices.length > 0 
      ? config.indices 
      : [3, 7, 8, 9];

    console.log('[Data Entry Pro] === Initiating Unified Form Automation ===');
    
    const tableResult = await approveTableItems(targetIndices);
    const radioResult = checkYesRadioButtons();

    const isSuccess = tableResult.success && radioResult.success;
    const msg = `Approved ${tableResult.approvedCount}/${tableResult.totalTargeted} table rows and confirmed ${radioResult.checkedCount}/3 medical evaluation checklist items.`;
    
    showOnScreenNotification('Automation Complete', msg, isSuccess);

    const summary = {
      timestamp: new Date().toISOString(),
      dropdownTask: tableResult,
      checklistTask: radioResult,
      overallSuccess: isSuccess
    };

    console.log('[Data Entry Pro] === Automation Complete ===', summary);
    return summary;
  }

  // Expose global namespace for Console / DevTools invocation
  window.DataEntryPro = {
    approveTableItems,
    checkYesRadioButtons,
    runDataEntryProAutomation
  };

  // Listen for messages from Popup UI or Background Shortcuts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'RUN_AUTOMATION') {
      runDataEntryProAutomation(request.config || {})
        .then(summary => sendResponse({ status: 'COMPLETED', summary }))
        .catch(error => sendResponse({ status: 'ERROR', error: error.message }));
      return true; // Keep channel open for async response
    }

    if (request.action === 'APPROVE_TABLE_ITEMS') {
      approveTableItems(request.indices || [])
        .then(result => {
          showOnScreenNotification('Table Dropdowns', `Approved ${result.approvedCount} of ${result.totalTargeted} rows.`, true);
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

  console.log('[Data Entry Pro] Content script initialized and ready.');
})();
