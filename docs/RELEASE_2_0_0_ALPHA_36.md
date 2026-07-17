# Vaultarr 2.0.0 Alpha 36 — Interface and Scan Responsiveness

- Consolidates the Home hero around an enlarged glowing blue badge with a hollow white Vaultarr V whose canvas liquid visualizes Museum Health and uses bubble-pop impulses, spring points, damping, tension, inertia, and neighbor propagation; a same-size outer orbital node displays the live health percentage

## Shared controls

- Standard buttons and button-style links use a consistent 44px height
- Compact controls retain their deliberate 36px height
- Header actions align without inherited form margins
- Form-backed actions align with adjacent links and buttons
- Mobile actions remain single-line and consistently sized
- Museum Backup hero actions align evenly, and its settings actions retain the intended equal-width two-column layout

## Settings layout

- Theme tiles match the tallest tile in each desktop grid row
- Single-column mobile tiles retain content-driven height

## Museum Scan engine

- Metadata searches run concurrently across independent enabled providers with a four-worker limit
- Provider-detail and artwork-source requests overlap instead of waiting for each source serially
- Provider ordering, result ranking, and per-provider error reporting remain deterministic
- Manual research is not repeated when the enrichment pass already checked the manual providers
- The manual result payload is read correctly when an enrichment fallback is required

## Museum Scan presentation

- Keeps old completed scan status visually idle during page hydration without changing click-only starts or live-scan reattachment
- The idle control retains its compact 44px pill
- Active scans smoothly expand upward into a compact 176px information panel without widening the sidebar
- The panel reports the current stage, current game, checked records, prepared records, and records needing review
- A thin glassy canvas chamber fills from left to right using the server-authoritative percentage
- Its advancing liquid front uses spring points, damping, tension, inertia, and neighbor propagation so progress changes create physical ripples that settle naturally
- The enclosure opens upward over a calm eased slide, wakes an inset illuminated frame, and reveals the heading, detail, counters, and liquid chamber in a restrained stagger
- Reduced-motion environments keep a shorter calm structural morph while disabling decorative pulses and light sweeps, avoiding an abrupt panel snap
- The idle oval uses its true 22px radius throughout expansion, preventing the enclosure from ballooning into a circular intermediate shape
- Completion and error states remain in the expanded panel briefly before collapsing smoothly to idle
- The former sweeping light ribbon and thin progress line have been removed

## Discovery Depth

- Replaces the static percentage ring with the Milestones-style two-layer glass vessel, curved label, and spring-liquid fill while preserving the existing completeness score
- Scores every game in the museum instead of sampling the eight Rediscover records
- Gives equal credit for provider identity, description, developer, publisher, release year, genre, platform, cover art, trailer, soundtrack, manual, gallery media, and scanned or manually entered files
- Displays the rounded percentage of completed record areas across the entire collection

## Soundtrack Scanner

- Adds a Soundtrack tab to each expanded Museum card without changing card dimensions or expansion behavior
- Scans YouTube for title-, platform-, and year-aware soundtrack and OST candidates
- Searches KHInsider's public album catalog for ranked metadata and external album links only
- Loads public KHInsider track names, durations, sizes, and per-song page links into the selected album view without requesting audio files
- Ranks likely matches while filtering out trailers, walkthroughs, reviews, and unrelated gameplay
- Supports in-card previews, saved source links, external provider searches, manual URL entry, and removal
- Indexes owned soundtrack files already stored in Soundtrack, OST, or Music directories inside a game folder
- Imports user-selected MP3, FLAC, OGG, WAV, and M4A files into per-game Vaultarr soundtrack storage
- Adds a Vaultarr-native playlist with cover art, seek, volume, previous/next, shuffle, repeat, and byte-range playback
- Stores external source metadata and embed references only; Vaultarr does not download KHInsider audio

## Acquisition catalog sources

- Adds Vimm Vault, My Abandonware, and combined source choices to the existing Acquisition Assistant
- Replaces the free-form platform hint with an explicit version dropdown covering PC / Windows, DOS, GameCube, Xbox, PlayStation, and other supported systems
- Labels every result with its catalog provider and keeps selection, saved references, and local-file attachment inside the established acquisition workflow
- Opens original source pages for manual acquisition; Vaultarr does not download, proxy, or expose direct game archives
- Falls back to a focused external My Abandonware search when that site requires interactive browser verification
- Reads Vimm platform labels from the matching result row and detail-page metadata so Xbox releases are not mistaken for adjacent PlayStation or GameCube entries
- Consolidates Vimm regional/revision variants into one result per title and platform, preferring the most relevant revision while displaying its region and version
- Uses compact scrollable source/platform menus inside the expanded card, with calm eased motion and accessible keyboard navigation
- Keeps wheel scrolling inside the expanded card even when the pointer is over its artwork column, preventing the Museum page behind it from moving
- Gives lifted and tilted Museum covers a shadowless glass-slate feel through stronger perspective, smoothly animated artwork/title parallax, and directional internal edge reflections while preserving established dimensions and full-card artwork

## Preserved systems

Museum card dimensions and artwork, card expansion behavior, Focus Mode geometry, Museum Scan click protection and server lifecycle, sidebar navigation, authentication, manual downloads and storage, Museum Backup, Milestone percentage calculation, and the two-layer Milestone container are unchanged.
