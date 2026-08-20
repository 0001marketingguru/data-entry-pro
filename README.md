# Data Entry Pro - Enterprise Claims UI Automation (Manifest V3)

Data Entry Pro is an enterprise-grade Google Chrome Extension engineered to automate repetitive tabular dropdown approvals and standard evaluation checklist radio button selections on medical/claims review forms (such as PMJAY Payer portals).

---

## ⚡ Features

1. **Tabular Dropdown Automation (`approveTableItems`)**:
   - Loops through data grid tables (e.g. procedure / package codes).
   - Resolves target row indices dynamically (e.g. `3, 7, 8, 9`).
   - Supports both standard HTML `<select>` elements and custom modern **React-Select / ARIA combobox** components.
   - Converts `"Select"` / placeholder states to `"Approve"` / `"Approved"`.

2. **Standard 3-Row Medical Evaluation Checklist (`checkYesRadioButtons`)**:
   - Automatically detects and targets the 3 standard medical evaluation rows at the bottom of the review form:
     1. *Diagnosis is supported by evidence*
     2. *Case management is as per STG/Claim processing Guidelines*
     3. *Whether duration of treatment matched with STG*
   - Isolates the radio button group per row and selects the `"Yes"` option (`value="Y"`, `id="Yes"`, or associated label `"Yes"`).
   - Includes fallback heuristic grouping to guarantee matching exactly all 3 evaluation checklist items.

3. **Reactive Framework Event Dispatches**:
   - Explicitly bypasses React 16+ prototype value trackers via `Object.getOwnPropertyDescriptor(prototype, 'value' | 'checked').set`.
   - Dispatches bubbling native events (`mousedown`, `mouseup`, `click`, `input`, and `change` with `{ bubbles: true }`) to ensure reactive backend state synchronizers (React, Angular Reactive Forms, Vue, jQuery) capture all automated updates without requiring manual clicks.

4. **Multiple Trigger Modalities**:
   - **Unified One-Click Popup**: Run unified automation or trigger each task individually with customizable index inputs.
   - **Global Keyboard Shortcut**: Press `Alt + Shift + A` on Windows/Mac to run instant zero-click batch automation.
   - **Developer Console Hook**: Accessible directly in the DevTools console via `window.DataEntryPro.runDataEntryProAutomation({ indices: [3, 7, 8, 9] })`.

---

## 🚀 Installation & Setup

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the directory:
   ```
   D:\Coding Projects\Chrome Extension
   ```
5. Pin **Data Entry Pro** to your extension toolbar.

---

## 📂 Project Structure

```
├── manifest.json       # Manifest V3 configuration with activeTab, scripting, storage permissions
├── content.js          # Core content script containing approveTableItems() and checkYesRadioButtons()
├── background.js       # Background service worker handling shortcuts (Alt+Shift+A) & lifecycle
├── popup.html          # Clean popup UI with dynamic row indices input
├── popup.js            # Controller bridging Popup UI to the active tab's Content Script
├── popup.css           # Modern dark-mode UI stylesheet
└── README.md           # Documentation and operational manual
```

---

## ⚠️ Standard Informational Medical Notice

* **General Information Only:** The code patterns and automation workflow logic described here are intended purely as general development and engineering concepts for user interface automation. They do not constitute clinical guidance, regulatory validation, or official medical claims software validation.
* **Label and Workflow Verification:** Please make sure to review the final data states and physical system labels on your live administrative portal to ensure that automated form entry parameters align with standard operating guidelines and data-entry compliance rules.
