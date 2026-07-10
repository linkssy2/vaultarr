# Vaultarr 1.1.15 — Stable Frontend Rollback to 1.1.9

Vaultarr 1.1.15 restores the complete frontend from the known-good 1.1.9 release after issues were found in the later mobile and card-expansion work.

## Restored

- Vaultarr 1.1.9 card behavior and expansion foundation
- Original 1.1.9 sidebar and page animations
- Original 1.1.9 section, tab, panel, overlay, and list transitions
- Original 1.1.9 responsive/mobile refinement layer
- Original 1.1.9 page layouts and interaction behavior

## Not included

The frontend changes introduced in versions 1.1.10 through 1.1.14 are intentionally excluded from this release.

## Stability

No backend, database, authentication, scanning, metadata-provider, preservation, archive, API, or file-operation logic was modified. Only release metadata, cache-busting values, changelog entries, and this release document differ from the 1.1.9 baseline.
