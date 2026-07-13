# Vaultarr 1.6.1 — Live Activity Repair

This patch repairs the Museum Experience Activity page.

## Fixed

- Activity JavaScript is now loaded globally so smooth navigation cannot leave the page inactive.
- Clicking **Prepare** responds immediately and starts live progress polling.
- Queued and running jobs resume their progress UI automatically when the Activity page is opened.
- Progress bars and percentages update smoothly without a page reload.
- Completed actions return to the **Prepare** label rather than the legacy **Curate** label.
- **Prepare Next 5** no longer runs through a blocking full-page form submission.

## Protected UX

No changes were made to floating card hover/tilt, expanded cards, Focus Mode, sidebar motion, Universal Search, manuals, or acquisition behavior.
