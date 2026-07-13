# Vaultarr 1.8.1 — Museum Scan State Rewrite

This release separates Museum scan actions from Museum scan status.

- A scan can only start from a trusted click on the Scan Museum button.
- Page refreshes, smooth navigation, and browser tab changes only read status.
- The frontend no longer owns or guesses scan state.
- Direct button binding replaces the previous delegated capture handler.
- The backend rejects scan-start requests without the explicit user-action header.
- More space separates Scan Museum from Search Museum.
- Existing scan progress visuals and protected UX systems remain intact.
