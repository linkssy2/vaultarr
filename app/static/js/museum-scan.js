(() => {
  const existing = window.VaultarrMuseumScan;
  if (existing?.destroy) existing.destroy();

  const state = {
    timer: 0,
    closeTimer: 0,
    resetTimer: 0,
    running: false,
    starting: false,
    request: null,
    displayed: 0,
    target: 0,
    raf: 0,
    lastFrame: 0,
    stage: '',
    detail: ''
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const all = selector => [...document.querySelectorAll(selector)];
  const shells = () => all('[data-museum-scan-control]');

  function setText(selector, text, key) {
    if (state[key] === text) return;
    state[key] = text;
    all(selector).forEach(node => {
      node.classList.add('is-changing');
      window.setTimeout(() => {
        node.textContent = text;
        requestAnimationFrame(() => node.classList.remove('is-changing'));
      }, 115);
    });
  }

  function paintProgress(value) {
    const v = clamp(value);
    all('[data-museum-scan-fill]').forEach(node => { node.style.width = `${v.toFixed(1)}%`; });
    all('[data-museum-scan-percent]').forEach(node => { node.textContent = `${Math.round(v)}%`; });
  }

  function animate(now) {
    if (!state.lastFrame) state.lastFrame = now;
    const dt = Math.min(50, now - state.lastFrame);
    state.lastFrame = now;
    const gap = state.target - state.displayed;
    if (Math.abs(gap) < .08) {
      state.displayed = state.target;
      paintProgress(state.displayed);
      state.raf = 0;
      state.lastFrame = 0;
      return;
    }
    const speed = Math.max(2.4, Math.abs(gap) * 1.1);
    state.displayed += Math.sign(gap) * Math.min(Math.abs(gap), speed * dt / 1000);
    paintProgress(state.displayed);
    state.raf = requestAnimationFrame(animate);
  }

  function setTarget(value, immediate = false) {
    state.target = clamp(value);
    if (immediate) {
      state.displayed = state.target;
      paintProgress(state.displayed);
      return;
    }
    if (!state.raf) state.raf = requestAnimationFrame(animate);
  }

  function setVisualMode(mode) {
    shells().forEach(shell => {
      shell.classList.remove('is-active','is-complete','is-failed','is-closing');
      if (mode !== 'idle') shell.classList.add(`is-${mode}`);
      shell.dataset.state = mode;
      const button = shell.querySelector('[data-museum-scan-start]');
      const live = shell.querySelector('.sidebar-scan-live');
      const icon = shell.querySelector('[data-museum-scan-icon]');
      const open = mode !== 'idle';
      if (button) {
        button.setAttribute('aria-disabled', String(mode === 'active'));
        button.setAttribute('aria-label', mode === 'active' ? 'Museum scan in progress' : mode === 'complete' ? 'Museum updated' : mode === 'failed' ? 'Museum scan failed' : 'Scan Museum');
        button.title = mode === 'active' ? 'Museum scan in progress' : 'Scan Museum';
      }
      if (live) live.setAttribute('aria-hidden', String(!open));
      if (icon) icon.textContent = mode === 'complete' ? '✓' : mode === 'failed' ? '!' : '↻';
    });
  }

  function cancelClose() {
    clearTimeout(state.closeTimer);
    clearTimeout(state.resetTimer);
  }

  function closeCalmly() {
    cancelClose();
    state.closeTimer = window.setTimeout(() => {
      setVisualMode('idle');
      state.resetTimer = window.setTimeout(() => {
        state.displayed = 0;
        state.target = 0;
        paintProgress(0);
        state.stage = '';
        state.detail = '';
      }, 460);
    }, 1700);
  }

  function render(data) {
    const running = data.status === 'scanning' || data.status === 'preparing';
    state.running = running;
    state.starting = false;
    const mode = running ? 'active' : data.status === 'complete' ? 'complete' : data.status === 'failed' ? 'failed' : 'idle';
    setVisualMode(mode);
    setTarget(data.progress || 0, running && state.displayed > clamp(data.progress) + 15);

    const stage = data.stage || (running ? 'Scanning Museum' : mode === 'complete' ? 'Museum Updated' : mode === 'failed' ? 'Scan needs attention' : 'Ready');
    const detail = running
      ? [data.current_game, data.checked_games && data.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''].filter(Boolean).join(' · ')
      : mode === 'complete'
        ? `${data.summary?.checked || data.total_games || 0} games checked · ${data.summary?.prepared || data.completed_games || 0} prepared`
        : (data.last_error || '');
    setText('[data-museum-scan-stage]', stage, 'stage');
    setText('[data-museum-scan-detail]', detail, 'detail');
    document.dispatchEvent(new CustomEvent('vaultarr:museum-scan-updated', { detail: data }));

    clearTimeout(state.timer);
    if (running) state.timer = window.setTimeout(poll, 750);
    else if (mode === 'complete' || mode === 'failed') closeCalmly();
  }

  async function poll() {
    if (document.hidden || state.request) return;
    const controller = new AbortController();
    state.request = controller;
    try {
      const response = await fetch(`/api/museum-scan/status?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (response.ok) render(await response.json());
    } catch (error) {
      if (error.name !== 'AbortError' && state.running) state.timer = window.setTimeout(poll, 1400);
    } finally {
      if (state.request === controller) state.request = null;
    }
  }

  async function start() {
    if (state.running || state.starting) return;
    state.starting = true;
    cancelClose();
    setVisualMode('active');
    setTarget(1, true);
    setText('[data-museum-scan-stage]', 'Starting Museum Scan', 'stage');
    setText('[data-museum-scan-detail]', 'Checking your collection…', 'detail');
    try {
      const response = await fetch(`/api/museum-scan/start?_=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { Accept: 'application/json', 'X-Requested-With': 'VaultarrMuseumScan' }
      });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(payload.message || `Could not start scan (${response.status})`);
      render(payload);
    } catch (error) {
      state.running = false;
      state.starting = false;
      setVisualMode('failed');
      setText('[data-museum-scan-stage]', 'Could not start scan', 'stage');
      setText('[data-museum-scan-detail]', error.message || 'Try again when the server is available.', 'detail');
      closeCalmly();
    }
  }

  function clickHandler(event) {
    const button = event.target.closest('[data-museum-scan-start]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    start();
  }

  function navigationHandler() { poll(); }
  function visibilityHandler() {
    if (document.hidden) {
      clearTimeout(state.timer);
      if (state.request) state.request.abort();
    } else poll();
  }

  function destroy() {
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('vaultarr:navigation-complete', navigationHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
    clearTimeout(state.timer);
    cancelClose();
    if (state.request) state.request.abort();
    if (state.raf) cancelAnimationFrame(state.raf);
  }

  document.addEventListener('click', clickHandler, true);
  document.addEventListener('vaultarr:navigation-complete', navigationHandler);
  document.addEventListener('visibilitychange', visibilityHandler);
  window.VaultarrMuseumScan = { installed: true, start, poll, destroy };

  /* Initial load is status-only. A scan starts exclusively from clickHandler. */
  poll();
})();
