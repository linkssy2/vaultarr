# Vaultarr 2.0.0 Alpha 40 — Player Performance Mode

## Playback isolation

- Activates a lightweight rendering mode only after **Start Game** is pressed.
- Stops rendering the blurred Museum page behind the expanded card.
- Hides card artwork, metadata, navigation tabs, decorative gradients, and large shadows while the emulator is active.
- Gives the player the expanded card's full internal workspace while retaining **Exit Player**.
- Restores the regular Play tab and its previous scroll position immediately after exit.

## Emulator capability selection

- Removes the unconditional `EJS_threads = false` setting.
- Enables a threaded core only when the page is already cross-origin isolated and `SharedArrayBuffer` is available.
- Keeps the compatible single-threaded core everywhere else.
- Does not add global COOP/COEP headers in this build because those headers can affect Vaultarr's existing cross-origin artwork, video, soundtrack, and provider integrations.

## Application performance audit

- Consolidates seven redundant Home statistics reads and six redundant Milestones reads into existing aggregate queries.
- Keeps the Home health scores, achievement values, badge progress, and protected Milestone percentage byte-for-byte equivalent for the same database state.
- Cancels a global search request as soon as a newer query, search mode, or closed dialog makes its result obsolete.
- Suspends CSS animations while the browser tab is hidden, then resumes them when it becomes visible.
- Confirms that Museum Scan polling is active-scan-only and that Museum card animation frames settle and stop; neither lifecycle was changed.

## Deferred architecture work

The audit found that the shared base currently loads roughly 372 KB of CSS, 280 KB of JavaScript, and the expanded-card shell on every page. Splitting those assets safely requires making the smooth-navigation loader page-asset-aware first. That broader lifecycle migration is intentionally deferred instead of risking partial pages or changing the current navigation transitions in Alpha 40.

## Preserved behavior

ROM and BIOS storage, authenticated streaming, save states, fullscreen, controller input, player controls, expanded-card dimensions, Museum Scan, Orbital Core, sidebar navigation, authentication, Acquisition Assistant, Manual, Museum Backup, and Milestone systems are unchanged.
