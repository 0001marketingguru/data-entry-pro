# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Planned

### [3.0.0] - Enterprise Batching & AI Assist
- Patient Worklist queue auto-advancement.
- Remote policy & rule synchronization via cloud config.
- Contextual AI clinical justification generator in Remarks.
- Snapshot state capture with one-click undo.

### [2.0.0] - Smart Presets, Remarks & Audit Logging
- Smart Table Scanner (auto-detect by package code prefix, price, or document status).
- Remarks auto-fill library with customizable clinical justification templates.
- Safety preview mode before committing changes.
- Local audit log tracking with CSV/JSON export.

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
  - Global Keyboard Shortcut: `Alt + Shift + A`.
  - Console API: `window.DataEntryPro`.
- **Visual Feedback**: Non-intrusive on-screen floating toast notification and soft green row highlight pulses.
- **Extension Assets**: 16px, 48px, 128px high-resolution icons.
