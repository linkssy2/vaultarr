(() => {
  const TRANSIENT_BODY_CLASSES = [
    'vault-nav-loading',
    'vault-nav-leaving',
    'vault-nav-entering',
    'vault-sidebar-nav-leaving',
    'vault-sidebar-nav-entering',
    'vault-view-transitioning'
  ];

  function repairInteractionState() {
    // Completed smooth navigations occasionally left a transient class or an
    // invisible dialog layer behind. Either can intercept hover/click input.
    TRANSIENT_BODY_CLASSES.forEach((name) => document.body.classList.remove(name));

    const panel = document.getElementById('globalSearchPanel');
    const backdrop = document.getElementById('globalSearchBackdrop');
    const open = document.body.classList.contains('global-search-open');
    if (!open) {
      panel?.setAttribute('aria-hidden', 'true');
      panel?.setAttribute('inert', '');
      backdrop?.setAttribute('aria-hidden', 'true');
    }

    // Rebind page-specific behavior after every content replacement. All
    // initializers are idempotent and skip elements already prepared.
    window.VaultarrInitLibrary?.();

    document.querySelectorAll('button, a, input, select, textarea').forEach((node) => {
      if (node.closest('[inert]')) return;
      if (node.dataset.vaultarrInteractionReady === '1') return;
      node.dataset.vaultarrInteractionReady = '1';
      node.addEventListener('pointerdown', () => node.classList.add('is-pressing'));
      const clear = () => node.classList.remove('is-pressing');
      node.addEventListener('pointerup', clear);
      node.addEventListener('pointercancel', clear);
      node.addEventListener('pointerleave', clear);
    });
  }

  document.addEventListener('DOMContentLoaded', repairInteractionState);
  document.addEventListener('vaultarr:page-loaded', () => requestAnimationFrame(repairInteractionState));
  document.addEventListener('vaultarr:focus-closed', () => requestAnimationFrame(repairInteractionState));
  window.addEventListener('pageshow', repairInteractionState);
})();
