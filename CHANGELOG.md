# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.2] - 2026-08-21

### Fixed
- **Multi-Strategy Case-Level Action* Locator**: Enhanced detection of the bottom case decision dropdown with 4 fallback locator strategies (position relative to Remarks, label regex matching `^Action\s*\*?$`, non-table React-Select scan, and indicator SVG click dispatch).
- **Extended Menu Polling**: Increased polling attempts (up to 8 ticks) with keyboard `ArrowDown` and `Enter` event fallback.

---

## [1.2.1] - 2026-08-20

### Added
- **🎯 4-Tier Unified Approval Engine**:
  - **Tier 1**: Sequential Table Row approvals (`"Approve"` across all 11+ rows).
  - **Tier 2**: 3-Row Medical Evaluation Checklist (`"Yes"` radio buttons).
  - **Tier 3**: Overall Case-Level Decision **`Action*`** dropdown (`"Approve"`).
  - **Tier 4**: Standard Clinical Remarks Auto-Population (`"CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS Rs <amount>"`).

---

## [1.2.0] - 2026-08-20

### Added
- **⚡ Zero-Click In-Browser Auto-Reload**: Introduced `reload_signal.json` signal bridge in `background.js`. Whenever `update.bat` or `rollback.bat` runs, the Chrome extension automatically reloads itself in memory with **0 clicks** required.
- **🔄 1-Click Rollback Script (`rollback.bat`)**: Automatically restores the previous working snapshot and triggers an instant Chrome auto-reload.
- **🛡️ Automated Backup Snapshotting & Pruning**: `update.bat` automatically creates `.zip` archives of the previous version in `backups/` and auto-prunes to retain the last 3 safe restore points.
