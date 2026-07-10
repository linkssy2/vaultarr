# Vaultarr 1.1

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

## Quick start: Windows

1. Extract the release zip.
2. Run `run_vaultarr.bat`.
3. Open `http://localhost:8787`.
4. Use the onboarding screen or Studio to add your game library path.

## Quick start: Docker Compose

```yaml
services:
  vaultarr:
    build: .
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

Then open `http://localhost:8787`.

## Important paths

Vaultarr stores its database and generated app data under `LOCALAPPDATA/Vaultarr` by default.

For Docker, set `LOCALAPPDATA=/config` and mount `/config` as a persistent volume.

## First run

Open `/onboarding` after first launch. Add a library, scan it from Studio, then use Provider Intelligence to build records.

## Health check

Open `/health` to inspect database, library, provider, and cache readiness.


## Authentication

Vaultarr 1.1 includes built-in Sonarr-style Forms authentication. Enable it from **Studio → Security → Vault Access**. Passwords are stored hashed, and the login page uses the VaultOS design language.

For Docker users, first-run authentication can also be bootstrapped with optional environment variables:

```yaml
environment:
  - VAULTARR_AUTH_ENABLED=true
  - VAULTARR_ADMIN_USER=admin
  - VAULTARR_ADMIN_PASSWORD=change-me
```

You can still manage the username/password inside Vaultarr after startup.
