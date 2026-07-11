# Vaultarr 1.2.2 — Vimm Search Compatibility Patch

This patch corrects the Vimm Manual Project live-search request and parser.

## Fixed
- Uses a browser-compatible request profile instead of the Vaultarr application user agent.
- Sends the confirmed `counted=1` visit cookie and Vimm referer during searches.
- Supports both `/manual/<id>` and `?p=details&id=<id>` result links.
- Decodes HTML entities before title matching.
- Reduces concurrent Vimm requests to avoid empty or throttled responses.
- Retains cross-platform searching and direct validated PDF downloads.

## Unchanged
- VideoGameManual.com remains the cached provider.
- Card UI, Focus Mode, sidebar motion, and expansion behavior are untouched.
- Production Compose continues to pull `ghcr.io/linkssy2/vaultarr:latest`.
