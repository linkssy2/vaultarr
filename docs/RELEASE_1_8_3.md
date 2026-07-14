# Vaultarr 1.8.3 — Reversible Scan Motion & Callback Cleanup

The Museum Scan pill now completes with a true reverse motion: the full blue progress line drains back toward zero, live status content reverses its entrance, and the original Scan Museum action returns without the control disappearing or changing size.

This release also audits and removes callbacks left behind by retired Activity, Preservation, and older scan-control flows. Compatibility redirects remain for old bookmarks, but no current UI depends on those retired pages.
