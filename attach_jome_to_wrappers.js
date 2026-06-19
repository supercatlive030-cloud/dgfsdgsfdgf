// Auto-attach helper (inject games/jome.js into every wrapper under games/*.html)
// This script is intentionally safe: it only injects if jome is not already present.

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

  if (html.includes('src="jome.js"') || html.includes('src="./jome.js"')) continue;

  // Inject before closing body
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) continue;

  html = html.slice(0, idx) + jomeScriptTag + html.slice(idx);
  fs.writeFileSync(filePath, html, 'utf8');
  changed++;
}

console.log('Injected jome.js into wrapper pages:', changed);

