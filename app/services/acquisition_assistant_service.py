import html
import ipaddress
import os
import re
import socket
import threading
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse

import requests

from app.database.database import APP_DIR, get_connection

BASE_URL = "https://vimm.net"
SEARCH_URL = f"{BASE_URL}/vault/"
MY_ABANDONWARE_BASE_URL = "https://www.myabandonware.com"
TIMEOUT = 18
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"{BASE_URL}/",
}

PLATFORM_ALIASES = {
    "nintendo 64": ["N64", "Nintendo 64"],
    "gamecube": ["GameCube"],
    "wii": ["Wii"],
    "wii u": ["Wii-U", "Wii U"],
    "game boy": ["Game-Boy", "Game Boy"],
    "game boy color": ["Game-Boy-Color", "Game Boy Color"],
    "game boy advance": ["Game-Boy-Advance", "Game Boy Advance", "GBA"],
    "nintendo ds": ["Nintendo-DS", "Nintendo DS", "DS"],
    "nintendo 3ds": ["Nintendo-3DS", "Nintendo 3DS", "3DS"],
    "nes": ["NES", "Nintendo"],
    "snes": ["SNES", "Super-Nintendo"],
    "playstation": ["PlayStation", "PS1"],
    "playstation 2": ["PlayStation-2", "PS2"],
    "playstation 3": ["PlayStation-3", "PS3"],
    "psp": ["PSP"],
    "xbox": ["Xbox"],
    "xbox 360": ["Xbox-360", "Xbox 360"],
    "dreamcast": ["Dreamcast"],
    "saturn": ["Saturn"],
    "genesis": ["Genesis", "Mega-Drive"],
}
ACQUISITION_DIR = APP_DIR / "acquisitions"
MAX_ACQUISITION_BYTES = max(1, min(64, int(os.getenv("VAULTARR_MAX_ACQUISITION_DOWNLOAD_GB", "16")))) * 1024 ** 3
DOWNLOAD_CHUNK_BYTES = 1024 * 256
DOWNLOAD_REDIRECT_LIMIT = 5
_DOWNLOAD_JOBS = {}
_DOWNLOAD_LOCK = threading.Lock()

def _normalize(value):
    value = html.unescape(str(value or "")).lower()
    value = re.sub(r"\b(the)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def _score(title, wanted_title, platform="", wanted_platform=""):
    a, b = _normalize(title), _normalize(wanted_title)
    score = int(SequenceMatcher(None, a, b).ratio() * 88)
    if a == b:
        score = 96
    elif a in b or b in a:
        score = max(score, 88)
    if platform and wanted_platform and _platform_matches(platform, wanted_platform):
        score += 4
    return min(100, score)


def _platform_matches(actual, wanted):
    if not wanted:
        return True
    actual_key, wanted_key = _normalize(actual), _normalize(wanted)
    if wanted_key == "pc windows":
        return any(label in actual_key.split() for label in ("win", "windows", "pc"))
    return bool(actual_key and (actual_key == wanted_key or actual_key in wanted_key or wanted_key in actual_key))


class _LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.links.append((self._href, " ".join("".join(self._text).split())))
            self._href = None
            self._text = []


def _platform_candidates(platform):
    key = _normalize(platform)
    aliases = PLATFORM_ALIASES.get(key, [])
    return aliases[:2]


def _extract_platform_near_link(page, href):
    pos = page.find(href)
    if pos < 0:
        return ""
    row_start = page.rfind("<tr", 0, pos)
    row_end = page.find("</tr>", pos)
    if row_start >= 0 and row_end > pos:
        row = page[row_start:row_end + 5]
        first_cell = re.search(r"<td\b[^>]*>(.*?)</td>", row, re.I | re.S)
        if first_cell:
            row_platform = html.unescape(re.sub(r"<[^>]+>", " ", first_cell.group(1)))
            row_platform = " ".join(row_platform.split())
            for canonical, aliases in PLATFORM_ALIASES.items():
                if any(_normalize(row_platform) == _normalize(alias) for alias in aliases):
                    return canonical.title()
            if row_platform:
                return row_platform
    chunk = re.sub(r"<[^>]+>", " ", page[max(0, pos-500):pos+500])
    chunk = html.unescape(" ".join(chunk.split()))
    for canonical, aliases in PLATFORM_ALIASES.items():
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", chunk, re.I):
                return canonical.title()
    return ""


def _extract_release_near_link(page, href):
    pos = page.find(href)
    if pos < 0:
        return "", ""
    row_start = page.rfind("<tr", 0, pos)
    row_end = page.find("</tr>", pos)
    if row_start < 0 or row_end <= pos:
        return "", ""
    row = page[row_start:row_end + 5]
    cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.I | re.S)
    link_index = next((index for index, cell in enumerate(cells) if href in cell), -1)
    if link_index < 0:
        return "", ""
    region = ""
    version = ""
    if link_index + 1 < len(cells):
        region_match = re.search(r"<img\b[^>]*\btitle=[\"']([^\"']+)", cells[link_index + 1], re.I)
        if region_match:
            region = html.unescape(region_match.group(1)).strip()
    if link_index + 2 < len(cells):
        version = html.unescape(re.sub(r"<[^>]+>", " ", cells[link_index + 2]))
        version = " ".join(version.split())
    return region, version


