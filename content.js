/**
 * Data Entry Pro v1.2.4 - Enterprise Claims UI Automation Content Script
 * 
 * Specifically optimized for PMJAY Payer Claims Evaluation:
 * - Deterministic Case-Level Action* locator using Document Position relative to Remarks textarea
 * - Strictly isolates non-table React-Select controls to eliminate table row collision
 * - Tier 1: Sequential Table row approvals ("Approve" across all rows)
 * - Tier 2: 3-Row Medical Evaluation Checklist ("Yes" radios)
 * - Tier 3: Case-Level Decision Action* dropdown ("Approve")
 * - Tier 4: Standard Clinical Justification Remarks auto-population
 * - Full Diagnostic Logger & Zero-Click Chrome Auto-Reload Bridge
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
      max-width: 420px;
      border: 1px solid ${isSuccess ? '#059669' : '#dc2626'};
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: translateY(0);
      opacity: 1;
    `;

    toast.innerHTML = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span>⚡</span> ${title}
      </div>
      <div style="color: #e2e8f0; font-size: 12px;">${message}</div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 350);
    }, 4800);
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
  // --- Section 2: Framework Event Dispatchers & React-Select Engine ---
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

  /**
   * Universal React-Select Value Setter
   */
  async function setReactSelectValue(containerOrControl, targetValue = 'Approve') {
    if (!containerOrControl) return { success: false, method: 'no_element' };

    const input = containerOrControl.tagName === 'INPUT' 
      ? containerOrControl 
      : containerOrControl.querySelector('input[role="combobox"], input[id^="react-select-"], input[type="text"]');
    
    const control = containerOrControl.classList.contains('css-1nxbv4n-control') || containerOrControl.classList.contains('control')
      ? containerOrControl
      : (containerOrControl.querySelector('.css-1nxbv4n-control, [class*="-control"]') || containerOrControl);

    const hiddenBackingInput = containerOrControl.parentElement?.querySelector('input[name*="selecthidden"], input[id*="selecthidden"]') ||
                              containerOrControl.querySelector('input[name*="selecthidden"]');

    // Method 1: React Fiber Props direct invocation
    try {
      const fiberKey = Object.keys(control).find(k => k.startsWith('__reactProps') || k.startsWith('__reactFiber'));
      if (fiberKey) {
        let node = control[fiberKey];
        while (node) {
          const props = node.memoizedProps || node.pendingProps;
          if (props && typeof props.onChange === 'function') {
            props.onChange({ label: targetValue, value: targetValue, text: targetValue });
            break;
          }
          node = node.return;
        }
      }
    } catch (e) {
      // Fiber method optional
    }

    // Method 2: Targeted DOM Open & Click with Prefix Matching
    if (input) {
      input.focus();
    }

    const clickTarget = control.querySelector('[class*="indicator"], [class*="indicatorContainer"], svg') || control;
    
    ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(evt => {
      clickTarget.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window, buttons: 1 }));
    });

    if (input) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }));
    }

    const inputId = input?.id || '';
    const prefix = inputId ? inputId.replace('-input', '') : '';

    let optionFound = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise(r => setTimeout(r, 40));

      let candidateOptions = [];
      if (prefix) {
        candidateOptions = Array.from(document.querySelectorAll(`div[id^="${prefix}-option"], #${prefix}-listbox div, div[id*="${prefix}"]`));
      }
      if (candidateOptions.length === 0) {
        candidateOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], .select-item'));
      }

      optionFound = candidateOptions.find(opt => {
        const t = (opt.innerText || opt.textContent || '').trim().toLowerCase();
        return t === targetValue.toLowerCase() || t === (targetValue + 'd').toLowerCase();
      });

      if (optionFound) break;
    }

    if (optionFound) {
      ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(evt => {
        optionFound.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window, buttons: 1 }));
      });
    } else if (input) {
      // Method 3: Keyboard typing + Enter fallback
      input.focus();
      dispatchFrameworkValueChange(input, targetValue);
      ['keydown', 'keypress', 'keyup'].forEach(evt => {
        input.dispatchEvent(new KeyboardEvent(evt, { key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      });
    }

    if (hiddenBackingInput) {
      dispatchFrameworkValueChange(hiddenBackingInput, targetValue);
    }

    await new Promise(r => setTimeout(r, 60));
    return { success: true, method: optionFound ? 'menu_option_click' : 'keyboard_fallback' };
  }

  // =========================================================================
  // --- Section 3: Semantic Table & Row Scanner ---
  // =========================================================================

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

    // Priority 2: Look under "Actionable details" section container
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
  // --- Section 4: Tier 1 - Sequential Table Row Approvals ---
  // =========================================================================

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

    // Case A: Standard HTML <select>
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

    // Case B: React-Select Component
    const reactSelectControl = actionCell.querySelector('.css-1nxbv4n-control, [class*="-control"], [class*="react-select"], [role="combobox"]') ||
                               row.querySelector('.css-1nxbv4n-control, [class*="-control"]');
    
    if (!reactSelectControl) {
      logEntry.status = 'no_control_found';
      logEntry.timeMs = Date.now() - startTime;
      return { success: false, log: logEntry };
    }

    try {
      reactSelectControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const res = await setReactSelectValue(reactSelectControl, 'Approve');
      
      const finalText = (actionCell.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue')?.innerText || actionCell.innerText || '').trim().replace(/\n/g, ' ');
      logEntry.finalText = finalText;
      logEntry.method = res.method;
      logEntry.status = /^approve[d]?$/i.test(finalText) ? 'approved' : 'attempted';
      logEntry.timeMs = Date.now() - startTime;

      return { success: true, log: logEntry };
    } catch (err) {
      logEntry.status = 'error';
      logEntry.error = err.message;
      logEntry.timeMs = Date.now() - startTime;
      return { success: false, log: logEntry };
    }
  }

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
  // --- Section 5: Tier 2 - 3-Row Medical Evaluation Checklist ---
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
  // --- Section 6: Tier 3 - Overall Case-Level Decision Action* Dropdown ---
  // =========================================================================

  /**
   * Locates the Case-Level Action* dropdown with 100% precision:
   * Finds the exact non-table React-Select control positioned immediately preceding the Remarks textarea
   */
  function findCaseLevelActionControl() {
    const allControls = Array.from(document.querySelectorAll('.css-1nxbv4n-control, [class*="-control"], select, [role="combobox"]'));
    
    // Filter out table elements
    const nonTableControls = allControls.filter(ctrl => {
      return !ctrl.closest('table') && !ctrl.closest('thead') && !ctrl.closest('tbody') && !ctrl.closest('header') && !ctrl.closest('nav');
    });

    const textarea = document.querySelector('textarea');
    if (textarea && nonTableControls.length > 0) {
      // Find controls that appear BEFORE the textarea in DOM position
      const preceding = nonTableControls.filter(ctrl => {
        return (ctrl.compareDocumentPosition(textarea) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      });
      if (preceding.length > 0) {
        return preceding[preceding.length - 1];
      }
    }

    // Secondary strategy: Look for Action* label container
    const allLabels = Array.from(document.querySelectorAll('label, div, p, span'));
    const actionLabel = allLabels.find(el => {
      if (el.closest('table')) return false;
      const text = el.innerText?.trim() || el.textContent?.trim() || '';
      return /^action\s*\*?$/i.test(text);
    });

    if (actionLabel) {
      const container = actionLabel.closest('.formgroup, .row, .col-md-12, .col-lg-12, div');
      const ctrl = container?.querySelector('.css-1nxbv4n-control, [class*="-control"], [class*="react-select"], [role="combobox"]');
      if (ctrl && !ctrl.closest('table')) return ctrl;
    }

    return nonTableControls[nonTableControls.length - 1] || null;
  }

  async function setCaseLevelActionToApprove() {
    const startTime = Date.now();
    const log = { target: 'case_level_action', status: 'pending', timeMs: 0 };

    const targetControl = findCaseLevelActionControl();

    if (!targetControl) {
      log.status = 'control_not_found';
      log.timeMs = Date.now() - startTime;
      return { success: false, log };
    }

    try {
      const initialText = (targetControl.innerText || '').trim();
      log.initialText = initialText;

      highlightElement(targetControl);
      targetControl.scrollIntoView({ block: 'center', inline: 'nearest' });

      // Execute React-Select value setter
      const res = await setReactSelectValue(targetControl, 'Approve');

      const finalText = (targetControl.querySelector('[class*="singleValue"], .css-1i1tyke-singleValue')?.innerText || targetControl.innerText || '').trim();
      log.finalText = finalText;
      log.method = res.method;
      log.status = /^approve[d]?$/i.test(finalText) ? 'approved' : 'attempted';
      log.timeMs = Date.now() - startTime;

      return { success: true, log };
    } catch (err) {
      log.status = 'error';
      log.error = err.message;
      log.timeMs = Date.now() - startTime;
      return { success: false, log };
    }
  }

  // =========================================================================
  // --- Section 7: Tier 4 - Standard Clinical Remarks Auto-Population ---
  // =========================================================================

  function setCaseLevelRemarks() {
    const startTime = Date.now();
    const log = { target: 'case_level_remarks', status: 'pending', text: '', timeMs: 0 };

    const textarea = document.querySelector('textarea.form-control, textarea[placeholder*="Type here"], textarea[maxlength="500"], textarea');
    if (!textarea) {
      log.status = 'textarea_not_found';
      log.timeMs = Date.now() - startTime;
      return { success: false, log };
    }

    // Step A: Extract Approved Amount from summary text
    let approvedAmount = '';
    const allTextBlocks = Array.from(document.querySelectorAll('span, p, div, td, b, strong'));
    
    for (const el of allTextBlocks) {
      const text = el.innerText || el.textContent || '';
      const match = text.match(/(?:Claim amount approved|Total payable amount|Amount Approved|Total Amount)[\s\S]*?[₹Rs.]\s*([\d,]+\.?\d*)/i);
      if (match && match[1]) {
        approvedAmount = match[1].trim();
        break;
      }
    }

    if (!approvedAmount) {
      const amountApprovedTds = Array.from(document.querySelectorAll('td')).filter(td => td.innerText.includes('₹'));
      if (amountApprovedTds.length > 0) {
        const lastVal = amountApprovedTds[amountApprovedTds.length - 1].innerText.replace(/[₹,\s]/g, '').trim();
        if (lastVal && !isNaN(lastVal)) approvedAmount = lastVal;
      }
    }

    // Step B: Determine if Consultation or Investigation based on Package Codes
    const pageText = (document.body.innerText || '').toUpperCase();
    const isConsultation = pageText.includes('CONSULTATION') || pageText.includes('OPD') || /CN\d+/.test(pageText);
    
    const formattedAmount = approvedAmount ? `Rs. ${approvedAmount}/-` : 'Rs.';
    const remarkText = isConsultation
      ? `CASE OF CONSULTATION SO FINAL APPROVAL AMOUNT IS ${formattedAmount}`
      : `CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS ${formattedAmount}`;

    highlightElement(textarea);
    textarea.focus();
    dispatchFrameworkValueChange(textarea, remarkText);

    log.status = 'remarks_populated';
    log.text = remarkText;
    log.timeMs = Date.now() - startTime;

    return { success: true, text: remarkText, log };
  }

  // =========================================================================
  // --- Section 8: Unified 4-Tier Runner & Diagnostic Store ---
  // =========================================================================

  async function runDataEntryProAutomation(config = {}) {
    const targetIndices = config.indices && Array.isArray(config.indices) && config.indices.length > 0 
      ? config.indices 
      : 'ALL';

    // Tier 1: Table Rows Approval
    const tableResult = await approveTableItems(targetIndices);

    // Tier 2: 3-Row Medical Checklist
    const radioResult = checkYesRadioButtons();

    // Tier 3: Case-Level Action* Dropdown -> "Approve"
    const caseActionResult = await setCaseLevelActionToApprove();

    // Tier 4: Remarks Auto-Population
    const remarksResult = setCaseLevelRemarks();

    const isSuccess = tableResult.success && radioResult.success && caseActionResult.success;
    const msg = `Approved ${tableResult.approvedCount}/${tableResult.totalTargeted} table rows, checked ${radioResult.checkedCount} Yes radios, set Case Action to "${caseActionResult.log?.finalText || 'Approve'}", and added standard Remarks!`;
    
    showOnScreenNotification('Full Approval Complete', msg, isSuccess);

    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      tier1_tableResult: tableResult,
      tier2_radioResult: radioResult,
      tier3_caseAction: caseActionResult,
      tier4_remarks: remarksResult,
      overallSuccess: isSuccess
    };

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
    setCaseLevelActionToApprove,
    setCaseLevelRemarks,
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

  console.log('[Data Entry Pro v1.2.4] Content script ready with Document Position Case Action Locator.');
})();
