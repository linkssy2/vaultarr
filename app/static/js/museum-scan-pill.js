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
  const progressBar = root.querySelector('[data-scan-progressbar]');
  const liquidCanvas = root.querySelector('[data-scan-liquid]');
  const checkedNode = root.querySelector('[data-scan-checked]');
  const preparedNode = root.querySelector('[data-scan-prepared]');
  const reviewNode = root.querySelector('[data-scan-review]');

  function createLiquidEngine(canvas) {
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return { setProgress() {}, setActive() {}, destroy() {} };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const surface = Array.from({ length: 9 }, () => ({ offset: 0, velocity: 0 }));
    let width = 1;
    let height = 1;
    let ratio = 1;
    let target = 0;
    let position = 0;
    let fillVelocity = 0;
    let active = false;
    let flowEnergy = 0;
    let flowPhase = 0;
    let frame = 0;
    let lastFrame = 0;
    let disposed = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(performance.now());
    }

    function draw(now) {
      context.clearRect(0, 0, width, height);
      if (position <= .01) return;

      const front = Math.max(10, Math.min(width, width * position / 100));
      const gradient = context.createLinearGradient(0, 0, Math.max(front, 1), height);
      gradient.addColorStop(0, '#0ea5e9');
      gradient.addColorStop(.52, '#2563eb');
      gradient.addColorStop(1, '#6366f1');

      const edge = surface.map((point, index) => ({
        x: Math.max(0, Math.min(width, front + point.offset)),
        y: index / (surface.length - 1) * height
      }));
      function traceEdge(move) {
        if (move) context.moveTo(edge[0].x, edge[0].y);
        else context.lineTo(edge[0].x, edge[0].y);
        for (let index = 1; index < edge.length - 1; index += 1) {
          const midpoint = {
            x: (edge[index].x + edge[index + 1].x) / 2,
            y: (edge[index].y + edge[index + 1].y) / 2
          };
          context.quadraticCurveTo(edge[index].x, edge[index].y, midpoint.x, midpoint.y);
        }
        context.lineTo(edge[edge.length - 1].x, edge[edge.length - 1].y);
      }

      context.beginPath();
      context.moveTo(0, 0);
      traceEdge(false);
      context.lineTo(0, height);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();

      context.save();
      context.clip();
      const flow = now * .028;
      for (let index = 0; index < 5; index += 1) {
        const span = Math.max(12, front - 8);
        const x = 4 + ((flow * (1 + index * .13) + index * 31) % span);
        const y = 6 + ((index * 11 + now * .008 * (index % 2 ? 1 : -1)) % Math.max(8, height - 12));
        const radius = 1.1 + (index % 3) * .55;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(224, 242, 254, ${.16 + (index % 2) * .10})`;
        context.fill();
      }
      const sheen = context.createLinearGradient(0, 0, 0, height);
      sheen.addColorStop(0, 'rgba(255,255,255,.22)');
      sheen.addColorStop(.38, 'rgba(255,255,255,.035)');
      sheen.addColorStop(1, 'rgba(2,12,28,.16)');
      context.fillStyle = sheen;
      context.fillRect(0, 0, front + 12, height);
      context.restore();

      context.beginPath();
      traceEdge(true);
      context.strokeStyle = 'rgba(186, 230, 253, .72)';
      context.lineWidth = 1.25;
      context.shadowColor = 'rgba(56, 189, 248, .65)';
      context.shadowBlur = 7;
      context.stroke();
      context.shadowBlur = 0;
    }

    function simulate(now) {
      if (disposed) return;
      const elapsed = lastFrame ? Math.min(2, (now - lastFrame) / 16.667) : 1;
      lastFrame = now;

      const acceleration = (target - position) * .045;
      fillVelocity = (fillVelocity + acceleration * elapsed) * Math.pow(.84, elapsed);
      position += fillVelocity * elapsed;
      if (Math.abs(target - position) < .015 && Math.abs(fillVelocity) < .015) {
        position = target;
        fillVelocity = 0;
      }

      flowPhase += (.10 + Math.min(.12, Math.abs(fillVelocity) * .025)) * elapsed;
      flowEnergy *= Math.pow(.955, elapsed);
      for (let index = 0; index < surface.length; index += 1) {
        const point = surface[index];
        if (flowEnergy > .01) {
          const envelope = Math.sin(index / (surface.length - 1) * Math.PI);
          point.velocity += Math.sin(flowPhase + index * 1.18) * flowEnergy * envelope * .23 * elapsed;
        }
        point.velocity += -point.offset * .065 * elapsed;
        point.velocity *= Math.pow(.88, elapsed);
      }
      for (let pass = 0; pass < 3; pass += 1) {
        for (let index = 0; index < surface.length; index += 1) {
          const point = surface[index];
          if (index > 0) point.velocity += (surface[index - 1].offset - point.offset) * .032 * elapsed;
          if (index < surface.length - 1) point.velocity += (surface[index + 1].offset - point.offset) * .032 * elapsed;
        }
      }
      for (const point of surface) {
        point.offset = Math.max(-8, Math.min(8, point.offset + point.velocity * elapsed));
      }

      draw(now);
      const unsettled = Math.abs(target - position) > .015 || Math.abs(fillVelocity) > .015 || surface.some(point => Math.abs(point.offset) > .03 || Math.abs(point.velocity) > .03);
      if (active || unsettled) frame = requestAnimationFrame(simulate);
      else {
        frame = 0;
        lastFrame = 0;
      }
    }

    function wake() {
      if (!frame && !disposed) frame = requestAnimationFrame(simulate);
    }

    function setProgress(value) {
      const next = Math.max(0, Math.min(100, Number(value) || 0));
      if (reducedMotion.matches) {
        target = position = next;
        fillVelocity = 0;
        surface.forEach(point => { point.offset = 0; point.velocity = 0; });
        draw(performance.now());
        return;
      }
      const change = next - target;
      target = next;
      if (Math.abs(change) > .025) {
        flowEnergy = Math.min(3.2, flowEnergy + Math.abs(change) * 1.25);
        const impulse = Math.max(-5.2, Math.min(5.2, change * 2.8));
        const center = Math.floor(surface.length * (.3 + Math.random() * .4));
        surface.forEach((point, index) => {
          const distance = Math.abs(index - center);
          if (distance < 4) {
            const ripple = Math.sin(flowPhase + index * 1.12);
            point.velocity += impulse * (1 - distance / 4) * ripple;
          }
        });
      }
      wake();
    }

    function setActive(value) {
      active = Boolean(value);
      if (active) wake();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return {
      setProgress,
      setActive,
      destroy() {
        disposed = true;
        observer.disconnect();
        if (frame) cancelAnimationFrame(frame);
      }
    };
  }

  const liquidEngine = createLiquidEngine(liquidCanvas);

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
    starting: false,
    observedActiveScan: false
  };

  const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));

  function paint(value) {
    const progress = clamp(value);
    liquidEngine.setProgress(progress);
    if (percentNode) percentNode.textContent = `${Math.round(progress)}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
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

  function stats(data = {}) {
    const checked = Number(data.checked_games || data.summary?.checked || 0);
    const total = Number(data.total_games || checked || 0);
    const prepared = Number(data.completed_games || data.summary?.prepared || 0);
    const review = Number(data.failed_games || data.summary?.needs_review || 0);
    if (checkedNode) checkedNode.textContent = `${checked} / ${total}`;
    if (preparedNode) preparedNode.textContent = String(prepared);
    if (reviewNode) reviewNode.textContent = String(review);
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
    liquidEngine.setActive(next === 'scanning');
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
        model.observedActiveScan = false;
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
      model.observedActiveScan = true;
      clearTimeout(model.resetTimer);
      setState('scanning');
      text(data?.stage || 'Scanning Museum', detailFrom(data));
      stats(data);
      progress(data?.progress || 0);
      clearTimeout(model.pollTimer);
      model.pollTimer = window.setTimeout(readStatus, 850);
      return;
    }
    if (status === 'complete') {
      if (!model.observedActiveScan) {
        setState('idle');
        text('', '');
        stats();
        progress(0, true);
        return;
      }
      setState('complete');
      text('Museum Updated', `${data?.summary?.checked || data?.total_games || 0} games checked`);
      stats(data);
      progress(100);
      resetSoon(1200);
      return;
    }
    if (status === 'failed') {
      if (!model.observedActiveScan) {
        setState('idle');
        text('', '');
        stats();
        progress(0, true);
        return;
      }
      setState('error');
      text('Scan interrupted', data?.last_error || 'Try again when the server is available.');
      stats(data);
      resetSoon(1750);
      return;
    }
    model.observedActiveScan = false;
    setState('idle');
    text('', '');
    stats();
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
    model.observedActiveScan = true;
    clearTimers();
    setState('scanning');
    text('Starting Museum Scan', 'Checking your collection…');
    stats();
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
    liquidEngine.destroy();
  }

  action.addEventListener('click', start);
  window.VaultarrMuseumScanPill = { destroy, readStatus };

  // Read-only status hydration. Starting is possible only inside start().
  readStatus();
})();
