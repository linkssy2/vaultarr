(() => {
  if (window.VaultarrMuseumScan?.installed) return;

  const state = {
    timer: null,
    completionTimer: null,
    active: false,
    displayedProgress: 0,
    targetProgress: 0,
    progressFrame: null,
    lastFrameAt: 0,
    lastStage: '',
    lastDetail: ''
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const nodes = () => ({
    controls: [...document.querySelectorAll('[data-museum-scan-control]')],
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
    const speed = Math.max(4.5, Math.abs(distance) * 1.9);
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
      setTimeout(() => {
        element.textContent = text;
        requestAnimationFrame(() => element.classList.remove('is-changing'));
      }, 100);
    });
  }

  function returnToIdle(control) {
    control.classList.remove('is-active', 'is-complete', 'is-failed', 'is-expanded');
    control.setAttribute('aria-expanded', 'false');
    control.disabled = false;
    control.title = 'Scan Museum';
  }

  function scheduleIdleReturn() {
    clearTimeout(state.completionTimer);
    state.completionTimer = setTimeout(() => {
      nodes().controls.forEach(control => control.classList.add('is-contracting'));
      state.completionTimer = setTimeout(() => {
        nodes().controls.forEach(control => {
          control.classList.remove('is-contracting');
          returnToIdle(control);
        });
        state.displayedProgress = 0;
        state.targetProgress = 0;
        setProgressVisual(0);
      }, 620);
    }, 1650);
  }

  function render(data) {
    const n = nodes();
    const running = ['scanning', 'preparing'].includes(data.status);
    const progress = clamp(data.progress);
    state.active = running;

    n.controls.forEach(control => {
      control.classList.toggle('is-active', running);
      control.classList.toggle('is-complete', data.status === 'complete');
      control.classList.toggle('is-failed', data.status === 'failed');
      control.disabled = running;
      control.title = running ? 'Museum scan in progress' : 'Scan Museum';
      if (running) control.classList.remove('is-contracting');
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

    if (running) schedule(650);
    else {
      stop();
      if (data.status === 'complete' || data.status === 'failed') scheduleIdleReturn();
      else n.controls.forEach(returnToIdle);
    }
  }

  async function poll() {
    try {
      const response = await fetch(`/api/museum-scan/status?_=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.ok) render(await response.json());
    } catch (_) {
      if (state.active) schedule(1400);
    }
  }

  function schedule(delay = 700) {
    clearTimeout(state.timer);
    state.timer = setTimeout(poll, delay);
  }
  function stop() { clearTimeout(state.timer); state.timer = null; }

  async function start(control) {
    if (state.active || control?.classList.contains('is-active')) return;
    clearTimeout(state.completionTimer);
    if (control) {
      control.classList.add('is-active');
      control.disabled = true;
      control.setAttribute('aria-expanded', 'true');
    }
    setTargetProgress(1, true);
    crossfade(nodes().stages, 'Starting Museum Scan', 'lastStage');
    crossfade(nodes().details, 'Checking your collection…', 'lastDetail');
    try {
      const response = await fetch(`/api/museum-scan/start?_=${Date.now()}`, { method: 'POST', cache: 'no-store', headers: { Accept: 'application/json' } });
      render(await response.json());
    } catch (_) {
      nodes().controls.forEach(c => {
        c.classList.add('is-failed');
        c.classList.remove('is-active');
        c.disabled = false;
      });
      crossfade(nodes().stages, 'Could not start scan', 'lastStage');
      crossfade(nodes().details, 'Try again when the server is available.', 'lastDetail');
      scheduleIdleReturn();
    }
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('[data-museum-scan-control]');
    if (!control) return;
    event.preventDefault();
    if (!state.active && !control.classList.contains('is-complete') && !control.classList.contains('is-failed')) start(control);
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : poll());
  document.addEventListener('vaultarr:navigation-complete', poll);
  window.VaultarrMuseumScan = { installed: true, poll, start };
  poll();
})();
