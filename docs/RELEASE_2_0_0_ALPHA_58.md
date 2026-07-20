# Vaultarr 2.0.0 Alpha 58 — Settings Control Room

Alpha 58 replaces the previous Settings dashboard stack with a dedicated control-room interface designed around user intent.

Control-room changes now glide into position with a slower overlapping fade, gentle directional travel, and a smoothly eased height transition between rooms of different sizes.
The transition boundary preserves the complete room edge throughout left-to-right and right-to-left movement.

## Highlights

- A persistent category rail keeps General, Game Folders, Appearance, Access, Backup, advanced Sources, and Reset easy to find.
- One focused workspace replaces the long page and nested accordion model.
- Room changes use calm opacity and position transitions while retaining direct anchors and saved-action feedback.
- Desktop and mobile layouts use the same information structure, with a horizontally scrollable category rail on smaller screens.
- Every existing settings form, field, action, route, provider option, theme control, library tool, cache tool, and reset safeguard remains available.
- Authentication behavior and Museum Backup behavior are unchanged.
- Detached Home orbital engines are cleaned up after navigation instead of accumulating background animation work.
- Automatic due backups run through a non-blocking, single-flight check rather than delaying Settings.
- Home and Settings share a brief filesystem-stat cache, and superseded sidebar requests are cancelled before they can pile up.

## Validation target

- Python compilation
- JavaScript syntax checks
- Jinja template parsing
- Desktop and mobile Settings inspection
- Browser-console inspection
