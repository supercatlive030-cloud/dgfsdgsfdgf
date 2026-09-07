// ==================== SITE CHANGELOG ==================== //
// Renders a proper changelog on updates.html with:
// version number, date, added features, bug fixes, new games.
// Also caches itself in localStorage so it can render offline.

(function () {
  'use strict';

  var CACHE_KEY = 'siteChangelog_v1';

  // ---- Edit this list to publish a new release ----
  var CHANGELOG = [
    {
      version: 'v2.2.0',
      date: '2026-09-07',
      added: [
        'Shared ideas list stored on the server so submissions can be seen from any device',
        'Admin button to email all submitted ideas at once',
        'Click Here page for quick web searching and direct website access',
        'Password protection for the Click Here page'
      ],
      fixed: [
        'Admin ideas list now reads and manages shared submissions instead of browser-only data'
      ],
      newGames: []
    },
    {
      version: 'v2.1.0',
      date: '2026-08-29',
      added: [
        'Proper changelog page with version numbers and dates',
        'Featured Games section on the homepage',
        'Offline game metadata — the game library loads even if the internet drops',
        'Random Game Wheel improvements (cancel + play buttons)'
      ],
      fixed: [
        'Fixed missing changelog.js script on the Updates page',
        'Active Players stat now tracks real visitors on Home',
        'Wheel no longer auto-redirects without asking'
      ],
      newGames: [
        '1 on 1 Soccer',
        'Drive Mad'
      ]
    },
    {
      version: 'v2.0.0',
      date: '2026-08-09',
      added: [
        'New AI assistant with saved chat history',
        'Clean fullscreen game player for every game',
        'Game URL health checker in the admin panel'
      ],
      fixed: [
        'FNAF games cleaned up to a game-only view',
        'Favorites star no longer launches the game'
      ],
      newGames: [
        'Basket Bros',
        'Basketball Stars',
        'Baseball Bros'
      ]
    }
  ];

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '\u0026amp;', '<': '\u0026lt;', '>': '\u0026gt;', '"': '\u0026quot;', "'": '\u0026#039;' }[c];
    });
  }

  function getChangelog() {
    // Try fresh data first; fall back to cache when offline.
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ releases: CHANGELOG, cachedAt: Date.now() }));
    } catch (e) { /* storage full/blocked — keep going */ }
    if (!navigator.onLine) {
      try {
        var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Array.isArray(cached.releases) && cached.releases.length) return cached.releases;
      } catch (e) {}
    }
    return CHANGELOG;
  }

  function groupHtml(title, items, icon) {
    if (!items || !items.length) return '';
    return (
      '<div class="changelog-group">' +
        '<h3>' + icon + ' ' + escapeHtml(title) + '</h3>' +
        '<ul>' + items.map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join('') + '</ul>' +
      '</div>'
    );
  }

  function render() {
    var list = document.getElementById('changelogList');
    if (!list) return;

    var releases = getChangelog();

    list.innerHTML = releases.map(function (r) {
      return (
        '<div class="changelog-card">' +
          '<div class="changelog-header">' +
            '<span class="changelog-version">🚀 ' + escapeHtml(r.version) + '</span>' +
            '<span class="changelog-date">📅 ' + escapeHtml(r.date) + '</span>' +
          '</div>' +
          '<div class="changelog-columns">' +
            groupHtml('Added Features', r.added, '✨') +
            groupHtml('Bug Fixes', r.fixed, '🐞') +
            groupHtml('New Games', r.newGames, '🎮') +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function updateHeroDate() {
    var latest = getChangelog()[0];
    if (!latest) return;
    // Update any "Updated: <date>" text on the page with the newest release date.
    var strongs = document.querySelectorAll('.hero-content strong');
    strongs.forEach(function (el) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(el.textContent.trim())) {
        el.textContent = latest.date;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { render(); } catch (e) {}
    try { updateHeroDate(); } catch (e) {}
  });
})();