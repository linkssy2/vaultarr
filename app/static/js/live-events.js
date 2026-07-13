(() => {
  if (window.VaultarrEvents && window.VaultarrStore) return;

  const EVENT_PREFIX = 'vaultarr:';
  const STORAGE_KEY = 'vaultarr:state:v1';
  const target = new EventTarget();

  function readStoredState() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      return {
        revision: Number(parsed.revision || 0),
        dirtyPaths: Array.isArray(parsed.dirtyPaths) ? parsed.dirtyPaths : [],
        recentGames: Array.isArray(parsed.recentGames) ? parsed.recentGames : [],
      };
    } catch (_error) {
      return { revision: 0, dirtyPaths: [], recentGames: [] };
    }
  }

  const state = readStoredState();

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        revision: state.revision,
        dirtyPaths: state.dirtyPaths.slice(-20),
        recentGames: state.recentGames.slice(-25),
      }));
    } catch (_error) {}
  }

  function normalizePath(path) {
    try { return new URL(path, window.location.origin).pathname || '/'; }
    catch (_error) { return String(path || '/').split('?')[0] || '/'; }
  }

  function markDirty(paths) {
    const list = Array.isArray(paths) ? paths : [paths];
    list.filter(Boolean).map(normalizePath).forEach((path) => {
      if (!state.dirtyPaths.includes(path)) state.dirtyPaths.push(path);
      window.VaultarrInvalidatePageCache?.(path, { prefix: true });
    });
    state.revision += 1;
    persist();
  }

  function recordGame(detail) {
    if (!detail?.game_id) return;
    state.recentGames = state.recentGames.filter((item) => String(item.game_id) !== String(detail.game_id));
    state.recentGames.push({ ...detail, recorded_at: Date.now() });
  }

  const api = {
    on(name, handler) {
      target.addEventListener(name, handler);
      return () => target.removeEventListener(name, handler);
    },
    emit(name, detail = {}) {
      if (name === 'game-added' || name === 'game-updated' || name === 'game-removed') {
        if (name !== 'game-removed') recordGame(detail);
        markDirty(['/', '/library', '/collections', '/museum', '/discovery']);
      }
      target.dispatchEvent(new CustomEvent(name, { detail }));
      document.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${name}`, { detail }));
    }
  };

  window.VaultarrEvents = api;
  window.VaultarrStore = {
    get revision() { return state.revision; },
    get dirtyPaths() { return [...state.dirtyPaths]; },
    get recentGames() { return [...state.recentGames]; },
    markDirty,
    isDirty(pathname) {
      const path = normalizePath(pathname);
      return state.dirtyPaths.some((dirty) => path === dirty || path.startsWith(`${dirty.replace(/\/$/, '')}/`));
    },
    clearDirty(pathname) {
      const path = normalizePath(pathname);
      state.dirtyPaths = state.dirtyPaths.filter((dirty) => !(path === dirty || path.startsWith(`${dirty.replace(/\/$/, '')}/`)));
      persist();
    },
    findRecentGame(gameId) {
      return state.recentGames.find((item) => String(item.game_id) === String(gameId)) || null;
    }
  };

  // Invalidate any cache entries recorded by an earlier page before the
  // navigation module was initialized during this document load.
  document.addEventListener('DOMContentLoaded', () => {
    state.dirtyPaths.forEach((path) => window.VaultarrInvalidatePageCache?.(path, { prefix: true }));
  });

  function showToast({ title = 'Vaultarr', message = '', tone = 'success', actionLabel = '', action = null } = {}) {
    document.querySelector('.vaultarr-live-toast')?.remove();
    const toast = document.createElement('aside');
    toast.className = `vaultarr-live-toast ${tone}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<div><strong></strong><span></span></div>${actionLabel ? '<button type="button"></button>' : ''}`;
    toast.querySelector('strong').textContent = title;
    toast.querySelector('span').textContent = message;
    const button = toast.querySelector('button');
    if (button) {
      button.textContent = actionLabel;
      button.addEventListener('click', () => { if (typeof action === 'function') action(); toast.remove(); });
    }
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => { toast.classList.remove('show'); window.setTimeout(() => toast.remove(), 250); }, 6500);
  }
  window.VaultarrToast = showToast;
})();
