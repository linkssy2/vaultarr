# Vaultarr 1.3.0 — Museum Curator Engine

This release introduces the first practical version of Vaultarr's automated cataloging workflow.

## Added
- A Curator page that finds incomplete games and processes them in small, controlled batches.
- Automatic queueing after a library scan; network enrichment does not block the scan itself.
- Best-field metadata merging through the existing provider intelligence system.
- Automatic cover/gallery enrichment through the existing media intelligence system.
- High-confidence manual retrieval using the working VideoGameManual and Vimm providers.
- Museum-readiness scoring and clear `Cataloging`, `Needs Review`, and `Museum Ready` states.
- Per-game pause support, metadata-lock protection, error recording, and curator history.
- Manual editing remains available for every game and always takes priority over automation.

## Safety
The Curator never overwrites locked metadata. It does not automatically attach low-confidence manuals. Failed or uncertain work is surfaced for review rather than silently guessed.
