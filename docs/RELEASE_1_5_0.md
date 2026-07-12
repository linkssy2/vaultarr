# Vaultarr 1.5.0 — Personal Acquisition Indexes

Vaultarr 1.5.0 builds from the stable 1.4.10 baseline and adds a user-managed acquisition catalog workflow.

## Added

- Upload JSON or CSV acquisition indexes from Advanced Settings.
- Validate, normalize, and store catalog entries in Vaultarr's local SQLite database.
- Enable, disable, and remove imported catalogs.
- Search all enabled personal indexes from an individual game record.
- Rank exact title matches first while treating platform as an optional bonus.
- Show region, version, format, size, catalog name, notes, and confidence.
- Open a catalog source page or copy its supplied download URL.
- Attach a locally acquired file or folder to the game record.
- Store uploaded index files inside Vaultarr's existing config volume.

## Safety and scope

- Vaultarr does not scrape the original website.
- Vaultarr does not execute code from uploaded indexes.
- Only JSON and CSV files are accepted, with a 25 MB upload limit.
- Only HTTP and HTTPS source/download links are accepted.
- The administrator supplies and maintains the catalog.

## Deployment

Production Compose continues to pull `ghcr.io/linkssy2/vaultarr:latest`. The GitHub workflow now also publishes a version-specific `ghcr.io/linkssy2/vaultarr:1.5.0` tag based on the `VERSION` file.
