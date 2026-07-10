(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    let activeGrid = null;
    const panel = document.getElementById("focusPanel");
    const backdrop = document.getElementById("focusBackdrop");
    const closeButton = document.getElementById("focusClose");

    if (!panel) return;

    let activeTrigger = null;
    let activeStartRect = null;
    let isAnimating = false;
    let activeGameId = null;
    let activeGame = null;

    const fields = {
      cover: document.getElementById("focusCover"),
      kicker: document.getElementById("focusKicker"),
      title: document.getElementById("focusTitle"),
      path: document.getElementById("focusPath"),
      description: document.getElementById("focusDescription"),
      size: document.getElementById("focusSize"),
      files: document.getElementById("focusFiles"),
      executables: document.getElementById("focusExecutables"),
      category: document.getElementById("focusCategory"),
      sourceType: document.getElementById("focusSourceType"),
      lockStatus: document.getElementById("focusLockStatus"),
      developer: document.getElementById("focusDeveloper"),
      publisher: document.getElementById("focusPublisher"),
      year: document.getElementById("focusYear"),
      genre: document.getElementById("focusGenre"),
      platform: document.getElementById("focusPlatform"),
      source: document.getElementById("focusSource"),
      metadataLink: document.getElementById("focusMetadataLink"),
      preservationExecutable: document.getElementById("focusPreservationExecutable"),
      preservationCover: document.getElementById("focusPreservationCover"),
      preservationMetadata: document.getElementById("focusPreservationMetadata"),
      preservationDocumentation: document.getElementById("focusPreservationDocumentation"),
      preservationArchive: document.getElementById("focusPreservationArchive"),
      preservationScore: document.getElementById("focusPreservationScore"),
      preservationBadge: document.getElementById("focusPreservationBadge"),
      preservationAssets: document.getElementById("focusPreservationAssets"),
      manualSource: document.getElementById("focusManualSource"),
      findManualLink: document.getElementById("focusFindManualLink"),
      manualUrlLink: document.getElementById("focusManualUrlLink"),
      manualSearchForm: document.getElementById("focusManualSearchForm"),
      manualQuery: document.getElementById("focusManualQuery"),
      manualProvider: document.getElementById("focusManualProvider"),
      manualLinkForm: document.getElementById("focusManualLinkForm"),
      manualUrlInput: document.getElementById("focusManualUrlInput"),
      manualLinkProvider: document.getElementById("focusManualLinkProvider"),
      manualStatus: document.getElementById("focusManualStatus"),
      manualResults: document.getElementById("focusManualResults"),
      manualDownloadButton: document.getElementById("focusManualDownloadButton"),
      manualSavedLink: document.getElementById("focusManualSavedLink"),
      manualSourcePageLink: document.getElementById("focusManualSourcePageLink"),
      manualRemoveButton: document.getElementById("focusManualRemoveButton"),
      manualViewer: document.getElementById("focusManualViewer"),
      gallerySearchForm: document.getElementById("focusGallerySearchForm"),
      gallerySearchButton: document.getElementById("focusGallerySearchButton"),
      gallerySearchPanel: document.getElementById("focusGallerySearchPanel"),
      galleryProvider: document.getElementById("focusGalleryProvider"),
      galleryStatus: document.getElementById("focusGalleryStatus"),
      galleryStage: document.getElementById("focusGalleryStage"),
      gallerySaved: document.getElementById("focusGallerySaved"),
      gallerySavedCount: document.getElementById("focusGallerySavedCount"),
      galleryClearButton: document.getElementById("focusGalleryClearButton"),
      galleryResults: document.getElementById("focusGalleryResults"),
      coverManagerStatus: document.getElementById("focusCoverManagerStatus"),
      coverManagerCurrent: document.getElementById("focusCoverManagerCurrent"),
      coverCandidates: document.getElementById("focusCoverCandidates"),
      coverSearchButton: document.getElementById("focusCoverSearchButton"),
      coverUploadInput: document.getElementById("focusCoverUploadInput"),
      executablesList: document.getElementById("focusExecutablesList"),
      lastScanned: document.getElementById("focusLastScanned"),
      metadataForm: document.getElementById("focusMetadataForm"),
      metadataQuery: document.getElementById("focusMetadataQuery"),
      metadataProvider: document.getElementById("focusMetadataProvider"),
      metadataStatus: document.getElementById("focusMetadataStatus"),
      metadataResults: document.getElementById("focusMetadataResults"),
      providerIntelligenceButton: document.getElementById("focusProviderIntelligenceButton"),
      mergeBestButton: document.getElementById("focusMergeBestButton"),
      providerIntelligenceStatus: document.getElementById("focusProviderIntelligenceStatus"),
      providerIntelligenceResults: document.getElementById("focusProviderIntelligenceResults"),
      trailerHeading: document.getElementById("focusTrailerHeading"),
      trailerCopy: document.getElementById("focusTrailerCopy"),
      trailerStage: document.getElementById("focusTrailerStage"),
      trailerForm: document.getElementById("focusTrailerForm"),
      trailerUrlInput: document.getElementById("focusTrailerUrlInput"),
      trailerProvider: document.getElementById("focusTrailerProvider"),
      trailerRemoveButton: document.getElementById("focusTrailerRemoveButton"),
      trailerSearchLink: document.getElementById("focusTrailerSearchLink"),
      trailerOpenLink: document.getElementById("focusTrailerOpenLink"),
      trailerFindButton: document.getElementById("focusTrailerFindButton"),
      trailerResults: document.getElementById("focusTrailerResults"),
      trailerYouTubeSearch: document.getElementById("focusTrailerYouTubeSearch"),
      trailerSteamSearch: document.getElementById("focusTrailerSteamSearch"),
      trailerGoogleSearch: document.getElementById("focusTrailerGoogleSearch"),
      trailerStatus: document.getElementById("focusTrailerStatus"),
      playabilityScore: document.getElementById("focusPlayabilityScore"),
      patchStatus: document.getElementById("focusPatchStatus"),
      patchCurrent: document.getElementById("focusPatchCurrent"),
      patchSearchButton: document.getElementById("focusPatchSearchButton"),
      patchOpenLink: document.getElementById("focusPatchOpenLink"),
      patchSearchPanel: document.getElementById("focusPatchSearchPanel"),
      patchSearchForm: document.getElementById("focusPatchSearchForm"),
      patchProvider: document.getElementById("focusPatchProvider"),
      patchCategory: document.getElementById("focusPatchCategory"),
      patchStatusRow: document.getElementById("focusPatchStatusRow"),
      patchResults: document.getElementById("focusPatchResults"),
      patchLinkForm: document.getElementById("focusPatchLinkForm"),
      patchUrlInput: document.getElementById("focusPatchUrlInput"),
      patchLinkProvider: document.getElementById("focusPatchLinkProvider"),
      patchRemoveButton: document.getElementById("focusPatchRemoveButton"),
      artworkSource: document.getElementById("focusArtworkSource"),
      artworkType: document.getElementById("focusArtworkType"),
      artworkResolution: document.getElementById("focusArtworkResolution"),
      artworkLock: document.getElementById("focusArtworkLock"),
    };

    function getTriggers() {
      return Array.from(document.querySelectorAll(".focus-card-trigger"));
    }

    function text(value, fallback = "Unknown") {
      return value === null || value === undefined || value === "" ? fallback : value;
    }

    function escapeHtml(value) {
      return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function cacheBust(src) {
      if (!src) return "";
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}live=${Date.now()}`;
    }

    function classifyArtwork(img) {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      const ratio = height ? width / height : 0;
      const cover = fields.cover;
      if (!cover) return;

      cover.classList.remove("art-portrait", "art-landscape", "art-square", "art-loaded");

      if (!ratio) {
        cover.classList.add("art-portrait");
      } else if (ratio >= 1.18) {
        cover.classList.add("art-landscape");
      } else if (ratio >= 0.86 && ratio < 1.18) {
        cover.classList.add("art-square");
      } else {
        cover.classList.add("art-portrait");
      }

      cover.style.setProperty("--focus-art-src", `url("${img.currentSrc || img.src}")`);
      cover.classList.add("art-loaded");

      if (fields.artworkResolution) {
        fields.artworkResolution.textContent = width && height ? `${width} × ${height}` : "Unknown";
      }
      if (fields.artworkType) {
        fields.artworkType.textContent = ratio >= 1.18 ? "Hero / Banner" : ratio >= 0.86 ? "Square Art" : "Box Cover";
      }
    }

    function setFocusCover(src, title) {
      if (!fields.cover) return;

      fields.cover.classList.remove("art-portrait", "art-landscape", "art-square", "art-loaded");
      fields.cover.style.removeProperty("--focus-art-src");

      if (!src) {
        fields.cover.innerHTML = `<div class="focus-cover-placeholder">🎮</div>`;
        if (fields.artworkResolution) fields.artworkResolution.textContent = "No artwork";
        if (fields.artworkType) fields.artworkType.textContent = "Placeholder";
        return;
      }

      fields.cover.innerHTML = `<img src="${src}" alt="${escapeHtml(title || "Game cover")}">`;
      const img = fields.cover.querySelector("img");
      if (!img) return;

      if (img.complete) classifyArtwork(img);
      else img.addEventListener("load", () => classifyArtwork(img), { once: true });
    }

    function setPanelBox(rect) {
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.width = `${rect.width}px`;
      panel.style.height = `${rect.height}px`;
    }

    function isMobileFocusMode() {
      return window.matchMedia("(max-width: 640px)").matches;
    }

    function getFinalPanelRect() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      if (isMobileFocusMode()) {
        return { left: 0, top: 0, width: viewportWidth, height: viewportHeight };
      }

      const sidebarWidth = viewportWidth > 1000 ? 240 : 0;
      const margin = viewportWidth > 1000 ? 44 : 18;

      return {
        left: sidebarWidth + margin,
        top: viewportWidth > 1000 ? 42 : 18,
        width: viewportWidth - sidebarWidth - (margin * 2),
        height: viewportHeight - ((viewportWidth > 1000 ? 42 : 18) * 2),
      };
    }

    function setLoading(trigger) {
      const cover = trigger.querySelector(".poster-cover");
      const placeholder = trigger.querySelector(".poster-placeholder");
      const title = trigger.querySelector(".poster-info h3")?.textContent || "Loading...";

      if (cover && fields.cover) {
        setFocusCover(cover.getAttribute("src"), title);
      } else if (placeholder && fields.cover) {
        setFocusCover("", title);
      }

      if (fields.kicker) fields.kicker.textContent = "Vaultarr Focus Mode";
      if (fields.title) fields.title.textContent = title;
      if (fields.path) fields.path.textContent = "";
      if (fields.description) fields.description.textContent = "Loading game details...";
      if (fields.metadataStatus) fields.metadataStatus.innerHTML = "";
      if (fields.metadataResults) fields.metadataResults.innerHTML = "";
      resetProviderIntelligence("Waiting for this game to load.");
    }

    function refreshOriginalCard(game) {
      if (!game) return;

      const matchingTriggers = Array.from(document.querySelectorAll(`.focus-card-trigger[data-game-id="${game.id}"]`));

      matchingTriggers.forEach((trigger) => {
        const card = trigger.querySelector(".poster-card");
        const art = trigger.querySelector(".poster-art");
        const title = trigger.querySelector(".poster-info h3");
        const info = trigger.querySelector(".poster-info p");

        if (title) title.textContent = game.title || "Untitled Game";
        if (info) {
          info.textContent = `${game.release_year ? `${game.release_year} · ` : ""}${game.size_gb || 0} GB · ${game.executable_count || 0} executable${Number(game.executable_count) === 1 ? "" : "s"}`;
        }
        if (art) {
          if (game.cover_src) {
            art.innerHTML = `<div class="poster-gloss"></div><img class="poster-cover" src="${cacheBust(game.cover_src)}" alt="${escapeHtml(game.title)}">`;
          } else {
            art.innerHTML = `<div class="poster-gloss"></div><div class="poster-placeholder">🎮</div>`;
          }
        }
        if (card) card.classList.add("metadata-flash");
        window.setTimeout(() => card && card.classList.remove("metadata-flash"), 700);
      });
    }

    function populate(game) {
      if (activeGameId && String(game.id) !== String(activeGameId)) return;
      activeGame = game;

      if (fields.cover) {
        if (game.cover_src) setFocusCover(cacheBust(game.cover_src), game.title);
        else setFocusCover("", game.title);
      }

      if (fields.kicker) fields.kicker.textContent = game.metadata_source ? `${game.metadata_source} Metadata` : `${game.source_type || (game.manual_entry ? "Manual" : "Scanned")} Library Entry`;
      if (fields.title) fields.title.textContent = text(game.title, "Untitled Game");
      if (fields.path) fields.path.textContent = text(game.path, "Path unknown");
      if (fields.description) fields.description.textContent = text(game.description, "No description yet. Use the Metadata tab to search and apply a match without leaving this card.");

      if (fields.size) fields.size.textContent = `${game.size_gb || 0} GB`;
      if (fields.files) fields.files.textContent = text(game.file_count, "0");
      if (fields.executables) fields.executables.textContent = text(game.executable_count, "0");
      if (fields.category) fields.category.textContent = text(game.category, "Unsorted");
      if (fields.sourceType) fields.sourceType.textContent = text(game.source_type || (game.manual_entry ? "Manual" : "Scanned"));
      if (fields.lockStatus) fields.lockStatus.textContent = game.metadata_locked ? "Locked" : "Unlocked";
      if (fields.artworkSource) fields.artworkSource.textContent = game.metadata_source || (game.cover_src ? "Local" : "None");
      if (fields.artworkLock) fields.artworkLock.textContent = game.metadata_locked ? "Locked" : "Unlocked";

      if (fields.developer) fields.developer.textContent = text(game.developer);
      if (fields.publisher) fields.publisher.textContent = text(game.publisher);
      if (fields.year) fields.year.textContent = text(game.release_year);
      if (fields.genre) fields.genre.textContent = text(game.genre);
      if (fields.platform) fields.platform.textContent = text(game.platform);
      if (fields.source) fields.source.textContent = game.metadata_source ? `${game.metadata_source} #${game.metadata_external_id || ""}` : "None";
      if (fields.metadataLink) fields.metadataLink.href = `/games/${game.id}`;
      if (fields.metadataQuery) fields.metadataQuery.value = game.title || "";
      resetProviderIntelligence("Analyze provider quality for this game.");

      if (fields.preservationScore) fields.preservationScore.textContent = `${game.preservation_score ?? "—"}%`;
      if (fields.preservationBadge) fields.preservationBadge.textContent = game.preservation_badge || "Incomplete";
      if (fields.preservationExecutable) fields.preservationExecutable.textContent = (game.executable_count || 0) > 0 ? "✓ Executable detected" : "⚠ No executable detected";
      if (fields.preservationCover) fields.preservationCover.textContent = game.cover_path ? "✓ Cover art saved" : "⚠ Missing cover art";
      if (fields.preservationMetadata) fields.preservationMetadata.textContent = game.metadata_source ? "✓ Metadata matched" : "⚠ Needs metadata match";
      if (fields.preservationDocumentation) fields.preservationDocumentation.textContent = (game.manual_count || 0) || game.manual_url ? `✓ Manual source: ${game.manual_count || 0} local, ${game.manual_url ? "1 linked" : "0 linked"}` : "⚠ Missing manual source";
      if (fields.manualSource) fields.manualSource.textContent = game.manual_file_src ? `Downloaded Manual: ${game.manual_file_name || game.manual_file_path || "Saved PDF"}` : game.manual_url ? `${game.manual_provider || "Linked Manual"}: ${game.manual_url}` : `${game.manual_count || 0} local manuals indexed. ReadMes are optional and not required.`;
      if (fields.manualQuery) fields.manualQuery.value = game.title || "";
      if (fields.manualUrlInput) fields.manualUrlInput.value = game.manual_url || "";
      if (fields.manualLinkProvider) fields.manualLinkProvider.value = game.manual_provider || "User Link";
      if (fields.findManualLink) {
        const manualQuery = `${game.title || "game"} ${game.platform || "PC"} manual PDF`;
        fields.findManualLink.href = `https://www.google.com/search?q=${encodeURIComponent(manualQuery)}`;
      }
      if (fields.manualUrlLink) {
        fields.manualUrlLink.href = game.manual_url || game.manual_file_src || "#";
        fields.manualUrlLink.classList.toggle("disabled", !(game.manual_url || game.manual_file_src));
        fields.manualUrlLink.textContent = game.manual_file_src ? "Open Saved Manual" : game.manual_url ? "Open Linked Manual" : "No Linked Manual";
      }
      updateManualViewer(game);
      updateTrailerViewer(game);
      updatePatchPanel(game);
      loadCachedGallery();
      if (fields.preservationArchive) fields.preservationArchive.textContent = (game.archive_count || 0) || (game.installer_count || 0) || (game.disc_image_count || 0) ? `✓ Archive assets detected` : "⚠ No archive assets detected";
      if (fields.preservationAssets) {
        const assets = game.preservation_assets || [];
        fields.preservationAssets.innerHTML = assets.length
          ? assets.map(asset => `<span>${escapeHtml(asset.label)} <strong>${Number(asset.count || 0)}</strong></span>`).join("")
          : `<span>No extra assets indexed yet</span>`;
      }

      if (fields.executablesList) fields.executablesList.textContent = game.executables || "None detected";
      if (fields.lastScanned) fields.lastScanned.textContent = text(game.last_scanned, "Never");
      refreshOriginalCard(game);
    }

    function scatterCards(selected) {
      activeGrid = selected.closest(".focus-grid");
      if (!activeGrid) return;

      const selectedRect = selected.getBoundingClientRect();
      const selectedCenterX = selectedRect.left + selectedRect.width / 2;
      const selectedCenterY = selectedRect.top + selectedRect.height / 2;

      getTriggers().forEach((trigger) => {
        const isSelected = trigger === selected;
        trigger.classList.toggle("is-selected", isSelected);

        if (isSelected) {
          trigger.style.setProperty("--scatter-x", "0px");
          trigger.style.setProperty("--scatter-y", "0px");
          return;
        }

        const rect = trigger.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = centerX - selectedCenterX;
        const dy = centerY - selectedCenterY;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

        const force = Math.max(28, 128 - Math.min(distance, 700) * 0.12);
        const scatterX = (dx / distance) * force;
        const scatterY = (dy / distance) * Math.min(force * 0.36, 24);

        trigger.style.setProperty("--scatter-x", `${scatterX}px`);
        trigger.style.setProperty("--scatter-y", `${scatterY}px`);
      });

      activeGrid.classList.add("is-focusing");
    }

    async function openFocus(trigger) {
      if (isAnimating || body.classList.contains("focus-active")) return;

      stopTrailerPlayback(false);
      const gameId = trigger.dataset.gameId;
      if (!gameId) return;

      isAnimating = true;
      activeTrigger = trigger;
      activeGameId = gameId;
      activeStartRect = trigger.querySelector(".poster-card")?.getBoundingClientRect() || trigger.getBoundingClientRect();

      trigger.classList.add("is-pressing");
      window.setTimeout(() => trigger.classList.remove("is-pressing"), 180);

      const mobileFocus = isMobileFocusMode();
      if (!mobileFocus) scatterCards(trigger);
      setLoading(trigger);
      setActiveTab("overview");
      panel.scrollTop = 0;
      fields.content?.scrollTo?.({ top: 0, behavior: "instant" });

      body.classList.toggle("mobile-focus-active", mobileFocus);
      body.classList.add("focus-preparing", "focus-active");
      window.VaultarrMobile?.setBodyLock("focus", mobileFocus);
      panel.setAttribute("aria-hidden", "false");
      if (backdrop) backdrop.setAttribute("aria-hidden", "false");

      const start = activeStartRect;
      const finalRect = getFinalPanelRect();

      panel.classList.remove("is-expanded", "is-closing", "is-mobile-focus");
      panel.classList.toggle("is-mobile-focus", mobileFocus);
      panel.classList.add("is-opening");

      if (mobileFocus) {
        setPanelBox(finalRect);
        panel.getBoundingClientRect();
        requestAnimationFrame(() => {
          body.classList.remove("focus-preparing");
          panel.classList.add("is-expanded");
        });
      } else {
        setPanelBox(start);
        panel.getBoundingClientRect();
        requestAnimationFrame(() => {
          body.classList.remove("focus-preparing");
          setPanelBox(finalRect);
          panel.classList.add("is-expanded");
        });
      }

      window.setTimeout(() => { isAnimating = false; }, mobileFocus ? 260 : 560);

      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) throw new Error("Could not load game details.");
        const game = await response.json();
        populate(game);
      } catch (error) {
        if (fields.title) fields.title.textContent = "Unable to load game";
        if (fields.description) fields.description.textContent = error.message;
      }
    }

    function closeFocus() {
      if (isAnimating || !body.classList.contains("focus-active")) return;

      stopTrailerPlayback(false);
      isAnimating = true;
      const start = activeStartRect;
      const mobileFocus = panel.classList.contains("is-mobile-focus") || isMobileFocusMode();

      panel.classList.remove("is-expanded", "is-opening");
      panel.classList.add("is-closing");

      if (!mobileFocus && start) setPanelBox(start);

      window.setTimeout(() => {
        body.classList.remove("focus-active", "focus-preparing", "mobile-focus-active");
        window.VaultarrMobile?.setBodyLock("focus", false);
        panel.classList.remove("is-closing", "is-mobile-focus");
        panel.setAttribute("aria-hidden", "true");
        panel.removeAttribute("style");

        if (backdrop) backdrop.setAttribute("aria-hidden", "true");
        if (activeGrid) activeGrid.classList.remove("is-focusing");

        getTriggers().forEach((trigger) => {
          trigger.classList.remove("is-selected");
          trigger.style.removeProperty("--scatter-x");
          trigger.style.removeProperty("--scatter-y");
        });

        activeTrigger = null;
        activeStartRect = null;
        activeGameId = null;
        activeGame = null;
        activeGrid = null;
        isAnimating = false;

        document.dispatchEvent(new CustomEvent("vaultarr:focus-closed"));
      }, mobileFocus ? 220 : 470);
    }

    function setActiveTab(tabName) {
      const currentActive = document.querySelector(".focus-tab.active")?.dataset?.tab || "";
      if (currentActive === "trailer" && tabName !== "trailer") {
        stopTrailerPlayback(false);
      }
      if (tabName === "trailer") {
        restoreTrailerPlaybackIfNeeded();
      }

      document.querySelectorAll(".focus-tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".focus-tab-panel").forEach((item) => item.classList.remove("active"));
      const tab = document.querySelector(`.focus-tab[data-tab="${tabName}"]`);
      const tabPanel = document.getElementById(`focusTab-${tabName}`);
      if (tab) tab.classList.add("active");
      if (tabPanel) tabPanel.classList.add("active");
    }

    function renderMetadataLogs(logs = []) {
      if (!fields.metadataStatus) return;
      if (!logs.length) {
        fields.metadataStatus.innerHTML = "";
        return;
      }
      fields.metadataStatus.innerHTML = logs.map(log => `
        <div class="metadata-provider-pill ${escapeHtml(log.status || "")}">
          <strong>${escapeHtml(log.provider || "Provider")}</strong>
          <span>${escapeHtml(log.message || "")}</span>
        </div>
      `).join("");
    }

    function renderMetadataResults(results = []) {
      if (!fields.metadataResults) return;
      if (!results.length) {
        fields.metadataResults.innerHTML = `<div class="metadata-empty">No matches found. Try a different title or provider.</div>`;
        return;
      }

      fields.metadataResults.innerHTML = results.map(result => `
        <article class="metadata-live-card" data-source="${escapeHtml(result.source)}" data-external-id="${escapeHtml(result.external_id)}">
          <div class="metadata-live-art">
            ${result.cover_url ? `<img src="${escapeHtml(result.cover_url)}" alt="${escapeHtml(result.title)}">` : `<span>🎮</span>`}
          </div>
          <div class="metadata-live-body">
            <div class="metadata-live-topline">
              <span class="metadata-provider-badge">${escapeHtml(result.source)}</span>
              <span class="metadata-confidence">${Number(result.confidence || 0)}%</span>
            </div>
            <h3>${escapeHtml(result.title)}</h3>
            <p class="muted">#${escapeHtml(result.external_id)}</p>
            <p>${escapeHtml(result.description || "No preview available.")}</p>
            <div class="metadata-card-actions">
              <button class="metadata-preview-button" type="button" data-source="${escapeHtml(result.source)}" data-external-id="${escapeHtml(result.external_id)}">Preview Changes</button>
              <button class="metadata-apply-button secondary" type="button" data-source="${escapeHtml(result.source)}" data-external-id="${escapeHtml(result.external_id)}">Apply Now</button>
            </div>
            <div class="metadata-preview-panel" aria-live="polite"></div>
          </div>
        </article>
      `).join("");
    }

    function renderMetadataPreview(card, comparison) {
      const panel = card?.querySelector(".metadata-preview-panel");
      if (!panel) return;

      const rows = comparison.rows || [];
      const changes = Number(comparison.change_count || 0);

      panel.innerHTML = `
        <div class="metadata-preview-shell">
          <div class="metadata-preview-head">
            <div>
              <strong>Preview Update</strong>
              <span>${changes} field${changes === 1 ? "" : "s"} will change</span>
            </div>
            ${comparison.cover_url ? `<img src="${escapeHtml(comparison.cover_url)}" alt="Incoming cover">` : ""}
          </div>
          <div class="metadata-compare-grid">
            ${rows.map(row => `
              <div class="metadata-compare-row ${row.changed ? "changed" : ""}">
                <span>${escapeHtml(row.label)}</span>
                <div>
                  <small>Current</small>
                  <p>${escapeHtml(row.current)}</p>
                </div>
                <div>
                  <small>New</small>
                  <p>${escapeHtml(row.incoming)}</p>
                </div>
              </div>
            `).join("")}
          </div>
          <button class="metadata-apply-button confirm" type="button" data-source="${escapeHtml(comparison.source)}" data-external-id="${escapeHtml(comparison.external_id)}">Apply These Changes</button>
        </div>
      `;
    }

    async function previewMetadata(button) {
      if (!activeGameId) return;

      const source = button.dataset.source || "";
      const externalId = button.dataset.externalId || "";
      const card = button.closest(".metadata-live-card");

      button.disabled = true;
      button.textContent = "Previewing...";

      try {
        const response = await fetch(`/api/games/${activeGameId}/metadata/preview?source=${encodeURIComponent(source)}&external_id=${encodeURIComponent(externalId)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not preview metadata.");
        renderMetadataPreview(card, data.comparison || {});
        button.textContent = "Preview Changes";
        button.disabled = false;
      } catch (error) {
        button.disabled = false;
        button.textContent = "Preview Changes";
        renderMetadataLogs([{ provider: source || "Metadata", status: "error", message: error.message }]);
      }
    }



    function renderGalleryStatus(message, status = "ok") {
      if (!fields.galleryStatus) return;
      fields.galleryStatus.innerHTML = `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Gallery</strong><span>${escapeHtml(message)}</span></span>`;
    }

    function isCoverCandidate(item) {
      const role = String(item?.media_role || item?.media_type || "").toLowerCase();
      const title = String(item?.title || "").toLowerCase();
      return role === "box_cover" || role === "cover" || role === "box art" || title.includes("front cover") || title.includes("box front") || title.includes("cover");
    }

    function renderCoverManager(items = []) {
      if (!fields.coverManagerCurrent || !fields.coverCandidates) return;

      const currentSrc = activeGame?.cover_src || "";
      fields.coverManagerCurrent.innerHTML = currentSrc ? `
        <div class="cover-manager-current-card">
          <img src="${escapeHtml(currentSrc)}" alt="${escapeHtml(activeGame?.title || "Current cover")}">
          <div>
            <span class="metadata-provider-badge">Current</span>
            <strong>${escapeHtml(activeGame?.title || "Library Cover")}</strong>
            <small>${escapeHtml(activeGame?.metadata_source || "Vaultarr")}</small>
          </div>
        </div>
      ` : `<div class="gallery-empty compact">No cover selected yet.</div>`;

      const seen = new Set();
      const candidates = [];
      for (const item of items || []) {
        const src = item?.src || item?.url || item?.remote_url || "";
        if (!src || seen.has(src.split("?")[0])) continue;
        if (!isCoverCandidate(item)) continue;
        seen.add(src.split("?")[0]);
        candidates.push(item);
      }

      if (fields.coverManagerStatus) {
        fields.coverManagerStatus.textContent = candidates.length ? `${candidates.length} alternate cover${candidates.length === 1 ? "" : "s"}` : "Current cover";
      }

      if (!candidates.length) {
        fields.coverCandidates.innerHTML = `<div class="gallery-empty compact">No alternate covers cached yet. Search media providers to find more covers.</div>`;
        return;
      }

      fields.coverCandidates.innerHTML = candidates.slice(0, 36).map((item, index) => {
        const src = item.src || item.url || item.remote_url || "";
        const score = item.cover_score ? `${item.cover_score}` : (item.confidence ? `${item.confidence}%` : "Cover");
        const isCurrent = currentSrc && src.split("?")[0] && currentSrc.split("?")[0].includes(src.split("/").pop().split("?")[0]);
        return `
          <button class="cover-candidate-card ${isCurrent ? "current" : ""}" type="button"
            data-cover-url="${escapeHtml(src)}"
            data-provider="${escapeHtml(item.provider || "Cover Manager")}"
            data-cover-type="${escapeHtml(item.media_role || item.media_type || "box_cover")}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(item.title || "Cover candidate")}" loading="lazy">
            <span>${escapeHtml(item.provider || "Media")}${isCurrent ? " · Current" : ""}</span>
            <strong>${escapeHtml(item.title || "Cover")}</strong>
            <small>${escapeHtml(item.media_role || item.media_type || "cover")} · ${escapeHtml(score)}</small>
          </button>
        `;
      }).join("");
    }



    async function uploadManualCover(event) {
      if (!activeGameId || !fields.coverUploadInput) return;
      const file = fields.coverUploadInput.files && fields.coverUploadInput.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith("image/")) {
        renderGalleryStatus("Choose a JPG, PNG, or WebP image.", "error");
        fields.coverUploadInput.value = "";
        return;
      }

      const form = new FormData();
      form.append("cover", file);
      form.append("provider", "Manual Upload");
      form.append("cover_type", "box_cover");

      renderGalleryStatus("Uploading manual cover...");
      fields.coverUploadInput.disabled = true;

      try {
        const response = await fetch(`/api/games/${activeGameId}/cover/upload`, {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not upload cover.");
        populate(data.game);
        refreshOriginalCard(data.game);
        renderGalleryStatus("Manual cover uploaded and saved as preferred cover.");
        await loadCachedGallery();
      } catch (error) {
        renderGalleryStatus(error.message || "Could not upload cover.", "error");
      } finally {
        fields.coverUploadInput.disabled = false;
        fields.coverUploadInput.value = "";
      }
    }

    async function setLibraryCover(button) {
      if (!activeGameId || !button) return;
      const url = button.dataset.coverUrl || button.dataset.url || "";
      const provider = button.dataset.provider || "Cover Manager";
      if (!url) return;
      button.disabled = true;
      const oldText = button.textContent;
      button.textContent = "Setting cover...";
      try {
        const response = await fetch(`/api/games/${activeGameId}/cover/set`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, provider, cover_type: button.dataset.coverType || "box_cover" }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not set cover.");
        populate(data.game);
        refreshOriginalCard(data.game);
        renderGalleryStatus("Preferred library cover saved. Build Best Record will not overwrite it.");
        await loadCachedGallery();
      } catch (error) {
        renderGalleryStatus(error.message || "Could not set cover.", "error");
        button.disabled = false;
        button.textContent = oldText || "Set as Cover";
      }
    }

    function showGalleryPreview(item) {
      if (!fields.galleryStage || !item) return;
      const src = item.src || item.url || item.remote_url || "";
      fields.galleryStage.innerHTML = `
        <div class="gallery-preview-card">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(item.title || "Gallery image")}" loading="lazy">
          <div class="gallery-preview-info">
            <div>
              <span class="metadata-provider-badge">${escapeHtml(item.provider || "Media")}</span>
              <strong>${escapeHtml(item.title || item.media_type || "Gallery Image")}</strong>
              <small>${escapeHtml(item.media_type || "image")}${item.width || item.height ? ` · ${item.width || "?"} × ${item.height || "?"}` : ""}${item.cached ? " · Cached" : ""}</small>
            </div>
            <div class="gallery-preview-actions">
              <a class="button-link secondary small" href="${escapeHtml(src)}" target="_blank" rel="noopener">Open Full Size</a>
              <button class="gallery-set-cover-button secondary-button small" type="button" data-cover-url="${escapeHtml(src)}" data-provider="${escapeHtml(item.provider || "Media")}">Set as Cover</button>
              ${item.cached ? `<button class="gallery-remove-button danger small" type="button" data-asset-id="${escapeHtml(item.id || "")}">Remove Cached</button><a class="button-link secondary small" href="${escapeHtml(src)}" download>Download</a>` : `<button class="gallery-cache-button" type="button" data-url="${escapeHtml(src)}" data-title="${escapeHtml(item.title || "Gallery Image")}" data-provider="${escapeHtml(item.provider || "Media")}" data-media-type="${escapeHtml(item.media_type || "screenshot")}">Cache Image</button>`}
            </div>
          </div>
        </div>
      `;
    }

    function renderGalleryThumbs(container, results = [], activeIndex = 0) {
      if (!container) return;
      if (!results.length) {
        container.innerHTML = "";
        container.__vaultarrGalleryItems = [];
        return;
      }
      container.innerHTML = results.map((item, index) => {
        const src = item.src || item.url || item.remote_url || "";
        return `
          <button class="gallery-thumb ${index === activeIndex ? "active" : ""}" type="button"
            data-index="${index}"
            data-src="${escapeHtml(src)}"
            data-title="${escapeHtml(item.title || "Gallery Image")}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(item.title || "Gallery image")}" loading="lazy">
            <span>${escapeHtml(item.provider || "Media")}${item.cached ? " · Cached" : ""}</span>
          </button>
        `;
      }).join("");
      container.__vaultarrGalleryItems = results;
    }

    function renderCachedGallery(cached = []) {
      if (fields.gallerySavedCount) fields.gallerySavedCount.textContent = `${cached.length} cached`;
      renderCoverManager(cached);

      if (!cached.length) {
        if (fields.galleryStage) fields.galleryStage.innerHTML = `<div class="gallery-empty">No cached gallery images yet. Use Search More Media to find screenshots and artwork.</div>`;
        renderGalleryThumbs(fields.gallerySaved, []);
        return;
      }

      showGalleryPreview(cached[0]);
      renderGalleryThumbs(fields.gallerySaved, cached, 0);
    }

    async function loadCachedGallery() {
      if (!activeGameId) return;
      try {
        const response = await fetch(`/api/games/${activeGameId}/media/cached`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not load cached gallery.");
        renderCachedGallery(data.cached || []);
        renderGalleryStatus(`${data.cache_count || 0} cached gallery image${Number(data.cache_count || 0) === 1 ? "" : "s"}.`);
      } catch (error) {
        renderGalleryStatus(error.message || "Could not load cached gallery.", "error");
      }
    }

    function renderGalleryResults(results = []) {
      if (!fields.galleryResults) return;
      if (!results.length) {
        fields.galleryResults.innerHTML = `<div class="metadata-empty">No provider images found. Try another provider or apply metadata first.</div>`;
        fields.galleryResults.__vaultarrGalleryItems = [];
        return;
      }
      renderGalleryThumbs(fields.galleryResults, results, -1);
    }

    function toggleGallerySearch(forceOpen = null) {
      if (!fields.gallerySearchPanel) return;
      const isOpen = fields.gallerySearchPanel.classList.contains("open");
      const next = forceOpen === null ? !isOpen : Boolean(forceOpen);
      fields.gallerySearchPanel.classList.toggle("open", next);
      fields.gallerySearchPanel.setAttribute("aria-hidden", next ? "false" : "true");
      if (fields.gallerySearchButton) fields.gallerySearchButton.textContent = next ? "Hide Media Search" : "Search More Media";
    }

    async function searchGallery(event) {
      if (event) event.preventDefault();
      if (!activeGameId) return;
      toggleGallerySearch(true);
      const provider = fields.galleryProvider?.value || "all";
      renderGalleryStatus("Searching media providers...");
      if (fields.galleryResults) fields.galleryResults.innerHTML = `<div class="metadata-empty">Searching gallery providers...</div>`;
      try {
        const response = await fetch(`/api/games/${activeGameId}/media/search?provider=${encodeURIComponent(provider)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Gallery search failed.");
        const cached = data.cached || [];
        const results = data.results || [];
        renderCachedGallery(cached);
        renderCoverManager([...(cached || []), ...(results || [])]);
        renderGalleryStatus(`${cached.length} cached · ${results.length} provider image${results.length === 1 ? "" : "s"} available.`);
        renderGalleryResults(results);
      } catch (error) {
        renderGalleryStatus(error.message || "Gallery search failed.", "error");
        if (fields.galleryResults) fields.galleryResults.innerHTML = `<div class="metadata-empty warning-text">${escapeHtml(error.message)}</div>`;
      }
    }

    async function removeCachedGalleryImage(button) {
      if (!activeGameId || !button) return;
      const assetId = button.dataset.assetId || "";
      if (!assetId) return;
      button.disabled = true;
      button.textContent = "Removing...";
      try {
        const response = await fetch(`/api/games/${activeGameId}/media/${encodeURIComponent(assetId)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove cached media.");
        renderGalleryStatus("Cached media removed from this game.");
        await loadCachedGallery();
      } catch (error) {
        renderGalleryStatus(error.message || "Could not remove cached media.", "error");
        button.disabled = false;
        button.textContent = "Remove Cached";
      }
    }

    async function clearGameMediaCache() {
      if (!activeGameId) return;
      if (!confirm("Clear all cached media assets for this game? Covers selected as the active library cover are not removed from the cover folder.")) return;
      if (fields.galleryClearButton) {
        fields.galleryClearButton.disabled = true;
        fields.galleryClearButton.textContent = "Clearing...";
      }
      try {
        const response = await fetch(`/api/games/${activeGameId}/media/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ media_type: "all" }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not clear cache.");
        renderGalleryStatus(`Cleared ${data.deleted || 0} cached media asset${Number(data.deleted || 0) === 1 ? "" : "s"}.`);
        await loadCachedGallery();
      } catch (error) {
        renderGalleryStatus(error.message || "Could not clear cache.", "error");
      } finally {
        if (fields.galleryClearButton) {
          fields.galleryClearButton.disabled = false;
          fields.galleryClearButton.textContent = "Clear Game Cache";
        }
      }
    }

    async function cacheGalleryImage(button) {
      if (!activeGameId || !button) return;
      button.disabled = true;
      button.textContent = "Caching...";
      try {
        const response = await fetch(`/api/games/${activeGameId}/media/cache`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: button.dataset.url || "",
            title: button.dataset.title || "Gallery Image",
            provider: button.dataset.provider || "Media",
            media_type: button.dataset.mediaType || "screenshot",
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not cache image.");
        renderGalleryStatus("Image cached into the local Vaultarr media archive.");
        await loadCachedGallery();
        if (button.closest(".gallery-provider-grid")) button.closest(".gallery-thumb")?.remove();
      } catch (error) {
        renderGalleryStatus(error.message || "Could not cache image.", "error");
        button.disabled = false;
        button.textContent = "Cache Image";
      }
    }


    function renderPatchStatus(message, status = "ok") {
      if (!fields.patchStatusRow) return;
      fields.patchStatusRow.innerHTML = message ? `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Patch Engine</strong><span>${escapeHtml(message)}</span></span>` : "";
    }

    function updatePatchPanel(game) {
      if (fields.playabilityScore) fields.playabilityScore.textContent = `${game?.playability_score ?? 0}%`;
      if (fields.patchStatus) fields.patchStatus.textContent = game?.patch_status || "Needs review";
      if (fields.patchUrlInput) fields.patchUrlInput.value = game?.patch_url || "";
      if (fields.patchLinkProvider) fields.patchLinkProvider.value = game?.patch_provider || "PCGamingWiki";
      if (fields.patchOpenLink) {
        fields.patchOpenLink.href = game?.patch_url || "#";
        fields.patchOpenLink.classList.toggle("disabled", !game?.patch_url);
      }
      if (fields.patchCurrent) {
        if (game?.patch_url) {
          fields.patchCurrent.innerHTML = `
            <div class="patch-current-layout">
              <div>
                <p class="eyebrow">Saved Fix Reference</p>
                <h3>${escapeHtml(game.patch_title || "Patch/Fix Reference")}</h3>
                <p class="muted">${escapeHtml(game.patch_provider || "Patch Engine")} · ${escapeHtml(game.patch_category || "Compatibility")}</p>
                ${game.patch_notes ? `<p>${escapeHtml(game.patch_notes)}</p>` : ""}
              </div>
              <a class="button-link secondary small" href="${escapeHtml(game.patch_url)}" target="_blank" rel="noopener">Open Reference</a>
            </div>
          `;
        } else {
          fields.patchCurrent.innerHTML = `
            <div class="patch-empty-state">
              <strong>No patch reference saved yet.</strong>
              <p class="muted">Use Find Fixes to discover PCGamingWiki pages, widescreen notes, unofficial updates, and community recommendations.</p>
            </div>
          `;
        }
      }
      if (fields.patchResults) fields.patchResults.innerHTML = `<div class="metadata-empty">Search patch providers to find compatibility notes and community fixes.</div>`;
      renderPatchStatus("");
    }

    function togglePatchSearch(forceOpen = null) {
      if (!fields.patchSearchPanel) return;
      const open = forceOpen === null ? fields.patchSearchPanel.getAttribute("aria-hidden") === "true" : forceOpen;
      fields.patchSearchPanel.setAttribute("aria-hidden", open ? "false" : "true");
      fields.patchSearchPanel.classList.toggle("is-open", open);
      if (fields.patchSearchButton) fields.patchSearchButton.textContent = open ? "Hide Fix Search" : "Find Fixes";
    }

    function renderPatchResults(results = []) {
      if (!fields.patchResults) return;
      if (!results.length) {
        fields.patchResults.innerHTML = `<div class="metadata-empty">No patch/fix candidates found. Try another provider or use Advanced to save a trusted reference URL.</div>`;
        return;
      }
      fields.patchResults.innerHTML = results.map(item => `
        <article class="patch-result-card ${item.recommended ? "recommended" : ""}"
          data-url="${escapeHtml(item.url || "")}"
          data-provider="${escapeHtml(item.provider || "Patch Engine")}"
          data-title="${escapeHtml(item.title || "Patch/Fix Reference")}"
          data-category="${escapeHtml(item.category || "Compatibility")}"
          data-notes="${escapeHtml(item.description || "")}">
          <div class="patch-result-topline">
            <span class="metadata-provider-badge">${escapeHtml(item.provider || "Provider")}</span>
            <strong>${Number(item.confidence || 0)}%</strong>
          </div>
          <h3>${escapeHtml(item.title || "Patch/Fix Reference")}</h3>
          <p class="muted">${escapeHtml(item.description || "Community fix or patch reference.")}</p>
          <div class="patch-tag-row">
            ${(item.tags || []).slice(0, 5).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="patch-result-actions">
            ${item.url ? `<a class="button-link secondary small" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open</a>` : ""}
            ${item.url ? `<button class="patch-save-button" type="button">Save Reference</button>` : ""}
          </div>
        </article>
      `).join("");
    }

    async function searchPatches(event) {
      if (event) event.preventDefault();
      if (!activeGameId) return;
      togglePatchSearch(true);
      renderPatchStatus("Searching patch providers...");
      if (fields.patchResults) fields.patchResults.innerHTML = `<div class="metadata-empty">Scanning PCGamingWiki and community sources...</div>`;
      try {
        const provider = fields.patchProvider?.value || "all";
        const category = fields.patchCategory?.value || "all";
        const response = await fetch(`/api/games/${activeGameId}/patches/search?provider=${encodeURIComponent(provider)}&category=${encodeURIComponent(category)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Patch search failed.");
        renderPatchResults(data.results || []);
        renderPatchStatus(data.message || "Patch search complete.");
      } catch (error) {
        renderPatchResults([]);
        renderPatchStatus(error.message || "Patch search failed.", "error");
      }
    }

    async function savePatchReferenceFromCard(card) {
      if (!activeGameId || !card) return;
      await savePatchReference({
        patch_url: card.dataset.url || "",
        patch_provider: card.dataset.provider || "Patch Engine",
        patch_title: card.dataset.title || "Patch/Fix Reference",
        patch_category: card.dataset.category || "Compatibility",
        patch_notes: card.dataset.notes || "",
      });
    }

    async function savePatchReference(payload) {
      if (!activeGameId) return;
      if (!payload.patch_url) {
        renderPatchStatus("Provide a patch or fix reference URL first.", "error");
        return;
      }
      renderPatchStatus("Saving patch/fix reference...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/patch-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save patch reference.");
        populate(data.game);
        renderPatchStatus("Patch/fix reference saved.");
      } catch (error) {
        renderPatchStatus(error.message || "Could not save patch reference.", "error");
      }
    }

    async function savePatchFromAdvanced(event) {
      event.preventDefault();
      await savePatchReference({
        patch_url: fields.patchUrlInput?.value?.trim() || "",
        patch_provider: fields.patchLinkProvider?.value || "Patch Engine",
        patch_title: `${activeGame?.title || "Game"} Patch/Fix Reference`,
        patch_category: "Compatibility",
        patch_notes: "Manually saved patch or fix reference.",
      });
    }

    async function removePatchReference() {
      if (!activeGameId) return;
      renderPatchStatus("Removing patch/fix reference...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/patch-remove`, { method: "POST" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove patch reference.");
        populate(data.game);
        renderPatchStatus("Patch/fix reference removed.");
      } catch (error) {
        renderPatchStatus(error.message || "Could not remove patch reference.", "error");
      }
    }

    function renderTrailerStatus(message, status = "ok") {
      if (!fields.trailerStatus) return;
      fields.trailerStatus.innerHTML = message ? `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Trailer</strong><span>${escapeHtml(message)}</span></span>` : "";
    }

    let trailerPlaybackSuspended = false;

    function stopTrailerPlayback(showPaused = true) {
      if (!fields.trailerStage) return;
      const iframe = fields.trailerStage.querySelector("iframe.trailer-frame");
      if (!iframe) return;

      iframe.dataset.pausedSrc = iframe.getAttribute("src") || "";
      iframe.setAttribute("src", "about:blank");
      trailerPlaybackSuspended = true;

      if (showPaused) {
        fields.trailerStage.innerHTML = `
          <div class="trailer-paused-card">
            <span>Ⅱ</span>
            <strong>Trailer paused</strong>
            <p class="muted">Playback pauses automatically when leaving the Trailer tab.</p>
            <button class="button-link secondary small" type="button" id="focusTrailerResumeButton">Resume Trailer</button>
          </div>
        `;
        const resumeButton = document.getElementById("focusTrailerResumeButton");
        if (resumeButton) resumeButton.addEventListener("click", () => {
          trailerPlaybackSuspended = false;
          updateTrailerViewer(activeGame);
          setActiveTab("trailer");
        });
      }
    }

    function restoreTrailerPlaybackIfNeeded() {
      if (!trailerPlaybackSuspended) return;
      trailerPlaybackSuspended = false;
      updateTrailerViewer(activeGame);
    }

    function updateTrailerSearchLinks(game) {
      const title = game?.title || activeGame?.title || "game";
      const platform = game?.platform || activeGame?.platform || "";
      const trailerQuery = `${title} ${platform} official trailer`.trim();
      const encoded = encodeURIComponent(trailerQuery);
      if (fields.trailerSearchLink) fields.trailerSearchLink.href = `https://www.youtube.com/results?search_query=${encoded}`;
      if (fields.trailerYouTubeSearch) fields.trailerYouTubeSearch.href = `https://www.youtube.com/results?search_query=${encoded}`;
      if (fields.trailerSteamSearch) fields.trailerSteamSearch.href = `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`;
      if (fields.trailerGoogleSearch) fields.trailerGoogleSearch.href = `https://www.google.com/search?q=${encoded}`;
    }

    function getYouTubeVideoId(url = "") {
      const value = String(url || "");
      const patterns = [
        /youtu\.be\/([A-Za-z0-9_-]{6,})/,
        /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
        /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
        /[?&]v=([A-Za-z0-9_-]{6,})/,
      ];
      for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
      }
      return "";
    }

    function getTrailerThumbnail(url = "", embed = "") {
      const id = getYouTubeVideoId(url) || getYouTubeVideoId(embed);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    }
    function trailerAutoplaySrc(embed = "") {
      if (!embed) return "";
      const separator = embed.includes("?") ? "&" : "?";
      return `${embed}${separator}autoplay=1`;
    }

    function renderCinematicTrailerPoster({ title, provider, url, embed }) {
      const thumb = getTrailerThumbnail(url, embed);
      const background = thumb ? `style="--trailer-thumb: url('${escapeHtml(thumb)}')"` : "";
      fields.trailerStage.innerHTML = `
        <div class="cinematic-poster" ${background}>
          <div class="cinematic-poster-bg"></div>
          <button class="cinematic-play" type="button" id="focusTrailerPlayButton" aria-label="Play ${escapeHtml(title)}">
            <span>▶</span>
          </button>
          <div class="cinematic-trailer-info">
            <p class="eyebrow">${escapeHtml(provider || "Trailer")}</p>
            <strong>${escapeHtml(title)}</strong>
            <span>Saved trailer · ready to play inside Vaultarr</span>
          </div>
        </div>
      `;
      const playButton = document.getElementById("focusTrailerPlayButton");
      if (playButton) {
        playButton.addEventListener("click", () => {
          trailerPlaybackSuspended = false;
          fields.trailerStage.innerHTML = `
            <div class="trailer-frame-shell cinematic-frame-shell">
              <iframe class="trailer-frame" src="${escapeHtml(trailerAutoplaySrc(embed))}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          `;
        });
      }
    }

    function updateTrailerViewer(game) {
      if (!fields.trailerStage) return;
      updateTrailerSearchLinks(game);
      const url = game?.trailer_url || "";
      const embed = game?.trailer_embed_src || game?.trailer_embed_url || "";
      const provider = game?.trailer_provider || "YouTube";
      const title = game?.trailer_title || `${game?.title || "Game"} Trailer`;

      if (fields.trailerHeading) fields.trailerHeading.textContent = title;
      if (fields.trailerUrlInput) fields.trailerUrlInput.value = url;
      if (fields.trailerProvider && provider) fields.trailerProvider.value = provider;
      if (fields.trailerOpenLink) {
        fields.trailerOpenLink.href = url || "#";
        fields.trailerOpenLink.classList.toggle("disabled", !url);
      }

      if (!url) {
        if (fields.trailerCopy) fields.trailerCopy.textContent = "Find an official trailer or add one manually under Advanced.";
        fields.trailerStage.innerHTML = `
          <div class="cinematic-empty">
            <span>▶</span>
            <strong>No trailer selected</strong>
            <p class="muted">Use Change Trailer to find likely candidates inside Vaultarr.</p>
          </div>
        `;
        if (fields.trailerResults) fields.trailerResults.innerHTML = `<div class="trailer-candidate-empty">Use Change Trailer to search likely matches inside Vaultarr.</div>`;
        renderTrailerStatus("");
        return;
      }

      if (!embed) {
        if (fields.trailerCopy) fields.trailerCopy.textContent = `${provider} trailer link saved. This source opens externally.`;
        fields.trailerStage.innerHTML = `
          <div class="trailer-external-card cinematic-external-card">
            <span>▶</span>
            <strong>External Trailer Saved</strong>
            <p class="muted">This source cannot be embedded safely, but it is saved to the game record.</p>
            <a class="button-link secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open Trailer</a>
          </div>
        `;
        renderTrailerStatus("External trailer link saved.");
        return;
      }

      if (fields.trailerCopy) fields.trailerCopy.textContent = `${provider} trailer saved. Press play when you are ready.`;
      renderCinematicTrailerPoster({ title, provider, url, embed });
      renderTrailerStatus(`${provider} trailer ready.`);
    }



    function renderTrailerCandidates(results = []) {
      if (!fields.trailerResults) return;
      if (!results.length) {
        fields.trailerResults.innerHTML = `<div class="trailer-candidate-empty">No likely trailer candidates found. Try the external YouTube search or paste a URL manually.</div>`;
        return;
      }
      fields.trailerResults.innerHTML = results.map((result) => `
        <article class="trailer-candidate-card" data-url="${escapeHtml(result.url)}" data-embed="${escapeHtml(result.embed_url || "")}" data-title="${escapeHtml(result.title)}" data-provider="${escapeHtml(result.provider || result.source || "YouTube")}">
          <button class="trailer-candidate-preview" type="button" aria-label="Preview ${escapeHtml(result.title)}">
            <span class="trailer-thumb">
              ${result.thumbnail ? `<img src="${escapeHtml(result.thumbnail)}" alt="${escapeHtml(result.title)}">` : `<span>▶</span>`}
              <i>▶</i>
            </span>
          </button>
          <div class="trailer-candidate-body">
            <div class="trailer-candidate-topline">
              <span>${escapeHtml(result.source || "YouTube")}</span>
              <strong>${Number(result.confidence || 0)}%</strong>
            </div>
            <h4>${escapeHtml(result.title)}</h4>
            <p>${escapeHtml([result.duration, result.published, result.reason].filter(Boolean).join(" · "))}</p>
            <div class="trailer-candidate-actions">
              <button class="secondary-button trailer-preview-button" type="button">Preview</button>
              <button class="trailer-set-button" type="button">Set as Trailer</button>
            </div>
          </div>
        </article>
      `).join("");
    }

    function previewTrailerCandidate(card) {
      if (!card || !fields.trailerStage) return;
      stopTrailerPlayback(false);
      trailerPlaybackSuspended = false;
      const title = card.dataset.title || "Trailer Preview";
      const embed = card.dataset.embed || "";
      const url = card.dataset.url || "";
      if (fields.trailerHeading) fields.trailerHeading.textContent = title;
      if (embed) {
        fields.trailerStage.innerHTML = `
          <div class="trailer-frame-shell">
            <iframe class="trailer-frame" src="${escapeHtml(trailerAutoplaySrc(embed))}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        `;
      } else {
        fields.trailerStage.innerHTML = `
          <div class="trailer-external-card">
            <span>▶</span>
            <strong>${escapeHtml(title)}</strong>
            <p class="muted">This result opens externally.</p>
            <a class="button-link secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open Trailer</a>
          </div>
        `;
      }
      renderTrailerStatus("Previewing trailer candidate. Use Set as Trailer to save it.");
    }

    async function findTrailerCandidates() {
      if (!activeGameId) return;
      if (fields.trailerFindButton) {
        fields.trailerFindButton.disabled = true;
        fields.trailerFindButton.textContent = "Searching...";
      }
      if (fields.trailerResults) fields.trailerResults.innerHTML = `<div class="trailer-candidate-empty">Searching likely trailer candidates...</div>`;
      renderTrailerStatus("Searching YouTube for likely official trailers...");
      const gameId = activeGameId;
      try {
        const response = await fetch(`/api/games/${gameId}/trailer/search`);
        const data = await response.json();
        if (String(gameId) !== String(activeGameId)) return;
        if (!response.ok || !data.success) throw new Error(data.message || "Trailer search failed.");
        renderTrailerCandidates(data.results || []);
        renderTrailerStatus(data.message || "Trailer search complete.");
      } catch (error) {
        renderTrailerCandidates([]);
        renderTrailerStatus(error.message || "Trailer search failed.", "error");
      } finally {
        if (fields.trailerFindButton) {
          fields.trailerFindButton.disabled = false;
          fields.trailerFindButton.textContent = "Change Trailer";
        }
      }
    }

    async function saveTrailerCandidate(card) {
      if (!activeGameId || !card) return;
      const trailerUrl = card.dataset.url || "";
      const trailerProvider = card.dataset.provider || "YouTube";
      const trailerTitle = card.dataset.title || `${activeGame?.title || "Game"} Trailer`;
      if (!trailerUrl) return;
      renderTrailerStatus("Saving selected trailer...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/trailer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailer_url: trailerUrl, trailer_provider: trailerProvider, trailer_title: trailerTitle }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save trailer.");
        populate(data.game);
        setActiveTab("trailer");
        renderTrailerStatus("Trailer saved from finder.");
      } catch (error) {
        renderTrailerStatus(error.message || "Could not save trailer.", "error");
      }
    }

    async function saveTrailer(event) {
      event.preventDefault();
      if (!activeGameId) return;
      const trailerUrl = fields.trailerUrlInput?.value?.trim() || "";
      const trailerProvider = fields.trailerProvider?.value || "YouTube";
      if (!trailerUrl) {
        renderTrailerStatus("Paste a trailer URL first.", "error");
        return;
      }
      renderTrailerStatus("Saving trailer to this game record...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/trailer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailer_url: trailerUrl, trailer_provider: trailerProvider, trailer_title: `${activeGame?.title || "Game"} Trailer` }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save trailer.");
        populate(data.game);
        setActiveTab("trailer");
        renderTrailerStatus("Trailer saved.");
      } catch (error) {
        renderTrailerStatus(error.message || "Could not save trailer.", "error");
      }
    }

    async function removeTrailer() {
      if (!activeGameId) return;
      renderTrailerStatus("Removing saved trailer...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/trailer/remove`, { method: "POST" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove trailer.");
        populate(data.game);
        setActiveTab("trailer");
        renderTrailerStatus("Trailer removed.");
      } catch (error) {
        renderTrailerStatus(error.message || "Could not remove trailer.", "error");
      }
    }


    function renderManualStatus(message, status = "ok") {
      if (!fields.manualStatus) return;
      fields.manualStatus.innerHTML = `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Manuals</strong><span>${escapeHtml(message)}</span></span>`;
    }


    function manualStatusLabel(game) {
      if (game.manual_status === "downloaded_pdf") return "Downloaded PDF available";
      if (game.manual_status === "invalid_pdf") return "Saved file is invalid or missing";
      if (game.manual_status === "linked_pdf") return "Linked PDF URL saved";
      if (game.manual_status === "linked_source") return "Source page saved";
      return "No manual saved";
    }

    function updateManualViewer(game) {
      const hasDownloadedPdf = Boolean(game.manual_file_src && Number(game.manual_file_valid || 0));
      const hasFile = Boolean(game.manual_file_src);
      const hasLinkedUrl = Boolean(game.manual_url);
      const isPdfCandidate = Boolean(game.manual_url_is_pdf_candidate);

      if (fields.manualSavedLink) {
        fields.manualSavedLink.href = hasFile ? game.manual_file_src : "#";
        fields.manualSavedLink.classList.toggle("disabled", !hasFile);
        fields.manualSavedLink.textContent = hasFile ? "Open PDF in Browser" : "No Downloaded PDF";
      }
      if (fields.manualSourcePageLink) {
        fields.manualSourcePageLink.href = hasLinkedUrl ? game.manual_url : "#";
        fields.manualSourcePageLink.classList.toggle("disabled", !hasLinkedUrl);
      }
      if (fields.manualDownloadButton) {
        fields.manualDownloadButton.disabled = hasLinkedUrl && !isPdfCandidate;
        fields.manualDownloadButton.title = hasLinkedUrl && !isPdfCandidate ? "Saved manual link is a source/search page. Open it and copy the direct PDF URL first." : "Download direct PDF into Vaultarr";
      }
      if (fields.manualRemoveButton) {
        fields.manualRemoveButton.disabled = !hasFile && !hasLinkedUrl;
      }

      if (!fields.manualViewer) return;

      if (hasDownloadedPdf) {
        const viewerSrc = game.manual_file_viewer_src || `${game.manual_file_src}#toolbar=0&navpanes=0&scrollbar=0`;
        fields.manualViewer.innerHTML = `
          <div class="manual-reader-shell vault-reader-shell">
            <div class="vault-reader-toolbar">
              <div class="vault-reader-title">
                <span class="metadata-provider-badge">Manual</span>
                <strong>${escapeHtml(game.manual_file_name || "Saved Manual")}</strong>
                <small>${escapeHtml(manualStatusLabel(game))}${game.manual_file_size_mb ? ` · ${game.manual_file_size_mb} MB` : ""}</small>
              </div>
              <div class="vault-reader-actions">
                <a class="secondary-button" href="${escapeHtml(game.manual_file_src)}" target="_blank" rel="noopener">Open externally</a>
                <a class="secondary-button" href="${escapeHtml(game.manual_file_src)}" download>Download</a>
              </div>
            </div>
            <div class="vault-reader-stage">
              <iframe class="manual-reader-frame vault-reader-frame" src="${escapeHtml(viewerSrc)}" title="${escapeHtml(game.title || "Manual")}"></iframe>
            </div>
          </div>
        `;
      } else if (hasFile) {
        fields.manualViewer.innerHTML = `
          <div class="manual-reader-state warning">
            <strong>Downloaded file is not a valid PDF.</strong>
            <p>Vaultarr found a saved manual file, but it does not look like a readable PDF. Re-download using a direct PDF URL.</p>
          </div>
        `;
      } else if (hasLinkedUrl && !isPdfCandidate) {
        fields.manualViewer.innerHTML = `
          <div class="manual-reader-state linked">
            <strong>Manual source page saved.</strong>
            <p>This link looks like a webpage or search result, not a direct PDF. Open the source page, copy the direct PDF URL, then download it into Vaultarr.</p>
            <a class="button-link secondary small" href="${escapeHtml(game.manual_url)}" target="_blank" rel="noopener">Open Source Page →</a>
          </div>
        `;
      } else if (hasLinkedUrl) {
        fields.manualViewer.innerHTML = `
          <div class="manual-reader-state ready">
            <strong>Linked PDF ready to download.</strong>
            <p>Vaultarr can download this direct PDF into the local manual archive and display it here.</p>
          </div>
        `;
      } else {
        fields.manualViewer.innerHTML = `<div class="manual-reader-empty">No downloaded manual yet. Paste a direct PDF URL, or save a source page and copy the direct PDF from there.</div>`;
      }
    }

    async function downloadManual() {
      const manualUrl = fields.manualUrlInput?.value?.trim() || activeGame?.manual_url || "";
      const manualProvider = fields.manualLinkProvider?.value || activeGame?.manual_provider || "Downloaded Manual";
      await downloadManualFromUrl(manualUrl, manualProvider);
    }

    async function removeManual() {
      if (!activeGameId) return;
      renderManualStatus("Removing manual from this game record...", "");
      try {
        const response = await fetch(`/api/games/${activeGameId}/manual-remove`, { method: "POST" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove manual.");
        populate(data.game);
        renderManualStatus("Manual removed from this game record.");
      } catch (error) {
        renderManualStatus(error.message || "Could not remove manual.", "error");
      }
    }

    function renderManualResults(results = []) {
      if (!fields.manualResults) return;
      if (!results.length) {
        fields.manualResults.innerHTML = `<div class="metadata-empty">No manual providers returned results.</div>`;
        return;
      }
      fields.manualResults.innerHTML = results.map(result => {
        const isDirectPdf = Boolean(result.is_pdf_candidate || result.kind === "direct_pdf");
        return `
          <article class="manual-provider-card ${isDirectPdf ? "direct-pdf" : "source-page"}">
            <div>
              <div class="metadata-live-topline">
                <span class="metadata-provider-badge">${escapeHtml(result.provider)}</span>
                <span class="metadata-confidence">${Number(result.confidence || 0)}%</span>
              </div>
              <h3>${escapeHtml(result.title)}</h3>
              <p class="muted">${escapeHtml(result.description || "")}</p>
              ${isDirectPdf ? `<p class="manual-direct-url">${escapeHtml(result.url)}</p>` : ""}
            </div>
            <div class="manual-provider-actions">
              ${result.url ? `<a class="button-link secondary small" href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${escapeHtml(isDirectPdf ? "Open PDF" : (result.action || "Open"))}</a>` : `<span class="metadata-provider-pill ok"><strong>Local</strong><span>Use asset scan</span></span>`}
              ${isDirectPdf ? `<button class="manual-download-result-button" type="button" data-url="${escapeHtml(result.url)}" data-provider="${escapeHtml(result.provider)}">Download to Vaultarr</button>` : ""}
              ${isDirectPdf ? `<button class="manual-use-link-button secondary-button" type="button" data-url="${escapeHtml(result.url)}" data-provider="${escapeHtml(result.provider)}">Use Direct PDF</button>` : ""}
              ${(!isDirectPdf && result.url) ? `<button class="manual-use-link-button secondary-button" type="button" data-url="${escapeHtml(result.url)}" data-provider="${escapeHtml(result.provider)}">Save Source Page</button>` : ""}
            </div>
          </article>
        `;
      }).join("");
    }

    async function downloadManualFromUrl(manualUrl = "", manualProvider = "Downloaded Manual") {
      if (!activeGameId) return;
      manualUrl = manualUrl || fields.manualUrlInput?.value?.trim() || activeGame?.manual_url || "";
      if (!manualUrl) {
        renderManualStatus("Paste or select a direct PDF manual URL first.", "error");
        return;
      }
      if (fields.manualDownloadButton) {
        fields.manualDownloadButton.disabled = true;
        fields.manualDownloadButton.textContent = "Downloading...";
      }
      renderManualStatus("Downloading direct PDF into Vaultarr...", "");
      try {
        const response = await fetch(`/api/games/${activeGameId}/manual-download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manual_url: manualUrl, manual_provider: manualProvider }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Manual download failed.");
        populate(data.game);
        renderManualStatus("Manual downloaded, verified, and injected into the in-app viewer.");
      } catch (error) {
        renderManualStatus(error.message || "Manual download failed.", "error");
      } finally {
        if (fields.manualDownloadButton) {
          fields.manualDownloadButton.disabled = false;
          fields.manualDownloadButton.textContent = "Download PDF";
        }
      }
    }

    async function searchManuals(event) {
      event.preventDefault();
      if (!activeGameId) return;
      let query = fields.manualQuery?.value?.trim() || activeGame?.title || "";
      if (activeGame?.title && query.toLowerCase().includes((activeGame.platform || "").toLowerCase()) && query.length > activeGame.title.length + 8) {
        query = activeGame.title;
      }
      const provider = fields.manualProvider?.value || "all";
      renderManualStatus("Searching manual providers...", "");
      if (fields.manualResults) fields.manualResults.innerHTML = `<div class="metadata-empty">Searching manual providers...</div>`;
      try {
        const response = await fetch(`/api/games/${activeGameId}/manuals/search?query=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Manual search failed.");
        renderManualStatus(`${(data.results || []).length} manual provider results ready.`);
        renderManualResults(data.results || []);
      } catch (error) {
        renderManualStatus(error.message || "Manual search failed.", "error");
        if (fields.manualResults) fields.manualResults.innerHTML = `<div class="metadata-empty warning-text">${escapeHtml(error.message)}</div>`;
      }
    }

    async function saveManualLink(event, overrideUrl = "", overrideProvider = "") {
      if (event) event.preventDefault();
      if (!activeGameId) return;
      const manualUrl = overrideUrl || fields.manualUrlInput?.value?.trim() || "";
      const manualProvider = overrideProvider || fields.manualLinkProvider?.value || "User Link";
      if (!manualUrl) {
        renderManualStatus("Paste a manual URL or save a provider search link first.", "error");
        return;
      }
      renderManualStatus("Saving manual link...", "");
      try {
        const response = await fetch(`/api/games/${activeGameId}/manual-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manual_url: manualUrl, manual_provider: manualProvider }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save manual link.");
        populate(data.game);
        renderManualStatus("Manual link saved and preservation score updated.");
      } catch (error) {
        renderManualStatus(error.message || "Could not save manual link.", "error");
      }
    }


    function renderProviderIntelligenceStatus(status, message) {
      if (!fields.providerIntelligenceStatus) return;
      fields.providerIntelligenceStatus.innerHTML = `<span class="metadata-provider-pill ${escapeHtml(status || "ok")}"><strong>Intelligence</strong><span>${escapeHtml(message || "")}</span></span>`;
    }


    function resetProviderIntelligence(message = "Analyze provider quality for this game.") {
      if (fields.providerIntelligenceStatus) {
        fields.providerIntelligenceStatus.innerHTML = `<span class="metadata-provider-pill ok"><strong>Intelligence</strong><span>${escapeHtml(message)}</span></span>`;
      }
      if (fields.providerIntelligenceResults) {
        fields.providerIntelligenceResults.innerHTML = `<div class="metadata-empty">Provider Intelligence is ready for the current game. Click Analyze Providers to compare sources.</div>`;
      }
    }

    function renderProviderIntelligence(data) {
      if (!fields.providerIntelligenceResults) return;
      const providers = data.providers || [];
      const rows = data.merge_plan?.rows || [];
      const recommended = data.recommended;

      if (!providers.length) {
        fields.providerIntelligenceResults.innerHTML = `<div class="metadata-empty">No provider intelligence available. Try syncing LaunchBox or configuring IGDB/RAWG first.</div>`;
        return;
      }

      const providerHtml = providers.map(provider => `
        <article class="provider-quality-card ${recommended && recommended.source === provider.source ? "recommended" : ""}">
          <div class="provider-quality-topline">
            <span class="metadata-provider-badge">${escapeHtml(provider.source)}</span>
            <strong>${Number(provider.quality || 0)}%</strong>
          </div>
          <h3>${escapeHtml(provider.title || provider.source)}</h3>
          <p class="muted">Completeness ${Number(provider.completeness || 0)}% · Match ${Number(provider.confidence || 0)}%</p>
          <div class="provider-field-grid">
            ${(provider.fields || []).map(field => `
              <span class="${field.present ? "has-field" : "missing-field"}">${field.present ? "✓" : "□"} ${escapeHtml(field.label)}</span>
            `).join("")}
          </div>
        </article>
      `).join("");

      const mergeHtml = rows.map(row => `
        <div class="merge-row ${row.recommended ? "has-recommendation" : ""}">
          <span>${escapeHtml(row.label)}</span>
          <div>
            <small>Recommended</small>
            <p>${escapeHtml(row.recommended || "—")}</p>
          </div>
          <strong>${escapeHtml(row.source || "—")}</strong>
        </div>
      `).join("");

      fields.providerIntelligenceResults.innerHTML = `
        <div class="provider-quality-grid">${providerHtml}</div>
        <div class="merge-best-panel">
          <div class="merge-best-head">
            <strong>Build Best Record</strong>
            <span>Vaultarr chooses the highest-quality field from each provider.</span>
          </div>
          <div class="merge-best-grid">${mergeHtml}</div>
        </div>
      `;
    }

    async function analyzeProviders() {
      if (!activeGameId) return;
      const requestGameId = String(activeGameId);
      const query = fields.metadataQuery?.value?.trim() || activeGame?.title || "";
      renderProviderIntelligenceStatus("ok", "Analyzing provider quality...");
      if (fields.providerIntelligenceResults) fields.providerIntelligenceResults.innerHTML = `<div class="metadata-empty">Comparing metadata providers...</div>`;
      try {
        const response = await fetch(`/api/games/${requestGameId}/provider-intelligence?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (String(activeGameId) !== requestGameId) return;
        if (!response.ok || !data.success) throw new Error(data.message || "Provider intelligence failed.");
        renderProviderIntelligenceStatus("ok", `${(data.providers || []).length} provider profile${(data.providers || []).length === 1 ? "" : "s"} analyzed.`);
        renderProviderIntelligence(data);
      } catch (error) {
        renderProviderIntelligenceStatus("error", error.message);
        if (fields.providerIntelligenceResults) fields.providerIntelligenceResults.innerHTML = `<div class="metadata-empty warning-text">${escapeHtml(error.message)}</div>`;
      }
    }

    const bestRecordSteps = [
      { key: "analysis", label: "Analyzing providers", detail: "Comparing LaunchBox, IGDB, RAWG, Steam, and other metadata sources." },
      { key: "metadata", label: "Selecting best metadata", detail: "Choosing the strongest title, description, genre, developer, publisher, platform, and release year." },
      { key: "cover", label: "Choosing box cover", detail: "Using Media Intelligence to avoid screenshots, heroes, and logos as cover art." },
      { key: "gallery", label: "Caching gallery images", detail: "Saving top screenshot and artwork candidates into the local media cache." },
      { key: "manual", label: "Checking manual provider", detail: "Looking for a high-confidence indexed manual match." },
      { key: "preservation", label: "Refreshing preservation score", detail: "Updating archive score, badges, and collector display state." },
      { key: "validation", label: "Final validation", detail: "Refreshing the card with the completed best record." },
    ];

    function renderBuildProgress(activeIndex = 0, completed = false, message = "") {
      if (!fields.providerIntelligenceResults) return;
      const safeIndex = Math.max(0, Math.min(bestRecordSteps.length - 1, activeIndex));
      const progress = completed ? 100 : Math.min(96, Math.round(((safeIndex + 0.45) / bestRecordSteps.length) * 100));
      const current = bestRecordSteps[safeIndex];
      const statusMessage = message || (completed ? "Vaultarr finished merging, enriching, and refreshing this game." : current.detail);
      const taskText = completed ? "✓ Final validation complete" : `${current.label}...`;

      let panel = fields.providerIntelligenceResults.querySelector(".best-record-progress-panel.sleek");
      const needsNewPanel = !panel || panel.dataset.completed === "1" || panel.dataset.failed === "1";

      if (needsNewPanel) {
        fields.providerIntelligenceResults.innerHTML = `
          <section class="best-record-progress-panel sleek ${completed ? "complete" : "running"}" data-step-key="${escapeHtml(current.key)}" data-completed="${completed ? "1" : "0"}">
            <div class="best-record-progress-head">
              <div>
                <p class="eyebrow">Provider Intelligence</p>
                <h3 data-build-title>${completed ? "Best Record Complete" : "Building Best Record"}</h3>
                <p class="muted" data-build-message>${escapeHtml(statusMessage)}</p>
              </div>
              <strong data-build-percent>${progress}%</strong>
            </div>
            <div class="best-record-progress-bar"><i data-build-fill style="width:${progress}%;"></i></div>
            <div class="best-record-stream smooth">
              <span class="best-record-loading" data-build-task>${escapeHtml(taskText)}</span>
            </div>
          </section>
        `;
        return;
      }

      panel.classList.toggle("complete", completed);
      panel.classList.toggle("running", !completed);
      panel.dataset.completed = completed ? "1" : "0";

      const fill = panel.querySelector("[data-build-fill]");
      const percent = panel.querySelector("[data-build-percent]");
      const title = panel.querySelector("[data-build-title]");
      const task = panel.querySelector("[data-build-task]");
      const messageEl = panel.querySelector("[data-build-message]");

      if (fill) window.requestAnimationFrame(() => { fill.style.width = `${progress}%`; });
      if (percent) percent.textContent = `${progress}%`;
      if (title) title.textContent = completed ? "Best Record Complete" : "Building Best Record";

      const updateSoftText = (el, value) => {
        if (!el || el.textContent === value) return;
        el.classList.add("is-soft-changing");
        window.setTimeout(() => {
          el.textContent = value;
          el.classList.remove("is-soft-changing");
        }, 180);
      };

      if (panel.dataset.stepKey !== current.key || completed) {
        panel.dataset.stepKey = current.key;
        updateSoftText(task, taskText);
      }
      updateSoftText(messageEl, statusMessage);
    }

    function summarizeBuildResult(data) {
      const enrichment = data?.enrichment || {};
      const lines = ["Metadata merged"];
      if (enrichment.cover_cached) lines.push("cover cached");
      if (enrichment.cached_media) lines.push(`${enrichment.cached_media} gallery image${Number(enrichment.cached_media) === 1 ? "" : "s"} cached`);
      if (enrichment.manual_downloaded) lines.push("manual downloaded");
      if (enrichment.errors && enrichment.errors.length) lines.push(`${enrichment.errors.length} non-critical warning${enrichment.errors.length === 1 ? "" : "s"}`);
      return lines.join(" · ");
    }

    async function mergeBestFields() {
      if (!activeGameId) return;
      const requestGameId = String(activeGameId);
      const query = fields.metadataQuery?.value?.trim() || activeGame?.title || "";
      let progressIndex = 0;
      let progressTimer = null;

      renderProviderIntelligenceStatus("ok", "Building best record...");
      renderBuildProgress(0, false);
      if (fields.mergeBestButton) fields.mergeBestButton.disabled = true;
      if (fields.providerIntelligenceButton) fields.providerIntelligenceButton.disabled = true;

      progressTimer = window.setInterval(() => {
        if (progressIndex < bestRecordSteps.length - 2) {
          progressIndex += 1;
          renderBuildProgress(progressIndex, false);
          renderProviderIntelligenceStatus("ok", bestRecordSteps[progressIndex].label + "...");
        }
      }, 950);

      try {
        const response = await fetch(`/api/games/${requestGameId}/provider-intelligence/merge-best`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, enrich: true }),
        });
        const data = await response.json();
        if (String(activeGameId) !== requestGameId) return;
        if (!response.ok || !data.success) throw new Error(data.message || "Merge failed.");
        window.clearInterval(progressTimer);
        renderBuildProgress(bestRecordSteps.length - 1, true, summarizeBuildResult(data));
        populate(data.game);
        renderProviderIntelligenceStatus("ok", data.message || "Best fields merged and enrichment complete.");
        if (data.enrichment?.cached_media) loadCachedGallery();
        window.setTimeout(() => {
          if (String(activeGameId) !== requestGameId) return;
          if (data.intelligence) renderProviderIntelligence(data.intelligence);
        }, 1200);
      } catch (error) {
        window.clearInterval(progressTimer);
        renderProviderIntelligenceStatus("error", error.message);
        if (fields.providerIntelligenceResults) {
          fields.providerIntelligenceResults.innerHTML = `
            <section class="best-record-progress-panel failed">
              <div class="best-record-progress-head">
                <div>
                  <p class="eyebrow">Provider Intelligence</p>
                  <h3>Build Failed</h3>
                  <p class="muted">${escapeHtml(error.message || "Build Best Record failed.")}</p>
                </div>
                <strong>!</strong>
              </div>
            </section>
          `;
        }
      } finally {
        if (fields.mergeBestButton) fields.mergeBestButton.disabled = false;
        if (fields.providerIntelligenceButton) fields.providerIntelligenceButton.disabled = false;
      }
    }

    async function searchMetadata(event) {
      event.preventDefault();
      if (!activeGameId || !fields.metadataResults) return;

      const query = fields.metadataQuery?.value?.trim() || activeGame?.title || "";
      const provider = fields.metadataProvider?.value || "all";

      fields.metadataResults.innerHTML = `<div class="metadata-empty">Searching metadata providers...</div>`;
      if (fields.metadataStatus) fields.metadataStatus.innerHTML = "";

      try {
        const response = await fetch(`/api/games/${activeGameId}/metadata/search?query=${encodeURIComponent(query)}&provider=${encodeURIComponent(provider)}`);
        if (!response.ok) throw new Error("Metadata search failed.");
        const data = await response.json();
        renderMetadataLogs(data.logs || []);
        renderMetadataResults(data.results || []);
      } catch (error) {
        fields.metadataResults.innerHTML = `<div class="metadata-empty warning-text">${escapeHtml(error.message)}</div>`;
      }
    }

    async function applyMetadata(button) {
      if (!activeGameId) return;
      const source = button.dataset.source || "";
      const externalId = button.dataset.externalId || "";
      button.disabled = true;
      button.textContent = "Applying...";

      try {
        const response = await fetch(`/api/games/${activeGameId}/metadata/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, external_id: externalId }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not apply metadata.");
        let updatedGame = data.game;
        try {
          const refreshResponse = await fetch(`/api/games/${activeGameId}?live=${Date.now()}`);
          if (refreshResponse.ok) updatedGame = await refreshResponse.json();
        } catch (_) {}
        populate(updatedGame);
        renderMetadataLogs([{ provider: source, status: "ok", message: "Metadata applied and game card updated instantly." }]);
        if (fields.metadataResults) fields.metadataResults.innerHTML = "";
        setActiveTab("overview");
      } catch (error) {
        button.disabled = false;
        button.textContent = "Apply Metadata";
        renderMetadataLogs([{ provider: source || "Metadata", status: "error", message: error.message }]);
      }
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".focus-card-trigger");
      if (!trigger) return;

      // Game cards are rendered as <button> elements, so do not treat
      // the trigger button itself as an interactive child to ignore.
      // Only ignore nested controls inside an expanded/metadata area.
      const nestedInput = event.target.closest("input, select, textarea, a");
      if (nestedInput && trigger.contains(nestedInput)) return;

      const nestedButton = event.target.closest("button");
      if (nestedButton && nestedButton !== trigger) return;

      openFocus(trigger);
    });

    if (closeButton) closeButton.addEventListener("click", closeFocus);
    if (backdrop) backdrop.addEventListener("click", closeFocus);
    if (fields.metadataForm) fields.metadataForm.addEventListener("submit", searchMetadata);
    if (fields.providerIntelligenceButton) fields.providerIntelligenceButton.addEventListener("click", analyzeProviders);
    if (fields.mergeBestButton) fields.mergeBestButton.addEventListener("click", mergeBestFields);
    if (fields.manualSearchForm) fields.manualSearchForm.addEventListener("submit", searchManuals);
    if (fields.manualLinkForm) fields.manualLinkForm.addEventListener("submit", saveManualLink);
    if (fields.trailerForm) fields.trailerForm.addEventListener("submit", saveTrailer);
    if (fields.trailerRemoveButton) fields.trailerRemoveButton.addEventListener("click", removeTrailer);
    if (fields.trailerFindButton) fields.trailerFindButton.addEventListener("click", findTrailerCandidates);
    if (fields.patchSearchButton) fields.patchSearchButton.addEventListener("click", () => searchPatches());
    if (fields.patchSearchForm) fields.patchSearchForm.addEventListener("submit", searchPatches);
    if (fields.patchLinkForm) fields.patchLinkForm.addEventListener("submit", savePatchFromAdvanced);
    if (fields.patchRemoveButton) fields.patchRemoveButton.addEventListener("click", removePatchReference);
    if (fields.patchResults) {
      fields.patchResults.addEventListener("click", (event) => {
        const card = event.target.closest(".patch-result-card");
        if (!card) return;
        if (event.target.closest(".patch-save-button")) savePatchReferenceFromCard(card);
      });
    }
    if (fields.trailerResults) {
      fields.trailerResults.addEventListener("click", (event) => {
        const card = event.target.closest(".trailer-candidate-card");
        if (!card) return;
        if (event.target.closest(".trailer-set-button")) {
          saveTrailerCandidate(card);
          return;
        }
        if (event.target.closest(".trailer-preview-button, .trailer-candidate-preview")) {
          previewTrailerCandidate(card);
        }
      });
    }
    if (fields.gallerySearchForm) fields.gallerySearchForm.addEventListener("submit", searchGallery);
    if (fields.gallerySearchButton) fields.gallerySearchButton.addEventListener("click", () => toggleGallerySearch());
    if (fields.coverSearchButton) fields.coverSearchButton.addEventListener("click", () => searchGallery());
    if (fields.coverUploadInput) fields.coverUploadInput.addEventListener("change", uploadManualCover);
    if (fields.galleryClearButton) fields.galleryClearButton.addEventListener("click", clearGameMediaCache);
    if (fields.manualDownloadButton) fields.manualDownloadButton.addEventListener("click", downloadManual);
    if (fields.manualRemoveButton) fields.manualRemoveButton.addEventListener("click", removeManual);
    if (fields.manualResults) {
      fields.manualResults.addEventListener("click", (event) => {
        const downloadButton = event.target.closest(".manual-download-result-button");
        if (downloadButton) {
          event.preventDefault();
          downloadManualFromUrl(downloadButton.dataset.url || "", downloadButton.dataset.provider || "Manual Provider");
          return;
        }
        const button = event.target.closest(".manual-use-link-button");
        if (button) saveManualLink(event, button.dataset.url || "", button.dataset.provider || "Manual Provider");
      });
    }
    function bindGalleryThumbClicks(container) {
      if (!container) return;
      container.addEventListener("click", (event) => {
        const button = event.target.closest(".gallery-thumb");
        if (!button) return;
        const items = container.__vaultarrGalleryItems || [];
        const item = items[Number(button.dataset.index || 0)];
        document.querySelectorAll(".gallery-thumb").forEach((thumb) => thumb.classList.remove("active"));
        button.classList.add("active");
        showGalleryPreview(item);
      });
    }
    bindGalleryThumbClicks(fields.gallerySaved);
    bindGalleryThumbClicks(fields.galleryResults);
    document.addEventListener("click", (event) => {
      const coverButton = event.target.closest(".gallery-set-cover-button, .cover-candidate-card");
      if (coverButton) {
        setLibraryCover(coverButton);
        return;
      }
      const removeButton = event.target.closest(".gallery-remove-button");
      if (removeButton) {
        removeCachedGalleryImage(removeButton);
        return;
      }
      const cacheButton = event.target.closest(".gallery-cache-button");
      if (cacheButton) cacheGalleryImage(cacheButton);
    });
    if (fields.metadataResults) {
      fields.metadataResults.addEventListener("click", (event) => {
        const previewButton = event.target.closest(".metadata-preview-button");
        if (previewButton) {
          previewMetadata(previewButton);
          return;
        }
        const applyButton = event.target.closest(".metadata-apply-button");
        if (applyButton) applyMetadata(applyButton);
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("focus-active")) closeFocus();
    });

    document.querySelectorAll(".focus-tab").forEach((tab) => {
      tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
    });

    function openRequestedGameFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const gameId = params.get("open");
      if (!gameId) return;

      window.setTimeout(() => {
        const trigger = document.querySelector(`.focus-card-trigger[data-game-id="${CSS.escape(gameId)}"]`);
        if (trigger && !document.body.classList.contains("focus-active")) {
          trigger.click();
        }
      }, 120);
    }

    document.addEventListener("vaultarr:page-loaded", openRequestedGameFromUrl);
    openRequestedGameFromUrl();

  });
})();
