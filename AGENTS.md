# Vaultarr Development Rules

## Project

Vaultarr is a museum-style game cataloging and preservation application.

Current baseline: Vaultarr 2.0.0 Alpha 36.

## Protected systems

Do not alter these unless the task explicitly requires it:

- Museum card dimensions and full-card stretched artwork
- Hover, lift, tilt, gloss, and card expansion
- Museum Scan button behavior and shimmer
- Orbital Core on Home
- Sidebar layout and navigation
- Authentication behavior
- Manual system
- Acquisition Assistant
- Museum Backup
- Milestone percentage calculation
- Two-layer Milestone Progress container

## Development rules

- Make only the requested change.
- Do not redesign unrelated pages.
- Remove obsolete code when replacing an implementation.
- Search for old callbacks, selectors, and unused assets before adding replacements.
- Preserve existing routes unless a redirect is explicitly required.
- Update `VERSION`, `CHANGELOG.md`, `README.md`, and release notes for each build.
- Run Python compilation and JavaScript syntax checks.
- Run the application when possible and inspect the affected page.
- Show the final diff before committing.
- Never claim a visual fix was verified unless it was inspected in the running application.

## Releases

- Use versions in this format: `2.0.0-alpha.N`.
- Create one focused commit for each Alpha build.
