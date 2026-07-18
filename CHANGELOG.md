## 2.0.0 Alpha 42 — Calm Search and Simpler Settings

- Added a continuous sliding indicator between My Museum and Discover & Add in Universal Search.
- Replaced the Information Source and add-category native dropdowns with the same glass reveal and staggered option motion used elsewhere in Vaultarr.
- Removed the obsolete Universal Search clipping boundary so animated dropdown menus can extend beyond the popup without being cut off.
- Corrected the Universal Search close lifecycle so backdrop clicks, Escape, and the close button play the full calm exit animation before the dialog becomes hidden or inert.
- Added a task-first Settings hub for Experience, Game Folders, Appearance, Access, Museum Backup, and Advanced tools.
- Added accessible progressive-disclosure controls to Settings sections, keeping everyday Experience and Game Folders open while secondary tools stay compact until requested.
- Preserved all existing settings forms, routes, stored values, authentication behavior, Museum Backup behavior, and advanced-mode visibility.

## 2.0.0 Alpha 41 — Organized Expanded-Card Tabs

- Replaced the unstructured wrapping pill layout with one compact left-to-right glass navigation bar.
- Keeps Overview, Play, Information, and Preservation visible while Collection and Manage open as smooth, compact dropdown menus.
- Marks Collection or Manage when its currently selected workspace lives inside that dropdown.
- Shortened the visible Game Information label to Information while retaining the existing metadata workspace and selector.
- Added accessible tab and dropdown states, roving keyboard focus, Escape handling, and Arrow, Home, and End navigation.
- Removed the duplicate game count beneath the Museum heading and retained the live filtered count below the dropdown controls.
- Replaced the Museum Platform, Genre, Category, and Sort native popups with animated glass menus featuring a sliding chamber reveal and staggered option glide-in.
- Preserved the underlying select values, filter navigation, local sorting, and keyboard navigation.
- Uses explicit per-option animation timing so the stagger remains visible in the in-app browser instead of collapsing into simultaneous movement.
- Applied the same menu treatment to all twelve dropdown controls across Information, Manuals, Acquisition, Gallery, Trailer, Soundtrack, and Patches.
- Replaced the Acquisition-only enhancer with one shared expanded-card select lifecycle and one outside-click handler.
- Removed the obsolete Alpha 30 focus-tab overrides after replacing the layout.
- Preserved expanded-card dimensions, full-card artwork, hover/lift/tilt/gloss, expansion behavior, all tab content, routes, and protected systems.

## 2.0.0 Alpha 40 — Player Performance Mode

- Added a reversible game-mode state that isolates the embedded emulator from the Museum's blurred, translucent, and shadowed rendering layers while gameplay is active.
- Hides non-player card content and gives the emulator the full expanded-card workspace without changing card geometry or the normal expanded-card interface.
- Restores the Play tab and its previous scroll position on exit, tab change, or card close.
- Dispatches player start/stop lifecycle events for future performance integrations.
- Replaced the forced single-thread setting with safe capability detection; threaded cores are selected only when the browser is already cross-origin isolated and provides `SharedArrayBuffer`.
- Consolidated Home statistics from several repeated full-table scans into one compatibility-aware aggregate query without changing any displayed health result.
- Consolidated Milestone game and media counters into two aggregate reads while preserving badge values and the protected Milestone percentage calculation exactly.
- Added cancellation for superseded global-search requests so replaced online searches stop consuming provider and browser work.
- Paused all CSS animations while the document is hidden and resume them automatically when the user returns.
- Preserved ROM/BIOS storage, streaming, fullscreen, controllers, player controls, Museum Scan, Orbital Core, sidebar, authentication, Acquisition, Manual, Backup, and Milestone systems.

## 2.0.0 Alpha 39 — In-App Preservation Player

- Added a simplified Play tab to expanded Museum cards for locally owned or authorized NES, SNES, Genesis / Mega Drive, Game Boy, Game Boy Advance, and PlayStation files.
- Reduced the primary workflow to a guided file action followed by one Start Game button; replacement, removal, and BIOS tools remain collapsed until needed.
- Added per-game ROM storage, shared PlayStation BIOS storage, extension and size validation, authenticated streaming, and HTTP range support.
- Added an isolated in-card player frame that is created only on demand and fully unloaded when the user exits, changes tabs, or closes the expanded card.
- Pinned the preview player runtime to EmulatorJS 4.2.3 and documented its internet requirement; no ROMs, BIOS files, or acquisition automation are included.
- Preserved expanded-card dimensions and interaction behavior, Acquisition Assistant, Museum Scan, Orbital Core, sidebar, authentication, Manual, Backup, and Milestone systems.

## 2.0.0 Alpha 38 — Library-First Expanded Cards

- Reordered the expanded Museum card's Soundtrack tab so owned and acquired tracks are the first content presented.
- Turned every local track row into an explicit in-Vaultarr play action and added a live track-count indicator.
- Attached the existing audio player directly beneath the library list so selected-track state and playback controls read as one workflow.
- Moved file import and permission-confirmed direct audio acquisition into one collapsed **Add owned music** section.
- Moved catalog scanning, previews, external shortcuts, and manual source saving into one collapsed **Find soundtrack sources** section.
- Reordered Manuals around the saved reader and its actions, with provider search and link entry in one collapsed secondary section.
- Reordered Gallery around cached media and its preview stage, with provider search directly below and cover management collapsed until needed.
- Reordered Trailer around its saved playback stage and primary actions, consolidating recommendations, external searches, and manual URL entry into one secondary section.
- Reordered Acquisition around its saved source and local-copy status, with distinct secondary sections for catalog discovery, permission-confirmed importing, and local-file attachment.
- Kept saved acquisition download links reachable after reopening a game by placing the authorized import controls in their own persistent section.
- Corrected saved Acquisition API hydration so an existing record is returned as JSON instead of failing with an HTTP 500 response.
- Removed the obsolete separate advanced-trailer panel styling after merging manual URL entry into the finder.
- Preserved manual, gallery, trailer, and soundtrack APIs, storage, scanners, authorized-download protections, expanded-card dimensions, and unrelated systems.

## 2.0.0 Alpha 37 — Authorized Acquisition Downloads

