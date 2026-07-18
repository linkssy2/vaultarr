# Vaultarr 2.0.0 Alpha 45 — Museum Welcome Experience

Alpha 45 gives first-time users a calm, visually memorable introduction that establishes Vaultarr as a digital museum before asking for technical setup information.

## Three-stage welcome

1. **Welcome** explains Vaultarr's museum-first purpose and its preservation principles.
2. **Collection** connects the first game folder directly from onboarding with familiar path examples and clear file-safety guidance.
3. **Ready** confirms the connected collection and explains the next Museum, Scan, and curation steps.

## Motion and accessibility

- Panels fade, glide, and settle through a height-aware transition instead of appearing abruptly.
- A restrained animated museum seal creates a focal point without borrowing or changing the protected Home Orbital Core.
- The current step is exposed through accessible progress controls and focus moves with panel changes.
- Reduced-motion preferences disable nonessential movement and shorten transitions.
- The layout collapses cleanly for tablet and mobile widths.

## Setup behavior

- `/onboarding` remains the first-run route and continues to receive users when no library exists.
- `/onboarding/library` stores the same library name and path information used by Settings, then returns to the ready stage.
- No game files are moved, executed, or scanned during onboarding.
- Museum Scan remains a separate, user-started action using the protected sidebar control.
- Existing libraries are listed when onboarding is revisited, and established users can return Home.

## Preserved systems

- Authentication behavior and login lifecycle are unchanged.
- Sidebar layout, Museum Scan behavior, Settings library management, routes, and existing data remain intact.
- Museum cards, Home Orbital Core, Manual, Acquisition, Backup, and Milestone systems are unchanged.

## Validation target

- Verify the Welcome, Collection, and Ready panels transition smoothly in the running application.
- Verify the collection form stores a path and returns to the Ready stage without triggering a scan.
- Verify existing-library onboarding and first-run empty-library onboarding both render correctly.
- Run Python compilation, template compilation, JavaScript syntax checks, and browser inspection.
