# Vaultarr 1.3.1 — Curator Progress Feedback

This patch makes individual Curator jobs visibly responsive while Vaultarr catalogs a game.

## Changes

- The Curate button immediately enters a disabled working state.
- The game's readiness bar switches to a smooth indeterminate animation for the entire request.
- Friendly stage messages rotate while metadata, artwork, manuals, and readiness are processed.
- Successful jobs animate to their final readiness percentage before the page refreshes.
- Failed jobs remain on screen with a readable error and a retry state.
- Reduced-motion users receive a calm pulsing progress state instead of sweeping motion.

No Curator matching logic, card expansion behavior, Focus Mode behavior, or sidebar navigation motion was changed.
