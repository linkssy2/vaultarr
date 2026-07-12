# Vaultarr 1.5.1 — Advanced Navigation Layout Fix

This patch corrects the sidebar layout after enabling Advanced Mode and keeps Milestones available in the standard experience.

## Fixed

- Advanced-only links now use the same full-width flex layout as the rest of the sidebar.
- Enabling Advanced Mode no longer places Milestones and Preservation on the same line or crowds the Settings link.
- Sidebar spacing and hit targets remain consistent when the mode changes.

## Changed

- Milestones is no longer considered an advanced-only tool. Achievement and collection progress remain visible in both Standard and Advanced Mode.

## Unchanged

Personal Acquisition Indexes, Curator automation, manuals, card expansion, Universal Search, and navigation timing are unchanged.

Production Compose continues to pull `ghcr.io/linkssy2/vaultarr:latest`; the release workflow also publishes `ghcr.io/linkssy2/vaultarr:1.5.1`.