- Replaced My Abandonware's verification-page search fallback with exact game-page resolution through its public alphabetical catalog whenever a matching title is available.
- Uses stored platform and release-year data to rank editions, allowing a 2005 Windows record for Area 51 to open `https://www.myabandonware.com/game/area-51-cj7` directly instead of a generic search page.
- Keeps the external search handoff only when no supported direct catalog match can be resolved.
- Added permission-confirmed downloads for manually pasted direct file URLs, with live byte/progress reporting in both the full game page and expanded Museum card.
- Streams authorized files into per-game Vaultarr acquisition storage and automatically attaches successful downloads to the game record without extracting or executing them.
- Rejects private/local network targets, embedded URL credentials, HTML pages, oversized files, unsafe redirect destinations, and concurrent downloads for the same game.
- Added the same explicit-permission download flow to the expanded Museum card's Soundtrack tab for manually supplied direct MP3, FLAC, OGG, WAV, and M4A file links.
- Streams authorized audio into per-game soundtrack storage with live progress, then refreshes the existing local player without scraping or downloading from catalog and album pages.

## 2.0.0 Alpha 36 — Interface and Scan Responsiveness

- Removed the numeric Home health gauge and rebuilt the Orbital Core around an enlarged glowing blue badge with a hollow white Vaultarr V. Its liquid fill reflects Museum Health and undulates only when rising bubbles pop into its spring surface, while a same-size outer orbital node keeps the live health percentage visible.

- Added a Soundtrack tab to expanded Museum cards with per-game YouTube soundtrack/OST scanning, ranked candidates, previews, saved source links, manual URL entry, and removal.
- Added KHInsider as a catalog-only soundtrack discovery source that returns ranked album metadata and external album links without downloading hosted audio.
- Added KHInsider album-detail browsing with track names, durations, file sizes, and external per-song pages; playback remains limited to locally owned/imported audio.
- Added Vaultarr's local soundtrack player with game-folder indexing, owned-audio imports, drag-and-drop, playlists, seek/volume controls, previous/next, shuffle, repeat, and HTTP range playback.
- Added soundtrack completeness to the museum-wide Discovery Depth score, accepting either a saved source or locally scanned soundtrack files.
- Expanded the Acquisition Assistant with Vimm Vault and My Abandonware source selection, a platform/version dropdown, provider-labelled results, and manual source-page handoff without downloading game files.
- Added a graceful My Abandonware browser-search handoff when its interactive verification page prevents server-side catalog parsing.
- Corrected Vimm platform parsing to read each result's own table row, preserving Xbox releases such as Enter the Matrix `/vault/15370` and accurate detail-page region/version metadata.
- Collapsed equivalent Vimm region/revision records into one title/platform result, preferring the strongest USA/world revision so Xbox searches no longer show several identical-looking links.
- Replaced the expanded-card Acquisition source and platform native popups with compact, scrollable Vaultarr menus using eased open/close motion, keyboard navigation, and a four-choice viewport.
- Routed wheel input over the expanded card's artwork column into its information pane so the card remains scrollable without moving the dimmed Museum page behind it.
- Added a shadowless glass-slate treatment to lifted Museum covers with stronger perspective, smoothly animated artwork/title depth, and directional internal edge reflections; card dimensions, full-card artwork, and expansion behavior remain unchanged.

- Corrected the shared control selector so its intended 44px standard height applies to buttons and button-style links across active pages.
- Preserved the deliberate 36px compact variant used by Museum filters and small actions.
- Restored zero-margin alignment for header actions such as Milestones Test Sound.
- Removed inherited submit spacing from forms nested inside shared action rows.
- Prevented narrow mobile action links from wrapping into inconsistent two-line heights.
- Equalized Settings theme tiles within each grid row without forcing desktop heights onto the single-column mobile layout.
- Restored the Museum Backup hero alignment and its equal-width two-column settings action row.
- Parallelized independent metadata, provider-detail, and media-source lookups through bounded worker pools.
- Removed the redundant manual-provider lookup after enrichment and corrected manual search result handling.
- Replaced the active Museum Scan shimmer with a smooth vertical panel morph, live scan counters, current-game detail, and a thin canvas chamber with spring-driven liquid physics.
- Prevented page-load status hydration from replaying an old completed Museum Scan while preserving explicit click starts and reattachment to genuinely active scans.
- Restored calm Home orbital travel in reduced-motion browser environments while keeping the percentage node upright and slowing the motion rate.
- Rebuilt Discovery Depth as a museum-wide 13-area record-completeness score covering core metadata, covers, trailers, soundtracks, manuals, gallery media, and scanned files.
- Replaced the static Discovery Depth percentage ring with the protected Milestones-style two-layer glass vessel and spring-liquid percentage display, while keeping its completeness calculation unchanged.
- Preserved Museum card dimensions and expansion behavior, Focus Mode geometry, Museum Scan click protection and server lifecycle, sidebar navigation, authentication, Museum Backup, and Milestone systems.

## 2.0.0 Alpha 35 — Fluid Simulation Lifecycle

- Refined the canvas liquid surface into a coherent spring-point simulation with damping, tension, inertia, and direct neighbor propagation.
- Kept motion calm and visibly fluid while preserving the percentage-based fill level and inner-vessel clipping.
- Mapped fill depth to the vessel's visible interior so low percentages remain visible above the glass border.
- Strengthened the canvas surface crest so very low progress remains legible without inflating the liquid body.
- Deepened the existing two-layer enclosure with refracted highlights, a sealed contact rim, and embedded mounting shadows while preserving its dimensions and structure.
- Removed continuous forcing and timer-driven disturbances so the surface reacts only to simulated bubble pops.
- Made each bubble pop inject a strong localized impulse across nearby spring points, producing pronounced waves that spread and settle naturally.
- Corrected smooth-navigation mounting to use Vaultarr's actual page-loaded lifecycle event.
- Removed the obsolete navigation callback and now dispose detached liquid engines, observers, and visibility listeners.
- Kept the protected two-layer container, vessel dimensions, curved label alignment, hero layout, badges, achievements, routes, and sidebar unchanged.
- Added the branch-specific `ghcr.io/linkssy2/vaultarr:2.experimental` Docker channel without changing the stable `latest` publishing behavior on `main`.

