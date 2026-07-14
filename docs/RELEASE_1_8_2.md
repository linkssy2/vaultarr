# Vaultarr 1.8.2 — Scan Session Integrity

This release makes Museum scan state authoritative on the server.

- Each scan receives a unique session ID and is marked as started by an explicit user click.
- Page refreshes and browser tab visibility changes cannot begin or revive a scan.
- The sidebar reconnects only when the matching worker is alive and its heartbeat is recent.
- Stale scan rows left by interrupted containers reset to idle.
- Completion remains within Vaultarr's default blue visual theme rather than switching green.
- Protected card hover, tilt, expansion, Focus Mode, navigation, manuals, search, and Acquisition Assistant behavior remain unchanged.
