(() => {
  function preparePage() {
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      if (!img.closest('.brand, .focus-panel, .login-brand')) img.loading = 'lazy';
      img.decoding = 'async';
    });
  }

  function syncVisibilityState() {
    document.documentElement.classList.toggle('vaultarr-page-hidden', document.hidden);
    document.dispatchEvent(new CustomEvent(document.hidden ? 'vaultarr:activity-pause' : 'vaultarr:activity-resume'));
  }

  document.addEventListener('visibilitychange', syncVisibilityState);
  document.addEventListener('DOMContentLoaded', preparePage);
  document.addEventListener('vaultarr:page-loaded', preparePage);
})();
