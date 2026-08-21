# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-08-21

### Added
- **📊 Enterprise Audit Vault & Productivity Logger**:
  - Automatically captures **Case ID**, Claimed Amount, Approved Amount, Deductions, Decision, Package Codes, Processing Time, and Submitted Remarks.
  - Multi-source Case ID extractor (Breadcrumb, Header, URL params).
  - Submit button interceptor with in-place deduplication.
- **📥 1-Click Excel CSV Exporter (RFC-4180 with UTF-8 BOM)**:
  - Download today's complete claims log in a format that opens natively inside Microsoft Excel without character encoding issues or broken rows.
- **📱 1-Click WhatsApp / Slack Executive Summary**:
  - Generates a clean shift briefing with total claims, evaluated value, deductions, and approval rates ready to copy.
- **🔍 In-Popup Searchable Claims Feed**:
  - Live searchable list of processed claims with status chips directly inside the popup.
- **🏝️ Dynamic Island Speedometer Ticker**:
  - Live HUD counter showing today's processed count in real time.

---

## [1.4.0] - 2026-08-21

### Added
- **✍️ Advanced Remarks Decision Engine (`detectCaseRemarkMode`)**:
  - Query Mode (Highest Priority)
  - Investigation Mode (Dominant when any Lab/Diag codes exist)
  - Consultation Mode (Pure consultation claims)
- **🏝️ Dynamic Island 1-Click Mode Switcher Chips**:
  - Switch between `[ 🔬 Invest | 🩺 Consult | ❓ Query ]` directly on the on-screen floating HUD.

---

## [1.3.0] - 2026-08-21

### Added
- **🏝️ Dynamic Island Claims Auditor HUD**:
  - Live on-screen frosted glass floating pill displaying Claimed Amount vs Evaluated Amount.
