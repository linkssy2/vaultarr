(() => {
  const state = { isOpen:false, mode:'museum', debounce:null, closeTimer:null, lastQuery:'', activeIndex:-1, selected:null, requestToken:0, searchController:null };
  const qs = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const elements = () => ({
    openButton:qs('globalSearchOpen'), panel:qs('globalSearchPanel'), backdrop:qs('globalSearchBackdrop'), closeButton:qs('globalSearchClose'),
    input:qs('globalSearchInput'), status:qs('globalSearchStatus'), results:qs('globalSearchResults'), heading:qs('globalSearchHeading'),
    discoverOptions:qs('globalSearchDiscoverOptions'), platform:qs('globalSearchPlatform'), provider:qs('globalSearchProvider'),
    museumMode:qs('globalSearchMuseumMode'), discoverMode:qs('globalSearchDiscoverMode'),
    addBackdrop:qs('globalAddBackdrop'), addDialog:qs('globalAddDialog'), addClose:qs('globalAddClose'), addCancel:qs('globalAddCancel'), addConfirm:qs('globalAddConfirm'), addStatus:qs('globalAddStatus')
  });
  function setStatus(message){ const el=elements(); if(el.status) el.status.textContent=message; }
  function openSearch(seed='', mode=state.mode){
    const el=elements();
    if(!el.panel||!el.input)return;
    clearTimeout(state.closeTimer);

    // Reopening an already visible search should never rebuild or disable the
    // dialog. It simply restores the controls and returns focus to the query.
    if(state.isOpen && document.body.classList.contains('global-search-open')){
      restoreSearchControls(el);
      if(seed) el.input.value=seed;
      el.input.focus({preventScroll:true});
      const length=el.input.value.length;
      try{el.input.setSelectionRange(length,length);}catch(_error){}
      return;
    }

    setMode(mode,false);
    state.isOpen=true;
    document.body.classList.add('global-search-open');
    el.panel.removeAttribute('inert');
    el.panel.setAttribute('aria-hidden','false');
    el.backdrop?.setAttribute('aria-hidden','false');
    window.setTimeout(()=>{
      restoreSearchControls(el);
      if(seed)el.input.value=seed;
      el.input.focus({preventScroll:true});
      el.input.select();
      runSearch(el.input.value.trim());
    },40);
  }

  function closeSearch(){
    const el=elements();
    state.isOpen=false;
    state.activeIndex=-1;
    state.requestToken+=1;
    state.searchController?.abort();
    state.searchController=null;
    clearTimeout(state.debounce);
    document.body.classList.remove('global-search-open');
    clearTimeout(state.closeTimer);
    state.closeTimer=window.setTimeout(()=>{
      if(state.isOpen)return;
      el.panel?.setAttribute('aria-hidden','true');
      el.panel?.setAttribute('inert','');
      el.backdrop?.setAttribute('aria-hidden','true');
    },380);
  }
  function restoreSearchControls(el){
    if(!el.input)return;
    el.input.disabled=false;
    el.input.readOnly=false;
    el.input.removeAttribute('inert');
    el.input.setAttribute('aria-disabled','false');
    if(el.platform){el.platform.disabled=false;el.platform.readOnly=false;el.platform.removeAttribute('inert');}
    if(el.provider){el.provider.disabled=false;el.provider.removeAttribute('inert');}
  }
  function setMode(mode, rerun=true){
    state.mode=mode==='discover'?'discover':'museum';
    state.requestToken += 1;
    state.searchController?.abort();
    state.searchController=null;
    clearTimeout(state.debounce);
    const el=elements();
    const discover=state.mode==='discover';
    restoreSearchControls(el);
    el.panel?.classList.toggle('is-discover-mode',discover);
    el.museumMode?.classList.toggle('is-active',!discover);
    el.discoverMode?.classList.toggle('is-active',discover);
    el.museumMode?.setAttribute('aria-selected',String(!discover));
    el.discoverMode?.setAttribute('aria-selected',String(discover));
    if(el.discoverOptions){
      el.discoverOptions.hidden=false;
      el.discoverOptions.classList.toggle('is-visible',discover);
      el.discoverOptions.setAttribute('aria-hidden',String(!discover));
      if(discover)el.discoverOptions.removeAttribute('inert');
      else el.discoverOptions.setAttribute('inert','');
    }
    if(el.heading)el.heading.textContent=discover?'Discover a game':'Search your museum';
    if(el.input)el.input.placeholder=discover?'Search online game information...':'Search games, collections, metadata...';
    setStatus(discover?'Search enabled information sources and add a game directly.':'Start typing to search across your library.');
    if(el.results)el.results.innerHTML='';
    requestAnimationFrame(()=>{
      restoreSearchControls(el);
      el.input?.focus({preventScroll:true});
      const length=el.input?.value.length||0;
      try{el.input?.setSelectionRange(length,length);}catch(_error){}
      if(rerun&&el.input?.value.trim())runSearch(el.input.value.trim());
    });
  }
  function renderMuseum(data){ const el=elements(),games=data.games||[],collections=data.collections||[];state.activeIndex=-1;if(!games.length&&!collections.length){el.results.innerHTML='<div class="global-search-empty">No museum results found.</div>';return;}el.results.innerHTML=(games.length?`<div class="global-search-section-title">Games</div>${games.map(g=>{const cover=g.cover_src?`<img src="${esc(g.cover_src)}" alt="${esc(g.title)}">`:'🎮';const sub=[g.release_year,g.developer,g.category].filter(Boolean).join(' · ');return `<button class="global-search-result" type="button" data-kind="game" data-game-id="${g.id}"><span class="global-search-thumb">${cover}</span><span><span class="global-search-title">${esc(g.title)}</span><span class="global-search-subtitle">${esc(sub||g.path||'Game')}</span></span><span class="global-search-type">In Museum</span></button>`}).join('')}`:'')+(collections.length?`<div class="global-search-section-title">Collections</div>${collections.map(c=>`<button class="global-search-result" type="button" data-kind="collection" data-category="${esc(c.name)}"><span class="global-search-thumb">▤</span><span><span class="global-search-title">${esc(c.name)}</span><span class="global-search-subtitle">${c.count} game${Number(c.count)===1?'':'s'}</span></span><span class="global-search-type">Shelf</span></button>`).join('')}`:''); }
  function renderDiscover(data){ const el=elements(),items=data.results||[];state.activeIndex=-1;if(!items.length){el.results.innerHTML='<div class="global-search-empty">No close online matches found. Try a shorter title, or use Museum → Add Game for manual entry.</div>';return;}el.results.innerHTML=`<div class="global-search-section-title">Discover</div>${items.map(item=>{const source=String(item.source||'Information source');const cover=item.cover_url?`<img src="${esc(item.cover_url)}" alt="">`:'🎮';const sub=[item.platform,item.release_year,item.developer].filter(Boolean).join(' · ');const confidence=Math.max(0,Math.min(100,Number(item.confidence||0)));return `<article class="global-search-result global-discover-result"><span class="global-search-thumb">${cover}</span><span class="global-discover-copy"><span class="global-search-title">${esc(item.title||'Untitled game')}</span><span class="global-search-subtitle">${esc(sub||item.description||source)}</span><span class="global-discover-meta">${esc(source)} · ${confidence}% match</span></span><button class="global-discover-add" type="button" data-kind="discover" data-source="${esc(source)}" data-external-id="${esc(item.external_id||'')}">Add to Museum</button></article>`}).join('')}`; }
  async function runSearch(query){
    query=(query||'').trim();
    state.lastQuery=query;
    const el=elements();
    restoreSearchControls(el);
    const modeAtStart=state.mode;
    const requestToken=++state.requestToken;
    state.searchController?.abort();
    state.searchController=null;
    if(!query){setStatus(modeAtStart==='discover'?'Search enabled information sources and add a game directly.':'Start typing to search across your library.');if(el.results)el.results.innerHTML='';return;}
    const controller=new AbortController();
    state.searchController=controller;
    setStatus(modeAtStart==='discover'?'Searching information sources...':'Searching museum...');
    try{
      let url;
      if(modeAtStart==='discover'){
        const p=new URLSearchParams({query,provider:el.provider?.value||'all',platform:el.platform?.value.trim()||''});
        url=`/api/games/add/search?${p}`;
      }else url=`/api/search?q=${encodeURIComponent(query)}`;
      const response=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});
      const data=await response.json();
      if(!response.ok||data.success===false)throw new Error(data.message||'Search failed.');
      if(requestToken!==state.requestToken||query!==state.lastQuery||modeAtStart!==state.mode)return;
      if(modeAtStart==='discover'){
        const total=(data.results||[]).length;
        setStatus(`${total} possible match${total===1?'':'es'} found for “${query}”.`);
        renderDiscover(data);
      }else{
        const total=Number(data.total||0);
        setStatus(`${total} result${total===1?'':'s'} found for “${query}”.`);
        renderMuseum(data);
      }
    }catch(error){
      if(error?.name==='AbortError')return;
      if(requestToken!==state.requestToken||modeAtStart!==state.mode)return;
      setStatus(error.message||'Search failed.');
      if(el.results)el.results.innerHTML=`<div class="global-search-empty warning-text">${esc(error.message)}</div>`;
    }finally{
      if(state.searchController===controller)state.searchController=null;
      restoreSearchControls(el);
    }
  }
  function scheduleSearch(){const el=elements();clearTimeout(state.debounce);state.debounce=setTimeout(()=>runSearch(el.input?.value||''),180);}
  function openGame(id){closeSearch();const trigger=document.querySelector(`.focus-card-trigger[data-game-id="${id}"]`);if(trigger){trigger.click();return;}const url=`/library?open=${encodeURIComponent(id)}`;window.VaultarrSmoothNavigate?window.VaultarrSmoothNavigate(url,true):location.assign(url);}
  function openCollection(category){closeSearch();const url=`/library?category=${encodeURIComponent(category)}`;window.VaultarrSmoothNavigate?window.VaultarrSmoothNavigate(url,true):location.assign(url);}
  function closeAdd(){const el=elements();el.addBackdrop?.classList.remove('visible');el.addDialog?.classList.remove('visible');setTimeout(()=>{if(el.addBackdrop)el.addBackdrop.hidden=true;if(el.addDialog)el.addDialog.hidden=true;},180);}
  async function openAdd(button){const el=elements();button.disabled=true;const original=button.textContent;button.textContent='Loading…';try{const p=new URLSearchParams({source:button.dataset.source,external_id:button.dataset.externalId});const r=await fetch(`/api/games/add/preview?${p}`),d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||'Preview failed.');state.selected={source:button.dataset.source,external_id:button.dataset.externalId,details:d.details};const x=d.details||{};qs('globalAddTitle').textContent=x.title||'Untitled game';qs('globalAddSummary').textContent=[x.platform,x.release_year,x.developer].filter(Boolean).join(' · ')||button.dataset.source;qs('globalAddDescription').textContent=x.description||'Vaultarr will continue preparing this record after it is added.';qs('globalAddFacts').innerHTML=[['Developer',x.developer],['Publisher',x.publisher],['Genre',x.genre],['Source',x.metadata_source||button.dataset.source]].filter(([,v])=>v).map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');qs('globalAddCover').innerHTML=x.cover_url?`<img src="${esc(x.cover_url)}" alt="">`:'<span>🎮</span>';el.addStatus.textContent='';el.addBackdrop.hidden=false;el.addDialog.hidden=false;requestAnimationFrame(()=>{el.addBackdrop.classList.add('visible');el.addDialog.classList.add('visible');});}catch(error){setStatus(error.message||'Preview failed.');}finally{button.disabled=false;button.textContent=original;}}
  async function confirmAdd(){const el=elements();if(!state.selected)return;el.addConfirm.disabled=true;el.addConfirm.textContent='Adding…';el.addStatus.textContent='Creating the museum record and preparing it…';try{const r=await fetch('/api/games/add/from-provider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:state.selected.source,external_id:state.selected.external_id,path:qs('globalAddPath').value.trim(),category:qs('globalAddCategory').value,source_type:'Imported'})}),d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||'The game could not be added.');el.addStatus.textContent=d.message||'Game added.';el.addConfirm.textContent='Added';const payload={game_id:d.game_id,title:d.title||state.selected.details?.title||'Game',category:d.category||qs('globalAddCategory').value,redirect:d.redirect||`/games/${d.game_id}`,existing:Boolean(d.existing)};window.VaultarrEvents?.emit('game-added',payload);document.querySelectorAll(`.global-discover-add[data-source="${CSS.escape(state.selected.source)}"][data-external-id="${CSS.escape(state.selected.external_id)}"]`).forEach(button=>{button.disabled=true;button.textContent='In Museum';button.classList.add('is-added');});setTimeout(()=>{closeAdd();closeSearch();window.VaultarrToast?.({title:payload.existing?'Already in Museum':'Added to Museum',message:payload.existing?`${payload.title} is already in your museum.`:`${payload.title} was added and is being prepared.`,actionLabel:'View',action:()=>{const trigger=document.querySelector(`.focus-card-trigger[data-game-id="${payload.game_id}"]`);if(trigger)trigger.click();else if(window.VaultarrSmoothNavigate)window.VaultarrSmoothNavigate(payload.redirect,true);else location.assign(payload.redirect);}});el.addConfirm.disabled=false;el.addConfirm.textContent='Add to Museum';state.selected=null;},420);}catch(error){el.addStatus.textContent=error.message||'The game could not be added.';el.addConfirm.disabled=false;el.addConfirm.textContent='Add to Museum';}}
  function activate(button){const kind=button.dataset.kind;if(kind==='game')openGame(button.dataset.gameId);else if(kind==='collection')openCollection(button.dataset.category||'All Games');else if(kind==='discover')openAdd(button);}
  function setActive(index){const buttons=[...(elements().results?.querySelectorAll('[data-kind]')||[])];if(!buttons.length)return;state.activeIndex=Math.max(0,Math.min(buttons.length-1,index));buttons.forEach((b,i)=>b.classList.toggle('is-active',i===state.activeIndex));buttons[state.activeIndex]?.scrollIntoView({block:'nearest'});}

  function closeSearchSelects(except=null){
    document.querySelectorAll('.global-vault-select.is-open').forEach(wrapper=>{
      if(wrapper===except)return;
      wrapper.classList.remove('is-open');
      wrapper.querySelector('.global-vault-select-trigger')?.setAttribute('aria-expanded','false');
      wrapper.querySelector('.global-vault-select-menu')?.setAttribute('aria-hidden','true');
    });
  }

  function enhanceSearchSelect(select){
    if(!select||select.dataset.globalSelectEnhanced==='true')return;
    select.dataset.globalSelectEnhanced='true';
    select.classList.add('global-vault-select-native');
    select.tabIndex=-1;
    select.setAttribute('aria-hidden','true');

    const wrapper=document.createElement('div');
    wrapper.className='global-vault-select';
    select.parentNode.insertBefore(wrapper,select);
    wrapper.append(select);

    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='global-vault-select-trigger';
    trigger.setAttribute('aria-haspopup','listbox');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-label',select.getAttribute('aria-label')||'Choose option');
    trigger.innerHTML='<span class="global-vault-select-value"></span><span class="global-vault-select-chevron" aria-hidden="true"></span>';

    const menu=document.createElement('div');
    menu.className='global-vault-select-menu';
    menu.id=`${select.id}VaultMenu`;
    menu.setAttribute('role','listbox');
    menu.setAttribute('aria-label',select.getAttribute('aria-label')||'Options');
    menu.setAttribute('aria-hidden','true');
    trigger.setAttribute('aria-controls',menu.id);

    const sync=()=>{
      const selected=select.options[select.selectedIndex]||select.options[0];
      trigger.querySelector('.global-vault-select-value').textContent=selected?.textContent||'Choose';
      menu.querySelectorAll('.global-vault-select-option').forEach(item=>{
        const active=item.dataset.value===select.value;
        item.classList.toggle('is-selected',active);
        item.setAttribute('aria-selected',String(active));
      });
    };
    const close=(restoreFocus=false)=>{
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-hidden','true');
      if(restoreFocus)trigger.focus({preventScroll:true});
    };
    const open=()=>{
      closeSearchSelects(wrapper);
      wrapper.classList.add('is-open');
      trigger.setAttribute('aria-expanded','true');
      menu.setAttribute('aria-hidden','false');
    };

    Array.from(select.options).forEach((option,index)=>{
      const item=document.createElement('button');
      item.type='button';
      item.className='global-vault-select-option';
      item.dataset.value=option.value;
      item.style.setProperty('--global-option-delay',`${55+(index*45)}ms`);
      item.setAttribute('role','option');
      item.textContent=option.textContent;
      item.addEventListener('click',()=>{
        select.value=option.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        close(true);
      });
      menu.append(item);
    });

    trigger.addEventListener('click',event=>{
      event.stopPropagation();
      wrapper.classList.contains('is-open')?close():open();
    });
    trigger.addEventListener('keydown',event=>{
      if(!['ArrowDown','Enter',' '].includes(event.key))return;
      event.preventDefault();
      open();
      (menu.querySelector('[aria-selected="true"]')||menu.querySelector('.global-vault-select-option'))?.focus({preventScroll:true});
    });
    menu.addEventListener('keydown',event=>{
      const options=Array.from(menu.querySelectorAll('.global-vault-select-option'));
      const index=options.indexOf(document.activeElement);
      if(event.key==='Escape'){
        event.preventDefault();
        close(true);
      }else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        const direction=event.key==='ArrowDown'?1:-1;
        options[Math.max(0,Math.min(options.length-1,index+direction))]?.focus({preventScroll:true});
      }
    });
    select.addEventListener('change',sync);
    wrapper.append(trigger,menu);
    sync();
  }
  function bind(){
    const el=elements();
    if(!el.panel)return;

    // Controls inside the persistent dialog are bound once. The sidebar open
    // button is handled through delegation so smooth page swaps can never
    // leave behind a stale, non-working button reference.
    if(el.panel.dataset.bound!=='1'){
      el.panel.dataset.bound='1';
      el.closeButton?.addEventListener('click',closeSearch);
      el.backdrop?.addEventListener('click',closeSearch);
      el.input?.addEventListener('input',scheduleSearch);
      el.platform?.addEventListener('input',scheduleSearch);
      el.provider?.addEventListener('change',scheduleSearch);
      el.museumMode?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setMode('museum');});
      el.discoverMode?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setMode('discover');});
      el.results?.addEventListener('click',event=>{const button=event.target.closest('[data-kind]');if(button)activate(button);});
      el.addClose?.addEventListener('click',closeAdd);
      el.addCancel?.addEventListener('click',closeAdd);
      el.addBackdrop?.addEventListener('click',closeAdd);
      el.addConfirm?.addEventListener('click',confirmAdd);
      enhanceSearchSelect(el.provider);
      enhanceSearchSelect(qs('globalAddCategory'));
      el.panel.setAttribute('inert','');
    }

    if(!window.__vaultarrGlobalSearchDelegated){
      window.__vaultarrGlobalSearchDelegated=true;
      document.addEventListener('click',event=>{
        const opener=event.target.closest('#globalSearchOpen');
        if(!opener){
          if(!event.target.closest('.global-vault-select'))closeSearchSelects();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        openSearch();
      },true);

      document.addEventListener('keydown',event=>{
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
          event.preventDefault();
          event.stopImmediatePropagation();
          openSearch();
          return;
        }
        if(!state.isOpen)return;
        if(event.key==='Escape'){
          event.preventDefault();
          if(!elements().addDialog?.hidden)closeAdd();else closeSearch();
          return;
        }
        const buttons=[...(elements().results?.querySelectorAll('[data-kind]')||[])];
        if(!buttons.length)return;
        if(event.key==='ArrowDown'){event.preventDefault();setActive(state.activeIndex+1);}
        if(event.key==='ArrowUp'){event.preventDefault();setActive(state.activeIndex<=0?buttons.length-1:state.activeIndex-1);}
        if(event.key==='Enter'&&state.activeIndex>=0){event.preventDefault();activate(buttons[state.activeIndex]);}
      },true);
    }

    // A page swap must not leave an invisible modal layer over the app.
    if(!state.isOpen){
      clearTimeout(state.closeTimer);
      document.body.classList.remove('global-search-open');
      el.panel.setAttribute('aria-hidden','true');
      el.panel.setAttribute('inert','');
      el.backdrop?.setAttribute('aria-hidden','true');
    }else{
      restoreSearchControls(el);
    }
  }
  window.VaultarrOpenGlobalSearch=openSearch;
  window.VaultarrCloseGlobalSearch=closeSearch;
  document.addEventListener('DOMContentLoaded',bind);
  document.addEventListener('vaultarr:page-loaded',bind);
})();
