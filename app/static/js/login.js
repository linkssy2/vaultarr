(() => {
  const form = document.querySelector("[data-login-form]");
  const submit = document.querySelector("[data-login-submit]");
  if (!form || !submit) return;

  const transitionKey = "vaultarr:login-handoff";
  const transitionDelay = 480;
  let submitting = false;

  try {
    const startedAt = Number(sessionStorage.getItem(transitionKey) || 0);
    if (startedAt && Date.now() - startedAt < 8000) {
      sessionStorage.removeItem(transitionKey);
      document.body.classList.add("is-returning");
    }
  } catch (_) {}

  form.addEventListener("submit", (event) => {
    if (submitting) return;
    event.preventDefault();
    submitting = true;

    form.closest(".login-access-chamber")?.classList.add("is-authenticating");
    document.body.classList.add("is-leaving");
    submit.disabled = true;
    const label = submit.querySelector("span");
    if (label) label.textContent = "Opening Museum";

    try { sessionStorage.setItem(transitionKey, String(Date.now())); } catch (_) {}
    window.setTimeout(() => HTMLFormElement.prototype.submit.call(form), transitionDelay);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    submitting = false;
    document.body.classList.remove("is-leaving");
    form.closest(".login-access-chamber")?.classList.remove("is-authenticating");
    submit.disabled = false;
    const label = submit.querySelector("span");
    if (label) label.textContent = "Open Museum";
  });
})();
