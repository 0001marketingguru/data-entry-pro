# Changelog - Data Entry Pro

All notable changes to the **Data Entry Pro** Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.7] - 2026-08-21

### Fixed
- **Hybrid Regex & DOM Extractor for Evaluated Amount**: Eliminates parent-container traversal ambiguity by using global body regex matching directly against `"Claim amount approved (After technical evaluation) : ₹ <amount>"` (e.g. `4,306.00`).
- **Standard Clinical Remarks**: Properly populates `CASE OF ... AMOUNT IS Rs. 4,306.00/-`.

---

## [1.2.6] - 2026-08-21

### Added
- Precision amount extractor for evaluated amount.

---

## [1.2.5] - 2026-08-21

### Fixed
- Clean lightweight Case-Level Action* Locator.
