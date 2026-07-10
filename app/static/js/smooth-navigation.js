(() => {
  const TRANSITION_OUT_MS = 150;
  const TRANSITION_IN_MS = 240;
  const PREFETCH_DELAY_MS = 90;
  const pageCache = new Map();
  let activeController = null;
  let navigationId = 0;
  let prefetchTimer = null;

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
    const path = new URL(url, window.location.href).pathname;
    document.querySelectorAll(".vault-nav a").forEach((link) => {
      const linkPath = new URL(link.href, window.location.href).pathname;
      const active = path === linkPath || (linkPath !== "/" && path.startsWith(linkPath));
      link.classList.toggle("active", active);
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

  async function fetchPage(url, signal) {
    const key = new URL(url, window.location.href).href;
    if (pageCache.has(key)) return pageCache.get(key);

    const response = await fetch(key, {
      signal,
      credentials: "same-origin",
      headers: {
        "X-Vaultarr-Navigation": "smooth",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);
    const page = extractPage(await response.text());
    pageCache.set(key, page);
    return page;
  }

  function runPageScripts(scripts) {
    scripts.forEach((definition) => {
      // Shared scripts already live in base.html. Only execute page-local scripts.
      if (definition.src) return;
      if (definition.type && definition.type !== "text/javascript" && definition.type !== "module") return;
      const script = document.createElement("script");
      if (definition.type) script.type = definition.type;
      script.textContent = definition.text;
      document.body.appendChild(script);
      script.remove();
    });
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
      window.setTimeout(finish, timeout + 60);
    });
  }

  async function swapPage(main, next, url, push, id) {
    document.body.classList.add("vault-nav-leaving");
    await waitForTransition(main, TRANSITION_OUT_MS);
    if (id !== navigationId) return;

    main.setAttribute("aria-busy", "true");
    main.innerHTML = next.html;
    document.title = next.title;
    if (push) history.pushState({ vaultarrSmooth: true }, next.title, url);

    updateActiveNav(url);
    const destination = new URL(url, window.location.href);
    if (destination.hash) {
      const anchor = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
      if (anchor) anchor.scrollIntoView({ block: "start", behavior: "auto" });
      else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    runPageScripts(next.scripts);

    document.body.classList.remove("vault-nav-leaving");
    // Force one completed layout frame before the entrance animation begins.
    void main.offsetWidth;
    document.body.classList.add("vault-nav-entering");
    main.removeAttribute("aria-busy");

    document.dispatchEvent(new CustomEvent("vaultarr:page-loaded", {
      detail: { url, title: next.title },
    }));

    window.setTimeout(() => {
      if (id === navigationId) document.body.classList.remove("vault-nav-entering");
    }, TRANSITION_IN_MS + 40);
  }

  async function loadPage(url, push = true) {
    const main = document.querySelector(".vaultos-content, .content");
    if (!main) {
      window.location.href = url;
      return;
    }

    const target = new URL(url, window.location.href).href;
    const id = ++navigationId;
    if (activeController) activeController.abort();
    activeController = new AbortController();

    closeFocusIfOpen();
    document.body.classList.add("vault-nav-loading");
    document.body.classList.remove("vault-nav-entering", "vault-nav-leaving");

    try {
      // Keep the current page fully visible while the next page is prepared.
      const next = await fetchPage(target, activeController.signal);
      if (id !== navigationId) return;
      await swapPage(main, next, target, push, id);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn("Vaultarr smooth navigation fell back to normal navigation:", error);
      window.location.href = target;
    } finally {
      if (id === navigationId) {
        document.body.classList.remove("vault-nav-loading");
        activeController = null;
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
  window.VaultarrInvalidatePageCache = (url) => {
    if (url) pageCache.delete(new URL(url, window.location.href).href);
    else pageCache.clear();
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!shouldHandleClick(event, link)) return;
    event.preventDefault();
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
