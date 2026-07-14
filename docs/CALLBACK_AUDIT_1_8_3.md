# Vaultarr 1.8.3 callback and legacy-flow audit

Removed or retired during the 1.8.3 scan-control cleanup:

- Removed the unused `vaultarr:navigation-complete` Museum Scan listener. No current navigation code dispatches that event, and the persistent sidebar does not need rebinding after main-content swaps.
- Removed the unused `vaultarr:museum-scan-updated` document event. No active component consumed it.
- Removed the unused `vaultarr:activity-pause` and `vaultarr:activity-resume` dispatches. No active component listened for either event.
- Repointed legacy Home activity links from `/activity` to the Museum Needs Attention view.
- Repointed Milestone preservation links from the retired standalone `/preservation` page to the Museum Needs Attention view.
- Kept `/activity`, `/curator`, and `/preservation` route redirects for backward-compatible bookmarks only. They no longer have active UI callbacks.
- Consolidated Museum Scan reset behavior into one reverse-animation path. Previous drawer, expand/collapse, popup, and disappearance callbacks are no longer present.

Protected systems not modified:

- Floating card hover, tilt, parallax, and expansion
- Focus Mode
- Sidebar navigation motion
- Universal Search
- Manual providers and downloads
- Acquisition Assistant
