import re
from urllib.parse import quote_plus

import requests


def _tokens(text):
    return [t for t in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(t) >= 2]


def _score_title(candidate, title, platform=""):
    cand = (candidate or "").lower()
    wanted = (title or "").lower()
    score = 35
    if wanted and wanted in cand:
        score += 38
    wanted_tokens = _tokens(wanted)
    if wanted_tokens:
        hits = sum(1 for token in wanted_tokens if token in cand)
        score += min(28, hits * 6)
    if platform and platform.lower() in cand:
        score += 6
    for bad in ("soundtrack", "ost", "walkthrough", "review", "wiki"):
        if bad in cand:
            score -= 8
    return max(1, min(100, score))


def pcgamingwiki_search(title, platform=""):
    if not title:
        return []
    try:
        response = requests.get(
            "https://www.pcgamingwiki.com/w/api.php",
            params={
                "action": "opensearch",
                "search": title,
                "limit": 6,
                "namespace": 0,
                "format": "json",
            },
            headers={"User-Agent": "Vaultarr/Alpha29 PatchEngine"},
            timeout=12,
        )
        response.raise_for_status()
        data = response.json()
        titles = data[1] if len(data) > 1 else []
        descriptions = data[2] if len(data) > 2 else []
        urls = data[3] if len(data) > 3 else []
        results = []
        for idx, page_title in enumerate(titles):
            url = urls[idx] if idx < len(urls) else ""
            if not url:
                continue
            confidence = _score_title(page_title, title, platform)
            results.append({
                "provider": "PCGamingWiki",
                "source": "PCGamingWiki",
                "title": f"{page_title} — PCGamingWiki Fix Guide",
                "category": "Compatibility",
                "kind": "Fix guide",
                "url": url,
                "confidence": confidence,
                "recommended": confidence >= 72,
                "description": descriptions[idx] if idx < len(descriptions) and descriptions[idx] else "PCGamingWiki page with fixes, known issues, widescreen notes, controller support, save locations, and compatibility details.",
                "tags": ["Known issues", "Compatibility", "Widescreen", "Controller"],
                "safety": "Reference link",
            })
        return sorted(results, key=lambda item: item.get("confidence", 0), reverse=True)
    except Exception:
        return []


def patch_search_results(game, provider="all", category="all"):
    title = (game.get("title") or "").strip()
    platform = (game.get("platform") or "").strip()
    year = str(game.get("release_year") or "").strip()
    if not title:
        return {"results": [], "message": "No title available for patch search."}

    results = []
    provider_key = (provider or "all").lower()

    if provider_key in ("all", "pcgamingwiki", "pcgw"):
        results.extend(pcgamingwiki_search(title, platform))

    if provider_key in ("all", "github"):
        q = quote_plus(f'{title} widescreen fix unofficial patch')
        results.append({
            "provider": "GitHub",
            "source": "GitHub",
            "title": f"Search GitHub releases for {title} fixes",
            "category": "Community",
            "kind": "Search",
            "url": f"https://github.com/search?q={q}&type=repositories",
            "confidence": 64,
            "recommended": False,
            "description": "Search GitHub for open-source launchers, compatibility fixes, widescreen patches, and unofficial updates.",
            "tags": ["Unofficial updates", "Open source", "Community"],
            "safety": "Search link",
        })

    if provider_key in ("all", "moddb"):
        q = quote_plus(title)
        results.append({
            "provider": "ModDB",
            "source": "ModDB",
            "title": f"Search ModDB for {title} patches and mods",
            "category": "Mods",
            "kind": "Search",
            "url": f"https://www.moddb.com/search?q={q}",
            "confidence": 56,
            "recommended": False,
            "description": "Find community patches, total conversions, HD packs, and preservation-friendly mod pages.",
            "tags": ["Mods", "HD packs", "Community"],
            "safety": "Search link",
        })

    if provider_key in ("all", "wsgf"):
        q = quote_plus(f'{title} widescreen')
        results.append({
            "provider": "WSGF",
            "source": "WSGF",
            "title": f"Search WSGF for {title} widescreen notes",
            "category": "Widescreen",
            "kind": "Search",
            "url": f"https://www.wsgf.org/search/node/{q}",
            "confidence": 58,
            "recommended": False,
            "description": "Search the widescreen gaming community for aspect-ratio, ultrawide, and FOV fixes.",
            "tags": ["Widescreen", "Ultrawide", "FOV"],
            "safety": "Search link",
        })

    if provider_key in ("all", "nexus"):
        q = quote_plus(title)
        results.append({
            "provider": "Nexus Mods",
            "source": "Nexus Mods",
            "title": f"Search Nexus Mods for {title}",
            "category": "Mods",
            "kind": "Search",
            "url": f"https://www.nexusmods.com/search/?gsearch={q}",
            "confidence": 52,
            "recommended": False,
            "description": "Metadata/search link for optional mods. Vaultarr does not auto-download third-party mods.",
            "tags": ["Optional", "Mods", "User review needed"],
            "safety": "Search link",
        })

    # Add a local status candidate when local patches were already detected by scanner.
    if int(game.get("patch_count") or 0) > 0:
        results.insert(0, {
            "provider": "Local Library",
            "source": "Local Library",
            "title": f"{game.get('patch_count')} local patch asset{'s' if int(game.get('patch_count') or 0) != 1 else ''} detected",
            "category": "Official",
            "kind": "Local asset",
            "url": "",
            "confidence": 100,
            "recommended": True,
            "description": "Vaultarr found patch/update files inside this game's folder during scanning.",
            "tags": ["Local", "Indexed", "Preservation"],
            "safety": "Local asset",
        })

    category_key = (category or "all").lower()
    if category_key != "all":
        results = [item for item in results if category_key in (item.get("category") or "").lower() or any(category_key in str(tag).lower() for tag in item.get("tags", []))]

    # De-dupe by URL/title and rank recommended/source-backed pages first.
    seen = set()
    unique = []
    for item in sorted(results, key=lambda r: (1 if r.get("recommended") else 0, r.get("confidence", 0)), reverse=True):
        key = (item.get("url") or item.get("title") or "").lower().strip()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(item)

    return {
        "results": unique[:12],
        "message": f"Found {len(unique[:12])} patch/fix candidate{'s' if len(unique[:12]) != 1 else ''}.",
    }


def playability_score(game):
    score = 35
    if game.get("metadata_source"):
        score += 10
    if int(game.get("executable_count") or 0) > 0:
        score += 15
    if int(game.get("patch_count") or 0) > 0:
        score += 18
    if game.get("patch_url"):
        score += 18
    if game.get("manual_url") or game.get("manual_file_path"):
        score += 4
    return max(0, min(100, score))


def patch_status(game):
    if game.get("patch_url"):
        return "Patch reference saved"
    if int(game.get("patch_count") or 0) > 0:
        return "Local patch assets detected"
    return "Needs patch/fix review"
