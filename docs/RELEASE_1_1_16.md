# Vaultarr 1.1.16 — Stable Rollback to 1.1.7

Vaultarr 1.1.16 restores the complete known-good Vaultarr 1.1.7 source as the stable application baseline.

## Restored

- Original pre-mobile desktop layouts and responsive behavior
- Smooth sidebar, page, section, panel, tab, overlay, and card animations
- Original Focus Mode and card-expansion behavior
- Animated Orbital Vault Core on the login page
- Corrected login icon transparency and sidebar icon glow
- Original templates, stylesheets, and frontend JavaScript from 1.1.7

## Rollback scope

No frontend code from versions 1.1.8 through 1.1.15 is included. Only release metadata, cache-busting references, changelog entries, and this release document were updated for 1.1.16.

## Backend stability

The rollback uses the complete 1.1.7 project baseline. Users upgrading from later builds should back up their Vaultarr configuration and database before deployment.
