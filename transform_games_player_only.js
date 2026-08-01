// transform_games_player_only.js
// Converts every game wrapper page in /games to a clean "game player only" view:
//   - only the game is visible (fullscreen iframe / game area)
//   - a single Home button (🏠) fixed in the top-left corner
//   - NO fullscreen button and NO jome.js injection
// Special-cased games: fnf.html, cookie-clicker.html, matching-game.html

const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'games');

const HOME_BTN_CSS = `
    .home-btn {
      position: fixed;
      top: 14px;
      left: 14px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      text-decoration: none;
      background: rgba(10, 14, 39, 0.9);
      color: #ffffff;
      border: 1px solid rgba(0, 217, 255, 0.35);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(10px);
      font-size: 18px;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .home-btn:hover {
      transform: translateY(-2px);
      background: rgba(10, 14, 39, 0.97);
    }`;

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '"');
}

function extractIframeAttrs(html) {
  const m = html.match(/<iframe[^>]*>/i);
  if (!m) return null;
  const tag = m[0];
  const get = (name) => {
    const re = new RegExp('\\b' + name + '\\s*=\\s*["\']([^"\']+)["\']', 'i');
    const r = tag.match(re);
    return r ? r[1] : null;
  };
  return {
    src: get('src'),
    allow: get('allow'),
    sandbox: get('sandbox'),
    allowfullscreen: /allowfullscreen/i.test(tag),
  };
}

function extractTitle(html) {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m ? m[1].trim() : 'Game - Unblocked Games';
}

// ---------- Standard iframe game template ----------
function buildIframeGameHtml(fileName, html) {
  const attrs = extractIframeAttrs(html);
  const title = extractTitle(html);
  const allowAttr = attrs && attrs.allow ? `\n      allow="${escapeAttr(attrs.allow)}"` : '';
  const sandboxAttr = attrs && attrs.sandbox ? `\n      sandbox="${escapeAttr(attrs.sandbox)}"` : '';
  const fsAttr = attrs && attrs.allowfullscreen ? '\n      allowfullscreen' : '';
  const src = attrs ? attrs.src : '';
  const iframeHtml = src
    ? `  <div class="game-player">
    <iframe
      src="${escapeAttr(src)}"${allowAttr}${sandboxAttr}${fsAttr}>
    </iframe>
  </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    .game-player { width: 100vw; height: 100vh; }
    iframe { width: 100%; height: 100%; border: 0; display: block; background: #000; }${HOME_BTN_CSS}
  </style>
</head>
<body>
  <a href="../games.html" class="home-btn" aria-label="Home" title="Home">🏠</a>
${iframeHtml}
</body>
</html>
`;
}

