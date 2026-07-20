# Vaultarr 2.0.0 Alpha 59 — Seamless Sidebar Navigation

Alpha 59 fixes the full-page loading flash that could appear while moving between Home and Settings.

## Changed

- Corrected the sidebar navigation request controller lifecycle for uncached pages.
- Kept successful Home and Settings navigation inside Vaultarr's animated content replacement.
- Updated the smooth-navigation asset version so Docker and browser caches receive the fix immediately.

## Preserved

- Sidebar layout and navigation destinations.
- Home Orbital appearance and animation.
- Settings control-room layout and room transitions.
- Authentication, Museum Scan, Museum Backup, and all protected systems.

## Validation

- Python compilation.
- JavaScript syntax checks.
- Jinja template parsing.
- Repeated live Home-to-Settings and Settings-to-Home navigation with browser-console inspection.
