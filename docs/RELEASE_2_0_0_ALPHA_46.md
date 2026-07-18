# Vaultarr 2.0.0 Alpha 46 — Integrated Museum Access

Alpha 46 turns the login screen into one continuous Vaultarr entrance rather than placing a credential dialog over the existing animation.

## Integrated composition

- The animated orbital core remains fully visible as the Vaultarr identity and visual anchor.
- A pulsing access bridge carries the eye from the core into a dedicated museum-access chamber.
- The credentials sit beside the orbital system instead of obscuring its center.
- A compact masthead and museum message establish the screen as an entrance to a private collection.
- The duplicate logo previously displayed inside the login form has been removed.
- The masthead and orbital core use the canonical Vaultarr application logo, and all login controls use the shared application font stack.

## Interaction and motion

- Orbital rings, collection nodes, stars, nebula, comet, core breathing, and status lighting continue moving at calm independent rates.
- Focused inputs illuminate the access chamber without abrupt layout changes.
- Submitting the form changes the action to Opening Museum, disables duplicate submissions, and accelerates the chamber scan line while the existing POST completes.
- Reduced-motion preferences disable nonessential movement.
- Tablet and mobile layouts move the orbital above the access chamber without covering the form.

## Authentication behavior

- The existing `/login` GET and POST route is unchanged.
- Username and password field names, autocomplete behavior, hidden next route, credential verification, session creation, redirects, and error messages are unchanged.
- Logout and authentication settings are unchanged.

## Validation target

- Verify the orbital remains visible and visually connected to the login chamber at desktop size.
- Verify the form remains readable and usable without overlapping the animation.
- Verify failed credentials display the existing error and successful credentials preserve the original redirect behavior.
- Run Python compilation, template compilation, JavaScript syntax checks, and browser inspection.
