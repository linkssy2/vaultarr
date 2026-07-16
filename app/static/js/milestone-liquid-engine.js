(() => {
  "use strict";

  const ENGINE_KEY = "__vaultarrMilestoneLiquidEngine";

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
      this.impulseTimer = 0;
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
      this.baseY = this.height * (1 - this.progress / 100);

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
      const liquidDepth = Math.max(4, this.height - this.baseY);
      return {
        x: Math.random() * this.width,
        y: randomY ? this.baseY + Math.random() * liquidDepth : this.height + Math.random() * 12,
        radius: 0.45 + Math.random() * 1.15,
        speed: 4 + Math.random() * 8,
        alpha: 0.13 + Math.random() * 0.28,
        drift: (Math.random() - 0.5) * 3,
      };
    }

    onVisibilityChange() {
      if (!document.hidden) this.start();
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

    disturb(strength = 7) {
      if (!this.points.length || this.progress <= 0) return;
      const center = 4 + Math.floor(Math.random() * Math.max(1, this.points.length - 8));
      const direction = Math.random() > 0.5 ? 1 : -1;
      this.points[center].velocity += strength * direction;
      if (this.points[center - 1]) this.points[center - 1].velocity += strength * 0.45 * direction;
      if (this.points[center + 1]) this.points[center + 1].velocity += strength * 0.55 * direction;
    }

    update(dt) {
      const tension = 28;
      const damping = 4.4;
      const spread = 18;
      const maxOffset = Math.max(3, Math.min(11, (this.height - this.baseY) * 0.36));

      for (const point of this.points) {
        const displacement = point.y - this.baseY;
        point.velocity += (-tension * displacement - damping * point.velocity) * dt;
      }

      const leftDeltas = new Array(this.points.length).fill(0);
      const rightDeltas = new Array(this.points.length).fill(0);

      for (let pass = 0; pass < 4; pass += 1) {
        for (let i = 0; i < this.points.length; i += 1) {
          if (i > 0) {
            leftDeltas[i] = spread * (this.points[i].y - this.points[i - 1].y) * dt;
            this.points[i - 1].velocity += leftDeltas[i];
          }
          if (i < this.points.length - 1) {
            rightDeltas[i] = spread * (this.points[i].y - this.points[i + 1].y) * dt;
            this.points[i + 1].velocity += rightDeltas[i];
          }
        }
      }

      for (const point of this.points) {
        point.y += point.velocity * dt;
        point.y = Math.max(this.baseY - maxOffset, Math.min(this.baseY + maxOffset, point.y));
      }

      this.impulseTimer -= dt;
      if (this.impulseTimer <= 0) {
        this.disturb(4.8 + Math.random() * 4.2);
        this.impulseTimer = 1.1 + Math.random() * 2.3;
      }

      for (let i = 0; i < this.particles.length; i += 1) {
        const particle = this.particles[i];
        particle.y -= particle.speed * dt;
        particle.x += Math.sin((particle.y + i * 11) * 0.045) * particle.drift * dt;
        if (particle.y < this.baseY + 4) {
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
        this.surfacePath(ctx);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();

        const fill = ctx.createLinearGradient(0, this.baseY - 12, 0, this.height);
        fill.addColorStop(0, "#087bf2");
        fill.addColorStop(0.28, "#005bd7");
        fill.addColorStop(0.68, "#003d9f");
        fill.addColorStop(1, "#00256a");
        ctx.fillStyle = fill;
        ctx.shadowColor = "rgba(0, 102, 255, .38)";
        ctx.shadowBlur = 22;
        ctx.fill();

        ctx.save();
        this.surfacePath(ctx);
        const surfaceGradient = ctx.createLinearGradient(0, this.baseY - 7, 0, this.baseY + 8);
        surfaceGradient.addColorStop(0, "rgba(164, 244, 255, .98)");
        surfaceGradient.addColorStop(0.35, "rgba(61, 211, 255, .96)");
        surfaceGradient.addColorStop(1, "rgba(5, 109, 239, .32)");
        ctx.strokeStyle = surfaceGradient;
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(87, 226, 255, .95)";
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();

        const current = ctx.createRadialGradient(
          this.width * 0.32, this.baseY + (this.height - this.baseY) * 0.52, 2,
          this.width * 0.44, this.baseY + (this.height - this.baseY) * 0.62, this.width * 0.72
        );
        current.addColorStop(0, "rgba(29, 150, 255, .25)");
        current.addColorStop(0.45, "rgba(0, 95, 230, .10)");
        current.addColorStop(1, "rgba(0, 20, 76, 0)");
        ctx.fillStyle = current;
        ctx.fillRect(0, this.baseY, this.width, this.height - this.baseY);

        for (const particle of this.particles) {
          if (particle.y < this.baseY || particle.y > this.height) continue;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(151, 225, 255, ${particle.alpha})`;
          ctx.shadowColor = "rgba(66, 185, 255, .65)";
          ctx.shadowBlur = 5;
          ctx.fill();
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
    }
  }

  function mount() {
    document.querySelectorAll(".experience-score-core").forEach((core) => {
      if (core[ENGINE_KEY]) return;
      core[ENGINE_KEY] = new SpringLiquid(core);
    });
  }

  function cleanupDetached() {
    document.querySelectorAll(".experience-score-core").forEach((core) => {
      const engine = core[ENGINE_KEY];
      if (engine && !document.body.contains(core)) {
        engine.destroy();
        delete core[ENGINE_KEY];
      }
    });
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pageshow", mount);
  document.addEventListener("vaultarr:navigation-complete", mount);

  const observer = new MutationObserver(() => {
    cleanupDetached();
    mount();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
