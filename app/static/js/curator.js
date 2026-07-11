(() => {
  "use strict";

  const stages = [
    { label: "Researching game…", target: 16 },
    { label: "Building game information…", target: 38 },
    { label: "Choosing artwork…", target: 58 },
    { label: "Looking for a manual…", target: 76 },
    { label: "Finishing museum record…", target: 91 }
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function setProgress(meter, fill, percent, value, label) {
    const safeValue = clamp(Math.round(Number(value) || 0), 0, 100);
    if (fill) fill.style.width = `${safeValue}%`;
    if (percent) percent.textContent = `${safeValue}%`;
    if (meter) {
      meter.setAttribute("aria-valuenow", String(safeValue));
      meter.setAttribute("aria-valuetext", label || `${safeValue}% complete`);
    }
  }

  function nextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  }

  async function animateToward(state, target, duration = 1600) {
    const start = state.value;
    const end = clamp(target, start, 96);
    if (end <= start) return;

    const started = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const elapsed = now - started;
        const raw = clamp(elapsed / duration, 0, 1);
        const eased = 1 - Math.pow(1 - raw, 3);
        state.value = start + (end - start) * eased;
        setProgress(state.meter, state.fill, state.percent, state.value, state.status?.textContent || "Cataloging in progress");
        if (raw < 1 && !state.cancelled) {
          state.raf = window.requestAnimationFrame(tick);
        } else {
          state.value = end;
          setProgress(state.meter, state.fill, state.percent, state.value, state.status?.textContent || "Cataloging in progress");
          resolve();
        }
      };
      state.raf = window.requestAnimationFrame(tick);
    });
  }

  async function runStagedProgress(state) {
    for (const stage of stages) {
      if (state.cancelled) return;
      if (state.status) state.status.textContent = stage.label;
      await animateToward(state, stage.target, 1550);
      if (!state.cancelled) await sleep(180);
    }
  }

  async function finishProgress(state, finalScore) {
    state.cancelled = true;
    if (state.raf) window.cancelAnimationFrame(state.raf);

    const current = state.value;
    const target = clamp(Number(finalScore) || 0, 0, 100);
    const visualTarget = target >= current ? target : current;
    state.cancelled = false;
    await animateToward(state, visualTarget, 700);
    state.cancelled = true;

    // The real score is authoritative, even if it is lower than the staged estimate.
    if (target !== visualTarget) {
      await sleep(180);
      setProgress(state.meter, state.fill, state.percent, target, `Cataloging complete at ${target}%`);
    }
  }

  async function runCurator(row, button) {
    if (!row || !button || row.classList.contains("is-curating")) return;

    const gameId = row.dataset.gameId;
    const status = row.querySelector("[data-curator-status]");
    const percent = row.querySelector("[data-curator-percent]");
    const meter = row.querySelector(".curator-meter");
    const fill = row.querySelector(".curator-meter-fill");
    const originalLabel = button.textContent;

    const state = { value: 0, status, percent, meter, fill, cancelled: false, raf: 0 };

    row.classList.remove("is-failed", "is-complete");
    row.classList.add("is-curating");
    row.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.classList.add("is-working");
    button.textContent = "Preparing";
    if (status) status.textContent = stages[0].label;

    // Reset first so even a previously-complete game visibly begins a fresh pass.
    setProgress(meter, fill, percent, 0, "Cataloging started");
    await nextFrame();
    row.classList.add("has-started-progress");

    const progressTask = runStagedProgress(state);

    try {
      const response = await fetch(`/api/curator/games/${encodeURIComponent(gameId)}/run`, {
        method: "POST",
        headers: { "Accept": "application/json" }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Cataloging failed (${response.status})`);
      }

      await finishProgress(state, result.score);

      row.classList.remove("is-curating", "has-started-progress");
      row.classList.add("is-complete");
      row.setAttribute("aria-busy", "false");

      const score = clamp(Number(result.score) || 0, 0, 100);
      setProgress(meter, fill, percent, score, `Cataloging complete at ${score}%`);
      if (status) {
        const finalStatus = String(result.status || "complete")
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
        status.textContent = `${finalStatus} · Cataloging complete`;
      }
      button.classList.remove("is-working");
      button.textContent = "Ready";

      await sleep(1000);
      window.location.reload();
    } catch (error) {
      state.cancelled = true;
      if (state.raf) window.cancelAnimationFrame(state.raf);
      row.classList.remove("is-curating", "has-started-progress");
      row.classList.add("is-failed");
      row.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.classList.remove("is-working");
      button.textContent = "Retry";
      if (status) status.textContent = error?.message || "Cataloging failed. Try again.";
      if (percent) percent.textContent = "Error";
      if (meter) meter.setAttribute("aria-valuetext", "Cataloging failed");

      window.setTimeout(() => {
        if (!row.classList.contains("is-curating")) button.textContent = originalLabel;
      }, 5000);
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-curator-run]");
    if (!button) return;
    event.preventDefault();
    const row = button.closest("[data-curator-row]");
    runCurator(row, button);
  });

  async function autoPrepareQueuedGames() {
    const shell = document.querySelector("[data-auto-curate='1']");
    if (!shell) return;
    const rows = [...document.querySelectorAll("[data-curator-row]")].filter((row) => {
      const text = row.querySelector("[data-curator-status]")?.textContent?.toLowerCase() || "";
      return text.includes("queued") || text.includes("waiting") || text.includes("cataloging");
    });
    for (const row of rows.slice(0, 5)) {
      const button = row.querySelector("[data-curator-run]");
      if (button && !button.disabled) {
        await runCurator(row, button);
        break;
      }
    }
  }

  window.addEventListener("load", () => {
    window.setTimeout(autoPrepareQueuedGames, 450);
  });

})();
