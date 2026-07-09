(() => {
  const TRANSITION_OUT_MS = 170;
  const TRANSITION_IN_MS = 280;

  function isInternalLink(link) {
    if (!link || !link.href) return false;
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin;
  }

  function shouldHandleClick(event, link) {
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!isInternalLink(link)) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    const url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return true;
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

  function extractMain(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nextContent = doc.querySelector(".vaultos-content, .content");
    if (!nextContent) throw new Error("New page did not contain a Vaultarr content area.");
    return { doc, content: nextContent.innerHTML, title: doc.title || "Vaultarr" };
  }

  async function loadPage(url, push = true) {
    const main = document.querySelector(".vaultos-content, .content");
    if (!main) {
      window.location.href = url;
      return;
    }

    closeFocusIfOpen();
    document.body.classList.add("vault-nav-loading", "vault-nav-leaving");
    document.body.classList.remove("vault-nav-entering");

    try {
      const response = await fetch(url, {
        headers: {
          "X-Vaultarr-Navigation": "smooth",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);

      const html = await response.text();
      const next = extractMain(html);

      window.setTimeout(() => {
        main.innerHTML = next.content;
        document.title = next.title;
        if (push) history.pushState({ vaultarrSmooth: true }, next.title, url);

        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        updateActiveNav(url);

        document.body.classList.remove("vault-nav-leaving", "vault-nav-loading");
        document.body.classList.add("vault-nav-entering");

        document.dispatchEvent(new CustomEvent("vaultarr:page-loaded", {
          detail: { url, title: next.title },
        }));

        window.setTimeout(() => {
          document.body.classList.remove("vault-nav-entering");
        }, TRANSITION_IN_MS);
      }, TRANSITION_OUT_MS);
    } catch (error) {
      console.warn("Vaultarr smooth navigation fell back to normal navigation:", error);
      window.location.href = url;
    }
  }

  window.VaultarrSmoothNavigate = loadPage;

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".vault-nav a, a[data-smooth-nav]");
    if (!shouldHandleClick(event, link)) return;
    event.preventDefault();
    loadPage(link.href, true);
  });

  window.addEventListener("popstate", () => {
    loadPage(window.location.href, false);
  });

  document.addEventListener("DOMContentLoaded", () => updateActiveNav(window.location.href));
})();
