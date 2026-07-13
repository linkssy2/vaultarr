# Changelog

## 1.7.7 - Scan Control Click Repair

- Restored the Scan Museum button after the 1.7.6 explicit-action guard blocked valid clicks in some deployments.
- Kept page load and status polling read-only, so refreshes still cannot start a scan.
- Added resilient direct and delegated click binding for smooth-navigation page swaps.
- Displays the server error inside the scan drawer when a scan cannot start.
- Preserved the anchored drawer animation and protected 1.5.8 UX baseline.

# Vaultarr 1.7.6 — Anchored Scan Drawer

- Prevented page refreshes and navigation from starting Museum scans.
- Added explicit user-action validation to the scan start endpoint.
- Reconciles stale running states left by interrupted containers back to idle.
- Rebuilt the sidebar scan interaction as a fixed pill with an independent drawer.
- Added slower staged reveal, progress wipe, completion hold, and two-phase contraction.
- Preserved the protected 1.5.8 card, Focus Mode, search, manual, and navigation systems.

# Vaultarr 1.7.5 — Calm Scan Drawer

- Reworked the sidebar scan control as a stable pill header with a lower status drawer.
- The header no longer disappears or jumps while scanning.
- Added delayed detail reveal, smooth progress-line entrance, and ordered completion collapse.
- Slowed and softened the expand/contract easing to match Vaultarr's protected UX baseline.
- Preserved the Museum scan engine and all protected card, Focus Mode, navigation, search, manual, and acquisition behavior.

# Vaultarr 1.7.4 — Per-Game Preservation

- Moved preservation status into each game record and the expanded game card.
- Renamed the expanded-card Archive Health tab to Preservation.
- Retired the standalone Preservation navigation page and redirected legacy links to Museum.
- Replaced Milestones' Preserve More action with Improve Your Museum.
- Added a Museum Needs Attention view for incomplete preservation records.
- Preserved the protected 1.5.8 floating-card, expansion, Focus Mode, search, and navigation baseline.

# Changelog

## 1.7.4 — Primary Sidebar Scan Control

- Moved Scan Museum directly above Search Museum in the sidebar.
- Restyled the idle scan control to match Vaultarr's primary blue Enter Museum button.
- Retained the smooth expanding progress state and completion contraction.


## 1.7.4 - Sidebar Museum Scan

- Replaced all page-level Museum scan controls with one permanent sidebar control.
- The button expands in place to show live progress, current stage, and current game.
- On completion, the control briefly shows the result and smoothly contracts back into the Scan Museum button.
- Removed duplicate scan controls from Home and Museum.
- Preserved the protected 1.5.8 card, navigation, Focus Mode, search, manual, and acquisition systems.
# Changelog

## 1.7.4 — Discreet Scan Status

- Removed the duplicate in-page Museum Scan progress banners from Home and Museum.
- Kept one compact scan indicator in the sidebar while a scan runs.
- Blended the indicator into the sidebar with a thinner progress line and softer contrast.
- Added click-to-expand scan details and an automatic fade after successful completion.
- Preserved the background Museum Scan engine and protected 1.5.8 interaction systems.

## 1.7.4 — Background Museum Scan

- Replaced the per-game Activity dashboard with one Plex-style background Museum Scan.
- Added Scan Museum controls to Home and Museum.
- Added a persistent sidebar progress indicator that follows smooth navigation.
- Scans configured folders, updates existing records, detects incomplete games, and prepares them serially in the background.
- Added scan completion summaries and failure status without page reloads.
- Removed Activity from the standard sidebar and Home page.
- Redirected legacy `/activity` and `/curator` routes to Museum.
- Preserved the protected 1.5.8 card, tilt, expansion, Focus Mode, Universal Search, manuals, and navigation systems.

## 1.6.2 — Activity Dashboard Rework

- Reworked stage-based Activity status and restrained progress-panel hover styling.

## 1.6.1 — Live Activity Repair

- Repaired Activity initialization after smooth navigation.

## 1.6.0 — The Museum Experience

- Introduced the Museum-focused navigation and Home lobby.

## 1.5.8 — Floating Card Tilt Restoration

- Removed the reduced-motion override that forcibly disabled the poster-card transform.
- Restored full floating-card lift and pointer-driven 3D tilt while preserving card expansion and cover parallax.
- Kept the safe 1.5.5 performance optimizations that do not interfere with card motion.

# Changelog

## 1.5.8 — Floating Card Interaction Restoration

- Restored synchronous loading of the original Focus Mode/card controller.
- Removed the capture-phase loader that could swallow the first card interaction.
- Removed `content-visibility` from Library card wrappers because it implicitly contains paint and can clip floating tilt, lift, gloss, and shadows.
- Preserved lazy cover loading, async image decoding, debounced Library search, hidden-tab activity suspension, and offscreen optimization for non-card sections.
- Kept the Acquisition Assistant tab and all 1.5.4+ functionality.

# Vaultarr 1.5.6 — Floating Card Motion Restoration

- Restores the exact floating-card hover and tilt controller from 1.5.4.
- Removes paint/style containment from library cards so lift, depth, gloss, cover parallax, and shadows render correctly.
- Retains lazy image loading, debounced search, hidden-tab suspension, selective Focus Mode loading, and offscreen optimizations elsewhere.

# Changelog

## 1.5.6 - Performance Foundation

