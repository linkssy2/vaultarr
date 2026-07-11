# Vaultarr 1.4.10 — Navigation Load Consistency

Vaultarr 1.4.10 prevents occasional long or half-faded waits while moving between sidebar sections.

## Changes

- Keeps the current page fully visible while the destination is fetched and prepared.
- Runs the established 170 ms exit and 280 ms entrance only after the destination is ready.
- Reuses in-flight prefetches instead of starting duplicate requests.
- Ignores repeated clicks for the same destination while it is already loading.
- Adds a short-lived page cache so ordinary tab switching stays immediate.
- Continues to bypass cached pages when Unified Vault State marks a route stale.
- Shows the top loading sweep only when preparation takes longer than 160 ms.
- Adds a 12-second navigation request timeout with a normal-navigation fallback.
- Preserves Universal Search, Curator progress, live library synchronization, card expansion, Focus Mode, and the restored sidebar motion.

## Upgrade

Pull the updated GHCR image or deploy this source release, restart the container, and hard-refresh the browser once so the 1.4.10 navigation assets replace the cached files.
