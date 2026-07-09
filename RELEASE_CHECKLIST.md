# Vaultarr Release Checklist

Before publishing a release:

- [ ] Start from a clean checkout.
- [ ] Confirm no personal database is included.
- [ ] Confirm `config/`, `database/`, `screenshots/`, `tests/`, and `tools/` only contain placeholders unless intentional.
- [ ] Search for secrets: `api_key`, `client_secret`, `token`, `bearer`, `password`.
- [ ] Run a clean install test.
- [ ] Confirm first-run onboarding appears.
- [ ] Build Docker image successfully.
- [ ] Test docker-compose startup.
- [ ] Update `CHANGELOG.md`.
- [ ] Tag release.
- [ ] Upload release ZIP.

Recommended release title:

```text
Vaultarr 1.0
```

Recommended tagline:

```text
Your games deserve a museum.
```
