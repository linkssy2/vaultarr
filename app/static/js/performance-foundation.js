(() => {
  let focusPromise = null;
  function loadFocusMode() {
    if (window.__vaultarrFocusModeLoaded) return Promise.resolve();
    if (focusPromise) return focusPromise;
    focusPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/static/js/focus-mode.js?v=1.5.5';
      script.async = true;
      script.onload = () => { window.__vaultarrFocusModeLoaded = true; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return focusPromise;
  }

  function preparePage() {
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      if (!img.closest('.brand, .focus-panel, .login-brand')) img.loading = 'lazy';
      img.decoding = 'async';
    });
    if (document.querySelector('.focus-card-trigger')) loadFocusMode().catch(console.error);
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.focus-card-trigger')) return;
    if (!window.__vaultarrFocusModeLoaded) {
      event.preventDefault();
      event.stopImmediatePropagation();
      loadFocusMode().then(() => event.target.closest('.focus-card-trigger')?.click()).catch(console.error);
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('vaultarr-page-hidden', document.hidden);
    document.dispatchEvent(new CustomEvent(document.hidden ? 'vaultarr:activity-pause' : 'vaultarr:activity-resume'));
  });
  document.addEventListener('DOMContentLoaded', preparePage);
  document.addEventListener('vaultarr:page-loaded', preparePage);
})();
