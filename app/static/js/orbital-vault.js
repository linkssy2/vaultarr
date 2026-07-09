(() => {
  const panels = new WeakMap();

  function parseDuration(value, fallback) {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (text.endsWith('ms')) return Math.max(1, parseFloat(text) / 1000);
    return Math.max(1, parseFloat(text) || fallback);
  }

  function initOrbitalPanel(panel) {
    if (!panel || panels.has(panel)) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      panel.classList.add('orbital-reduced-motion');
      panels.set(panel, { reducedMotion: true });
      return;
    }

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
      elapsed += delta / 1000;

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
          orbit.node.style.transform = `rotate(${-orbitDegrees * hoverBoost}deg) scale(${pulse})`;
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
    panels.set(panel, { rafId, onEnter, onLeave, onMove });
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