## 2.0.0 Alpha 34 — Physics Liquid Core

- Replaced the layered SVG liquid artwork with a runtime canvas spring-fluid simulation.
- Added connected surface points with tension, damping, inertia, neighbor propagation, and randomized impulses.
- Liquid now sloshes and settles through secondary motion instead of sliding static shapes.
- Curved Milestone Progress around the upper inner circle using an SVG text path.
- Kept the two-layer housing, inner vessel, percentage calculation, hero layout, badges, and achievements unchanged.
- Added visibility pausing, capped simulation updates, and reduced canvas resolution for lightweight operation.

## 2.0.0 Alpha 33 — Two-Layer Liquid Core

- Reduced the Milestone core to exactly two visible structural layers: outer housing and inner glass vessel.
- Removed the extra middle ring.
- Rebuilt the liquid with wider asymmetric SVG waves and stronger vertical slosh.
- Added independent foreground and background motion, internal current drift, and sparse suspended particles.
- Darkened the liquid body while retaining a bright cyan crest.
- Preserved hero layout, vessel size, percentage calculation, badges, and achievements.

## 2.0.0 Alpha 32 — SVG Liquid Core

- Rebuilt only the inner Milestone vessel using two animated SVG wave masks.
- Darkened the liquid to a richer Vaultarr blue while keeping a bright cyan surface edge.
- Added more visible slosh with independent foreground and background wave motion.
- Added internal current movement and subtle rising particles.
- Moved Milestone Progress above the percentage to prevent overflow outside the inner circle.
- Kept the hero layout, vessel size, glass rings, milestone percentage, badges, and achievements unchanged.

## 2.0.0 Alpha 31 — Liquid Vessel Polish

- Thickened both the outer shell and inner glass chamber.
- Darkened the liquid to a richer Vaultarr blue while retaining a bright cyan surface edge.
- Increased controlled slosh motion with two independent wave layers.
- Made the Milestone Progress label brighter, thicker, and more legible.
- Strengthened glass reflections and reduced visible particle density.
- Kept the vessel size, hero layout, fill calculation, badges, and achievements unchanged.

## 2.0.0 Alpha 30 — Enclosed Liquid Vessel

- Added a dedicated inner glass chamber inside the Milestone Progress gauge.
- Liquid is clipped entirely inside the inner vessel and no longer reaches the outer decorative ring.
- Added visible glass thickness between the liquid and outer shell.
- Preserved liquid height, wave layers, particles, percentage text, and milestone calculations.

## 2.0.0 Alpha 29 — Glass Liquid Milestone Vessel

- Kept the existing Milestones hero layout and circular gauge size.
- Replaced only the gauge internals with a glass liquid vessel.
- Liquid height directly matches Milestone Progress.
- Added two calm wave layers, a bright cyan surface edge, drifting particles, and stronger Vaultarr-blue glow.
- Removed radial bar visuals, outer orbit lines, and orbiting dots.
- Kept milestone calculations, badges, achievements, and all other page systems unchanged.

## 2.0.0 Alpha 28 — Liquid Milestone Vessel

- Replaced the circular bar meter with a true liquid-filled progress vessel.
- Liquid height now directly matches the Milestone Progress percentage.
- Removed the thin outer orbit line and moving bead.
- Removed the independent center liquid effect.
- Added brighter Vaultarr-blue liquid, a glowing surface edge, and calm breathing bloom.
- Kept milestone calculations, badges, achievements, and page layout unchanged.

## 2.0.0 Alpha 27 — Milestone Animation Restore

- Restored the Milestone Progress breathing, liquid movement, halo, and orbiting energy bead.
- Reduced-motion mode now uses slower, calmer animation instead of disabling it.
- Increased liquid visibility slightly so the power-meter movement is easier to perceive.
- Kept the corrected Milestones layout and milestone-based percentage calculation unchanged.

## 2.0.0 Alpha 26 — Milestone Meter Layout Fix

- Fixed the Milestones hero text being rendered as a second circular power meter.
- Restricted all liquid-energy meter styling to the actual progress ring.
- Restored the heading and description to their normal text layout.
- Preserved the aggregate Milestone Progress calculation and animation.

## 2.0.0 Alpha 25 — Living Milestone Meter

- Changed the Milestones percentage to aggregate progress across every achievement target.
- Completed achievements contribute fully, while partial achievements contribute proportionally.
- Renamed the gauge to Milestone Progress.
- Rebuilt the ring as a breathing blue power meter with liquid-like energy movement and a traveling light bead.
- Added reduced-motion support that preserves the glow while stopping continuous movement.
- Left badges, achievements, scoring targets, Museum cards, scan controls, and navigation unchanged.

## 2.0.0 Alpha 24 — Home Simplification

- Removed Continue Curating and Discover Games from the Home Curator spotlight.
- Removed the Pick Up Where You Left Off / Continue Browsing section.
- Recently Added now follows the Curator spotlight directly.
- Left the Orbital Core, Curator status, Museum Health, Recently Added, and lower story cards unchanged.

## 2.0.0 Alpha 23 — Milestones Naming Cleanup

- Renamed Collection Experience to Milestones.
- Renamed Vault Legacy to Museum Progress.
- Simplified the hero description.
- Reduced the hero height so milestone content appears sooner.

## 2.0.0 Alpha 22 — Milestones Simplification

- Removed the redundant Improve Your Museum and Rediscover buttons from the Milestones hero.
- Reduced the hero height so badge and milestone content begins sooner.
- Left badges, progress, achievements, audio feedback, and the Vault Legacy score unchanged.
- Preserved all protected Museum card, scan, navigation, and search systems.

## 2.0.0 Alpha 21 — Discover Simplification

- Removed the redundant Browse Museum and Improve Museum buttons from the Discover hero.
- Tightened the Discover hero spacing so the first content section begins sooner.
- Left Discover search, Timeline, shelves, cards, filters, and add-to-Museum behavior unchanged.
- Preserved all protected Museum card and navigation systems.

## 2.0.0 Alpha 20 — Full-Card Cover Stretch

