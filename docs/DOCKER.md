# Docker

Basic compose example:

```yaml
services:
  vaultarr:
    image: vaultarr:latest
    container_name: vaultarr
    ports:
      - "5058:5058"
    volumes:
      - ./config:/config
      - /mnt/games:/games
      - /mnt/vaultarr/backups:/backups
    restart: unless-stopped
```

Vaultarr should keep persistent application data in `/config` and treat mounted game libraries as external read/write paths configured by the user.
