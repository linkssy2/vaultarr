# Vaultarr 1.4.8 — Navigation Motion Stability

This patch removes the second-stage jerk that could appear after switching sidebar pages several times.

## Fixed

- Sidebar transitions are no longer cut short by the interaction lifecycle repair pass.
- The page entrance animation now completes before temporary navigation classes are cleaned up.
- Stale navigation classes are still recovered safely if an interrupted transition leaves one behind.
- Page controls and hover behavior continue to reinitialize after smooth content swaps.

## Unchanged

- Universal Search and Discover & Add
- Live Library Synchronization
- Curator progress and background jobs
- Expanded game cards and Focus Mode
- Manual search and downloads

## Upgrade

Restart the Vaultarr container and hard-refresh the browser after updating so the revised JavaScript is loaded.
