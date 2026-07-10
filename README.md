# Vaultarr 1.1.22

Vaultarr is a self-hosted game preservation dashboard for cataloging, enriching, and maintaining a personal game archive.

## What Vaultarr does

- Library scanning and floating game cards
- Metadata providers including LaunchBox, IGDB, RAWG, Steam, Wikipedia, and SteamGridDB artwork
- Provider Intelligence and Build Best Record
- Manual Engine with indexed manual providers
- Media Library for covers, screenshots, hero art, logos, and trailer assets
- Trailer Finder and cinematic Trailer tab
- Patch Engine for community fixes and compatibility references
- Preservation Mission Control
- Smart Collections and collection milestones
- Time Capsule backups
- Studio/Provider Workshop

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
