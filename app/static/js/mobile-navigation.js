(() => {
  const mq = window.matchMedia("(max-width: 980px)");
  const narrowMq = window.matchMedia("(max-width: 640px)");
  const button = document.getElementById("mobileMenuButton");
  const sidebar = document.getElementById("vaultarrSidebar");
  const backdrop = document.getElementById("mobileNavBackdrop");
  const backButton = document.getElementById("mobileBackButton");
  const titleNode = document.getElementById("mobilePageTitle");
  const topbar = document.getElementById("mobileTopbar");
  if (!button || !sidebar || !backdrop) return;

  let lastFocused = null;
  const lockNames = new Set();

  const setViewportHeight = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--mobile-viewport-height", `${height}px`);
    document.documentElement.style.setProperty("--mobile-keyboard-offset", `${Math.max(0, window.innerHeight - height)}px`);
  };

  const setBodyLock = (name, locked) => {
    if (locked) lockNames.add(name); else lockNames.delete(name);
    document.body.classList.toggle("mobile-overlay-open", mq.matches && lockNames.size > 0);
  };
  window.VaultarrMobile = { mq, narrowMq, setBodyLock, setViewportHeight };

  const pageHeading = document.querySelector("main h1, main .page-header h1, main .hero-copy h1");
  if (titleNode && pageHeading) titleNode.textContent = pageHeading.textContent.trim();

  const setOpen = (open, { restoreFocus = true } = {}) => {
    if (!mq.matches) open = false;
    if (open) lastFocused = document.activeElement;
    sidebar.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    setBodyLock("navigation", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    sidebar.setAttribute("aria-hidden", String(mq.matches && !open));
    if (open) {
      requestAnimationFrame(() => sidebar.querySelector("a, button")?.focus({ preventScroll: true }));
    } else if (restoreFocus && lastFocused instanceof HTMLElement) {
      lastFocused.focus({ preventScroll: true });
    }
  };

  button.addEventListener("click", () => setOpen(!sidebar.classList.contains("is-open")));
  backdrop.addEventListener("click", () => setOpen(false));
  sidebar.addEventListener("click", event => {
    if (mq.matches && event.target.closest("a")) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && sidebar.classList.contains("is-open")) setOpen(false);
    if (event.key === "Tab" && sidebar.classList.contains("is-open")) {
      const focusables = [...sidebar.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const syncMode = () => {
    document.documentElement.classList.toggle("is-mobile-layout", mq.matches);
    document.documentElement.classList.toggle("is-narrow-mobile", narrowMq.matches);
    if (!mq.matches) {
      setOpen(false, { restoreFocus: false });
      sidebar.removeAttribute("aria-hidden");
    } else if (!sidebar.classList.contains("is-open")) sidebar.setAttribute("aria-hidden", "true");
    setViewportHeight();
  };

  const updateBackButton = () => {
    if (!backButton) return;
    const overlayOpen = document.body.classList.contains("focus-active") || document.body.classList.contains("global-search-open");
    backButton.hidden = !overlayOpen;
    topbar?.classList.toggle("has-back-action", overlayOpen);
  };

  backButton?.addEventListener("click", () => {
    if (document.body.classList.contains("focus-active")) document.getElementById("focusClose")?.click();
    else if (document.body.classList.contains("global-search-open")) document.getElementById("globalSearchClose")?.click();
    else history.back();
  });

  new MutationObserver(updateBackButton).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  mq.addEventListener("change", syncMode);
  narrowMq.addEventListener("change", syncMode);
  window.visualViewport?.addEventListener("resize", setViewportHeight);
  window.visualViewport?.addEventListener("scroll", setViewportHeight);
  window.addEventListener("orientationchange", () => setTimeout(setViewportHeight, 120));
  syncMode();
  updateBackButton();
})();
