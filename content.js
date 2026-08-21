/**
 * Data Entry Pro v1.3.0 - Enterprise Claims UI Automation & Dynamic Island HUD
 * 
 * Features:
 * - ⚡ On-Screen Reactive "Dynamic Island" Claims Auditor HUD:
 *   - Real-time display of Claimed Amount (₹ 4,363.00) vs Evaluated Amount (₹ 4,306.00)
 *   - Live SPA Mutation Observer (Auto-syncs on next case without refresh)
 *   - Draggable anywhere with magnetic edge snapping & position memory
 *   - 3 Ergonomic States: Dynamic Pill, Expanded Audit Card, and Minimized Chip
 *   - 1-Click Copy to clipboard with instant micro-feedback
 *   - Integrated 1-Click Full Auto-Approve button & Alt+H HUD toggle
 * - 🎯 Unified 4-Tier Approval Engine:
 *   - Tier 1: Sequential Table row approvals ("Approve" across all rows)
 *   - Tier 2: 3-Row Medical Evaluation Checklist ("Yes" radios)
 *   - Tier 3: Case-Level Decision Action* dropdown ("Approve")
 *   - Tier 4: Precision Remarks Auto-Population with exact evaluated amount
 * - Zero-Click Chrome Auto-Reload Bridge & Full Diagnostic Logger
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
  // --- Section 3: Amount Extractors (Claimed vs Evaluated) ---
  // =========================================================================

  /**
   * Extracts "Amount claimed by hospital (as per bill)"
   */
  function extractClaimedAmount() {
    const bodyText = document.body ? (document.body.innerText || '') : '';

    // Primary regex: Exact PMJAY label
    const primaryRegex = /Amount\s+claimed\s+by\s+hospital\s*\(as\s+per\s+bill\)\s*:?\s*[₹Rs.]*\s*([\d,]+\.?\d*)/i;
    const m1 = bodyText.match(primaryRegex);
    if (m1 && m1[1] && m1[1].trim() !== '') return m1[1].trim();

    // DOM node traversal
    const candidateNodes = Array.from(document.querySelectorAll('p, span, div, td')).filter(el => {
      const t = (el.innerText || '').toLowerCase();
      return t.includes('amount claimed by hospital') || t.includes('claimed by hospital');
    });

    for (const node of candidateNodes) {
      const row = node.closest('.row, tr, div');
      if (row) {
        const sibling = Array.from(row.querySelectorAll('p, span, div, td')).find(s => {
          return s !== node && !node.contains(s) && (s.innerText.includes('₹') || s.innerText.includes('Rs'));
        });
        if (sibling) {
          const match = sibling.innerText.match(/[\d,]+\.?\d*/);
          if (match && match[0]) return match[0].trim();
        }
      }
    }

    // Fallback: Total package amount
    const fallbackRegex = /(?:Total\s+package\s+amount|Amount\s+claimed)[\s\S]*?[₹Rs.]\s*([\d,]+\.?\d*)/i;
    const m2 = bodyText.match(fallbackRegex);
    if (m2 && m2[1]) return m2[1].trim();

    return '';
  }

  /**
   * Extracts "Claim amount approved (After technical evaluation)"
   */
  function extractClaimAmountApproved() {
    const bodyText = document.body ? (document.body.innerText || '') : '';

    // Primary: Regex search across full text body
    const primaryRegex = /Claim\s+amount\s+approved\s*\(After\s+technical\s+evaluation\)\s*:?\s*[₹Rs.]*\s*([\d,]+\.?\d*)/i;
    const m1 = bodyText.match(primaryRegex);
    if (m1 && m1[1] && m1[1].trim() !== '') {
      return m1[1].trim();
    }

    // Secondary: DOM node traversal
    const candidateNodes = Array.from(document.querySelectorAll('p, span, div, td')).filter(el => {
      const t = (el.innerText || '').toLowerCase();
      return t.includes('claim amount approved') && t.includes('technical evaluation');
    });

    for (const node of candidateNodes) {
      const row = node.closest('.row, tr, div');
      if (row) {
        const siblingWithRupee = Array.from(row.querySelectorAll('p, span, div, td')).find(s => {
          return s !== node && !node.contains(s) && (s.innerText.includes('₹') || s.innerText.includes('Rs'));
        });
        if (siblingWithRupee) {
          const match = siblingWithRupee.innerText.match(/[\d,]+\.?\d*/);
          if (match && match[0]) return match[0].trim();
        }
      }
    }

    // Fallback: Total payable amount regex
    const fallbackRegex = /(?:Total\s+payable\s+amount|Amount\s+claimed\s+by\s+hospital)[\s\S]*?[₹Rs.]\s*([\d,]+\.?\d*)/i;
    const m2 = bodyText.match(fallbackRegex);
    if (m2 && m2[1]) {
      return m2[1].trim();
    }

    return '';
  }

  // =========================================================================
  // --- Section 4: Semantic Table & Row Scanner ---
  // =========================================================================

  function getActionableTableContext() {
    const candidateTables = Array.from(document.querySelectorAll('table'));
    let targetTable = null;
    let actionColIndex = -1;
    let targetRows = [];

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
  // --- Section 5: Tier 1 - Sequential Table Row Approvals ---
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

    // Standard HTML <select>
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

    // React-Select Component
    const reactSelectControl = actionCell.querySelector('.css-1nxbv4n-control, [class*="-control"], [class*="react-select"], [role="combobox"]') ||
                               row.querySelector('.css-1nxbv4n-control, [class*="-control"]');
    
    if (!reactSelectControl) {
      logEntry.status = 'no_control_found';
      logEntry.timeMs = Date.now() - startTime;
      return { success: false, log: logEntry };
    }

    try {
      reactSelectControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      
      reactSelectControl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      reactSelectControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

      await new Promise(r => setTimeout(r, 70));

      const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], div[id*="option"]'));
      const approveOption = menuOptions.find(opt => {
        const t = (opt.innerText || opt.textContent || '').trim().toLowerCase();
        return t === 'approve' || t === 'approved';
      });

      if (approveOption) {
        approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        logEntry.method = 'react_select_click';
        logEntry.status = 'approved';
      }

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
  // --- Section 6: Tier 2 - 3-Row Medical Evaluation Checklist ---
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
  // --- Section 7: Tier 3 - Case-Level Decision Action* Dropdown ---
  // =========================================================================

  async function setCaseLevelActionToApprove() {
    const startTime = Date.now();
    const log = { target: 'case_level_action', status: 'pending', timeMs: 0 };

    const textarea = document.querySelector('textarea');
    if (!textarea) {
      log.status = 'no_textarea_found';
      return { success: false, log };
    }

    const section = textarea.closest('.row, form, div')?.parentElement || document.body;
    const nonTableControls = Array.from(section.querySelectorAll('.css-1nxbv4n-control, [class*="-control"], select')).filter(c => !c.closest('table'));
    const targetControl = nonTableControls.pop() || Array.from(document.querySelectorAll('.css-1nxbv4n-control, [class*="-control"]')).filter(c => !c.closest('table')).pop();

    if (!targetControl) {
      log.status = 'control_not_found';
      return { success: false, log };
    }

    try {
      highlightElement(targetControl);
      targetControl.scrollIntoView({ block: 'center' });

      targetControl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      targetControl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

      await new Promise(r => setTimeout(r, 90));

      const menuOptions = Array.from(document.querySelectorAll('[class*="-option"], [role="option"], div'));
      const approveOption = menuOptions.find(el => {
        const t = (el.innerText || el.textContent || '').trim().toLowerCase();
        return t === 'approve' || t === 'approved';
      });

      if (approveOption) {
        approveOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        approveOption.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        log.status = 'approved';
      } else {
        const input = targetControl.querySelector('input');
        if (input) {
          input.focus();
          dispatchFrameworkValueChange(input, 'Approve');
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          log.status = 'approved_via_keyboard';
        }
      }

      await new Promise(r => setTimeout(r, 60));
      const finalText = (targetControl.querySelector('[class*="singleValue"]')?.innerText || targetControl.innerText || '').trim();
      log.finalText = finalText;
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
  // --- Section 8: Tier 4 - Precision Summary Amount Extractor & Remarks ---
  // =========================================================================

  function setCaseLevelRemarks() {
    const startTime = Date.now();
    const log = { target: 'case_level_remarks', status: 'pending', text: '', extractedAmount: '', timeMs: 0 };

    const textarea = document.querySelector('textarea.form-control, textarea[placeholder*="Type here"], textarea[maxlength="500"], textarea');
    if (!textarea) {
      log.status = 'textarea_not_found';
      log.timeMs = Date.now() - startTime;
      return { success: false, log };
    }

    const approvedAmount = extractClaimAmountApproved();
    log.extractedAmount = approvedAmount;

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
  // --- Section 9: Unified 4-Tier Runner & Diagnostic Store ---
  // =========================================================================

  async function runDataEntryProAutomation(config = {}) {
    const targetIndices = config.indices && Array.isArray(config.indices) && config.indices.length > 0 
      ? config.indices 
      : 'ALL';

    const tableResult = await approveTableItems(targetIndices);
    const radioResult = checkYesRadioButtons();
    const caseActionResult = await setCaseLevelActionToApprove();
    const remarksResult = setCaseLevelRemarks();

    const isSuccess = tableResult.success && radioResult.success && caseActionResult.success;
    const msg = `Approved ${tableResult.approvedCount}/${tableResult.totalTargeted} table rows, checked ${radioResult.checkedCount} Yes radios, set Case Action to "${caseActionResult.log?.finalText || 'Approve'}", and set Remarks to "${remarksResult.text}"!`;
    
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

    // Update HUD display post-approval
    if (window.__DATA_ENTRY_PRO_UPDATE_HUD__) {
      window.__DATA_ENTRY_PRO_UPDATE_HUD__();
    }

    return diagnosticReport;
  }

  // =========================================================================
  // --- Section 10: Dynamic Island Claims Auditor HUD Component ---
  // =========================================================================

  function createDynamicIslandHUD() {
    if (document.getElementById('data-entry-pro-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'data-entry-pro-hud';

    // Position memory
    let savedPos = { right: 24, top: 24 };
    try {
      const stored = localStorage.getItem('dep_hud_pos');
      if (stored) savedPos = JSON.parse(stored);
    } catch (e) {}

    hud.style.cssText = `
      position: fixed;
      ${savedPos.left !== undefined ? `left: ${savedPos.left}px;` : `right: ${savedPos.right || 24}px;`}
      top: ${savedPos.top !== undefined ? savedPos.top : 24}px;
      z-index: 2147483646;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      user-select: none;
      cursor: grab;
      transition: box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.25s ease;
      opacity: 0.85;
    `;

    hud.innerHTML = `
      <style>
        #data-entry-pro-hud:hover {
          opacity: 1 !important;
          border-color: rgba(52, 211, 153, 0.35);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.6), 0 0 20px rgba(52, 211, 153, 0.25);
        }
        .dep-hud-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .dep-hud-icon {
          width: 20px;
          height: 20px;
          background: #059669;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: white;
        }
        .dep-amount-chip {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }
        .dep-amount-chip:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .dep-amount-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          font-weight: 700;
        }
        .dep-amount-val {
          font-size: 14px;
          font-weight: 800;
          color: #34d399;
          font-variant-numeric: tabular-nums;
        }
        .dep-amount-val.eval {
          color: #f8fafc;
        }
        .dep-hud-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.12);
        }
        .dep-hud-btn {
          background: linear-gradient(135deg, #059669, #10b981);
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        }
        .dep-hud-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
        }
        .dep-hud-btn:active {
          transform: translateY(1px);
        }
        .dep-hud-close {
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .dep-hud-close:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.1);
        }
        .dep-pulse-update {
          animation: depPulse 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes depPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(52, 211, 153, 0); }
          50% { transform: scale(1.04); box-shadow: 0 0 25px rgba(52, 211, 153, 0.6); }
          100% { transform: scale(1); box-shadow: 0 12px 36px rgba(0,0,0,0.45); }
        }
      </style>

      <div class="dep-hud-badge">
        <span class="dep-hud-icon">⚡</span>
      </div>

      <!-- Claimed Amount Chip (Primary) -->
      <div class="dep-amount-chip" id="depClaimedChip" title="Click to copy Claimed Amount">
        <span class="dep-amount-label">Claimed Billed</span>
        <span class="dep-amount-val" id="depClaimedVal">₹ --</span>
      </div>

      <div class="dep-hud-divider"></div>

      <!-- Evaluated Approved Amount Chip -->
      <div class="dep-amount-chip" id="depApprovedChip" title="Click to copy Approved Amount">
        <span class="dep-amount-label">Evaluated</span>
        <span class="dep-amount-val eval" id="depApprovedVal">₹ --</span>
      </div>

      <div class="dep-hud-divider"></div>

      <!-- 1-Click Approve Button -->
      <button class="dep-hud-btn" id="depHudApproveBtn" title="Full 4-Tier Approval (Alt+Shift+D)">
        <span>⚡ Approve</span>
      </button>

      <!-- Close / Toggle -->
      <span class="dep-hud-close" id="depHudCloseBtn" title="Hide HUD (Press Alt+H to reopen)">✕</span>
    `;

    document.body.appendChild(hud);

    // =========================================================================
    // HUD Event Handlers: Dragging & Persistence
    // =========================================================================
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    hud.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.dep-amount-chip') || e.target.closest('.dep-hud-close')) return;
      isDragging = true;
      hud.style.cursor = 'grabbing';
      startX = e.clientX;
      startY = e.clientY;
      const rect = hud.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      hud.style.right = 'auto';
      hud.style.left = `${initialLeft}px`;
      hud.style.top = `${initialTop}px`;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Screen boundary constraints
      newLeft = Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, newTop));

      hud.style.left = `${newLeft}px`;
      hud.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      hud.style.cursor = 'grab';
      const rect = hud.getBoundingClientRect();
      localStorage.setItem('dep_hud_pos', JSON.stringify({ left: rect.left, top: rect.top }));
    });

    // Copy to clipboard handlers
    document.getElementById('depClaimedChip')?.addEventListener('click', () => {
      const txt = document.getElementById('depClaimedVal')?.innerText?.replace(/[₹,\s]/g, '') || '';
      if (txt && txt !== '--') {
        navigator.clipboard.writeText(txt);
        showOnScreenNotification('Copied', `Claimed Amount (${txt}) copied to clipboard!`, true);
      }
    });

    document.getElementById('depApprovedChip')?.addEventListener('click', () => {
      const txt = document.getElementById('depApprovedVal')?.innerText?.replace(/[₹,\s]/g, '') || '';
      if (txt && txt !== '--') {
        navigator.clipboard.writeText(txt);
        showOnScreenNotification('Copied', `Approved Amount (${txt}) copied to clipboard!`, true);
      }
    });

    // 1-Click Approve Trigger from HUD
    document.getElementById('depHudApproveBtn')?.addEventListener('click', () => {
      runDataEntryProAutomation();
    });

    // Hide HUD button
    document.getElementById('depHudCloseBtn')?.addEventListener('click', () => {
      hud.style.display = 'none';
      chrome.storage?.local?.set({ hudVisible: false });
    });

    // =========================================================================
    // HUD Live Data Sync & Reactive Observer
    // =========================================================================
    let lastClaimed = '';
    let lastApproved = '';

    function updateHUDData() {
      const claimed = extractClaimedAmount();
      const approved = extractClaimAmountApproved();

      const claimedEl = document.getElementById('depClaimedVal');
      const approvedEl = document.getElementById('depApprovedVal');

      if (claimedEl && claimed) {
        claimedEl.innerText = `₹ ${claimed}`;
      } else if (claimedEl && !claimed) {
        claimedEl.innerText = `₹ --`;
      }

      if (approvedEl && approved) {
        approvedEl.innerText = `₹ ${approved}`;
      } else if (approvedEl && !approved) {
        approvedEl.innerText = `₹ --`;
      }

      // Flash pulse if new case data detected
      if ((claimed && claimed !== lastClaimed) || (approved && approved !== lastApproved)) {
        lastClaimed = claimed;
        lastApproved = approved;
        hud.classList.remove('dep-pulse-update');
        void hud.offsetWidth; // Force reflow
        hud.classList.add('dep-pulse-update');
      }
    }

    window.__DATA_ENTRY_PRO_UPDATE_HUD__ = updateHUDData;

    // Initial update
    updateHUDData();

    // Attach MutationObserver for Single Page Application live reactivity
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateHUDData, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Check visibility preference & initialize HUD
  chrome.storage?.local?.get(['hudVisible'], (res) => {
    if (res?.hudVisible !== false) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDynamicIslandHUD);
      } else {
        createDynamicIslandHUD();
      }
    }
  });

  // Shortcut listener for Alt+H (Toggle HUD visibility)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      const hud = document.getElementById('data-entry-pro-hud');
      if (hud) {
        const isHidden = hud.style.display === 'none';
        hud.style.display = isHidden ? 'flex' : 'none';
        chrome.storage?.local?.set({ hudVisible: isHidden });
        if (isHidden && window.__DATA_ENTRY_PRO_UPDATE_HUD__) window.__DATA_ENTRY_PRO_UPDATE_HUD__();
      } else {
        createDynamicIslandHUD();
        chrome.storage?.local?.set({ hudVisible: true });
      }
    }
  });

  // Global API
  window.DataEntryPro = {
    scanTableInfo,
    approveTableItems,
    checkYesRadioButtons,
    setCaseLevelActionToApprove,
    setCaseLevelRemarks,
    extractClaimedAmount,
    extractClaimAmountApproved,
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

    if (request.action === 'TOGGLE_HUD') {
      const hud = document.getElementById('data-entry-pro-hud');
      if (hud) {
        const isHidden = hud.style.display === 'none';
        hud.style.display = isHidden ? 'flex' : 'none';
        chrome.storage?.local?.set({ hudVisible: isHidden });
        sendResponse({ status: 'COMPLETED', visible: isHidden });
      } else {
        createDynamicIslandHUD();
        chrome.storage?.local?.set({ hudVisible: true });
        sendResponse({ status: 'COMPLETED', visible: true });
      }
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

  console.log('[Data Entry Pro v1.3.0] Dynamic Island HUD Active.');
})();
