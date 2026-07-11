(() => {
  "use strict";
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = n => Math.max(0, Math.min(100, Number(n) || 0));
  function update(row, progress, stage) {
    const value = clamp(progress);
    const fill = row.querySelector('.curator-meter-fill');
    const percent = row.querySelector('[data-curator-percent]');
    const status = row.querySelector('[data-curator-status]');
    const meter = row.querySelector('.curator-meter');
    if (fill) fill.style.width = `${value}%`;
    if (percent) percent.textContent = `${Math.round(value)}%`;
    if (status && stage) status.textContent = stage;
    if (meter) meter.setAttribute('aria-valuenow', String(Math.round(value)));
  }
  function toast(title, message, tone='success') {
    const el=document.createElement('div'); el.className=`curator-toast ${tone}`;
    el.innerHTML=`<strong>${title}</strong><span>${message}</span>`; document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),250)},3500);
  }
  async function run(row, button) {
    if (!row || button.disabled) return;
    const id=row.dataset.gameId;
    row.classList.remove('is-failed','is-complete'); row.classList.add('is-curating'); row.setAttribute('aria-busy','true');
    button.disabled=true; button.classList.add('is-working'); button.textContent='Preparing'; update(row,0,'Starting…');
    try {
      const start=await fetch(`/api/curator/games/${id}/start`,{method:'POST',headers:{Accept:'application/json'}});
      const started=await start.json(); if(!start.ok||!started.success) throw new Error(started.message||'Could not start cataloging.');
      while(true){
        await sleep(500);
        const res=await fetch(`/api/curator/games/${id}/status`,{headers:{Accept:'application/json'},cache:'no-store'});
        const job=await res.json(); if(!res.ok||!job.success) throw new Error(job.message||'Could not read progress.');
        update(row,job.progress,job.stage);
        if(job.status==='complete'){
          const score=job.result?.score ?? job.curator_score ?? 100;
          update(row,score,'Museum Ready'); row.classList.remove('is-curating'); row.classList.add('is-complete');
          button.disabled=false; button.classList.remove('is-working'); button.textContent='Curate'; row.setAttribute('aria-busy','false');
          toast('Museum Ready', row.querySelector('strong')?.textContent || 'Game cataloging finished.'); break;
        }
        if(job.status==='failed') throw new Error(job.last_error||'Cataloging failed.');
      }
    } catch(err){
      row.classList.remove('is-curating'); row.classList.add('is-failed'); row.setAttribute('aria-busy','false');
      button.disabled=false; button.classList.remove('is-working'); button.textContent='Retry';
      const status=row.querySelector('[data-curator-status]'); if(status) status.textContent=err.message;
      toast('Needs Review',err.message,'warning');
    }
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-curator-run]'); if(!b)return; e.preventDefault(); run(b.closest('[data-curator-row]'),b);});
})();
