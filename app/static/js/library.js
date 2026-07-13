(() => {
  function initCardHover() {
    if (window.__vaultarrCardHoverControllerBound) return;
    window.__vaultarrCardHoverControllerBound = true;

    const states = new WeakMap();
    let activeCard = null;
    let pointerFrame = 0;
    let lastPointerEvent = null;

    function stateFor(card) {
      let state = states.get(card);
      if (state) return state;
      state = {
        targetRotateX: 0, targetRotateY: 0, currentRotateX: 0, currentRotateY: 0,
        targetScale: 1, currentScale: 1, targetLift: 0, currentLift: 0,
        targetCoverX: 0, targetCoverY: 0, currentCoverX: 0, currentCoverY: 0,
        targetInfoY: 0, currentInfoY: 0, rafId: 0, hovering: false
      };
      states.set(card, state);
      return state;
    }

    function coverFor(card) { return card.querySelector('.poster-cover, .poster-placeholder'); }
    function infoFor(card) { return card.querySelector('.poster-info'); }

    function apply(card, state) {
      card.style.transform = `translate3d(0, ${state.currentLift}px, 0) scale(${state.currentScale}) rotateX(${state.currentRotateX}deg) rotateY(${state.currentRotateY}deg)`;
      const cover = coverFor(card);
      if (cover) cover.style.transform = `translate3d(${state.currentCoverX}px, ${state.currentCoverY}px, 34px) scale(${state.hovering ? 1.035 : 1.01})`;
      const info = infoFor(card);
      if (info) info.style.transform = `translate3d(0, ${state.currentInfoY}px, 24px)`;
    }

    function animate(card) {
      const state = stateFor(card);
      state.currentRotateX += (state.targetRotateX - state.currentRotateX) * 0.26;
      state.currentRotateY += (state.targetRotateY - state.currentRotateY) * 0.26;
      state.currentScale += (state.targetScale - state.currentScale) * 0.20;
      state.currentLift += (state.targetLift - state.currentLift) * 0.20;
      state.currentCoverX += (state.targetCoverX - state.currentCoverX) * 0.18;
      state.currentCoverY += (state.targetCoverY - state.currentCoverY) * 0.18;
      state.currentInfoY += (state.targetInfoY - state.currentInfoY) * 0.18;
      apply(card, state);

      const moving = Math.abs(state.targetRotateX-state.currentRotateX)>.01 || Math.abs(state.targetRotateY-state.currentRotateY)>.01 ||
        Math.abs(state.targetScale-state.currentScale)>.001 || Math.abs(state.targetLift-state.currentLift)>.1 ||
        Math.abs(state.targetCoverX-state.currentCoverX)>.05 || Math.abs(state.targetCoverY-state.currentCoverY)>.05 || Math.abs(state.targetInfoY-state.currentInfoY)>.05;
      state.rafId = moving && !document.hidden ? requestAnimationFrame(() => animate(card)) : 0;
    }

    function start(card) {
      const state = stateFor(card);
      if (!state.rafId && !document.hidden) state.rafId = requestAnimationFrame(() => animate(card));
    }

    function reset(card) {
      if (!card) return;
      const state = stateFor(card);
      state.hovering = false;
      card.classList.remove('is-hovering');
      Object.assign(state, {targetRotateX:0,targetRotateY:0,targetScale:1,targetLift:0,targetCoverX:0,targetCoverY:0,targetInfoY:0});
      card.style.removeProperty('--gloss-x'); card.style.removeProperty('--gloss-y');
      card.style.removeProperty('--shadow-x'); card.style.removeProperty('--shadow-y');
      start(card);
    }

    function processPointer() {
      pointerFrame = 0;
      const event = lastPointerEvent;
      const card = event?.target?.closest?.('.poster-card');
      if (!card || document.body.classList.contains('focus-active') || document.hidden) return;
      if (activeCard && activeCard !== card) reset(activeCard);
      activeCard = card;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x=event.clientX-rect.left, y=event.clientY-rect.top;
      const nx=(x-rect.width/2)/(rect.width/2), ny=(y-rect.height/2)/(rect.height/2);
      const state=stateFor(card);
      state.hovering=true; card.classList.add('is-hovering');
      Object.assign(state,{targetRotateY:nx*8.5,targetRotateX:-ny*8.5,targetScale:1.043,targetLift:-11,targetCoverX:nx*5,targetCoverY:ny*4,targetInfoY:-1.5});
      card.style.setProperty('--gloss-x',`${(x/rect.width)*100}%`); card.style.setProperty('--gloss-y',`${(y/rect.height)*100}%`);
      card.style.setProperty('--shadow-x',`${nx*-14}px`); card.style.setProperty('--shadow-y',`${28+Math.abs(ny)*10}px`);
      start(card);
    }

    document.addEventListener('pointermove', (event) => {
      if (!event.target.closest?.('.poster-card')) return;
      lastPointerEvent=event;
      if (!pointerFrame) pointerFrame=requestAnimationFrame(processPointer);
    }, {passive:true});
    document.addEventListener('pointerout', (event) => {
      const card=event.target.closest?.('.poster-card');
      if (card && !card.contains(event.relatedTarget)) { reset(card); if(activeCard===card) activeCard=null; }
    }, {passive:true});
    document.addEventListener('vaultarr:focus-closed', () => { reset(activeCard); activeCard=null; });
    document.addEventListener('visibilitychange', () => { if(document.hidden) reset(activeCard); });
  }

  function initLibraryTools() {
    const searchInput = document.getElementById("librarySearch");
    const clearButton = document.getElementById("clearLibrarySearch");
    const sortSelect = document.getElementById("librarySort");
    const grid = document.getElementById("libraryGrid");
    const noResults = document.getElementById("libraryNoResults");
    const searchCount = document.getElementById("librarySearchCount");

    if (!grid || grid.dataset.vaultarrSearchBound === "1") return;
    grid.dataset.vaultarrSearchBound = "1";

    const getTriggers = () => Array.from(grid.querySelectorAll(".focus-card-trigger"));

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