// ---------- FNF (play overlay + dynamic sizing) ----------
function buildFnfHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://playgama.com" crossorigin="">
    <link rel="preconnect" href="https://securepubads.g.doubleclick.net" crossorigin="">
    <link rel="preconnect" href="https://imasdk.googleapis.com" crossorigin="">
    <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
    <link rel="preconnect" href="https://fnf.kdata1.com" crossorigin="">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no">
    <title>Friday Night Funkin - Unblocked Games</title>
    <style>
        * { margin:0; padding:0; }
        html, body, .game-area, #innergame { touch-action:none; -ms-touch-action:none; }
        html, body { width:100%; height:100%; overflow:hidden; overscroll-behavior:none; background:#000; display:flex; align-items:center; justify-content:center; }
        body { flex-direction:column; }
        .game-area { flex:1; width:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        iframe { border:none; display:block; }
        #innergame { width:0; height:0; }${HOME_BTN_CSS}
    </style>
</head>
<body>
<a href="../games.html" class="home-btn" aria-label="Home" title="Home">🏠</a>

<div class="game-area">
<iframe id="innergame" scrolling="no" allow="autoplay; fullscreen; microphone" allowfullscreen=""></iframe>
</div>
<div class="playbutton-overlay" id="kbh-play-overlay" role="button" aria-label="Play Now" style="position:fixed;inset:0;background:#181818;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;cursor:pointer;overflow:hidden;z-index:2147483002;-webkit-tap-highlight-color:transparent;user-select:none;font-family:sans-serif;color:#ededed;">
  <span class="btnplaynow" style="background:linear-gradient(180deg,#43a047,#2e7d32);border:none;border-radius:12px;padding:14px 24px;color:#fff;box-shadow:0 4px 0 #1b5e20,0 6px 20px rgba(0,0,0,.4);transition:all .15s ease;text-shadow:0 2px 4px rgba(0,0,0,.3);font-size:50px;line-height:1;">► Play Now!</span>
</div>
<script>
  var gw = 960;
  var gh = 540;
  function sizeGame() {
    if (!gw || !gh) return;
    var area = document.querySelector('.game-area');
    var iframe = document.getElementById('innergame');
    if (!area || !iframe) return;
    var cw = area.clientWidth;
    var ch = area.clientHeight;
    var scale = Math.min(cw / gw, ch / gh);
    iframe.style.width = Math.floor(gw * scale) + 'px';
    iframe.style.height = Math.floor(gh * scale) + 'px';
  }
  sizeGame();
  window.addEventListener('resize', sizeGame);
  function b(e){e.preventDefault();}
  document.addEventListener('touchmove',function(e){
    if(e.touches.length>1||(e.scale!==undefined&&e.scale!==1))e.preventDefault();
  },{passive:false});
  document.addEventListener('touchstart',function(e){if(e.touches.length>1)e.preventDefault();},{passive:false});
  document.addEventListener('gesturestart',b);
  document.addEventListener('gesturechange',b);
  document.addEventListener('gestureend',b);
</script>
<script>
(function(){
  var overlay = document.getElementById('kbh-play-overlay');
  var frame   = document.getElementById('innergame');
  var gameUrl = "https:\\/\\/fnf.kdata1.com\\/2026\\/fnf-kbhgames\\/desktop\\/4.65\\/";
  var gameLoading = false;

  function startGameLoad(){
    if (gameLoading) return;
    gameLoading = true;
    frame.addEventListener('load', function(){
      overlay.style.display = 'none';
      sizeGame();
    }, { once: true });
    frame.src = gameUrl;
  }

  function fireAdOnce(e){
    if (gameLoading) return;
    if (e && e.preventDefault) e.preventDefault();
    startGameLoad();
  }

  overlay.addEventListener('pointerup', fireAdOnce, { once: true });
  overlay.addEventListener('click',     fireAdOnce, { once: true });

  setTimeout(startGameLoad, 3000);
})();
</script>

<script>
  window.addEventListener('beforeunload', (e) => {
    try {
      if (e && e.preventDefault) e.preventDefault();
    } catch (err) {}
  });
</script>
</body>
</html>
`;
}

// ---------- Cookie Clicker (header removed, fullscreen removed) ----------
function buildCookieClickerHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cookie Clicker - Unblocked Games</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    .game-player { width: 100vw; height: 100vh; }
    iframe { width: 100%; height: 100%; border: 0; background: #000; display: block; }${HOME_BTN_CSS}
  </style>
</head>
<body>
  <a href="../games.html" class="home-btn" aria-label="Home" title="Home">🏠</a>
  <div class="game-player">
    <iframe
      id="cookieClickerFrame"
      title="Cookie Clicker"
      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-popups-to-escape-sandbox"
      allowfullscreen
      allow="autoplay; fullscreen; microphone; camera; encrypted-media; clipboard-write"
      src="https://orteil.dashnet.org/cookieclicker/">
    </iframe>
  </div>
</body>
</html>
`;
}

// ---------- CSS3 Matching Game (direct game, no iframe) ----------
function buildMatchingGameHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CSS3 Matching Game - Unblocked Games</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    body { color: #fff; }
    .matching-game-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #08121f;
    }
    #game-wrapper {
      width: 100%;
      max-width: 880px;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #game { margin: 0 auto; position: relative; }
    #popup { z-index: 2; }${HOME_BTN_CSS}
  </style>
</head>
<body>
  <a href="../games.html" class="home-btn" aria-label="Home" title="Home">🏠</a>
  <div class="matching-game-page">
    <div id="game-wrapper">
      <div id="game">
        <div id="cards">
          <div class="card">
            <div class="face front"></div>
            <div class="face back"></div>
          </div>
        </div>
      </div>
      <section id="popup" class="hide">
        <div id="popup-bg"></div>
        <div id="popup-box">
          <div class="ribbon hide">
            <div class="ribbon-body"><span>New Record</span></div>
            <div class="triangle"></div>
          </div>
          <div id="popup-box-content">
            <h1>You Won!</h1>
            <p>Your Score:</p>
            <p><span class="score">13</span></p>
            <p><small>Last Score: <span class="last-score">20</span><br>
            Saved on: <span class="saved-time">00/00/0000 00:00am</span></small></p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <script src="matching-game/js/jquery-1.6.min.js"></script>
  <script src="matching-game/js/html5games.matchgame.js"></script>
</body>
</html>
`;
}

// ---------- Main ----------
const specialFiles = {
  'fnf.html': buildFnfHtml,
  'cookie-clicker.html': buildCookieClickerHtml,
  'matching-game.html': buildMatchingGameHtml,
};

if (!fs.existsSync(baseDir)) {
  console.error('games folder not found');
  process.exit(1);
}

const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
let changed = 0;
let skipped = [];

for (const f of files) {
  // FNAF pages were already converted manually.
  if (/^fnaf-\d+\.html$/i.test(f)) {
    skipped.push(f + ' (already converted)');
    continue;
  }

  const filePath = path.join(baseDir, f);
  const html = fs.readFileSync(filePath, 'utf8');

  let out;
  if (specialFiles[f]) {
    out = specialFiles[f]();
  } else {
    out = buildIframeGameHtml(f, html);
  }

  fs.writeFileSync(filePath, out, 'utf8');
  changed++;
}

console.log('Converted to game-player-only view:', changed);
if (skipped.length) console.log('Skipped:', skipped.join(', '));

