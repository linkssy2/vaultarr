# Vaultarr 1.5.8 — Floating Card Tilt Restoration

This patch fixes the remaining floating-card regression from the performance foundation.

## Fixed

- Restored pointer-driven 3D card tilt and vertical lift.
- Removed the `prefers-reduced-motion` rule that forced `.poster-card` transforms to `none`.
- Preserved expanded-card behavior, selection, gloss, cover parallax, and the Acquisition Assistant.

## Deployment

Use the published GHCR image:

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
    restart: unless-stopped
```

Restart the container and hard-refresh the browser after updating.
