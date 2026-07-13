# Vaultarr 1.7.5

> Current release: **Vaultarr 1.7.5 — Calm Scan Drawer**

Vaultarr is a self-hosted digital game museum. Point it at your game folders, let the background preparation system enrich the records, and spend your time browsing the collection rather than managing providers and queues.

## What's new in 1.7.5

- Scan Museum now keeps its 44 px header anchored while a status drawer unfolds beneath it.
- Scan details fade in after expansion begins and fade out before the drawer closes.
- Completion holds briefly, then returns to the idle pill with a calm fold-away motion.
- The progress line reveals smoothly and the scan icon rotates at a slow, restrained pace.

- **Scan Museum** and **Search Museum** now match Vaultarr's compact pill controls.
- The scan button smoothly expands vertically in place to reveal progress, stage, and current-game information.
- Completion content fades first, then the control gently contracts back into the idle scan pill.
- The background scan engine and protected card, navigation, search, manual, and acquisition systems are unchanged.

### Standard and Advanced modes

- **Standard Mode** keeps navigation focused on Home, Museum, Discover, Time Capsule, Milestones, and Settings.
- **Advanced Mode** reveals provider configuration, metadata tools, caches, and diagnostics. Preservation status now lives with each game.
- Switching modes changes presentation only; it does not remove data or disable existing features.

## What Vaultarr does

- Library scanning and floating game cards
- Metadata providers including LaunchBox, IGDB, RAWG, Steam, Wikipedia, and SteamGridDB artwork
- Provider Intelligence and Build Best Record
- Manual Engine with indexed VideoGameManual.com search, Vimm's Manual Project fallback, PDF validation, and local manual storage
- Media Library for covers, screenshots, hero art, logos, and trailer assets
- Trailer Finder and cinematic Trailer tab
- Patch Engine for community fixes and compatibility references
- Per-game Preservation status, issues, and archived-asset summaries
- Smart Collections and collection milestones
- Time Capsule backups
- Simplified Settings with optional Advanced Mode

## Quick start: Docker Compose

The normal production setup pulls the published Vaultarr image from GitHub Container Registry. It does **not** build the image locally.

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
    container_name: vaultarr
    ports:
      - "8787:8787"
    environment:
      - LOCALAPPDATA=/config
    volumes:
      - ./config:/config
      - /path/to/games:/games
      - ./backups:/backups
    restart: unless-stopped
```

Replace `/path/to/games` with the real host folder containing your games. Inside Vaultarr, use `/games` as the library path.

Start or update Vaultarr with:

```bash
docker compose pull
docker compose up -d
```

Then open `http://localhost:8787`.

### Windows / Docker Desktop example

```yaml
volumes:
  - ./config:/config
  - D:/Games:/games
  - ./backups:/backups
```

### Linux example

```yaml
volumes:
  - ./config:/config
  - /mnt/games:/games
  - ./backups:/backups
```

### Dockge

Paste the production Compose example into a new Dockge stack, replace the host game path, deploy it, and use `/games` when adding the library inside Vaultarr.

## Manual search and downloads

Vaultarr searches **VideoGameManual.com** as its primary indexed manual archive. Platform index pages are cached for seven days, so repeated searches are fast and respectful of the source. Results are matched using the game title and platform, ranked by confidence, and validated as real PDF files before Vaultarr saves them.

**Vimm's Lair Manual Project** is included as a manuals-only fallback. Vaultarr restricts this integration to manual-related pages and does not crawl or expose Vimm's game-download areas. Because Vimm does not publish a documented public API, results that cannot be verified as direct PDFs open the Manual Project source page for manual selection.

Downloaded manuals are stored under the configured `/config/manuals` location. The existing Docker volume mapping `./config:/config` preserves them across container updates.

Manual search behavior:

1. Search the cached VideoGameManual.com platform catalog.
2. Rank direct PDF matches using title, platform, and region hints.
3. Check the conservative Vimm manuals-only catalog/fallback.
4. Validate the PDF header and enforce a 250 MB safety limit before saving.
5. Leave uncertain results for manual review rather than downloading a likely-wrong file.

## Local development

Only developers modifying the source should build locally. Use a separate override such as `compose.dev.yaml`:

```yaml
services:
  vaultarr:
    build: .
    image: vaultarr:dev
```

Run it with:

```bash
docker compose -f docker-compose.yml -f compose.dev.yaml up -d --build
```

## Quick start: Windows without Docker

1. Extract the release ZIP.
2. Run `run_vaultarr.bat`.
3. Open `http://localhost:8787`.
4. Use onboarding or Studio to add the game library path.

## Important paths

Vaultarr stores its database and generated app data under `LOCALAPPDATA/Vaultarr` by default. In Docker, `LOCALAPPDATA=/config` and the `/config` volume keep this data persistent.

## First run

Open `/onboarding` after first launch. Add a library, scan it from Studio, then use Provider Intelligence to build records.


