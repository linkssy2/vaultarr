(() => {
  const previous = window.VaultarrMuseumScan;
  if (previous?.destroy) previous.destroy();

  const state = {
    pollTimer: 0,
    phaseTimer: 0,
    request: null,
    running: false,
    starting: false,
    displayed: 0,
    target: 0,
    raf: 0,
    lastFrame: 0,
    stage: '',
    detail: '',
    boundButton: null,
    destroyed: false
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
      if (state.destroyed || !node.isConnected) return;
      node.textContent = text;
      requestAnimationFrame(() => node.classList.remove('is-changing'));
    }, 120);
  }

  function paintProgress(value) {
    const progress = clamp(value);
    const fill = document.querySelector('[data-museum-scan-fill]');
    const percent = document.querySelector('[data-museum-scan-percent]');
    if (fill) fill.style.transform = `scaleX(${progress / 100})`;
    if (percent) percent.textContent = `${Math.round(progress)}%`;
  }

  function animateProgress(now) {
    if (!state.lastFrame) state.lastFrame = now;
    const elapsed = Math.min(48, now - state.lastFrame);
    state.lastFrame = now;
    const remaining = state.target - state.displayed;

    if (Math.abs(remaining) < 0.05) {
      state.displayed = state.target;
      paintProgress(state.displayed);
      state.raf = 0;
      state.lastFrame = 0;
      return;
    }

    const reversing = remaining < 0;
    const durationFactor = reversing ? 2.35 : 1.25;
    const speed = Math.max(reversing ? 16 : 4, Math.abs(remaining) * durationFactor);
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
    root.classList.toggle('is-reversing', mode === 'reversing');
    root.classList.toggle('is-failed', mode === 'failed');

    const disabled = mode === 'active' || mode === 'complete' || mode === 'reversing';
    control.disabled = disabled;
    control.setAttribute('aria-busy', String(mode === 'active'));
    control.setAttribute('aria-label',
      mode === 'active' ? 'Museum scan in progress' :
      mode === 'complete' ? 'Museum updated' :
      mode === 'reversing' ? 'Museum scan resetting' :
      mode === 'failed' ? 'Museum scan failed' : 'Scan Museum'
    );

    const live = root.querySelector('.sidebar-scan-live');
    if (live) live.setAttribute('aria-hidden', String(mode === 'idle'));
    const icon = root.querySelector('[data-museum-scan-icon]');
    if (icon) icon.textContent = mode === 'complete' ? '✓' : mode === 'failed' ? '!' : '↻';
  }

  function clearTimers() {
    clearTimeout(state.pollTimer);
    clearTimeout(state.phaseTimer);
    state.pollTimer = 0;
    state.phaseTimer = 0;
  }

  function finishReverse() {
    setMode('reversing');
    setProgress(0, false);
    setText('[data-museum-scan-stage]', '', 'stage');
    setText('[data-museum-scan-detail]', '', 'detail');

    state.phaseTimer = window.setTimeout(() => {
      setMode('idle');
      state.displayed = 0;
      state.target = 0;
      state.stage = '';
      state.detail = '';
      paintProgress(0);
    }, 620);
  }

  function scheduleReturnToIdle(mode) {
    clearTimeout(state.phaseTimer);
    const hold = mode === 'failed' ? 1500 : 1100;
    state.phaseTimer = window.setTimeout(finishReverse, hold);
  }

  function render(data) {
    const status = data?.status || 'idle';
    const running = status === 'scanning' || status === 'preparing';
    state.running = running;
    state.starting = false;

    if (running) {
      setMode('active');
      setProgress(data?.progress || 0, false);
      const stage = data?.stage || 'Scanning Museum';
      const detail = [
        data?.current_game,
        data?.checked_games && data?.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''
      ].filter(Boolean).join(' · ');
      setText('[data-museum-scan-stage]', stage, 'stage');
      setText('[data-museum-scan-detail]', detail, 'detail');
      clearTimeout(state.pollTimer);
      state.pollTimer = window.setTimeout(readStatus, 800);
      return;
    }

    if (status === 'complete') {
      setMode('complete');
      setProgress(100, false);
      setText('[data-museum-scan-stage]', 'Museum Updated', 'stage');
      setText(
        '[data-museum-scan-detail]',
        `${data?.summary?.checked || data?.total_games || 0} games checked · ${data?.summary?.prepared || data?.completed_games || 0} prepared`,
        'detail'
      );
      scheduleReturnToIdle('complete');
      return;
    }

    if (status === 'failed') {
      setMode('failed');
      setText('[data-museum-scan-stage]', 'Scan needs attention', 'stage');
      setText('[data-museum-scan-detail]', data?.last_error || 'Try again when the server is available.', 'detail');
      scheduleReturnToIdle('failed');
      return;
    }

    setMode('idle');
    setProgress(0, true);
  }

  async function readStatus() {
    if (state.request || document.hidden || state.destroyed) return;
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
      if (response.ok) render(await response.json());
    } catch (error) {
      if (error.name !== 'AbortError' && state.running) {
        state.pollTimer = window.setTimeout(readStatus, 1500);
      }
    } finally {
      if (state.request === controller) state.request = null;
    }
  }

  async function startFromUserClick(event) {
    if (!event?.isTrusted || state.running || state.starting || state.destroyed) return;
    state.starting = true;
    clearTimers();
    setMode('active');
    setProgress(2, true);
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
      scheduleReturnToIdle('failed');
    }
  }

  function bindButton() {
    const next = button();
    if (!next || next === state.boundButton) return;
    if (state.boundButton) state.boundButton.removeEventListener('click', startFromUserClick);
    next.addEventListener('click', startFromUserClick);
    state.boundButton = next;
  }

  function destroy() {
    state.destroyed = true;
    if (state.boundButton) state.boundButton.removeEventListener('click', startFromUserClick);
    clearTimers();
    if (state.request) state.request.abort();
    if (state.raf) cancelAnimationFrame(state.raf);
  }

  bindButton();
  window.VaultarrMuseumScan = { installed: true, readStatus, destroy };

  // Initial load is deliberately status-only. Only the trusted click handler can start a scan.
  readStatus();
})();
