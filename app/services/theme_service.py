import json
import os
from pathlib import Path

APP_DIR = Path(os.getenv("LOCALAPPDATA", ".")) / "Vaultarr"
SETTINGS_DIR = APP_DIR / "settings"
THEME_PATH = SETTINGS_DIR / "theme.json"

THEME_PACKS = {
    "vault_blue": {
        "name": "Vault Blue",
        "description": "The default Vaultarr blue-black library look.",
        "primary": "#3b82f6",
        "accent": "#38bdf8",
        "background": "#080b12",
        "background_soft": "#0d1220",
        "sidebar": "#111622",
        "panel": "#1b2230",
        "panel_hover": "#242c3d",
        "card": "#141a26",
        "card_deep": "#0d121c",
        "border": "#2c3548",
        "text": "#f3f4f6",
        "text_muted": "#9fb0ca",
        "glow_strength": "0.45",
    },
    "arcade_purple": {
        "name": "Arcade Purple",
        "description": "Purple neon arcade lighting with magenta highlights.",
        "primary": "#8b5cf6",
        "accent": "#ec4899",
        "background": "#090613",
        "background_soft": "#150d25",
        "sidebar": "#150f24",
        "panel": "#211631",
        "panel_hover": "#312149",
        "card": "#1b112a",
        "card_deep": "#0f0818",
        "border": "#4c3272",
        "text": "#faf5ff",
        "text_muted": "#c4b5fd",
        "glow_strength": "0.52",
    },
    "terminal_green": {
        "name": "Terminal Green",
        "description": "Dark terminal greens for a retro preservation console feel.",
        "primary": "#22c55e",
        "accent": "#4ade80",
        "background": "#041009",
        "background_soft": "#08190f",
        "sidebar": "#0b1c12",
        "panel": "#12261a",
        "panel_hover": "#1a3926",
        "card": "#0d1e14",
        "card_deep": "#05110a",
        "border": "#2a5e3e",
        "text": "#f0fdf4",
        "text_muted": "#86efac",
        "glow_strength": "0.40",
    },
    "amber_terminal": {
        "name": "Amber Terminal",
        "description": "Warm amber CRT glow with dark brown-black panels.",
        "primary": "#f59e0b",
        "accent": "#fbbf24",
        "background": "#130d04",
        "background_soft": "#1d1507",
        "sidebar": "#21180b",
        "panel": "#2b1f0e",
        "panel_hover": "#3d2b12",
        "card": "#211707",
        "card_deep": "#140e04",
        "border": "#624315",
        "text": "#fffbeb",
        "text_muted": "#fcd34d",
        "glow_strength": "0.42",
    },
    "crimson_dark": {
        "name": "Crimson Dark",
        "description": "Deep red shadows with horror-library accents.",
        "primary": "#dc2626",
        "accent": "#fb7185",
        "background": "#120609",
        "background_soft": "#1d0b10",
        "sidebar": "#201017",
        "panel": "#2b151f",
        "panel_hover": "#3b1d2a",
        "card": "#201019",
        "card_deep": "#12070c",
        "border": "#61293d",
        "text": "#fff1f2",
        "text_muted": "#fda4af",
        "glow_strength": "0.40",
    },
    "midnight_ice": {
        "name": "Midnight Ice",
        "description": "Cool blue-gray panels with soft cyan highlights.",
        "primary": "#06b6d4",
        "accent": "#67e8f9",
        "background": "#061018",
        "background_soft": "#0b1a25",
        "sidebar": "#0d1822",
        "panel": "#132433",
        "panel_hover": "#1b3448",
        "card": "#0f1d2a",
        "card_deep": "#07111a",
        "border": "#24566d",
        "text": "#ecfeff",
        "text_muted": "#a5f3fc",
        "glow_strength": "0.42",
    },
}

DEFAULT_THEME_KEY = "vault_blue"
THEME_PRESETS = THEME_PACKS  # Backward-compatible name used by older templates/routes.


def _with_key(key, data):
    theme = dict(data)
    theme["preset"] = key
    theme["is_custom"] = key == "custom"
    return theme


def get_default_theme():
    theme = _with_key(DEFAULT_THEME_KEY, THEME_PACKS[DEFAULT_THEME_KEY])
    theme["dark_reader_compat"] = False
    return theme


def get_theme_pack(key):
    key = key if key in THEME_PACKS else DEFAULT_THEME_KEY
    theme = _with_key(key, THEME_PACKS[key])
    theme["dark_reader_compat"] = load_dark_reader_compat()
    return theme


def load_dark_reader_compat():
    if not THEME_PATH.exists():
        return False
    try:
        data = json.loads(THEME_PATH.read_text(encoding="utf-8"))
        return bool(data.get("dark_reader_compat", False))
    except Exception:
        return False


def save_dark_reader_compat(enabled):
    theme = load_theme()
    theme["dark_reader_compat"] = bool(enabled)
    save_theme(theme)
    return theme


