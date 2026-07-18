# Vaultarr 2.0.0 Alpha 39 — In-App Preservation Player

## Simple Play workflow

- Adds a **Play** tab near the front of each expanded Museum card.
- Shows a single **Start Game** action when the game is ready.
- Replaces emulator terminology with a direct missing-file message when a game file has not been added.
- Shows a direct PlayStation BIOS action only when a PlayStation file requires it.
- Keeps replacement, removal, and system-file controls under the collapsed **Player setup** section.

## Initial systems

- Nintendo Entertainment System (`.nes`)
- Super Nintendo (`.sfc`, `.smc`)
- Sega Genesis / Mega Drive (`.md`, `.gen`, `.smd`, `.32x`)
- Game Boy / Game Boy Color (`.gb`, `.gbc`)
- Game Boy Advance (`.gba`)
- PlayStation (`.chd`, `.pbp`, `.zip`) with a user-supplied BIOS

## Storage and player lifecycle

- Stores one game file per Museum record inside Vaultarr's local configuration volume.
- Stores the PlayStation BIOS once so it can be reused by PlayStation records.
- Validates extensions and file sizes before replacing an existing file.
- Streams game and BIOS files through Vaultarr's authenticated, range-capable routes.
- Loads the player only after **Start Game** is pressed and unloads it on exit, tab change, or card close.

## Runtime and ownership

Alpha 39 pins the web player to EmulatorJS 4.2.3 from the project's official CDN. Internet access is required to load the runtime in this preview; imported game and BIOS files remain local to Vaultarr. A self-hosted runtime bundle is recommended before this feature leaves experimental status.

Vaultarr does not include, search for, download, extract, or execute ROM or BIOS files. Users must supply files they own or are authorized to preserve.

## Preserved systems

Museum card dimensions, full-card artwork, hover/lift/tilt/gloss/expansion behavior, Acquisition Assistant, Museum Scan, Orbital Core, sidebar navigation, authentication, Manual, Museum Backup, Milestone calculation, and the two-layer Milestone container are unchanged.
