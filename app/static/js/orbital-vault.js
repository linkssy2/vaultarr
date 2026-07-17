(() => {
  const panels = new WeakMap();

  function parseDuration(value, fallback) {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (text.endsWith('ms')) return Math.max(1, parseFloat(text) / 1000);
    return Math.max(1, parseFloat(text) || fallback);
  }

  function initHealthLiquid(panel, reducedMotion) {
    const canvas = panel.querySelector('.orbital-health-liquid');
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return null;

    const health = Math.max(0, Math.min(100, Number(panel.dataset.health) || 0));
    const motionScale = reducedMotion ? 0.42 : 1;
    const points = Array.from({ length: 17 }, () => ({ offset: 0, velocity: 0 }));
    const bubbles = Array.from({ length: 5 }, () => ({ x: 0, y: 0, radius: 0, speed: 0 }));
    let width = 1;
    let height = 1;
    let baseY = 1;
    let rafId = 0;
    let lastTime = performance.now();

    function traceV() {
      context.beginPath();
      context.moveTo(width * 0.13, height * 0.10);
      context.lineTo(width * 0.34, height * 0.10);
      context.lineTo(width * 0.50, height * 0.67);
      context.lineTo(width * 0.66, height * 0.10);
      context.lineTo(width * 0.87, height * 0.10);
      context.lineTo(width * 0.62, height * 0.90);
      context.lineTo(width * 0.38, height * 0.90);
      context.closePath();
    }

    function resetBubble(bubble, randomY = true) {
      bubble.x = width * (0.24 + Math.random() * 0.52);
      bubble.y = randomY ? baseY + Math.random() * Math.max(4, height * 0.88 - baseY) : height * 0.87;
      bubble.radius = 0.55 + Math.random() * 1.05;
      bubble.speed = 9 + Math.random() * 8;
    }

    function resize() {
      width = Math.max(1, canvas.clientWidth || 42);
      height = Math.max(1, canvas.clientHeight || 48);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      baseY = height * 0.90 - height * 0.80 * (health / 100);
      bubbles.forEach((bubble) => resetBubble(bubble));
      draw();
    }

    function disturbAt(x, strength) {
      if (!points.length || health <= 0) return;
      const rawIndex = Math.round((x / Math.max(1, width)) * (points.length - 1));
      const center = Math.max(2, Math.min(points.length - 3, rawIndex));
      points[center].velocity -= strength;
      points[center - 1].velocity -= strength * 0.45;
      points[center + 1].velocity -= strength * 0.55;
      points[center - 2].velocity -= strength * 0.16;
      points[center + 2].velocity -= strength * 0.20;
    }

    function step(delta) {
      const tension = 22;
      const damping = 2.9;
      const spread = 29;
      const acceleration = new Array(points.length).fill(0);

      points.forEach((point, index) => {
        const left = points[Math.max(0, index - 1)].offset;
        const right = points[Math.min(points.length - 1, index + 1)].offset;
        acceleration[index] = -tension * point.offset - damping * point.velocity + spread * (left + right - point.offset * 2);
      });

      points.forEach((point, index) => {
        point.velocity += acceleration[index] * delta;
        point.offset += point.velocity * delta;
        const maxOffset = Math.max(2.8, Math.min(5.5, (height * 0.90 - baseY) * 0.36));
        point.offset = Math.max(-maxOffset, Math.min(maxOffset, point.offset));
      });

      bubbles.forEach((bubble) => {
        bubble.y -= bubble.speed * delta;
        bubble.x += Math.sin(bubble.y * 0.12) * delta * 1.4;
        if (bubble.y < baseY + 1.5) {
          disturbAt(bubble.x, 13 + bubble.radius * 7);
          resetBubble(bubble, false);
        }
      });
    }

    function surfaceY(index) {
      return baseY + points[index].offset;
    }

    function draw() {
      context.clearRect(0, 0, width, height);

      traceV();
      context.fillStyle = 'rgba(244, 249, 255, 0.055)';
      context.fill();

      context.save();
      traceV();
      context.clip();

      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, surfaceY(0));
      for (let index = 1; index < points.length; index += 1) {
        const x = width * index / (points.length - 1);
        const previousX = width * (index - 1) / (points.length - 1);
        context.quadraticCurveTo(previousX, surfaceY(index - 1), (previousX + x) / 2, (surfaceY(index - 1) + surfaceY(index)) / 2);
      }
      context.lineTo(width, surfaceY(points.length - 1));
      context.lineTo(width, height);
      context.closePath();

      const liquid = context.createLinearGradient(0, baseY - 4, 0, height);
      liquid.addColorStop(0, 'rgba(255,255,255,0.98)');
      liquid.addColorStop(0.16, 'rgba(246,250,255,0.94)');
      liquid.addColorStop(1, 'rgba(207,224,243,0.78)');
      context.fillStyle = liquid;
      context.shadowColor = 'rgba(255,255,255,0.42)';
      context.shadowBlur = 8;
      context.fill();
      context.shadowBlur = 0;

      context.beginPath();
      context.moveTo(0, surfaceY(0));
      for (let index = 1; index < points.length; index += 1) {
        const x = width * index / (points.length - 1);
        context.lineTo(x, surfaceY(index));
      }
      context.strokeStyle = 'rgba(255,255,255,0.98)';
      context.lineWidth = 1.05;
      context.stroke();

      context.fillStyle = 'rgba(20,36,58,0.28)';
      bubbles.forEach((bubble) => {
        if (bubble.y < baseY || bubble.y > height * 0.91) return;
        context.beginPath();
        context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();

      traceV();
      context.strokeStyle = 'rgba(244,250,255,0.92)';
      context.lineWidth = 2.15;
      context.lineJoin = 'round';
      context.shadowColor = 'rgba(191,225,255,0.62)';
      context.shadowBlur = 10;
      context.stroke();
      context.shadowBlur = 0;
    }

    function frame(now) {
      const delta = Math.min(0.034, Math.max(0.001, (now - lastTime) / 1000)) * motionScale;
      lastTime = now;
      if (!document.hidden) {
        step(delta);
        draw();
      }
      rafId = requestAnimationFrame(frame);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    rafId = requestAnimationFrame(frame);

    return {
      destroy() {
        observer.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
      },
    };
  }

  function initOrbitalPanel(panel) {
    if (!panel || panels.has(panel)) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const healthLiquid = initHealthLiquid(panel, reducedMotion);
    const orbitMotionScale = reducedMotion ? 0.58 : 1;
    if (reducedMotion) panel.classList.add('orbital-reduced-motion');

    const orbits = Array.from(panel.querySelectorAll('.orbit'));
    if (!orbits.length) return;

    panel.classList.add('orbital-js-active', 'orbital-mounted');

    const orbitState = orbits.map((el, index) => {
      const style = getComputedStyle(el);
      const tilt = parseFloat(style.getPropertyValue('--tilt')) || 0;
      const duration = parseDuration(style.getPropertyValue('--speed'), 18 + index * 8);
      const reverse = style.animationDirection === 'reverse' || el.classList.contains('orbit-two') || el.classList.contains('orbit-five');
      return {
        el,
        node: el.querySelector('.node'),
        tilt,
        duration,
        reverse,
        offset: index * 57,
      };
    });

    const stars = Array.from(panel.querySelectorAll('.orbital-stars i'));
    const nebula = panel.querySelector('.cosmos-nebula');
    const core = panel.querySelector('.orbital-core');
    const progress = panel.querySelector('.orbital-progress i');

    let hoverBoost = 1;
    let targetHoverBoost = 1;
    let parallaxX = 0;
    let parallaxY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;

    function onEnter() { targetHoverBoost = 1.12; }
    function onLeave() {
      targetHoverBoost = 1;
      targetParallaxX = 0;
      targetParallaxY = 0;
    }
    function onMove(event) {
      const rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetParallaxX = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      targetParallaxY = ((event.clientY - rect.top) / rect.height - 0.5) * 14;
    }

    panel.addEventListener('mouseenter', onEnter);
    panel.addEventListener('mouseleave', onLeave);
    panel.addEventListener('mousemove', onMove);

    function frame(now) {
      const delta = Math.min(72, now - last);
      last = now;
      elapsed += (delta / 1000) * orbitMotionScale;

      hoverBoost += (targetHoverBoost - hoverBoost) * 0.055;
      parallaxX += (targetParallaxX - parallaxX) * 0.06;
      parallaxY += (targetParallaxY - parallaxY) * 0.06;

      orbitState.forEach((orbit, index) => {
        const direction = orbit.reverse ? -1 : 1;
        const orbitDegrees = ((elapsed / orbit.duration) * 360 * direction + orbit.offset) % 360;
        const wobble = Math.sin(elapsed * 0.42 + index * 0.7) * 1.25;
        orbit.el.style.transform = `rotate(${orbit.tilt + wobble}deg) rotate(${orbitDegrees * hoverBoost}deg)`;
        orbit.el.style.setProperty('--orbit-progress-angle', `${orbitDegrees}deg`);

        if (orbit.node) {
          const pulse = 1 + Math.sin(elapsed * 1.35 + index * 0.8) * 0.045;
          const counterRotation = orbit.node.classList.contains('node-health')
            ? -(orbit.tilt + wobble + orbitDegrees * hoverBoost)
            : -orbitDegrees * hoverBoost;
          orbit.node.style.transform = `rotate(${counterRotation}deg) scale(${pulse})`;
          orbit.node.style.filter = `brightness(${1.04 + Math.sin(elapsed * 0.9 + index) * 0.16})`;
        }
      });

      stars.forEach((star, index) => {
        const x = Math.sin(elapsed * 0.22 + index * 1.9) * (4 + (index % 3));
        const y = Math.cos(elapsed * 0.18 + index * 1.4) * (3 + (index % 4));
        const opacity = 0.34 + Math.sin(elapsed * 0.75 + index) * 0.25;
        star.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        star.style.opacity = String(Math.max(0.18, Math.min(0.82, opacity)));
      });

      if (nebula) {
        nebula.style.transform = `rotate(${-12 + Math.sin(elapsed * 0.045) * 4}deg) translate3d(${parallaxX * -0.42}px, ${parallaxY * -0.34}px, 0) scale(${1 + Math.sin(elapsed * 0.08) * 0.025})`;
      }
      if (core) {
        const breath = 1 + Math.sin(elapsed * 0.72) * 0.028;
        core.style.transform = `translate3d(${parallaxX * 0.22}px, ${parallaxY * 0.18}px, 0) scale(${breath})`;
      }
      if (progress) {
        progress.style.filter = `brightness(${1.02 + Math.sin(elapsed * 1.1) * 0.08})`;
      }

      panel.style.setProperty('--cosmos-parallax-x', `${parallaxX}px`);
      panel.style.setProperty('--cosmos-parallax-y', `${parallaxY}px`);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    panels.set(panel, { rafId, onEnter, onLeave, onMove, healthLiquid });
  }

  function initAllOrbitalPanels() {
    document.querySelectorAll('.vault-cosmos, .orbital-vault').forEach(initOrbitalPanel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllOrbitalPanels);
  } else {
    initAllOrbitalPanels();
  }

  document.addEventListener('vaultarr:page-loaded', () => {
    window.setTimeout(initAllOrbitalPanels, 60);
  });
})();
