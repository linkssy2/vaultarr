(() => {
  const state = {
    isOpen: false,
    debounce: null,
    lastQuery: "",
    activeIndex: -1,
    results: [],
  };

  function qs(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function elements() {
    return {
      openButton: qs("globalSearchOpen"),
      panel: qs("globalSearchPanel"),
      backdrop: qs("globalSearchBackdrop"),
      closeButton: qs("globalSearchClose"),
      input: qs("globalSearchInput"),
      status: qs("globalSearchStatus"),
      results: qs("globalSearchResults"),
    };
  }

  function openSearch(seed = "") {
    const el = elements();
    if (!el.panel || !el.input) return;

    state.isOpen = true;
    document.body.classList.add("global-search-open");
    el.panel.setAttribute("aria-hidden", "false");
    el.backdrop?.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      el.input.focus();
      if (seed) el.input.value = seed;
      el.input.select();
      runSearch(el.input.value.trim());
    }, 40);
  }

  function closeSearch() {
    const el = elements();
    state.isOpen = false;
    state.activeIndex = -1;
    document.body.classList.remove("global-search-open");
    el.panel?.setAttribute("aria-hidden", "true");
    el.backdrop?.setAttribute("aria-hidden", "true");
  }

  function setStatus(message) {
    const el = elements();
    if (el.status) el.status.textContent = message;
  }

  function renderResults(data) {
    const el = elements();
    if (!el.results) return;

    const games = data.games || [];
    const collections = data.collections || [];
    state.results = [
      ...games.map((item) => ({ ...item, result_type: "game" })),
      ...collections.map((item) => ({ ...item, result_type: "collection" })),
    ];
    state.activeIndex = -1;

    if (!state.results.length) {
      el.results.innerHTML = `<div class="global-search-empty">No vault results found.</div>`;
      return;
    }

    const gameHtml = games.length ? `
      <div class="global-search-section-title">Games</div>
      ${games.map(renderGameResult).join("")}
    ` : "";

    const collectionHtml = collections.length ? `
      <div class="global-search-section-title">Collections</div>
      ${collections.map(renderCollectionResult).join("")}
    ` : "";

    el.results.innerHTML = gameHtml + collectionHtml;
  }

  function renderGameResult(game) {
    const cover = game.cover_src
      ? `<img src="${escapeHtml(game.cover_src)}" alt="${escapeHtml(game.title)}">`
      : "🎮";
    const subtitle = [game.release_year, game.developer, game.category]
      .filter(Boolean)
      .join(" · ");

    return `
      <button class="global-search-result" type="button" data-kind="game" data-game-id="${game.id}">
        <span class="global-search-thumb">${cover}</span>
        <span>
          <span class="global-search-title">${escapeHtml(game.title)}</span>
          <span class="global-search-subtitle">${escapeHtml(subtitle || game.path || "Game")}</span>
        </span>
        <span class="global-search-type">Game</span>
      </button>
    `;
  }

  function renderCollectionResult(collection) {
    return `
      <button class="global-search-result" type="button" data-kind="collection" data-category="${escapeHtml(collection.name)}">
        <span class="global-search-thumb">▤</span>
        <span>
          <span class="global-search-title">${escapeHtml(collection.name)}</span>
          <span class="global-search-subtitle">${collection.count} game${Number(collection.count) === 1 ? "" : "s"}</span>
        </span>
        <span class="global-search-type">Shelf</span>
      </button>
    `;
  }

  async function runSearch(query) {
    query = (query || "").trim();
    state.lastQuery = query;

    if (!query) {
      setStatus("Start typing to search across your library.");
      const el = elements();
      if (el.results) el.results.innerHTML = "";
      return;
    }

    setStatus("Searching vault...");

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || "Search failed.");

      if (query !== state.lastQuery) return;
      const total = Number(data.total || 0);
      setStatus(`${total} result${total === 1 ? "" : "s"} found for “${query}”.`);
      renderResults(data);
    } catch (error) {
      setStatus(error.message || "Search failed.");
      const el = elements();
      if (el.results) el.results.innerHTML = `<div class="global-search-empty warning-text">${escapeHtml(error.message)}</div>`;
    }
  }

  function scheduleSearch() {
    const el = elements();
    window.clearTimeout(state.debounce);
    state.debounce = window.setTimeout(() => runSearch(el.input?.value || ""), 130);
  }

  function openGame(gameId) {
    closeSearch();

    const currentTrigger = document.querySelector(`.focus-card-trigger[data-game-id="${gameId}"]`);
    if (currentTrigger) {
      currentTrigger.click();
      return;
    }

    const targetUrl = `/library?open=${encodeURIComponent(gameId)}`;
    if (window.VaultarrSmoothNavigate) window.VaultarrSmoothNavigate(targetUrl, true);
    else window.location.href = targetUrl;
  }

  function openCollection(category) {
    closeSearch();
    const url = `/library?category=${encodeURIComponent(category)}`;
    if (window.VaultarrSmoothNavigate) window.VaultarrSmoothNavigate(url, true);
    else window.location.href = url;
  }

  function activateResult(button) {
    const kind = button.dataset.kind;
    if (kind === "game") openGame(button.dataset.gameId);
    if (kind === "collection") openCollection(button.dataset.category || "All Games");
  }

  function setActiveResult(nextIndex) {
    const el = elements();
    const buttons = Array.from(el.results?.querySelectorAll(".global-search-result") || []);
    if (!buttons.length) return;

    state.activeIndex = Math.max(0, Math.min(buttons.length - 1, nextIndex));
    buttons.forEach((button, index) => button.classList.toggle("is-active", index === state.activeIndex));
    buttons[state.activeIndex]?.scrollIntoView({ block: "nearest" });
  }

  function bind() {
    const el = elements();
    if (!el.panel || el.panel.dataset.bound === "1") return;
    el.panel.dataset.bound = "1";

    el.openButton?.addEventListener("click", () => openSearch());
    el.closeButton?.addEventListener("click", closeSearch);
    el.backdrop?.addEventListener("click", closeSearch);
    el.input?.addEventListener("input", scheduleSearch);
    el.results?.addEventListener("click", (event) => {
      const button = event.target.closest(".global-search-result");
      if (button) activateResult(button);
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        return;
      }

      if (!state.isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
        return;
      }

      const resultButtons = Array.from(elements().results?.querySelectorAll(".global-search-result") || []);
      if (!resultButtons.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveResult(state.activeIndex + 1);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveResult(state.activeIndex <= 0 ? resultButtons.length - 1 : state.activeIndex - 1);
      }
      if (event.key === "Enter" && state.activeIndex >= 0) {
        event.preventDefault();
        activateResult(resultButtons[state.activeIndex]);
      }
    });
  }

  window.VaultarrOpenGlobalSearch = openSearch;
  document.addEventListener("DOMContentLoaded", bind);
  document.addEventListener("vaultarr:page-loaded", bind);
})();
