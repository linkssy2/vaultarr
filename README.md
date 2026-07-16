# Vaultarr 2.0.0 Alpha 14

> Experimental release: **Vaultarr 2.0.0 Alpha 14 — Visible Scan Shimmer**


## Alpha 12 scan shimmer

Museum Scan now uses one isolated component: one template partial, one stylesheet, and one JavaScript controller. The fixed-size pill shows a Vault-blue light sweep while working, reports completion in place, and returns to idle without popup or drawer code. Loading or navigating only reads current status; a scan can start only from the button click.


## Alpha 10 scan refinement

- Uses a restrained Vault-blue shimmer to show that Museum Scan is active.
- Plays one final brighter sweep at completion, then lets the light dissipate as the pill returns to idle.
- Retains Alpha 9 heartbeat and interrupted-scan recovery behavior.

## Alpha 2 interface refinement

- Removes redundant Home links that all opened the Museum.
- **Continue Curating** opens the Museum's Needs Attention view.
- **Discover Games** remains the separate online-discovery action.
- The Continue Browsing exhibit itself opens the selected game record.
- Corrects Search Museum pill sizing, spacing, truncation, and shortcut alignment.


## Experimental interface

This branch tests a simpler, Plex-like museum experience while retaining Vaultarr’s identity. Home is now a calm museum lobby centered on the animated Blue V Orbital Core, familiar content shelves, and plain-language Curator updates. The stable 1.8.4 interaction baseline remains protected.

Vaultarr is a self-hosted digital game museum. Point it at your game folders, let the background preparation system enrich the records, and spend your time browsing the collection rather than managing providers and queues.

## What's new in 1.8.4

- Completed a page-by-page interface consistency audit.
- Standardized action-button heights, compact controls, fields, action groups, disabled states, and keyboard focus.
- Added explicit submit behavior to previously implicit form buttons.
- Added consistent disabled-link handling without changing form submission behavior.
- Verified active page rendering, internal links, form routes, Python, JavaScript, and Jinja templates.
- Preserved the protected floating-card, Focus Mode, navigation, Museum Scan, manual, and Acquisition systems.
- Production Docker continues to pull `ghcr.io/linkssy2/vaultarr:latest`.

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
- Museum Backup in Settings
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

**Vimm's Lair Manual Project** is included as a manuals-only fallback. Vaultarr restricts this integration to manual-related pages and does not crawl or expose Vimm's game-download areas. Vaultarr performs live manual searches, opens the selected detail page, reads its supported scan resolution, and validates the generated PDF before saving it.

Downloaded manuals are stored under the configured `/config/manuals` location. The existing Docker volume mapping `./config:/config` preserves them across container updates.

Manual search behavior:

1. Search the cached VideoGameManual.com platform catalog.
2. Rank direct PDF matches using title, platform, and region hints.
3. Search Vimm's Manual Project live when the indexed provider has no suitable result.
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


### Scan control behavior

The **Scan Museum** button starts a scan only from an explicit click. Loading, refreshing, or navigating through Vaultarr only checks the current scan status and never starts a new scan. The control is bound directly with a smooth-navigation fallback for reliable operation.


## Museum Backup and Discover Timeline

Backup configuration, restore, retention, and archive size live in **Settings → Museum Backup**. Release **Timeline** remains a section inside Discover and is not a separate sidebar page.

## Alpha 16 — Unified Vault Login

The login experience now uses one unified panel with the animated Blue V Orbital Core behind a centered glass login form. Authentication behavior is unchanged.

## Alpha 15 — Discover Timeline Correction

Timeline remains inside Discover, Museum Backup remains in Settings, and retired Timeline/Metadata Queue routes redirect to their current destinations.
## Alpha 17 — Orbital Login Overlay

The login form is layered directly over the animated Orbital Core. The orbital panel is the login container; there is no separate opaque form card.

## Alpha 18 — Settings Danger Zone

**Reset Vault Settings** now lives at the absolute bottom of the Settings page, after Museum Backup. The action remains protected by its confirmation phrase and is visually isolated from ordinary configuration controls.

## Alpha 19 — Adaptive Cover Presentation

Museum cards now keep the complete cover visible using an aspect-ratio-safe foreground image, with a darker blurred copy behind it to fill the card naturally. Hover, tilt, parallax, and expanded-card behavior are unchanged.

## Alpha 20 — Full-Card Cover Stretch

Museum cover artwork now fills the complete card dimensions with `object-fit: fill`. This intentionally stretches or compresses artwork when necessary so no portion is cropped and no empty space remains.

## Alpha 21 — Discover Simplification

The Discover hero no longer repeats Museum navigation actions already available elsewhere. Its first content section now begins closer to the introductory copy, while Discover search, Timeline, shelves, and add-to-Museum behavior remain unchanged.

## Alpha 22 — Milestones Simplification

The Milestones hero no longer repeats navigation actions available elsewhere. Badge and achievement content now starts closer to the page introduction, while all milestone functionality remains unchanged.

## Alpha 23 — Milestones Naming Cleanup

The Milestones page now uses direct naming: **Milestones** for the page title and **Museum Progress** for the score gauge.

## Alpha 24 — Home Simplification

Home no longer duplicates Museum and Discover navigation in the Curator spotlight. The Continue Browsing shelf was also removed, allowing Recently Added to follow the museum status overview directly.

## Alpha 25 — Living Milestone Meter

The Milestones ring now represents aggregate achievement progress. Partial progress toward every badge contributes to the percentage, while the gauge uses a living, liquid-energy blue animation with a breathing glow.

## Alpha 26 — Milestone Meter Layout Fix

Corrected a selector collision that applied the circular Milestone Progress styling to the hero text. The animated power meter remains unchanged.

## Alpha 27 — Milestone Animation Restore

The Milestone Progress ring now animates under all motion settings. Reduced-motion mode keeps the breathing glow, liquid movement, and orbiting energy bead active at a slower pace.

## Alpha 28 — Liquid Milestone Vessel

Milestone Progress now fills the circle from the bottom upward according to the actual percentage. The liquid uses a brighter Vaultarr-blue glow with a softly animated surface and no outer orbit line.

## Alpha 29 — Glass Liquid Milestone Vessel

The Milestones hero remains unchanged, but the circular gauge now behaves like a glowing glass vessel. Liquid height matches the percentage and includes layered waves, drifting particles, and a brighter Vaultarr-blue glow.

## Alpha 30 — Enclosed Liquid Vessel

The Milestone Progress liquid is now clipped inside a dedicated inner glass chamber, leaving the outer ring decorative only.
