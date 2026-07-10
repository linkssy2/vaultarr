# Vaultarr 1.1.13 — Animation Regression Fix

This focused frontend patch restores the smooth motion behavior that regressed during the 1.1.11 mobile overhaul while retaining the responsive improvements and the 1.1.12 Focus Mode repair.

## Fixed

- Smooth sidebar navigation no longer waits for the network request and then performs a second delay.
- New page content receives a committed layout frame before its entrance animation begins.
- Sidebar, section, panel, tab, card, and orbital motion are restored on mobile.
- Mobile performance rules no longer globally remove glow, depth, particles, and animation layers.
- Touch feedback no longer scales entire cards and conflicts with card transitions.
- Rapid navigation cancels stale requests to prevent overlapping transition states.
- Focus Mode keeps the known-good 1.1.12 expansion and closing behavior.
- Reduced-motion support remains available only when requested by the operating system or browser.

## Stability

No backend routes, database models, authentication, scanning, metadata, preservation, archive, or file-operation logic were changed.
