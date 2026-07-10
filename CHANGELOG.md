## Vaultarr 1.1.19

### Restored Sidebar Navigation Motion
- Replaced the abrupt content swap with a snapshot-based crossfade when the browser supports the View Transition API.
- Keeps the sidebar fixed while the outgoing section eases away and the prepared destination settles in.
- Preserves background prefetching so animations begin only after the next page is ready.
- Added a calmer fallback transition for browsers without View Transitions.
- Preserved the 1.1.18 Focus Mode close flicker fix and left card UI, card expansion, and backend behavior unchanged.

## Vaultarr 1.1.18

### Smooth Rendering & Transition Engine
- Kept the current screen visible until the destination view is fully fetched and parsed.
- Removed full-page flashes when switching Library categories and other internal sections.
- Extended smooth navigation to ordinary same-origin page links rather than sidebar links only.
- Added safe destination prefetching, stale-request cancellation, Back/Forward support, and page-local script restoration.
- Preserved the 1.1.7 card UI and Focus Mode expansion engine without modifying their animation geometry or timing.
- Left all backend, database, metadata, scanning, preservation, and archive behavior unchanged.

# Changelog

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
