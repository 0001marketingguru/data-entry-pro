# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.3] - 2026-08-21

### Fixed
- **Deterministic React-Select State & Pointer Engine (`setReactSelectValue`)**:
  - Direct React Fiber `onChange` state invocation to eliminate DOM timing issues.
  - Isolated ID prefix matching (e.g. `react-select-3-option-0`) preventing race conditions with table rows.
  - Complete pointer event chain (`pointerdown`, `mousedown`, `mouseup`, `click`, and `Enter` keydown).
  - Guarantees both Row 5 (`LB125`) and the bottom case-level **`Action*`** dropdown switch to **`"Approve"`** reliably.

---

## [1.2.2] - 2026-08-21

### Fixed
- **Multi-Strategy Case-Level Action* Locator**: Enhanced detection of the bottom case decision dropdown with 4 fallback locator strategies.

---

## [1.2.1] - 2026-08-20

### Added
- **🎯 4-Tier Unified Approval Engine**:
  - **Tier 1**: Sequential Table Row approvals (`"Approve"` across all rows).
  - **Tier 2**: 3-Row Medical Evaluation Checklist (`"Yes"` radio buttons).
  - **Tier 3**: Overall Case-Level Decision **`Action*`** dropdown (`"Approve"`).
  - **Tier 4**: Standard Clinical Remarks Auto-Population (`"CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS Rs <amount>"`).
