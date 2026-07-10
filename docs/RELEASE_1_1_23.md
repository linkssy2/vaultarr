# Vaultarr 1.1.23 — Manual Provider Reliability Update

This release replaces unreliable broad manual searches with a focused two-provider workflow.

## Highlights

- VideoGameManual.com is the primary indexed source.
- Vimm's Lair Manual Project is a conservative manuals-only fallback.
- Searches are platform-aware and confidence-ranked.
- Provider indexes are cached locally to reduce repeat requests.
- Direct downloads are accepted only after PDF validation.
- Broad Google and replacementdocs search entries were removed from the default interface.
- The README retains the correct GHCR production Docker Compose instructions.

## Important limitation

Vimm does not advertise a documented public API. Vaultarr therefore only follows same-domain links clearly associated with the Manual Project. When a direct PDF cannot be safely identified, Vaultarr opens the Manual Project source page instead of attempting an unsupported download.

## Unchanged

Card UI, Focus Mode expansion, sidebar animation, database behavior, metadata providers, scanning, preservation, and archive logic are unchanged.
