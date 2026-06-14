(function () {
  const ADMIN_PASSWORD = '7995';
  // NOTE: admin.html is not part of the main auth system.

  // Always require the password every time (no localStorage bypass).

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
  });
})();

