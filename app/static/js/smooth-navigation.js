(() => {
  const FALLBACK_OUT_MS = 220;
  const FALLBACK_IN_MS = 380;
  const SIDEBAR_OUT_MS = 170;
  const SIDEBAR_IN_MS = 280;
  const PREFETCH_DELAY_MS = 90;
  const CACHE_TTL_MS = 45000;
  const REQUEST_TIMEOUT_MS = 12000;
  const LOADING_INDICATOR_DELAY_MS = 160;
  const pageCache = new Map();
  const inFlightPages = new Map();
  let activeController = null;
  let activeTarget = "";
  let navigationId = 0;
  let prefetchTimer = null;
  let loadingIndicatorTimer = null;

  function isHttpUrl(value) {
    return /^https?:$/i.test(value.protocol);
  }

  function isInternalLink(link) {
    if (!link || !link.href) return false;
    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (_) {
      return false;
    }
    return isHttpUrl(url) && url.origin === window.location.origin;
  }

  function isExcludedPath(url) {
    return (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/static/") ||
      url.pathname.startsWith("/covers/") ||
      url.pathname.startsWith("/media/") ||
      url.pathname.startsWith("/files/") ||
      url.pathname === "/logout"
    );
  }

  function shouldHandleClick(event, link) {
    if (!link || event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!isInternalLink(link)) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-smooth-nav")) return false;

    const url = new URL(link.href, window.location.href);
    if (isExcludedPath(url)) return false;
    if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return false;
    return true;
  }

  function shouldPrefetch(link) {
    if (!isInternalLink(link)) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-smooth-nav")) return false;
    const url = new URL(link.href, window.location.href);
    if (isExcludedPath(url) || url.hash) return false;
    return url.href !== window.location.href;
  }

  function updateActiveNav(url) {
    const path = new URL(url, window.location.href).pathname.replace(/\/$/, "") || "/";
    const routeGroup = (value) => {
      if (value === "/" || value === "/home") return "home";
      if (value === "/museum" || value === "/library" || value.startsWith("/museum/") || value.startsWith("/library/")) return "museum";
      if (value === "/discovery" || value.startsWith("/discovery/")) return "discovery";
      if (value === "/archive" || value.startsWith("/archive/")) return "archive";
      if (value === "/experience" || value.startsWith("/experience/")) return "experience";
      if (value === "/settings" || value.startsWith("/settings/")) return "settings";
      if (value === "/collections" || value.startsWith("/collections/")) return "collections";
      return value;
    };
    const currentGroup = routeGroup(path);
    document.querySelectorAll(".vault-nav a").forEach((link) => {
      const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/$/, "") || "/";
      const active = routeGroup(linkPath) === currentGroup;
      link.classList.toggle("is-active", active);
      link.classList.remove("active");
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function closeFocusIfOpen() {
    if (!document.body.classList.contains("focus-active")) return;
    const close = document.getElementById("focusClose");
    if (close) close.click();
  }

  function extractPage(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nextContent = doc.querySelector(".vaultos-content, .content");
    if (!nextContent) throw new Error("New page did not contain a Vaultarr content area.");

    const scripts = Array.from(nextContent.querySelectorAll("script")).map((script) => ({
      src: script.getAttribute("src") || "",
      type: script.getAttribute("type") || "",
      text: script.textContent || "",
    }));
    nextContent.querySelectorAll("script").forEach((script) => script.remove());

    return {
      html: nextContent.innerHTML,
      title: doc.title || "Vaultarr",
      scripts,
    };
  }

  function awaitWithSignal(promise, signal) {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(new DOMException("Navigation aborted", "AbortError"));
    return new Promise((resolve, reject) => {
      const onAbort = () => reject(new DOMException("Navigation aborted", "AbortError"));
      signal.addEventListener("abort", onAbort, { once: true });
      promise.then(
        (value) => { signal.removeEventListener("abort", onAbort); resolve(value); },
        (error) => { signal.removeEventListener("abort", onAbort); reject(error); },
      );
    });
  }

  function awaitInFlight(entry, signal) {
    if (!signal) return entry.promise;
    const abortRequest = () => entry.controller.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    return awaitWithSignal(entry.promise, signal).finally(() => {
      signal.removeEventListener("abort", abortRequest);
    });
  }

  async function fetchPage(url, signal) {
    const keyUrl = new URL(url, window.location.href);
    const key = keyUrl.href;
    const dirty = Boolean(window.VaultarrStore?.isDirty(keyUrl.pathname));

    // Mutations such as Discover & Add mark affected routes dirty. Never
    // reuse prefetched HTML for those routes; fetch the latest server state.
    if (dirty) {
      for (const cachedKey of Array.from(pageCache.keys())) {
        const cachedUrl = new URL(cachedKey, window.location.href);
        if (cachedUrl.pathname === keyUrl.pathname ||
            cachedUrl.pathname.startsWith(`${keyUrl.pathname.replace(/\/$/, '')}/`) ||
            keyUrl.pathname.startsWith(`${cachedUrl.pathname.replace(/\/$/, '')}/`)) {
          pageCache.delete(cachedKey);
        }
      }
    }

    const cached = pageCache.get(key);
    if (!dirty && cached && (Date.now() - cached.storedAt) < CACHE_TTL_MS) return cached.page;
    if (cached) pageCache.delete(key);

    if (inFlightPages.has(key)) return awaitInFlight(inFlightPages.get(key), signal);

    const controller = new AbortController();
    const request = (async () => {
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(key, {
          signal: controller.signal,
          credentials: "same-origin",
          headers: {
            "X-Vaultarr-Navigation": "smooth",
            "Accept": "text/html,application/xhtml+xml",
          },
        });
        if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);
        const page = extractPage(await response.text());
        pageCache.set(key, { page, storedAt: Date.now() });
        window.VaultarrStore?.clearDirty(keyUrl.pathname);
        return page;
      } catch (error) {
        if (error?.name === "AbortError" && signal?.aborted) throw new DOMException("Navigation aborted", "AbortError");
        if (error?.name === "AbortError") throw new Error("Navigation request timed out");
        throw error;
      } finally {
        window.clearTimeout(timeout);
        inFlightPages.delete(key);
      }
    })();

    const entry = { promise: request, controller };
    inFlightPages.set(key, entry);
    return awaitInFlight(entry, signal);
  }

  function beginDelayedLoadingIndicator(id) {
    window.clearTimeout(loadingIndicatorTimer);
    document.body.classList.remove("vault-nav-loading-visible");
    loadingIndicatorTimer = window.setTimeout(() => {
      if (id === navigationId) document.body.classList.add("vault-nav-loading-visible");
    }, LOADING_INDICATOR_DELAY_MS);
  }

  function endLoadingIndicator() {
    window.clearTimeout(loadingIndicatorTimer);
    loadingIndicatorTimer = null;
    document.body.classList.remove("vault-nav-loading-visible");
  }

  function runPageScripts(scripts) {
    scripts.forEach((definition) => {
      if (definition.src) return;
      if (definition.type && definition.type !== "text/javascript" && definition.type !== "module") return;
      const script = document.createElement("script");
      if (definition.type) script.type = definition.type;
      script.textContent = definition.text;
      document.body.appendChild(script);
      script.remove();
    });
  }

  function positionDestination(url) {
    const destination = new URL(url, window.location.href);
    if (destination.hash) {
      const anchor = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
      if (anchor) anchor.scrollIntoView({ block: "start", behavior: "auto" });
      else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  function commitPage(main, next, url, push) {
    main.setAttribute("aria-busy", "true");
    main.innerHTML = next.html;
    document.title = next.title;
    if (push) history.pushState({ vaultarrSmooth: true }, next.title, url);
    updateActiveNav(url);
    positionDestination(url);
    runPageScripts(next.scripts);
    main.removeAttribute("aria-busy");

    document.dispatchEvent(new CustomEvent("vaultarr:page-loaded", {
      detail: { url, title: next.title },
    }));
  }

  function waitForTransition(element, timeout) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        element.removeEventListener("transitionend", onEnd);
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === element && event.propertyName === "opacity") finish();
      };
      element.addEventListener("transitionend", onEnd);
      window.setTimeout(finish, timeout + 80);
    });
  }

  async function swapWithViewTransition(main, next, url, push, id) {
    document.body.classList.add("vault-view-transitioning");
    try {
      const transition = document.startViewTransition(() => {
        if (id !== navigationId) return;
        commitPage(main, next, url, push);
      });
      await transition.finished;
    } finally {
      document.body.classList.remove("vault-view-transitioning");
    }
  }

  async function swapWithSidebarLegacyMotion(main, next, url, push, id) {
    document.body.classList.add("vault-sidebar-nav-leaving");
    await waitForTransition(main, SIDEBAR_OUT_MS);
    if (id !== navigationId) return;

    commitPage(main, next, url, push);
    document.body.classList.remove("vault-sidebar-nav-leaving");
    void main.offsetWidth;
    document.body.classList.add("vault-sidebar-nav-entering");

    window.setTimeout(() => {
      if (id === navigationId) document.body.classList.remove("vault-sidebar-nav-entering");
    }, SIDEBAR_IN_MS + 30);
  }

  async function swapWithFallback(main, next, url, push, id) {
    document.body.classList.add("vault-nav-leaving");
    await waitForTransition(main, FALLBACK_OUT_MS);
    if (id !== navigationId) return;

    commitPage(main, next, url, push);
    document.body.classList.remove("vault-nav-leaving");
    void main.offsetWidth;
    document.body.classList.add("vault-nav-entering");

    window.setTimeout(() => {
      if (id === navigationId) document.body.classList.remove("vault-nav-entering");
    }, FALLBACK_IN_MS + 50);
  }

  async function swapPage(main, next, url, push, id, options = {}) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (options.sidebar && !reduceMotion) {
      await swapWithSidebarLegacyMotion(main, next, url, push, id);
      return;
    }
    if (!reduceMotion && typeof document.startViewTransition === "function") {
      await swapWithViewTransition(main, next, url, push, id);
      return;
    }
    await swapWithFallback(main, next, url, push, id);
  }

  async function loadPage(url, push = true, options = {}) {
    const main = document.querySelector(".vaultos-content, .content");
    if (!main) {
      window.location.href = url;
      return;
    }

    const target = new URL(url, window.location.href).href;
    const id = ++navigationId;
    document.body.dataset.vaultNavActive = String(id);
    if (activeController) activeController.abort();
    activeController = new AbortController();

    closeFocusIfOpen();
    document.body.classList.add("vault-nav-loading");
    document.body.classList.remove("vault-nav-entering", "vault-nav-leaving", "vault-sidebar-nav-entering", "vault-sidebar-nav-leaving");

    try {
      // Keep the current page fully visible until its replacement is complete.
      const next = await fetchPage(target, activeController.signal);
      if (id !== navigationId) return;
      await swapPage(main, next, target, push, id, options);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn("Vaultarr smooth navigation fell back to normal navigation:", error);
      window.location.href = target;
    } finally {
      if (id === navigationId) {
        document.body.classList.remove("vault-nav-loading", "vault-view-transitioning");
        if (document.body.dataset.vaultNavActive === String(id)) delete document.body.dataset.vaultNavActive;
        activeController = null;
      }
    }
  }


  async function loadSidebarPageExact(url, push = true) {
    const main = document.querySelector(".vaultos-content, .content");
    if (!main) {
      window.location.href = url;
      return;
    }

    const target = new URL(url, window.location.href).href;
    if (activeTarget === target && activeController) return;

    const id = ++navigationId;
    activeTarget = target;
    document.body.dataset.vaultNavActive = String(id);
    if (activeController) activeController.abort();
    activeController = new AbortController();

    closeFocusIfOpen();
    document.body.classList.add("vault-nav-loading");
    document.body.classList.remove(
      "vault-nav-entering",
      "vault-nav-leaving",
      "vault-sidebar-nav-entering",
      "vault-sidebar-nav-leaving",
      "vault-view-transitioning"
    );
    updateActiveNav(target);
    beginDelayedLoadingIndicator(id);

    try {
      // Prepare the next page while the current page remains fully visible.
      // Network or server latency can no longer stretch the exit animation.
      const next = await fetchPage(target, activeController.signal);
      if (id !== navigationId) return;

      endLoadingIndicator();
      document.body.classList.add("vault-nav-leaving");
      await waitForTransition(main, SIDEBAR_OUT_MS);
      if (id !== navigationId) return;

      commitPage(main, next, target, push);
      document.body.classList.remove("vault-nav-leaving", "vault-nav-loading");
      void main.offsetWidth;
      document.body.classList.add("vault-nav-entering");

      window.setTimeout(() => {
        if (id === navigationId) {
          document.body.classList.remove("vault-nav-entering");
          if (document.body.dataset.vaultNavActive === String(id)) delete document.body.dataset.vaultNavActive;
          activeController = null;
          activeTarget = "";
        }
      }, SIDEBAR_IN_MS + 30);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn("Vaultarr sidebar navigation fell back to normal navigation:", error);
      endLoadingIndicator();
      document.body.classList.remove("vault-nav-loading", "vault-nav-leaving");
      window.location.href = target;
    } finally {
      if (id === navigationId && !document.body.classList.contains("vault-nav-entering")) {
        endLoadingIndicator();
      }
    }
  }

  function schedulePrefetch(link) {
    if (!shouldPrefetch(link)) return;
    window.clearTimeout(prefetchTimer);
    prefetchTimer = window.setTimeout(() => {
      fetchPage(link.href).catch(() => {});
    }, PREFETCH_DELAY_MS);
  }

  window.VaultarrSmoothNavigate = loadPage;
  window.VaultarrInvalidatePageCache = (url, options = {}) => {
    if (!url) {
      pageCache.clear();
      return;
    }
    const target = new URL(url, window.location.href);
    const prefix = options.prefix !== false;
    for (const key of Array.from(pageCache.keys())) {
      const cached = new URL(key, window.location.href);
      const sameExactRoute = cached.pathname === target.pathname;
      const sameRouteFamily = prefix && (
        cached.pathname.startsWith(`${target.pathname.replace(/\/$/, '')}/`) ||
        target.pathname.startsWith(`${cached.pathname.replace(/\/$/, '')}/`)
      );
      if (sameExactRoute || sameRouteFamily) pageCache.delete(key);
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    // Clicking the route that is already open must be a true no-op. Without
    // this guard the smooth-navigation handler intentionally declines the
    // link, allowing the browser to perform a full document reload. That
    // reload is the brief raw-HTML flash seen when clicking an active Library
    // category (for example All Games while already viewing All Games), and
    // the same problem can occur on other active section links.
    if (link && !event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
        isInternalLink(link) && (!link.target || link.target === "_self") &&
        !link.hasAttribute("download") && !link.hasAttribute("data-no-smooth-nav")) {
      const clickedUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const sameRoute = clickedUrl.pathname === currentUrl.pathname &&
        clickedUrl.search === currentUrl.search &&
        !clickedUrl.hash;

      if (sameRoute) {
        event.preventDefault();
        updateActiveNav(currentUrl.href);
        return;
      }
    }

    if (!shouldHandleClick(event, link)) return;
    event.preventDefault();

    if (link.closest(".vault-nav")) {
      loadSidebarPageExact(link.href, true);
      return;
    }

    loadPage(link.href, true);
  });

  document.addEventListener("pointerenter", (event) => {
    const link = event.target.closest?.("a[href]");
    if (link) schedulePrefetch(link);
  }, true);

  document.addEventListener("focusin", (event) => {
    const link = event.target.closest?.("a[href]");
    if (link) schedulePrefetch(link);
  });

  window.addEventListener("popstate", () => loadPage(window.location.href, false));
  document.addEventListener("DOMContentLoaded", () => updateActiveNav(window.location.href));
})();
