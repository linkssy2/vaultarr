(() => {
  'use strict';

  function parseHex(value, fallback) {
    let text = String(value || '').trim();
    if (!/^#[0-9a-f]{3,6}$/i.test(text)) text = fallback;
    text = text.slice(1);
    if (text.length === 3) text = text.split('').map((character) => character + character).join('');
    return {
      r: Number.parseInt(text.slice(0, 2), 16),
      g: Number.parseInt(text.slice(2, 4), 16),
      b: Number.parseInt(text.slice(4, 6), 16),
    };
  }

  function mix(first, second, amount) {
    const ratio = Math.max(0, Math.min(1, amount));
    return {
      r: Math.round(first.r + (second.r - first.r) * ratio),
      g: Math.round(first.g + (second.g - first.g) * ratio),
      b: Math.round(first.b + (second.b - first.b) * ratio),
    };
  }

  function color(rgb, alpha = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  function getPalette() {
    const styles = getComputedStyle(document.documentElement);
    const primary = parseHex(styles.getPropertyValue('--primary'), '#3b82f6');
    const accent = parseHex(styles.getPropertyValue('--accent'), '#38bdf8');
    const background = parseHex(styles.getPropertyValue('--background'), '#080b12');
    const text = parseHex(styles.getPropertyValue('--text'), '#f3f4f6');

    return {
      top: color(mix(accent, text, .16)),
      middle: color(mix(primary, accent, .34)),
      low: color(mix(primary, background, .46)),
      deep: color(mix(primary, background, .72)),
      surfaceBright: color(mix(accent, text, .76)),
      surface: color(mix(accent, text, .24)),
      surfaceFade: color(mix(primary, accent, .28), .5),
      glow: color(accent, .72),
      shadow: color(primary, .42),
      current: color(mix(primary, accent, .24), .25),
      currentFade: color(mix(primary, background, .6), .1),
      bubble: color(mix(accent, text, .52), .58),
      bubbleDark: color(mix(primary, background, .72), .34),
      glass: color(mix(text, accent, .18), .07),
      transparent: color(background, 0),
    };
  }

  function getOrbitalPalette() {
    const body = document.body;
    const usesDefaultTheme = body?.dataset.themePreset === 'vault_blue'
      && body?.dataset.themeCustom !== 'true';
    if (!usesDefaultTheme) return getPalette();

    return {
      top: 'rgba(255, 255, 255, .98)',
      low: 'rgba(207, 224, 243, .78)',
      surfaceBright: 'rgba(255, 255, 255, .98)',
      surface: 'rgba(244, 250, 255, .92)',
      glow: 'rgba(191, 225, 255, .62)',
      bubbleDark: 'rgba(20, 36, 58, .28)',
      glass: 'rgba(244, 249, 255, .055)',
    };
  }

  window.VaultarrLiquidTheme = { getPalette, getOrbitalPalette };
})();
