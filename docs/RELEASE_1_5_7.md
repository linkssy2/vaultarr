# Vaultarr 1.5.7 — Floating Card Interaction Restoration

This patch restores the exact floating card hover, tilt, lift, gloss, and expanded-card startup behavior while retaining the safe performance improvements from 1.5.5.

## Fixed

- Focus Mode and its card controller now load synchronously again.
- The performance loader no longer intercepts card clicks in the capture phase.
- Library card wrappers no longer use `content-visibility`, which can imply paint containment and clip 3D effects.
- First hover and first expansion no longer depend on a delayed script load.

## Retained optimizations

- Lazy cover loading and asynchronous image decoding
- Debounced Library search
- Hidden-tab activity suspension
- Offscreen rendering optimization for Discovery, Timeline, and Collections

The Acquisition Assistant and all other 1.5.6 features remain intact.
