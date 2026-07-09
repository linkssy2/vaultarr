# Vaultarr 1.1 — Authentication

## Added
- Sonarr-style Forms authentication.
- VaultOS login page.
- Studio → Security → Vault Access settings.
- Session-based login/logout.
- Password hashing via Werkzeug.
- Optional Docker/bootstrap environment variables for first admin credentials.

## Notes
- Authentication is disabled by default for existing installs.
- Enable it from Studio when exposing Vaultarr outside the LAN.
- Use HTTPS/reverse proxy protection for public exposure.
