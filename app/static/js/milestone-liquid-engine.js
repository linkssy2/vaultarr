(() => {
  "use strict";

  const ENGINE_KEY = "__vaultarrMilestoneLiquidEngine";
  const engines = new Set();
  const DEFAULT_PALETTE = {
    top: "#087bf2", middle: "#005bd7", low: "#003d9f", deep: "#00256a",
    surfaceBright: "rgba(211, 252, 255, 1)", surface: "rgba(80, 225, 255, 1)",
    surfaceFade: "rgba(5, 109, 239, .48)", glow: "rgba(87, 226, 255, 1)",
    shadow: "rgba(0, 102, 255, .38)", current: "rgba(29, 150, 255, .25)",
    currentFade: "rgba(0, 95, 230, .10)", bubble: "rgba(151, 225, 255, .58)",
    transparent: "rgba(0, 20, 76, 0)",
  };

  class SpringLiquid {
    constructor(core) {
      this.core = core;
      this.vessel = core.querySelector(".milestone-vessel");
      this.canvas = core.querySelector(".milestone-liquid-canvas");
      this.ctx = this.canvas?.getContext("2d", { alpha: true });
      this.progress = Math.max(0, Math.min(100, Number(core.dataset.milestoneProgress || 0)));
      this.points = [];
      this.particles = [];
      this.running = false;
      this.visible = true;
      this.lastTime = 0;
      this.accumulator = 0;
      this.palette = DEFAULT_PALETTE;
      this.resizeObserver = null;
      this.intersectionObserver = null;

      if (!this.vessel || !this.canvas || !this.ctx) return;

      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.onVisibilityChange = this.onVisibilityChange.bind(this);

      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(this.vessel);

      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = Boolean(entry?.isIntersecting);
        if (this.visible) this.start();
        else this.stop();
      }, { threshold: 0.05 });
      this.intersectionObserver.observe(this.core);

      document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.resize();
      this.start();
    }

    resize() {
      const rect = this.vessel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.palette = window.VaultarrLiquidTheme?.getPalette?.() || DEFAULT_PALETTE;
      this.width = Math.max(1, Math.round(rect.width));
      this.height = Math.max(1, Math.round(rect.height));
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.radius = Math.min(this.width, this.height) / 2;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
      const vesselStyle = getComputedStyle(this.vessel);
      const borderWidth = Number.parseFloat(vesselStyle.borderTopWidth) || 0;
      this.liquidTop = borderWidth;
      this.liquidBottom = this.height - borderWidth;
      this.baseY = this.liquidBottom - (this.liquidBottom - this.liquidTop) * (this.progress / 100);

      const pointCount = 34;
      this.points = Array.from({ length: pointCount }, (_, index) => ({
        x: (index / (pointCount - 1)) * this.width,
        y: this.baseY,
        velocity: 0,
      }));

      this.particles = Array.from({ length: 14 }, () => this.makeParticle(true));
      this.draw();
    }

    makeParticle(randomY = false) {
      const liquidDepth = Math.max(4, this.liquidBottom - this.baseY);
      return {
        x: Math.random() * this.width,
        y: randomY ? this.baseY + Math.random() * liquidDepth : this.liquidBottom + Math.random() * 12,
        radius: 0.45 + Math.random() * 1.15,
        speed: 4 + Math.random() * 8,
        alpha: 0.13 + Math.random() * 0.28,
        drift: (Math.random() - 0.5) * 3,
      };
    }

    onVisibilityChange() {
      if (document.hidden) this.stop();
      else this.start();
    }

    start() {
      if (this.running || !this.visible || document.hidden) return;
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.frame);
    }

    stop() {
      this.running = false;
    }

    disturbAt(x, strength = 7, direction = -1) {
      if (!this.points.length || this.progress <= 0) return;
      const rawIndex = Math.round((x / Math.max(1, this.width)) * (this.points.length - 1));
      const center = Math.max(2, Math.min(this.points.length - 3, rawIndex));
      this.points[center].velocity += strength * direction;
      if (this.points[center - 1]) this.points[center - 1].velocity += strength * 0.45 * direction;
      if (this.points[center + 1]) this.points[center + 1].velocity += strength * 0.55 * direction;
      if (this.points[center - 2]) this.points[center - 2].velocity += strength * 0.16 * direction;
      if (this.points[center + 2]) this.points[center + 2].velocity += strength * 0.20 * direction;
    }

    update(dt) {
      const tension = 22;
      const damping = 2.9;
      const spread = 29;
      const maxOffset = Math.max(3, Math.min(11, (this.liquidBottom - this.baseY) * 0.36));
      const accelerations = new Array(this.points.length).fill(0);

      for (let i = 0; i < this.points.length; i += 1) {
        const point = this.points[i];
        const displacement = point.y - this.baseY;
        const leftY = this.points[i - 1]?.y ?? point.y;
        const rightY = this.points[i + 1]?.y ?? point.y;
        const neighborCurve = leftY + rightY - point.y * 2;
        accelerations[i] = -tension * displacement - damping * point.velocity + spread * neighborCurve;
      }

      for (let i = 0; i < this.points.length; i += 1) {
        const point = this.points[i];
        point.velocity += accelerations[i] * dt;
        point.y += point.velocity * dt;
        point.y = Math.max(this.baseY - maxOffset, Math.min(this.baseY + maxOffset, point.y));
      }

      for (let i = 0; i < this.particles.length; i += 1) {
        const particle = this.particles[i];
        particle.y -= particle.speed * dt;
        particle.x += Math.sin((particle.y + i * 11) * 0.045) * particle.drift * dt;
        if (particle.y < this.baseY + 4) {
          this.disturbAt(particle.x, 13 + particle.radius * 7, -1);
          this.particles[i] = this.makeParticle(false);
        }
      }
    }

    surfacePath(ctx) {
      if (!this.points.length) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length - 1; i += 1) {
        const current = this.points[i];
        const next = this.points[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        ctx.quadraticCurveTo(current.x, current.y, midX, midY);
      }
      const last = this.points[this.points.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    draw() {
      if (!this.ctx || !this.width || !this.height) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
      ctx.clip();

      if (this.progress > 0 && this.points.length) {
        const palette = this.palette || DEFAULT_PALETTE;
        this.surfacePath(ctx);
        ctx.lineTo(this.width, this.liquidBottom);
        ctx.lineTo(0, this.liquidBottom);
        ctx.closePath();

        const fill = ctx.createLinearGradient(0, this.baseY - 12, 0, this.liquidBottom);
        fill.addColorStop(0, palette.top);
        fill.addColorStop(0.28, palette.middle);
        fill.addColorStop(0.68, palette.low);
        fill.addColorStop(1, palette.deep);
        ctx.fillStyle = fill;
        ctx.shadowColor = palette.shadow;
        ctx.shadowBlur = 22;
        ctx.fill();

        ctx.save();
        this.surfacePath(ctx);
        const surfaceGradient = ctx.createLinearGradient(0, this.baseY - 7, 0, this.baseY + 8);
        surfaceGradient.addColorStop(0, palette.surfaceBright);
        surfaceGradient.addColorStop(0.35, palette.surface);
        surfaceGradient.addColorStop(1, palette.surfaceFade);
        ctx.strokeStyle = surfaceGradient;
        ctx.lineWidth = 5.5;
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 22;
        ctx.stroke();
        ctx.restore();

        const current = ctx.createRadialGradient(
          this.width * 0.32, this.baseY + (this.liquidBottom - this.baseY) * 0.52, 2,
          this.width * 0.44, this.baseY + (this.liquidBottom - this.baseY) * 0.62, this.width * 0.72
        );
        current.addColorStop(0, palette.current);
        current.addColorStop(0.45, palette.currentFade);
        current.addColorStop(1, palette.transparent);
        ctx.fillStyle = current;
        ctx.fillRect(0, this.baseY, this.width, this.liquidBottom - this.baseY);

        for (const particle of this.particles) {
          if (particle.y < this.baseY || particle.y > this.liquidBottom) continue;
          ctx.save();
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.globalAlpha = particle.alpha;
          ctx.fillStyle = palette.surfaceBright;
          ctx.shadowColor = palette.glow;
          ctx.shadowBlur = 5;
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();
    }

    frame(now) {
      if (!this.running) return;
      if (!this.visible || document.hidden || !document.body.contains(this.core)) {
        this.stop();
        return;
      }

      const elapsed = Math.min(50, now - this.lastTime);
      this.lastTime = now;
      this.accumulator += elapsed / 1000;

      const step = 1 / 45;
      while (this.accumulator >= step) {
        this.update(step);
        this.accumulator -= step;
      }

      this.draw();
      requestAnimationFrame(this.frame);
    }

    destroy() {
      this.stop();
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      engines.delete(this);
      if (this.core?.[ENGINE_KEY] === this) delete this.core[ENGINE_KEY];
    }
  }

  function mount() {
    document.querySelectorAll(".experience-score-core").forEach((core) => {
      if (core[ENGINE_KEY]) return;
      const engine = new SpringLiquid(core);
      core[ENGINE_KEY] = engine;
      engines.add(engine);
    });
  }

  function cleanupDetached() {
    for (const engine of engines) {
      if (!document.body.contains(engine.core)) engine.destroy();
    }
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pageshow", mount);
  document.addEventListener("vaultarr:page-loaded", () => {
    cleanupDetached();
    mount();
  });

  const observer = new MutationObserver(() => {
    cleanupDetached();
    mount();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
