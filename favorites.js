// ==================== FAVORITES SYSTEM ==================== //
// Modular favorites manager with LocalStorage-backed storage.
// Storage logic is isolated in FavoritesManager so it can later be
// swapped for a cloud backend (Firebase etc.) without touching UI code.

'use strict';

// ------------------------------------------------------------------
// FavoritesManager
// ------------------------------------------------------------------
// Handles all favorite persistence + query logic.
// To migrate to cloud later, only replace the internals of the methods
// below (the public API stays the same).
// ------------------------------------------------------------------
class FavoritesManager {
  constructor() {
    this.STORAGE_KEY = 'favorites';
    this._cache = null; // in-memory cache to avoid repeated parsing
  }

  // ---------- Internal ----------

  _read() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this._cache = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      this._cache = [];
    }
    return this._cache;
  }

  _write(list) {
    this._cache = list;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // Storage full / unavailable — keep in-memory cache only.
    }
  }

  _notify() {
    // Let the UI know favorites changed (navbar badge, etc.)
    document.dispatchEvent(new CustomEvent('favorites:changed'));
  }

  // ---------- Public API ----------

  getFavorites() {
    return this._read().slice();
  }

  addFavorite(game) {
    const list = this._read();
    // Prevent duplicate favorites (match by id or path).
    const id = game.id || game.path || game.name;
    const exists = list.some((f) => (f.id || f.path || f.name) === id);
    if (exists) return false;

    list.push({
      id: game.id || game.path || game.name,
      title: game.title || game.name,
      image: game.image || '',
      url: game.url || game.path || '',
      category: game.category || '',
      added: new Date().toISOString()
    });
    this._write(list);
    this._notify();
    return true;
  }

  removeFavorite(idOrPathOrName) {
    const list = this._read();
    const before = list.length;
    const filtered = list.filter((f) => (f.id || f.path || f.name) !== idOrPathOrName);
    if (filtered.length === before) return false;
    this._write(filtered);
    this._notify();
    return true;
  }

  isFavorite(idOrPathOrName) {
    const id = idOrPathOrName;
    return this._read().some((f) => (f.id || f.path || f.name) === id);
  }

  sortFavorites(favorites, mode) {
    const list = favorites.slice();
    switch (mode) {
      case 'newest':
        list.sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.added || 0) - new Date(b.added || 0));
        break;
      case 'alpha-asc':
        list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
        break;
      case 'alpha-desc':
        list.sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
        break;
      case 'category':
        list.sort((a, b) =>
          String(a.category || '').localeCompare(String(b.category || '')) ||
          String(a.title || '').localeCompare(String(b.title || ''))
        );
        break;
      default:
        break;
    }
    return list;
  }

  searchFavorites(favorites, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return favorites.slice();
    return favorites.filter((f) =>
      String(f.title || '').toLowerCase().includes(q) ||
      String(f.category || '').toLowerCase().includes(q)
    );
  }

  getStats(favorites) {
    const stats = { total: favorites.length };
    favorites.forEach((f) => {
      const cat = String(f.category || 'Other').toLowerCase();
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }
}

// Expose a singleton so both the game grid and favorites page share state.
window.FavoritesManager = FavoritesManager;
window.favoritesManager = window.favoritesManager || new FavoritesManager();

// ------------------------------------------------------------------
// UI Helpers (kept separate from storage logic)
// ------------------------------------------------------------------

// Toast notification (bottom-right, auto-disappear).
function showFavToast(message) {
  let container = document.getElementById('favToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'favToastContainer';
    container.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:2147483647;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'fav-toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Auto-dismiss after 2.5s.
  setTimeout(() => {
    toast.classList.add('fav-toast-hide');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Update the navbar "Favorites" badge (if present).
function updateFavoritesBadge() {
  const badge = document.getElementById('favoritesBadge');
  if (!badge) return;
  const count = window.favoritesManager.getFavorites().length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

// Sync the star icons on the current page (games grid).
function syncFavoriteStars() {
  document.querySelectorAll('.favorite-btn').forEach((btn) => {
    const key = btn.dataset.favKey;
    if (!key) return;
    const isFav = window.favoritesManager.isFavorite(key);
    btn.classList.toggle('favorited', isFav);
    btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
  });
}

// Event delegation for favorite buttons (works even after re-render).
function setupFavoriteButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (!btn) return;

    // Stop propagation so the game card link doesn't launch the game.
    e.preventDefault();
    e.stopPropagation();

    const key = btn.dataset.favKey;
    const title = btn.dataset.favTitle || key;
    const category = btn.dataset.favCategory || '';
    const url = btn.dataset.favUrl || '';

    if (!key) return;

    const manager = window.favoritesManager;
    const isFav = manager.isFavorite(key);

    if (isFav) {
      manager.removeFavorite(key);
      showFavToast('💔 Removed from Favorites');
    } else {
      manager.addFavorite({
        id: key,
        name: title,
        title,
        category,
        path: url
      });
      showFavToast('⭐ Added to Favorites');

      // Favorite "pop" animation.
      btn.classList.add('favorite-pop');
      setTimeout(() => btn.classList.remove('favorite-pop'), 400);
    }

    syncFavoriteStars();
    updateFavoritesBadge();
  });
}

// Keep the badge updated whenever favorites change.
document.addEventListener('favorites:changed', () => {
  updateFavoritesBadge();
  syncFavoriteStars();
});

// Initialize UI helpers on DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
  setupFavoriteButtons();
  updateFavoritesBadge();
});

