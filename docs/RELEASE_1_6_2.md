# Vaultarr 1.6.2 — Activity Dashboard Rework

Vaultarr 1.6.2 rebuilds the Museum Activity page around resilient live preparation updates.

## Highlights

- Activity controllers now stay attached to preparation jobs even when smooth navigation replaces the page DOM.
- Active jobs automatically reconnect when Activity is reopened.
- Status requests use cache-busting and explicit no-cache response headers.
- Progress moves continuously between confirmed server stages instead of appearing frozen.
- Stage descriptions are now the primary feedback while percentages remain visible.
- Completion updates only the affected row and does not reload the page.
- Museum Progress hover styling is calmer and no longer washes the panel out white.
- Prepare Next 5 can start several selected rows through the live interface.

## Protected UX baseline

The floating card engine, expanded-card behavior, Focus Mode, sidebar navigation motion, Universal Search, manuals, and Acquisition Assistant were not changed.
