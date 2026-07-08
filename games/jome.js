(function () {
  // Injects a fixed "Home" button on top of game pages.
  // Intended to be loaded by game wrapper pages under /games/*.html

  function isInsideGameWrapper() {
    // Many wrapper pages include an iframe that fills the screen.
    // We'll consider this a game wrapper if an iframe exists.
    return !!document.querySelector('iframe');
  }

  function getControlHost() {
    var header = document.querySelector('.game-header');
    if (header) {
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '8px';
      return header;
    }
    return document.body;
  }

  function getControlBar() {
    if (document.getElementById('gameControlBar')) {
      return document.getElementById('gameControlBar');
    }

    var bar = document.createElement('div');
    bar.id = 'gameControlBar';
    bar.className = 'game-control-bar';
    bar.style.display = 'flex';
    bar.style.flexDirection = 'row';
    bar.style.gap = '8px';
    bar.style.pointerEvents = 'none';

    var host = getControlHost();
    if (host === document.body) {
      bar.style.position = 'fixed';
      bar.style.top = '14px';
      bar.style.right = '14px';
      bar.style.zIndex = '2147483647';
      bar.style.flexDirection = 'column';
    } else {
      bar.style.marginLeft = 'auto';
      bar.style.alignItems = 'center';
    }

    host.appendChild(bar);
    return bar;
  }

  function createHomeButton() {
    if (document.getElementById('gameHomeBtn')) return;
    if (document.querySelector('.btn-home, .game-home-link, [href="../games.html"]')) return;

    var bar = getControlBar();
    var btn = document.createElement('a');
    btn.id = 'gameHomeBtn';
    btn.href = '../games.html';
    btn.className = 'game-home-btn';
    btn.setAttribute('aria-label', 'Home');
    btn.setAttribute('title', 'Home');
    btn.textContent = '🏠';

    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '42px';
    btn.style.height = '42px';
    btn.style.borderRadius = '50%';
    btn.style.textDecoration = 'none';
    btn.style.background = 'rgba(10, 14, 39, 0.9)';
    btn.style.color = '#ffffff';
    btn.style.border = '1px solid rgba(0, 217, 255, 0.35)';
    btn.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.28)';
    btn.style.backdropFilter = 'blur(10px)';
    btn.style.fontSize = '18px';
    btn.style.transition = 'transform 0.15s ease, background 0.15s ease';
    btn.style.pointerEvents = 'auto';
    btn.onmouseenter = function () {
      btn.style.transform = 'translateY(-2px)';
      btn.style.background = 'rgba(10, 14, 39, 0.97)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'translateY(0px)';
      btn.style.background = 'rgba(10, 14, 39, 0.9)';
    };

    btn.addEventListener('click', function (e) {
      try {
        e.preventDefault();
      } catch (err) {}
      window.location.href = '../games.html';
    });

    bar.appendChild(btn);
  }

  function createFullscreenButton() {
    if (document.getElementById('gameFullscreenBtn')) return;

    var bar = getControlBar();
    var btn = document.createElement('button');
    btn.id = 'gameFullscreenBtn';
    btn.type = 'button';
    btn.className = 'game-fullscreen-btn';
    btn.setAttribute('aria-label', 'Fullscreen');
    btn.setAttribute('title', 'Fullscreen');
    btn.textContent = '⛶';

    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '42px';
    btn.style.height = '42px';
    btn.style.borderRadius = '50%';
    btn.style.border = '1px solid rgba(0, 217, 255, 0.35)';
    btn.style.background = 'rgba(10, 14, 39, 0.9)';
    btn.style.color = '#ffffff';
    btn.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.28)';
    btn.style.backdropFilter = 'blur(10px)';
    btn.style.fontSize = '18px';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'transform 0.15s ease, background 0.15s ease';
    btn.style.pointerEvents = 'auto';
    btn.onmouseenter = function () {
      btn.style.transform = 'translateY(-2px)';
      btn.style.background = 'rgba(10, 14, 39, 0.97)';
    };
    btn.onmouseleave = function () {
      btn.style.transform = 'translateY(0px)';
      btn.style.background = 'rgba(10, 14, 39, 0.9)';
    };

    btn.addEventListener('click', function () {
      requestGameFullscreen();
    });

    bar.appendChild(btn);
  }

  function requestGameFullscreen() {
    var iframe = document.querySelector('iframe');
    if (!iframe) return;

    try {
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'autoplay; fullscreen; microphone; camera; encrypted-media; clipboard-write');
    } catch (err) {}

    var request = iframe.requestFullscreen || iframe.webkitRequestFullscreen || iframe.mozRequestFullScreen || iframe.msRequestFullscreen;
    if (typeof request === 'function') {
      request.call(iframe).catch(function () {
        fallbackFullscreen();
      });
      return;
    }
    fallbackFullscreen();
  }

  function fallbackFullscreen() {
    var root = document.documentElement;
    var request = root.requestFullscreen || root.webkitRequestFullscreen || root.mozRequestFullScreen || root.msRequestFullscreen;
    if (typeof request === 'function') {
      request.call(root).catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (!isInsideGameWrapper()) return;
      createHomeButton();
      createFullscreenButton();
    } catch (e) {}
  });
})();

