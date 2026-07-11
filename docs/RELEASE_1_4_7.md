# Vaultarr 1.4.8 — Live Library Synchronization

Vaultarr now updates the Library immediately after a game is added through Universal Search.

## Highlights

- No browser refresh is required after **Add to Museum**.
- The new game card is fetched from Vaultarr and inserted into the current Library view.
- Cards arrive with a smooth animation and a temporary **Preparing…** state.
- All Games and category totals update live.
- Existing Library filtering, sorting, hover effects, and Focus Mode work on the new card.
- A reusable event layer broadcasts `game-added` changes to the interface.
- A toast confirms the addition and provides a direct View action.
- Existing games are recognized and are not duplicated.

## Deployment

Production installations should continue pulling the published image:

```yaml
services:
  vaultarr:
    image: ghcr.io/linkssy2/vaultarr:latest
```

Restart the container and hard-refresh the browser after upgrading so the 1.4.8 JavaScript bundle is loaded.
