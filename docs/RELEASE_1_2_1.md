# Vaultarr 1.2.1 — Vimm Live Manual Search Fix

## Added

- Vimm's Lair Manual Project is now a true live-search provider.
- Searches Vimm's server-rendered manual results by title across supported systems.
- Parses numeric manual detail IDs and builds the verified PDF download request.
- Downloads Vimm PDFs directly through `dl.vimm.net` using the documented form parameters.
- Reads the returned filename from `Content-Disposition` and validates the PDF signature before saving.
- Same-platform results receive a ranking bonus, while alternate-platform manuals remain visible.

## Changed

- Vimm is shown as **Live Search** instead of an empty cached provider.
- Refreshing the local manual catalog no longer attempts to index the complete Vimm archive.
- VideoGameManual.com remains the cached provider.
- Vimm detail pages open from search results, while the Download button saves the PDF into Vaultarr.

## Stability

Card UI, expansion, Focus Mode motion, sidebar transitions, metadata, scanning, and preservation scoring were not changed.
