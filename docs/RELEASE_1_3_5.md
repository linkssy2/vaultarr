# Vaultarr 1.3.5 — Curator Determinate Progress

This patch replaces the Curator's indeterminate sweep with immediate, smooth, percentage-based progress feedback.

## Changes

- Curate reacts immediately when pressed.
- The readiness bar resets for a fresh curation pass and fills smoothly through visible cataloging stages.
- The percentage updates continuously while Vaultarr works.
- Progress pauses near completion until the server returns the authoritative readiness score.
- The final score is displayed before the page refreshes.
- Previously Museum Ready games now still show a visible fresh pass when manually curated again.
- Existing Curator behavior, matching, manuals, card expansion, Focus Mode, and sidebar navigation were not changed.
