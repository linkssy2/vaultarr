# 1.4.4 — Universal Search & Add

- Replaced the separate search-to-add page with one Universal Search dialog.
- Added **My Museum** and **Discover & Add** modes to the sidebar search.
- Discover mode searches enabled game-information sources and adds a selected release directly to the museum.
- Added an in-search preview with optional folder path and category selection.
- Newly added games are automatically queued for Curator preparation.
- Library **Add Game** now opens the detailed manual-entry form for custom and unmatched titles.
- Existing card, Curator, manual, and navigation behavior remains unchanged.
- Retained the published GHCR image in all production Docker examples.

# 1.4.3 — Search-to-Add Games

- Reworked **Add Game** into a search-first workflow.
- Searches all enabled game-information sources or one selected source.
- Optional platform hints improve ranking without hiding other releases.
- Added a polished result list with covers, source labels, and match confidence.
- Added a preview dialog showing the selected release before it is created.
- One-click add stores the provider record, downloads available cover art, and queues Curator preparation.
- Preserved the full manual-entry form as a fallback for fan games, prototypes, homebrew, and obscure releases.
- Added responsive mobile layouts and reduced-motion support.
- Retained the published GHCR image in all production Docker examples.

# 1.4.2 — Smooth Curator Progress

- Interpolates Curator progress continuously between live server updates.
- Smoothly animates both the bar and percentage from the first click through completion.
- Removes visible polling jumps without changing curator matching or provider behavior.
- Preserves the production GHCR Docker setup and release documentation.

# 1.4.1 — Live Curator Progress

- Curator jobs now start asynchronously and return control to the browser immediately.
- Added per-game progress and status endpoints.
- Progress reflects real curator stages instead of requiring a page refresh.
- Completed rows update in place with no full-page reload or HTML flash.
- Added unobtrusive success and failure notifications.
- Preserved the simplified Curator Experience, manual providers, card expansion, and navigation motion.

# 1.4.0 — The Curator Experience

- Added Standard and Advanced interface modes.
- Simplified primary navigation and user-facing Curator language.
- Added automatic Curator queue preference for newly scanned games.
- Added one-at-a-time automatic preparation from the Curator page.
- Moved provider, cache, and diagnostic surfaces behind Advanced Mode.
- Preserved manual editing, metadata locks, card behavior, and established motion systems.

# 1.3.5 — Curator Determinate Progress

- Curate now reacts immediately without requiring a page refresh.
- Replaced the indeterminate bar sweep with a smooth percentage-based fill.
- Added staged progress labels and continuously updating percentages while cataloging runs.
- Preserved the server-provided final readiness score as the authoritative result.

# 1.3.4 — Expanded Card Game Actions

- Added Actions tab and safe Deaccession flow directly inside expanded game cards.
- Original game files are never deleted.
- Added smooth card removal after a successful catalog deletion.

# 1.3.4
- Added safe per-game removal, optional cached asset cleanup, and scan-ignore restoration.

# Changelog

## 1.3.2 — UI Component Polish

- Replaced browser-native checkboxes with unified VaultToggle and VaultCheckbox styling.
- Increased control size, spacing, and touch targets throughout Vaultarr.
- Added smooth hover, press, focus, enable, and disable states.
- Standardized controls across Studio, Time Capsule, game editing, and manual entry.
- Preserved existing Curator, card, Focus Mode, and sidebar behavior.

## 1.3.1 — Curator Progress Feedback
- Added a smooth visible loading bar while an individual game is being curated.
- Added rotating cataloging-stage messages and a disabled working button state.
- Added completion and retry feedback without changing Curator matching behavior.
- Added reduced-motion support for the new progress indicator.

## 1.2.4
- Fixed Vimm PDF downloads that returned HTTP 400 when a manual was scanned below the hardcoded 200 DPI request.
- Vaultarr now reads each Vimm manual detail page, uses that manual's actual maximum source DPI, preserves provider cookies, and retries lower supported resolutions when necessary.
- Kept global Vimm searching, cross-platform results, local manual caching, card expansion, Focus Mode, and sidebar motion unchanged.

## 1.2.3
- Fixed Vimm searches to use the provider's all-platform endpoint (`/manual/?p=list&q=...`) before any system-specific fallback.
- Preserved alternate-platform manual results and direct PDF downloads.
- Reduced unnecessary Vimm requests to avoid empty results and throttling.

