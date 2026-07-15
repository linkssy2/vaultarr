# Vaultarr 2.0.0 Alpha 9 — Truthful Scan Status

This focused patch improves the Museum Scan control without changing the Museum page or protected interaction systems.

## Changes

- Removes the rotating refresh icon.
- Uses a restrained blue pulse to communicate active work.
- Adds a three-second backend heartbeat during the full scan lifecycle, including long provider requests.
- Treats a scan as interrupted if its worker heartbeat or status connection becomes stale for more than 15 seconds.
- Returns interrupted scans to the idle button instead of leaving a partial percentage on screen.
- Preserves the fixed-width scan pill, Search Museum control, Museum grid, floating-card hover/tilt, card expansion, Focus Mode, navigation, manuals, and Acquisition Assistant.

## Updating

Restart the Vaultarr container and hard-refresh the browser once so the Alpha 9 JavaScript and CSS replace older cached assets.
