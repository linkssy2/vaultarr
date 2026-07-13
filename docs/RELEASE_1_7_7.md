# Vaultarr 1.7.7 — Scan Control Click Repair

This patch restores the Scan Museum action without bringing back automatic scanning.

## Fixed

- Removed the fragile custom request-header requirement that could reject legitimate sidebar clicks behind some proxies or deployments.
- Bound the Scan Museum control directly and retained a delegated fallback after smooth navigation.
- Kept startup and status polling strictly read-only. Refreshing or opening a page cannot start a scan.
- Shows the actual start error in the drawer instead of silently failing.

The anchored scan drawer and protected card, navigation, search, manual, and Focus Mode systems are unchanged.