## 1.2.2
- Fixed Vimm live-search request compatibility and result parsing.
- Added browser-compatible headers/cookie and reduced request concurrency.
- Added support for both known Vimm manual detail URL formats.

# Changelog

## 1.2.2

- Added live Vimm Manual Project search across supported systems.
- Added direct Vimm PDF downloading with response filename and PDF validation.
- Changed Vimm provider status from empty cache to Live Search.
- Preserved cross-platform manual results and same-platform ranking bonuses.

# Vaultarr 1.2.0 — Local Manual Catalog

## Added
- SQLite-backed local manual catalog inspired by LaunchBox metadata caching.
- Catalog ingestion for VideoGameManual.com and manuals-only Vimm Manual Project links.
- Full-catalog title search with fuzzy matching.
- Cross-platform results: platform improves ranking but never filters manuals out.
- Manual catalog status, refresh, and clear controls in Settings.
- Automatic first-search catalog build and seven-day stale refresh behavior.
- API endpoints for catalog status, search, refresh, and clear.

## Preserved
- Exact 1.1.21 sidebar motion.
- Card UI, card expansion, Focus Mode, and the card-close flicker repair.
- Correct production Docker Compose using `ghcr.io/linkssy2/vaultarr:latest`.

## Notes
The catalog stores provider listings only. Manual PDFs are downloaded only after a user selects a result. Provider availability and site structure can affect catalog coverage.


# Vaultarr 1.2.0 — Manual Provider Reliability Update

## Added
- Vimm's Lair Manual Project as a manuals-only fallback provider.
- Conservative same-domain crawling limited to manual-related pages.
- Weekly local caching for Vimm manual catalog results when direct PDFs are exposed.
- Platform-aware, confidence-ranked results across dedicated manual sources.

## Improved
- VideoGameManual.com remains the primary indexed provider and now checks an additional legacy index page variant.
- Removed broad Google/replacementdocs searches from the default manual workflow.
- Updated provider descriptions, source links, and manual search controls.
- Updated README with manual-provider behavior and the production GHCR Docker setup.

## Safety
- Vimm integration blocks Vault, ROM, ISO, and download-area routes.
- Downloads still require a direct PDF URL, a valid `%PDF-` signature, and remain capped at 250 MB.
- No card UI, Focus Mode expansion, sidebar motion, metadata, database, or preservation behavior was changed.

# Vaultarr 1.1.22 — Active Route Reload Fix

## Fixed

- Clicking the Library category that is already active no longer performs a full browser reload.
- Prevents the raw-HTML flash seen when clicking **All Games** while already viewing **All Games**, and applies the same protection to equivalent active links throughout Vaultarr.
- Keeps the exact 1.1.21 sidebar motion, card UI, card expansion, Focus Mode, and close-flicker fix unchanged.

## Deployment

- The production Compose example now pulls `ghcr.io/linkssy2/vaultarr:latest` instead of using `build: .`.
- README includes Linux, Windows, Dockge, update, and local-development instructions.

# Vaultarr 1.1.22 — Exact Sidebar Motion Restoration

This patch restores the sidebar navigation animation directly from the confirmed 1.1.7 source rather than approximating its appearance.

## Fixed

- Restored the exact 1.1.7 outgoing fade, downward drift, scale, blur, timing, and easing.
- Restored the exact 1.1.7 entrance animation and handoff timing.
- Sidebar motion now begins immediately on click, matching the original interaction flow.
- Retained the newer prepared-page loading, page cache, script restoration, and HTML-flash protection.
- Preserved the 1.1.18 Focus Mode close-flicker repair.
- Card UI, hover behavior, expansion geometry, Focus Mode layout, and backend behavior remain unchanged.

# Vaultarr 1.1.22 — Sidebar Motion Restoration

## Fixed
- Restored the original smooth 1.1.7-style motion specifically for sidebar navigation.
- Sidebar destinations still load and prepare before the visual swap, preventing the old exposed-HTML flash.
- Removed the native snapshot transition from sidebar clicks, which was making section changes feel abrupt.
- Preserved the 1.1.17 rendering improvements and the 1.1.18 Focus Mode close-flicker fix.
- Left card styling, hover behavior, expansion geometry, Focus Mode, and backend logic unchanged.

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

## 1.3.0
- Added the Museum Curator Engine, queue, readiness score, history, safe metadata-lock behavior, and high-confidence automated enrichment.
