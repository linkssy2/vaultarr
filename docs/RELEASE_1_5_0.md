# Vaultarr 1.5.0 — Archival Acquisition Foundation

- Restores the complete 1.4.10 application after the edited prototype accidentally replaced major API and migration sections with placeholders.
- Adds direct, user-provided acquisition links to game records.
- Downloads authorized files to a configurable acquisitions folder grouped by platform.
- Adds URL validation, local-network request blocking, filename sanitization, streaming downloads, size limits, and partial-file cleanup.
- Adds a clear ownership and licensing warning.
- Fixes Docker publishing so GHCR receives both `latest` and the version from `VERSION`.
- Keeps production Compose on `ghcr.io/linkssy2/vaultarr:latest` and documents the acquisitions volume.
