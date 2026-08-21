# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.1] - 2026-08-21

### Fixed
- **🔒 Runtime Portal Guard**: Content script and HUD automatically sleep on external websites (e.g. `fast.com`, `google.com`, `whatsapp.com`) to guarantee zero memory footprint and zero dummy ID generation.
- **⚡ Infallible "Query ➔ Approve" Row Engine**: Solved race conditions where rows already set to `"Query"` (e.g. Row 5 `CN003`) failed to switch. Features clean element blur, precision listbox option targeting, keyboard navigation (<kbd>ArrowDown</kbd> + <kbd>Enter</kbd>), React Fiber direct prop fallback, and a self-healing verification loop.
- **📊 Strict "Submit-Only" Telemetry Interceptor**: Removed premature logging on draft "Approve" button clicks; claims are logged to the daily vault strictly when the user clicks the final PMJAY **"Submit"** button with a real Case ID.
- **🧹 Vault Auto-Sanitizer**: Automatically cleans any legacy dummy `CASE-` records upon loading.

---

## [1.5.0] - 2026-08-21

### Added
- **📊 Enterprise Audit Vault & Productivity Logger**: Auto-captures Case ID, amounts, deductions, packages, remarks, and speed.
- **📥 1-Click Excel CSV Exporter (RFC-4180 with UTF-8 BOM)**.
- **📱 1-Click WhatsApp / Slack Executive Summary**.
- **🔍 In-Popup Searchable Claims Feed**.

---

## [1.4.0] - 2026-08-21

### Added
- **✍️ Advanced Remarks Decision Engine (`detectCaseRemarkMode`)**: Lab priority rule over consultation.
- **🏝️ Dynamic Island 1-Click Mode Switcher Chips**.
