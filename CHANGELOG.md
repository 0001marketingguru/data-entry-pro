# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-08-20

### Changed
- **Updated Global Shortcut**: Changed default shortcut to <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> to prevent conflict with browser tab switching shortcuts.
- **Action Column Dropdown Resolver**: Added exact column index and text matching for the PMJAY `Action` column (`Approve` / `Query` / `Reject`).

---

## [1.1.0] - 2026-08-20

### Added
- **Dynamic Table Scanner (`scanTableInfo`)**: Automatically counts total actionable claim rows and detects individual row statuses on any page without hardcoded bounds.
- **Style A Single Quick-Action Button**: Prominent `⚡ Approve All N Rows & Checklist` button dynamically labeled with the detected row count.
- **Unconditional Batch Approval (Option A & B)**: One-click approval of all detected rows across diverse form layouts.
- **Live Detection Banner**: Visual status badge displaying row counts (e.g. `5 Claim Rows Found (1 approved, 4 pending)`).
- **Collapsible Custom Indices Drawer**: Optional dropdown input for targeted index overrides when needed.

---

## [1.0.0] - 2026-08-20

### Added
- Initial production release of **Data Entry Pro** under Manifest V3.
- **`approveTableItems(indices)`**: Automates tabular action dropdowns from `"Select"` to `"Approve"` for dynamic target row indices.
- **`checkYesRadioButtons()`**: Automatically isolates and checks `"Yes"` on the 3 standard medical evaluation questions at the bottom of the claims review form.
- **Framework Event Hooks**: Direct prototype value and checked setter bypass for React 16+, Angular, and Vue reactive forms.
- **Custom Dropdown Support**: Full compatibility with both native HTML `<select>` and custom React-Select / ARIA combobox implementations.
- **Multi-Trigger Modalities**:
  - Dark-mode Extension Popup with customizable indices input.
  - Global Keyboard Shortcut.
  - Console API: `window.DataEntryPro`.
- **Visual Feedback**: Non-intrusive on-screen floating toast notification and soft green row highlight pulses.
- **Extension Assets**: 16px, 48px, 128px high-resolution icons.