def _parse_search_html(page, wanted_title, wanted_platform, platform_override=""):
    parser = _LinkParser()
    parser.feed(page)
    found, seen = [], set()
    patterns = (
        re.compile(r"^/vault/(\d+)(?:$|[/?#])"),
        re.compile(r"^/vault/\?[^#]*\b(?:id|gameId)=(\d+)", re.I),
    )
    for href, text in parser.links:
        if not href or not text:
            continue
        clean_href = html.unescape(href.strip())
        game_id = None
        for pattern in patterns:
            match = pattern.search(clean_href)
            if match:
                game_id = match.group(1)
                break
        if not game_id or game_id in seen:
            continue
        seen.add(game_id)
        platform = platform_override or _extract_platform_near_link(page, clean_href)
        region, version = _extract_release_near_link(page, clean_href)
        found.append({
            "external_id": game_id,
            "title": html.unescape(text).strip(),
            "platform": platform,
            "region": region,
            "version": version,
            "source_page": urljoin(BASE_URL, f"/vault/{game_id}"),
            "match_score": _score(text, wanted_title, platform, wanted_platform),
            "provider": "Vimm Reference",
        })
    found.sort(key=lambda row: (-row["match_score"], row["title"].lower()))
    return found[:30]


def search_vimm_reference(query, platform=""):
    query = (query or "").strip()
    if not query:
        return []
    session = requests.Session()
    session.headers.update(HEADERS)
    attempts = [(SEARCH_URL, {"p": "list", "q": query})]
    for system in _platform_candidates(platform):
        attempts.append((SEARCH_URL, {"p": "list", "system": system, "q": query}))
    errors = []
    merged = {}
    for url, params in attempts:
        try:
            response = session.get(url, params=params, timeout=TIMEOUT)
            response.raise_for_status()
            platform_override = platform if params.get("system") else ""
            for item in _parse_search_html(response.text, query, platform, platform_override):
                old = merged.get(item["external_id"])
                if old is None or item["match_score"] > old["match_score"]:
                    merged[item["external_id"]] = item
            if merged and not params.get("system") and not platform:
                break
        except requests.RequestException as exc:
            errors.append(str(exc))
    if not merged and errors:
        raise RuntimeError("Vimm reference search could not be reached. You can paste a source page below instead.")
    ranked = sorted(merged.values(), key=lambda row: (-row["match_score"], row["title"].lower()))
    if platform:
        ranked = [row for row in ranked if _platform_matches(row.get("platform", ""), platform)]
    region_priority = {"usa": 5, "world": 4, "europe": 3, "japan": 2, "korea": 1}

    def preference(row):
        version_parts = tuple(int(part) for part in re.findall(r"\d+", row.get("version", "")))
        return (
            int(row.get("match_score") or 0),
            region_priority.get(_normalize(row.get("region", "")), 0),
            version_parts,
        )

    grouped = {}
    variant_counts = {}
    for row in ranked:
        key = (_normalize(row.get("title", "")), _normalize(row.get("platform", "")))
        variant_counts[key] = variant_counts.get(key, 0) + 1
        current = grouped.get(key)
        if current is None or preference(row) > preference(current):
            grouped[key] = row
    deduplicated = sorted(grouped.values(), key=lambda row: (-row["match_score"], row["title"].lower(), row["platform"].lower()))
    for row in deduplicated:
        key = (_normalize(row.get("title", "")), _normalize(row.get("platform", "")))
        row["variant_count"] = variant_counts[key]
    return deduplicated[:30]


