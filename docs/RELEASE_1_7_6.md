# Vaultarr 1.7.6 — Anchored Scan Drawer

This release fixes accidental scan activation and replaces the resizing scan button with a calmer anchored-drawer interaction.

## Changes

- A Museum scan can start only from an explicit click on **Scan Museum**.
- Page load, refresh, smooth navigation, and status polling remain read-only.
- Stale scan states from interrupted processes automatically return to idle.
- The Scan Museum pill stays at a fixed 44 px height.
- A separate details drawer unfolds beneath the pill without moving the header.
- Stage text and progress reveal after the drawer begins opening.
- Completion holds briefly, details fade, and the drawer then folds closed.
- Existing protected card tilt, expansion, Focus Mode, Universal Search, manuals, Acquisition Assistant, and sidebar navigation remain unchanged.

## Updating

Pull the new GHCR image and recreate the container. Perform one hard browser refresh so the 1.7.6 JavaScript and CSS replace cached assets.
