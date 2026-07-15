(() => {
  'use strict';

  const existing = window.VaultarrMuseumScanPill;
  if (existing?.destroy) existing.destroy();

  const root = document.querySelector('[data-scan-pill]');
  if (!root) return;

  const action = root.querySelector('[data-scan-action]');
  const idle = root.querySelector('[data-scan-idle]');
  const working = root.querySelector('[data-scan-working]');
  const stageNode = root.querySelector('[data-scan-stage]');
  const detailNode = root.querySelector('[data-scan-detail]');
  const percentNode = root.querySelector('[data-scan-percent]');
  const progressNode = root.querySelector('[data-scan-progress]');

  const model = {
    state: 'idle',
    destroyed: false,
    request: null,
    pollTimer: 0,
    resetTimer: 0,
    raf: 0,
    displayed: 0,
    target: 0,
    lastFrame: 0,
    starting: false
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));

  function paint(value) {
    const progress = clamp(value);
    if (progressNode) progressNode.style.transform = `scaleX(${progress / 100})`;
    if (percentNode) percentNode.textContent = `${Math.round(progress)}%`;
  }

  function step(now) {
    if (!model.lastFrame) model.lastFrame = now;
    const elapsed = Math.min(48, now - model.lastFrame);
    model.lastFrame = now;
    const delta = model.target - model.displayed;
    if (Math.abs(delta) < .05) {
      model.displayed = model.target;
      paint(model.displayed);
      model.raf = 0;
      model.lastFrame = 0;
      return;
    }
    const speed = Math.max(delta < 0 ? 20 : 5, Math.abs(delta) * (delta < 0 ? 2.1 : 1.3));
    model.displayed += Math.sign(delta) * Math.min(Math.abs(delta), speed * elapsed / 1000);
    paint(model.displayed);
    model.raf = requestAnimationFrame(step);
  }

  function progress(value, immediate = false) {
    model.target = clamp(value);
    if (immediate) {
      model.displayed = model.target;
      paint(model.displayed);
      return;
    }
    if (!model.raf) model.raf = requestAnimationFrame(step);
  }

  function text(stage, detail = '') {
    if (stageNode) stageNode.textContent = stage || '';
    if (detailNode) detailNode.textContent = detail || '';
  }

  function setState(next) {
    model.state = next;
    root.dataset.state = next;
    const busy = next === 'scanning' || next === 'complete';
    action.disabled = busy;
    action.setAttribute('aria-busy', String(next === 'scanning'));
    action.setAttribute('aria-label', next === 'scanning' ? 'Museum scan in progress' : next === 'complete' ? 'Museum updated' : next === 'error' ? 'Museum scan interrupted' : 'Scan Museum');
    working?.setAttribute('aria-hidden', String(next === 'idle'));
    idle?.setAttribute('aria-hidden', String(next !== 'idle'));
  }

  function clearTimers() {
    clearTimeout(model.pollTimer);
    clearTimeout(model.resetTimer);
    model.pollTimer = 0;
    model.resetTimer = 0;
  }

  function resetSoon(delay = 1350) {
    clearTimeout(model.resetTimer);
    model.resetTimer = window.setTimeout(() => {
      progress(0, false);
      window.setTimeout(() => {
        if (model.destroyed) return;
        setState('idle');
        text('', '');
        progress(0, true);
      }, 460);
    }, delay);
  }

  function detailFrom(data) {
    return [
      data?.current_game || '',
      data?.checked_games && data?.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''
    ].filter(Boolean).join(' · ');
  }

  function render(data) {
    const status = data?.status || 'idle';
    if (status === 'scanning' || status === 'preparing') {
      clearTimeout(model.resetTimer);
      setState('scanning');
      text(data?.stage || 'Scanning Museum', detailFrom(data));
      progress(data?.progress || 0);
      clearTimeout(model.pollTimer);
      model.pollTimer = window.setTimeout(readStatus, 850);
      return;
    }
    if (status === 'complete') {
      setState('complete');
      text('Museum Updated', `${data?.summary?.checked || data?.total_games || 0} games checked`);
      progress(100);
      resetSoon(1200);
      return;
    }
    if (status === 'failed') {
      setState('error');
      text('Scan interrupted', data?.last_error || 'Try again when the server is available.');
      resetSoon(1750);
      return;
    }
    setState('idle');
    text('', '');
    progress(0, true);
  }

  async function requestJson(url, options = {}) {
    const controller = new AbortController();
    model.request = controller;
    try {
      const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        signal: controller.signal
      });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
      return payload;
    } finally {
      if (model.request === controller) model.request = null;
    }
  }

  async function readStatus() {
    if (model.destroyed || model.request) return;
    try {
      render(await requestJson(`/api/museum-scan/status?_=${Date.now()}`));
    } catch (error) {
      if (error.name !== 'AbortError' && model.state === 'scanning') {
        clearTimeout(model.pollTimer);
        model.pollTimer = window.setTimeout(readStatus, 1400);
      }
    }
  }

  async function start(event) {
    if (!event.isTrusted || model.starting || model.state === 'scanning' || model.destroyed) return;
    model.starting = true;
    clearTimers();
    setState('scanning');
    text('Starting Museum Scan', 'Checking your collection…');
    progress(2, true);
    try {
      const payload = await requestJson(`/api/museum-scan/start?_=${Date.now()}`, {
        method: 'POST',
        headers: { 'X-Vaultarr-User-Action': 'scan-museum' }
      });
      render(payload);
    } catch (error) {
      setState('error');
      text('Could not start scan', error.message || 'Try again when the server is available.');
      resetSoon(1800);
    } finally {
      model.starting = false;
    }
  }

  function destroy() {
    model.destroyed = true;
    action.removeEventListener('click', start);
    clearTimers();
    if (model.request) model.request.abort();
    if (model.raf) cancelAnimationFrame(model.raf);
  }

  action.addEventListener('click', start);
  window.VaultarrMuseumScanPill = { destroy, readStatus };

  // Read-only status hydration. Starting is possible only inside start().
  readStatus();
})();
