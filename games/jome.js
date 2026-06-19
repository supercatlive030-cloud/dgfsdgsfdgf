(function () {
  // Injects a fixed "Home" button on top of game pages.
  // Intended to be loaded by game wrapper pages under /games/*.html

  function isInsideGameWrapper() {
    // Many wrapper pages include an iframe that fills the screen.
    // We'll consider this a game wrapper if an iframe exists.
    return !!document.querySelector('iframe');
  }

  function createHomeButton() {
    if (document.getElementById('gameHomeBtn')) return;

    var btn = document.createElement('a');
    btn.id = 'gameHomeBtn';
    btn.href = '../home.html';
    btn.className = 'game-home-btn';
    btn.setAttribute('aria-label', 'Home');
    btn.setAttribute('title', 'Home');
    btn.textContent = '🏠';

    // Inline styles so we don't have to touch styles.css
    btn.style.position = 'fixed';
    btn.style.top = '14px';
    btn.style.left = '14px';
    btn.style.zIndex = '9999';
    btn.style.width = '44px';
    btn.style.height = '44px';
    btn.style.borderRadius = '12px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.textDecoration = 'none';
    btn.style.background = 'rgba(10, 14, 39, 0.85)';
    btn.style.color = '#ffffff';
    btn.style.border = '1px solid rgba(0, 217, 255, 0.35)';
    btn.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
    btn.style.backdropFilter = 'blur(10px)';
    btn.style.fontSize = '20px';
    btn.style.transition = 'transform 0.15s ease, background 0.15s ease';
    btn.onmouseenter = function () {
      btn.style.transform = 'translateY(-2px)';
      btn.style.background = 'rgba(10, 14, 39, 0.95)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'translateY(0px)';
      btn.style.background = 'rgba(10, 14, 39, 0.85)';
    };

    btn.addEventListener('click', function (e) {
      // Prevent leaving popups inside iframes
      try {
        e.preventDefault();
      } catch (err) {}
      window.location.href = '../home.html';
    });

    document.body.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (!isInsideGameWrapper()) return;
      createHomeButton();
    } catch (e) {}
  });
})();

