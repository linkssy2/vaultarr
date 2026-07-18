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
      let targetCoverZ = 18;
      let currentCoverZ = 18;

      let targetInfoY = 0;
      let currentInfoY = 0;
      let targetInfoZ = 22;
      let currentInfoZ = 22;

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
          cover.style.transform = `translate3d(${currentCoverX}px, ${currentCoverY}px, ${currentCoverZ}px) scale(${isHovering ? 1.04 : 1.01})`;
        }

        const info = getInfoElement();
        if (info) {
          info.style.transform = `translate3d(0, ${currentInfoY}px, ${currentInfoZ}px)`;
        }
      }

      function animate() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.26;
        currentRotateY += (targetRotateY - currentRotateY) * 0.26;
        currentScale += (targetScale - currentScale) * 0.20;
        currentLift += (targetLift - currentLift) * 0.20;
        currentCoverX += (targetCoverX - currentCoverX) * 0.18;
        currentCoverY += (targetCoverY - currentCoverY) * 0.18;
        currentCoverZ += (targetCoverZ - currentCoverZ) * 0.18;
        currentInfoY += (targetInfoY - currentInfoY) * 0.18;
        currentInfoZ += (targetInfoZ - currentInfoZ) * 0.18;

        applyTransform();

        const stillMoving =
          Math.abs(targetRotateX - currentRotateX) > 0.01 ||
          Math.abs(targetRotateY - currentRotateY) > 0.01 ||
          Math.abs(targetScale - currentScale) > 0.001 ||
          Math.abs(targetLift - currentLift) > 0.1 ||
          Math.abs(targetCoverX - currentCoverX) > 0.05 ||
          Math.abs(targetCoverY - currentCoverY) > 0.05 ||
          Math.abs(targetCoverZ - currentCoverZ) > 0.05 ||
          Math.abs(targetInfoY - currentInfoY) > 0.05 ||
          Math.abs(targetInfoZ - currentInfoZ) > 0.05;

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
        targetCoverZ = 18;
        targetInfoY = 0;
        targetInfoZ = 22;

        card.style.removeProperty("--gloss-x");
        card.style.removeProperty("--gloss-y");
        card.style.removeProperty("--slate-bevel-x");
        card.style.removeProperty("--slate-bevel-y");
        card.style.removeProperty("--slate-bevel-opposite-x");
        card.style.removeProperty("--slate-bevel-opposite-y");

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

        targetRotateY = normalizedX * 9.5;
        targetRotateX = -normalizedY * 9.5;
        targetScale = 1.043;
        targetLift = -11;
        targetCoverX = normalizedX * 7;
        targetCoverY = normalizedY * 5.5;
        targetCoverZ = 46;
        targetInfoY = normalizedY * 1.5;
        targetInfoZ = 34;

        const glossX = (x / rect.width) * 100;
        const glossY = (y / rect.height) * 100;
        const slateBevelX = normalizedX * -2.5;
        const slateBevelY = normalizedY * -2.5;

        card.style.setProperty("--gloss-x", `${glossX}%`);
        card.style.setProperty("--gloss-y", `${glossY}%`);
        card.style.setProperty("--slate-bevel-x", `${slateBevelX}px`);
        card.style.setProperty("--slate-bevel-y", `${slateBevelY}px`);
        card.style.setProperty("--slate-bevel-opposite-x", `${-slateBevelX}px`);
        card.style.setProperty("--slate-bevel-opposite-y", `${-slateBevelY}px`);

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

  function closeMuseumSelects(except = null) {
    document.querySelectorAll(".museum-select.is-open").forEach((wrapper) => {
      if (wrapper === except) return;
      wrapper.classList.remove("is-open");
      wrapper.querySelector(".museum-select-trigger")?.setAttribute("aria-expanded", "false");
      wrapper.querySelector(".museum-select-menu")?.setAttribute("aria-hidden", "true");
    });
  }

  function initMuseumSelects(filterForm) {
    if (!filterForm) return;

    filterForm.querySelectorAll("select").forEach((select, selectIndex) => {
      if (select.dataset.museumSelectEnhanced === "1") return;
      select.dataset.museumSelectEnhanced = "1";
      select.classList.add("museum-select-native");
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");

      const label = select.closest("label");
      const labelText = label?.querySelector(":scope > span")?.textContent?.trim() || select.getAttribute("aria-label") || "Choose option";
      if (!select.id) select.id = `museumFilter${select.name || selectIndex}`;

      const wrapper = document.createElement("div");
      wrapper.className = "museum-select";
      select.parentNode.insertBefore(wrapper, select);
      wrapper.append(select);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "museum-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", labelText);
      trigger.innerHTML = '<span class="museum-select-value"></span><span class="museum-select-chevron" aria-hidden="true"></span>';

      const menu = document.createElement("div");
      menu.className = "museum-select-menu";
      menu.id = `${select.id}Menu`;
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", `${labelText} options`);
      menu.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-controls", menu.id);

      Array.from(select.options).forEach((option, optionIndex) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "museum-select-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.style.setProperty("--museum-option-delay", `${55 + (optionIndex * 45)}ms`);
        item.textContent = option.textContent;
        item.addEventListener("click", () => {
          select.value = option.value;
          sync();
          select.dispatchEvent(new Event("change", { bubbles: true }));
          closeMuseumSelects();
          trigger.focus({ preventScroll: true });
        });
        menu.append(item);
      });

      wrapper.append(trigger, menu);
      const valueLabel = trigger.querySelector(".museum-select-value");

      function sync() {
        const selected = select.options[select.selectedIndex] || select.options[0];
        valueLabel.textContent = selected?.textContent || "Choose";
        menu.querySelectorAll(".museum-select-option").forEach((item) => {
          const isSelected = item.dataset.value === select.value;
          item.classList.toggle("is-selected", isSelected);
          item.setAttribute("aria-selected", String(isSelected));
        });
      }

      function openMenu(focusOption = false) {
        closeMuseumSelects(wrapper);
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        menu.setAttribute("aria-hidden", "false");
        const selectedItem = menu.querySelector('.museum-select-option[aria-selected="true"]');
        if (selectedItem) menu.scrollTop = Math.max(0, selectedItem.offsetTop - 42);
        if (focusOption) (selectedItem || menu.querySelector(".museum-select-option"))?.focus({ preventScroll: true });
      }

      function closeMenu(restoreFocus = false) {
        wrapper.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
        if (restoreFocus) trigger.focus({ preventScroll: true });
      }

      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        if (wrapper.classList.contains("is-open")) closeMenu();
        else openMenu();
      });
      trigger.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "Enter", " "].includes(event.key)) return;
        event.preventDefault();
        openMenu(true);
      });
      menu.addEventListener("keydown", (event) => {
        const options = Array.from(menu.querySelectorAll(".museum-select-option"));
        const index = options.indexOf(document.activeElement);
        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu(true);
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          options[(index + direction + options.length) % options.length]?.focus({ preventScroll: true });
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          options[event.key === "Home" ? 0 : options.length - 1]?.focus({ preventScroll: true });
        }
      });
      select.addEventListener("change", sync);
      sync();
    });

    if (!window.__vaultarrMuseumSelectOutsideBound) {
      window.__vaultarrMuseumSelectOutsideBound = true;
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".museum-select")) closeMuseumSelects();
      });
    }
  }

  function initLibraryTools() {
    const searchInput = document.getElementById("librarySearch");
    const clearButton = document.getElementById("clearLibrarySearch");
    const sortSelect = document.getElementById("librarySort");
    const grid = document.getElementById("libraryGrid");
    const noResults = document.getElementById("libraryNoResults");
    const searchCount = document.getElementById("librarySearchCount");
    const filterForm = document.getElementById("museumFilterForm");

    initMuseumSelects(filterForm);
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

    if (filterForm && filterForm.dataset.vaultarrFilterBound !== "1") {
      filterForm.dataset.vaultarrFilterBound = "1";
      const navigateToFilters = () => {
        const url = new URL(filterForm.action || "/museum", window.location.origin);
        const params = new URLSearchParams(new FormData(filterForm));
        for (const [key, value] of Array.from(params.entries())) {
          if (!value || value === "All Platforms" || value === "All Genres" || value === "All Games") params.delete(key);
        }
        url.search = params.toString();
        filterForm.classList.add("is-navigating");
        const navigation = typeof window.VaultarrSmoothNavigate === "function"
          ? window.VaultarrSmoothNavigate(url.href, true, { source: "museum-filter" })
          : Promise.resolve().then(() => { window.location.href = url.href; });
        Promise.resolve(navigation).catch(() => { window.location.href = url.href; });
      };
      filterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        navigateToFilters();
      });
      filterForm.querySelectorAll("select").forEach((select) => {
        if (select.id === "librarySort") return;
        select.addEventListener("change", navigateToFilters);
      });
    }
    // Alpha 7 removes the retired list view entirely. Clear any saved list
    // preference from Alpha 3–5 so returning users always get the canonical
    // floating-card grid.
    grid.classList.remove("is-list-view");
    try { localStorage.removeItem("vaultarrMuseumView"); } catch (_error) {}

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
