# Vaultarr 1.4.2 — Smooth Curator Progress

Vaultarr 1.4.2 refines the live Curator experience so visible progress no longer jumps between server updates.

## Improvements

- The progress bar acknowledges **Curate** immediately, before the start request completes.
- Server progress is interpolated continuously with `requestAnimationFrame` instead of snapping every polling interval.
- The visible percentage now changes smoothly alongside the bar.
- Polling is more frequent while remaining lightweight.
- Fast curator jobs still receive a calm completion pass rather than jumping directly to the end.
- The final museum-readiness score settles into place without reloading the page.
- Existing metadata matching, manual downloads, card expansion, Focus Mode, and sidebar navigation are unchanged.

## Docker

Production installs continue to pull the published image:

```yaml
image: ghcr.io/linkssy2/vaultarr:latest
```

Restart the Vaultarr container after upgrading so the updated frontend assets are served.