def load_theme():
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)

    if not THEME_PATH.exists():
        theme = get_default_theme()
        save_theme(theme)
        return theme

    try:
        data = json.loads(THEME_PATH.read_text(encoding="utf-8"))
        preset = data.get("preset", DEFAULT_THEME_KEY)

        if preset in THEME_PACKS:
            theme = get_theme_pack(preset)
            # If the user saved custom overrides, keep them.
            for key in ["primary", "accent", "background", "background_soft", "sidebar", "panel", "panel_hover", "card", "card_deep", "border", "text", "text_muted", "glow_strength"]:
                if key in data:
                    theme[key] = data[key]
            theme["is_custom"] = bool(data.get("is_custom", False))
            theme["dark_reader_compat"] = bool(data.get("dark_reader_compat", False))
            return theme

        if preset == "custom":
            theme = get_default_theme()
            theme.update(data)
            theme["preset"] = "custom"
            theme["name"] = data.get("name", "Custom Theme")
            theme["is_custom"] = True
            theme["dark_reader_compat"] = bool(data.get("dark_reader_compat", False))
            return theme

        return get_default_theme()
    except Exception:
        return get_default_theme()


def save_theme(theme):
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    THEME_PATH.write_text(json.dumps(theme, indent=2), encoding="utf-8")


def save_theme_pack(preset_key):
    theme = get_theme_pack(preset_key)
    save_theme(theme)
    return theme


def is_hex_color(value):
    if not value or not value.startswith("#"):
        return False
    value = value[1:]
    return len(value) in (3, 6) and all(c in "0123456789abcdefABCDEF" for c in value)


def custom_theme_from_form(form):
    base_key = form.get("base_preset", DEFAULT_THEME_KEY).strip()
    theme = get_theme_pack(base_key)
    theme["preset"] = "custom"
    theme["name"] = "Custom Theme"
    theme["description"] = "User customized Vaultarr theme."
    theme["is_custom"] = True
    theme["dark_reader_compat"] = load_dark_reader_compat()

    for key in ["primary", "accent", "background", "panel", "sidebar", "border"]:
        value = form.get(key, "").strip()
        if is_hex_color(value):
            theme[key] = value

    # Derive matching secondary colors so custom themes affect the whole app.
    theme["background_soft"] = form.get("background_soft", "").strip() if is_hex_color(form.get("background_soft", "")) else theme["background"]
    theme["panel_hover"] = theme.get("panel_hover", theme["panel"])
    theme["card"] = theme.get("card", theme["panel"])
    theme["card_deep"] = theme.get("card_deep", theme["background"])

    return theme


def theme_from_form(form):
    # Backward-compatible helper. Preset application should use save_theme_pack; custom form uses custom_theme_from_form.
    if form.get("mode") == "custom":
        return custom_theme_from_form(form)
    return get_theme_pack(form.get("preset", DEFAULT_THEME_KEY).strip())


def css_variables(theme=None):
    theme = theme or load_theme()

    primary = theme.get("primary", "#3b82f6")
    accent = theme.get("accent", primary)
    background = theme.get("background", "#080b12")
    background_soft = theme.get("background_soft", "#0d1220")
    sidebar = theme.get("sidebar", "#111622")
    panel = theme.get("panel", "#1b2230")
    panel_hover = theme.get("panel_hover", "#242c3d")
    card = theme.get("card", "#141a26")
    card_deep = theme.get("card_deep", "#0d121c")
    border = theme.get("border", "#2c3548")
    text = theme.get("text", "#f3f4f6")
    text_muted = theme.get("text_muted", "#9fb0ca")
    glow_strength = theme.get("glow_strength", "0.45")

    return f"""
:root {{
    --background: {background};
    --background-soft: {background_soft};
    --sidebar: {sidebar};
    --panel: {panel};
    --panel-hover: {panel_hover};
    --card: {card};
    --card-deep: {card_deep};
    --border: {border};
    --border-soft: color-mix(in srgb, {border} 55%, transparent);
    --primary: {primary};
    --primary-soft: color-mix(in srgb, {primary} 18%, transparent);
    --primary-glow: color-mix(in srgb, {primary} calc({glow_strength} * 100%), transparent);
    --accent: {accent};
    --text: {text};
    --text-muted: {text_muted};
}}
body {{
    background:
        radial-gradient(circle at 12% 0%, color-mix(in srgb, {primary} 16%, transparent), transparent 28%),
        radial-gradient(circle at 95% 10%, color-mix(in srgb, {accent} 12%, transparent), transparent 34%),
        linear-gradient(180deg, {background} 0%, {background_soft} 100%);
}}
button,
.button-link {{
    background: linear-gradient(135deg, color-mix(in srgb, {primary} 86%, black), {primary});
    box-shadow: 0 10px 24px color-mix(in srgb, {primary} 20%, transparent);
}}
button:hover,
.button-link:hover {{
    box-shadow: 0 14px 30px color-mix(in srgb, {primary} 30%, transparent);
}}
.eyebrow {{ color: {accent}; }}
"""
