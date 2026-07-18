# Vaultarr 2.0.0 Alpha 50 — Seamless Login First Paint

Alpha 50 removes the brief exposed base-layout flash between successful login and the styled museum Home experience.

## Changes

- Added a small first-paint guard directly in the destination document head.
- Holds Vaultarr's dark canvas while the application stylesheets finish loading.
- Fades the fully styled museum shell into view before the existing ambient, sidebar, and content arrival sequence settles.
- Updated the arrival stylesheet cache key for refreshed and Docker-hosted clients.

## Preserved behavior

Credential verification, sessions, redirects, logout, authentication settings, the Home layout, the protected Home Orbital, and unrelated systems are unchanged.
