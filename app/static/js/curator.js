(() => {
  "use strict";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

  class SmoothProgress {
    constructor(row) {
      this.row = row;
      this.fill = row.querySelector(".curator-meter-fill");
      this.percent = row.querySelector("[data-curator-percent]");
      this.status = row.querySelector("[data-curator-status]");
      this.meter = row.querySelector(".curator-meter");
      this.current = clamp(parseFloat(this.meter?.getAttribute("aria-valuenow") || "0"));
      this.target = this.current;
      this.stage = "";
      this.running = false;
      this.lastFrame = 0;
      this.raf = 0;
      this.waiters = [];
    }

    startAt(value = 0, stage = "Starting…") {
      this.current = clamp(value);
      this.target = this.current;
      this.setStage(stage);
      this.render();
      this.running = true;
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame((time) => this.tick(time));
    }

    setTarget(value, stage) {
      // Progress should never snap backward while a job is running.
      this.target = Math.max(this.target, clamp(value));
      if (stage) this.setStage(stage);
    }

    setStage(stage) {
      this.stage = stage || this.stage;
      if (this.status && this.stage) this.status.textContent = this.stage;
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min(100, Math.max(0, now - this.lastFrame));
      this.lastFrame = now;

      const distance = this.target - this.current;
      if (Math.abs(distance) > 0.015) {
        // Time-based exponential easing prevents polling jumps from being visible.
        const response = 1 - Math.exp(-dt / 520);
        const easedStep = distance * response;
        const minimumStep = Math.min(Math.abs(distance), dt * 0.0025);
        const direction = Math.sign(distance);
        this.current += direction * Math.max(Math.abs(easedStep), minimumStep);
        if ((direction > 0 && this.current > this.target) || (direction < 0 && this.current < this.target)) {
          this.current = this.target;
        }
      } else {
        this.current = this.target;
      }

      this.render();
      this.resolveWaiters();
      this.raf = requestAnimationFrame((time) => this.tick(time));
    }

    render() {
      const visual = clamp(this.current);
      if (this.fill) this.fill.style.setProperty("--curator-progress", `${visual}%`);
      if (this.percent) this.percent.textContent = `${Math.round(visual)}%`;
      if (this.meter) this.meter.setAttribute("aria-valuenow", String(Math.round(visual)));
    }

    waitUntil(value, tolerance = 0.45) {
      const wanted = clamp(value);
      if (this.current >= wanted - tolerance) return Promise.resolve();
      return new Promise((resolve) => this.waiters.push({ wanted, tolerance, resolve }));
    }

    resolveWaiters() {
      const pending = [];
      for (const waiter of this.waiters) {
        if (this.current >= waiter.wanted - waiter.tolerance) waiter.resolve();
        else pending.push(waiter);
      }
      this.waiters = pending;
    }

    async settle(value, stage, timeout = 5000) {
      this.setTarget(value, stage);
      await Promise.race([this.waitUntil(value), sleep(timeout)]);
      this.current = clamp(value);
      this.target = this.current;
      this.render();
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.resolveWaiters();
    }
  }

  function toast(title, message, tone = "success") {
    const el = document.createElement("div");
    el.className = `curator-toast ${tone}`;
    el.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, 3500);
  }

  async function run(row, button) {
    if (!row || button.disabled) return;

    const id = row.dataset.gameId;
    const progress = new SmoothProgress(row);
    row.classList.remove("is-failed", "is-complete");
    row.classList.add("is-curating");
    row.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.classList.add("is-working");
    button.textContent = "Preparing";

    // Immediate visual acknowledgement before the network request begins.
    progress.startAt(0, "Starting curator…");
    progress.setTarget(4, "Starting curator…");

    try {
      const start = await fetch(`/api/curator/games/${id}/start`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const started = await start.json();
      if (!start.ok || !started.success) {
        throw new Error(started.message || "Could not start cataloging.");
      }

      let finalJob = null;
      while (!finalJob) {
        const res = await fetch(`/api/curator/games/${id}/status`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const job = await res.json();
        if (!res.ok || !job.success) {
          throw new Error(job.message || "Could not read progress.");
        }

        if (job.status === "failed") {
          throw new Error(job.last_error || "Cataloging failed.");
        }

        if (job.status === "complete") {
          finalJob = job;
          break;
        }

        // Hold a small amount of room for a graceful final completion pass.
        progress.setTarget(Math.min(94, clamp(job.progress)), job.stage || "Preparing game…");
        await sleep(300);
      }

      // Always finish the work animation smoothly, even when the server finishes quickly.
      await progress.settle(100, "Finishing museum record…", 6000);
      await sleep(320);

      const score = clamp(finalJob.result?.score ?? finalJob.curator_score ?? 100);
      progress.stop();

      // Transition from job progress to the authoritative readiness score without a snap.
      progress.running = true;
      progress.lastFrame = performance.now();
      progress.raf = requestAnimationFrame((time) => progress.tick(time));
      progress.target = score;
      progress.setStage(score >= 90 ? "Museum Ready" : "Needs Review");
      await Promise.race([
        new Promise((resolve) => {
          const check = () => {
            if (Math.abs(progress.current - score) < 0.5) resolve();
            else requestAnimationFrame(check);
          };
          check();
        }),
        sleep(1800),
      ]);
      progress.current = score;
      progress.target = score;
      progress.render();
      progress.stop();

      row.classList.remove("is-curating");
      row.classList.add("is-complete");
      button.disabled = false;
      button.classList.remove("is-working");
      button.textContent = "Curate";
      row.setAttribute("aria-busy", "false");
      toast(score >= 90 ? "Museum Ready" : "Cataloging Finished", row.querySelector("strong")?.textContent || "Game cataloging finished.");
    } catch (err) {
      progress.stop();
      row.classList.remove("is-curating");
      row.classList.add("is-failed");
      row.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.classList.remove("is-working");
      button.textContent = "Retry";
      const status = row.querySelector("[data-curator-status]");
      if (status) status.textContent = err.message;
      toast("Needs Review", err.message, "warning");
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-curator-run]");
    if (!button) return;
    event.preventDefault();
    run(button.closest("[data-curator-row]"), button);
  });
})();
