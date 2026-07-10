# Vaultarr 1.1.18 — Calm Transitions & Focus Close Fix

Vaultarr 1.1.18 refines the shared rendering engine introduced in 1.1.17 without changing the card UI or Focus Mode design.

## Improvements

- Page and section transitions use longer, calmer timing and gentler easing.
- Transition movement and blur are reduced to avoid abrupt motion.
- Current content remains visible while destinations are prepared.

## Fixes

- Fixed the rectangular flicker at the bottom-left after a game card finished closing.
- Focus Mode now recalculates the live card destination before closing.
- The closing panel is made fully transparent before its inline geometry is cleared, preventing a one-frame fixed-position reflow.

## Stability

The card appearance, expansion layout, content tabs, backend, database, scanning, metadata, preservation, and archive behavior are unchanged.
