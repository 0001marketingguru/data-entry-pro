# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-08-20

### Added
- **⚡ Zero-Click In-Browser Auto-Reload**: Introduced `reload_signal.json` signal bridge in `background.js`. Whenever `update.bat` or `rollback.bat` runs, the Chrome extension automatically reloads itself in memory with **0 clicks** required.
- **🔄 1-Click Rollback Script (`rollback.bat`)**: Automatically restores the previous working snapshot and triggers an instant Chrome auto-reload.
- **🛡️ Automated Backup Snapshotting & Pruning**: `update.bat` automatically creates `.zip` archives of the previous version in `backups/` and auto-prunes to retain the last 3 safe restore points.
- **In-Extension GitHub Update Checker**: Real-time update notifications inside the popup UI.
- **1-Click Desktop Shortcut Installer (`setup_desktop.bat`)**: Places a 1-click update icon directly on the user's Desktop.

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

---

## [1.1.0] - 2026-08-20

### Added
- **Dynamic Table Scanner (`scanTableInfo`)**: Automatically counts total actionable claim rows and detects individual row statuses on any page without hardcoded bounds.
- **Style A Single Quick-Action Button**: Prominent `⚡ Approve All N Rows & Checklist` button dynamically labeled with the detected row count.
- **Unconditional Batch Approval (Option A & B)**: One-click approval of all detected rows across diverse form layouts.
- **Live Detection Banner**: Visual status badge displaying row counts.
