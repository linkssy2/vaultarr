# Vaultarr 2.0.0 Alpha 44 — Screenshot-First Game Overview

Alpha 44 makes the expanded game Overview easier to scan by putting the game itself ahead of storage and metadata details.

## Overview changes

- The cover column now contains only the full game artwork.
- The Overview keeps the description, then presents the saved trailer followed by up to four cached in-game screenshots.
- The trailer reuses the URL, provider, title, embed source, and thumbnail already stored by the Trailer workspace and plays directly on Overview when embedding is available.
- Leaving Overview stops any active trailer playback and restores the calm trailer poster.
- Screenshot cards open the existing Gallery workspace for a larger view and the complete media collection.
- Games without cached screenshots show a quiet empty state with a direct Gallery action.

## Information changes

- Size, file count, executable count, category, source type, and metadata lock status now live beneath the core metadata in Information.
- Existing field IDs and data hydration remain intact; only their presentation location changed.

## Removed obsolete code

- Removed artwork source, artwork type, resolution, and lock markup beneath the cover.
- Removed their JavaScript selectors and update callbacks.
- Removed the unused artwork metadata styles and scrollbar selectors.

## Preserved behavior

- Expanded-card dimensions, full-card artwork, hover, lift, tilt, gloss, and expansion are unchanged.
- Routes, navigation, Museum cards, Manual, Acquisition, Backup, Scan, and Milestone systems are unchanged.

## Validation target

- Confirm the saved trailer appears before the screenshot gallery, plays in place, and opens the full Trailer workspace.
- Confirm saved screenshots appear on Overview and open Gallery when selected.
- Confirm technical game details appear in Information with their original values.
- Confirm the removed cover metadata panel no longer leaves unused space or browser errors.
- Run Python compilation, template compilation, JavaScript syntax checks, and browser inspection.