def _my_abandonware_search_url(query):
    slug = html.unescape(str(query or "")).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return f"{MY_ABANDONWARE_BASE_URL}/search/q/{quote(slug, safe='-')}"


def _my_abandonware_platform(page, href, fallback=""):
    pos = page.find(href)
    if pos < 0:
        return fallback
    chunk = html.unescape(re.sub(r"<[^>]+>", " ", page[max(0, pos - 450):pos + 650]))
    chunk = " ".join(chunk.split())
    known = (
        "Windows 3.x", "Windows", "DOS", "Mac", "Linux", "Amiga CD32", "Amiga",
        "Commodore 64", "Atari ST", "Atari 2600", "Apple II", "PC-98", "PC-88",
        "MSX", "Genesis", "Game Gear", "Arcade", "ZX Spectrum",
    )
    matches = [name for name in known if re.search(rf"\b{re.escape(name)}\b", chunk, re.I)]
    return ", ".join(matches[:3]) or fallback


def _catalog_sort_key(value):
    value = unicodedata.normalize("NFKD", html.unescape(str(value or "")))
    value = value.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def _my_abandonware_catalog_url(letter, page=1):
    root = f"{MY_ABANDONWARE_BASE_URL}/browse/name/{quote(letter, safe='')}/"
    return root if page <= 1 else f"{root}page/{int(page)}/"


def _parse_my_abandonware_catalog_html(page, wanted_title, wanted_platform="", wanted_year=""):
    pattern = re.compile(
        r'<a\b(?=[^>]*\bclass=["\'][^"\']*\bc-item-game__name\b[^"\']*["\'])'
        r'(?=[^>]*\bhref=["\']([^"\']+)["\'])[^>]*>(.*?)</a>\s*'
        r'<span\b[^>]*\bclass=["\'][^"\']*\bc-item-game__platforms\b[^"\']*["\'][^>]*>(.*?)</span>\s*'
        r'<span\b[^>]*\bclass=["\'][^"\']*\bc-item-game__year\b[^"\']*["\'][^>]*>(.*?)</span>',
        re.I | re.S,
    )
    found = []
    wanted_year = str(wanted_year or "").strip()
    for href, title_markup, platform_markup, year_markup in pattern.findall(page or ""):
        clean_href = html.unescape(href).strip()
        match = re.match(r"^/game/([a-z0-9-]+)(?:$|[/?#])", clean_href, re.I)
        if not match:
            continue
        title = html.unescape(re.sub(r"<[^>]+>", " ", title_markup))
        title = " ".join(title.split())
        platform = html.unescape(re.sub(r"<[^>]+>", " ", platform_markup))
        platform = " ".join(platform.split()).replace("Win,", "Windows,")
        if platform == "Win":
            platform = "Windows"
        year = html.unescape(re.sub(r"<[^>]+>", " ", year_markup))
        year = " ".join(year.split())
        score = _score(title, wanted_title, platform, wanted_platform)
        if wanted_year and wanted_year == year:
            score = min(100, score + 4)
        found.append({
            "external_id": match.group(1).lower(),
            "title": title,
            "platform": platform,
            "region": "",
            "version": year,
            "source_page": urljoin(MY_ABANDONWARE_BASE_URL, clean_href),
            "match_score": score,
            "provider": "My Abandonware",
        })
    return found


