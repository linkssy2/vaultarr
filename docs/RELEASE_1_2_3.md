# Vaultarr 1.2.3 — Vimm Global Manual Search Fix

This patch fixes Vimm results that existed in the Manual Project but were not appearing inside Vaultarr.

## Fixed

- Searches Vimm with its working all-platform URL: `/manual/?p=list&q=<title>`.
- Does not require a `system` query parameter for normal searches.
- Keeps platform as a ranking signal rather than a filter.
- Falls back to a small set of system-specific searches only when the global search returns nothing.
- Keeps direct PDF downloading, response filename handling, and PDF validation from 1.2.2.

## Example

A search for `zelda` can now parse results such as `/manual/612` and expose the corresponding **Download to Vaultarr** action.
