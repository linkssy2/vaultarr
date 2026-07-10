(() => {
  const button = document.getElementById('mobileMenuButton');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('mobileNavBackdrop');
  if (!button || !sidebar || !backdrop) return;

  const setOpen = (open) => {
    sidebar.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    document.body.classList.toggle('mobile-nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    sidebar.setAttribute('aria-hidden', String(!open && window.innerWidth <= 980));
  };

  button.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
  backdrop.addEventListener('click', () => setOpen(false));

  sidebar.addEventListener('click', (event) => {
    if (window.innerWidth <= 980 && event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) {
      setOpen(false);
      sidebar.removeAttribute('aria-hidden');
    } else if (!sidebar.classList.contains('is-open')) {
      sidebar.setAttribute('aria-hidden', 'true');
    }
  });

  if (window.innerWidth <= 980) sidebar.setAttribute('aria-hidden', 'true');
})();
