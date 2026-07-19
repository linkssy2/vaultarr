(() => {
  const OFFSET = 18;
  let activeAnimation = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getScrollTargetTop(target) {
    const rect = target.getBoundingClientRect();
    return Math.max(0, window.scrollY + rect.top - OFFSET);
  }

  function smoothScrollTo(targetY, duration = 620) {
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      return;
    }

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        activeAnimation = requestAnimationFrame(frame);
      } else {
        activeAnimation = null;
      }
    }

    activeAnimation = requestAnimationFrame(frame);
  }

  function setSettingsSectionExpanded(section, expanded) {
    if (!section?.matches("[data-settings-section]")) return;
    const toggle = section.querySelector(":scope > .studio-section-head .settings-section-toggle");
    const body = section.querySelector(":scope > .settings-section-body");
    section.classList.toggle("is-settings-collapsed", !expanded);
    toggle?.setAttribute("aria-expanded", String(expanded));
    body?.setAttribute("aria-hidden", String(!expanded));
    if (expanded) body?.removeAttribute("inert");
    else body?.setAttribute("inert", "");
    const label = expanded ? "Hide" : "Show";
    if (toggle) toggle.querySelector("span").textContent = label;
  }

  function collapseSettingsPeers(section) {
    const group = section?.dataset.settingsGroup;
    if (!group) return;
    document.querySelectorAll(`[data-settings-section][data-settings-group="${group}"]`).forEach((peer) => {
      if (peer !== section) setSettingsSectionExpanded(peer, false);
    });
  }

  function markSettingsRoute(section) {
    const directId = section?.id || "";
    const groupRoutes = {
      appearance: "studioArtwork",
      protection: "museum-backup",
      sources: "studioMetadata",
      system: "studioDangerZone",
    };
    const routeId = groupRoutes[section?.dataset.settingsGroup] || directId;
    document.querySelectorAll(".settings-task-card").forEach((card) => {
      const isActive = card.getAttribute("href") === `#${routeId}`;
      card.classList.toggle("is-active", isActive);
      if (isActive) card.setAttribute("aria-current", "location");
      else card.removeAttribute("aria-current");
    });
  }

  function enhanceSettingsSections() {
    document.querySelectorAll("[data-settings-section]").forEach((section, sectionIndex) => {
      if (section.dataset.settingsBound === "true") return;
      const head = section.querySelector(":scope > .studio-section-head");
      if (!head) return;
      section.dataset.settingsBound = "true";
      if (!section.id) section.id = `settingsSection${sectionIndex + 1}`;

      const body = document.createElement("div");
      body.className = "settings-section-body";
      body.id = `${section.id}Body`;
      const content = document.createElement("div");
      content.className = "settings-section-content";
      Array.from(section.children).filter((child) => child !== head).forEach((child) => content.append(child));
      body.append(content);
      section.append(body);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "settings-section-toggle";
      toggle.setAttribute("aria-controls", body.id);
      toggle.innerHTML = '<span>Show</span><i aria-hidden="true"></i>';
      toggle.addEventListener("click", () => {
        const expanding = section.classList.contains("is-settings-collapsed");
        if (expanding) collapseSettingsPeers(section);
        setSettingsSectionExpanded(section, expanding);
        if (expanding) markSettingsRoute(section);
      });
      head.append(toggle);
      setSettingsSectionExpanded(section, section.dataset.settingsOpen === "true");
    });
  }

  function scrollToStudioSection(hash, updateHash = true) {
    if (!hash || !hash.startsWith("#")) return false;
    const target = document.querySelector(hash);
    if (!target) return false;

    collapseSettingsPeers(target);
    setSettingsSectionExpanded(target, true);
    markSettingsRoute(target);

    smoothScrollTo(getScrollTargetTop(target));
    target.classList.add("studio-section-targeted");
    window.setTimeout(() => target.classList.remove("studio-section-targeted"), 1000);

    if (updateHash && history.replaceState) {
      history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}${hash}`);
    }
    return true;
  }

  function bindStudioNavigation() {
    enhanceSettingsSections();
    const initiallyOpen = document.querySelector("[data-settings-section]:not(.is-settings-collapsed)");
    if (initiallyOpen) markSettingsRoute(initiallyOpen);
    document.querySelectorAll('a[href^="#studio"]:not(.settings-jump)').forEach((link) => {
      if (link.dataset.studioSmoothBound === "true") return;
      link.dataset.studioSmoothBound = "true";
      link.addEventListener("click", (event) => {
        if (!window.location.pathname.includes("settings")) return;
        event.preventDefault();
        event.stopPropagation();
        scrollToStudioSection(link.getAttribute("href"), true);
      });
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#studio"], .settings-jump');
    if (!link) return;
    if (!window.location.pathname.includes("settings")) return;
    event.preventDefault();
    event.stopPropagation();
    scrollToStudioSection(link.getAttribute("href"), true);
  }, true);

  document.addEventListener("vaultarr:page-loaded", () => {
    bindStudioNavigation();
    if (window.location.hash && window.location.hash.startsWith("#studio")) {
      window.setTimeout(() => scrollToStudioSection(window.location.hash, false), 120);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    bindStudioNavigation();
    if (window.location.hash && window.location.hash.startsWith("#studio")) {
      window.setTimeout(() => scrollToStudioSection(window.location.hash, false), 120);
    }
  });
})();
