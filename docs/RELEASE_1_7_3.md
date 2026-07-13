# Vaultarr 1.7.4 — Compact Sidebar Scan Control

This patch refines the Museum scan and search controls in the sidebar.

## Changes

- Restores **Search Museum** to a compact, single-line 52 px control.
- Makes the idle **Scan Museum** control the same size as neighboring sidebar controls.
- Keeps **Scan Museum** directly above **Search Museum**.
- Expands the scan control vertically in place only while a scan is running.
- Smoothly reveals the current stage, percentage, progress bar, and game details.
- Smoothly contracts back into the original button after completion or failure.
- Prevents label wrapping and layout growth in narrow sidebars.
- Leaves the Museum scan engine and protected 1.5.8 interaction systems unchanged.

## Protected systems not changed

- Floating-card hover and tilt
- Card expansion and Focus Mode
- Sidebar page-transition engine
- Universal Search
- Manuals and Acquisition Assistant
- Background Museum scan logic
