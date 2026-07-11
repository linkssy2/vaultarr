# Vaultarr 1.2.0 — Local Manual Catalog

## Added
- SQLite-backed local manual catalog inspired by LaunchBox metadata caching.
- Catalog ingestion for VideoGameManual.com and manuals-only Vimm Manual Project links.
- Full-catalog title search with fuzzy matching.
- Cross-platform results: platform improves ranking but never filters manuals out.
- Manual catalog status, refresh, and clear controls in Settings.
- Automatic first-search catalog build and seven-day stale refresh behavior.
- API endpoints for catalog status, search, refresh, and clear.

## Preserved
- Exact 1.1.21 sidebar motion.
- Card UI, card expansion, Focus Mode, and the card-close flicker repair.
- Correct production Docker Compose using `ghcr.io/linkssy2/vaultarr:latest`.

## Notes
The catalog stores provider listings only. Manual PDFs are downloaded only after a user selects a result. Provider availability and site structure can affect catalog coverage.
