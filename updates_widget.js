// Adds a small “update status” banner for users when an update was removed / not yet applied.
// Pure HTML/JS (no backend).

(function () {
  const STORAGE_KEY = 'creatorUpdateStatus_v1';

  // Update this list when you apply something.
  // If you delete a user submission, you can keep using the “working” status.
  const DEFAULT_STATUS = {
    // message can be: 'working' | 'applied'
    message: 'working',
    // optional: what update was applied
    appliedText: 'We already applied the update you asked for! ✅',
    workingText: "If you don’t see your update submission yet, the creator is working on it. 🔧",
    // timestamp used only to allow “cooldown” display
    updatedAt: Date.now()
  };

  function getStatus() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATUS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATUS, ...(parsed || {}) };
    } catch (e) {
      return DEFAULT_STATUS;
    }
  }

  function setStatus(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getStatus(), ...(next || {}), updatedAt: Date.now() }));
    } catch (e) {}
  }

  function renderBanner() {
    const el = document.getElementById('updateStatusBanner');
    if (!el) return;

    const status = getStatus();

    const message = status.message === 'applied'
      ? (status.appliedText || DEFAULT_STATUS.appliedText)
      : (status.workingText || DEFAULT_STATUS.workingText);

    el.textContent = message;
  }

  function ensureExposedApi() {
    // Optional: allow creator to toggle status from DevTools console.
    // Example: window.creatorUpdateWidgetSetStatus('applied')
    window.creatorUpdateWidgetSetStatus = function (mode) {
      if (mode !== 'applied' && mode !== 'working') return;
      setStatus({ message: mode });
      renderBanner();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderBanner();
    ensureExposedApi();
  });
})();

