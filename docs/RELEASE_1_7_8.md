# Vaultarr 1.7.8 — Rebuilt Museum Scan Control

This release removes both competing scan-control style implementations and rebuilds the sidebar scanner from a clean baseline.

## Changes

- Removes all legacy scan-control rules from `museum-experience.css`.
- Replaces `sidebar-scan-control.css` with one isolated implementation.
- Keeps Scan Museum as a compact pill above Search Museum.
- Reveals scan information in a separate calm drawer beneath the pill.
- Uses a two-stage close: details fade, then the drawer folds away.
- Replaces layered button bindings with one delegated click controller.
- Page load and navigation only read scan status; they never begin a scan.
- Displays real API errors inside the drawer.
- Preserves the protected 1.5.8 card, Focus Mode, navigation, search, manuals, and acquisition systems.
