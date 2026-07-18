# Vaultarr 2.0.0 Alpha 41 — Organized Expanded-Card Tabs

## Navigation hierarchy

- Organizes the existing expanded-card workspaces into a single left-to-right navigation bar.
- Keeps Overview, Play, Information, and Preservation visible as the primary workspaces.
- Places Manuals, Gallery, Trailer, and Soundtrack in Collection, with Acquisition, Patches, Files, and Actions in Manage.

## Visual refinement

- Uses smooth glass dropdown panels that open directly beneath Collection and Manage.
- Gives the selected primary workspace a clear blue active treatment and marks a dropdown when its active workspace lives inside it.
- Preserves a compact two-row fallback only on narrow mobile layouts.

## Accessibility

- Adds tablist, tab, selection, expanded-state, and panel-control semantics.
- Adds roving keyboard focus with Arrow, Home, End, and Escape navigation.

## Museum count cleanup

- Removes the repeated game count beneath the Museum title.
- Keeps the live count below the filter dropdowns, where it continues to reflect the visible results.

## Museum filter menus

- Replaces the native Platform, Genre, Category, and Sort popups with Vaultarr glass menus.
- Slides each menu open beneath its control and staggers the options so they glide smoothly into position.
- Retains the original select controls underneath for form values, filtering, sorting, and route compatibility.
- Supports click-outside closing plus Escape, Arrow, Home, and End keyboard handling.
- Uses explicit per-option timing so the staggered glide remains visible in Vaultarr's in-app browser.

## Expanded-card dropdown consistency

- Applies the same sliding chamber reveal and staggered option glide to every dropdown inside the expanded-card workspaces.
- Covers Information, Manuals, Acquisition, Gallery, Trailer, Soundtrack, and Patches without changing their values or callbacks.
- Consolidates the old Acquisition-only enhancer into one expanded-card dropdown lifecycle.

## Preserved behavior

Expanded-card dimensions, full-card artwork, hover, lift, tilt, gloss, expansion, workspace contents, emulator mode, Museum Scan, Orbital Core, sidebar navigation, authentication, Acquisition Assistant, Manual system, Museum Backup, and Milestone systems are unchanged.
