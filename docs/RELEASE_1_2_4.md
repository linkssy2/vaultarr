# Vaultarr 1.2.4 — Vimm Adaptive DPI Download Fix

## Fixed

- Vimm manual downloads no longer assume every scan supports 200 DPI.
- Vaultarr opens the selected Vimm manual detail page and reads its source DPI before requesting the PDF.
- The same HTTP session and provider cookies are preserved between the detail page and PDF request.
- If Vimm rejects a resolution, Vaultarr retries progressively lower valid DPI values instead of immediately failing.
- PDF MIME type, file-size limit, and `%PDF-` signature validation remain enabled.

## Preserved

- Vimm global manual search and alternate-platform results.
- VideoGameManual.com local catalog.
- Existing card UI, card expansion, Focus Mode, and exact sidebar motion.
- Production Docker examples continue to pull `ghcr.io/linkssy2/vaultarr:latest`.

## Upgrade

Pull/rebuild the 1.2.4 application image or deploy this source package, then fully restart the Vaultarr container so the updated Python service is loaded.
