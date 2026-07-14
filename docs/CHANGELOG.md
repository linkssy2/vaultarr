## 2.0.0 Alpha 6

- Compact Plex-style Museum header sizing.
- Added functional Platform, Genre, Category, and Sort dropdown filters.
- Improved responsive alignment for Museum tools.

## 2.0.0 Alpha 3
- Plex-inspired Museum header and reliable sidebar route highlighting.

# Vaultarr 1.7.4 — Compact Sidebar Scan Control

- Standardized Scan Museum and Search Museum as compact 52 px sidebar controls.
- Scan Museum now expands vertically in place while running and contracts smoothly when finished.
- Prevented Search Museum text and shortcut labels from wrapping or enlarging the sidebar footer.
- Preserved the background scan engine and protected UX baseline.

## 1.6.5 — Living Sidebar

- Added smooth entrance, expansion, completion, collapse, and exit motion to the sidebar Museum Scan indicator.
- Added interpolated percentage motion and crossfading status text.
- Added a restrained breathing status dot and completion animation.
- Preserved the background scan engine and protected UX baseline.

## 1.6.1 — The Museum Experience

- Redesigned Home as a calm museum lobby while retaining the Blue V Orbital Core.
- Renamed the standard Library experience to Museum.
- Presented the Curator workflow as Activity and preparation.
- Kept Time Capsule and Milestones visible in Standard Mode.
- Added `/museum` and `/activity` compatibility routes.
- Added `docs/UX_BASELINE.md` to protect the working 1.5.8 interaction systems.
- Preserved Floating Card tilt, Focus Mode, Universal Search, live state, manuals, and smooth navigation.

## 1.5.8 — Floating Card Tilt Restoration

- Removed the reduced-motion override that forcibly disabled the poster-card transform.
- Restored full floating-card lift and pointer-driven 3D tilt while preserving card expansion and cover parallax.
- Kept the safe 1.5.5 performance optimizations that do not interfere with card motion.

# Vaultarr 1.5.8

- Restored floating card hover, tilt, and expansion startup behavior.
- Preserved safe performance optimizations.

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

# 1.3.3
- Added safe per-game removal, optional cached asset cleanup, and scan-ignore restoration.

## 1.2.3
- Fixed Vimm searches to use the provider's all-platform endpoint (`/manual/?p=list&q=...`) before any system-specific fallback.
- Preserved alternate-platform manual results and direct PDF downloads.
- Reduced unnecessary Vimm requests to avoid empty results and throttling.

## 1.2.2
- Fixed Vimm live-search request compatibility and result parsing.
- Added browser-compatible headers/cookie and reduced request concurrency.
- Added support for both known Vimm manual detail URL formats.

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

## Vaultarr 1.1.7

- Fixed the Orbital Vault Core on the login page so its rings, nodes, halo, and core visibly animate.
- Added cache-busting to the login stylesheets so browsers do not reuse the pre-animation CSS.
- Kept ambient motion reduced for accessibility while preserving the requested Vault Core animation.

## Vaultarr 1.1.6

- Replaces the login page's flat square lettermark with the animated Orbital Vault Core.
- Adds the full five-ring orbital field, preservation glyph nodes, halo, rotating energy ring, nebula, and comet motion.
- Uses the same clean sans-serif Vaultarr glyph treatment as the application icons.
- Preserves the corrected alpha-aware login and sidebar icon glow.

# Changelog

## Vaultarr 1.1.5

- Removed the rectangular image shadow that caused black corners around the login icon.
- Replaced box-shadow with alpha-aware drop-shadow so the glow follows the rounded icon itself.
- Added a stronger, slow breathing glow to the sidebar Vaultarr icon.
- Preserved the existing Orbital Vault core and icon artwork.

## Vaultarr 1.1.5

- Uses the exact original sidebar blue-square V as the single app icon source.
- Applies it to the login page, browser tab, bookmarks, pinned shortcuts, PWA and mobile icons.
- Removes dark wrapper, outline, inset-ring and padding artifacts around the brand icon.
- Keeps the animated Orbital Vault core unchanged.
- Adds cache-busted icon references for the 1.1.5 release.

# Vaultarr Changelog

## 1.0.2
- Added Reset Vault danger-zone workflow.
- Reset clears active database/settings/library roots and optionally cached assets.
- Reset returns to first-run onboarding.

# Vaultarr Alpha 22.1

## Provider Intelligence Cleanup
- Provider Intelligence results now reset when a new game card opens.
- Provider Intelligence requests are bound to the active game id, preventing stale results from appearing after switching cards.
- Merge Best Fields is now Merge + Enrich: it applies best metadata, caches the selected cover, attempts to cache top gallery images, and can download a high-confidence manual match.
- Gallery cache refreshes after successful enrichment.

# Vaultarr Alpha 22.2

## Added
- Media Intelligence classification for provider images.
- Cover selection now scores images by role, source, aspect ratio, and title hints.
- Build Best Record prefers real front box art over screenshots, hero images, headers, logos, and backgrounds.
- Gallery auto-cache now prioritizes screenshots/artwork instead of using cover candidates.

## Fixed
- Provider Intelligence should no longer promote random gallery/screenshot images into the box cover slot.


## Alpha 22.3
- Added Build Best Record progress workspace.
- Shows current Provider Intelligence phase while merge/enrich runs.
- Displays metadata, cover, gallery, manual, preservation, and final validation steps.
- Keeps Provider Intelligence stale-result protection and Media Intelligence intact.


## Alpha 22.8
- Added VaultOS-themed scrollbars across the app.
- Scrollbar colors now follow the active theme accent.
- Applied styling to panels, Gallery, Manual Viewer, Provider Intelligence, global search, and scrollable workspaces.
- No backend or database changes.


## Alpha 23.3
- Added Arr-style scheduled backup folder workflow.
- Added backup folder path, schedule, retention, manual Run Backup Now, and backup activity history.
- Added restore directly from scheduled backup folder.
- Soft-deemphasized OAuth cloud accounts in favor of synced folders/NAS/external drives.
