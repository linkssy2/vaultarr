# Vaultarr 1.1.12 — Mobile UX Overhaul

Vaultarr 1.1.12 consolidates the mobile compatibility work into a deliberate mobile interaction system while preserving the existing desktop experience and backend behavior.

## Highlights

- Unified mobile app bar with page-aware titles and overlay back behavior
- Accessible navigation drawer with focus trapping, restored focus, and shared responsive state
- Dynamic viewport and software-keyboard handling using the Visual Viewport API
- Consistent phone safe-area spacing for notches and gesture bars
- Reworked mobile Focus Mode with a shorter hero, sticky tab navigation, simpler metadata presentation, and one primary vertical scroller
- Full-screen, keyboard-safe global search on mobile
- Standardized 48px touch targets, form stacking, action hierarchy, and pressed states
- Normalized poster grids and compact mobile card typography
- Improved archive, queue, discovery, and list records
- More predictable table scrolling with sticky headings
- Landscape-specific Focus Mode behavior
- Reduced mobile animation and rendering load
- Expanded reduced-motion support
- Desktop layout and all backend functions remain unchanged

## Stability scope

No changes were made to API routes, authentication, database models, migrations, scanning, metadata providers, preservation, archive creation, or file operations.