def _search_my_abandonware_catalog(query, platform="", year=""):
    first = next((character for character in _catalog_sort_key(query) if character.isalnum()), "$")
    letter = first.upper() if first.isalpha() else first
    session = requests.Session()
    session.headers.update(HEADERS)
    pages = {}

    def load(page_number):
        page_number = max(1, int(page_number))
        if page_number in pages:
            return pages[page_number]
        response = session.get(_my_abandonware_catalog_url(letter, page_number), timeout=TIMEOUT)
        response.raise_for_status()
        rows = _parse_my_abandonware_catalog_html(response.text, query, platform, year)
        pages[page_number] = (rows, response.text)
        return pages[page_number]

    first_rows, first_page = load(1)
    page_numbers = [int(value) for value in re.findall(
        rf"/browse/name/{re.escape(letter)}/page/(\d+)/", first_page, re.I
    )]
    last_page = max(page_numbers, default=1)
    wanted_key = _catalog_sort_key(query)
    low, high = 1, last_page
    candidate_page = 1
    while low <= high:
        middle = (low + high) // 2
        rows, _ = load(middle)
        if not rows:
            break
        first_key = _catalog_sort_key(rows[0]["title"])
        last_key = _catalog_sort_key(rows[-1]["title"])
        candidate_page = middle
        if wanted_key < first_key:
            high = middle - 1
        elif wanted_key > last_key:
            low = middle + 1
        else:
            break

    nearby = set(range(max(1, candidate_page - 1), min(last_page, candidate_page + 1) + 1))
    nearby.update(page for page in (low, high) if 1 <= page <= last_page)
    merged = {}
    for page_number in sorted(nearby):
        rows, _ = load(page_number)
        for row in rows:
            if row["match_score"] < 58:
                continue
            old = merged.get(row["external_id"])
            if old is None or row["match_score"] > old["match_score"]:
                merged[row["external_id"]] = row
    ranked = sorted(
        merged.values(),
        key=lambda row: (
            -int(row["match_score"]),
            0 if str(row.get("version") or "") == str(year or "") else 1,
            row["title"].lower(),
        ),
    )
    if platform:
        ranked = [row for row in ranked if _platform_matches(row.get("platform", ""), platform)]
    return ranked[:12]


def _parse_my_abandonware_html(page, wanted_title, wanted_platform=""):
    parser = _LinkParser()
    parser.feed(page)
    found, seen = [], set()
    for href, text in parser.links:
        clean_href = html.unescape((href or "").strip())
        match = re.match(r"^/game/([a-z0-9-]+)(?:$|[/?#])", clean_href, re.I)
        if not match or not text:
            continue
        external_id = match.group(1).lower()
        if external_id in seen:
            continue
        seen.add(external_id)
        platform = _my_abandonware_platform(page, clean_href, wanted_platform)
        found.append({
            "external_id": external_id,
            "title": html.unescape(text).strip(),
            "platform": platform,
            "region": "",
            "version": "",
            "source_page": urljoin(MY_ABANDONWARE_BASE_URL, clean_href),
            "match_score": _score(text, wanted_title, platform, wanted_platform),
            "provider": "My Abandonware",
        })
    found.sort(key=lambda row: (-row["match_score"], row["title"].lower()))
    return found[:30]


