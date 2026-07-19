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
    let emulationProfile = null;
    let emulationIsRunning = false;
    let emulationPreviousScrollTop = 0;
    let selectedAcquisition = null;
    let acquisitionDownloadPollTimer = null;

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
      overviewGallery: document.getElementById("focusOverviewGallery"),
      overviewGalleryOpen: document.getElementById("focusOverviewGalleryOpen"),
      overviewTrailer: document.getElementById("focusOverviewTrailer"),
      overviewTrailerOpen: document.getElementById("focusOverviewTrailerOpen"),
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
      soundtrackHeading: document.getElementById("focusSoundtrackHeading"),
      soundtrackCopy: document.getElementById("focusSoundtrackCopy"),
      soundtrackStage: document.getElementById("focusSoundtrackStage"),
      soundtrackForm: document.getElementById("focusSoundtrackForm"),
      soundtrackUrlInput: document.getElementById("focusSoundtrackUrlInput"),
      soundtrackProvider: document.getElementById("focusSoundtrackProvider"),
      soundtrackRemoveButton: document.getElementById("focusSoundtrackRemoveButton"),
      soundtrackOpenLink: document.getElementById("focusSoundtrackOpenLink"),
      soundtrackFindButton: document.getElementById("focusSoundtrackFindButton"),
      soundtrackSearchProvider: document.getElementById("focusSoundtrackSearchProvider"),
      soundtrackFinderPanel: document.getElementById("focusSoundtrackFinderPanel"),
      soundtrackResults: document.getElementById("focusSoundtrackResults"),
      soundtrackYouTubeSearch: document.getElementById("focusSoundtrackYouTubeSearch"),
      soundtrackMusicSearch: document.getElementById("focusSoundtrackMusicSearch"),
      soundtrackKHInsiderSearch: document.getElementById("focusSoundtrackKHInsiderSearch"),
      soundtrackGoogleSearch: document.getElementById("focusSoundtrackGoogleSearch"),
      soundtrackStatus: document.getElementById("focusSoundtrackStatus"),
      soundtrackUploadInput: document.getElementById("focusSoundtrackUploadInput"),
      soundtrackUploadStatus: document.getElementById("focusSoundtrackUploadStatus"),
      soundtrackDirectUrl: document.getElementById("focusSoundtrackDirectUrl"),
      soundtrackPermission: document.getElementById("focusSoundtrackPermission"),
      soundtrackDownloadButton: document.getElementById("focusSoundtrackDownloadButton"),
      soundtrackDownloadProgress: document.getElementById("focusSoundtrackDownloadProgress"),
      soundtrackDownloadFill: document.getElementById("focusSoundtrackDownloadFill"),
      soundtrackDownloadMessage: document.getElementById("focusSoundtrackDownloadMessage"),
      soundtrackDownloadPercent: document.getElementById("focusSoundtrackDownloadPercent"),
      soundtrackDropZone: document.getElementById("focusSoundtrackDropZone"),
      soundtrackAudio: document.getElementById("focusSoundtrackAudio"),
      soundtrackNowPlaying: document.getElementById("focusSoundtrackNowPlaying"),
      soundtrackNowSource: document.getElementById("focusSoundtrackNowSource"),
      soundtrackPlayerArt: document.getElementById("focusSoundtrackPlayerArt"),
      soundtrackTrackList: document.getElementById("focusSoundtrackTrackList"),
      soundtrackTrackCount: document.getElementById("focusSoundtrackTrackCount"),
      soundtrackPrevious: document.getElementById("focusSoundtrackPrevious"),
      soundtrackNext: document.getElementById("focusSoundtrackNext"),
      soundtrackShuffle: document.getElementById("focusSoundtrackShuffle"),
      soundtrackRepeat: document.getElementById("focusSoundtrackRepeat"),
      emulationHeading: document.getElementById("focusEmulationHeading"),
      emulationStatus: document.getElementById("focusEmulationStatus"),
      emulationMessage: document.getElementById("focusEmulationMessage"),
      emulationDetails: document.getElementById("focusEmulationDetails"),
      emulationStart: document.getElementById("focusEmulationStart"),
      emulationUpload: document.getElementById("focusEmulationUpload"),
      emulationReplace: document.getElementById("focusEmulationReplace"),
      emulationImportButton: document.querySelector(".emulation-import-button"),
      emulationBiosPrimary: document.getElementById("focusEmulationBiosPrimary"),
      emulationUploadStatus: document.getElementById("focusEmulationUploadStatus"),
      emulationPlayerShell: document.getElementById("focusEmulationPlayerShell"),
      emulationFrame: document.getElementById("focusEmulationFrame"),
      emulationExit: document.getElementById("focusEmulationExit"),
      emulationPlayerTitle: document.getElementById("focusEmulationPlayerTitle"),
      emulationSetup: document.getElementById("focusEmulationSetup"),
      emulationRomLabel: document.getElementById("focusEmulationRomLabel"),
      emulationRemove: document.getElementById("focusEmulationRemove"),
      emulationBiosRow: document.getElementById("focusEmulationBiosRow"),
      emulationBiosLabel: document.getElementById("focusEmulationBiosLabel"),
      emulationBios: document.getElementById("focusEmulationBios"),
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
      editGameLink: document.getElementById("focusEditGameLink"),
      refreshGameLink: document.getElementById("focusRefreshGameLink"),
      fullDetailsLink: document.getElementById("focusFullDetailsLink"),
      removeGameButton: document.getElementById("focusRemoveGameButton"),
      removeGameDialog: document.getElementById("focusRemoveGameDialog"),
      removeGameTitle: document.getElementById("focusRemoveGameTitle"),
      removeIgnorePath: document.getElementById("focusRemoveIgnorePath"),
      removeCachedAssets: document.getElementById("focusRemoveCachedAssets"),
      removeCancelButton: document.getElementById("focusRemoveCancelButton"),
      removeConfirmButton: document.getElementById("focusRemoveConfirmButton"),
      removeStatus: document.getElementById("focusRemoveGameStatus"),
      acquisitionBadge: document.getElementById("focusAcquisitionBadge"),
      acquisitionCurrent: document.getElementById("focusAcquisitionCurrent"),
      acquisitionEmpty: document.getElementById("focusAcquisitionEmpty"),
      acquisitionCurrentTitle: document.getElementById("focusAcquisitionCurrentTitle"),
      acquisitionCurrentSource: document.getElementById("focusAcquisitionCurrentSource"),
      acquisitionCurrentStatus: document.getElementById("focusAcquisitionCurrentStatus"),
      acquisitionQuery: document.getElementById("focusAcquisitionQuery"),
      acquisitionProvider: document.getElementById("focusAcquisitionProvider"),
      acquisitionPlatform: document.getElementById("focusAcquisitionPlatform"),
      acquisitionSearchButton: document.getElementById("focusAcquisitionSearchButton"),
      acquisitionSearchStatus: document.getElementById("focusAcquisitionSearchStatus"),
      acquisitionResults: document.getElementById("focusAcquisitionResults"),
      acquisitionSourceInput: document.getElementById("focusAcquisitionSourcePageInput"),
      acquisitionReadSourceButton: document.getElementById("focusAcquisitionReadSourceButton"),
      acquisitionSelection: document.getElementById("focusAcquisitionSelection"),
      acquisitionSelectionTitle: document.getElementById("focusAcquisitionSelectionTitle"),
      acquisitionSelectionMeta: document.getElementById("focusAcquisitionSelectionMeta"),
      acquisitionSelectionSource: document.getElementById("focusAcquisitionSelectionSource"),
      acquisitionDownloadUrl: document.getElementById("focusAcquisitionDownloadUrl"),
      acquisitionSaveButton: document.getElementById("focusAcquisitionSaveButton"),
      acquisitionDownloadPermission: document.getElementById("focusAcquisitionDownloadPermission"),
      acquisitionDownloadButton: document.getElementById("focusAcquisitionDownloadButton"),
      acquisitionDownloadProgress: document.getElementById("focusAcquisitionDownloadProgress"),
      acquisitionDownloadMessage: document.getElementById("focusAcquisitionDownloadMessage"),
      acquisitionDownloadBytes: document.getElementById("focusAcquisitionDownloadBytes"),
      acquisitionDownloadMeter: document.getElementById("focusAcquisitionDownloadMeter"),
      acquisitionAttachForm: document.getElementById("focusAcquisitionAttachForm"),
      acquisitionLocalPath: document.getElementById("focusAcquisitionLocalPath"),
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
    }

    function setFocusCover(src, title) {
      if (!fields.cover) return;

      fields.cover.classList.remove("art-portrait", "art-landscape", "art-square", "art-loaded");
      fields.cover.style.removeProperty("--focus-art-src");

      if (!src) {
        fields.cover.innerHTML = `<div class="focus-cover-placeholder">🎮</div>`;
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

    function getFinalPanelRect() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
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


    function setAcquisitionStatus(message) {
      if (fields.acquisitionSearchStatus) fields.acquisitionSearchStatus.textContent = message || "";
    }

    function closeVaultSelects(except = null) {
      document.querySelectorAll(".vault-select.is-open").forEach((wrapper) => {
        if (wrapper === except) return;
        wrapper.classList.remove("is-open");
        wrapper.querySelector(".vault-select-trigger")?.setAttribute("aria-expanded", "false");
        wrapper.querySelector(".vault-select-menu")?.setAttribute("aria-hidden", "true");
      });
    }

    function enhanceFocusSelect(select) {
      if (!select || select.dataset.vaultSelectEnhanced === "true") return;
      select.dataset.vaultSelectEnhanced = "true";
      select.classList.add("vault-select-native");
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");

      const wrapper = document.createElement("div");
      wrapper.className = "vault-select";
      select.parentNode.insertBefore(wrapper, select);
      wrapper.append(select);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "vault-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Choose option");
      trigger.innerHTML = '<span class="vault-select-value"></span><span class="vault-select-chevron" aria-hidden="true"></span>';

      const menu = document.createElement("div");
      menu.className = "vault-select-menu";
      menu.id = `${select.id}Menu`;
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", select.getAttribute("aria-label") || "Options");
      menu.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-controls", menu.id);

      Array.from(select.options).forEach((option, optionIndex) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "vault-select-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.style.setProperty("--vault-option-delay", `${55 + (optionIndex * 45)}ms`);
        item.textContent = option.textContent;
        item.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          closeMenu(true);
        });
        menu.append(item);
      });

      wrapper.append(trigger, menu);
      const valueLabel = trigger.querySelector(".vault-select-value");

      const sync = () => {
        const selected = select.options[select.selectedIndex] || select.options[0];
        valueLabel.textContent = selected?.textContent || "Choose";
        menu.querySelectorAll(".vault-select-option").forEach((item) => {
          const isSelected = item.dataset.value === select.value;
          item.classList.toggle("is-selected", isSelected);
          item.setAttribute("aria-selected", String(isSelected));
        });
      };

      const closeMenu = (restoreFocus = false) => {
        wrapper.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
        if (restoreFocus) trigger.focus({ preventScroll: true });
      };

      const openMenu = () => {
        closeVaultSelects(wrapper);
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        menu.setAttribute("aria-hidden", "false");
        const selectedItem = menu.querySelector('.vault-select-option[aria-selected="true"]');
        if (selectedItem) menu.scrollTop = Math.max(0, selectedItem.offsetTop - 44);
      };

      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        if (wrapper.classList.contains("is-open")) closeMenu();
        else openMenu();
      });
      trigger.addEventListener("keydown", (event) => {
        if (["ArrowDown", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          openMenu();
          (menu.querySelector('.vault-select-option[aria-selected="true"]') || menu.querySelector(".vault-select-option"))?.focus({ preventScroll: true });
        }
      });
      menu.addEventListener("keydown", (event) => {
        const options = Array.from(menu.querySelectorAll(".vault-select-option"));
        const index = options.indexOf(document.activeElement);
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeMenu(true);
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          options[Math.max(0, Math.min(options.length - 1, index + direction))]?.focus({ preventScroll: true });
        }
      });
      select.addEventListener("change", sync);
      select._vaultSelectSync = sync;
      sync();
    }

    function syncFocusSelect(select) {
      if (typeof select?._vaultSelectSync === "function") select._vaultSelectSync();
    }

    function chooseAcquisition(item) {
      selectedAcquisition = item || null;
      if (!item || !fields.acquisitionSelection) return;
      fields.acquisitionSelection.hidden = false;
      if (fields.acquisitionSelectionTitle) fields.acquisitionSelectionTitle.textContent = item.title || "Selected release";
      if (fields.acquisitionSelectionMeta) fields.acquisitionSelectionMeta.textContent = [item.platform, item.region, item.version, `${item.match_score || 0}% match`].filter(Boolean).join(" · ");
      if (fields.acquisitionSelectionSource) { fields.acquisitionSelectionSource.href = item.source_page || "#"; }
      if (fields.acquisitionSourceInput) fields.acquisitionSourceInput.value = item.source_page || "";
      setAcquisitionStatus("Release selected. Open the original source to continue manually.");
    }

    function renderAcquisitionResults(items = []) {
      if (!fields.acquisitionResults) return;
      fields.acquisitionResults.replaceChildren();
      if (!items.length) {
        fields.acquisitionResults.innerHTML = `<div class="metadata-empty"><h3>No reference match found</h3><p class="muted">Try a shorter title, another source, or paste an exact supported game page below.</p></div>`;
        return;
      }
      items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "acquisition-result-card";
        const provider = item.provider || "External catalog";
        const actionLabel = item.external_search ? "Search Source" : "Open Source";
        card.innerHTML = `<div class="acquisition-result-top"><div><span class="acquisition-provider-label">${escapeHtml(provider)}</span><h3>${escapeHtml(item.title || "Unknown release")}</h3></div><span class="confidence-badge">${Number(item.match_score || 0)}%</span></div><p class="muted">${escapeHtml([item.platform, item.region, item.version].filter(Boolean).join(" · ") || "Release details available on source page")}</p><div class="acquisition-result-actions"><a class="button-link secondary" href="${escapeHtml(item.source_page || "#")}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>${item.external_search ? "" : '<button type="button" class="focus-acquisition-use">Use This Release</button>'}</div>`;
        card.querySelector(".focus-acquisition-use")?.addEventListener("click", () => chooseAcquisition(item));
        fields.acquisitionResults.append(card);
      });
    }

    async function loadAcquisition(game) {
      window.clearTimeout(acquisitionDownloadPollTimer);
      selectedAcquisition = null;
      if (fields.acquisitionQuery) fields.acquisitionQuery.value = game?.title || "";
      if (fields.acquisitionPlatform) fields.acquisitionPlatform.value = game?.platform || "";
      if (fields.acquisitionPlatform && !Array.from(fields.acquisitionPlatform.options).some((option) => option.value === fields.acquisitionPlatform.value)) fields.acquisitionPlatform.value = "";
      if (fields.acquisitionProvider) fields.acquisitionProvider.value = "all";
      syncFocusSelect(fields.acquisitionPlatform);
      syncFocusSelect(fields.acquisitionProvider);
      if (fields.acquisitionResults) fields.acquisitionResults.replaceChildren();
      if (fields.acquisitionSelection) fields.acquisitionSelection.hidden = true;
      if (fields.acquisitionCurrent) fields.acquisitionCurrent.hidden = true;
      if (fields.acquisitionEmpty) fields.acquisitionEmpty.hidden = false;
      if (fields.acquisitionBadge) fields.acquisitionBadge.textContent = "Not Configured";
      if (fields.acquisitionDownloadPermission) fields.acquisitionDownloadPermission.checked = false;
      if (fields.acquisitionDownloadProgress) fields.acquisitionDownloadProgress.hidden = true;
      syncAcquisitionDownloadButton();
      setAcquisitionStatus("Choose Find Copy to search the live reference catalog.");
      if (!game?.id) return;
      pollAcquisitionDownload(game.id);
      try {
        const response = await fetch(`/api/games/${game.id}/acquisition`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok || !data.success) return;
        const acquisition = data.acquisition;
        if (!acquisition) return;
        if (fields.acquisitionCurrent) fields.acquisitionCurrent.hidden = false;
        if (fields.acquisitionEmpty) fields.acquisitionEmpty.hidden = true;
        if (fields.acquisitionCurrentTitle) fields.acquisitionCurrentTitle.textContent = acquisition.source_title || game.title || "Saved acquisition";
        if (fields.acquisitionCurrentSource) { fields.acquisitionCurrentSource.href = acquisition.source_page || "#"; fields.acquisitionCurrentSource.hidden = !acquisition.source_page; }
        if (fields.acquisitionDownloadUrl) fields.acquisitionDownloadUrl.value = acquisition.download_url || "";
        if (fields.acquisitionSourceInput) fields.acquisitionSourceInput.value = acquisition.source_page || "";
        if (fields.acquisitionLocalPath) fields.acquisitionLocalPath.value = acquisition.local_path || "";
        const status = acquisition.local_path ? "Stored Locally" : acquisition.download_url ? "Link Ready" : acquisition.source_page ? "Source Found" : "Not Configured";
        if (fields.acquisitionBadge) fields.acquisitionBadge.textContent = status;
        if (fields.acquisitionCurrentStatus) fields.acquisitionCurrentStatus.textContent = acquisition.local_path ? `Local copy: ${acquisition.local_path}` : acquisition.download_url ? "Final link saved" : "Reference source saved";
        selectedAcquisition = { title: acquisition.source_title || game.title, platform: acquisition.platform || game.platform, region: acquisition.region || "", version: acquisition.version || "", source_page: acquisition.source_page || "", match_score: 100 };
      } catch (_) {}
    }

    async function searchAcquisition() {
      if (!activeGameId || !fields.acquisitionQuery) return;
      const term = fields.acquisitionQuery.value.trim();
      if (!term) { fields.acquisitionQuery.focus(); return; }
      const button = fields.acquisitionSearchButton;
      if (button) { button.disabled = true; button.textContent = "Searching…"; }
      setAcquisitionStatus("Searching the live reference catalog…");
      try {
        const params = new URLSearchParams({ q: term, platform: fields.acquisitionPlatform?.value.trim() || "", provider: fields.acquisitionProvider?.value || "all" });
        const response = await fetch(`/api/games/${activeGameId}/acquisition/search?${params}`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Search failed.");
        renderAcquisitionResults(data.results || []);
        const warning = (data.provider_errors || []).length ? ` ${(data.provider_errors || []).join(" ")}` : "";
        setAcquisitionStatus(`${(data.results || []).length} reference result${(data.results || []).length === 1 ? "" : "s"} found.${warning}`);
      } catch (error) { renderAcquisitionResults([]); setAcquisitionStatus(error.message); }
      finally { if (button) { button.disabled = false; button.textContent = "Find Copy"; } }
    }

    async function readAcquisitionSource() {
      if (!activeGameId || !fields.acquisitionSourceInput?.value.trim()) { fields.acquisitionSourceInput?.focus(); return; }
      const button = fields.acquisitionReadSourceButton;
      if (button) { button.disabled = true; button.textContent = "Reading…"; }
      try {
        const response = await fetch(`/api/games/${activeGameId}/acquisition/read-source`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ source_page: fields.acquisitionSourceInput.value.trim() }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not read source page.");
        chooseAcquisition(data.result);
      } catch (error) { setAcquisitionStatus(error.message); }
      finally { if (button) { button.disabled = false; button.textContent = "Read Source Page"; } }
    }

    async function saveAcquisition() {
      if (!activeGameId || !selectedAcquisition) { setAcquisitionStatus("Select a release or read a source page first."); return; }
      const button = fields.acquisitionSaveButton;
      if (button) { button.disabled = true; button.textContent = "Saving…"; }
      try {
        const response = await fetch(`/api/games/${activeGameId}/acquisition/save`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...selectedAcquisition, download_url: fields.acquisitionDownloadUrl?.value.trim() || "" }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save acquisition.");
        setAcquisitionStatus(fields.acquisitionDownloadUrl?.value.trim() ? "Acquisition link saved." : "Reference source saved.");
        if (fields.acquisitionBadge) fields.acquisitionBadge.textContent = fields.acquisitionDownloadUrl?.value.trim() ? "Link Ready" : "Source Found";
        await loadAcquisition(activeGame);
      } catch (error) { setAcquisitionStatus(error.message); }
      finally { if (button) { button.disabled = false; button.textContent = "Save Acquisition"; } }
    }

    function acquisitionBytes(value) {
      let amount = Number(value || 0);
      const units = ["B", "KB", "MB", "GB", "TB"];
      let unit = 0;
      while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
      return `${amount >= 10 || unit === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unit]}`;
    }

    function syncAcquisitionDownloadButton() {
      if (!fields.acquisitionDownloadButton) return;
      fields.acquisitionDownloadButton.disabled = !(fields.acquisitionDownloadPermission?.checked && fields.acquisitionDownloadUrl?.value.trim());
    }

    function renderAcquisitionDownload(job = {}) {
      const active = ["queued", "downloading"].includes(job.status);
      const visible = active || ["complete", "failed"].includes(job.status);
      if (fields.acquisitionDownloadProgress) fields.acquisitionDownloadProgress.hidden = !visible;
      if (fields.acquisitionDownloadMeter) fields.acquisitionDownloadMeter.value = Number(job.progress || 0);
      if (fields.acquisitionDownloadMessage) fields.acquisitionDownloadMessage.textContent = job.message || (active ? "Downloading to Vaultarr…" : "Ready.");
      if (fields.acquisitionDownloadBytes) {
        const received = acquisitionBytes(job.received_bytes || 0);
        fields.acquisitionDownloadBytes.textContent = job.total_bytes ? `${received} / ${acquisitionBytes(job.total_bytes)}` : received;
      }
      if (fields.acquisitionDownloadButton) {
        fields.acquisitionDownloadButton.disabled = active || !(fields.acquisitionDownloadPermission?.checked && fields.acquisitionDownloadUrl?.value.trim());
        fields.acquisitionDownloadButton.textContent = active ? "Downloading…" : "Download to Vaultarr";
      }
      if (job.status === "complete") {
        if (fields.acquisitionBadge) fields.acquisitionBadge.textContent = "Stored Locally";
        if (fields.acquisitionLocalPath) fields.acquisitionLocalPath.value = job.local_path || "";
        setAcquisitionStatus(`Download complete and attached: ${job.filename || "acquired file"}`);
      } else if (job.status === "failed") {
        setAcquisitionStatus(job.message || "The acquisition download failed.");
      }
    }

    async function pollAcquisitionDownload(gameId = activeGameId) {
      window.clearTimeout(acquisitionDownloadPollTimer);
      if (!gameId) return;
      try {
        const response = await fetch(`/api/games/${gameId}/acquisition/download-status`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (String(activeGameId) !== String(gameId) || !response.ok || !data.success) return;
        renderAcquisitionDownload(data.job || {});
        if (["queued", "downloading"].includes(data.job?.status)) acquisitionDownloadPollTimer = window.setTimeout(() => pollAcquisitionDownload(gameId), 700);
      } catch (_) {}
    }

    async function startAcquisitionDownload() {
      if (!activeGameId || !fields.acquisitionDownloadPermission?.checked || !fields.acquisitionDownloadUrl?.value.trim()) {
        syncAcquisitionDownloadButton();
        return;
      }
      const button = fields.acquisitionDownloadButton;
      if (button) { button.disabled = true; button.textContent = "Preparing…"; }
      try {
        const response = await fetch(`/api/games/${activeGameId}/acquisition/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ download_url: fields.acquisitionDownloadUrl.value.trim(), permission_confirmed: true }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not start download.");
        renderAcquisitionDownload(data.job || {});
        acquisitionDownloadPollTimer = window.setTimeout(() => pollAcquisitionDownload(activeGameId), 350);
      } catch (error) {
        setAcquisitionStatus(error.message);
        syncAcquisitionDownloadButton();
      }
    }

    async function attachAcquisition(event) {
      event.preventDefault();
      if (!activeGameId || !fields.acquisitionLocalPath?.value.trim()) return;
      const button = fields.acquisitionAttachForm?.querySelector("button[type=submit]");
      if (button) { button.disabled = true; button.textContent = "Saving…"; }
      try {
        const body = new URLSearchParams({ local_path: fields.acquisitionLocalPath.value.trim() });
        const response = await fetch(`/games/${activeGameId}/acquisition/attach`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, redirect: "follow" });
        if (!response.ok) throw new Error("Could not attach local files.");
        if (fields.acquisitionBadge) fields.acquisitionBadge.textContent = "Stored Locally";
        setAcquisitionStatus("Local file or folder attached.");
        await loadAcquisition(activeGame);
      } catch (error) { setAcquisitionStatus(error.message); }
      finally { if (button) { button.disabled = false; button.textContent = "Mark Stored Locally"; } }
    }

    function populate(game) {
      if (activeGameId && String(game.id) !== String(activeGameId)) return;
      activeGame = game;
      resetEmulationPanel();
      loadAcquisition(game);

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

      if (fields.developer) fields.developer.textContent = text(game.developer);
      if (fields.publisher) fields.publisher.textContent = text(game.publisher);
      if (fields.year) fields.year.textContent = text(game.release_year);
      if (fields.genre) fields.genre.textContent = text(game.genre);
      if (fields.platform) fields.platform.textContent = text(game.platform);
      if (fields.source) fields.source.textContent = game.metadata_source ? `${game.metadata_source} #${game.metadata_external_id || ""}` : "None";
      if (fields.metadataLink) fields.metadataLink.href = `/games/${game.id}`;
      if (fields.editGameLink) fields.editGameLink.href = `/games/${game.id}#manual-edit`;
      if (fields.refreshGameLink) fields.refreshGameLink.href = `/games/${game.id}?refresh=1`;
      if (fields.fullDetailsLink) fields.fullDetailsLink.href = `/games/${game.id}`;
      if (fields.removeGameTitle) fields.removeGameTitle.textContent = `Remove ${game.title || "game"}?`;
      if (fields.removeStatus) fields.removeStatus.innerHTML = "";
      if (fields.removeConfirmButton) { fields.removeConfirmButton.disabled = false; fields.removeConfirmButton.textContent = "Remove Game"; }
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
      renderOverviewTrailer(game);
      updateSoundtrackViewer(game);
      loadLocalSoundtrackTracks(game);
      resetSoundtrackDownload(game);
      updatePatchPanel(game);
      renderOverviewGallery([]);
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
      stopSoundtrackPlayback();
      const gameId = trigger.dataset.gameId;
      if (!gameId) return;

      isAnimating = true;
      activeTrigger = trigger;
      activeGameId = gameId;
      activeStartRect = trigger.querySelector(".poster-card")?.getBoundingClientRect() || trigger.getBoundingClientRect();

      trigger.classList.add("is-pressing");
      window.setTimeout(() => trigger.classList.remove("is-pressing"), 180);

      scatterCards(trigger);
      setLoading(trigger);

      body.classList.add("focus-preparing", "focus-active");
      panel.setAttribute("aria-hidden", "false");
      if (backdrop) backdrop.setAttribute("aria-hidden", "false");

      const start = activeStartRect;
      const finalRect = getFinalPanelRect();

      panel.classList.remove("is-expanded", "is-closing");
      panel.classList.add("is-opening");
      setPanelBox(start);
      panel.getBoundingClientRect();

      requestAnimationFrame(() => {
        body.classList.remove("focus-preparing");
        setPanelBox(finalRect);
        panel.classList.add("is-expanded");
      });

      window.setTimeout(() => { isAnimating = false; }, 560);

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
      stopSoundtrackPlayback();
      stopEmulationPlayer();
      closeFocusTabMenus();
      closeVaultSelects();
      isAnimating = true;
      const liveCard = activeTrigger?.querySelector(".poster-card") || activeTrigger;
      const liveRect = liveCard?.getBoundingClientRect?.();
      const start = liveRect && liveRect.width > 0 && liveRect.height > 0 ? liveRect : activeStartRect;

      panel.classList.remove("is-expanded", "is-opening");
      panel.classList.add("is-closing");

      if (start) setPanelBox(start);

      window.setTimeout(() => {
        // Freeze the panel fully transparent before clearing its inline geometry.
        // Without this step the browser briefly reflows the still-visible panel at
        // its default fixed position, producing the bottom-left rectangle flicker.
        panel.style.transition = "none";
        panel.style.opacity = "0";
        panel.style.visibility = "hidden";
        panel.getBoundingClientRect();

        body.classList.remove("focus-active", "focus-preparing");
        panel.classList.remove("is-closing");
        panel.setAttribute("aria-hidden", "true");

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

        requestAnimationFrame(() => {
          panel.removeAttribute("style");
        });

        document.dispatchEvent(new CustomEvent("vaultarr:focus-closed"));
      }, 500);
    }

    function closeFocusTabMenus(exceptMenu = null) {
      document.querySelectorAll("[data-focus-tab-menu]").forEach((menu) => {
        if (menu === exceptMenu) return;
        menu.classList.remove("is-open");
        menu.querySelector(".focus-tab-menu-trigger")?.setAttribute("aria-expanded", "false");
        menu.querySelector(".focus-tab-menu-popover")?.setAttribute("aria-hidden", "true");
      });
    }

    function openFocusTabMenu(menu, focusFirst = false) {
      if (!menu) return;
      closeFocusTabMenus(menu);
      menu.classList.add("is-open");
      menu.querySelector(".focus-tab-menu-trigger")?.setAttribute("aria-expanded", "true");
      menu.querySelector(".focus-tab-menu-popover")?.setAttribute("aria-hidden", "false");
      if (focusFirst) menu.querySelector(".focus-tab")?.focus({ preventScroll: true });
    }

    function syncFocusTabMenus() {
      document.querySelectorAll("[data-focus-tab-menu]").forEach((menu) => {
        menu.classList.toggle("contains-active", Boolean(menu.querySelector(".focus-tab.active")));
      });
    }

    function setActiveTab(tabName) {
      closeVaultSelects();
      const currentActive = document.querySelector(".focus-tab.active")?.dataset?.tab || "";
      if (currentActive === "overview" && tabName !== "overview") {
        stopOverviewTrailerPlayback();
      }
      if (currentActive === "trailer" && tabName !== "trailer") {
        stopTrailerPlayback(false);
      }
      if (currentActive === "soundtrack" && tabName !== "soundtrack") {
        stopSoundtrackPlayback();
      }
      if (currentActive === "play" && tabName !== "play") {
        stopEmulationPlayer();
      }
      if (tabName === "trailer") {
        restoreTrailerPlaybackIfNeeded();
      }

      document.querySelectorAll(".focus-tab").forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
        item.tabIndex = -1;
      });
      document.querySelectorAll(".focus-tab-panel").forEach((item) => item.classList.remove("active"));
      const tab = document.querySelector(`.focus-tab[data-tab="${tabName}"]`);
      const tabPanel = document.getElementById(`focusTab-${tabName}`);
      if (tab) {
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        tab.tabIndex = 0;
      }
      if (tabPanel) tabPanel.classList.add("active");
      syncFocusTabMenus();
      if (tabName === "play") loadEmulationProfile();
    }

    function renderEmulationNotice(message = "", status = "") {
      if (!fields.emulationUploadStatus) return;
      fields.emulationUploadStatus.innerHTML = message
        ? `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Player</strong><span>${escapeHtml(message)}</span></span>`
        : "";
    }

    function stopEmulationPlayer() {
      const wasRunning = emulationIsRunning;
      emulationIsRunning = false;
      if (fields.emulationFrame) fields.emulationFrame.src = "about:blank";
      if (fields.emulationPlayerShell) fields.emulationPlayerShell.hidden = true;
      document.querySelector(".emulation-launch-panel")?.removeAttribute("hidden");
      body.classList.remove("emulation-active");
      if (wasRunning) {
        const content = panel.querySelector(".focus-content");
        window.requestAnimationFrame(() => {
          if (content) content.scrollTop = emulationPreviousScrollTop;
        });
        document.dispatchEvent(new CustomEvent("vaultarr:emulation-stopped"));
      }
    }

    function resetEmulationPanel() {
      emulationProfile = null;
      stopEmulationPlayer();
      if (fields.emulationHeading) fields.emulationHeading.textContent = `Play ${activeGame?.title || "in Vaultarr"}`;
      if (fields.emulationStatus) {
        fields.emulationStatus.textContent = "Not checked";
        fields.emulationStatus.dataset.status = "idle";
      }
      if (fields.emulationMessage) fields.emulationMessage.textContent = "Open the Play tab to check this game.";
      if (fields.emulationDetails) fields.emulationDetails.hidden = true;
      if (fields.emulationStart) fields.emulationStart.hidden = true;
      if (fields.emulationBiosPrimary) fields.emulationBiosPrimary.hidden = true;
      if (fields.emulationRemove) fields.emulationRemove.hidden = true;
      if (fields.emulationBiosRow) fields.emulationBiosRow.hidden = true;
      renderEmulationNotice();
    }

    function renderEmulationProfile(profile) {
      emulationProfile = profile;
      const hasRom = Boolean(profile?.rom);
      const isReady = profile?.status === "ready";
      const needsBios = profile?.status === "missing_bios";
      const accept = (profile?.accepted_extensions || []).join(",");
      if (fields.emulationHeading) fields.emulationHeading.textContent = `Play ${activeGame?.title || "in Vaultarr"}`;
      if (fields.emulationStatus) {
        fields.emulationStatus.textContent = isReady ? "Ready" : needsBios ? "BIOS needed" : "Game file needed";
        fields.emulationStatus.dataset.status = profile?.status || "idle";
      }
      if (fields.emulationMessage) fields.emulationMessage.textContent = profile?.message || "Player setup is incomplete.";
      if (fields.emulationDetails) {
        fields.emulationDetails.hidden = !hasRom;
        fields.emulationDetails.innerHTML = hasRom
          ? `<strong>${escapeHtml(profile.system_label || "Classic game")}</strong><span>${escapeHtml(profile.rom.name)} · ${escapeHtml(profile.rom.size_label || "")}</span>`
          : "";
      }
      if (fields.emulationStart) fields.emulationStart.hidden = !isReady;
      if (fields.emulationImportButton) fields.emulationImportButton.hidden = hasRom;
      if (fields.emulationBiosPrimary) fields.emulationBiosPrimary.hidden = !needsBios;
      if (fields.emulationUpload) fields.emulationUpload.accept = accept;
      if (fields.emulationReplace) fields.emulationReplace.accept = accept;
      if (fields.emulationRomLabel) fields.emulationRomLabel.textContent = hasRom ? `${profile.rom.name} · ${profile.rom.size_label || ""}` : "No game file added";
      if (fields.emulationRemove) fields.emulationRemove.hidden = !hasRom;
      if (fields.emulationBiosRow) fields.emulationBiosRow.hidden = !profile?.requires_bios;
      if (fields.emulationBiosLabel) fields.emulationBiosLabel.textContent = profile?.bios ? `${profile.bios.name} · ${profile.bios.size_label || ""}` : "Required to play PlayStation games";
      if (fields.emulationSetup && needsBios) fields.emulationSetup.open = true;
      if (fields.emulationPlayerTitle) fields.emulationPlayerTitle.textContent = activeGame?.title || "Vaultarr Player";
    }

    async function loadEmulationProfile() {
      if (!activeGameId) return;
      if (fields.emulationStatus) {
        fields.emulationStatus.textContent = "Checking…";
        fields.emulationStatus.dataset.status = "loading";
      }
      try {
        const response = await fetch(`/api/games/${activeGameId}/emulation`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not check the player.");
        renderEmulationProfile(data.profile);
      } catch (error) {
        if (fields.emulationStatus) fields.emulationStatus.textContent = "Unavailable";
        if (fields.emulationMessage) fields.emulationMessage.textContent = "Vaultarr Player could not be prepared.";
        renderEmulationNotice(error.message || "Could not check the player.", "error");
      }
    }

    async function uploadEmulationFile(input, kind) {
      const file = input?.files?.[0];
      if (!activeGameId || !file) return;
      renderEmulationNotice(kind === "bios" ? "Adding BIOS…" : "Adding game file…");
      const form = new FormData();
      form.append(kind === "bios" ? "bios" : "rom", file);
      try {
        const suffix = kind === "bios" ? "/bios" : "/rom";
        const response = await fetch(`/api/games/${activeGameId}/emulation${suffix}`, { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not add the selected file.");
        renderEmulationProfile(data.profile);
        renderEmulationNotice(kind === "bios" ? "BIOS added. The game is ready." : "Game file added.", "success");
      } catch (error) {
        renderEmulationNotice(error.message || "Could not add the selected file.", "error");
      } finally {
        input.value = "";
      }
    }

    function startEmulationPlayer() {
      if (!emulationProfile?.available || !emulationProfile.player_url || !fields.emulationFrame) return;
      const launchPanel = document.querySelector(".emulation-launch-panel");
      const content = panel.querySelector(".focus-content");
      emulationPreviousScrollTop = content?.scrollTop || 0;
      emulationIsRunning = true;
      body.classList.add("emulation-active");
      if (launchPanel) launchPanel.hidden = true;
      if (fields.emulationPlayerShell) fields.emulationPlayerShell.hidden = false;
      fields.emulationFrame.src = emulationProfile.player_url;
      window.requestAnimationFrame(() => {
        if (content) content.scrollTop = 0;
      });
      document.dispatchEvent(new CustomEvent("vaultarr:emulation-started", {
        detail: { gameId: activeGameId }
      }));
    }

    async function removeEmulationRom() {
      if (!activeGameId) return;
      stopEmulationPlayer();
      renderEmulationNotice("Removing game file…");
      try {
        const response = await fetch(`/api/games/${activeGameId}/emulation/rom`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove the game file.");
        renderEmulationProfile(data.profile);
        renderEmulationNotice("Game file removed.", "success");
      } catch (error) {
        renderEmulationNotice(error.message || "Could not remove the game file.", "error");
      }
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
      renderOverviewGallery(cached);

      if (!cached.length) {
        if (fields.galleryStage) fields.galleryStage.innerHTML = `<div class="gallery-empty">No cached gallery images yet. Use Search More Media to find screenshots and artwork.</div>`;
        renderGalleryThumbs(fields.gallerySaved, []);
        return;
      }

      showGalleryPreview(cached[0]);
      renderGalleryThumbs(fields.gallerySaved, cached, 0);
    }

    function renderOverviewGallery(cached = []) {
      if (!fields.overviewGallery) return;
      const screenshots = cached
        .filter((item) => String(item.media_type || "").toLowerCase() === "screenshot")
        .slice(0, 4);

      fields.overviewGallery.__vaultarrGalleryItems = screenshots;
      if (!screenshots.length) {
        fields.overviewGallery.innerHTML = `<div class="overview-screenshot-empty">No saved in-game screenshots yet. Add screenshots from Gallery to feature them here.</div>`;
        return;
      }

      fields.overviewGallery.innerHTML = screenshots.map((item, index) => {
        const src = item.src || item.url || item.remote_url || "";
        const title = item.title || `In-game screenshot ${index + 1}`;
        return `
          <button class="overview-screenshot-card" type="button" data-index="${index}" aria-label="Open ${escapeHtml(title)} in Gallery">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">
            <span>View in Gallery</span>
          </button>
        `;
      }).join("");
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

    function renderOverviewTrailer(game) {
      if (!fields.overviewTrailer) return;
      const url = game?.trailer_url || "";
      const embed = game?.trailer_embed_src || game?.trailer_embed_url || "";
      const provider = game?.trailer_provider || "Trailer";
      const title = game?.trailer_title || `${game?.title || "Game"} Trailer`;
      const thumb = getTrailerThumbnail(url, embed);

      if (!url) {
        fields.overviewTrailer.innerHTML = `<div class="overview-trailer-empty">No trailer saved yet. Add one from the Trailer workspace to feature it here.</div>`;
        return;
      }

      if (!embed) {
        fields.overviewTrailer.innerHTML = `
          <div class="overview-trailer-external">
            <span>▶</span>
            <div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(provider)} · external trailer</small></div>
            <a class="button-link secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open Trailer</a>
          </div>
        `;
        return;
      }

      const background = thumb ? `style="--overview-trailer-thumb: url('${escapeHtml(thumb)}')"` : "";
      fields.overviewTrailer.innerHTML = `
        <div class="overview-trailer-poster" ${background}>
          <div class="overview-trailer-backdrop"></div>
          <button class="overview-trailer-play" type="button" aria-label="Play ${escapeHtml(title)}"><span>▶</span></button>
          <div class="overview-trailer-info"><span>${escapeHtml(provider)}</span><strong>${escapeHtml(title)}</strong></div>
        </div>
      `;
      fields.overviewTrailer.querySelector(".overview-trailer-play")?.addEventListener("click", () => {
        fields.overviewTrailer.innerHTML = `
          <div class="overview-trailer-frame-shell">
            <iframe src="${escapeHtml(trailerAutoplaySrc(embed))}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        `;
      });
    }

    function stopOverviewTrailerPlayback() {
      const iframe = fields.overviewTrailer?.querySelector("iframe");
      if (iframe) iframe.src = "about:blank";
      renderOverviewTrailer(activeGame);
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
        if (fields.trailerCopy) fields.trailerCopy.textContent = "Find an official trailer or add one manually under Find or replace the trailer.";
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


    function renderSoundtrackStatus(message, status = "ok") {
      if (!fields.soundtrackStatus) return;
      fields.soundtrackStatus.innerHTML = message ? `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Soundtrack</strong><span>${escapeHtml(message)}</span></span>` : "";
    }

    function renderSoundtrackUploadStatus(message, status = "ok") {
      if (!fields.soundtrackUploadStatus) return;
      fields.soundtrackUploadStatus.innerHTML = message ? `<span class="metadata-provider-pill ${escapeHtml(status)}"><strong>Local Audio</strong><span>${escapeHtml(message)}</span></span>` : "";
    }

    let localSoundtrackTracks = [];
    let localSoundtrackIndex = -1;
    let localSoundtrackShuffle = false;
    let localSoundtrackRepeat = false;
    let soundtrackDownloadPollTimer = null;
    let soundtrackDownloadCompletedGameId = null;

    function formatTrackSize(value) {
      const bytes = Number(value || 0);
      if (!bytes) return "";
      if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    function updateSoundtrackPlayerArt(game) {
      if (!fields.soundtrackPlayerArt) return;
      fields.soundtrackPlayerArt.innerHTML = game?.cover_src
        ? `<img src="${escapeHtml(cacheBust(game.cover_src))}" alt="${escapeHtml(game.title || "Game")} cover">`
        : `<span>♪</span>`;
    }

    function renderLocalSoundtrackTracks(tracks = []) {
      localSoundtrackTracks = Array.isArray(tracks) ? tracks : [];
      if (fields.soundtrackTrackCount) {
        const count = localSoundtrackTracks.length;
        fields.soundtrackTrackCount.textContent = `${count} track${count === 1 ? "" : "s"}`;
      }
      if (!fields.soundtrackTrackList) return;
      if (!localSoundtrackTracks.length) {
        localSoundtrackIndex = -1;
        fields.soundtrackTrackList.innerHTML = `<div class="trailer-candidate-empty">No local soundtrack files found. Import owned audio or place files in a Soundtrack, OST, or Music folder inside the game directory.</div>`;
        if (fields.soundtrackAudio) {
          fields.soundtrackAudio.pause();
          fields.soundtrackAudio.removeAttribute("src");
          fields.soundtrackAudio.load();
        }
        if (fields.soundtrackNowPlaying) fields.soundtrackNowPlaying.textContent = "No local soundtrack selected";
        if (fields.soundtrackNowSource) fields.soundtrackNowSource.textContent = "Import audio or rescan a soundtrack folder.";
        return;
      }
      fields.soundtrackTrackList.innerHTML = localSoundtrackTracks.map((track, index) => `
        <button class="soundtrack-track-row${index === localSoundtrackIndex ? " active" : ""}" type="button" data-track-index="${index}" aria-label="Play ${escapeHtml(track.title || track.filename || "Track")}" aria-pressed="${index === localSoundtrackIndex}">
          <span class="soundtrack-track-play" aria-hidden="true">▶</span>
          <span class="soundtrack-track-copy">
            <strong>${escapeHtml(track.title || track.filename || "Track")}</strong>
            <small>${escapeHtml([track.album, track.source].filter(Boolean).join(" · "))}</small>
          </span>
          <span class="soundtrack-track-size">${escapeHtml(formatTrackSize(track.size_bytes))}</span>
        </button>
      `).join("");
    }

    function playLocalSoundtrack(index, autoplay = true) {
      if (!fields.soundtrackAudio || !localSoundtrackTracks.length) return;
      const normalized = ((Number(index) % localSoundtrackTracks.length) + localSoundtrackTracks.length) % localSoundtrackTracks.length;
      const track = localSoundtrackTracks[normalized];
      localSoundtrackIndex = normalized;
      fields.soundtrackAudio.src = track.url;
      if (fields.soundtrackNowPlaying) fields.soundtrackNowPlaying.textContent = track.title || track.filename || "Track";
      if (fields.soundtrackNowSource) fields.soundtrackNowSource.textContent = [track.album, track.source].filter(Boolean).join(" · ");
      fields.soundtrackTrackList?.querySelectorAll(".soundtrack-track-row").forEach((row, rowIndex) => {
        const selected = rowIndex === normalized;
        row.classList.toggle("active", selected);
        row.setAttribute("aria-pressed", String(selected));
      });
      if (autoplay) fields.soundtrackAudio.play().catch(() => {});
    }

    function stepLocalSoundtrack(direction) {
      if (!localSoundtrackTracks.length) return;
      if (localSoundtrackShuffle && localSoundtrackTracks.length > 1) {
        let next = localSoundtrackIndex;
        while (next === localSoundtrackIndex) next = Math.floor(Math.random() * localSoundtrackTracks.length);
        playLocalSoundtrack(next);
        return;
      }
      playLocalSoundtrack((localSoundtrackIndex < 0 ? 0 : localSoundtrackIndex) + direction);
    }

    async function loadLocalSoundtrackTracks(game) {
      if (!game?.id) return;
      const gameId = game.id;
      updateSoundtrackPlayerArt(game);
      if (fields.soundtrackTrackList) fields.soundtrackTrackList.innerHTML = `<div class="trailer-candidate-empty">Indexing local soundtrack files...</div>`;
      try {
        const response = await fetch(`/api/games/${gameId}/soundtrack/tracks`);
        const data = await response.json();
        if (String(gameId) !== String(activeGameId)) return;
        if (!response.ok || !data.success) throw new Error(data.message || "Could not index local soundtrack files.");
        renderLocalSoundtrackTracks(data.tracks || []);
        renderSoundtrackUploadStatus("");
      } catch (error) {
        renderLocalSoundtrackTracks([]);
        renderSoundtrackUploadStatus(error.message || "Could not index local soundtrack files.", "error");
      }
    }

    async function uploadLocalSoundtracks(files) {
      const selected = Array.from(files || []);
      if (!activeGameId || !selected.length) return;
      const form = new FormData();
      selected.forEach((file) => form.append("tracks", file));
      renderSoundtrackUploadStatus(`Importing ${selected.length} audio file${selected.length === 1 ? "" : "s"}...`);
      try {
        const response = await fetch(`/api/games/${activeGameId}/soundtrack/upload`, { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not import audio files.");
        renderLocalSoundtrackTracks(data.tracks || []);
        if (data.game) {
          activeGame = data.game;
          refreshOriginalCard(data.game);
        }
        renderSoundtrackUploadStatus(data.message || "Audio imported.");
      } catch (error) {
        renderSoundtrackUploadStatus(error.message || "Could not import audio files.", "error");
      } finally {
        if (fields.soundtrackUploadInput) fields.soundtrackUploadInput.value = "";
      }
    }

    function syncSoundtrackDownloadButton() {
      if (!fields.soundtrackDownloadButton) return;
      const hasUrl = Boolean(fields.soundtrackDirectUrl?.value.trim());
      const confirmed = Boolean(fields.soundtrackPermission?.checked);
      fields.soundtrackDownloadButton.disabled = !activeGameId || !hasUrl || !confirmed;
    }

    function renderSoundtrackDownloadJob(job = {}) {
      if (!fields.soundtrackDownloadProgress) return;
      const status = job.status || 'idle';
      const progress = Math.max(0, Math.min(100, Number(job.progress || 0)));
      const visible = status !== 'idle';
      fields.soundtrackDownloadProgress.hidden = !visible;
      if (fields.soundtrackDownloadFill) fields.soundtrackDownloadFill.style.width = `${progress}%`;
      if (fields.soundtrackDownloadPercent) fields.soundtrackDownloadPercent.textContent = `${Math.round(progress)}%`;
      if (fields.soundtrackDownloadMessage) {
        let message = job.message || 'Preparing audio download…';
        if (status === 'downloading' && job.received_bytes) {
          const size = formatTrackSize(job.received_bytes);
          const total = formatTrackSize(job.total_bytes);
          message = `${job.filename || 'Audio'} · ${size}${total ? ` of ${total}` : ''}`;
        }
        fields.soundtrackDownloadMessage.textContent = message;
      }
      if (fields.soundtrackDownloadButton) {
        const active = status === 'queued' || status === 'downloading';
        fields.soundtrackDownloadButton.disabled = active || !fields.soundtrackDirectUrl?.value.trim() || !fields.soundtrackPermission?.checked;
        fields.soundtrackDownloadButton.textContent = active ? 'Downloading…' : 'Download Audio';
      }
    }

    function scheduleSoundtrackDownloadPoll(gameId) {
      if (soundtrackDownloadPollTimer) window.clearTimeout(soundtrackDownloadPollTimer);
      soundtrackDownloadPollTimer = window.setTimeout(() => pollSoundtrackDownload(gameId), 650);
    }

    async function pollSoundtrackDownload(gameId = activeGameId) {
      if (!gameId || String(gameId) !== String(activeGameId)) return;
      try {
        const response = await fetch(`/api/games/${gameId}/soundtrack/download-status`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not read audio download status.');
        if (String(gameId) !== String(activeGameId)) return;
        const job = data.job || {};
        renderSoundtrackDownloadJob(job);
        if (job.status === 'queued' || job.status === 'downloading') {
          scheduleSoundtrackDownloadPoll(gameId);
        } else if (job.status === 'complete' && String(soundtrackDownloadCompletedGameId) !== String(gameId)) {
          soundtrackDownloadCompletedGameId = gameId;
          await loadLocalSoundtrackTracks(activeGame);
        }
      } catch (error) {
        renderSoundtrackDownloadJob({ status: 'failed', progress: 0, message: error.message || 'Could not read audio download status.' });
      }
    }

    function resetSoundtrackDownload(game) {
      if (soundtrackDownloadPollTimer) window.clearTimeout(soundtrackDownloadPollTimer);
      soundtrackDownloadPollTimer = null;
      soundtrackDownloadCompletedGameId = null;
      if (fields.soundtrackDirectUrl) fields.soundtrackDirectUrl.value = '';
      if (fields.soundtrackPermission) fields.soundtrackPermission.checked = false;
      if (fields.soundtrackDownloadProgress) fields.soundtrackDownloadProgress.hidden = true;
      if (fields.soundtrackDownloadFill) fields.soundtrackDownloadFill.style.width = '0%';
      if (fields.soundtrackDownloadPercent) fields.soundtrackDownloadPercent.textContent = '0%';
      syncSoundtrackDownloadButton();
      if (game?.id) pollSoundtrackDownload(game.id);
    }

    async function downloadSoundtrackFromUrl() {
      if (!activeGameId || !fields.soundtrackDirectUrl?.value.trim() || !fields.soundtrackPermission?.checked) return;
      const gameId = activeGameId;
      renderSoundtrackDownloadJob({ status: 'queued', progress: 0, message: 'Validating authorized audio link…' });
      try {
        const response = await fetch(`/api/games/${gameId}/soundtrack/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            download_url: fields.soundtrackDirectUrl.value.trim(),
            permission_confirmed: fields.soundtrackPermission.checked,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not start the audio download.');
        soundtrackDownloadCompletedGameId = null;
        renderSoundtrackDownloadJob(data.job || {});
        scheduleSoundtrackDownloadPoll(gameId);
      } catch (error) {
        renderSoundtrackDownloadJob({ status: 'failed', progress: 0, message: error.message || 'Could not start the audio download.' });
      }
    }

    function stopSoundtrackPlayback() {
      if (fields.soundtrackStage?.querySelector("iframe")) updateSoundtrackViewer(activeGame);
      fields.soundtrackAudio?.pause();
    }

    function updateSoundtrackSearchLinks(game) {
      const title = game?.title || activeGame?.title || "game";
      const platform = game?.platform || activeGame?.platform || "";
      const query = `${title} ${platform} original soundtrack OST`.trim();
      const encoded = encodeURIComponent(query);
      if (fields.soundtrackYouTubeSearch) fields.soundtrackYouTubeSearch.href = `https://www.youtube.com/results?search_query=${encoded}`;
      if (fields.soundtrackMusicSearch) fields.soundtrackMusicSearch.href = `https://music.youtube.com/search?q=${encoded}`;
      if (fields.soundtrackKHInsiderSearch) fields.soundtrackKHInsiderSearch.href = `https://downloads.khinsider.com/search?search=${encodeURIComponent(`${title} ${platform}`.trim())}&type=album`;
      if (fields.soundtrackGoogleSearch) fields.soundtrackGoogleSearch.href = `https://www.google.com/search?q=${encodeURIComponent(`${query} official soundtrack store`)}`;
    }

    function soundtrackThumbnail(url = "", embed = "") {
      const id = getYouTubeVideoId(url) || getYouTubeVideoId(embed);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    }

    function renderSoundtrackPoster({ title, provider, url, embed }) {
      const thumbnail = soundtrackThumbnail(url, embed);
      const background = thumbnail ? `style="--trailer-thumb: url('${escapeHtml(thumbnail)}')"` : "";
      fields.soundtrackStage.innerHTML = `
        <div class="cinematic-poster soundtrack-poster" ${background}>
          <div class="cinematic-poster-bg"></div>
          <button class="cinematic-play soundtrack-play" type="button" id="focusSoundtrackPlayButton" aria-label="Play ${escapeHtml(title)}">
            <span>♪</span>
          </button>
          <div class="cinematic-trailer-info">
            <p class="eyebrow">${escapeHtml(provider || "Soundtrack")}</p>
            <strong>${escapeHtml(title)}</strong>
            <span>Saved music source · ready to play inside Vaultarr</span>
          </div>
        </div>
      `;
      document.getElementById("focusSoundtrackPlayButton")?.addEventListener("click", () => {
        fields.soundtrackStage.innerHTML = `
          <div class="trailer-frame-shell cinematic-frame-shell">
            <iframe class="trailer-frame" src="${escapeHtml(trailerAutoplaySrc(embed))}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        `;
      });
    }

    function updateSoundtrackViewer(game) {
      if (!fields.soundtrackStage) return;
      updateSoundtrackSearchLinks(game);
      const url = game?.soundtrack_url || "";
      const embed = game?.soundtrack_embed_src || game?.soundtrack_embed_url || "";
      const provider = game?.soundtrack_provider || "YouTube";
      const title = game?.soundtrack_title || `${game?.title || "Game"} Soundtrack`;

      if (fields.soundtrackHeading) fields.soundtrackHeading.textContent = `${game?.title || "Game"} Soundtrack`;
      if (fields.soundtrackUrlInput) fields.soundtrackUrlInput.value = url;
      if (fields.soundtrackProvider && provider) fields.soundtrackProvider.value = provider;
      if (fields.soundtrackOpenLink) {
        fields.soundtrackOpenLink.href = url || "#";
        fields.soundtrackOpenLink.classList.toggle("disabled", !url);
      }

      if (!url) {
        if (fields.soundtrackCopy) fields.soundtrackCopy.textContent = "Play owned and acquired tracks first. Add music or find external sources only when needed.";
        fields.soundtrackStage.innerHTML = `
          <div class="cinematic-empty soundtrack-empty">
            <span>♪</span>
            <strong>No soundtrack selected</strong>
            <p class="muted">Use Scan for Music to find likely soundtrack and OST matches.</p>
          </div>
        `;
        if (fields.soundtrackResults) fields.soundtrackResults.innerHTML = `<div class="trailer-candidate-empty">Use Scan for Music to search likely soundtrack matches inside Vaultarr.</div>`;
        renderSoundtrackStatus("");
        return;
      }

      if (!embed) {
        if (fields.soundtrackCopy) fields.soundtrackCopy.textContent = `Play owned and acquired tracks below. A ${provider} source is also saved.`;
        fields.soundtrackStage.innerHTML = `
          <div class="trailer-external-card cinematic-external-card">
            <span>♪</span>
            <strong>External Soundtrack Saved</strong>
            <p class="muted">The source is preserved on this game record and opens on its provider.</p>
            <a class="button-link secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open Soundtrack</a>
          </div>
        `;
        renderSoundtrackStatus("External soundtrack source saved.");
        return;
      }

      if (fields.soundtrackCopy) fields.soundtrackCopy.textContent = `Play owned and acquired tracks below. A ${provider} preview is also saved.`;
      renderSoundtrackPoster({ title, provider, url, embed });
      renderSoundtrackStatus(`${provider} soundtrack ready.`);
    }

    function renderSoundtrackCandidates(results = []) {
      if (!fields.soundtrackResults) return;
      if (!results.length) {
        fields.soundtrackResults.innerHTML = `<div class="trailer-candidate-empty">No likely soundtrack candidates found. Try the external searches or paste a source URL manually.</div>`;
        return;
      }
      fields.soundtrackResults.innerHTML = results.map((result) => `
        <article class="trailer-candidate-card soundtrack-candidate-card" data-url="${escapeHtml(result.url)}" data-embed="${escapeHtml(result.embed_url || "")}" data-title="${escapeHtml(result.title)}" data-provider="${escapeHtml(result.provider || result.source || "YouTube")}">
          <button class="trailer-candidate-preview" type="button" aria-label="Preview ${escapeHtml(result.title)}">
            <span class="trailer-thumb">
              ${result.thumbnail ? `<img src="${escapeHtml(result.thumbnail)}" alt="${escapeHtml(result.title)}">` : `<span>♪</span>`}
              <i>♪</i>
            </span>
          </button>
          <div class="trailer-candidate-body">
            <div class="trailer-candidate-topline"><span>${escapeHtml(result.source || "YouTube")}</span><strong>${Number(result.confidence || 0)}%</strong></div>
            <h4>${escapeHtml(result.title)}</h4>
            <p>${escapeHtml([result.duration, result.published, result.reason].filter(Boolean).join(" · "))}</p>
            <div class="trailer-candidate-actions">
              <button class="secondary-button soundtrack-preview-button" type="button">${result.embed_url ? "Preview" : "Open Album"}</button>
              <button class="soundtrack-set-button" type="button">Save Source</button>
            </div>
          </div>
        </article>
      `).join("");
    }

    async function previewSoundtrackCandidate(card) {
      if (!card || !fields.soundtrackStage) return;
      const title = card.dataset.title || "Soundtrack Preview";
      const embed = card.dataset.embed || "";
      const url = card.dataset.url || "";
      const provider = card.dataset.provider || "";
      if (embed) {
        fields.soundtrackStage.innerHTML = `<div class="trailer-frame-shell"><iframe class="trailer-frame" src="${escapeHtml(trailerAutoplaySrc(embed))}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      } else if (provider === "KHInsider") {
        await loadKHInsiderAlbumTracks(title, url);
        return;
      } else {
        fields.soundtrackStage.innerHTML = `<div class="trailer-external-card"><span>♪</span><strong>${escapeHtml(title)}</strong><p class="muted">This result opens externally.</p><a class="button-link secondary small" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open Soundtrack</a></div>`;
      }
      renderSoundtrackStatus(embed ? "Previewing music candidate. Save Source to keep it on this game record." : "Catalog album selected. Open it externally or save its source link.");
    }

    async function loadKHInsiderAlbumTracks(title, albumUrl) {
      if (!activeGameId || !fields.soundtrackStage) return;
      fields.soundtrackStage.innerHTML = `<div class="cinematic-empty"><span>♪</span><strong>Loading album tracks...</strong><p class="muted">Reading public KHInsider catalog metadata.</p></div>`;
      renderSoundtrackStatus("Loading KHInsider track metadata...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/soundtrack/catalog/tracks?url=${encodeURIComponent(albumUrl)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not load album tracks.");
        const album = data.album || {};
        const tracks = album.tracks || [];
        fields.soundtrackStage.innerHTML = `
          <div class="soundtrack-catalog-view">
            <div class="soundtrack-catalog-heading">
              <div>
                <p class="eyebrow">KHInsider Catalog</p>
                <h3>${escapeHtml(album.title || title)}</h3>
                <p class="muted">${tracks.length} track${tracks.length === 1 ? "" : "s"} · metadata and external song pages only</p>
              </div>
              <a class="button-link secondary small" href="${escapeHtml(album.url || albumUrl)}" target="_blank" rel="noopener">Open Album</a>
            </div>
            <div class="soundtrack-catalog-notice">To play a track in Vaultarr, obtain it manually and use Import Audio. Vaultarr does not stream or download KHInsider audio.</div>
            <div class="soundtrack-catalog-tracks">
              ${tracks.length ? tracks.map((track) => `
                <a class="soundtrack-catalog-track" href="${escapeHtml(track.page_url)}" target="_blank" rel="noopener">
                  <span>${String(Number(track.number || 0)).padStart(2, "0")}</span>
                  <strong>${escapeHtml(track.title || "Track")}</strong>
                  <small>${escapeHtml([track.duration, track.size].filter(Boolean).join(" · "))}</small>
                  <em>Open song page</em>
                </a>
              `).join("") : `<div class="trailer-candidate-empty">No public track metadata was found for this album.</div>`}
            </div>
          </div>
        `;
        renderSoundtrackStatus(`Loaded ${tracks.length} KHInsider track${tracks.length === 1 ? "" : "s"}.`);
      } catch (error) {
        fields.soundtrackStage.innerHTML = `<div class="trailer-external-card"><span>♪</span><strong>${escapeHtml(title)}</strong><p class="muted">${escapeHtml(error.message || "Could not load album tracks.")}</p><a class="button-link secondary small" href="${escapeHtml(albumUrl)}" target="_blank" rel="noopener">Open Album</a></div>`;
        renderSoundtrackStatus(error.message || "Could not load album tracks.", "error");
      }
    }

    async function findSoundtrackCandidates() {
      if (!activeGameId) return;
      if (fields.soundtrackFinderPanel) fields.soundtrackFinderPanel.open = true;
      if (fields.soundtrackFindButton) {
        fields.soundtrackFindButton.disabled = true;
        fields.soundtrackFindButton.textContent = "Scanning...";
      }
      if (fields.soundtrackResults) fields.soundtrackResults.innerHTML = `<div class="trailer-candidate-empty">Scanning YouTube for soundtrack and OST matches...</div>`;
      renderSoundtrackStatus("Scanning YouTube for likely game music...");
      const gameId = activeGameId;
      try {
        const provider = fields.soundtrackSearchProvider?.value || "all";
        const response = await fetch(`/api/games/${gameId}/soundtrack/search?provider=${encodeURIComponent(provider)}`);
        const data = await response.json();
        if (String(gameId) !== String(activeGameId)) return;
        if (!response.ok || !data.success) throw new Error(data.message || "Soundtrack scan failed.");
        renderSoundtrackCandidates(data.results || []);
        renderSoundtrackStatus(data.message || "Soundtrack scan complete.");
      } catch (error) {
        renderSoundtrackCandidates([]);
        renderSoundtrackStatus(error.message || "Soundtrack scan failed.", "error");
      } finally {
        if (fields.soundtrackFindButton) {
          fields.soundtrackFindButton.disabled = false;
          fields.soundtrackFindButton.textContent = "Scan for Music";
        }
      }
    }

    async function saveSoundtrackCandidate(card) {
      if (!activeGameId || !card?.dataset.url) return;
      await persistSoundtrack({
        soundtrack_url: card.dataset.url,
        soundtrack_provider: card.dataset.provider || "YouTube",
        soundtrack_title: card.dataset.title || `${activeGame?.title || "Game"} Soundtrack`,
      }, "Soundtrack saved from scanner.");
    }

    async function saveSoundtrack(event) {
      event.preventDefault();
      const url = fields.soundtrackUrlInput?.value?.trim() || "";
      if (!url) {
        renderSoundtrackStatus("Paste a soundtrack URL first.", "error");
        return;
      }
      await persistSoundtrack({
        soundtrack_url: url,
        soundtrack_provider: fields.soundtrackProvider?.value || "YouTube",
        soundtrack_title: `${activeGame?.title || "Game"} Soundtrack`,
      }, "Soundtrack saved.");
    }

    async function persistSoundtrack(payload, successMessage) {
      if (!activeGameId) return;
      renderSoundtrackStatus("Saving soundtrack source...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/soundtrack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not save soundtrack.");
        populate(data.game);
        setActiveTab("soundtrack");
        renderSoundtrackStatus(successMessage);
      } catch (error) {
        renderSoundtrackStatus(error.message || "Could not save soundtrack.", "error");
      }
    }

    async function removeSoundtrack() {
      if (!activeGameId) return;
      renderSoundtrackStatus("Removing saved soundtrack...");
      try {
        const response = await fetch(`/api/games/${activeGameId}/soundtrack/remove`, { method: "POST" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove soundtrack.");
        populate(data.game);
        setActiveTab("soundtrack");
        renderSoundtrackStatus("Soundtrack removed.");
      } catch (error) {
        renderSoundtrackStatus(error.message || "Could not remove soundtrack.", "error");
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
              ${(result.source_page_url || result.url) ? `<a class="button-link secondary small" href="${escapeHtml(result.source_page_url || result.url)}" target="_blank" rel="noopener">${escapeHtml(result.action || (isDirectPdf ? "Open PDF" : "Open"))}</a>` : `<span class="metadata-provider-pill ok"><strong>Local</strong><span>Use asset scan</span></span>`}
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

    function openRemoveGameDialog() {
      if (!activeGameId || !fields.removeGameDialog) return;
      if (fields.removeGameTitle) fields.removeGameTitle.textContent = `Remove ${activeGame?.title || "game"}?`;
      if (fields.removeStatus) fields.removeStatus.innerHTML = "";
      fields.removeGameDialog.showModal();
    }

    async function confirmRemoveGame() {
      if (!activeGameId || !fields.removeConfirmButton) return;
      fields.removeConfirmButton.disabled = true;
      fields.removeConfirmButton.textContent = "Removing...";
      if (fields.removeStatus) fields.removeStatus.innerHTML = '<span class="metadata-provider-pill"><strong>Vaultarr</strong><span>Removing catalog record...</span></span>';
      try {
        const removedId = String(activeGameId);
        const removedTitle = activeGame?.title || "Game";
        const response = await fetch(`/api/games/${activeGameId}/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ignore_path: fields.removeIgnorePath?.checked ?? true,
            delete_cached_assets: fields.removeCachedAssets?.checked ?? true,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not remove game.");
        fields.removeGameDialog.close();
        closeFocus();
        window.setTimeout(() => {
          document.dispatchEvent(new CustomEvent("vaultarr:game-removed", {
            detail: { game_id: removedId, title: removedTitle },
          }));
          window.VaultarrToast?.({
            title: "Exhibit removed",
            message: `${removedTitle} left the catalog. Original game files were untouched.`,
          });
        }, 280);
      } catch (error) {
        fields.removeConfirmButton.disabled = false;
        fields.removeConfirmButton.textContent = "Remove Game";
        if (fields.removeStatus) fields.removeStatus.innerHTML = `<span class="metadata-provider-pill error"><strong>Error</strong><span>${escapeHtml(error.message || "Could not remove game.")}</span></span>`;
      }
    }

    if (closeButton) closeButton.addEventListener("click", closeFocus);
    if (backdrop) backdrop.addEventListener("click", closeFocus);
    panel.addEventListener("wheel", (event) => {
      if (!body.classList.contains("focus-active") || event.target.closest(".focus-content")) return;

      const content = panel.querySelector(".focus-content");
      if (!content || Math.abs(event.deltaY) < 1) return;

      // Keep wheel input over the artwork/metadata column inside Focus Mode.
      // The right content column remains the panel's single scroll surface.
      content.scrollTop += event.deltaY;
      event.preventDefault();
    }, { passive: false });
    if (fields.removeGameButton) fields.removeGameButton.addEventListener("click", openRemoveGameDialog);
    if (fields.removeCancelButton) fields.removeCancelButton.addEventListener("click", () => fields.removeGameDialog?.close());
    if (fields.removeConfirmButton) fields.removeConfirmButton.addEventListener("click", confirmRemoveGame);
    if (fields.metadataForm) fields.metadataForm.addEventListener("submit", searchMetadata);
    if (fields.providerIntelligenceButton) fields.providerIntelligenceButton.addEventListener("click", analyzeProviders);
    if (fields.mergeBestButton) fields.mergeBestButton.addEventListener("click", mergeBestFields);
    if (fields.manualSearchForm) fields.manualSearchForm.addEventListener("submit", searchManuals);
    if (fields.manualLinkForm) fields.manualLinkForm.addEventListener("submit", saveManualLink);
    if (fields.trailerForm) fields.trailerForm.addEventListener("submit", saveTrailer);
    if (fields.trailerRemoveButton) fields.trailerRemoveButton.addEventListener("click", removeTrailer);
    if (fields.trailerFindButton) fields.trailerFindButton.addEventListener("click", findTrailerCandidates);
    if (fields.soundtrackForm) fields.soundtrackForm.addEventListener("submit", saveSoundtrack);
    if (fields.soundtrackRemoveButton) fields.soundtrackRemoveButton.addEventListener("click", removeSoundtrack);
    if (fields.soundtrackFindButton) fields.soundtrackFindButton.addEventListener("click", findSoundtrackCandidates);
    if (fields.soundtrackUploadInput) fields.soundtrackUploadInput.addEventListener("change", () => uploadLocalSoundtracks(fields.soundtrackUploadInput.files));
    if (fields.soundtrackDirectUrl) fields.soundtrackDirectUrl.addEventListener("input", syncSoundtrackDownloadButton);
    if (fields.soundtrackPermission) fields.soundtrackPermission.addEventListener("change", syncSoundtrackDownloadButton);
    if (fields.soundtrackDownloadButton) fields.soundtrackDownloadButton.addEventListener("click", downloadSoundtrackFromUrl);
    if (fields.soundtrackPrevious) fields.soundtrackPrevious.addEventListener("click", () => stepLocalSoundtrack(-1));
    if (fields.soundtrackNext) fields.soundtrackNext.addEventListener("click", () => stepLocalSoundtrack(1));
    if (fields.soundtrackShuffle) fields.soundtrackShuffle.addEventListener("click", () => {
      localSoundtrackShuffle = !localSoundtrackShuffle;
      fields.soundtrackShuffle.setAttribute("aria-pressed", String(localSoundtrackShuffle));
    });
    if (fields.soundtrackRepeat) fields.soundtrackRepeat.addEventListener("click", () => {
      localSoundtrackRepeat = !localSoundtrackRepeat;
      fields.soundtrackRepeat.setAttribute("aria-pressed", String(localSoundtrackRepeat));
    });
    if (fields.soundtrackAudio) fields.soundtrackAudio.addEventListener("ended", () => {
      if (localSoundtrackRepeat) playLocalSoundtrack(localSoundtrackIndex);
      else stepLocalSoundtrack(1);
    });
    if (fields.emulationStart) fields.emulationStart.addEventListener("click", startEmulationPlayer);
    if (fields.emulationExit) fields.emulationExit.addEventListener("click", stopEmulationPlayer);
    if (fields.emulationUpload) fields.emulationUpload.addEventListener("change", () => uploadEmulationFile(fields.emulationUpload, "rom"));
    if (fields.emulationReplace) fields.emulationReplace.addEventListener("change", () => uploadEmulationFile(fields.emulationReplace, "rom"));
    if (fields.emulationBios) fields.emulationBios.addEventListener("change", () => uploadEmulationFile(fields.emulationBios, "bios"));
    if (fields.emulationRemove) fields.emulationRemove.addEventListener("click", removeEmulationRom);
    if (fields.soundtrackDropZone) {
      ["dragenter", "dragover"].forEach((eventName) => fields.soundtrackDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        fields.soundtrackDropZone.classList.add("is-dragging");
      }));
      ["dragleave", "drop"].forEach((eventName) => fields.soundtrackDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        fields.soundtrackDropZone.classList.remove("is-dragging");
      }));
      fields.soundtrackDropZone.addEventListener("drop", (event) => uploadLocalSoundtracks(event.dataTransfer?.files));
    }
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
    if (fields.soundtrackResults) {
      fields.soundtrackResults.addEventListener("click", (event) => {
        const card = event.target.closest(".soundtrack-candidate-card");
        if (!card) return;
        if (event.target.closest(".soundtrack-set-button")) {
          saveSoundtrackCandidate(card);
          return;
        }
        if (event.target.closest(".soundtrack-preview-button, .trailer-candidate-preview")) {
          previewSoundtrackCandidate(card);
        }
      });
    }
    if (fields.soundtrackTrackList) {
      fields.soundtrackTrackList.addEventListener("click", (event) => {
        const row = event.target.closest(".soundtrack-track-row");
        if (row) playLocalSoundtrack(Number(row.dataset.trackIndex || 0));
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
    if (fields.overviewGalleryOpen) {
      fields.overviewGalleryOpen.addEventListener("click", () => setActiveTab("gallery"));
    }
    if (fields.overviewTrailerOpen) {
      fields.overviewTrailerOpen.addEventListener("click", () => setActiveTab("trailer"));
    }
    if (fields.overviewGallery) {
      fields.overviewGallery.addEventListener("click", (event) => {
        const button = event.target.closest(".overview-screenshot-card");
        if (!button) return;
        const items = fields.overviewGallery.__vaultarrGalleryItems || [];
        const item = items[Number(button.dataset.index || 0)];
        if (!item) return;
        showGalleryPreview(item);
        setActiveTab("gallery");
      });
    }
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


    panel.querySelectorAll("select").forEach(enhanceFocusSelect);
    fields.acquisitionSearchButton?.addEventListener("click", searchAcquisition);
    fields.acquisitionQuery?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); searchAcquisition(); } });
    fields.acquisitionReadSourceButton?.addEventListener("click", readAcquisitionSource);
    fields.acquisitionSaveButton?.addEventListener("click", saveAcquisition);
    fields.acquisitionDownloadPermission?.addEventListener("change", syncAcquisitionDownloadButton);
    fields.acquisitionDownloadUrl?.addEventListener("input", syncAcquisitionDownloadButton);
    fields.acquisitionDownloadButton?.addEventListener("click", startAcquisitionDownload);
    fields.acquisitionAttachForm?.addEventListener("submit", attachAcquisition);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !body.classList.contains("focus-active")) return;
      const openMenu = document.querySelector("[data-focus-tab-menu].is-open");
      if (openMenu) {
        event.preventDefault();
        closeFocusTabMenus();
        openMenu.querySelector(".focus-tab-menu-trigger")?.focus({ preventScroll: true });
        return;
      }
      closeFocus();
    });

    document.querySelectorAll("[data-focus-tab-menu]").forEach((menu) => {
      const trigger = menu.querySelector(".focus-tab-menu-trigger");
      trigger?.addEventListener("click", () => {
        if (menu.classList.contains("is-open")) closeFocusTabMenus();
        else openFocusTabMenu(menu);
      });
      trigger?.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        openFocusTabMenu(menu, true);
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-focus-tab-menu]")) closeFocusTabMenus();
      if (!event.target.closest(".vault-select")) closeVaultSelects();
    });

    const focusTabs = [...document.querySelectorAll(".focus-tab")];
    focusTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        const parentMenu = tab.closest("[data-focus-tab-menu]");
        setActiveTab(tab.dataset.tab);
        closeFocusTabMenus();
        parentMenu?.querySelector(".focus-tab-menu-trigger")?.focus({ preventScroll: true });
      });
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % focusTabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + focusTabs.length) % focusTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = focusTabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        const nextTab = focusTabs[nextIndex];
        const nextMenu = nextTab.closest("[data-focus-tab-menu]");
        if (nextMenu) openFocusTabMenu(nextMenu);
        else closeFocusTabMenus();
        setActiveTab(nextTab.dataset.tab);
        nextTab.focus({ preventScroll: true });
      });
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
