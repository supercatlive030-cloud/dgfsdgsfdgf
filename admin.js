(function () {
  const ADMIN_PASSWORD = '7995';
  const GAME_CHECK_STORAGE_KEY = 'gameUrlHealthStatus_v1';
  const ADMIN_GAME_LIST = [
    { name: '1v1 LOL', path: 'games/1v1lol.html' },
    { name: 'Basketball', path: 'games/basketball.html' },
    { name: 'Soccer', path: 'games/soccer.html' },
    { name: 'Football', path: 'games/football.html' },
    { name: 'FNF', path: 'games/fnf.html' },
    { name: 'Moto X3M', path: 'games/motox3m.html' },
    { name: 'Crossy Road', path: 'games/crossyroad.html' },
    { name: 'Small World Cup', path: 'games/small-world-cup.html' },
    { name: 'Arcade Car Driving', path: 'games/arcade-car-driving.html' },
    { name: 'Awesome Tanks', path: 'games/awesome-tanks.html' },
    { name: 'Axis Football League', path: 'games/axis-football-league.html' },
    { name: 'Apple Shooter', path: 'games/apple-shooter.html' },
    { name: 'Matching Game', path: 'games/matching-game.html' },
    { name: 'Betrayal.io', path: 'games/betrayal-io.html' },
    { name: 'Cookie Clicker', path: 'games/cookie-clicker.html' },
    { name: 'FNAF 4', path: 'games/fnaf-4.html' },
    { name: 'FNAF 3', path: 'games/fnaf-3.html' },
    { name: 'FNAF 2', path: 'games/fnaf-2.html' },
    { name: 'FNAF 1', path: 'games/fnaf-1.html' },
    { name: 'Basket Bros', path: 'games/basket-bros.html' },
    { name: 'Basketball Stars', path: 'games/basket-stars.html' },
    { name: 'Baseball Bros', path: 'games/basketballs-bros-baseball.html' },
    { name: '1 on 1 Soccer', path: 'games/1on1soccer.html' },
    { name: 'Drive Mad', path: 'games/drive-mad.html' }
  ];
  // NOTE: admin.html is not part of the main auth system.

  function getAdminGameList() {
    if (Array.isArray(window.gamesData) && window.gamesData.length) {
      return window.gamesData
        .filter(game => game && (game.path || game.url))
        .map(game => ({
          name: game.name || 'Unknown game',
          path: game.url || game.path
        }));
    }
    return ADMIN_GAME_LIST;
  }

  function buildAbsoluteUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    try {
      return new URL(path, window.location.href).href;
    } catch (e) {
      return path;
    }
  }

  async function checkGameUrlStatus(url) {
    if (!url) {
      return { status: 'missing', detail: 'No URL provided' };
    }

    if (!navigator.onLine) {
      return { status: 'offline', detail: 'Browser is offline' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return { status: 'reachable', detail: 'Responded successfully' };
    } catch (error) {
      return { status: 'unreachable', detail: 'Request failed or was blocked by the remote host' };
    }
  }

  function renderGameHealth(results) {
    const summaryEl = document.getElementById('gameHealthSummary');
    const reportEl = document.getElementById('gameHealthReport');
    if (!summaryEl || !reportEl) return;

    const counts = { reachable: 0, unreachable: 0, offline: 0, missing: 0 };
    results.forEach(result => {
      if (counts[result.status] !== undefined) counts[result.status] += 1;
    });

    summaryEl.textContent = `Checked ${results.length} game URLs — ${counts.reachable} reachable, ${counts.unreachable} unreachable, ${counts.offline} offline, ${counts.missing} missing.`;

    reportEl.innerHTML = results.map((result) => {
      const label = {
        reachable: '✅ Reachable',
        unreachable: '⚠️ Unreachable',
        offline: '📶 Offline',
        missing: '❌ Missing'
      }[result.status] || '❔ Unknown';

      return `
        <div style="padding: 0.7rem 0.8rem; border-radius: 10px; background: rgba(10, 14, 39, 0.64); border: 1px solid rgba(0, 217, 255, 0.18); color: var(--text-primary);">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
            <strong>${result.name}</strong>
            <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary-color);">${label}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; word-break: break-word;">${result.url}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">${result.detail}</div>
        </div>
      `;
    }).join('');

    try {
      localStorage.setItem(GAME_CHECK_STORAGE_KEY, JSON.stringify(results));
    } catch (e) {}
  }

  async function runGameHealthCheck() {
    const games = getAdminGameList();
    const report = [];

    for (const game of games) {
      const url = buildAbsoluteUrl(game.path || game.url);
      const result = await checkGameUrlStatus(url);
      report.push({
        name: game.name || 'Unknown game',
        url,
        status: result.status,
        detail: result.detail
      });
    }

    renderGameHealth(report);
  }

  function showError(msg) {
    const el = document.getElementById('adminError');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
  }

  function hideError() {
    const el = document.getElementById('adminError');
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
  }

  function setAdminAuthed(isAuthed) {
    const wrap = document.getElementById('adminFormWrap');
    const panel = document.getElementById('adminPanel');

    if (wrap) wrap.style.display = isAuthed ? 'none' : 'block';
    if (panel) panel.style.display = isAuthed ? 'block' : 'none';

    if (isAuthed) loadExistingAd();
    else hideError();
  }

  function loadExistingAd() {
    // Keep ad fields persistent, but never auto-open the admin panel.

    const enabled = localStorage.getItem('sponsorAdEnabled') === 'true';
    const adImage = (localStorage.getItem('sponsorAdImage') || '').trim();
    const adLink = (localStorage.getItem('sponsorAdLink') || '').trim();
    const adText = (localStorage.getItem('sponsorAdText') || '').trim();

    const adImageEl = document.getElementById('adImage');
    const adLinkEl = document.getElementById('adLink');
    const adTextEl = document.getElementById('adText');

    if (adImageEl) adImageEl.value = adImage;
    if (adLinkEl) adLinkEl.value = adLink;
    if (adTextEl) adTextEl.value = adText;

    // enabled can be false; fields can still be visible but ads won't render.
    if (!enabled) return;
  }

  function logout() {
    // Only logs out of admin mode, not the main site.
    if (confirm('Logout from admin?')) {
      // Stay on admin page so it shows the password again.
      window.location.href = 'admin.html';
    }
  }



  document.addEventListener('DOMContentLoaded', () => {
    // Make logout available for onclick
    window.logout = logout;

    // Always require the password every time.
    hideError();
    const adminPanel = document.getElementById('adminPanel');

    const adminFormWrap = document.getElementById('adminFormWrap');
    if (adminFormWrap) adminFormWrap.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';

    const adminPasswordForm = document.getElementById('adminPasswordForm');

    if (adminPasswordForm) {
      adminPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('adminPassword');
        const val = (input ? input.value : '').trim();
        if (val === ADMIN_PASSWORD) {
          setAdminAuthed(true);
        } else {

          if (input) input.value = '';
          showError('Incorrect password.');
        }
      });
    }

    const adForm = document.getElementById('adForm');
    if (adForm) {
      adForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const adImage = (document.getElementById('adImage')?.value || '').trim();
        const adLink = (document.getElementById('adLink')?.value || '').trim();
        const adText = (document.getElementById('adText')?.value || '').trim();

        const hasImage = adImage.length > 0;
        const hasText = adText.length > 0;

        if (!hasImage && !hasText) {
          alert('Add an Ad Image URL or Ad Text.');
          return;
        }

        localStorage.setItem('sponsorAdImage', hasImage ? adImage : '');
        localStorage.setItem('sponsorAdLink', adLink);
        localStorage.setItem('sponsorAdText', hasText ? adText : '');
        localStorage.setItem('sponsorAdEnabled', 'true');

        alert('Ad saved!');
        loadExistingAd();
      });
    }

    const clearAdBtn = document.getElementById('clearAdBtn');
    if (clearAdBtn) {
      clearAdBtn.addEventListener('click', () => {
        localStorage.setItem('sponsorAdImage', '');
        localStorage.setItem('sponsorAdLink', '');
        localStorage.setItem('sponsorAdText', '');
        localStorage.setItem('sponsorAdEnabled', 'false');
        alert('Ad cleared!');
        loadExistingAd();
      });
    }

    const healthBtn = document.getElementById('checkGameUrlsBtn');
    if (healthBtn) {
      healthBtn.addEventListener('click', runGameHealthCheck);
      runGameHealthCheck();
    }
  });
})();

