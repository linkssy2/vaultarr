(() => {
  if (window.VaultarrEvents) return;
  const target = new EventTarget();
  const api = {
    on(name, handler) { target.addEventListener(name, handler); return () => target.removeEventListener(name, handler); },
    emit(name, detail = {}) {
      target.dispatchEvent(new CustomEvent(name, { detail }));
      document.dispatchEvent(new CustomEvent(`vaultarr:${name}`, { detail }));
    }
  };
  window.VaultarrEvents = api;

  function showToast({ title = 'Vaultarr', message = '', tone = 'success', actionLabel = '', action = null } = {}) {
    document.querySelector('.vaultarr-live-toast')?.remove();
    const toast = document.createElement('aside');
    toast.className = `vaultarr-live-toast ${tone}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<div><strong></strong><span></span></div>${actionLabel ? '<button type="button"></button>' : ''}`;
    toast.querySelector('strong').textContent = title;
    toast.querySelector('span').textContent = message;
    const button = toast.querySelector('button');
    if (button) {
      button.textContent = actionLabel;
      button.addEventListener('click', () => { if (typeof action === 'function') action(); toast.remove(); });
    }
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => { toast.classList.remove('show'); window.setTimeout(() => toast.remove(), 250); }, 6500);
  }
  window.VaultarrToast = showToast;
})();
