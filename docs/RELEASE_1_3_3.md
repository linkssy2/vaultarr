# Vaultarr 1.3.3 — Safe Game Removal

- Adds a Remove from Library action to every game record.
- Never deletes the original game folder or game files.
- Optional cleanup removes only Vaultarr-cached covers, media, and downloaded manuals.
- Removed scanned games can be kept on an ignore list so library scans do not add them again.
- Ignored paths can be restored from Settings and will return on the next scan.
- Removes associated curator jobs, history, collection links, and cached media database records.
- Keeps the production Docker Compose setup on `ghcr.io/linkssy2/vaultarr:latest`.
