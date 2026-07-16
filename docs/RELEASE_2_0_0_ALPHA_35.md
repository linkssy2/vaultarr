# Vaultarr 2.0.0 Alpha 35 — Fluid Simulation Lifecycle

## Liquid engine

- Canvas-rendered spring-point surface
- Damping, tension, inertia, and direct neighbor propagation
- Bubble pops as the only source of surface disturbance
- Strong localized pop impulses spread across nearby spring points
- Pronounced waves that propagate and settle naturally
- Percentage-based liquid fill
- Border-aware interior fill mapping so low percentages remain visible
- High-visibility cyan surface crest without altering liquid depth
- Inner-vessel canvas clipping
- Visibility and offscreen pausing with capped 45 Hz simulation updates
- Cleanup of detached engines, observers, and listeners after smooth navigation

## Typography

Milestone Progress remains aligned to the upper inner-circle arc.

## Glass enclosure

- Existing two-layer structure and dimensions preserved
- Refracted inner highlights
- Sealed contact rim
- Embedded mounting shadow and glass depth

## Experimental Docker channel

- Branch image: `ghcr.io/linkssy2/vaultarr:2.experimental`
- `vaultarr-2.0-alpha` publishes only the experimental tracking tag
- `main` continues to publish `latest` and the numbered release tag

The protected two-layer container, dimensions, progress calculation, hero layout, badges, achievements, routes, and sidebar are unchanged.
