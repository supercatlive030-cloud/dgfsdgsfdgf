// ==================== FEATURED GAMES ==================== //
// Renders a "Featured Games" section on the homepage.
// Caches game metadata in localStorage so the section still renders offline.

(function () {
  'use strict';

  var CACHE_KEY = 'featuredGamesCache_v1';

  // Hand-picked featured games (names must match gamesData entries).
  var FEATURED_NAMES = [
    'Drive Mad',
    '1 on 1 Soccer',
    'Basket Bros',
    'Cookie Clicker',
    'Moto X3M',
    'FNAF 3'
  ];

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '\u0026amp;', '<': '\u0026lt;', '>': '\u0026gt;', '"': '\u0026quot;', "'": '\u0026#039;' }[c];
    });
  }

  function getAllGames() {
    if (Array.isArray(window.gamesData) && window.gamesData.length) return window.gamesData;
    if (Array.isArray(window.__gamesData) && window.__gamesData.length) return window.__gamesData;
    return [];
  }

  function cacheGames(games) {
    try {
      localStorage.setItem('gamesMetadataCache_v1', JSON.stringify({
        cachedAt: Date.now(),
        games: games
      }));
    } catch (e) { /* ignore storage errors */ }
  }

  function getCachedGames() {
    try {
      var raw = localStorage.getItem('gamesMetadataCache_v1');
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed && parsed.games) ? parsed.games : [];
    } catch (e) {
      return [];
    }
  }

  function pickFeatured() {
    var games = getAllGames();
    if (games.length) {
      // Cache metadata for offline use whenever we have fresh data.
      try { cacheGames(games); } catch (e) {}
      var byName = {};
      games.forEach(function (g) { byName[String(g.name).toLowerCase()] = g; });
      var picked = [];
      FEATURED_NAMES.forEach(function (n) {
        var g = byName[String(n).toLowerCase()];
        if (g && picked.indexOf(g) === -1) picked.push(g);
      });
      // Fallback: fill with first games if not enough named ones matched.
      if (picked.length < 3) {
        games.forEach(function (g) {
          if (picked.length < 6 && picked.indexOf(g) === -1) picked.push(g);
        });
      }
      return picked.slice(0, 6);
    }
    // Offline / gamesData missing: use cached metadata.
    return getCachedGames().slice(0, 6);
  }

  function render() {
    var grid = document.getElementById('featuredGamesGrid');
    if (!grid) return;

    var games = pickFeatured();
    if (!games.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:1.5rem;">Featured games unavailable right now.</p>';
      return;
    }

    grid.innerHTML = games.map(function (game, index) {
      var favKey = game.path || game.name;
      return (
        '<a href="' + escapeHtml(game.path) + '" class="game-card featured-game-card"' +
        ' style="animation: fadeInUp 0.6s ease-out ' + (index * 0.05) + 's both;"' +
        ' onclick="if(event.target.closest && event.target.closest(\'.favorite-btn\')){event.preventDefault();return false;} if(typeof trackGamePlay===\'function\'){trackGamePlay(\'' + escapeHtml(game.name).replace(/'/g, "\\'") + '\');}">' +
          '<button class="favorite-btn" data-fav-key="' + escapeHtml(favKey) + '"' +
            ' data-fav-title="' + escapeHtml(game.name) + '"' +
            ' data-fav-category="' + escapeHtml(game.category || '') + '"' +
            ' data-fav-url="' + escapeHtml(game.path) + '"' +
            ' aria-label="Favorite ' + escapeHtml(game.name) + '"' +
            ' aria-pressed="false" title="Toggle Favorite">\u2605</button>' +
          '<div class="game-card-content">' +
            '<span class="game-emoji">' + escapeHtml(game.emoji || '\uD83C\uDFAE') + '</span>' +
            '<span class="game-name">' + escapeHtml(game.name) + '</span>' +
            '<span class="game-category">' + escapeHtml(game.category || 'featured') + '</span>' +
            '<span class="game-featured-tag">\u2B50 Featured</span>' +
          '</div>' +
        '</a>'
      );
    }).join('');

    // Mark already-favorited featured games.
    if (typeof window.favoritesManager !== 'undefined') {
      grid.querySelectorAll('.favorite-btn').forEach(function (btn) {
        var key = btn.dataset.favKey;
        if (key && window.favoritesManager.isFavorite(key)) {
          btn.classList.add('favorited');
          btn.setAttribute('aria-pressed', 'true');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { render(); } catch (e) { /* fail silently */ }
  });

  window.__featuredGames = { render: render };
})();