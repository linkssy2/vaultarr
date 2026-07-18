(() => {
  const form = document.querySelector("[data-login-form]");
  const submit = document.querySelector("[data-login-submit]");
  if (!form || !submit) return;

  form.addEventListener("submit", () => {
    form.closest(".login-access-chamber")?.classList.add("is-authenticating");
    submit.disabled = true;
    const label = submit.querySelector("span");
    if (label) label.textContent = "Opening Museum";
  });
})();
