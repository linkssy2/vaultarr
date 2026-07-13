(() => {
  "use strict";

  if (window.VaultarrCuratorUI?.installed) return;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
  const activeRuns = new Map();

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
      if (!this.running) {
        this.running = true;
        this.lastFrame = performance.now();
        this.raf = requestAnimationFrame((time) => this.tick(time));
      }
    }

    setTarget(value, stage) {
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
        const response = 1 - Math.exp(-dt / 520);
        const easedStep = distance * response;
        const minimumStep = Math.min(Math.abs(distance), dt * 0.0025);
        const direction = Math.sign(distance);
        this.current += direction * Math.max(Math.abs(easedStep), minimumStep);
        if ((direction > 0 && this.current > this.target) || (direction < 0 && this.current < this.target)) this.current = this.target;
      } else {
        this.current = this.target;
      }
      this.render();
      this.resolveWaiters();
      this.raf = requestAnimationFrame((time) => this.tick(time));
    }

    render() {
      const visual = clamp(this.current);
      if (this.fill) {
        this.fill.style.setProperty("--curator-progress", `${visual}%`);
        this.fill.style.width = `${visual}%`;
      }
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
      this.raf = 0;
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

  function setWorking(row, button, working) {
    row.classList.toggle("is-curating", working);
    row.setAttribute("aria-busy", working ? "true" : "false");
    button.disabled = working;
    button.classList.toggle("is-working", working);
    button.textContent = working ? "Preparing" : "Prepare";
  }

  async function monitor(row, button, startNew = false) {
    if (!row || !button) return;
    const id = row.dataset.gameId;
    if (!id || activeRuns.has(id)) return activeRuns.get(id);

    const task = (async () => {
      const progress = new SmoothProgress(row);
      row.classList.remove("is-failed", "is-complete");
      setWorking(row, button, true);

      const initial = startNew ? 0 : clamp(row.dataset.jobProgress || row.querySelector("[data-curator-percent]")?.textContent);
      const initialStage = startNew ? "Starting preparation…" : (row.dataset.jobStage || "Preparing game…");
      progress.startAt(initial, initialStage);
      progress.setTarget(startNew ? 4 : Math.max(4, initial), initialStage);

      try {
        if (startNew) {
          const start = await fetch(`/api/curator/games/${id}/start`, {
            method: "POST",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          const started = await start.json();
          if (!start.ok || !started.success) throw new Error(started.message || "Could not start preparation.");
        }

        let finalJob = null;
        while (!finalJob) {
          const res = await fetch(`/api/curator/games/${id}/status`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          const job = await res.json();
          if (!res.ok || !job.success) throw new Error(job.message || "Could not read progress.");
          if (job.status === "failed") throw new Error(job.last_error || "Preparation failed.");
          if (job.status === "complete") {
            finalJob = job;
            break;
          }
          progress.setTarget(Math.min(94, clamp(job.progress)), job.stage || "Preparing game…");
          row.dataset.jobProgress = String(job.progress || 0);
          row.dataset.jobStage = job.stage || "";
          await sleep(250);
        }

        await progress.settle(100, "Finishing museum record…", 6000);
        await sleep(260);
        const score = clamp(finalJob.result?.score ?? finalJob.curator_score ?? 100);
        progress.stop();
        progress.startAt(progress.current, score >= 90 ? "Museum Ready" : "Needs Review");
        progress.target = score;
        await Promise.race([progress.waitUntil(score), sleep(1800)]);
        progress.current = score;
        progress.target = score;
        progress.render();
        progress.stop();

        row.classList.remove("is-curating", "is-failed");
        row.classList.add("is-complete");
        row.dataset.jobStatus = "complete";
        setWorking(row, button, false);
        toast(score >= 90 ? "Museum Ready" : "Preparation Finished", row.querySelector("strong")?.textContent || "Game preparation finished.");
      } catch (err) {
        progress.stop();
        row.classList.remove("is-curating");
        row.classList.add("is-failed");
        row.dataset.jobStatus = "failed";
        setWorking(row, button, false);
        button.textContent = "Retry";
        const status = row.querySelector("[data-curator-status]");
        if (status) status.textContent = err.message;
        toast("Needs Review", err.message, "warning");
      }
    })().finally(() => activeRuns.delete(id));

    activeRuns.set(id, task);
    return task;
  }

  function initialize(root = document) {
    root.querySelectorAll?.("[data-curator-row]").forEach((row) => {
      const status = row.dataset.jobStatus;
      if (status !== "queued" && status !== "running") return;
      const button = row.querySelector("[data-curator-run]");
      monitor(row, button, false);
    });
  }

  document.addEventListener("click", async (event) => {
    const runButton = event.target.closest("[data-curator-run]");
    if (runButton) {
      event.preventDefault();
      await monitor(runButton.closest("[data-curator-row]"), runButton, true);
      return;
    }

    const queueAll = event.target.closest("[data-curator-queue-all]");
    if (queueAll) {
      event.preventDefault();
      queueAll.disabled = true;
      queueAll.textContent = "Checking…";
      try {
        const res = await fetch("/api/curator/queue-all", { method: "POST", headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Could not check the museum.");
        toast("Museum Checked", `${data.queued} game${data.queued === 1 ? "" : "s"} ready to prepare.`);
      } catch (err) {
        toast("Check Failed", err.message, "warning");
      } finally {
        queueAll.disabled = false;
        queueAll.textContent = "Check Museum";
      }
      return;
    }

    const nextButton = event.target.closest("[data-curator-prepare-next]");
    if (nextButton) {
      event.preventDefault();
      const rows = Array.from(document.querySelectorAll("[data-curator-row]"))
        .filter((row) => !row.classList.contains("is-curating"))
        .slice(0, 5);
      nextButton.disabled = true;
      nextButton.textContent = "Preparing…";
      try {
        for (const row of rows) {
          const button = row.querySelector("[data-curator-run]");
          if (button) await monitor(row, button, true);
        }
      } finally {
        nextButton.disabled = false;
        nextButton.textContent = "Prepare Next 5";
      }
    }
  });

  document.addEventListener("vaultarr:page-loaded", (event) => initialize(event.detail?.main || document));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initialize(document), { once: true });
  else initialize(document);

  window.VaultarrCuratorUI = { installed: true, initialize, monitor };
})();