- Reverted the adaptive contained-cover presentation from Alpha 19.
- Removed the blurred duplicate artwork layer.
- Museum cover artwork now stretches to fill the entire card surface.
- Covers are no longer cropped; differing aspect ratios are intentionally warped to fit.
- Preserved floating-card hover, tilt, parallax, gloss, and expansion behavior.

## 2.0.0 Alpha 19 — Adaptive Cover Presentation

- Changed Museum card artwork from crop-to-fill to full-cover presentation.
- Added a darker blurred duplicate of each cover behind the foreground artwork to fill unused space.
- Preserved original aspect ratios without stretching or distortion.
- Left floating-card hover, tilt, parallax, gloss, and expansion behavior unchanged.

## 2.0.0 Alpha 18 — Settings Danger Zone

- Moved Reset Vault Settings to the absolute bottom of Settings, after Museum Backup.
- Isolated the destructive reset flow in a clearly separated Danger Zone.
- Preserved the existing confirmation phrase, backup protection options, and reset behavior.
- Added responsive spacing so the section remains visually separated on laptops and mobile.

## 2.0.0 Alpha 17 — Unified Vault Login

- Combined the login form and animated Orbital Core into one unified Vault panel.
- Moved the orbital scene behind the form with a dark glass overlay for readability.
- Preserved authentication behavior, sessions, and password handling.
- Added responsive scaling for laptop and mobile displays.

## 2.0.0 Alpha 15 — Discover Timeline Correction

- Removed Timeline from the sidebar.
- Kept release Timeline inside Discover and added a stable in-page anchor.
- Redirected legacy `/timeline` links to Discover → Timeline.
- Kept Museum Backup inside Settings.
- Redirected the retired Metadata Queue to Museum → Needs Attention.
- Updated Home and Milestone links to the current destinations.

# Changelog

## 2.0.0 Alpha 14 — Museum Backup & Timeline

- Moved all backup controls into Settings under Museum Backup.
- Removed the backup page from primary navigation.
- Added a dedicated Timeline experience for release-year browsing.
- Renamed release-history references from Time Capsule to Timeline.
- Redirected the retired /archive page to Settings → Museum Backup.
- Fixed Discover Improve Museum links to open Museum → Needs Attention.
- Removed visible links to the retired Metadata Queue.

# 2.0.0 Alpha 12 — Visible Scan Shimmer

- Strengthened the active Museum Scan shimmer so it is clearly visible while work is running.
- Removed `mix-blend-mode`, which could make the sweep disappear on some browsers and GPU paths.
- Kept the blue sweep enabled in a slower form when the operating system reports reduced-motion preferences.
- Preserved the fixed pill size, scan state controller, Museum layout, and protected interaction systems.

# 2.0.0 Alpha 11 — Museum Scan Component Rewrite

- Removed every previous sidebar scan UI implementation and rebuilt one component from scratch.
- Added a single HTML partial, stylesheet, and JavaScript controller for Museum Scan.
- Reduced scan presentation to four states: Idle, Scanning, Complete, and Error.
- Added a visible Vault-blue light sweep during work and a final completion sweep.
- Kept page load and navigation status-only; only the pill click can start a scan.
- Audited and removed legacy scan callbacks and selector overrides.

# 2.0.0 Alpha 10 — Museum Scan Shimmer

- Replaced the subtle pulse with a calm Vault-blue light shimmer that sweeps across the scan pill while work is active.
- Added one brighter final shimmer at completion, followed by a clean dissipation before the control returns to idle.
- Kept the pill dimensions, scan truthfulness/heartbeat recovery, progress line, sidebar layout, Museum page, and protected card systems unchanged.

# 2.0.0 Alpha 9 — Truthful Scan Status

- Removed the rotating refresh icon from the Museum Scan control.
- Replaced it with a subtle blue activity pulse that matches the default theme.
- Added a dedicated server heartbeat while long preparation stages are running.
- Added a 15-second stalled-worker timeout so the scan pill cannot remain frozen indefinitely.
- Interrupted scans now briefly report the interruption and return to the idle Scan Museum button.
- Kept the existing fixed pill dimensions, progress line, sidebar alignment, Museum layout, and protected card interactions.

# 2.0.0 Alpha 8 — Sidebar Utility Alignment

- Matched Scan Museum and Search Museum to the Current build card width.
- Removed extra nested sidebar utility padding.
- Left scan behavior and all protected interactions unchanged.

# Changelog

## 2.0.0 Alpha 7 — Museum Grid Restoration

- Removed the retired Museum list-view behavior and its saved browser preference.
- Restored the canonical floating-card grid for every Museum load and smooth navigation swap.
- Clears stale `vaultarrMuseumView=list` values left by earlier Alpha builds.
- Keeps Collections inside Museum and leaves search, filters, cards, hover, tilt, expansion, and scan behavior unchanged.

# Vaultarr Changelog

## 2.0.0 Alpha 6 — Museum Collections Merge

- Built from the working Alpha 5 baseline supplied by the user.
- Removed the Museum game-count/grid-list control block.
- Moved the game count beneath the Museum title.
- Added Collections as an in-Museum tab.
- Removed the standalone Collections sidebar entry.
- Kept search, filters, Add Game, floating cards, hover, expansion, scan, Home, Discover, Time Capsule, and Milestones unchanged.
- Kept `/collections` as a compatibility redirect to `/museum?view=collections`.

## 2.0.0 Alpha 6

- Compact Plex-style Museum header sizing.
- Added functional Platform, Genre, Category, and Sort dropdown filters.
- Improved responsive alignment for Museum tools.

## 2.0.0 Alpha 3
- Plex-inspired Museum header and reliable sidebar route highlighting.

# Changelog

## 2.0.0-alpha.2 — Home Action Clarity

- Removed the redundant **Open Museum** action from Home.
- Removed the redundant **View Museum** link from Continue Browsing.
- Kept **Continue Curating** focused on the Needs Attention Museum view.
- Kept **Discover Games** as the separate discovery action.
- Made the Continue Browsing exhibit card the direct route to its game record.
- Standardized the Search Museum pill to a single-line, correctly spaced sidebar control.
- Updated cache-busting asset versions and experimental build labels.


