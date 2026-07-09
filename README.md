# Vaultarr

**Your games deserve a museum.**

Vaultarr is a self-hosted game preservation platform for building, enriching, and protecting a digital game archive. It treats every game as a digital artifact: metadata, covers, screenshots, manuals, trailers, patches, preservation status, and collection context all live together in one focused interface.

## Features

- **Library Engine** — scan and browse game libraries.
- **Collector Focus** — expanded game records with metadata, media, manuals, trailers, patches, and files.
- **Metadata Engine** — provider-based metadata matching with Provider Intelligence.
- **Manual Engine** — indexed manual search and local manual archive.
- **Media Library** — covers, screenshots, hero art, logos, trailer thumbnails, and cache management.
- **Trailer Engine** — in-card trailer finder and cinematic trailer view.
- **Patch Engine** — community fixes, widescreen patches, unofficial updates, and reference links.
- **Preservation Mission Control** — see what needs attention first.
- **Smart Collections** — user collections, auto categories, and preservation-oriented signals.
- **Time Capsule** — local export/import backups with scheduled backup-folder workflow.
- **VaultOS UI** — dark, animated, preservation-focused interface.

## Quick start

### Local Python

```bash
pip install -r requirements.txt
python -m app.main
```

### Docker Compose

```yaml
services:
  vaultarr:
    build: .
    container_name: vaultarr
    ports:
      - "5058:5058"
    volumes:
      - ./config:/config
      - /mnt/games:/games
      - /mnt/vaultarr/backups:/backups
    restart: unless-stopped
```

Then open Vaultarr in your browser and complete the first-run setup.

## Repository layout

```text
vaultarr/
├── app/                 # Application source
├── config/              # Persistent config placeholder
├── database/            # Database docs/placeholders
├── docker/              # Docker compose examples
├── docs/                # Documentation and release notes
├── screenshots/         # README / release screenshots
├── tests/               # Future tests
├── tools/               # Maintenance scripts
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
├── Dockerfile
└── docker-compose.yml
```

## Project status

Vaultarr 1.0 is the first public-ready release candidate. Expect rapid fixes and polish as real-world users test larger libraries, provider setups, and Docker deployments.

## Philosophy

Vaultarr is not just a launcher. It is a digital museum for game preservation.
