document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('darkReaderStatus');
  const warning = document.getElementById('darkReaderWarning');

  const detected = Boolean(
    document.querySelector('style.darkreader') ||
    document.querySelector('[data-darkreader-mode]') ||
    document.documentElement.className.toLowerCase().includes('darkreader') ||
    [...document.querySelectorAll('style')].some((style) =>
      (style.textContent || '').includes('darkreader') ||
      (style.getAttribute('class') || '').includes('darkreader')
    )
  );

  if (status) {
    status.textContent = detected ? 'Detected' : 'Not detected';
    status.classList.toggle('detected', detected);
  }

  if (warning && detected) {
    warning.hidden = false;
  }
});
