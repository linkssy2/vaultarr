(() => {
  if (window.VaultarrInterfaceCohesion?.installed) return;

  function bind(root = document) {
    root.querySelectorAll('a.disabled, a[aria-disabled="true"]').forEach((link) => {
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
    });
  }

  document.addEventListener('click', (event) => {
    const disabled = event.target.closest('a.disabled, a[aria-disabled="true"]');
    if (!disabled) return;
    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('vaultarr:page-loaded', () => bind(document));
  bind(document);
  window.VaultarrInterfaceCohesion = { installed: true, bind };
})();