## 2.0.0-alpha.1 — Familiar Museum Experience

- Redesigned Home as a familiar media-style museum lobby.
- Preserved the animated Blue V Orbital Core as the Curator centerpiece.
- Added Continue Browsing and Recently Added shelves.
- Simplified Home language around stories rather than technical statistics.
- Added clear active sidebar navigation.
- Simplified Discover copy and museum-care links.
- Kept the 1.8.4 protected interaction baseline intact.

## 1.8.4 — Interface Cohesion Audit

- Audited every active page for consistent visual language and control sizing.
- Standardized primary, secondary, danger, compact, and disabled button states.
- Standardized form fields, action-row spacing, responsive stacking, and keyboard focus.
- Added explicit submit intent to previously implicit form buttons.
- Added a disabled-link interaction guard without changing form submission behavior.
- Verified active pages, links, forms, Python, JavaScript, Jinja templates, and ZIP integrity.
- Preserved the protected card, Focus Mode, navigation, Museum Scan, manuals, and Acquisition systems.

## 1.8.3 — Reversible Scan Motion & Callback Cleanup

- Reworked the fixed-size Scan Museum pill so completion plays the progress motion smoothly in reverse before returning to idle.
- Removed the old disappear/retract reset behavior and consolidated scan reset into one reversible animation path.
- Removed unused Museum Scan, Activity, and navigation callbacks left behind by retired UI flows.
- Repointed legacy Activity and Preservation destinations to Museum Needs Attention.
- Kept backward-compatible route redirects for old bookmarks.
- Preserved the protected 1.5.8 interaction baseline.

## 1.8.2 — Scan Session Integrity

- Added unique Museum scan session IDs and explicit `user_click` provenance.
- Added worker heartbeat validation before the sidebar reconnects to a running scan.
- Removed browser visibility-change handling from the scan control.
- Automatically resets stale or interrupted scan records to idle.
- Replaced green completion styling with the default Vaultarr blue palette.
- Preserved the 1.5.8 protected interaction baseline.


## 1.8.1 — Museum Scan State Rewrite

- Separated scan start actions from status attachment.
- Prevented refreshes, navigation, and browser tab changes from starting scans.
- Added trusted direct-click binding and backend user-action validation.
- Increased spacing between Scan Museum and Search Museum.

# 1.8.1 — Transforming Museum Scan Pill

- Added 18 px of visual separation between Scan Museum and Search Museum.
- Kept the scanner fixed at the same compact pill dimensions in every state.
- Changed the scan control from a primary action into a calmer live-status surface while working.
- Added distinct scanning, completed, and failed visual identities.
- Preserved smooth stage crossfades, percentage interpolation, and the embedded progress line.
- Left the scan backend and protected 1.5.8 UX systems unchanged.

# 1.7.9 — Morphing Museum Scan Pill

- Replaced the scan drawer with one fixed-size sidebar pill.
- The pill now morphs in place between idle, scanning, complete, and failed states.
- Added calm label crossfades, live stage and game text, percentage interpolation, and a thin embedded progress line.
- Removed all scan-control expansion, contraction, popup, and sidebar layout movement.
- Kept scan startup manual-only; refresh and navigation only reconnect to an existing scan.
- Preserved the protected card, Focus Mode, navigation, manuals, search, and Acquisition Assistant systems.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.7.7 - Scan Control Click Repair

- Restored the Scan Museum button after the 1.7.6 explicit-action guard blocked valid clicks in some deployments.
- Kept page load and status polling read-only, so refreshes still cannot start a scan.
- Added resilient direct and delegated click binding for smooth-navigation page swaps.
- Displays the server error inside the scan drawer when a scan cannot start.
- Preserved the anchored drawer animation and protected 1.5.8 UX baseline.

# Vaultarr 1.7.6 — Anchored Scan Drawer

- Prevented page refreshes and navigation from starting Museum scans.
- Added explicit user-action validation to the scan start endpoint.
- Reconciles stale running states left by interrupted containers back to idle.
- Rebuilt the sidebar scan interaction as a fixed pill with an independent drawer.
- Added slower staged reveal, progress wipe, completion hold, and two-phase contraction.
- Preserved the protected 1.5.8 card, Focus Mode, search, manual, and navigation systems.

# Vaultarr 1.7.5 — Calm Scan Drawer

- Reworked the sidebar scan control as a stable pill header with a lower status drawer.
- The header no longer disappears or jumps while scanning.
- Added delayed detail reveal, smooth progress-line entrance, and ordered completion collapse.
- Slowed and softened the expand/contract easing to match Vaultarr's protected UX baseline.
- Preserved the Museum scan engine and all protected card, Focus Mode, navigation, search, manual, and acquisition behavior.

# Vaultarr 1.7.4 — Per-Game Preservation

- Moved preservation status into each game record and the expanded game card.
- Renamed the expanded-card Archive Health tab to Preservation.
- Retired the standalone Preservation navigation page and redirected legacy links to Museum.
- Replaced Milestones' Preserve More action with Improve Your Museum.
- Added a Museum Needs Attention view for incomplete preservation records.
- Preserved the protected 1.5.8 floating-card, expansion, Focus Mode, search, and navigation baseline.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.7.4 — Primary Sidebar Scan Control

- Moved Scan Museum directly above Search Museum in the sidebar.
- Restyled the idle scan control to match Vaultarr's primary blue Enter Museum button.
- Retained the smooth expanding progress state and completion contraction.


## 1.7.4 - Sidebar Museum Scan

- Replaced all page-level Museum scan controls with one permanent sidebar control.
- The button expands in place to show live progress, current stage, and current game.
- On completion, the control briefly shows the result and smoothly contracts back into the Scan Museum button.
- Removed duplicate scan controls from Home and Museum.
- Preserved the protected 1.5.8 card, navigation, Focus Mode, search, manual, and acquisition systems.
# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.7.4 — Discreet Scan Status

- Removed the duplicate in-page Museum Scan progress banners from Home and Museum.
- Kept one compact scan indicator in the sidebar while a scan runs.
- Blended the indicator into the sidebar with a thinner progress line and softer contrast.
- Added click-to-expand scan details and an automatic fade after successful completion.
- Preserved the background Museum Scan engine and protected 1.5.8 interaction systems.

