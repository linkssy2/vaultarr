(() => {
  const TRANSIENT_BODY_CLASSES = [
    'vault-nav-loading',
    'vault-nav-leaving',
    'vault-nav-entering',
    'vault-sidebar-nav-leaving',
    'vault-sidebar-nav-entering',
    'vault-view-transitioning'
  ];

  let staleRepairTimer = 0;

  function clearStaleNavigationState() {
    // Never interrupt a navigation that smooth-navigation.js still owns.
    // Earlier builds cleared the enter class on the first animation frame
    // after page replacement, which caused the visible second-stage jerk.
    if (document.body.dataset.vaultNavActive) return;
    TRANSIENT_BODY_CLASSES.forEach((name) => document.body.classList.remove(name));
  }

  function scheduleStaleNavigationRepair() {
    window.clearTimeout(staleRepairTimer);
    staleRepairTimer = window.setTimeout(clearStaleNavigationState, 1100);
  }

  function repairInteractionState({ clearNavigation = false } = {}) {
    if (clearNavigation) clearStaleNavigationState();
    else scheduleStaleNavigationRepair();

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

  document.addEventListener('DOMContentLoaded', () => repairInteractionState({ clearNavigation: true }));
  document.addEventListener('vaultarr:page-loaded', () => requestAnimationFrame(() => repairInteractionState()));
  document.addEventListener('vaultarr:focus-closed', () => requestAnimationFrame(() => repairInteractionState()));
  window.addEventListener('pageshow', () => repairInteractionState({ clearNavigation: true }));
})();
