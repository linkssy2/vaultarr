# Museum Scan callback audit — Alpha 11

Active frontend scan callbacks after the rewrite:

- One `click` listener on the Museum Scan pill.
- One read-only status poll while a scan is running.
- One request-animation-frame loop for progress interpolation.
- One reset timer after completion or failure.

Removed:

- Legacy `VaultarrMuseumScan` global controller.
- Legacy scan DOM selectors and state classes.
- Legacy scan stylesheet and controller assets.
- Legacy scan-specific layout overrides in `familiar-experience.css`.
- Any visibility-change, page-navigation, delegated capture, popup, drawer, or Activity-page scan callbacks.

Compatibility routes for retired Activity/Curator pages remain server-side redirects only and do not register frontend callbacks.
