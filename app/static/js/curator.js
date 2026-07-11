(() => {
  "use strict";

  const steps = [
    "Identifying game…",
    "Collecting metadata…",
    "Selecting artwork…",
    "Checking for a manual…",
    "Calculating museum readiness…"
  ];

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function runCurator(row, button) {
    if (!row || !button || row.classList.contains("is-curating")) return;

    const gameId = row.dataset.gameId;
    const status = row.querySelector("[data-curator-status]");
    const percent = row.querySelector("[data-curator-percent]");
    const meter = row.querySelector(".curator-meter");
    const fill = row.querySelector(".curator-meter-fill");
    const originalLabel = button.textContent;
    let stepIndex = 0;

    row.classList.remove("is-failed", "is-complete");
    row.classList.add("is-curating");
    row.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.classList.add("is-working");
    button.textContent = "Working";
    if (status) status.textContent = steps[0];
    if (percent) percent.textContent = "Working";
    if (meter) {
      meter.removeAttribute("aria-valuenow");
      meter.setAttribute("aria-valuetext", "Cataloging in progress");
    }

    const stepTimer = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      if (status) status.textContent = steps[stepIndex];
    }, 2300);

    try {
      const response = await fetch(`/api/curator/games/${encodeURIComponent(gameId)}/run`, {
        method: "POST",
        headers: { "Accept": "application/json" }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Cataloging failed (${response.status})`);
      }

      window.clearInterval(stepTimer);
      row.classList.remove("is-curating");
      row.classList.add("is-complete");
      row.setAttribute("aria-busy", "false");

      const score = Math.max(0, Math.min(100, Number(result.score) || 0));
      if (fill) fill.style.width = `${score}%`;
      if (percent) percent.textContent = `${score}%`;
      if (meter) {
        meter.setAttribute("aria-valuenow", String(score));
        meter.setAttribute("aria-valuetext", `Cataloging complete at ${score}%`);
      }
      if (status) {
        const finalStatus = String(result.status || "complete")
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
        status.textContent = `${finalStatus} · Cataloging complete`;
      }
      button.classList.remove("is-working");
      button.textContent = "Complete";

      await sleep(900);
      window.location.reload();
    } catch (error) {
      window.clearInterval(stepTimer);
      row.classList.remove("is-curating");
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
    const row = button.closest("[data-curator-row]");
    runCurator(row, button);
  });
})();
