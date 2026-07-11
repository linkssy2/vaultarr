# Vaultarr 1.4.1 — Live Curator Progress

This patch converts game curation into an asynchronous background workflow. Pressing **Curate** now starts immediately, displays server-reported stages and percentage updates, and updates only the affected game row when complete. The Curator page no longer performs a full-page reload, eliminating the completion flicker.

## Docker

Production deployments continue to pull the published image:

```yaml
image: ghcr.io/linkssy2/vaultarr:latest
```
