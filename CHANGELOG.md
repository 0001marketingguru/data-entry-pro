# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.5] - 2026-08-21

### Fixed
- **Clean Lightweight Case-Level Action* Locator**: Directly isolates the non-table Action dropdown located above the Remarks textarea.
- **Direct Event Simulation**: Simple, robust mousedown & click sequence to open and select `"Approve"`.

---

## [1.2.4] - 2026-08-21

### Fixed
- **Document Position Case-Level Action* Locator**: Pinpointed the bottom case decision dropdown using DOM relative position.

---

## [1.2.1] - 2026-08-20

### Added
- **🎯 4-Tier Unified Approval Engine**:
  - **Tier 1**: Sequential Table Row approvals (`"Approve"` across all rows).
  - **Tier 2**: 3-Row Medical Evaluation Checklist (`"Yes"` radio buttons).
  - **Tier 3**: Overall Case-Level Decision **`Action*`** dropdown (`"Approve"`).
  - **Tier 4**: Standard Clinical Remarks Auto-Population (`"CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS Rs <amount>"`).
