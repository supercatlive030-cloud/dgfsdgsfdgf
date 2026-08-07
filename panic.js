// ==================== PANIC BUTTON ==================== //
// A floating red button fixed to the top-right corner of the page.
// Instantly redirects to a safe URL (like Google) if someone walks by.
// The target URL and visibility can be customized in the Settings modal.

(function () {
  'use strict';

  const STORAGE_KEY = 'panicButtonSettings';

  function getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      url: 'https://www.google.com',
      enabled: true,
      label: '🚨'
    };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function triggerPanic() {
    const settings = getSettings();
    window.location.href = settings.url || 'https://www.google.com';
  }

  function createButton() {
    if (document.getElementById('panicBtn')) return;
    if (!getSettings().enabled) return;

    const btn = document.createElement('button');
    btn.id = 'panicBtn';
    btn.type = 'button';
    btn.title = 'Quick hide';
    btn.setAttribute('aria-label', 'Panic button');
    btn.textContent = getSettings().label || '🚨';

    // Fixed to the top-right corner (below the navbar, above content).
    btn.style.position = 'fixed';
    btn.style.top = '72px';
    btn.style.right = '16px';
    btn.style.zIndex = '2147483647';
    btn.style.width = '46px';
    btn.style.height = '46px';
    btn.style.borderRadius = '50%';
    btn.style.border = '2px solid rgba(255, 77, 77, 0.6)';
    btn.style.background = 'linear-gradient(135deg, #ff3b3b, #c1121f)';
    btn.style.color = '#ffffff';
    btn.style.fontSize = '20px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 8px 20px rgba(255, 0, 0, 0.4)';
    btn.style.backdropFilter = 'blur(6px)';
    btn.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.lineHeight = '1';

    btn.onmouseenter = function () {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 12px 30px rgba(255, 0, 0, 0.6)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 8px 20px rgba(255, 0, 0, 0.4)';
    };

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      triggerPanic();
    });

    document.body.appendChild(btn);
  }

  // Expose an API so the Settings modal can update the button.
  window.panicButton = {
    trigger: triggerPanic,
    getSettings: getSettings,
    saveSettings: function (settings) {
      saveSettings(settings);
      // Rebuild (or remove) the button based on new settings.
      const existing = document.getElementById('panicBtn');
      if (existing) existing.remove();
      createButton();
    }
  };

  function init() {
    createButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
