# Vaultarr

Vaultarr is a self-hosted game-preservation dashboard for cataloging, enriching, organizing, and maintaining a personal game archive.

## Features

- Library scanning and interactive game cards
- Metadata providers including LaunchBox, IGDB, RAWG, Steam, Wikipedia, and SteamGridDB artwork
- Provider Intelligence and **Build Best Record**
- Manual indexing and discovery
- Covers, screenshots, hero artwork, logos, and trailers
- Patch and compatibility references
- Preservation Mission Control
- Smart Collections and collection milestones
- Time Capsule backups
- Studio and Provider Workshop
- Optional built-in authentication

## Quick start with Docker Compose

The recommended installation pulls the published Vaultarr image from GitHub Container Registry. You do **not** need to clone the repository or build the image locally.

Create a folder for Vaultarr, then create a file named `compose.yaml` inside it:

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
      - /path/to/your/games:/games
      - ./backups:/backups
    restart: unless-stopped
```

Replace `/path/to/your/games` with the real game-library path on the Docker host.

Start Vaultarr:

```bash
docker compose up -d
```

Then open:

```text
http://localhost:8787
```

### Updating the container

```bash
docker compose pull
docker compose up -d
```

This downloads the newest published image and recreates the container while retaining data stored in the mounted folders.

## Volume paths

Docker volume entries use this format:

```text
HOST_PATH:CONTAINER_PATH
```

Vaultarr uses these container paths:

| Container path | Purpose |
|---|---|
| `/config` | Database, settings, cache, and generated application data |
| `/games` | Game library exposed to Vaultarr |
| `/backups` | Time Capsule and other generated backups |

Vaultarr stores its database and application data under `LOCALAPPDATA/Vaultarr`. In Docker, `LOCALAPPDATA` is set to `/config`, so the persistent application data is written beneath the mounted `./config` directory.

### Linux example

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
      - /mnt/games:/games
      - ./backups:/backups
    restart: unless-stopped
```

### Windows Docker Desktop example

Use forward slashes in Windows bind-mount paths:

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
      - D:/Games:/games
      - D:/Vaultarr/backups:/backups
    restart: unless-stopped
```

For a path containing spaces, quote the entire volume entry:

```yaml
volumes:
  - "D:/My Games:/games"
```

### Dockge example

Create a new stack in Dockge and paste the same Compose configuration into the stack editor. Update the host paths before deploying it.

Do not use `build: .` for a normal Dockge installation. `build: .` requires the complete source repository and Dockerfile to be present inside the stack directory. Use the published `image:` entry instead:

```yaml
image: ghcr.io/linkssy2/vaultarr:latest
```

## First run

1. Start Vaultarr.
2. Open `http://localhost:8787`.
3. Complete the onboarding screen.
4. Add `/games` as the library path when using the Docker mapping shown above.
5. Scan the library from Studio.
6. Use Provider Intelligence to review and build metadata records.

The path entered inside Vaultarr must be the **container path**, such as `/games`, rather than the original host path such as `D:/Games` or `/mnt/games`.

## Authentication

Vaultarr includes optional Forms authentication. Enable it from:

```text
Studio → Security → Vault Access
```

Passwords are stored as hashes.

Authentication can also be enabled during the first Docker startup:

```yaml
environment:
  - LOCALAPPDATA=/config
  - VAULTARR_AUTH_ENABLED=true
  - VAULTARR_ADMIN_USER=admin
  - VAULTARR_ADMIN_PASSWORD=replace-this-password
```

Change the default password immediately after signing in.

## Health check

Open the following page to inspect database, library, provider, and cache readiness:

```text
http://localhost:8787/health
```

## Windows standalone installation

1. Download and extract a Vaultarr release ZIP.
2. Run `run_vaultarr.bat`.
3. Open `http://localhost:8787`.
4. Complete onboarding and add the full Windows path to your game library.

The standalone Windows installation does not use Docker container paths.

## Building locally for development

The published image is recommended for normal installations. Contributors who need to build from source can clone the repository and use a development override:

```yaml
services:
  vaultarr:
    build: .
    image: vaultarr:development
```

This requires the repository's `Dockerfile` and source files to be present in the current directory.

## Troubleshooting

### Vaultarr cannot see the games folder

Check all three of these items:

1. The host folder exists.
2. The Compose volume maps it to `/games`.
3. The library path configured inside Vaultarr is `/games`.

Example:

```yaml
volumes:
  - D:/Games:/games
```

Vaultarr library path:

```text
/games
```

### Permission denied on Linux

Confirm that the account running Docker can read the game directory and write to the config and backup directories.

### The container tries to build instead of pull

Remove:

```yaml
build: .
```

and use:

```yaml
image: ghcr.io/linkssy2/vaultarr:latest
```

Then run:

```bash
docker compose pull
docker compose up -d
```