def search_my_abandonware_reference(query, platform="", year=""):
    query = (query or "").strip()
    if not query:
        return []
    supported_platforms = {"", "pc windows", "dos", "genesis", "saturn"}
    if _normalize(platform) not in supported_platforms:
        return []
    try:
        catalog_results = _search_my_abandonware_catalog(query, platform, year)
        if catalog_results:
            return catalog_results
    except requests.RequestException:
        pass
    search_url = _my_abandonware_search_url(query)
    try:
        response = requests.get(search_url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        if "__cake_test" in response.url or "cake_test" in response.text.lower():
            raise RuntimeError("catalog verification required")
        results = _parse_my_abandonware_html(response.text, query, platform)
        if results:
            return results
    except requests.RequestException:
        pass
    except RuntimeError:
        pass

    # My Abandonware may require an interactive browser verification step. Keep the
    # handoff useful without attempting to bypass it or exposing download endpoints.
    return [{
        "external_id": "",
        "title": f"Search My Abandonware for {query}",
        "platform": platform,
        "region": "",
        "version": "Interactive catalog search",
        "source_page": search_url,
        "match_score": 82,
        "provider": "My Abandonware",
        "external_search": True,
    }]


def search_acquisition_sources(query, platform="", provider="all", year=""):
    provider = (provider or "all").strip().lower()
    jobs = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        if provider in {"all", "vimm"}:
            jobs.append(("Vimm", executor.submit(search_vimm_reference, query, platform)))
        if provider in {"all", "myabandonware"}:
            jobs.append(("My Abandonware", executor.submit(search_my_abandonware_reference, query, platform, year)))
        if not jobs:
            raise ValueError("Choose a supported acquisition source.")
        results, errors = [], []
        for name, future in jobs:
            try:
                results.extend(future.result())
            except Exception as exc:
                errors.append(f"{name}: {exc}")
    results.sort(key=lambda row: (
        -int(row.get("match_score") or 0),
        0 if year and str(row.get("version") or "") == str(year) else 1,
        row.get("title", "").lower(),
    ))
    if not results and errors:
        raise RuntimeError("; ".join(errors))
    return results[:40], errors


def read_vimm_source_page(source_url, wanted_title="", wanted_platform=""):
    source_url = (source_url or "").strip()
    parsed = urlparse(source_url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in {"vimm.net", "www.vimm.net"}:
        raise ValueError("Enter a Vimm Vault source-page URL.")
    match = re.search(r"/vault/(\d+)", parsed.path)
    if not match:
        qs_match = re.search(r"(?:id|gameId)=(\d+)", parsed.query, re.I)
        match = qs_match
    external_id = match.group(1) if match else ""
    response = requests.get(source_url, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    page = response.text
    title = ""
    for pattern in [
        r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)',
        r"<h1[^>]*>(.*?)</h1>",
        r"<title[^>]*>(.*?)</title>",
    ]:
        hit = re.search(pattern, page, re.I | re.S)
        if hit:
            title = html.unescape(re.sub(r"<[^>]+>", " ", hit.group(1)))
            title = re.sub(r"\s*[-|]\s*Vimm.*$", "", " ".join(title.split()), flags=re.I).strip()
            if title:
                break
    active_system = re.search(r'<a\s+href=["\']/vault/[^"\']+["\']\s+class=["\']active["\'][^>]*>([^<]+)</a>', page, re.I)
    platform = html.unescape(active_system.group(1)).strip() if active_system else wanted_platform
    region_match = re.search(r"<td\b[^>]*>\s*Region\s*</td>.*?<img\b[^>]*\btitle=[\"']([^\"']+)", page, re.I | re.S)
    region = html.unescape(region_match.group(1)).strip() if region_match else ""
    version_match = re.search(r'<select\b[^>]*\bid=["\']dl_version["\'][^>]*>.*?<option\b[^>]*\bvalue=["\']([^"\']+)["\'][^>]*\bselected\b', page, re.I | re.S)
    version = html.unescape(version_match.group(1)).strip() if version_match else ""
    title = title or wanted_title or f"Vimm Vault item {external_id}"
    canonical = f"{BASE_URL}/vault/{external_id}" if external_id else source_url
    return {
        "external_id": external_id,
        "title": title,
        "platform": platform,
        "region": region,
        "version": version,
        "source_page": canonical,
        "match_score": _score(title, wanted_title or title, platform, wanted_platform),
        "provider": "Vimm Reference",
    }


def read_my_abandonware_source_page(source_url, wanted_title="", wanted_platform=""):
    source_url = (source_url or "").strip()
    parsed = urlparse(source_url)
    if parsed.scheme != "https" or parsed.hostname not in {"myabandonware.com", "www.myabandonware.com"}:
        raise ValueError("Enter a My Abandonware game-page URL.")
    match = re.match(r"^/game/([a-z0-9-]+)", parsed.path, re.I)
    if not match:
        raise ValueError("Enter a specific My Abandonware game-page URL, not a download link.")
    response = requests.get(source_url, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    if "__cake_test" in response.url or "cake_test" in response.text.lower():
        raise RuntimeError("My Abandonware requires browser verification. Open the source page directly instead.")
    page = response.text
    title_match = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.I | re.S)
    title = html.unescape(re.sub(r"<[^>]+>", " ", title_match.group(1))).strip() if title_match else wanted_title
    platform_match = re.search(r"(?:Platform|Windows|DOS)\s*</?[^>]*>\s*([^<\n]{1,80})", page, re.I)
    platform = " ".join(platform_match.group(1).split()) if platform_match else wanted_platform
    canonical = f"{MY_ABANDONWARE_BASE_URL}/game/{match.group(1)}"
    return {
        "external_id": match.group(1),
        "title": title or wanted_title or match.group(1).replace("-", " ").title(),
        "platform": platform,
        "region": "",
        "version": "",
        "source_page": canonical,
        "match_score": _score(title or wanted_title, wanted_title or title, platform, wanted_platform),
        "provider": "My Abandonware",
    }


def read_acquisition_source_page(source_url, wanted_title="", wanted_platform=""):
    hostname = (urlparse((source_url or "").strip()).hostname or "").lower()
    if hostname in {"vimm.net", "www.vimm.net"}:
        return read_vimm_source_page(source_url, wanted_title, wanted_platform)
    if hostname in {"myabandonware.com", "www.myabandonware.com"}:
        return read_my_abandonware_source_page(source_url, wanted_title, wanted_platform)
    raise ValueError("Enter a Vimm Vault or My Abandonware source-page URL.")


def _validate_http_url(value, field_name):
    value = (value or "").strip()
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{field_name} must be a complete HTTP or HTTPS URL.")
    return value


def save_acquisition_source(game_id, data):
    source_page = _validate_http_url(data.get("source_page"), "Source page")
    download_url = _validate_http_url(data.get("download_url"), "Download link")
    title = (data.get("title") or "").strip()
    platform = (data.get("platform") or "").strip()
    region = (data.get("region") or "").strip()
    version = (data.get("version") or "").strip()
    external_id = (data.get("external_id") or "").strip()
    status = "link_ready" if download_url else "source_found"
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    if not game:
        conn.close()
        raise ValueError("Game not found.")
    conn.execute("""
        INSERT INTO game_acquisitions (
            game_id, source_title, source_platform, source_region, source_version,
            source_external_id, source_page, download_url, status, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
            source_title=excluded.source_title,
            source_platform=excluded.source_platform,
            source_region=excluded.source_region,
            source_version=excluded.source_version,
            source_external_id=excluded.source_external_id,
            source_page=excluded.source_page,
            download_url=excluded.download_url,
            status=excluded.status,
            updated_at=CURRENT_TIMESTAMP
    """, (game_id, title, platform, region, version, external_id, source_page, download_url, status))
    conn.commit(); conn.close()


def attach_local_file(game_id, local_path):
    local_path = (local_path or "").strip()
    if not local_path:
        raise ValueError("Enter the local file or folder path.")
    conn = get_connection()
    conn.execute("""
        INSERT INTO game_acquisitions (game_id, local_path, status, attached_at, updated_at)
        VALUES (?,?,'acquired',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET local_path=excluded.local_path,
            status='acquired', attached_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
    """, (game_id, local_path))
    conn.commit(); conn.close()


def get_game_acquisition(game_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM game_acquisitions WHERE game_id=?", (game_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def _public_download_url(value):
    value = _validate_http_url(value, "Download link")
    parsed = urlparse(value)
    if parsed.username or parsed.password:
        raise ValueError("Download links cannot contain embedded credentials.")
    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname or hostname == "localhost" or hostname.endswith(".localhost"):
        raise ValueError("Download links must use a public internet host.")
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)}
    except socket.gaierror as exc:
        raise ValueError("The download host could not be resolved.") from exc
    if not addresses:
        raise ValueError("The download host could not be resolved.")
    for address in addresses:
        ip = ipaddress.ip_address(address.split("%")[0])
        if not ip.is_global:
            raise ValueError("Download links cannot target private or local network addresses.")
    return value


def _download_filename(response, final_url):
    disposition = response.headers.get("Content-Disposition", "")
    encoded = re.search(r"filename\*=UTF-8''([^;]+)", disposition, re.I)
    plain = re.search(r'filename=["\']?([^;"\']+)', disposition, re.I)
    name = unquote(encoded.group(1)) if encoded else (plain.group(1).strip() if plain else "")
    if not name:
        name = unquote(Path(urlparse(final_url).path).name)
    name = Path(name or "acquisition.bin").name
    stem = re.sub(r"[^A-Za-z0-9._ ()\[\]-]+", "_", Path(name).stem).strip(" ._") or "acquisition"
    suffix = re.sub(r"[^A-Za-z0-9.]", "", Path(name).suffix.lower())[:16]
    return f"{stem[:160]}{suffix}"


def _available_download_path(game_id, filename):
    target_dir = ACQUISITION_DIR / str(int(game_id))
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    counter = 2
    while target.exists() or target.with_name(f"{target.name}.part").exists():
        target = target_dir / f"{Path(filename).stem} ({counter}){Path(filename).suffix}"
        counter += 1
    return target


def _set_download_job(game_id, **updates):
    with _DOWNLOAD_LOCK:
        current = dict(_DOWNLOAD_JOBS.get(int(game_id), {}))
        current.update(updates)
        _DOWNLOAD_JOBS[int(game_id)] = current
        return dict(current)


def acquisition_download_status(game_id):
    with _DOWNLOAD_LOCK:
        job = dict(_DOWNLOAD_JOBS.get(int(game_id), {}))
    if not job:
        return {"status": "idle", "progress": 0, "received_bytes": 0, "total_bytes": 0}
    return job


def _record_acquisition_download(game_id, download_url, local_path):
    conn = get_connection()
    game = conn.execute("SELECT title FROM games WHERE id=?", (game_id,)).fetchone()
    if not game:
        conn.close()
        raise ValueError("Game not found.")
    conn.execute("""
        INSERT INTO game_acquisitions (game_id, source_title, download_url, local_path, status, attached_at, updated_at)
        VALUES (?,?,?,?,'acquired',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
            download_url=excluded.download_url,
            local_path=excluded.local_path,
            status='acquired',
            attached_at=CURRENT_TIMESTAMP,
            updated_at=CURRENT_TIMESTAMP
    """, (game_id, game["title"] or "", download_url, str(local_path)))
    conn.commit()
    conn.close()


def _download_acquisition_worker(game_id, download_url):
    temporary = None
    response = None
    try:
        session = requests.Session()
        headers = dict(HEADERS)
        headers["Accept"] = "application/octet-stream,application/zip,application/x-7z-compressed,*/*;q=0.8"
        current_url = download_url
        for _ in range(DOWNLOAD_REDIRECT_LIMIT + 1):
            current_url = _public_download_url(current_url)
            response = session.get(current_url, headers=headers, timeout=(12, 90), stream=True, allow_redirects=False)
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("Location", "").strip()
                response.close()
                if not location:
                    raise ValueError("The download redirect did not include a destination.")
                current_url = urljoin(current_url, location)
                continue
            response.raise_for_status()
            break
        else:
            raise ValueError("The download used too many redirects.")

        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type in {"text/html", "application/xhtml+xml"}:
            response.close()
            raise ValueError("This link opens a web page, not a downloadable file.")
        total = int(response.headers.get("Content-Length") or 0)
        if total > MAX_ACQUISITION_BYTES:
            response.close()
            raise ValueError(f"The file exceeds Vaultarr's {MAX_ACQUISITION_BYTES // 1024 ** 3} GB acquisition limit.")

        filename = _download_filename(response, current_url)
        target = _available_download_path(game_id, filename)
        temporary = target.with_name(f"{target.name}.part")
        received = 0
        _set_download_job(game_id, status="downloading", filename=filename, progress=0, received_bytes=0, total_bytes=total, message="Downloading to Vaultarr…")
        with temporary.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=DOWNLOAD_CHUNK_BYTES):
                if not chunk:
                    continue
                received += len(chunk)
                if received > MAX_ACQUISITION_BYTES:
                    raise ValueError(f"The file exceeds Vaultarr's {MAX_ACQUISITION_BYTES // 1024 ** 3} GB acquisition limit.")
                handle.write(chunk)
                progress = min(99, round((received / total) * 100)) if total else 0
                _set_download_job(game_id, progress=progress, received_bytes=received, total_bytes=total)
        response.close()
        if received <= 0:
            raise ValueError("The download returned an empty file.")
        temporary.replace(target)
        temporary = None
        _record_acquisition_download(game_id, download_url, target.resolve())
        _set_download_job(
            game_id,
            status="complete",
            progress=100,
            received_bytes=received,
            total_bytes=total or received,
            filename=target.name,
            local_path=str(target.resolve()),
            message="Download complete and attached to this game.",
        )
    except Exception as exc:
        if response is not None:
            response.close()
        if temporary and temporary.exists():
            try:
                temporary.unlink()
            except OSError:
                pass
        message = "The remote server interrupted or rejected the file download." if isinstance(exc, requests.RequestException) else str(exc)
        _set_download_job(game_id, status="failed", message=message[:220], progress=0)


def start_acquisition_download(game_id, download_url, permission_confirmed=False):
    if permission_confirmed is not True:
        raise ValueError("Confirm that you have permission to download and preserve this file.")
    download_url = _public_download_url(download_url)
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if not game:
        raise ValueError("Game not found.")
    with _DOWNLOAD_LOCK:
        existing = _DOWNLOAD_JOBS.get(int(game_id), {})
        if existing.get("status") in {"queued", "downloading"}:
            raise ValueError("A download is already active for this game.")
        _DOWNLOAD_JOBS[int(game_id)] = {
            "status": "queued",
            "progress": 0,
            "received_bytes": 0,
            "total_bytes": 0,
            "message": "Preparing secure download…",
        }
    worker = threading.Thread(target=_download_acquisition_worker, args=(int(game_id), download_url), daemon=True)
    worker.start()
    return acquisition_download_status(game_id)
