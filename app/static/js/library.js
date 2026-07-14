(() => {
  function initCardHover() {
    const cards = document.querySelectorAll(".poster-card");

    cards.forEach((card) => {
      if (card.dataset.vaultarrHoverBound === "1") return;
      card.dataset.vaultarrHoverBound = "1";

      let targetRotateX = 0;
      let targetRotateY = 0;
      let currentRotateX = 0;
      let currentRotateY = 0;

      let targetScale = 1;
      let currentScale = 1;

      let targetLift = 0;
      let currentLift = 0;

      let targetCoverX = 0;
      let targetCoverY = 0;
      let currentCoverX = 0;
      let currentCoverY = 0;

      let targetInfoY = 0;
      let currentInfoY = 0;

      let rafId = null;
      let isHovering = false;

      function getCoverElement() {
        return card.querySelector(".poster-cover, .poster-placeholder");
      }

      function getInfoElement() {
        return card.querySelector(".poster-info");
      }

      function applyTransform() {
        card.style.transform = `
          translate3d(0, ${currentLift}px, 0)
          scale(${currentScale})
          rotateX(${currentRotateX}deg)
          rotateY(${currentRotateY}deg)
        `;

        const cover = getCoverElement();
        if (cover) {
          cover.style.transform = `translate3d(${currentCoverX}px, ${currentCoverY}px, 34px) scale(${isHovering ? 1.035 : 1.01})`;
        }

        const info = getInfoElement();
        if (info) {
          info.style.transform = `translate3d(0, ${currentInfoY}px, 24px)`;
        }
      }

      function animate() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.26;
        currentRotateY += (targetRotateY - currentRotateY) * 0.26;
        currentScale += (targetScale - currentScale) * 0.20;
        currentLift += (targetLift - currentLift) * 0.20;
        currentCoverX += (targetCoverX - currentCoverX) * 0.18;
        currentCoverY += (targetCoverY - currentCoverY) * 0.18;
        currentInfoY += (targetInfoY - currentInfoY) * 0.18;

        applyTransform();

        const stillMoving =
          Math.abs(targetRotateX - currentRotateX) > 0.01 ||
          Math.abs(targetRotateY - currentRotateY) > 0.01 ||
          Math.abs(targetScale - currentScale) > 0.001 ||
          Math.abs(targetLift - currentLift) > 0.1 ||
          Math.abs(targetCoverX - currentCoverX) > 0.05 ||
          Math.abs(targetCoverY - currentCoverY) > 0.05 ||
          Math.abs(targetInfoY - currentInfoY) > 0.05;

        if (stillMoving) {
          rafId = requestAnimationFrame(animate);
        } else {
          rafId = null;
        }
      }

      function startAnimation() {
        if (!rafId) rafId = requestAnimationFrame(animate);
      }

      function resetHoverState() {
        isHovering = false;
        card.classList.remove("is-hovering");

        targetRotateX = 0;
        targetRotateY = 0;
        targetScale = 1;
        targetLift = 0;
        targetCoverX = 0;
        targetCoverY = 0;
        targetInfoY = 0;

        card.style.removeProperty("--gloss-x");
        card.style.removeProperty("--gloss-y");
        card.style.removeProperty("--shadow-x");
        card.style.removeProperty("--shadow-y");

        startAnimation();
      }

      card.addEventListener("mousemove", (event) => {
        if (document.body.classList.contains("focus-active")) return;

        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const normalizedX = (x - centerX) / centerX;
        const normalizedY = (y - centerY) / centerY;

        isHovering = true;
        card.classList.add("is-hovering");

        targetRotateY = normalizedX * 8.5;
        targetRotateX = -normalizedY * 8.5;
        targetScale = 1.043;
        targetLift = -11;
        targetCoverX = normalizedX * 5;
        targetCoverY = normalizedY * 4;
        targetInfoY = -1.5;

        const glossX = (x / rect.width) * 100;
        const glossY = (y / rect.height) * 100;
        const shadowX = normalizedX * -14;
        const shadowY = 28 + Math.abs(normalizedY) * 10;

        card.style.setProperty("--gloss-x", `${glossX}%`);
        card.style.setProperty("--gloss-y", `${glossY}%`);
        card.style.setProperty("--shadow-x", `${shadowX}px`);
        card.style.setProperty("--shadow-y", `${shadowY}px`);

        startAnimation();
      });

      card.addEventListener("mouseleave", resetHoverState);

      document.addEventListener("vaultarr:focus-closed", () => {
        resetHoverState();
        window.requestAnimationFrame(() => {
          const cover = getCoverElement();
          const info = getInfoElement();
          if (cover) cover.style.transform = "translate3d(0, 0, 18px) scale(1.01)";
          if (info) info.style.transform = "translate3d(0, 0, 22px)";
        });
      });
    });
  }

  function initLibraryTools() {
    const searchInput = document.getElementById("librarySearch");
    const clearButton = document.getElementById("clearLibrarySearch");
    const sortSelect = document.getElementById("librarySort");
    const grid = document.getElementById("libraryGrid");
    const noResults = document.getElementById("libraryNoResults");
    const searchCount = document.getElementById("librarySearchCount");
    const gridViewButton = document.getElementById("museumGridView");
    const listViewButton = document.getElementById("museumListView");

    if (!grid || grid.dataset.vaultarrSearchBound === "1") return;
    grid.dataset.vaultarrSearchBound = "1";

    const getTriggers = () => Array.from(grid.querySelectorAll(".focus-card-trigger"));


    function setMuseumView(mode) {
      const listMode = mode === "list";
      grid.classList.toggle("is-list-view", listMode);
      gridViewButton?.classList.toggle("is-active", !listMode);
      listViewButton?.classList.toggle("is-active", listMode);
      gridViewButton?.setAttribute("aria-pressed", String(!listMode));
      listViewButton?.setAttribute("aria-pressed", String(listMode));
      try { localStorage.setItem("vaultarrMuseumView", listMode ? "list" : "grid"); } catch (_error) {}
    }
    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function applySearch() {
      const query = normalize(searchInput?.value || "");
      let visible = 0;

      getTriggers().forEach((trigger) => {
        const haystack = normalize(trigger.dataset.search || "");
        const title = normalize(trigger.dataset.title || "");
        const terms = query.split(/\s+/).filter(Boolean);
        const isMatch = !terms.length || terms.every((term) => haystack.includes(term) || title.includes(term));

        trigger.classList.toggle("search-hidden", !isMatch);
        if (isMatch) visible += 1;
      });

      if (noResults) noResults.classList.toggle("hidden", visible !== 0);
      if (searchCount) searchCount.textContent = `${visible} game${visible === 1 ? "" : "s"}${query ? " matched" : ""}`;
      if (clearButton) clearButton.classList.toggle("visible", Boolean(query));
    }

    function applySort() {
      const sort = sortSelect?.value || "title";
      const sorted = getTriggers().sort((a, b) => {
        if (sort === "size") return Number(b.dataset.size || 0) - Number(a.dataset.size || 0);
        if (sort === "scanned") return String(b.dataset.scanned || "").localeCompare(String(a.dataset.scanned || ""));
        if (sort === "added") return String(b.dataset.added || "").localeCompare(String(a.dataset.added || ""));
        return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""));
      });
      sorted.forEach((trigger) => grid.appendChild(trigger));
    }

    let searchTimer = 0;
    searchInput?.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(applySearch, 90);
    });
    clearButton?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      applySearch();
      searchInput?.focus();
    });
    sortSelect?.addEventListener("change", () => {
      applySort();
      applySearch();
    });
    gridViewButton?.addEventListener("click", () => setMuseumView("grid"));
    listViewButton?.addEventListener("click", () => setMuseumView("list"));
    let savedMuseumView = "grid";
    try { savedMuseumView = localStorage.getItem("vaultarrMuseumView") || "grid"; } catch (_error) {}
    setMuseumView(savedMuseumView);

    applySort();
    applySearch();
  }

  function bindGlobalSearchShortcut() {
    // Universal Search owns Ctrl/Cmd+K. Keeping a second Library shortcut
    // caused two handlers to fight over focus and could make the dialog feel
    // disabled after it opened.
    return;
  }


  async function insertLiveGame(detail) {
    const shell = document.getElementById("libraryShell");
    const grid = document.getElementById("libraryGrid");
    if (!shell || !grid || !detail?.game_id) return false;
    if (grid.querySelector(`[data-game-id="${detail.game_id}"]`)) return true;

    try {
      const response = await fetch(`/api/games/${encodeURIComponent(detail.game_id)}/card`, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || !data.success || !data.html) throw new Error(data.message || "Could not load the new game card.");

      const activeChip = document.querySelector(".category-chip.active");
      const activeCategory = activeChip?.getAttribute("href")?.includes("category=")
        ? new URL(activeChip.href, location.origin).searchParams.get("category")
        : "All Games";
      const belongsHere = activeCategory === "All Games" || activeCategory === data.category;

      document.querySelectorAll(".category-chip").forEach((chip) => {
        const href = chip.getAttribute("href") || "";
        let key = "All Games";
        try { key = new URL(href, location.origin).searchParams.get("category") || "All Games"; } catch (_error) {}
        const count = key === "All Games" ? data.total_count : Number(data.category_counts?.[key] || 0);
        const badge = chip.querySelector("span");
        if (badge) badge.textContent = String(count);
      });

      if (!belongsHere) return true;

      const holder = document.createElement("div");
      holder.innerHTML = data.html.trim();
      const card = holder.firstElementChild;
      if (!card) return false;
      const sort = document.getElementById("librarySort")?.value || "title";
      if (sort === "added") grid.prepend(card); else grid.appendChild(card);
      window.VaultarrInitLibrary?.();
      document.getElementById("librarySearch")?.dispatchEvent(new Event("input", { bubbles: true }));
      window.setTimeout(() => card.classList.remove("vaultarr-card-enter"), 900);
      window.setTimeout(() => card.querySelector(".poster-live-status")?.remove(), 4200);
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return true;
    } catch (error) {
      console.error("Live library insertion failed", error);
      return false;
    }
  }

  if (!window.__vaultarrLiveLibraryBound) {
    window.__vaultarrLiveLibraryBound = true;
    document.addEventListener("vaultarr:game-added", (event) => {
      insertLiveGame(event.detail || {});
    });
  }

  window.VaultarrInitLibrary = function VaultarrInitLibrary() {
    initCardHover();
    initLibraryTools();
    bindGlobalSearchShortcut();
  };

  document.addEventListener("DOMContentLoaded", window.VaultarrInitLibrary);
  document.addEventListener("vaultarr:page-loaded", window.VaultarrInitLibrary);
})();