## 1.7.4 — Background Museum Scan

- Replaced the per-game Activity dashboard with one Plex-style background Museum Scan.
- Added Scan Museum controls to Home and Museum.
- Added a persistent sidebar progress indicator that follows smooth navigation.
- Scans configured folders, updates existing records, detects incomplete games, and prepares them serially in the background.
- Added scan completion summaries and failure status without page reloads.
- Removed Activity from the standard sidebar and Home page.
- Redirected legacy `/activity` and `/curator` routes to Museum.
- Preserved the protected 1.5.8 card, tilt, expansion, Focus Mode, Universal Search, manuals, and navigation systems.

## 1.6.2 — Activity Dashboard Rework

- Reworked stage-based Activity status and restrained progress-panel hover styling.

## 1.6.1 — Live Activity Repair

- Repaired Activity initialization after smooth navigation.

## 1.6.0 — The Museum Experience

- Introduced the Museum-focused navigation and Home lobby.

## 1.5.8 — Floating Card Tilt Restoration

- Removed the reduced-motion override that forcibly disabled the poster-card transform.
- Restored full floating-card lift and pointer-driven 3D tilt while preserving card expansion and cover parallax.
- Kept the safe 1.5.5 performance optimizations that do not interfere with card motion.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.5.8 — Floating Card Interaction Restoration

- Restored synchronous loading of the original Focus Mode/card controller.
- Removed the capture-phase loader that could swallow the first card interaction.
- Removed `content-visibility` from Library card wrappers because it implicitly contains paint and can clip floating tilt, lift, gloss, and shadows.
- Preserved lazy cover loading, async image decoding, debounced Library search, hidden-tab activity suspension, and offscreen optimization for non-card sections.
- Kept the Acquisition Assistant tab and all 1.5.4+ functionality.

# Vaultarr 1.5.6 — Floating Card Motion Restoration

- Restores the exact floating-card hover and tilt controller from 1.5.4.
- Removes paint/style containment from library cards so lift, depth, gloss, cover parallax, and shadows render correctly.
- Retains lazy image loading, debounced search, hidden-tab suspension, selective Focus Mode loading, and offscreen optimizations elsewhere.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.5.6 - Performance Foundation

- Replaced per-card global listeners with one delegated, frame-throttled hover controller.
- Added lazy image loading and asynchronous decoding across library-heavy pages.
- Added offscreen rendering containment for long grids and timeline content.
- Debounced library search to reduce main-thread work while typing.
- Pauses nonessential visual activity when the browser tab is hidden.
- Loads Focus Mode JavaScript only when a page contains expandable game cards.
- Preserves existing visuals, card expansion, navigation, Curator, manuals, and Acquisition Assistant behavior.

## 1.5.6 — Expanded Card Acquisition Tab

- Added the Acquisition Assistant directly to the expanded game card tabs.
- Live reference search, exact source-page fallback, final-link saving, and local-file attachment now work without leaving the Library.
- Existing full game details remain available as a secondary management path.
- Preserved Curator, manuals, card expansion, Focus Mode, and navigation behavior.


## 1.5.6 — Live Acquisition Assistant

- Removed Personal Acquisition Index uploads and management.
- Added live Vimm Vault reference searching from each game record.
- Added automatic title/platform ranking and exact source-page discovery.
- Added source-page URL fallback when live search is unavailable.
- Added a user-supplied final-link field and local-file attachment workflow.
- Preserved Curator, manuals, cards, navigation, and metadata behavior.

# 1.5.6 — Advanced Navigation Layout Fix

- Fixed Advanced Mode sidebar links collapsing onto the same line.
- Restored the standard full-width flex layout for every advanced navigation item.
- Moved Milestones into Standard Mode so achievement and collection progress remain visible to all users.
- Preserved Personal Acquisition Indexes, Curator, manuals, card expansion, and navigation motion behavior.

# 1.5.0 — Personal Acquisition Indexes

- Added administrator-uploaded JSON and CSV acquisition catalogs.
- Added local catalog validation, normalization, indexing, search, and management.
- Added game-level acquisition search, source-page handoff, link copying, and local-file attachment.
- Preserved the stable Vaultarr 1.4.10 navigation, cards, Curator, manuals, and Universal Search behavior.
- Updated GHCR publishing to create both `latest` and version-specific image tags.

# 1.4.10 — Navigation Load Consistency

- Prepared sidebar destinations before beginning the exit animation.
- Reused in-flight requests and ignored duplicate clicks to the same route.
- Added a brief cache lifetime while respecting Unified Vault State invalidation.
- Delayed the loading sweep until a request takes longer than 160 ms.
- Added request timeout and graceful full-navigation fallback behavior.
- Preserved existing sidebar motion timing and all current interaction systems.

# 1.4.9 — Unified Vault State

- Added a shared client-side Vault state for library mutations.
- Games added through Discover & Add now invalidate prefetched Library, Home, Collections, Curator, and Discover pages immediately.
- Smooth navigation now bypasses stale cached HTML after a game is added, edited, or removed.
- Opening Library later from another page now fetches the current server state without requiring a browser refresh.
- Preserved live insertion when the user is already viewing Library.
- Added route-family cache invalidation so category-specific Library pages cannot reuse stale counts or cards.
- Kept Universal Search, card expansion, Curator progress, manuals, and navigation motion unchanged.

# 1.4.9 — Navigation Motion Stability

- Fixed the delayed jerk/stutter that appeared after otherwise smooth sidebar page transitions.
- Prevented the interaction repair layer from removing active navigation animation classes mid-transition.
- Added explicit navigation ownership tracking so stale-state recovery only runs after motion has completed.
- Preserved page-specific interaction reinitialization without interrupting the entrance animation.
- Left card expansion, Universal Search, Curator, manuals, and live library synchronization unchanged.

# 1.4.9 — Live Library Synchronization

- Added a lightweight client event system for live application updates.
- Discover & Add now emits a game-added event instead of redirecting or requiring a refresh.
- Added an API-rendered library card endpoint for newly created records.
- New game cards are inserted into the active Library view with a smooth arrival animation.
- Library category totals, search counts, filtering, sorting, hover motion, and card expansion now recognize inserted games immediately.
- Added a global success notification with a direct View action.
- Existing records are handled without duplicate cards.
- Retained the published GHCR image as the default production Docker installation.

