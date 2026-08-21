# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-08-21

### Added
- **🏝️ Dynamic Island Claims Auditor HUD**:
  - Live on-screen frosted glass floating pill displaying **Claimed Amount** (`₹ 4,363.00`) vs **Evaluated Amount** (`₹ 4,306.00`).
  - **Reactive Mutation Observer**: Automatically syncs and pulses when advancing to the next case without page refresh.
  - **Smooth Dragging & Magnetic Snapping**: Drag anywhere on dual monitors with persistent position memory in `localStorage`.
  - **1-Click Copy**: Click on either amount chip to instantly copy the raw number with micro-feedback.
  - **Integrated 1-Click Approval Button**: Trigger full 4-tier approval directly from the HUD.
  - **Hotkey Toggle (<kbd>Alt</kbd> + <kbd>H</kbd>)**: Instant show/hide toggle.

---

## [1.2.7] - 2026-08-21

### Fixed
- **Hybrid Regex & DOM Extractor for Evaluated Amount**: Eliminates parent-container traversal ambiguity by using global body regex matching directly against `"Claim amount approved (After technical evaluation) : ₹ <amount>"`.
- **Standard Clinical Remarks**: Properly populates `CASE OF ... AMOUNT IS Rs. 4,306.00/-`.

---

## [1.2.5] - 2026-08-21

### Fixed
- Clean lightweight Case-Level Action* Locator.
