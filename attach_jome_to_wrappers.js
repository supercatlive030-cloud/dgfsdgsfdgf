// Auto-attach helper (inject games/jome.js into every wrapper under games/*.html)
// This script is intentionally safe: it only injects if jome is not already present.
//
// NOTE: All game wrappers now use the "game player only" layout with their own
// home button and NO fullscreen button. jome.js only adds a home button when a
// page does not already have one, and it no longer adds a fullscreen button.

const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'games');
if (!fs.existsSync(baseDir)) {
  console.error('games folder not found');
  process.exit(1);
}

const jomeScriptTag = '\n    <script src="jome.js"></script>\n';

const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
let changed = 0;

for (const f of files) {
  const filePath = path.join(baseDir, f);
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip FNAF pages: they have their own dedicated home button and should
  // only show the game player (no fullscreen button injection).
  if (/^fnaf-\d+\.html$/i.test(f)) continue;

  // Skip pages that already have a home button / game-player-only layout.
  if (html.includes('class="home-btn"')) continue;

  if (html.includes('src="jome.js"') || html.includes('src="./jome.js"')) continue;

  // Inject before closing body
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) continue;

  html = html.slice(0, idx) + jomeScriptTag + html.slice(idx);
  fs.writeFileSync(filePath, html, 'utf8');
  changed++;
}

console.log('Injected jome.js into wrapper pages:', changed);

