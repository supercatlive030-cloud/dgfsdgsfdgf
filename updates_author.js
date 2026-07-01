(function () {
  const STORAGE_KEY = 'siteUpdates_v1';

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

  function getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = safeParseJSON(raw, []);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.updates)) return parsed.updates;
    return [];
  }

  function setAll(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
  }

  function normalizeUpdate(u) {
    if (!u || typeof u !== 'object') return null;

    const id = u.id != null ? String(u.id) : String(Math.random()).slice(2);
    const createdAt = typeof u.createdAt === 'number' ? u.createdAt : (Date.parse(u.createdAt) || Date.now());

    return {
      id,
      createdAt,
      title: typeof u.title === 'string' ? u.title : '',
      message: typeof u.message === 'string' ? u.message : '',
      icon: typeof u.icon === 'string' && u.icon.trim() ? u.icon.trim() : '✨',
      dateText: typeof u.dateText === 'string' && u.dateText.trim() ? u.dateText.trim() : 'Today',
      showIn: u.showIn === 'whatsNew' || u.showIn === 'latest' || u.showIn === 'both' ? u.showIn : 'both'
    };
  }

  function loadAndRender() {
    const listEl = document.getElementById('updatesList');
    if (!listEl) return;

    const updates = getAll().map(normalizeUpdate).filter(Boolean);

    if (updates.length === 0) {
      listEl.innerHTML = '<div class="empty-chat">No saved updates yet. Add one above!</div>';
      return;
    }

    listEl.innerHTML = updates
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 50)
      .map((u) => {
        return `
          <div class="profile-card" style="margin-bottom: 0.9rem;">
            <div class="profile-header">
              <div class="profile-info" style="display:flex; flex-direction:column; gap: 0.25rem;">
                <span class="username-glow">${escapeHtml(u.icon)} ${escapeHtml(u.title || 'Untitled')}</span>
                <span class="message-time">${new Date(u.createdAt).toLocaleString()} • showIn: ${escapeHtml(u.showIn)}</span>
              </div>
              <div style="display:flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="back-btn" style="border-color: rgba(255, 107, 107, 0.35); color:#ff6b6b; width:auto; padding:0.5rem 0.8rem;" type="button" onclick="window.__updateAuthorDelete('${escapeHtml(u.id)}')">Delete</button>
              </div>
            </div>
            <div class="message-text" style="margin-top: 0.5rem; color: var(--text-secondary);">${escapeHtml(u.message || '')}</div>
          </div>
        `;
      })
      .join('');
  }

  function deleteById(id) {
    const updates = getAll().filter(u => String(u && u.id) !== String(id));
    setAll(updates);
    loadAndRender();
  }

  function clearAll() {
    if (!confirm('Clear ALL saved updates from this browser?')) return;
    setAll([]);
    loadAndRender();
  }

  function showStatus(msg) {
    const el = document.getElementById('updateStatus');
    if (!el) return;
    el.textContent = msg || '';
  }

  function wire() {
    window.__updateAuthorDelete = function (id) {
      if (!confirm('Delete this update?')) return;
      deleteById(id);
      showStatus('Deleted!');
      setTimeout(() => showStatus(''), 1500);
    };

    const form = document.getElementById('updateForm');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const refreshBtn = document.getElementById('refreshPreviewBtn');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('updateTitle')?.value.trim();
      const message = document.getElementById('updateMessage')?.value.trim();
      const icon = document.getElementById('updateIcon')?.value.trim();
      const dateText = document.getElementById('updateDateText')?.value.trim();
      const showIn = document.querySelector('input[name="showIn"]:checked')?.value || 'both';

      if (!title || !message) {
        showStatus('Title + message required.');
        return;
      }

      const update = {
        id: String(Math.random()).slice(2),
        createdAt: Date.now(),
        title,
        message,
        icon: icon || '✨',
        dateText: dateText || 'Today',
        showIn
      };

      const all = getAll();
      all.push(update);
      setAll(all);

      form.reset();
      showStatus('Saved! Open home.html to see it rendered.');
      setTimeout(() => showStatus(''), 2500);
      loadAndRender();
    });

    clearAllBtn?.addEventListener('click', clearAll);

    refreshBtn?.addEventListener('click', () => {
      try {
        window.__updatesRender?.renderAll?.();
        showStatus('Rendered on this page (if home.html is open).');
      } catch (e) {}
      setTimeout(() => showStatus(''), 2000);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wire();
    loadAndRender();
  });
})();

