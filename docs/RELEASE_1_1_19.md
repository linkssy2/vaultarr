# Vaultarr 1.1.19 — Restored Sidebar Navigation Motion

Vaultarr 1.1.19 restores the smoother, calmer feeling when moving between sidebar sections without bringing back the exposed-HTML flash fixed in 1.1.17.

## Changes

- Uses a snapshot-based crossfade for supported Chromium browsers.
- Keeps the outgoing section visually stable while the destination has already been fetched and prepared.
- Leaves the sidebar in place during navigation.
- Adds gentle vertical movement and a soft fade instead of an abrupt replacement.
- Includes a compatible fallback for browsers without View Transitions.
- Retains the Focus Mode close-flicker repair from 1.1.18.
- Does not alter game-card styling, hover behavior, expansion geometry, Focus Mode layout, or backend logic.

## Validation

JavaScript syntax, Python compilation, and archive integrity were checked before packaging.