# 1.4.6 — Interaction Reliability Repair

- Repaired universal search reopening and mode switching.
- Removed the competing Library Ctrl/Cmd+K handler.
- Prevented invisible search layers from intercepting the rest of the UI.
- Reinitialized card interactions after smooth page swaps.
- Restored reliable hover behavior for game cards and Discovery timeline capsules.
- Added a shared post-navigation interaction cleanup pass.

# 1.4.5 — Universal Search Interaction Fix

- Fixed the search field becoming non-interactive after switching between **My Museum** and **Discover & Add**.
- Search text is preserved when changing modes and the field immediately regains focus.
- Cancelled stale search responses can no longer overwrite the newly selected mode.
- Added explicit control-state restoration for the search field, platform hint, and information-source selector.
- Kept Universal Search, Curator, card expansion, manuals, and navigation behavior otherwise unchanged.

# 1.4.5 — Universal Search & Add

- Replaced the separate search-to-add page with one Universal Search dialog.
- Added **My Museum** and **Discover & Add** modes to the sidebar search.
- Discover mode searches enabled game-information sources and adds a selected release directly to the museum.
- Added an in-search preview with optional folder path and category selection.
- Newly added games are automatically queued for Curator preparation.
- Library **Add Game** now opens the detailed manual-entry form for custom and unmatched titles.
- Existing card, Curator, manual, and navigation behavior remains unchanged.
- Retained the published GHCR image in all production Docker examples.

# 1.4.3 — Search-to-Add Games

- Reworked **Add Game** into a search-first workflow.
- Searches all enabled game-information sources or one selected source.
- Optional platform hints improve ranking without hiding other releases.
- Added a polished result list with covers, source labels, and match confidence.
- Added a preview dialog showing the selected release before it is created.
- One-click add stores the provider record, downloads available cover art, and queues Curator preparation.
- Preserved the full manual-entry form as a fallback for fan games, prototypes, homebrew, and obscure releases.
- Added responsive mobile layouts and reduced-motion support.
- Retained the published GHCR image in all production Docker examples.

# 1.4.2 — Smooth Curator Progress

- Interpolates Curator progress continuously between live server updates.
- Smoothly animates both the bar and percentage from the first click through completion.
- Removes visible polling jumps without changing curator matching or provider behavior.
- Preserves the production GHCR Docker setup and release documentation.

# 1.4.1 — Live Curator Progress

- Curator jobs now start asynchronously and return control to the browser immediately.
- Added per-game progress and status endpoints.
- Progress reflects real curator stages instead of requiring a page refresh.
- Completed rows update in place with no full-page reload or HTML flash.
- Added unobtrusive success and failure notifications.
- Preserved the simplified Curator Experience, manual providers, card expansion, and navigation motion.

# 1.4.0 — The Curator Experience

- Added Standard and Advanced interface modes.
- Simplified primary navigation and user-facing Curator language.
- Added automatic Curator queue preference for newly scanned games.
- Added one-at-a-time automatic preparation from the Curator page.
- Moved provider, cache, and diagnostic surfaces behind Advanced Mode.
- Preserved manual editing, metadata locks, card behavior, and established motion systems.

# 1.3.5 — Curator Determinate Progress

- Curate now reacts immediately without requiring a page refresh.
- Replaced the indeterminate bar sweep with a smooth percentage-based fill.
- Added staged progress labels and continuously updating percentages while cataloging runs.
- Preserved the server-provided final readiness score as the authoritative result.

# 1.3.4 — Expanded Card Game Actions

- Added Actions tab and safe Deaccession flow directly inside expanded game cards.
- Original game files are never deleted.
- Added smooth card removal after a successful catalog deletion.

# 1.3.4
- Added safe per-game removal, optional cached asset cleanup, and scan-ignore restoration.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.3.2 — UI Component Polish

- Replaced browser-native checkboxes with unified VaultToggle and VaultCheckbox styling.
- Increased control size, spacing, and touch targets throughout Vaultarr.
- Added smooth hover, press, focus, enable, and disable states.
- Standardized controls across Studio, Time Capsule, game editing, and manual entry.
- Preserved existing Curator, card, Focus Mode, and sidebar behavior.

## 1.3.1 — Curator Progress Feedback
- Added a smooth visible loading bar while an individual game is being curated.
- Added rotating cataloging-stage messages and a disabled working button state.
- Added completion and retry feedback without changing Curator matching behavior.
- Added reduced-motion support for the new progress indicator.

## 1.2.4
- Fixed Vimm PDF downloads that returned HTTP 400 when a manual was scanned below the hardcoded 200 DPI request.
- Vaultarr now reads each Vimm manual detail page, uses that manual's actual maximum source DPI, preserves provider cookies, and retries lower supported resolutions when necessary.
- Kept global Vimm searching, cross-platform results, local manual caching, card expansion, Focus Mode, and sidebar motion unchanged.

## 1.2.3
- Fixed Vimm searches to use the provider's all-platform endpoint (`/manual/?p=list&q=...`) before any system-specific fallback.
- Preserved alternate-platform manual results and direct PDF downloads.
- Reduced unnecessary Vimm requests to avoid empty results and throttling.

## 1.2.2
- Fixed Vimm live-search request compatibility and result parsing.
- Added browser-compatible headers/cookie and reduced request concurrency.
- Added support for both known Vimm manual detail URL formats.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.2.2

- Added live Vimm Manual Project search across supported systems.
- Added direct Vimm PDF downloading with response filename and PDF validation.
- Changed Vimm provider status from empty cache to Live Search.
- Preserved cross-platform manual results and same-platform ranking bonuses.

# Vaultarr 1.2.0 — Local Manual Catalog

## Added
- SQLite-backed local manual catalog inspired by LaunchBox metadata caching.
- Catalog ingestion for VideoGameManual.com and manuals-only Vimm Manual Project links.
- Full-catalog title search with fuzzy matching.
- Cross-platform results: platform improves ranking but never filters manuals out.
- Manual catalog status, refresh, and clear controls in Settings.
- Automatic first-search catalog build and seven-day stale refresh behavior.
- API endpoints for catalog status, search, refresh, and clear.

