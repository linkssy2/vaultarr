(() => {
  if (window.VaultarrMuseumScan?.installed) return;

  const state = {
    timer: null,
    completionTimer: null,
    contractionTimer: null,
    active: false,
    displayedProgress: 0,
    targetProgress: 0,
    progressFrame: null,
    lastFrameAt: 0,
    lastStage: '',
    lastDetail: '',
    requestInFlight: false
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const nodes = () => ({
    shells: [...document.querySelectorAll('[data-museum-scan-control]')],
    buttons: [...document.querySelectorAll('[data-museum-scan-start]')],
    fills: [...document.querySelectorAll('[data-museum-scan-fill]')],
    percents: [...document.querySelectorAll('[data-museum-scan-percent]')],
    stages: [...document.querySelectorAll('[data-museum-scan-stage]')],
    details: [...document.querySelectorAll('[data-museum-scan-detail]')]
  });

  function setProgressVisual(value) {
    const progress = clamp(value);
    const n = nodes();
    n.fills.forEach(fill => { fill.style.width = `${progress.toFixed(1)}%`; });
    n.percents.forEach(label => { label.textContent = `${Math.round(progress)}%`; });
  }

  function animateProgress(now) {
    if (!state.lastFrameAt) state.lastFrameAt = now;
    const elapsed = Math.min(48, now - state.lastFrameAt);
    state.lastFrameAt = now;
    const distance = state.targetProgress - state.displayedProgress;
    if (Math.abs(distance) < 0.08) {
      state.displayedProgress = state.targetProgress;
      setProgressVisual(state.displayedProgress);
      state.progressFrame = null;
      state.lastFrameAt = 0;
      return;
    }
    const speed = Math.max(3.25, Math.abs(distance) * 1.45);
    const step = Math.sign(distance) * Math.min(Math.abs(distance), speed * elapsed / 1000);
    state.displayedProgress += step;
    setProgressVisual(state.displayedProgress);
    state.progressFrame = requestAnimationFrame(animateProgress);
  }

  function setTargetProgress(value, immediate = false) {
    state.targetProgress = clamp(value);
    if (immediate) {
      state.displayedProgress = state.targetProgress;
      setProgressVisual(state.displayedProgress);
      return;
    }
    if (!state.progressFrame) state.progressFrame = requestAnimationFrame(animateProgress);
  }

  function crossfade(elements, text, key) {
    if (state[key] === text) return;
    state[key] = text;
    elements.forEach(element => {
      element.classList.add('is-changing');
      window.setTimeout(() => {
        element.textContent = text;
        requestAnimationFrame(() => element.classList.remove('is-changing'));
      }, 120);
    });
  }

  function setShellState(shell, nextState) {
    shell.dataset.state = nextState;
    shell.classList.toggle('is-active', nextState === 'active');
    shell.classList.toggle('is-complete', nextState === 'complete');
    shell.classList.toggle('is-failed', nextState === 'failed');
  }

  function returnToIdle(shell) {
    setShellState(shell, 'idle');
    shell.classList.remove('is-contracting');
    const live = shell.querySelector('.sidebar-scan-control-live');
    const button = shell.querySelector('[data-museum-scan-start]');
    if (live) live.setAttribute('aria-hidden', 'true');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.disabled = false;
      button.title = 'Scan Museum';
    }
  }

  function scheduleIdleReturn() {
    clearTimeout(state.completionTimer);
    clearTimeout(state.contractionTimer);
    state.completionTimer = window.setTimeout(() => {
      nodes().shells.forEach(shell => shell.classList.add('is-contracting'));
      state.contractionTimer = window.setTimeout(() => {
        nodes().shells.forEach(returnToIdle);
        state.displayedProgress = 0;
        state.targetProgress = 0;
        setProgressVisual(0);
      }, 1080);
    }, 1900);
  }

  function render(data) {
    const n = nodes();
    const running = ['scanning', 'preparing'].includes(data.status);
    const progress = clamp(data.progress);
    state.active = running;

    n.shells.forEach(shell => {
      const nextState = running ? 'active' : data.status === 'complete' ? 'complete' : data.status === 'failed' ? 'failed' : 'idle';
      setShellState(shell, nextState);
      if (running) shell.classList.remove('is-contracting');
      const live = shell.querySelector('.sidebar-scan-control-live');
      const button = shell.querySelector('[data-museum-scan-start]');
      const expanded = nextState !== 'idle';
      if (live) live.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      if (button) {
        button.disabled = running;
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        button.title = running ? 'Museum scan in progress' : 'Scan Museum';
      }
    });

    setTargetProgress(progress, running && state.displayedProgress > progress + 15);
    const stage = data.stage || (running ? 'Scanning Museum' : data.status === 'complete' ? 'Museum Updated' : data.status === 'failed' ? 'Scan needs attention' : 'Ready');
    const detail = running
      ? [data.current_game, data.checked_games && data.total_games ? `${data.checked_games} / ${data.total_games} checked` : ''].filter(Boolean).join(' · ')
      : data.status === 'complete'
        ? `${data.summary?.checked || data.total_games || 0} games checked · ${data.summary?.prepared || data.completed_games || 0} prepared`
        : (data.last_error || '');
    crossfade(n.stages, stage, 'lastStage');
    crossfade(n.details, detail, 'lastDetail');
    document.dispatchEvent(new CustomEvent('vaultarr:museum-scan-updated', { detail: data }));

    if (running) schedule(700);
    else {
      stop();
      if (data.status === 'complete' || data.status === 'failed') scheduleIdleReturn();
      else n.shells.forEach(returnToIdle);
    }
  }

  async function poll() {
    if (state.requestInFlight) return;
    state.requestInFlight = true;
    try {
      const response = await fetch(`/api/museum-scan/status?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (response.ok) render(await response.json());
    } catch (_) {
      if (state.active) schedule(1400);
    } finally {
      state.requestInFlight = false;
    }
  }

  function schedule(delay = 700) {
    clearTimeout(state.timer);
    state.timer = window.setTimeout(poll, delay);
  }

  function stop() {
    clearTimeout(state.timer);
    state.timer = null;
  }

  async function start(button) {
    if (state.active) return;
    if (!button) return;
    button.disabled = false;
    const shell = button?.closest('[data-museum-scan-control]');
    clearTimeout(state.completionTimer);
    clearTimeout(state.contractionTimer);
    if (shell) {
      shell.classList.remove('is-contracting', 'is-complete', 'is-failed');
      setShellState(shell, 'active');
      const live = shell.querySelector('.sidebar-scan-control-live');
      if (live) live.setAttribute('aria-hidden', 'false');
    }
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-expanded', 'true');
    }
    state.active = true;
    setTargetProgress(1, true);
    crossfade(nodes().stages, 'Starting Museum Scan', 'lastStage');
    crossfade(nodes().details, 'Checking your collection…', 'lastDetail');
    try {
      const response = await fetch(`/api/museum-scan/start?_=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Could not start scan');
      render(payload);
    } catch (error) {
      state.active = false;
      nodes().shells.forEach(shellNode => setShellState(shellNode, 'failed'));
      crossfade(nodes().stages, 'Could not start scan', 'lastStage');
      crossfade(nodes().details, error?.message || 'Try again when the server is available.', 'lastDetail');
      scheduleIdleReturn();
    }
  }

  function bindScanButtons() {
    document.querySelectorAll('[data-museum-scan-start]').forEach(button => {
      if (button.dataset.scanBound === '1') return;
      button.dataset.scanBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        start(button);
      });
    });
  }

  // Keep the delegated fallback for controls introduced by smooth navigation.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-museum-scan-start]');
    if (!button || button.dataset.scanBound === '1') return;
    event.preventDefault();
    event.stopPropagation();
    start(button);
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : poll());
  document.addEventListener('vaultarr:navigation-complete', () => { bindScanButtons(); poll(); });
  window.VaultarrMuseumScan = { installed: true, poll, start, bindScanButtons };

  // Initial load only binds the explicit control and reads current status.
  // It never starts a new scan.
  bindScanButtons();
  poll();
})();
