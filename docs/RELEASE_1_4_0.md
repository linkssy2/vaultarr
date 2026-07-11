# Vaultarr 1.4.0 — The Curator Experience

Vaultarr 1.4.0 makes the application easier to use without removing advanced control.

## Highlights

- Standard Mode now shows a focused navigation built around Home, Library, Collections, Discover, Curate, Time Capsule, and Settings.
- Advanced Mode reveals provider tools, caches, diagnostics, milestones, and preservation controls.
- New experience settings control automatic Curator queueing, friendly labels, and Advanced Mode.
- Newly scanned games can be sent directly to Curate and prepared automatically in controlled one-at-a-time passes.
- Curator language is simpler and user-facing: game research, information, artwork, manuals, and museum readiness.
- Existing manual editing, field locks, manual selection, provider controls, and detailed tools remain available.
- Card expansion, Focus Mode motion, sidebar transition sequencing, and manual providers were not reworked.

## Docker

Production installs continue to pull the published image:

```yaml
image: ghcr.io/linkssy2/vaultarr:latest
```

Use `build: .` only for local development.
