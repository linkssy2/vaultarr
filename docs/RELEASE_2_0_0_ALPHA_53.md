# Vaultarr 2.0.0 Alpha 53 — Default Orbital Liquid

Alpha 53 restores the original white Museum Health liquid inside the Home Orbital's V when Vaultarr is using its default Vault Blue theme.

## Changes

- Uses the original white liquid palette for the Home Orbital under the default Vault Blue preset.
- Continues deriving the Home Orbital liquid from active theme colors for alternate presets and custom themes.
- Exposes the active preset and custom-theme state to the liquid renderer without changing theme storage or switching behavior.
- Refreshes the Orbital liquid asset keys for deployed and Docker-hosted clients.

## Preserved systems

- Museum Health percentage and fill height are unchanged.
- V-shaped clipping, spring points, damping, tension, inertia, neighbor propagation, bubbles, and surface disturbances are unchanged.
- The protected Orbital Core layout and animation are unchanged.
- Milestone, Discovery Depth, and Museum Scan liquids continue using their active theme colors.

## Validation

- Python modules compile successfully.
- JavaScript assets pass syntax validation.
- Jinja templates parse successfully.
- Default and alternate-theme Orbital liquid colors were inspected in the running application.
- The browser console was checked for runtime errors.
