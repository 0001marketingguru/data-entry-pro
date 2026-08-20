# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.1] - 2026-08-20

### Added
- **🎯 4-Tier Unified Approval Engine**:
  - **Tier 1**: Sequential Table Row approvals (`"Approve"` across all 11+ rows).
  - **Tier 2**: 3-Row Medical Evaluation Checklist (`"Yes"` radio buttons).
  - **Tier 3**: Overall Case-Level Decision **`Action*`** dropdown (`"Approve"`).
  - **Tier 4**: Standard Clinical Remarks Auto-Population (`"CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS Rs <amount>"`).
- **Dynamic Amount Extractor**: Extracts approved claim amounts from the portal summary to populate the remarks template automatically.

---

## [1.2.0] - 2026-08-20

### Added
- **⚡ Zero-Click In-Browser Auto-Reload**: Introduced `reload_signal.json` signal bridge in `background.js`. Whenever `update.bat` or `rollback.bat` runs, the Chrome extension automatically reloads itself in memory with **0 clicks** required.
- **🔄 1-Click Rollback Script (`rollback.bat`)**: Automatically restores the previous working snapshot and triggers an instant Chrome auto-reload.
- **🛡️ Automated Backup Snapshotting & Pruning**: `update.bat` automatically creates `.zip` archives of the previous version in `backups/` and auto-prunes to retain the last 3 safe restore points.

---

## [1.1.3] - 2026-08-20

### Added
- **Sequential Row Execution Loop**: Robust row-by-row async execution with menu polling delay and keyboard `ArrowDown` + `Enter` fallback to ensure every single row (Rows 1 through 11+) is approved without portal race conditions.
- **📋 1-Click Diagnostic Logger**: Added a "Copy Diagnostic Log for AI" button in the popup to instantly capture and copy complete execution traces to clipboard for debugging with developers/AI.

---

## [1.1.1] - 2026-08-20

### Changed
- **Updated Global Shortcut**: Changed default shortcut to <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> to prevent conflict with browser tab switching shortcuts.
- **Action Column Dropdown Resolver**: Added exact column index and text matching for the PMJAY `Action` column (`Approve` / `Query` / `Reject`).
