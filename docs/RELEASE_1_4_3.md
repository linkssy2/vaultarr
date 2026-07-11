# Vaultarr 1.4.3 — Search-to-Add Games

Vaultarr's manual Add Game workflow is now search-first. Enter a title, optionally supply a platform hint, and Vaultarr searches the enabled information sources for matching releases. Results can be previewed before adding, including available cover art, platform, release year, developer, publisher, genre, and description.

Selecting **Add to Library** creates the game record, downloads its cover when available, and queues the Curator Engine to continue preparing the museum record. The existing detailed manual form remains one click away for games that providers cannot identify.

## Upgrade

Use the published container image and restart the container after pulling the release:

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
```
