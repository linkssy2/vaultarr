import html
import re
from difflib import SequenceMatcher
from html.parser import HTMLParser
from urllib.parse import urlencode, urljoin, urlparse

import requests

from app.database.database import get_connection

BASE_URL = "https://vimm.net"
SEARCH_URL = f"{BASE_URL}/vault/"
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
    if platform and wanted_platform:
        pa, pb = _normalize(platform), _normalize(wanted_platform)
        if pa == pb or pa in pb or pb in pa:
            score += 4
    return min(100, score)


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
    chunk = re.sub(r"<[^>]+>", " ", page[max(0, pos-500):pos+500])
    chunk = html.unescape(" ".join(chunk.split()))
    for canonical, aliases in PLATFORM_ALIASES.items():
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", chunk, re.I):
                return canonical.title()
    return ""


def _parse_search_html(page, wanted_title, wanted_platform):
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
        platform = _extract_platform_near_link(page, clean_href)
        found.append({
            "external_id": game_id,
            "title": html.unescape(text).strip(),
            "platform": platform,
            "region": "",
            "version": "",
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
            for item in _parse_search_html(response.text, query, platform):
                old = merged.get(item["external_id"])
                if old is None or item["match_score"] > old["match_score"]:
                    merged[item["external_id"]] = item
            if merged and not params.get("system"):
                break
        except requests.RequestException as exc:
            errors.append(str(exc))
    if not merged and errors:
        raise RuntimeError("Vimm reference search could not be reached. You can paste a source page below instead.")
    return sorted(merged.values(), key=lambda row: (-row["match_score"], row["title"].lower()))[:30]


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
    for pattern in [r"<h1[^>]*>(.*?)</h1>", r"<title[^>]*>(.*?)</title>"]:
        hit = re.search(pattern, page, re.I | re.S)
        if hit:
            title = html.unescape(re.sub(r"<[^>]+>", " ", hit.group(1)))
            title = re.sub(r"\s*[-|]\s*Vimm.*$", "", " ".join(title.split()), flags=re.I).strip()
            if title:
                break
    def field(label):
        hit = re.search(rf"{re.escape(label)}\s*</?[^>]*>\s*([^<\n]+)", page, re.I)
        if not hit:
            plain = html.unescape(re.sub(r"<[^>]+>", " ", page))
            hit = re.search(rf"{re.escape(label)}\s*:?\s*([^\n|]{{1,80}})", plain, re.I)
        return " ".join(hit.group(1).split()) if hit else ""
    platform = field("System") or field("Platform") or wanted_platform
    region = field("Region")
    version = field("Version") or field("Revision")
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
    return row