- Replaced per-card global listeners with one delegated, frame-throttled hover controller.
- Added lazy image loading and asynchronous decoding across library-heavy pages.
- Added offscreen rendering containment for long grids and timeline content.
- Debounced library search to reduce main-thread work while typing.
- Pauses nonessential visual activity when the browser tab is hidden.
- Loads Focus Mode JavaScript only when a page contains expandable game cards.
- Preserves existing visuals, card expansion, navigation, Curator, manuals, and Acquisition Assistant behavior.

## 1.5.6 — Expanded Card Acquisition Tab

- Added the Acquisition Assistant directly to the expanded game card tabs.
- Live reference search, exact source-page fallback, final-link saving, and local-file attachment now work without leaving the Library.
- Existing full game details remain available as a secondary management path.
- Preserved Curator, manuals, card expansion, Focus Mode, and navigation behavior.


## 1.5.6 — Live Acquisition Assistant

- Removed Personal Acquisition Index uploads and management.
- Added live Vimm Vault reference searching from each game record.
- Added automatic title/platform ranking and exact source-page discovery.
- Added source-page URL fallback when live search is unavailable.
- Added a user-supplied final-link field and local-file attachment workflow.
- Preserved Curator, manuals, cards, navigation, and metadata behavior.

# 1.5.6 — Advanced Navigation Layout Fix

- Fixed Advanced Mode sidebar links collapsing onto the same line.
- Restored the standard full-width flex layout for every advanced navigation item.
- Moved Milestones into Standard Mode so achievement and collection progress remain visible to all users.
- Preserved Personal Acquisition Indexes, Curator, manuals, card expansion, and navigation motion behavior.

# 1.5.0 — Personal Acquisition Indexes

- Added administrator-uploaded JSON and CSV acquisition catalogs.
- Added local catalog validation, normalization, indexing, search, and management.
- Added game-level acquisition search, source-page handoff, link copying, and local-file attachment.
- Preserved the stable Vaultarr 1.4.10 navigation, cards, Curator, manuals, and Universal Search behavior.
- Updated GHCR publishing to create both `latest` and version-specific image tags.

# 1.4.10 — Navigation Load Consistency

- Prepared sidebar destinations before beginning the exit animation.
- Reused in-flight requests and ignored duplicate clicks to the same route.
- Added a brief cache lifetime while respecting Unified Vault State invalidation.
- Delayed the loading sweep until a request takes longer than 160 ms.
- Added request timeout and graceful full-navigation fallback behavior.
- Preserved existing sidebar motion timing and all current interaction systems.

# 1.4.9 — Unified Vault State

- Added a shared client-side Vault state for library mutations.
- Games added through Discover & Add now invalidate prefetched Library, Home, Collections, Curator, and Discover pages immediately.
- Smooth navigation now bypasses stale cached HTML after a game is added, edited, or removed.
- Opening Library later from another page now fetches the current server state without requiring a browser refresh.
- Preserved live insertion when the user is already viewing Library.
- Added route-family cache invalidation so category-specific Library pages cannot reuse stale counts or cards.
- Kept Universal Search, card expansion, Curator progress, manuals, and navigation motion unchanged.

# 1.4.9 — Navigation Motion Stability

- Fixed the delayed jerk/stutter that appeared after otherwise smooth sidebar page transitions.
- Prevented the interaction repair layer from removing active navigation animation classes mid-transition.
- Added explicit navigation ownership tracking so stale-state recovery only runs after motion has completed.
- Preserved page-specific interaction reinitialization without interrupting the entrance animation.
- Left card expansion, Universal Search, Curator, manuals, and live library synchronization unchanged.

# 1.4.9 — Live Library Synchronization

- Added a lightweight client event system for live application updates.
- Discover & Add now emits a game-added event instead of redirecting or requiring a refresh.
- Added an API-rendered library card endpoint for newly created records.
- New game cards are inserted into the active Library view with a smooth arrival animation.
- Library category totals, search counts, filtering, sorting, hover motion, and card expansion now recognize inserted games immediately.
- Added a global success notification with a direct View action.
- Existing records are handled without duplicate cards.
- Retained the published GHCR image as the default production Docker installation.

# 1.4.6 — Interaction Reliability Repair

- Repaired universal search reopening and mode switching.
- Removed the competing Library Ctrl/Cmd+K handler.
- Prevented invisible search layers from intercepting the rest of the UI.
- Reinitialized card interactions after smooth page swaps.
- Restored reliable hover behavior for game cards and Discovery timeline capsules.
- Added a shared post-navigation interaction cleanup pass.

# 1.4.5 — Universal Search Interaction Fix

- Fixed the search field becoming non-interactive after switching between **My Museum** and **Discover & Add**.
- Search text is preserved when changing modes and the field immediately regains focus.
- Cancelled stale search responses can no longer overwrite the newly selected mode.
- Added explicit control-state restoration for the search field, platform hint, and information-source selector.
- Kept Universal Search, Curator, card expansion, manuals, and navigation behavior otherwise unchanged.

# 1.4.5 — Universal Search & Add

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

## 1.7.4 — Refined Pill Scan Control

- Resized **Scan Museum** and **Search Museum** to match Vaultarr's compact pill controls.
- Reworked the scan transition into a quieter vertical expansion with ordered content fades.
- Reduced scan-card height, padding, and progress-track weight for a cleaner sidebar fit.
- Added a longer, smoother completion contraction so status content fades before the pill returns.
- Preserved the museum scan engine and protected 1.5.8 interaction baseline.
