(() => {
  const previous = window.VaultarrMuseumScan;
  if (previous?.destroy) previous.destroy();

  const state = {
    pollTimer: 0,
    resetTimer: 0,
    request: null,
    running: false,
    starting: false,
    displayed: 0,
    target: 0,
    raf: 0,
    lastFrame: 0,
    stage: '',
    detail: '',
    boundButton: null
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const shell = () => document.querySelector('[data-museum-scan-control]');
  const button = () => document.querySelector('[data-museum-scan-start]');

  function setText(selector, value, key) {
    const text = String(value || '');
    if (state[key] === text) return;
    state[key] = text;
    const node = document.querySelector(selector);
    if (!node) return;
    node.classList.add('is-changing');
    window.setTimeout(() => {
      node.textContent = text;
      requestAnimationFrame(() => node.classList.remove('is-changing'));
    }, 110);
  }

  function paintProgress(value) {
    const progress = clamp(value);
    const fill = document.querySelector('[data-museum-scan-fill]');
    const percent = document.querySelector('[data-museum-scan-percent]');
    if (fill) fill.style.width = `${progress.toFixed(1)}%`;
    if (percent) percent.textContent = `${Math.round(progress)}%`;
  }

  function animateProgress(now) {
    if (!state.lastFrame) state.lastFrame = now;
    const elapsed = Math.min(50, now - state.lastFrame);
    state.lastFrame = now;
    const remaining = state.target - state.displayed;

    if (Math.abs(remaining) < 0.06) {
      state.displayed = state.target;
      paintProgress(state.displayed);
      state.raf = 0;
      state.lastFrame = 0;
      return;
    }

    const speed = Math.max(4, Math.abs(remaining) * 1.35);
    state.displayed += Math.sign(remaining) * Math.min(Math.abs(remaining), speed * elapsed / 1000);
    paintProgress(state.displayed);
    state.raf = requestAnimationFrame(animateProgress);
  }

  function setProgress(value, immediate = false) {
    state.target = clamp(value);
    if (immediate) {
      state.displayed = state.target;
      paintProgress(state.displayed);
      return;
    }
    if (!state.raf) state.raf = requestAnimationFrame(animateProgress);
  }

  function setMode(mode) {
    const root = shell();
    const control = button();
    if (!root || !control) return;

    root.dataset.state = mode;
    root.classList.toggle('is-active', mode === 'active');
    root.classList.toggle('is-complete', mode === 'complete');
    root.classList.toggle('is-failed', mode === 'failed');

    const disabled = mode === 'active';
    control.disabled = disabled;
    control.setAttribute('aria-busy', String(disabled));
    control.setAttribute('aria-label',
      mode === 'active' ? 'Museum scan in progress' :
      mode === 'complete' ? 'Museum updated' :
      mode === 'failed' ? 'Museum scan failed' : 'Scan Museum'
    );

    const live = root.querySelector('.sidebar-scan-live');
    if (live) live.setAttribute('aria-hidden', String(mode === 'idle'));
    const icon = root.querySelector('[data-museum-scan-icon]');
    if (icon) icon.textContent = mode === 'complete' ? '✓' : mode === 'failed' ? '!' : '↻';
  }

  function clearTimers() {
    clearTimeout(state.pollTimer);
    clearTimeout(state.resetTimer);
    state.pollTimer = 0;
    state.resetTimer = 0;
  }

  function returnToIdle(delay = 1750) {
    clearTimeout(state.resetTimer);
    state.resetTimer = window.setTimeout(() => {
      setMode('idle');
      window.setTimeout(() => {
        state.displayed = 0;
        state.target = 0;
        state.stage = '';
        state.detail = '';
        paintProgress(0);
      }, 420);
    }, delay);
  }

  function render(data) {
    const status = data?.status || 'idle';
    const running = status === 'scanning' || status === 'preparing';
    state.running = running;
    state.starting = false;

    const mode = running ? 'active' : status === 'complete' ? 'complete' : status === 'failed' ? 'failed' : 'idle';
    setMode(mode);
    setProgress(data?.progress || 0, false);

    const stage = data?.stage || (running ? 'Scanning Museum' : mode === 'complete' ? 'Museum Updated' : mode === 'failed' ? 'Scan needs attention' : 'Ready');
    const detail = running
      ? [data?.current_game, data?.checked_games && data?.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''].filter(Boolean).join(' · ')
      : mode === 'complete'
        ? `${data?.summary?.checked || data?.total_games || 0} games checked · ${data?.summary?.prepared || data?.completed_games || 0} prepared`
        : (data?.last_error || '');

    setText('[data-museum-scan-stage]', stage, 'stage');
    setText('[data-museum-scan-detail]', detail, 'detail');
    document.dispatchEvent(new CustomEvent('vaultarr:museum-scan-updated', { detail: data }));

    clearTimeout(state.pollTimer);
    if (running) {
      state.pollTimer = window.setTimeout(readStatus, 800);
    } else if (mode === 'complete' || mode === 'failed') {
      returnToIdle();
    }
  }

  async function readStatus() {
    if (state.request || document.hidden) return;
    const controller = new AbortController();
    state.request = controller;
    try {
      const response = await fetch(`/api/museum-scan/status?_=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) return;
      render(await response.json());
    } catch (error) {
      if (error.name !== 'AbortError' && state.running) {
        state.pollTimer = window.setTimeout(readStatus, 1500);
      }
    } finally {
      if (state.request === controller) state.request = null;
    }
  }

  async function startFromUserClick(event) {
    // A museum scan may only start from a real user click on this exact button.
    if (!event?.isTrusted || state.running || state.starting) return;
    state.starting = true;
    clearTimers();
    setMode('active');
    setProgress(1, true);
    setText('[data-museum-scan-stage]', 'Starting Museum Scan', 'stage');
    setText('[data-museum-scan-detail]', 'Checking your collection…', 'detail');

    try {
      const response = await fetch(`/api/museum-scan/start?_=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'VaultarrMuseumScan',
          'X-Vaultarr-User-Action': 'scan-museum'
        }
      });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(payload.message || `Could not start scan (${response.status})`);
      render(payload);
    } catch (error) {
      state.running = false;
      state.starting = false;
      setMode('failed');
      setText('[data-museum-scan-stage]', 'Could not start scan', 'stage');
      setText('[data-museum-scan-detail]', error.message || 'Try again when the server is available.', 'detail');
      returnToIdle(2100);
    }
  }

  function bindButton() {
    const next = button();
    if (!next || next === state.boundButton) return;
    if (state.boundButton) state.boundButton.removeEventListener('click', startFromUserClick);
    next.addEventListener('click', startFromUserClick);
    state.boundButton = next;
  }

  function onNavigationComplete() {
    bindButton();
    // Navigation is status-only. It never starts a scan.
    readStatus();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      clearTimeout(state.pollTimer);
      if (state.request) state.request.abort();
      return;
    }
    // Returning to the tab only reads server state. It never starts a scan.
    readStatus();
  }

  function destroy() {
    if (state.boundButton) state.boundButton.removeEventListener('click', startFromUserClick);
    document.removeEventListener('vaultarr:navigation-complete', onNavigationComplete);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    clearTimers();
    if (state.request) state.request.abort();
    if (state.raf) cancelAnimationFrame(state.raf);
  }

  bindButton();
  document.addEventListener('vaultarr:navigation-complete', onNavigationComplete);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.VaultarrMuseumScan = { installed: true, readStatus, destroy };

  // Initial load is intentionally read-only.
  readStatus();
})();