## Vimm manual download behavior

Vaultarr reads the selected Vimm manual page before downloading so it can request a DPI supported by that specific scan. This prevents HTTP 400 errors caused by assuming every manual supports 200 DPI.

## Manual providers

Vaultarr uses two complementary manual providers:

- **VideoGameManual.com** is cached into the local manual catalog for fast searches.
- **Vimm's Lair Manual Project** is searched live across the complete manual archive using its all-platform search endpoint and does not require a full-site cache.

Manual searches are not restricted to the game's platform. Matching manuals from the same platform rank first, while alternate-platform versions remain available. Vimm results open the manual detail page and can be downloaded directly into Vaultarr as a validated PDF.

## Authentication

Enable authentication from **Studio → Security → Vault Access**. Passwords are stored hashed. Docker users can optionally bootstrap authentication with:

```yaml
environment:
  - LOCALAPPDATA=/config
  - VAULTARR_AUTH_ENABLED=true
  - VAULTARR_ADMIN_USER=admin
  - VAULTARR_ADMIN_PASSWORD=change-me
```

Change the initial password after signing in.

## Updating

```bash
docker compose pull
docker compose up -d
```

Your persistent `/config`, `/games`, and `/backups` mounts are retained.

## Troubleshooting

- **Compose tries to build locally:** remove `build: .` and use `image: ghcr.io/linkssy2/vaultarr:latest`.
- **Games are missing:** verify the host path exists and that Vaultarr is configured to scan `/games`, not the host path.
- **Permission errors:** ensure Docker can read the game folder and write to the config and backup folders.
- **Old interface after updating:** pull the latest image, recreate the container, and hard-refresh the browser.

## Health check

Open `/health` to inspect database, library, provider, and cache readiness.


## Local Manual Catalog (1.2.0)

Vaultarr now builds a local, LaunchBox-style search index for manual listings from **VideoGameManual.com** and the manuals-only portion of **Vimm's Lair Manual Project**. It stores catalog records—not the PDF files—in `/config` through Vaultarr's persistent application data.

- The first manual search builds the catalog if it is empty.
- A stale catalog refreshes after seven days.
- Use **Settings → Manual Catalog → Refresh Manual Catalog** to force a rebuild.
- Platform is a ranking hint, not a filter. A PC game can use a PlayStation, Xbox, Nintendo, or other platform manual when that is the best available match.
- PDF files are downloaded only when you explicitly choose **Download to Vaultarr**.

Keep `/config` mapped to persistent storage so the manual catalog survives container updates.

## Museum Curator Engine (1.3.0)

Open **Curator** from the sidebar to find incomplete games and catalog them in controlled batches. Library scans automatically queue games, while provider work runs separately so scans remain stable.

The Curator can merge metadata, cache suitable artwork, and attach a high-confidence manual. It respects metadata locks and paused games, records errors instead of guessing, and leaves all game information manually editable.

For production, continue using the published image:

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
```

Do not replace `image:` with `build: .` unless you are intentionally developing from source.


## Safe game removal

Games can be removed from Vaultarr without deleting the original game folder. Removed scan paths may be ignored so they do not return automatically, and can be restored later from Settings.

## Search-to-Add games

The **Add Game** page now starts with a provider search instead of an empty form. Search the enabled information sources, optionally boost a platform, preview the selected release, and add it with one click. Vaultarr saves the available game information, downloads the selected cover when possible, and queues the new record for the Curator. The original manual-entry form remains available for fan projects, prototypes, homebrew, and titles that are not listed by a provider.


## Universal Search

Open **Search** in the sidebar (or press `Ctrl+K`) and choose:

- **My Museum** to find games and collections already in Vaultarr.
- **Discover & Add** to search enabled information sources, preview a release, and add it directly.

The **Add Game** button on the Library page opens the detailed manual form for prototypes, fan games, homebrew, custom ports, and unmatched titles.


## Acquisition Assistant

Open a game and use **Acquisition Assistant → Find Copy**. Vaultarr searches the live Vimm Vault reference catalog using the game title and platform, ranks matching releases, and opens the exact source page. Vaultarr does not download the game itself: after choosing the correct release, paste the final direct link yourself and save it to the museum record. You can later link the local file or folder and mark the game as stored locally.

No uploaded JSON or CSV index is required. If live search cannot find a result, paste the exact Vimm Vault source-page URL and use **Read Source Page**.


## Performance foundation

Vaultarr 1.5.8 reduces initial image decoding, avoids painting long offscreen grids, throttles card hover work, pauses nonessential activity in hidden tabs, and loads Focus Mode logic only when expandable game cards are present. These optimizations are automatic and require no configuration.

## 1.7.4 Sidebar Museum Scan

Use the permanent **Scan Museum** pill directly above **Search Museum** in the sidebar. During a scan, the same pill expands to show live progress and then contracts smoothly when the scan finishes. No separate scan page or duplicate progress panel is required.
