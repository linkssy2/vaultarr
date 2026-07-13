(() => {
  if (window.VaultarrMuseumScan?.installed) return;
  const state = { timer: null, completionTimer: null, active: false, lastStatus: '' };
  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const nodes = () => ({
    buttons: [...document.querySelectorAll('[data-museum-scan-start]')],
    pills: [...document.querySelectorAll('[data-museum-scan-pill]')],
    fills: [...document.querySelectorAll('[data-museum-scan-fill]')],
    percents: [...document.querySelectorAll('[data-museum-scan-percent]')],
    stages: [...document.querySelectorAll('[data-museum-scan-stage]')],
    details: [...document.querySelectorAll('[data-museum-scan-detail]')]
  });
  function scheduleCompletionHide() {
    clearTimeout(state.completionTimer);
    state.completionTimer = setTimeout(() => {
      nodes().pills.forEach(p => {
        p.classList.add('is-dismissing');
        setTimeout(() => { p.hidden = true; p.classList.remove('is-dismissing','is-expanded'); p.setAttribute('aria-expanded','false'); }, 320);
      });
    }, 4500);
  }
  function render(data) {
    const n = nodes();
    const running = ['scanning','preparing'].includes(data.status);
    const visible = running || data.status === 'complete' || data.status === 'failed';
    const progress = clamp(data.progress);
    state.active = running;
    state.lastStatus = data.status;
    if (running) clearTimeout(state.completionTimer);
    n.buttons.forEach(b => {
      b.disabled = running;
      b.textContent = running ? `Scanning… ${progress}%` : 'Scan Museum';
      b.classList.toggle('is-scanning', running);
    });
    n.pills.forEach(p => {
      p.hidden = !visible;
      p.classList.toggle('is-active', running);
      p.classList.toggle('is-complete', data.status === 'complete');
      p.classList.toggle('is-failed', data.status === 'failed');
      p.classList.remove('is-dismissing');
    });
    n.fills.forEach(f => { f.style.width = `${progress}%`; });
    n.percents.forEach(e => { e.textContent = `${progress}%`; });
    n.stages.forEach(e => { e.textContent = data.stage || (running ? 'Scanning Museum' : data.status === 'complete' ? 'Scan complete' : 'Ready'); });
    const detail = running
      ? [data.current_game, data.checked_games && data.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''].filter(Boolean).join(' · ')
      : data.status === 'complete'
        ? `${data.summary?.checked || data.total_games || 0} games checked · ${data.summary?.prepared || data.completed_games || 0} prepared`
        : (data.last_error || '');
    n.details.forEach(e => { e.textContent = detail; });
    document.dispatchEvent(new CustomEvent('vaultarr:museum-scan-updated', { detail: data }));
    if (running) schedule(650);
    else {
      stop();
      if (data.status === 'complete') scheduleCompletionHide();
    }
  }
  async function poll() {
    try {
      const r = await fetch(`/api/museum-scan/status?_=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (r.ok) render(await r.json());
    } catch (_) {
      if (state.active) schedule(1400);
    }
  }
  function schedule(delay = 700) { clearTimeout(state.timer); state.timer = setTimeout(poll, delay); }
  function stop() { clearTimeout(state.timer); state.timer = null; }
  async function start(button) {
    if (button) button.disabled = true;
    try {
      const r = await fetch(`/api/museum-scan/start?_=${Date.now()}`, { method: 'POST', cache: 'no-store', headers: { Accept: 'application/json' } });
      render(await r.json());
    } catch (_) {
      if (button) { button.disabled = false; button.textContent = 'Scan Museum'; }
    }
  }
  document.addEventListener('click', e => {
    const startButton = e.target.closest('[data-museum-scan-start]');
    if (startButton) { e.preventDefault(); start(startButton); return; }
    const pill = e.target.closest('.sidebar-scan-pill[data-museum-scan-pill]');
    if (pill) {
      e.preventDefault();
      const expanded = !pill.classList.contains('is-expanded');
      pill.classList.toggle('is-expanded', expanded);
      pill.setAttribute('aria-expanded', String(expanded));
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else poll(); });
  document.addEventListener('vaultarr:navigation-complete', poll);
  window.VaultarrMuseumScan = { installed: true, poll, start };
  poll();
})();
