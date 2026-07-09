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
