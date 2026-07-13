(() => {
  if (window.VaultarrMuseumScan?.installed) return;

  const state = {
    timer: null,
    completionTimer: null,
    removalTimer: null,
    active: false,
    lastStatus: '',
    displayedProgress: 0,
    targetProgress: 0,
    progressFrame: null,
    lastFrameAt: 0,
    lastStage: '',
    lastDetail: ''
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));
  const nodes = () => ({
    buttons: [...document.querySelectorAll('[data-museum-scan-start]')],
    pills: [...document.querySelectorAll('[data-museum-scan-pill]')],
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

  function revealPill(pill) {
    clearTimeout(state.removalTimer);
    if (!pill.hidden && pill.classList.contains('is-visible')) return;
    pill.hidden = false;
    pill.classList.remove('is-leaving', 'is-collapsing');
    pill.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pill.classList.add('is-visible');
      pill.classList.remove('is-entering');
    }));
  }

  function hidePill(pill) {
    pill.classList.remove('is-visible', 'is-expanded');
    pill.classList.add('is-leaving');
    pill.setAttribute('aria-expanded', 'false');
    const finish = () => {
      pill.hidden = true;
      pill.classList.remove('is-leaving', 'is-collapsing', 'is-complete', 'is-failed');
      pill.removeEventListener('transitionend', finish);
    };
    pill.addEventListener('transitionend', finish);
    state.removalTimer = setTimeout(finish, 520);
  }

  function crossfade(elements, text, key) {
    if (state[key] === text) return;
    state[key] = text;
    elements.forEach(element => {
      element.classList.add('is-changing');
      setTimeout(() => {
        element.textContent = text;
        requestAnimationFrame(() => element.classList.remove('is-changing'));
      }, 110);
    });
  }

  function scheduleCompletionHide() {
    clearTimeout(state.completionTimer);
    state.completionTimer = setTimeout(() => {
      nodes().pills.forEach(pill => {
        pill.classList.remove('is-expanded');
        pill.setAttribute('aria-expanded', 'false');
        pill.classList.add('is-collapsing');
      });
      state.completionTimer = setTimeout(() => {
        nodes().pills.forEach(hidePill);
      }, 780);
    }, 1800);
  }

  function render(data) {
    const n = nodes();
    const running = ['scanning', 'preparing'].includes(data.status);
    const visible = running || data.status === 'complete' || data.status === 'failed';
    const progress = clamp(data.progress);

    state.active = running;
    state.lastStatus = data.status;
    if (running) clearTimeout(state.completionTimer);

    n.buttons.forEach(button => {
      button.disabled = running;
      button.textContent = running ? `Scanning… ${Math.round(progress)}%` : 'Scan Museum';
      button.classList.toggle('is-scanning', running);
    });

    n.pills.forEach(pill => {
      if (visible) revealPill(pill);
      else if (!pill.hidden) hidePill(pill);
      pill.classList.toggle('is-active', running);
      pill.classList.toggle('is-complete', data.status === 'complete');
      pill.classList.toggle('is-failed', data.status === 'failed');
      if (running) pill.classList.remove('is-collapsing', 'is-leaving');
    });

    setTargetProgress(progress, state.lastStatus === '' || (running && state.displayedProgress > progress + 15));

    const stage = data.stage || (running ? 'Scanning Museum' : data.status === 'complete' ? 'Museum synced' : data.status === 'failed' ? 'Scan needs attention' : 'Ready');
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
      if (data.status === 'complete') scheduleCompletionHide();
    }
  }

  async function poll() {
    try {
      const response = await fetch(`/api/museum-scan/status?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (response.ok) render(await response.json());
    } catch (_) {
      if (state.active) schedule(1400);
    }
  }

  function schedule(delay = 700) {
    clearTimeout(state.timer);
    state.timer = setTimeout(poll, delay);
  }

  function stop() {
    clearTimeout(state.timer);
    state.timer = null;
  }

  async function start(button) {
    if (button) button.disabled = true;
    try {
      const response = await fetch(`/api/museum-scan/start?_=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      render(await response.json());
    } catch (_) {
      if (button) {
        button.disabled = false;
        button.textContent = 'Scan Museum';
      }
    }
  }

  document.addEventListener('click', event => {
    const startButton = event.target.closest('[data-museum-scan-start]');
    if (startButton) {
      event.preventDefault();
      start(startButton);
      return;
    }

    const pill = event.target.closest('.sidebar-scan-pill[data-museum-scan-pill]');
    if (pill) {
      event.preventDefault();
      const expanded = !pill.classList.contains('is-expanded');
      pill.classList.toggle('is-expanded', expanded);
      pill.setAttribute('aria-expanded', String(expanded));
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else poll();
  });
  document.addEventListener('vaultarr:navigation-complete', poll);

  window.VaultarrMuseumScan = { installed: true, poll, start };
  poll();
})();
