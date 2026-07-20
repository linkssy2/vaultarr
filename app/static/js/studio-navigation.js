(() => {
  const VIEW_DEFINITIONS = {
    general: {
      eyebrow: "Everyday Setup",
      title: "General",
      description: "Choose how Vaultarr prepares and presents your museum.",
      panels: ["studioExperience"],
      anchor: "studioExperience",
    },
    library: {
      eyebrow: "Museum Collection",
      title: "Game Folders",
      description: "Connect, scan, and maintain the folders that feed your museum.",
      panels: ["studioArchiveTools"],
      anchor: "studioArchiveTools",
    },
    appearance: {
      eyebrow: "Museum Atmosphere",
      title: "Appearance",
      description: "Select a complete theme or tune the visual atmosphere yourself.",
      panels: ["studioArtwork", "studioCustomTheme", "studioCompatibility"],
      anchor: "studioArtwork",
    },
    access: {
      eyebrow: "Museum Access",
      title: "Login & Security",
      description: "Control who can enter Vaultarr without changing authentication behavior.",
      panels: ["studioSecurity"],
      anchor: "studioSecurity",
    },
    backup: {
      eyebrow: "Museum Preservation",
      title: "Backup & Restore",
      description: "Protect the catalog, artwork, manuals, and settings in one place.",
      panels: ["museum-backup"],
      anchor: "museum-backup",
    },
    sources: {
      eyebrow: "Advanced Workshop",
      title: "Sources & Cache",
      description: "Manage metadata providers, local indexes, manuals, and cached media.",
      panels: ["studioMetadata", "studioManualCatalog", "studioLaunchBox", "studioMediaCache"],
      anchor: "studioMetadata",
    },
    reset: {
      eyebrow: "Use With Care",
      title: "Reset Vaultarr",
      description: "Start fresh only when your museum truly needs it.",
      panels: ["studioDangerZone"],
      anchor: "studioDangerZone",
    },
  };

  const SAVED_VIEW = {
    experience: "general",
    theme: "appearance",
    darkreader: "appearance",
    providers: "sources",
    launchbox: "sources",
    launchbox_error: "sources",
    manual_catalog: "sources",
    manual_catalog_cleared: "sources",
    manual_catalog_error: "sources",
    security: "access",
    password_mismatch: "access",
    password_short: "access",
    password_required: "access",
    reset_error: "reset",
    reset_failed: "reset",
  };

  let activeView = "";
  let transitionTimer = null;

  function viewDirection(root, fromView, toView) {
    const views = Array.from(root.querySelectorAll("[data-settings-view]"));
    const fromIndex = views.findIndex((view) => view.dataset.settingsView === fromView);
    const toIndex = views.findIndex((view) => view.dataset.settingsView === toView);
    return fromIndex >= 0 && toIndex >= 0 && toIndex < fromIndex ? -1 : 1;
  }

  function animateHeading(root) {
    const heading = root.querySelector(".settings-workspace-heading");
    if (!heading) return;
    heading.classList.remove("is-switching");
    void heading.offsetWidth;
    heading.classList.add("is-switching");
  }

  function viewForPanelId(panelId) {
    return Object.keys(VIEW_DEFINITIONS).find((view) => VIEW_DEFINITIONS[view].panels.includes(panelId)) || "";
  }

  function availableView(root, requested) {
    if (requested && root.querySelector(`[data-settings-view="${requested}"]`)) return requested;
    return root.querySelector("[data-settings-view]")?.dataset.settingsView || "general";
  }

  function updateHeading(root, viewName) {
    const definition = VIEW_DEFINITIONS[viewName];
    const view = root.querySelector(`[data-settings-view="${viewName}"]`);
    if (!definition || !view) return;
    const count = view.querySelectorAll(":scope > [data-settings-section]").length;
    const eyebrow = root.querySelector("#settingsViewEyebrow");
    const title = root.querySelector("#settingsViewTitle");
    const description = root.querySelector("#settingsViewDescription");
    const counter = root.querySelector("#settingsViewCount");
    if (eyebrow) eyebrow.textContent = definition.eyebrow;
    if (title) title.textContent = definition.title;
    if (description) description.textContent = definition.description;
    if (counter) counter.textContent = `${count} ${count === 1 ? "panel" : "panels"}`;
  }

  function updateRail(root, viewName) {
    root.querySelectorAll(".settings-rail-link").forEach((link) => {
      const selected = link.dataset.settingsTarget === viewName;
      link.classList.toggle("is-active", selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function activateView(root, requested, options = {}) {
    const viewName = availableView(root, requested);
    const incoming = root.querySelector(`[data-settings-view="${viewName}"]`);
    if (!incoming) return;

    if (viewName === activeView && incoming.classList.contains("is-active")) {
      updateRail(root, viewName);
      return;
    }

    const stage = root.querySelector(".settings-view-stage");
    const firstActivation = !activeView;
    const direction = firstActivation ? 1 : viewDirection(root, activeView, viewName);
    root.style.setProperty("--settings-direction", direction);

    window.clearTimeout(transitionTimer);
    root.querySelectorAll("[data-settings-view]").forEach((view) => {
      if (view === incoming) return;
      if (!view.hidden) {
        view.classList.remove("is-active", "is-entering");
        view.classList.add("is-leaving");
      } else {
        view.classList.remove("is-active", "is-entering", "is-leaving");
      }
      view.setAttribute("aria-hidden", "true");
      view.setAttribute("inert", "");
    });

    incoming.hidden = false;
    incoming.removeAttribute("inert");
    incoming.setAttribute("aria-hidden", "false");
    incoming.classList.remove("is-leaving", "is-active");

    if (firstActivation) {
      incoming.classList.add("is-active");
    } else {
      const startHeight = stage?.getBoundingClientRect().height || 0;
      incoming.classList.add("is-entering");
      const endHeight = incoming.scrollHeight;
      if (stage && startHeight) {
        stage.style.height = `${startHeight}px`;
        stage.classList.add("is-resizing");
        void stage.offsetHeight;
      }
      requestAnimationFrame(() => {
        if (stage && startHeight) stage.style.height = `${endHeight}px`;
        requestAnimationFrame(() => incoming.classList.add("is-active"));
      });
    }

    transitionTimer = window.setTimeout(() => {
      root.querySelectorAll("[data-settings-view]").forEach((view) => {
        const selected = view === incoming;
        view.hidden = !selected;
        view.classList.toggle("is-active", selected);
        view.classList.remove("is-entering", "is-leaving");
      });
      if (stage) {
        stage.classList.remove("is-resizing");
        stage.style.removeProperty("height");
      }
      root.querySelector(".settings-workspace-heading")?.classList.remove("is-switching");
    }, firstActivation ? 0 : 780);

    activeView = viewName;
    updateHeading(root, viewName);
    if (!firstActivation) animateHeading(root);
    updateRail(root, viewName);

    if (options.updateHash !== false && history.replaceState) {
      const anchor = VIEW_DEFINITIONS[viewName].anchor;
      history.replaceState(null, document.title, `${location.pathname}${location.search}#${anchor}`);
    }

    if (options.scroll && window.matchMedia("(max-width: 860px)").matches) {
      root.querySelector(".settings-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initialView(root) {
    const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
    const hashView = viewForPanelId(hashId);
    if (hashView && root.querySelector(`[data-settings-view="${hashView}"]`)) return hashView;
    const saved = new URLSearchParams(location.search).get("saved") || "";
    return availableView(root, SAVED_VIEW[saved] || "general");
  }

  function buildViews(root) {
    if (root.dataset.settingsBound === "true") return;
    const stage = root.querySelector(".settings-view-stage");
    if (!stage) return;

    const fragment = document.createDocumentFragment();
    Object.entries(VIEW_DEFINITIONS).forEach(([viewName, definition]) => {
      const panels = definition.panels.map((id) => document.getElementById(id)).filter(Boolean);
      if (!panels.length) return;
      const view = document.createElement("div");
      view.className = `settings-view settings-view-${viewName}`;
      view.dataset.settingsView = viewName;
      view.hidden = true;
      view.setAttribute("aria-hidden", "true");
      view.setAttribute("inert", "");
      panels.forEach((panel) => {
        panel.classList.add("settings-room-panel");
        view.append(panel);
      });
      fragment.append(view);
    });
    stage.append(fragment);
    root.querySelectorAll(".studio-two-column").forEach((wrapper) => {
      if (!wrapper.querySelector("[data-settings-section]")) wrapper.remove();
    });
    root.dataset.settingsBound = "true";

    root.querySelectorAll(".settings-rail-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateView(root, link.dataset.settingsTarget, { scroll: true });
      });
    });

    activateView(root, initialView(root), { updateHash: false });
  }

  function bindSettingsConsole() {
    const root = document.querySelector(".settings-command-center");
    if (!root) return;
    buildViews(root);
  }

  document.addEventListener("click", (event) => {
    const root = document.querySelector(".settings-command-center");
    const link = event.target.closest('a[href^="#"]');
    if (!root || !link || link.classList.contains("settings-rail-link")) return;
    const panelId = decodeURIComponent(link.getAttribute("href").slice(1));
    const viewName = viewForPanelId(panelId);
    if (!viewName || !root.querySelector(`[data-settings-view="${viewName}"]`)) return;
    event.preventDefault();
    activateView(root, viewName, { scroll: true });
  }, true);

  window.addEventListener("hashchange", () => {
    const root = document.querySelector(".settings-command-center");
    if (!root) return;
    const viewName = viewForPanelId(decodeURIComponent(location.hash.replace(/^#/, "")));
    if (viewName && viewName !== activeView) activateView(root, viewName, { updateHash: false });
  });

  document.addEventListener("vaultarr:page-loaded", bindSettingsConsole);
  document.addEventListener("DOMContentLoaded", bindSettingsConsole);
})();
