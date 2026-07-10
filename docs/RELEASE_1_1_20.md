# Vaultarr 1.1.21 — Sidebar Motion Restoration

This patch restores the stable, smooth sidebar section animation used before the shared rendering-engine changes, without removing the HTML-flash prevention introduced in 1.1.17.

## Changes

- Sidebar clicks use the original gentle fade, downward drift, blur, and eased entrance timing from 1.1.7.
- The next section is still fetched and prepared before the transition begins.
- Native View Transitions remain available for non-sidebar internal navigation, but no longer override sidebar motion.
- The card UI, card expansion engine, Focus Mode, and close-flicker repair are unchanged.
- No backend, database, authentication, metadata, scanning, preservation, archive, or file-operation logic was modified.
