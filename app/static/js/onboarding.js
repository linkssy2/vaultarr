(() => {
  const root = document.querySelector("[data-onboarding]");
  if (!root) return;

  const stage = root.querySelector("[data-onboarding-stage]");
  const panels = [...root.querySelectorAll("[data-onboarding-panel]")];
  const progressButtons = [...root.querySelectorAll("[data-onboarding-step]")];
  const order = ["welcome", "library", "ready"];
  const hasLibrary = root.dataset.hasLibrary === "true";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeStep = root.dataset.initialStep || "welcome";

  function sizeStage(panel) {
    if (!stage || !panel) return;
    stage.style.height = `${panel.scrollHeight}px`;
  }

  function showStep(step, moveFocus = false) {
    if (!order.includes(step)) return;
    if (step === "ready" && !hasLibrary) step = "library";
    activeStep = step;
    root.dataset.activeStep = step;
    const activeIndex = order.indexOf(step);

    panels.forEach((panel) => {
      const isActive = panel.dataset.onboardingPanel === step;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      if (isActive) {
        sizeStage(panel);
        if (moveFocus) {
          root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          panel.querySelector("h1")?.focus({ preventScroll: true });
        }
      }
    });

    progressButtons.forEach((button) => {
      const index = order.indexOf(button.dataset.onboardingStep);
      button.classList.toggle("is-active", index === activeIndex);
      button.classList.toggle("is-complete", index < activeIndex);
      button.setAttribute("aria-current", index === activeIndex ? "step" : "false");
    });
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-onboarding-next], [data-onboarding-step]");
    if (!target) return;
    const next = target.dataset.onboardingNext || target.dataset.onboardingStep;
    showStep(next, true);
  });

  const resizeObserver = new ResizeObserver(() => {
    const panel = panels.find((item) => item.dataset.onboardingPanel === activeStep);
    sizeStage(panel);
  });
  panels.forEach((panel) => resizeObserver.observe(panel));
  window.addEventListener("resize", () => {
    const panel = panels.find((item) => item.dataset.onboardingPanel === activeStep);
    sizeStage(panel);
  }, { passive: true });

  showStep(activeStep);
})();
