# Vaultarr 1.1.10 — Mobile Card Expansion

This release rebuilds the expanded game-card experience for phones without changing backend, database, scanning, metadata, or preservation behavior.

## Fixed
- Expanded cards now open as a dedicated full-screen mobile view instead of stretching the desktop card animation.
- Removed the card-scatter effect on phones, reducing visual glitches and accidental horizontal movement.
- Added a compact, viewport-aware artwork area so the cover no longer dominates the entire screen.
- Added a fixed close control that remains reachable while scrolling.
- Made the tab row sticky and horizontally scrollable for easier one-handed navigation.
- Improved title, path, statistics, artwork metadata, spacing, and safe-area handling.
- Expanded cards now open at the Overview tab and return to the top consistently.
- Closing on mobile uses a short fade/slide instead of attempting to shrink back into an off-screen card.

## Stability
No API, database, authentication, scanning, metadata-provider, or preservation logic was changed.
