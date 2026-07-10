# Vaultarr 1.1.8 — Mobile Compatibility

This release adds a responsive compatibility layer without changing Vaultarr's backend, routes, authentication, database, or desktop component structure.

## Added
- Mobile top bar with a slide-out navigation drawer.
- Touch-friendly navigation controls and automatic drawer closing.
- Mobile-safe viewport and safe-area support.
- Responsive login layout with a scaled Orbital Vault Core.
- Adaptive cards, forms, grids, search panels, focus mode, and game details.
- Horizontal overflow protection for tables and long metadata.
- Mobile keyboard-friendly 16px form inputs and 44–48px touch targets.
- Reduced-motion compatibility for navigation transitions.

## Stability notes
- Desktop layout remains unchanged above the responsive breakpoints.
- No API, database, scanner, metadata, authentication, or preservation logic was modified.
- Existing templates and components are reused rather than duplicated.
