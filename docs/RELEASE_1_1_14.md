# Vaultarr 1.1.14 — Stable Frontend Rollback

Vaultarr 1.1.14 restores the known-good Vaultarr 1.1.10 frontend and interaction behavior after animation regressions were introduced during the broader 1.1.11 mobile UX overhaul.

## Restored

- Smooth sidebar navigation transitions
- Original section and panel entrance animations
- Known-good card expansion and Focus Mode behavior
- Original tab, overlay, card, and list motion
- Stable desktop interaction behavior
- The mobile compatibility and mobile card-expansion improvements already present in 1.1.10

## Removed from the stable line

This build does not include the broad frontend changes introduced in 1.1.11, 1.1.12, or 1.1.13. Those changes should be reconsidered as smaller, page-scoped mobile updates on a separate development branch.

## Stability scope

No backend, database, authentication, scanning, metadata-provider, preservation, archive, or file-operation behavior was changed. Apart from release metadata and documentation, the application code is the 1.1.10 known-good baseline.

## Upgrade note

The release version advances to 1.1.14 so existing installations and GitHub release history remain sequential. This is an intentional frontend rollback, not a rollback of database state or user data.
