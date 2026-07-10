# Vaultarr 1.1.18 — Smooth Rendering & Transition Engine

Vaultarr 1.1.18 is a focused frontend polish release built directly from the stable 1.1.7 source.

## What changed

- Internal section and category links now use one shared smooth-navigation path.
- The current screen remains fully visible while the destination is fetched and prepared.
- Content only fades after the replacement view is ready, preventing blank flashes and exposed page reconstruction.
- Library categories such as All Games, Abandonware, Fanmade, PC Port, Steam, and Manual transition without a full browser refresh.
- Collection shelves, archive links, discovery links, preservation links, settings links, and other internal sections receive the same behavior.
- Likely destinations are prefetched on pointer hover or keyboard focus for faster perceived navigation.
- Rapid repeated navigation cancels stale requests instead of allowing overlapping swaps.
- Browser Back and Forward navigation use the same transition system.
- Page-local inline scripts are restored after a smooth content swap so interactive sections continue working.
- Navigation failures safely fall back to a normal browser load.

## Protected systems

The game-card UI, card hover engine, Focus Mode expansion geometry, opening animation, closing animation, artwork layout, and expanded-card tab system were intentionally left unchanged.

Only card initialization after a newly loaded page continues through the existing `vaultarr:page-loaded` event.

## Backend impact

No database, API, authentication, scanning, metadata, archive, preservation, or file-operation behavior was changed.