## Preserved
- Exact 1.1.21 sidebar motion.
- Card UI, card expansion, Focus Mode, and the card-close flicker repair.
- Correct production Docker Compose using `ghcr.io/linkssy2/vaultarr:latest`.

## Notes
The catalog stores provider listings only. Manual PDFs are downloaded only after a user selects a result. Provider availability and site structure can affect catalog coverage.


# Vaultarr 1.2.0 — Manual Provider Reliability Update

## Added
- Vimm's Lair Manual Project as a manuals-only fallback provider.
- Conservative same-domain crawling limited to manual-related pages.
- Weekly local caching for Vimm manual catalog results when direct PDFs are exposed.
- Platform-aware, confidence-ranked results across dedicated manual sources.

## Improved
- VideoGameManual.com remains the primary indexed provider and now checks an additional legacy index page variant.
- Removed broad Google/replacementdocs searches from the default manual workflow.
- Updated provider descriptions, source links, and manual search controls.
- Updated README with manual-provider behavior and the production GHCR Docker setup.

## Safety
- Vimm integration blocks Vault, ROM, ISO, and download-area routes.
- Downloads still require a direct PDF URL, a valid `%PDF-` signature, and remain capped at 250 MB.
- No card UI, Focus Mode expansion, sidebar motion, metadata, database, or preservation behavior was changed.

# Vaultarr 1.1.22 — Active Route Reload Fix

## Fixed

- Clicking the Library category that is already active no longer performs a full browser reload.
- Prevents the raw-HTML flash seen when clicking **All Games** while already viewing **All Games**, and applies the same protection to equivalent active links throughout Vaultarr.
- Keeps the exact 1.1.21 sidebar motion, card UI, card expansion, Focus Mode, and close-flicker fix unchanged.

## Deployment

- The production Compose example now pulls `ghcr.io/linkssy2/vaultarr:latest` instead of using `build: .`.
- README includes Linux, Windows, Dockge, update, and local-development instructions.

# Vaultarr 1.1.22 — Exact Sidebar Motion Restoration

This patch restores the sidebar navigation animation directly from the confirmed 1.1.7 source rather than approximating its appearance.

## Fixed

- Restored the exact 1.1.7 outgoing fade, downward drift, scale, blur, timing, and easing.
- Restored the exact 1.1.7 entrance animation and handoff timing.
- Sidebar motion now begins immediately on click, matching the original interaction flow.
- Retained the newer prepared-page loading, page cache, script restoration, and HTML-flash protection.
- Preserved the 1.1.18 Focus Mode close-flicker repair.
- Card UI, hover behavior, expansion geometry, Focus Mode layout, and backend behavior remain unchanged.

# Vaultarr 1.1.22 — Sidebar Motion Restoration

## Fixed
- Restored the original smooth 1.1.7-style motion specifically for sidebar navigation.
- Sidebar destinations still load and prepare before the visual swap, preventing the old exposed-HTML flash.
- Removed the native snapshot transition from sidebar clicks, which was making section changes feel abrupt.
- Preserved the 1.1.17 rendering improvements and the 1.1.18 Focus Mode close-flicker fix.
- Left card styling, hover behavior, expansion geometry, Focus Mode, and backend logic unchanged.

## Vaultarr 1.1.18

### Smooth Rendering & Transition Engine
- Kept the current screen visible until the destination view is fully fetched and parsed.
- Removed full-page flashes when switching Library categories and other internal sections.
- Extended smooth navigation to ordinary same-origin page links rather than sidebar links only.
- Added safe destination prefetching, stale-request cancellation, Back/Forward support, and page-local script restoration.
- Preserved the 1.1.7 card UI and Focus Mode expansion engine without modifying their animation geometry or timing.
- Left all backend, database, metadata, scanning, preservation, and archive behavior unchanged.

# Changelog

## 1.7.9 - Rebuilt Museum Scan Control

- Removed both competing scan-control styles and rebuilt one isolated component.
- Replaced fragile direct/delegated mixed bindings with one click controller.
- Kept page initialization status-only so refresh cannot start a scan.
- Added a calm independent drawer with a two-stage close.

## 1.1.3
- Rebuilt the official app icon without the dark outer outline.
- Restored the login Orbital Vault core to its original CSS animation.
- Fixed the oversized cropped login icon.
- Removed wrapper borders, backgrounds, and shadows from sidebar and login brand marks.

## 1.1.3 — Branding Consistency

- Restored the original blue rounded-square Vaultarr icon in the sidebar.
- Applied the same official icon to browser favicons, pinned shortcuts, PWA assets, and the login page.
- Added reusable SVG and 512px branding assets.
- Kept the animated Orbital Vault core unchanged.

## Vaultarr 1.0

First public-ready release of Vaultarr.

### Highlights
- Library scanner and Collector Focus game view.
- Metadata Engine with provider intelligence.
- Manual Engine with indexed manual provider support.
- Media Library with covers, gallery images, trailer assets, and cache management.
- Trailer Finder and cinematic Trailer tab.
- Patch Engine for community fixes and compatibility references.
- Preservation Mission Control.
- Smart Collections and Collection Experience.
- Time Capsule backup/export/import workflow.
- First-run onboarding and reset vault workflow.
- Docker-ready structure.

## Previous development builds

Vaultarr moved through the Alpha 1–30 series before the 1.0 release. Detailed historical notes are retained in `docs/` where available.

## 1.3.0
- Added the Museum Curator Engine, queue, readiness score, history, safe metadata-lock behavior, and high-confidence automated enrichment.

## 1.7.4 — Refined Pill Scan Control

- Resized **Scan Museum** and **Search Museum** to match Vaultarr's compact pill controls.
- Reworked the scan transition into a quieter vertical expansion with ordered content fades.
- Reduced scan-card height, padding, and progress-track weight for a cleaner sidebar fit.
- Added a longer, smoother completion contraction so status content fades before the pill returns.
- Preserved the museum scan engine and protected 1.5.8 interaction baseline.
