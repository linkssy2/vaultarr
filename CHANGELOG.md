## [1.1.14] - 2026-07-10

### Restored
- Restored the known-good 1.1.10 frontend as the stable application baseline.
- Restored smooth sidebar, section, panel, tab, overlay, and card animations.
- Restored the proven 1.1.10 mobile card-expansion and Focus Mode behavior.

### Changed
- Removed the broad 1.1.11–1.1.13 frontend overhaul from the stable release line.
- Reserved future mobile UX work for smaller, page-scoped changes that do not alter shared animation systems.
- Updated application, asset-cache, Docker, and release metadata to 1.1.14.

### Stability
- No backend, database, authentication, scanning, metadata, preservation, archive, or file-operation logic changed.

## [1.1.10] - 2026-07-10

### Fixed
- Reworked expanded game cards into a full-screen mobile focus view.
- Added compact mobile artwork sizing, sticky tabs, fixed close control, and safe-area support.
- Disabled desktop card-scatter and reverse-collapse animations on phones.

## 1.1.10 — Mobile Refinement

### Improved
- Expanded mobile layout coverage across all major Vaultarr pages.
- Refined game grids, action rows, forms, filters, modals, tables, and Focus Mode for phones.
- Preserved all desktop and backend behavior.

# Changelog

## 1.1.10 — Mobile Compatibility
- Added a mobile navigation drawer and compact top bar.
- Made the login screen responsive while preserving the animated Orbital Vault Core.
- Added adaptive layouts for cards, forms, focus mode, game details, modals, tables, and search.
- Added safe-area, dynamic viewport, touch-target, and mobile keyboard improvements.
- Kept backend behavior and desktop layouts unchanged.

## 1.1.3
- Rebuilt the official app icon without the dark outer outline.
- Restored the login Orbital Vault core to its original CSS animation.
- Fixed the oversized cropped login icon.
- Removed wrapper borders, backgrounds, and shadows from sidebar and login brand marks.

## 1.1.3 — Branding Consistency

- Restored the original blue rounded-square Vaultarr icon in the sidebar.
- Applied the same official icon to browser favicons, pinned shortcuts, PWA assets, and the login page.
- Added reusable SVG and 512px branding assets.
- Kept the animated Orbital Vault core unchanged.

## Vaultarr 1.0

First public-ready release of Vaultarr.

### Highlights
- Library scanner and Collector Focus game view.
- Metadata Engine with provider intelligence.
- Manual Engine with indexed manual provider support.
- Media Library with covers, gallery images, trailer assets, and cache management.
- Trailer Finder and cinematic Trailer tab.
- Patch Engine for community fixes and compatibility references.
- Preservation Mission Control.
- Smart Collections and Collection Experience.
- Time Capsule backup/export/import workflow.
- First-run onboarding and reset vault workflow.
- Docker-ready structure.

## Previous development builds

Vaultarr moved through the Alpha 1–30 series before the 1.0 release. Detailed historical notes are retained in `docs/` where available.
