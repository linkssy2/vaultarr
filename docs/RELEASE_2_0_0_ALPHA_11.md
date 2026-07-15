# Vaultarr 2.0.0 Alpha 11 — Museum Scan Component Rewrite

Alpha 11 replaces every previous sidebar scan presentation with one self-contained component.

## Changed

- Removed the retired `sidebar-scan-control.css` and `museum-scan.js` implementations.
- Added one Jinja partial: `_museum_scan_pill.html`.
- Added one stylesheet: `museum-scan-pill.css`.
- Added one controller: `museum-scan-pill.js`.
- Reduced the UI state machine to Idle, Scanning, Complete, and Error.
- Kept the control at a fixed 44 px pill size.
- Added a clearly visible Vault-blue light sweep while scanning and one final sweep at completion.
- Kept scan startup isolated to the trusted button click handler; initial page hydration is status-only.
- Removed legacy scan-specific selector overrides from the experimental layout stylesheet.

## Unchanged

The floating-card hover and tilt, card expansion, Focus Mode, navigation motion, Museum filters, manuals, Acquisition Assistant, and scan backend remain unchanged.
