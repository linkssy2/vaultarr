# Vaultarr

> **Your games deserve a museum.**

Vaultarr is a self-hosted digital game preservation platform built for collectors, archivists, and enthusiasts who want more than just a launcher.

Instead of simply organizing games, Vaultarr helps preserve them by combining metadata, manuals, artwork, trailers, community fixes, intelligent collections, and archival tools into a single experience.

---

# Features

## Library Management

- Automatic library scanning
- Multiple library roots
- Intelligent duplicate detection
- Fast indexed search
- Smart Collections
- Manual game entries

---

## Metadata Engine

Combine information from multiple providers:

- LaunchBox
- IGDB
- RAWG
- Steam
- Wikipedia

Provider Intelligence automatically builds the best possible game record by selecting the highest-quality metadata from every provider.

---

## Media Library

Automatically collect and manage:

- Covers
- Alternate Covers
- Logos
- Hero Artwork
- Screenshots
- Cached Media

Choose your preferred cover at any time without losing previous artwork.

---

## Manual Engine

Download and archive game manuals.

Supports:

- VideoGameManual.com
- ReplacementDocs
- Local PDF Manuals

Built-in manual viewer included.

---

## Trailer Engine

Automatically discover trailers.

- Find likely trailers
- Preview candidates
- Save preferred trailer
- Built-in cinematic player

---

## Patch Engine

Find community improvements including:

- Official Updates
- Widescreen Fixes
- Controller Fixes
- Community Patches
- Compatibility Fixes

Powered by PCGamingWiki and community sources.

---

## Preservation

Track preservation quality for every game.

Vaultarr monitors:

- Metadata
- Manuals
- Artwork
- Gallery
- Trailers
- Patches
- Archive Assets

---

## Time Capsule

Protect your collection.

- Scheduled Backups
- Manual Backups
- Automatic Retention
- Backup Verification
- Restore Library
- Backup History

---

## Collection Experience

Build a digital museum.

- Smart Collections
- User Collections
- Collection Badges
- Franchise Progress
- Collection Milestones
- Legacy Score

---

## Docker Support

Vaultarr is designed to run as a self-hosted Docker application.

Example compose:

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
    container_name: vaultarr

    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/Los_Angeles

    ports:
      - 8787:8787

    volumes:
      - ./config:/config
      - /path/to/games:/games
      - ./backups:/backups

    restart: unless-stopped
```

Windows Example

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest

    volumes:
      - C:/Docker/Vaultarr/Config:/config
      - D:/Games:/games
      - C:/Docker/Vaultarr/Backups:/backups
```

---

# Screenshots

- Home
- Library
- Collector Focus
- Media Library
- Manual Engine
- Trailer Engine
- Patch Engine
- Collections
- Preservation
- Time Capsule

*(Screenshots coming soon.)*

---

# Roadmap

## Current

- Metadata Engine
- Manual Engine
- Media Library
- Trailer Engine
- Patch Engine
- Time Capsule
- Smart Collections
- Provider Intelligence
- Docker Support

## Upcoming

- Plugin Framework
- RetroAchievements
- Additional Metadata Providers
- Additional Manual Providers
- Additional Patch Providers
- Performance Improvements

---

# Contributing

Contributions, feature ideas, provider integrations, and bug reports are always welcome.

See:

- CONTRIBUTING.md

---

# License

MIT License

---

# Philosophy

Vaultarr isn't designed to replace LaunchBox or Playnite.

It's designed to preserve games.

Every title is treated as a digital artifact—not simply another executable.

Metadata, manuals, artwork, trailers, community patches, and archival assets all work together to build a digital museum around every game.

---

# Links

GitHub

https://github.com/linkssy2/vaultarr

Container

ghcr.io/linkssy2/vaultarr
