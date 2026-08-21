# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-08-21

### Added
- **✍️ Advanced Remarks Decision Engine (`detectCaseRemarkMode`)**:
  - **Query Mode (Highest Priority)**: Triggered if any table row or case action is set to `"Query"` (`PLEASE PROVIDE RELEVANT CLINICAL SUMMARY AND INVESTIGATION REPORTS FOR EVALUATION.`).
  - **Investigation Mode (Dominant)**: Triggered if ANY Lab/Diagnostic codes (`LB`, `RD`, `XR`, `CT`, `US`) exist in the claim — even if Consultation `CN` codes are also present (`CASE OF INVESTIGATION SO FINAL APPROVAL AMOUNT IS Rs. <amount>/-`).
  - **Consultation Mode**: Triggered for pure consultation claims where only `CN` codes exist with no lab tests (`CASE OF CONSULTATION SO FINAL APPROVAL AMOUNT IS Rs. <amount>/-`).
- **🏝️ Dynamic Island 1-Click Mode Switcher Chips**:
  - Direct on-screen pills `[ 🔬 Invest | 🩺 Consult | ❓ Query ]` with live auto-highlight and instantaneous Remarks box synchronization upon clicking.

---

## [1.3.0] - 2026-08-21

### Added
- **🏝️ Dynamic Island Claims Auditor HUD**:
  - Live on-screen frosted glass floating pill displaying **Claimed Amount** (`₹ 4,363.00`) vs **Evaluated Amount** (`₹ 4,306.00`).
  - **Reactive Mutation Observer**: Automatically syncs and pulses when advancing to the next case without page refresh.
  - **Smooth Dragging & Position Memory**: Drag anywhere with magnetic edge snapping and localStorage memory.
  - **1-Click Copy**: Click either amount to copy the raw number.
  - **Integrated 1-Click Approval Button**: Trigger full 4-tier approval directly from the HUD.
  - **Hotkey Toggle (<kbd>Alt</kbd> + <kbd>H</kbd>)**: Instant show/hide toggle.

---

## [1.2.7] - 2026-08-21

### Fixed
- **Hybrid Regex & DOM Extractor for Evaluated Amount**: Eliminates parent-container traversal ambiguity by using global body regex matching directly against `"Claim amount approved (After technical evaluation) : ₹ <amount>"`.
