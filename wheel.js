// ==================== RANDOM GAME WHEEL ==================== //
// Shared logic for the Random Game Wheel used on games.html and home.html.
(function () {
  'use strict';

  function getAllGames() {
    if (Array.isArray(window.gamesData) && window.gamesData.length) return window.gamesData;
    if (Array.isArray(window.__gamesData) && window.__gamesData.length) return window.__gamesData;
    return [];
  }

  var lastRotation = 0;
  var spinning = false;

  function openRandomWheel() {
    var modal = document.getElementById('randomWheelModal');
    var wheel = document.getElementById('randomWheel');
    if (!modal || !wheel) return;

    var games = getAllGames();
    if (!games.length) return;

    modal.classList.add('show');
    buildWheel(wheel, games);

    // Reset the wheel position so each open starts fresh.
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    lastRotation = 0;
    spinning = false;

    var spinBtn = document.getElementById('wheelSpinBtn');
    if (spinBtn) spinBtn.disabled = false;
  }

  function closeRandomWheel() {
    var modal = document.getElementById('randomWheelModal');
    if (modal) modal.classList.remove('show');
  }

  function buildWheel(wheel, games) {
    var colors = [
      '#00d9ff', '#ff006e', '#b366ff', '#39ff14', '#ffb700', '#ff6b6b',
      '#4cc9f0', '#f72585', '#7209b7', '#fca311', '#2ec4b6', '#e63946',
      '#00bbf9', '#9b5de5', '#fee440', '#00f5d4', '#f15bb5', '#3a0ca3',
      '#06a77d', '#fb8500', '#8338ec', '#ffbe0b', '#457b9d', '#e36414'
    ];

    var segAngle = 360 / games.length;
    var parts = games.map(function (g, i) {
      var color = colors[i % colors.length];
      var start = (i * segAngle).toFixed(3);
      var end = ((i + 1) * segAngle).toFixed(3);
      return color + ' ' + start + 'deg ' + end + 'deg';
    });

    wheel.style.background = 'conic-gradient(' + parts.join(', ') + ')';

    var labels = document.getElementById('wheelLabels');
    if (!labels) {
      labels = document.createElement('div');
      labels.id = 'wheelLabels';
      wheel.appendChild(labels);
    }
    labels.innerHTML = '';

    // Keep the center hub on top of labels.
    var centerEl = document.getElementById('wheelCenter');
    if (centerEl) centerEl.style.zIndex = '5';

    var radius = wheel.offsetWidth / 2 || 200;
    var labelDist = radius - 28;
    var fontSize = games.length > 16 ? '0.63rem' : '1.05rem';

    games.forEach(function (g, i) {
      var label = document.createElement('div');
      label.className = 'wheel-label';
      label.style.fontSize = fontSize;
      var mid = (i + 0.5) * segAngle;
      label.style.transform = 'translate(-50%, -50%) rotate(' + mid + 'deg) translateY(-' + labelDist + 'px) rotate(' + (-mid) + 'deg)';
      // Show emoji + a short name for readability on a crowded wheel
      var short = (g.name || '').length > 12 ? (g.name || '').substring(0, 11) + '…' : (g.name || '');
      label.textContent = g.emoji + ' ' + short;
      label.title = g.name;
      labels.appendChild(label);
    });
  }

  function spinRandomWheel() {
    var wheel = document.getElementById('randomWheel');
    var spinBtn = document.getElementById('wheelSpinBtn');
    var games = getAllGames();
    if (!wheel || !games.length || spinning) return;

    spinning = true;
    if (spinBtn) spinBtn.disabled = true;

    var segAngle = 360 / games.length;
    var randomIndex = Math.floor(Math.random() * games.length);

    // Respect the FNAF access restriction (if defined on the games page).
    if (typeof window.getFnafAccessRestriction === 'function') {
      var guard = 0;
      while (
        guard < games.length &&
        window.getFnafAccessRestriction() &&
        String(games[randomIndex].name || '').indexOf('FNAF') === 0 &&
        games[randomIndex].name !== 'FNAF 3'
      ) {
        randomIndex = (randomIndex + 1) % games.length;
        guard++;
      }
    }

    var mid = randomIndex * segAngle + segAngle / 2;
    var spins = 6;
    var currentMod = ((lastRotation % 360) + 360) % 360;
    // Rotate the wheel so the chosen segment's midpoint ends up at the top
    // (0deg), right under the pointer. CSS rotate() is clockwise, and conic
    // gradient angle 0deg points up, so final rotation = (360 - mid) % 360.
    var desiredFinal = (360 - mid) % 360;
    var delta = spins * 360 + ((desiredFinal - currentMod + 360) % 360);
    var target = lastRotation + delta;
    lastRotation = target;

    wheel.style.transition = 'transform 4.5s cubic-bezier(0.12, 0.8, 0.2, 1)';
    wheel.style.transform = 'rotate(' + target + 'deg)';

    setTimeout(function () {
      spinning = false;
      if (spinBtn) spinBtn.disabled = false;

      var game = games[randomIndex];
      try {
        if (typeof window.addToRecentlyPlayed === 'function') window.addToRecentlyPlayed(game);
        if (typeof window.trackGamePlay === 'function') window.trackGamePlay(game.name);
      } catch (e) {}
      showResultPopup(game);
    }, 4700);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' }[c];
    });
  }

function showResultPopup(game) {
    var existing = document.getElementById('wheelResultPopup');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'wheelResultPopup';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10000;animation:fadeIn 0.3s ease-out;';

    var popup = document.createElement('div');
    popup.style.cssText = 'background:rgba(20,30,60,0.96);backdrop-filter:blur(20px);border:2px solid rgba(0,217,255,0.35);border-radius:20px;padding:2.5rem;max-width:420px;width:92%;text-align:center;animation:slideDown 0.3s ease-out;';

    popup.innerHTML =
      '<div style="font-size:3rem;margin-bottom:0.5rem;">' + (game.emoji || '🎮') + '</div>' +
      '<h2 style="color:#00d9ff;font-size:1.5rem;margin-bottom:0.3rem;">' + escapeHtml(game.name) + '</h2>' +
      '<p style="color:rgba(255,255,255,0.6);font-size:0.95rem;margin-bottom:1.5rem;">The wheel landed on this game!<br><span style="font-size:0.8rem;opacity:0.7;">Launching in 3...</span></p>';

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    var countdown = 3;
    var countdownEl = popup.querySelector('span');
    var timer = setInterval(function () {
      countdown--;
      if (countdownEl) countdownEl.textContent = 'Launching in ' + countdown + '...';
      if (countdown <= 0) {
        clearInterval(timer);
        window.location.href = game.path;
      }
    }, 1000);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        clearInterval(timer);
        overlay.remove();
      }
    });
  }

  function setupRandomWheel() {
    var openBtn = document.getElementById('randomWheelBtn');
    var modal = document.getElementById('randomWheelModal');
    var closeBtn = document.getElementById('wheelCloseBtn');
    var spinBtn = document.getElementById('wheelSpinBtn');

    if (openBtn) openBtn.addEventListener('click', openRandomWheel);
    if (closeBtn) closeBtn.addEventListener('click', closeRandomWheel);
    if (spinBtn) spinBtn.addEventListener('click', spinRandomWheel);

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeRandomWheel();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRandomWheel);
  } else {
    setupRandomWheel();
  }

  window.openRandomWheel = openRandomWheel;
  window.closeRandomWheel = closeRandomWheel;
  window.spinRandomWheel = spinRandomWheel;
})();

