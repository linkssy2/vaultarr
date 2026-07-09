(() => {
  let audioContext = null;

  function getContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  function playTone(type = "badge") {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.055, now + 0.035);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      master.connect(ctx.destination);

      const patterns = {
        badge: [392, 587.33, 783.99],
        manual: [293.66, 440, 587.33],
        preserve: [196, 392, 523.25],
        sync: [329.63, 493.88, 659.25],
      };
      const notes = patterns[type] || patterns.badge;
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.085);
        gain.gain.setValueAtTime(0.0001, now + index * 0.085);
        gain.gain.exponentialRampToValueAtTime(0.38, now + index * 0.085 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.54 + index * 0.08);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now + index * 0.085);
        osc.stop(now + 0.82 + index * 0.08);
      });
    } catch (_) {}
  }

  function bindExperience() {
    document.querySelectorAll(".audio-chip").forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => playTone(button.dataset.sound || "badge"));
    });
    const test = document.getElementById("badgeSoundTest");
    if (test && test.dataset.bound !== "1") {
      test.dataset.bound = "1";
      test.addEventListener("click", () => playTone("badge"));
    }
  }

  window.VaultarrExperienceSound = playTone;
  document.addEventListener("DOMContentLoaded", bindExperience);
  document.addEventListener("vaultarr:page-loaded", bindExperience);
})();
