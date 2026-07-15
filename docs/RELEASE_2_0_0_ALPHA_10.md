# Vaultarr 2.0.0 Alpha 10 — Museum Scan Shimmer

This focused experimental patch refines only the Museum Scan working-state microinteraction.

## Changes

- Removes the Alpha 9 breathing pulse.
- Adds a narrow, soft Vault-blue light sweep across the fixed-size scan pill while a scan is active.
- Keeps the shimmer intermittent and restrained rather than continuously flashing.
- Plays one final, slightly brighter sweep when the scan completes.
- Lets that light dissipate before the progress line reverses and the normal **Scan Museum** label returns.
- Preserves Alpha 9 heartbeat monitoring, interrupted-scan recovery, sidebar sizing, Museum filters, floating-card hover/tilt, expansion, Focus Mode, manuals, and Acquisition Assistant.

## Updating

Restart the Vaultarr container and hard-refresh the browser once so the Alpha 10 stylesheet replaces the cached Alpha 9 asset.
