# Vaultarr 2.0.0 Alpha 37 — Authorized Acquisition Downloads

## Acquisition Assistant

- Resolves My Abandonware matches through the site's public alphabetical catalog without bypassing interactive verification.
- Returns direct game pages rather than a generic search handoff when a supported match is available.
- Uses the stored game title, platform, and release year to rank editions.
- Resolves Area 51 for Windows (2005) to `https://www.myabandonware.com/game/area-51-cj7`.
- Keeps the existing external search handoff when no direct catalog match can be resolved.
- Adds a permission-confirmed **Download to Vaultarr** action for manually supplied direct file URLs.
- Shows live bytes and percentage while streaming into per-game acquisition storage.
- Automatically marks the completed file as stored locally without extracting or executing it.
- Rejects private/local destinations, embedded credentials, HTML responses, oversized files, unsafe redirects, and duplicate active downloads.

## Soundtrack acquisition

- Adds an explicit-permission direct audio import to the expanded Museum card's existing local soundtrack player.
- Accepts manually supplied direct MP3, FLAC, OGG, WAV, and M4A links and streams them into per-game Vaultarr soundtrack storage.
- Shows live byte and percentage progress, refreshes the playlist on completion, and applies the same public-host and redirect protections used by game acquisition.
- Rejects web/catalog pages and leaves KHInsider album and song pages as external metadata links.

## Preserved systems

Museum card dimensions and interactions, existing Acquisition search/save/attachment behavior, Museum Scan, Orbital Core, sidebar navigation, authentication, manuals, Museum Backup, and Milestone systems are unchanged. Alpha 37 adds focused download start/status endpoints for the permission-confirmed game-file and soundtrack-file workflows.
