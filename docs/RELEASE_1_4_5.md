# Vaultarr 1.4.5 — Universal Search Interaction Fix

This patch fixes Universal Search controls becoming unusable after changing between **My Museum** and **Discover & Add**.

## Fixed

- The main search field remains clickable and typeable after every mode change.
- The existing query is preserved and searched in the newly selected mode.
- The search field is focused automatically after switching modes.
- Platform and information-source controls remain enabled in Discover mode.
- Older in-flight requests are ignored after a mode change, preventing stale results from replacing the active context.

No changes were made to metadata matching, Curator processing, manuals, expanded cards, Focus Mode, or sidebar navigation.
