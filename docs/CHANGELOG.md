# Vaultarr 1.1.23 — Manual Provider Reliability Update

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
