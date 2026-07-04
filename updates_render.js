(function () {
  const STORAGE_KEY = 'siteUpdates_v1';

  const DEFAULT_UPDATES = [
    {
      id: 'default-rename',
      icon: '✨',
      title: 'Website renamed',
      message: 'We renamed the website to “diddys playhouse”.',
      dateText: 'Today',
      createdAt: Date.now() - 1000,
      showIn: 'both',
      variant: 'blue'
    },
    {
      id: 'default-games',
      icon: '🎮',
      title: 'New games & bug fixes',
      message: 'We added several new games to the game library and fixed bugs to improve the games/updates experience.',
      dateText: 'Today',
      createdAt: Date.now(),
      showIn: 'both',
      variant: 'blue'
    }
  ];

  function safeParseJSON(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
      })[c]);
  }

  function getUpdates() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UPDATES.slice();
    const parsed = safeParseJSON(raw, []);

    // Support both array and { updates: [] }
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && Array.isArray(parsed.updates) && parsed.updates.length > 0) return parsed.updates;
    return DEFAULT_UPDATES.slice();
  }

  function normalizeUpdate(u) {
    if (!u || typeof u !== 'object') {
      return {
        id: String(Math.random()).slice(2),
        title: 'Untitled',
        message: String(u || ''),
        icon: '✨',
        dateText: 'Today',
        createdAt: Date.now(),
      };
    }

    const id = u.id != null ? String(u.id) : String(u.timestamp || Math.random()).slice(0, 20);
    const createdAt = typeof u.createdAt === 'number' ? u.createdAt : (Date.parse(u.createdAt) || u.timestamp || Date.now());

    const title = typeof u.title === 'string' && u.title.trim() ? u.title.trim() : 'Untitled';
    const message = typeof u.message === 'string' ? u.message : (typeof u.text === 'string' ? u.text : '');
    const icon = typeof u.icon === 'string' && u.icon.trim() ? u.icon.trim() : '✨';
    const dateText = typeof u.dateText === 'string' && u.dateText.trim() ? u.dateText.trim() : 'Today';

    const variant = u.variant && typeof u.variant === 'string' ? u.variant : 'normal';

    return {
      id,
      title,
      message,
      icon,
      dateText,
      createdAt,
      variant,
      // where it should show
      showIn:
        u.showIn && typeof u.showIn === 'string'
          ? u.showIn
          : 'both' // 'whatsNew' | 'latest' | 'both'
    };
  }

  function getVariantClass(variant, prefix) {
    return variant === 'blue' ? ` ${prefix}--blue` : '';
  }

  function renderWhatsNew(updates) {
    const container = document.querySelector('#whatsNewModal .modal-updates');
    if (!container) return;

    const hasSummary = !!document.querySelector('#whatsNewModal .modal-summary');

    // Filter
    const items = updates
      .map(normalizeUpdate)
      .filter(u => (u.showIn === 'whatsNew' || u.showIn === 'both') && (u.title || u.message));

    if (items.length === 0) {
      container.innerHTML = '';
      container.insertAdjacentHTML(
        'beforeend',
        '<div class="modal-update-item"><h4>✨ No updates yet</h4><p>We renamed the website to “diddys playhouse”, added several new games to the game library, and fixed bugs to improve the games/updates experience.</p></div>'
      );
      return;
    }

    container.innerHTML = items
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 8)
      .map((u) => {
        const safeTitle = escapeHtml(u.title);
        const safeMsg = escapeHtml(u.message);
        const safeIcon = escapeHtml(u.icon);
        const variantClass = getVariantClass(u.variant, 'modal-update-item');
        return `
          <div class="modal-update-item${variantClass}">
            <h4>${safeIcon} ${safeTitle}</h4>
            <p>${safeMsg}</p>
          </div>
        `;
      })
      .join('');
  }

  function renderLatest(updates) {
    const grid = document.querySelector('.updates-grid');
    if (!grid) return;

    // Ensure this grid uses the same card markup as the current design.
    const items = updates
      .map(normalizeUpdate)
      .filter(u => (u.showIn === 'latest' || u.showIn === 'both') && (u.title || u.message));

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="update-card" style="grid-column: 1/-1; text-align:center;">
          <div class="update-header" style="justify-content:center;">
            <span class="update-icon">✨</span>
            <h3>No updates yet</h3>
          </div>
          <p>We renamed the website to “diddys playhouse”, added several new games to the game library, and fixed bugs to improve the games/updates experience.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
      .map((u) => {
        const safeTitle = escapeHtml(u.title);
        const safeMsg = escapeHtml(u.message);
        const safeIcon = escapeHtml(u.icon);
        const safeDate = escapeHtml(u.dateText);
        const variantClass = getVariantClass(u.variant, 'update-card');
        return `
          <div class="update-card${variantClass}">
            <div class="update-header">
              <span class="update-icon">${safeIcon}</span>
              <h3>${safeTitle}</h3>
            </div>
            <p>${safeMsg}</p>
            <span class="update-date">${safeDate}</span>
          </div>
        `;
      })
      .join('');
  }

  function renderAll() {
    const updates = getUpdates();
    renderWhatsNew(updates);
    renderLatest(updates);
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      renderAll();
    } catch (e) {
      // fail silently
    }
  });

  // Expose for author preview
  window.__updatesRender = { renderAll };
})();

