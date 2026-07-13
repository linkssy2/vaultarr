(() => {
  "use strict";

  if (window.VaultarrActivityUI?.installed) {
    window.VaultarrActivityUI.initialize(document);
    return;
  }

  const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const controllers = new Map();

  const friendlyStage = (stage, status) => {
    const text = String(stage || "").trim();
    if (status === "complete") return "Museum Ready";
    if (status === "failed") return text || "Needs Review";
    const map = {
      Starting: "Starting preparation…",
      "Identifying game": "Identifying game…",
      "Researching game information": "Researching game information…",
      "Building museum record": "Building museum record…",
      "Looking for a manual": "Looking for a manual…",
      "Calculating readiness": "Checking collection completeness…",
      "Museum Ready": "Museum Ready",
    };
    return map[text] || text || "Preparing game…";
  };

  const stageCeiling = (stage, serverProgress) => {
    const text = String(stage || "");
    if (/Starting/i.test(text)) return Math.max(8, serverProgress);
    if (/Identifying/i.test(text)) return Math.max(22, serverProgress);
    if (/Researching/i.test(text)) return Math.max(48, serverProgress);
    if (/Building/i.test(text)) return Math.max(68, serverProgress);
    if (/manual/i.test(text)) return Math.max(86, serverProgress);
    if (/readiness|completeness/i.test(text)) return Math.max(96, serverProgress);
    return Math.min(96, Math.max(serverProgress + 8, 12));
  };

  function toast(title, message, tone = "success") {
    const el = document.createElement("div");
    el.className = `curator-toast ${tone}`;
    el.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 260);
    }, 3600);
  }

  class ActivityController {
    constructor(id) {
      this.id = String(id);
      this.row = null;
      this.button = null;
      this.current = 0;
      this.serverProgress = 0;
      this.target = 0;
      this.ceiling = 8;
      this.stage = "Preparing game…";
      this.status = "queued";
      this.running = false;
      this.polling = false;
      this.finished = false;
      this.lastFrame = performance.now();
      this.lastServerUpdate = performance.now();
      this.raf = 0;
      this.pollTimer = 0;
    }

    attach(row) {
      if (!row) return;
      this.row = row;
      this.button = row.querySelector("[data-curator-run]");
      const domProgress = clamp(row.dataset.jobProgress || row.querySelector("[data-curator-percent]")?.textContent);
      if (!this.running) {
        this.current = domProgress;
        this.serverProgress = domProgress;
        this.target = domProgress;
      }
      this.render();
    }

    setWorking(working) {
      if (!this.row) return;
      this.row.classList.toggle("is-curating", working);
      this.row.setAttribute("aria-busy", working ? "true" : "false");
      if (this.button) {
        this.button.disabled = working;
        this.button.classList.toggle("is-working", working);
        this.button.textContent = working ? "Preparing" : "Prepare";
      }
    }

    render() {
      if (!this.row) return;
      const fill = this.row.querySelector(".curator-meter-fill");
      const percent = this.row.querySelector("[data-curator-percent]");
      const status = this.row.querySelector("[data-curator-status]");
      const meter = this.row.querySelector(".curator-meter");
      const value = clamp(this.current);
      if (fill) fill.style.width = `${value}%`;
      if (percent) percent.textContent = `${Math.round(value)}%`;
      if (status) status.textContent = friendlyStage(this.stage, this.status);
      if (meter) meter.setAttribute("aria-valuenow", String(Math.round(value)));
      this.row.dataset.jobProgress = String(Math.round(value));
      this.row.dataset.jobStage = this.stage;
      this.row.dataset.jobStatus = this.status;
    }

    beginAnimation() {
      if (this.running) return;
      this.running = true;
      this.lastFrame = performance.now();
      const frame = (now) => {
        if (!this.running) return;
        const dt = Math.min(80, Math.max(0, now - this.lastFrame));
        this.lastFrame = now;

        if (!this.finished && this.status !== "failed") {
          const idleSeconds = Math.max(0, (now - this.lastServerUpdate) / 1000);
          const optimistic = Math.min(this.ceiling, this.serverProgress + 1.5 + idleSeconds * 1.15);
          this.target = Math.max(this.target, optimistic);
        }

        const distance = this.target - this.current;
        if (Math.abs(distance) > 0.02) {
          const response = 1 - Math.exp(-dt / 480);
          const minStep = dt * 0.0018;
          this.current += Math.sign(distance) * Math.min(Math.abs(distance), Math.max(Math.abs(distance) * response, minStep));
        } else {
          this.current = this.target;
        }
        this.render();
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }

    async startNew() {
      this.finished = false;
      this.status = "queued";
      this.stage = "Starting";
      this.current = 0;
      this.serverProgress = 0;
      this.target = 4;
      this.ceiling = 8;
      this.lastServerUpdate = performance.now();
      this.setWorking(true);
      this.beginAnimation();

      const response = await fetch(`/api/curator/games/${this.id}/start?_=${Date.now()}`, {
        method: "POST",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Could not start preparation.");
      this.schedulePoll(0);
    }

    schedulePoll(delay = 350) {
      clearTimeout(this.pollTimer);
      if (this.finished || this.polling) return;
      this.pollTimer = window.setTimeout(() => this.poll(), delay);
    }

    async poll() {
      if (this.polling || this.finished) return;
      this.polling = true;
      try {
        const response = await fetch(`/api/curator/games/${this.id}/status?_=${Date.now()}`, {
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
        });
        const job = await response.json();
        if (!response.ok || !job.success) throw new Error(job.message || "Could not read preparation progress.");

        this.status = job.status || "running";
        this.stage = job.stage || this.stage;
        this.serverProgress = clamp(job.progress);
        this.lastServerUpdate = performance.now();
        this.ceiling = stageCeiling(this.stage, this.serverProgress);
        this.target = Math.max(this.target, Math.min(98, this.serverProgress));
        this.setWorking(this.status === "queued" || this.status === "running");
        this.beginAnimation();

        if (this.status === "failed") throw new Error(job.last_error || "Preparation needs review.");
        if (this.status === "complete") {
          const score = clamp(job.result?.score ?? job.curator_score ?? 100);
          this.finished = true;
          this.stage = score >= 90 ? "Museum Ready" : "Needs Review";
          this.target = 100;
          await this.waitFor(99.5, 4200);
          this.current = 100;
          this.render();
          await sleep(220);
          this.target = score;
          await this.waitFor(score, 1600);
          this.current = score;
          this.status = "complete";
          this.render();
          this.setWorking(false);
          this.row?.classList.remove("is-curating", "is-failed");
          this.row?.classList.add("is-complete");
          toast(score >= 90 ? "Museum Ready" : "Preparation Finished", this.row?.querySelector("strong")?.textContent || "Preparation complete.");
          return;
        }
      } catch (error) {
        this.finished = true;
        this.status = "failed";
        this.stage = error.message;
        this.setWorking(false);
        if (this.button) this.button.textContent = "Retry";
        this.row?.classList.remove("is-curating");
        this.row?.classList.add("is-failed");
        this.render();
        toast("Needs Review", error.message, "warning");
        return;
      } finally {
        this.polling = false;
      }
      this.schedulePoll(document.hidden ? 1600 : 350);
    }

    waitFor(value, timeout) {
      const wanted = clamp(value);
      return new Promise((resolve) => {
        const started = performance.now();
        const check = () => {
          if (Math.abs(this.current - wanted) < 0.6 || performance.now() - started > timeout) return resolve();
          requestAnimationFrame(check);
        };
        check();
      });
    }

    resume() {
      this.finished = false;
      this.setWorking(true);
      this.beginAnimation();
      this.schedulePoll(0);
    }
  }

  function controllerFor(row) {
    const id = row?.dataset.gameId;
    if (!id) return null;
    let controller = controllers.get(String(id));
    if (!controller) {
      controller = new ActivityController(id);
      controllers.set(String(id), controller);
    }
    controller.attach(row);
    return controller;
  }

  function initialize(root = document) {
    root.querySelectorAll?.("[data-curator-row]").forEach((row) => {
      const controller = controllerFor(row);
      const status = row.dataset.jobStatus;
      if (controller && (status === "queued" || status === "running")) controller.resume();
    });
  }

  document.addEventListener("click", async (event) => {
    const runButton = event.target.closest("[data-curator-run]");
    if (runButton) {
      event.preventDefault();
      const controller = controllerFor(runButton.closest("[data-curator-row]"));
      if (!controller) return;
      try { await controller.startNew(); }
      catch (error) {
        controller.finished = true;
        controller.status = "failed";
        controller.stage = error.message;
        controller.setWorking(false);
        controller.row?.classList.add("is-failed");
        controller.render();
        toast("Could Not Prepare", error.message, "warning");
      }
      return;
    }

    const queueAll = event.target.closest("[data-curator-queue-all]");
    if (queueAll) {
      event.preventDefault();
      queueAll.disabled = true;
      queueAll.textContent = "Checking…";
      try {
        const response = await fetch(`/api/curator/queue-all?_=${Date.now()}`, { method: "POST", headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not check the museum.");
        toast("Museum Checked", `${data.queued} game${data.queued === 1 ? "" : "s"} ready to prepare.`);
        const statusResponse = await fetch(`/api/curator/status?_=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (statusResponse.ok) initialize(document);
      } catch (error) { toast("Check Failed", error.message, "warning"); }
      finally { queueAll.disabled = false; queueAll.textContent = "Check Museum"; }
      return;
    }

    const nextButton = event.target.closest("[data-curator-prepare-next]");
    if (nextButton) {
      event.preventDefault();
      const rows = Array.from(document.querySelectorAll("[data-curator-row]"))
        .filter((row) => !["queued", "running"].includes(row.dataset.jobStatus))
        .slice(0, 5);
      nextButton.disabled = true;
      nextButton.textContent = "Preparing…";
      await Promise.allSettled(rows.map(async (row) => controllerFor(row)?.startNew()));
      nextButton.disabled = false;
      nextButton.textContent = "Prepare Next 5";
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) controllers.forEach((controller) => {
      if (!controller.finished && ["queued", "running"].includes(controller.status)) controller.schedulePoll(0);
    });
  });
  document.addEventListener("vaultarr:page-loaded", (event) => initialize(event.detail?.main || document));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initialize(document), { once: true });
  else initialize(document);

  window.VaultarrActivityUI = { installed: true, initialize, controllers };
})();
