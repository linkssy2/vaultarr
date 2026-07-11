# Vaultarr 1.4.9 — Unified Vault State

Vaultarr 1.4.9 fixes stale library views after adding a game from Universal Search while the user is on another page.

## Changes

- Added a shared browser-session Vault state for game mutations.
- Discover & Add records the new game and marks affected pages as changed.
- Smooth-navigation cache entries are invalidated by route family, including every Library category URL.
- Library loads current data when opened later instead of displaying a prefetched snapshot.
- Existing live card insertion remains active when Library is already visible.
- Home, Collections, Curator, and Discover are also invalidated after library changes.
- No full-page refresh is used.

## Upgrade

Pull the updated GHCR image or deploy this source release, restart the container, and hard-refresh the browser once so the 1.4.9 JavaScript files replace cached assets.
