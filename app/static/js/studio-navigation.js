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

  function scrollToStudioSection(hash, updateHash = true) {
    if (!hash || !hash.startsWith("#studio")) return false;
    const target = document.querySelector(hash);
    if (!target) return false;

    smoothScrollTo(getScrollTargetTop(target));
    target.classList.add("studio-section-targeted");
    window.setTimeout(() => target.classList.remove("studio-section-targeted"), 1000);

    if (updateHash && history.replaceState) {
      history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}${hash}`);
    }
    return true;
  }

  function bindStudioNavigation() {
    document.querySelectorAll('a[href^="#studio"]').forEach((link) => {
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
    const link = event.target.closest('a[href^="#studio"]');
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
