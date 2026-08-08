// ==================== AI CHAT ASSISTANT ==================== //
// Rule-based client-side bot (no backend needed).
// Chat history is stored per-profile (reuses the profile key system).

const AI_STORAGE_KEY = 'aiChatHistory';

// Reference to the game list (shared).
function getGamesList() {
  if (Array.isArray(window.gamesData) && window.gamesData.length) return window.gamesData;
  if (Array.isArray(window.__gamesData) && window.__gamesData.length) return window.__gamesData;
  return [];
}

// ==================== PROFILE KEY (per-profile chat) ==================== //
function getAIProfileKey() {
  const isAnonymous = localStorage.getItem('chatAnonymous') !== 'false';
  const name = localStorage.getItem('chatUsername') || 'Player';
  return (isAnonymous ? 'anonymous' : (name || 'player')).toLowerCase().replace(/\s+/g, '_');
}

function getAIChatKey() {
  return AI_STORAGE_KEY + '_' + getAIProfileKey();
}

// ==================== AI "LEARNING" KNOWLEDGE BASE ==================== //
// The AI stores what it has learned (pre-taught + user-taught).
// Local storage is per-device. To SHARE knowledge across all users, a cloud
// backend (Firebase Realtime Database) is used. If Firebase isn't configured,
// the AI gracefully falls back to local-only storage.

const AI_KNOWLEDGE_KEY = 'aiLearnedKnowledge';

// ==================== CLOUD-SHARED KNOWLEDGE (Firebase) ==================== //
// To share learned knowledge with ALL users, create a free Firebase project:
//   1. Go to https://console.firebase.google.com  →  Add project
//   2. Add a Web App to the project
//   3. Copy the "firebaseConfig" object it gives you and paste it below
//   4. Build → Realtime Database → Create database (start in test mode)
// Then every user's AI reads/writes from the SAME shared knowledge store.
const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const SHARED_KNOWLEDGE_PATH = 'aiSharedKnowledge';

// Expose the config globally so the HTML init script can use it.
window.FIREBASE_CONFIG = FIREBASE_CONFIG;

function firebaseReady() {
  return (
    typeof window.firebase !== 'undefined' &&
    FIREBASE_CONFIG &&
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey.indexOf('YOUR_API_KEY') === -1
  );
}

// Load the cloud-shared learned knowledge (array of {q, a, uses}).
async function loadSharedKnowledge() {
  if (!firebaseReady()) return [];
  try {
    const db = window.firebase.database();
    const snap = await db.ref(SHARED_KNOWLEDGE_PATH).once('value');
    const val = snap.val();
    if (!val) return [];
    // The DB stores an object keyed by question; convert to an array.
    return Object.keys(val).map(k => val[k]);
  } catch (e) {
    console.warn('Could not load shared knowledge:', e);
    return [];
  }
}

// Push all local learned entries to the shared cloud store.
async function pushSharedKnowledge(learned) {
  if (!firebaseReady()) return false;
  try {
    const db = window.firebase.database();
    const ref = db.ref(SHARED_KNOWLEDGE_PATH);
    const updates = {};
    learned.forEach(entry => {
      updates[entry.q] = entry;
    });
    await ref.update(updates);
    return true;
  } catch (e) {
    console.warn('Could not push shared knowledge:', e);
    return false;
  }
}

// Pre-taught knowledge base (everything the AI already "knows" about the site).
const AI_BUILTIN_KNOWLEDGE = [
  // ---- Site basics ----
  { q: 'what is this site', a: 'diddys playhouse is an unblocked gaming platform! 🎮 It has tons of free games you can play anywhere, anytime, right in your browser.' },
  { q: 'what is diddys playhouse', a: 'didys playhouse is the ultimate unblocked gaming platform! 🎮 It has tons of free games you can play right in your browser, plus a community chat, favorites, an AI assistant, music, and more.' },
  { q: 'who made this site', a: "diddys playhouse was built as a fun community gaming platform. It's made by gamers for gamers! 🎮" },
  { q: 'is this site free', a: 'Yes! diddys playhouse is completely free to use. 🎉 You can play all the games, chat, and use the AI assistant at no cost. There is also a donation page if you want to support us 💜.' },
  { q: 'is this site safe', a: 'Yes, diddys playhouse is a safe, family-friendly gaming site. 🛡️ It has a panic button (🚨 top-right) to quickly hide the page if a teacher walks by!' },
  { q: 'how many games', a: function(){ var g = getGamesList(); return 'There are currently ' + g.length + ' games on diddys playhouse! 🎮 Go check them out on the Games page.'; } },
  { q: 'game count', a: function(){ var g = getGamesList(); return 'There are currently ' + g.length + ' games on diddys playhouse! 🎮 Go check them out on the Games page.'; } },
  { q: 'number of games', a: function(){ var g = getGamesList(); return 'There are currently ' + g.length + ' games on diddys playhouse! 🎮 Go check them out on the Games page.'; } },

  // ---- Pages / navigation ----
  { q: 'what pages are on this site', a: 'diddys playhouse has lots of pages: 🏠 Home, 🎮 Games, ❤️ Favorites, 💬 Chat, 🤖 AI, 💡 Ideas, 📰 Updates, 🚀 What\'s Next, 🎵 Music, 🧩 Apps, and more. You can find them all in the top navigation bar!' },
  { q: 'how do i find games', a: 'Head over to the 🎮 Games page (games.html) to see every game. You can also use the 🎡 Random Game wheel on the Home or Games page to get a random pick, and favorite games with the ★ star so they show up on your ❤️ Favorites page!' },
  { q: 'how do i go home', a: 'Just click the 🏠 Home link in the top navigation bar, or open home.html. It takes you right back to the main page!' },
  { q: 'what is the favorites page', a: 'The ❤️ Favorites page shows all the games you\'ve starred with the ★ button. Click the star on any game card to save it, and it will appear on your Favorites page for quick access!' },
  { q: 'what is the chat page', a: 'The 💬 Chat page is a community chat where you and other players can talk, react to messages with 👍❤️😂🔥 and more, and pick a custom username. It\'s all stored locally on your device!' },
  { q: 'what is the ideas page', a: 'The 💡 Ideas page is where you can share feature ideas for diddys playhouse! Submit your ideas and they may get built into the site.' },
  { q: 'what is the updates page', a: 'The 📰 Updates page shows all the latest news, features, and changes to diddys playhouse. Check it often to see what\'s new!' },
  { q: 'what is "whats next" page', a: 'The 🚀 What\'s Next page (future_updates.html) shows the roadmap of upcoming features that are "coming soon" to diddys playhouse!' },
  { q: 'what is the music page', a: 'The 🎵 Music page lets you listen to tracks while you play. It\'s a fun way to set the mood for gaming!' },
  { q: 'what is the apps page', a: 'The 🧩 Apps page has fun mini-apps and tools you can use alongside the games on diddys playhouse.' },
  { q: 'what is the admin page', a: 'The 🔧 Admin page is for site admins to manage content like updates. It requires special access to use.' },
  { q: 'what is the login page', a: 'The login page (login.html) is where admins can log in to access the admin tools. There\'s also a secret way to get to it (type "mss" 🕵️)!' },
  { q: 'what is the sponsor page', a: 'The sponsor page (sponsor.html) is how businesses can advertise on diddys playhouse. If you want your ad here, click "Learn more" on the sponsor box!' },
  { q: 'what is the donation page', a: 'The 💜 Donation page lets you support diddys playhouse. Your donations help keep the platform running and free for everyone!' },

  // ---- Games by category ----
  { q: 'what action games', a: 'The action games on diddys playhouse include: ⚔️ 1v1 LOL, 💥 Awesome Tanks, and 🗡️ Betrayal.io. Great choices if you want fast-paced action!' },
  { q: 'what sports games', a: 'There are lots of sports games! 🏀 Basketball, ⚽ Soccer, 🏈 Football, 🏆 Small World Cup, ⚽ Axis Football League, 🏀 Basket Bros, ✨ Basketball Stars, ⚾ Baseball Bros, and ⚽ 1 on 1 Soccer.' },
  { q: 'what arcade games', a: 'The arcade games are: 🏍️ Moto X3M, 🐔 Crossy Road, 🚗 Arcade Car Driving, 🍎 Apple Shooter, 🧩 Matching Game, and 🚗 Drive Mad. Quick, fun, and easy to jump into!' },
  { q: 'what horror games', a: 'The horror games are the FNAF series! 🐻 FNAF 1, 🦴 FNAF 2, 🐻 FNAF 3, and 🪓 FNAF 4. Just watch out for the animatronics... 🔦' },
  { q: 'what music games', a: 'The music game on the site is 🎵 FNF (Friday Night Funkin)! Perfect if you love rhythm games.' },
  { q: 'what idle games', a: 'The idle game on the site is 🍪 Cookie Clicker. Just keep clicking those cookies and watch the numbers grow!' },
  { q: 'what games are there', a: function(){ var g = getGamesList(); if (!g.length) return 'There are lots of games on the Games page! 🎮 Head over to games.html to browse them all.'; return 'There are ' + g.length + ' games! They include: ' + g.map(x => x.name + ' ' + x.emoji).slice(0, 12).join(', ') + ' and more. Check the 🎮 Games page for the full list!'; } },
  { q: 'list all games', a: function(){ var g = getGamesList(); if (!g.length) return 'Head over to the 🎮 Games page to see all games!'; return 'Here are all the games: ' + g.map(x => x.name + ' ' + x.emoji).join(', ') + '. 🎮'; } },
  { q: 'best game', a: function(){ var g = getGamesList(); if (g.length) { var p = g[Math.floor(Math.random()*g.length)]; return 'Honestly, every game is fun in its own way, but a lot of people enjoy ' + p.name + ' ' + p.emoji + '! Give it a try.'; } return 'There are so many great games to choose from! Browse the Games page and find your favorite. 🎮'; } },
  { q: 'favorite game', a: function(){ var g = getGamesList(); if (g.length) { var p = g[Math.floor(Math.random()*g.length)]; return 'Honestly, every game is fun in its own way, but a lot of people enjoy ' + p.name + ' ' + p.emoji + '! Give it a try.'; } return 'There are so many great games to choose from! Browse the Games page and find your favorite. 🎮'; } },

  // ---- FNAF ----
  { q: 'what is fnaf', a: "FNAF (Five Nights at Freddy's) is a classic horror game series! 🐻 We have FNAF 1 through 4 on the site. Just be careful of the animatronics... 🔦" },
  { q: 'how many fnaf games', a: 'There are 4 FNAF games on diddys playhouse: FNAF 1 🐻‍❄️, FNAF 2 🦴, FNAF 3 🐻, and FNAF 4 🪓. All of them are horror games!' },
  { q: 'fnaf 1', a: 'FNAF 1 🐻‍❄️ is the first Five Nights at Freddy\'s game! It\'s a horror game on diddys playhouse. Play it on the Games page!' },
  { q: 'fnaf 2', a: 'FNAF 2 🦴 is the second Five Nights at Freddy\'s game! It\'s a horror game on diddys playhouse. Play it on the Games page!' },
  { q: 'fnaf 3', a: 'FNAF 3 🐻 is the third Five Nights at Freddy\'s game! It\'s a horror game on diddys playhouse. Play it on the Games page!' },
  { q: 'fnaf 4', a: 'FNAF 4 🪓 is the fourth Five Nights at Freddy\'s game! It\'s a horror game on diddys playhouse. Play it on the Games page!' },
  { q: 'five nights', a: "FNAF (Five Nights at Freddy's) is a classic horror game series! 🐻 We have FNAF 1 through 4 on the site." },

  // ---- Specific games ----
  { q: '1v1 lol', a: '⚔️ 1v1 LOL is an action game where you battle it out in 1v1 fights! It\'s on the Games page. Want to play it?' },
  { q: 'basketball', a: '🏀 Basketball is a sports game on diddys playhouse. It\'s on the Games page!' },
  { q: 'soccer', a: '⚽ Soccer is a sports game on diddys playhouse. There\'s also 1 on 1 Soccer and Small World Cup!' },
  { q: 'football', a: '🏈 Football is a sports game on diddys playhouse. It\'s on the Games page!' },
  { q: 'fnf', a: '🎵 FNF (Friday Night Funkin) is a rhythm music game on diddys playhouse. Hit those beats!' },
  { q: 'moto x3m', a: '🏍️ Moto X3M is an arcade motocross game on diddys playhouse. Stunt your way through the levels!' },
  { q: 'crossy road', a: '🐔 Crossy Road is an arcade game where you help a chicken cross the road! Avoid the traffic!' },
  { q: 'cookie clicker', a: '🍪 Cookie Clicker is an idle game where you click cookies to earn more cookies. It\'s addictive!' },
  { q: 'betrayal', a: '🗡️ Betrayal.io is an action/social deduction game on diddys playhouse. Can you spot the impostor?' },
  { q: 'matching game', a: '🧩 Matching Game is an arcade memory game where you match pairs of cards. Great for sharpening your memory!' },
  { q: 'drive mad', a: '🚗 Drive Mad is an arcade driving game on diddys playhouse. Hit the road!' },
  { q: 'small world cup', a: '🏆 Small World Cup is a sports game on diddys playhouse. It\'s a fun soccer-style game!' },

  // ---- Features ----
  { q: 'what is the panic button', a: 'The 🚨 panic button is in the top-right corner of the main pages! If a teacher walks by, just click it and it instantly takes you to a safe page. Super handy for sneaky gaming. 😉' },
  { q: 'panic button', a: 'The 🚨 panic button is in the top-right corner of the main pages. Click it to instantly hide the page if a teacher walks by!' },
  { q: 'what is the random wheel', a: 'The 🎡 Random Game wheel picks a random game for you! You can spin it on the Home or Games page. It\'s great when you can\'t decide what to play.' },
  { q: 'random game', a: 'Use the 🎡 Random Game wheel on the Home or Games page to get a random game pick!' },
  { q: 'what are themes', a: 'You can change the theme with the 🎨 button in the top navigation! There are fun themes (including a gay-pride rainbow one 🌈) and even a color customizer so you can set your own colors.' },
  { q: 'how do i change theme', a: 'Click the 🎨 theme button in the top nav to open the theme menu. You can pick a preset theme or open the color customizer to set your own primary, secondary, green, and purple colors!' },
  { q: 'what is the color customizer', a: 'The 🎨 color customizer lets you set your own theme colors! You can change the primary, secondary, green, and purple accent colors to make the site yours.' },
  { q: 'how do i favorite a game', a: 'Click the ★ star button on any game card to favorite it! Your favorited games show up on the ❤️ Favorites page.' },
  { q: 'how do i keep track of games i played', a: 'The ▶️ Continue Playing section on the Home and Games pages shows your recently played games. The site also tracks game play counts for "Most Played" stats!' },
  { q: 'what is the cursor trail', a: 'When you move your mouse, a colorful ✨ cursor trail follows it around the site. It looks really cool, especially with the rainbow theme!' },
  { q: 'what is the wheel', a: 'The 🎡 wheel is a random game picker! It spins and lands on a random game for you to play.' },
  { q: 'how do i chat', a: 'Go to the 💬 Chat page to join the community chat. You can type messages, react to others with 👍❤️😂 and more, and even set a custom username!' },
  { q: 'how do i set a username', a: 'On the 💬 Chat page there\'s a toggle to enable a custom username. Turn it on and type your name — it will be saved and used as your chat name!' },
  { q: 'what is the advertisements', a: 'The sponsor boxes on the site show ads and sponsor messages. Businesses can advertise there — check the sponsor.html page to learn more!' },
  { q: 'how do i sponsor', a: 'Want to sponsor? Check out the sponsor.html page (or click "Learn more" on the sponsor box) to see how you can get your ad on diddys playhouse!' },
  { q: 'how do i donate', a: 'You can donate on the 💜 Donation page (donation.html). Your support helps keep the platform running and free!' },

  // ---- Auth / login ----
  { q: 'how do i login', a: 'Open the login page (login.html) to log in. There\'s also a secret way: type "mss" anywhere on the Home page to trigger the secret login! 🤫' },
  { q: 'secret login', a: 'There\'s a secret way to reach the login page 🤫 — type the letters "mss" on the Home page and it will secretly take you to login.html!' },
  { q: 'what is the secret', a: 'There\'s a secret on the Home page 🕵️ — try typing "mss" and see what happens...' },
  { q: 'what is logout', a: 'The Logout button in the top nav logs you out of the admin account. It\'s near the other nav links.' },

  // ---- AI / this bot ----
  { q: 'what can you do', a: "I'm your friendly AI assistant! 🤖 I know all about diddys playhouse — the games, pages, features, and more. I can recommend games, tell jokes, answer questions about the site, and I'm always learning new things!" },
  { q: 'how do you work', a: "I'm a smart assistant that's been taught lots of things about diddys playhouse! 📚 I answer based on my knowledge base, and I keep learning new answers the more people teach me." },
  { q: 'are you an ai', a: "Yes, I'm the diddys playhouse AI assistant! 🤖 I've been taught everything about the site and I'm always ready to help." },
  { q: 'do you know anything', a: "I know a whole lot about diddys playhouse! 🎮 Ask me about the games, the pages, the features, the panic button, the secret login, or anything else on the site." },
  { q: 'what do you know', a: "I know all about diddys playhouse! 🎮 I can tell you about the games list, categories, all the pages, the panic button, the random wheel, themes, the favorites system, and lots more. Go ahead and ask me anything!" },
  { q: 'can you learn', a: "Yes, I can learn! 🧠 I've already been taught all the info about this site, and I'll keep picking up new knowledge the more you chat with me." },
  { q: 'who are you', a: "I'm diddys playhouse's AI assistant! 🤖 I'm here to help you find games, answer questions about the site, and have fun. What's your name?" },
  { q: 'your name', a: "I'm the diddys playhouse AI assistant! 🤖 Call me whatever you like — I'm here to help." },

  // ---- Panic / teacher ----
  { q: 'teacher', a: 'If a teacher walks by, just hit the 🚨 panic button in the top-right corner! It instantly takes you to a safe page so you don\'t get caught. 😉' },
  { q: 'hide', a: 'Use the 🚨 panic button (top-right corner) to instantly hide the page and go to a safe screen if a teacher or parent walks by!' },
  { q: 'emergency', a: 'In an emergency, click the 🚨 panic button in the top-right corner — it instantly hides the page and takes you to a safe screen!' },

  // ---- Misc ----
  { q: 'who is micah', a: 'There\'s a fun easter egg on the 💬 Chat page! Try typing "micah" in the message box and see what happens. 😏' },
  { q: 'easter egg', a: 'There are easter eggs hidden on the site! Try typing "micah" in the chat, or "mss" on the Home page. 🥚✨' },
  { q: 'micah', a: 'Try typing "micah" in the 💬 chat message box — there\'s a secret reaction waiting for you! 😏' },
  { q: 'whats new', a: 'The ✨ What\'s New modal shows the latest updates when you open the Home page, and there\'s a 📰 Updates page with all the news. Check it out!' },
  { q: 'updates', a: 'The 📰 Updates page has all the latest news and features for diddys playhouse. New stuff gets added all the time!' },
  { q: 'roadmap', a: 'The 🚀 What\'s Next page (future_updates.html) shows the roadmap of upcoming features! Things like new games, features, and more.' }
];

// Convert any function-valued answers into real strings at load time.
function resolveAnswer(a) {
  return typeof a === 'function' ? String(a()) : String(a);
}

// Cloud-shared knowledge cache (loaded once from Firebase).
let cachedShared = null;

// Load the knowledge base from storage (builtin + user-learned + cloud-shared).
function getKnowledge() {
  let learned = [];
  try {
    learned = JSON.parse(localStorage.getItem(AI_KNOWLEDGE_KEY)) || [];
  } catch (e) { learned = []; }
  const shared = cachedShared || [];
  return {
    learned: learned,
    shared: shared,
    all: AI_BUILTIN_KNOWLEDGE.slice().concat(learned).concat(shared)
  };
}

// Asynchronously refresh cloud-shared knowledge into the cache.
async function refreshSharedKnowledge() {
  const shared = await loadSharedKnowledge();
  cachedShared = shared;
  return shared;
}

// Save the user-learned knowledge.
function saveKnowledge(learned) {
  try {
    localStorage.setItem(AI_KNOWLEDGE_KEY, JSON.stringify(learned.slice(-200)));
  } catch (e) {}
}

// Add a new (question, answer) pair to the knowledge base.
function teachAI(question, answer) {
  const kb = getKnowledge();
  const q = String(question || '').toLowerCase().trim();
  const a = String(answer || '').trim();
  if (!q || !a) return false;

  // Avoid duplicate questions.
  const existing = kb.learned.findIndex(e => e.q === q);
  if (existing >= 0) {
    kb.learned[existing].a = a;
    kb.learned[existing].uses = 0;
  } else {
    kb.learned.push({ q: q, a: a, uses: 0 });
  }
  saveKnowledge(kb.learned);

  // Also push to the cloud so ALL users learn it.
  pushSharedKnowledge(kb.learned);

  return true;
}

// Match the user's input against the knowledge base using keyword overlap.
function matchKnowledge(text) {
  const kb = getKnowledge();
  const words = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  let best = null;
  let bestScore = 0;

  kb.all.forEach(entry => {
    const qWords = entry.q.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    let score = 0;
    qWords.forEach(w => { if (words.indexOf(w) !== -1) score++; });
    // Prefer longer matches / higher usage.
    if (score > bestScore || (score === bestScore && (entry.uses || 0) > (best ? best.uses || 0 : 0))) {
      if (score > 0) {
        best = entry;
        bestScore = score;
      }
    }
  });

// Only accept a match if it has at least one significant shared word.
  if (best && bestScore >= 1) {
    // Slight bump to usage count for learned entries (helps prefer popular answers).
    try {
      const kb2 = getKnowledge();
      const idx = kb2.learned.findIndex(e => e.q === best.q);
      if (idx >= 0) {
        kb2.learned[idx].uses = (kb2.learned[idx].uses || 0) + 1;
        saveKnowledge(kb2.learned);
      }
    } catch (e) {}
    return resolveAnswer(best.a);
  }
  return null;
}

// Number of items the AI has learned (builtin + user).
function getKnowledgeCount() {
  return getKnowledge().all.length;
}

// ==================== DETECT TEACHING INPUT ==================== //
// If someone uses "learn:" or "teach:" prefix, store the Q&A.
function detectTeachInput(inputText) {
  const m = String(inputText || '').match(/^\s*(?:learn|teach)\s*:\s*(.+)$/i);
  if (!m) return null;
  const parts = m[1].split('|');
  if (parts.length < 2) return null;
  return { question: parts[0].trim(), answer: parts[1].trim() };
}

// ==================== AI RESPONSE ENGINE ==================== //
function generateAIResponse(input) {
  const text = String(input || '').toLowerCase().trim();

  // 1) Handle teaching input first.
  const teach = detectTeachInput(input);
  if (teach) {
    if (teach.question && teach.answer && teachAI(teach.question, teach.answer)) {
      return `Got it! 🧠 I've learned that "${teach.question}" means: "${teach.answer}". Ask me again and I'll remember it!`;
    }
    return "Hmm, I couldn't learn that. 🤔 Use the format: learn: your question | the answer";
  }

  // 2) Check the knowledge base for a learned match.
  const learned = matchKnowledge(text);
  if (learned) return learned;

  // Greetings
  if (/(^|\s)(hi|hello|hey|yo|sup|hola|good (morning|afternoon|evening))\b/.test(text)) {
    return 'Hey there! 👋 Welcome to diddys playhouse! I can help you find games, answer questions, or just chat. What do you need?';
  }

  // How are you
  if (/how are you|how r u|how are things/.test(text)) {
    return "I'm doing great, thanks for asking! 😄 Ready to help you game. What's up?";
  }

  // Game recommendations
  if (/(recommend|suggest|what game should i play|which game)/.test(text)) {
    const games = getGamesList();
    if (games.length) {
      const pick = games[Math.floor(Math.random() * games.length)];
      return `I'd recommend ${pick.name} ${pick.emoji}! It's a ${pick.category} game and a lot of fun. Want another suggestion?`;
    }
    return 'Check out the Games page for a full list — there are tons to choose from! 🎮';
  }

  // How many games
  if (/(how many games|game count|number of games)/.test(text)) {
    const games = getGamesList();
    return `There are currently ${games.length} games on diddys playhouse! 🎮 Go check them out on the Games page.`;
  }

  // Best game / favorites
  if (/(best game|favorite game|top game|most popular)/.test(text)) {
    const games = getGamesList();
    if (games.length) {
      const pick = games[Math.floor(Math.random() * games.length)];
      return `Honestly, every game is fun in its own way, but a lot of people enjoy ${pick.name} ${pick.emoji}! Give it a try.`;
    }
    return 'There are so many great games to choose from! Browse the Games page and find your favorite. 🎮';
  }

  // Joke
  if (/(joke|funny|make me laugh)/.test(text)) {
    const jokes = [
      "Why don't skeletons play video games? Because they don't have the guts! 💀",
      "Why did the game go to the doctor? Because it had too many glitches! 🕹️",
      "What do you call a game that's always honest? A 'truth-telling' simulator! 😄",
      "Why was the computer cold? It left its Windows open! 🖥️",
      "I told my computer I needed a break. Now it won't stop sending me vacation ads. 😅"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // What can you do
  if (/(what can you do|help|how do you work|are you (a|an) ai)/.test(text)) {
    return "I'm your friendly AI assistant! 🤖 I can recommend games, tell you how many games are on the site, tell jokes, and chat with you. Just ask me anything gaming-related!";
  }

  // FNAF
  if (/(fnaf|five nights)/.test(text)) {
    return 'FNAF (Five Nights at Freddy\'s) is a classic horror game series! 🐻 We have FNAF 1 through 4 on the site. Just be careful of the animatronics... 🔦';
  }

  // Games / play
  if (/(play|games?|game)/.test(text)) {
    return 'You can find all our games on the Games page! 🎮 Head over to games.html to browse and play. Want me to recommend one?';
  }

  // Thanks
  if (/(thanks|thank you|thx|ty)/.test(text)) {
    return "You're welcome! 😊 Happy gaming! Let me know if you need anything else.";
  }

  // Panic button
  if (/(panic|hide|teacher|emergency)/.test(text)) {
    return 'The 🚨 panic button is in the top-right corner of the main pages! If a teacher walks by, just click it — it instantly takes you to a safe page.';
  }

  // Bye
  if (/(bye|goodbye|see you|later|gtg)/.test(text)) {
    return 'Goodbye! 👋 Come back anytime to game with us. Have a great day!';
  }

  // Who are you / name
  if (/(who are you|your name|what is your name)/.test(text)) {
    return "I'm diddys playhouse's AI assistant! 🤖 I'm here to help you find games and have fun. What's your name?";
  }

  // Love / like
  if (/(love|like|awesome|cool|great|nice)/.test(text)) {
    return 'That makes me happy to hear! 😄 I think diddys playhouse is awesome too. Anything else you want to know?';
  }

  // Fallback
  return "That's an interesting question! 🤔 I'm still learning, but I can help you find games, tell jokes, or chat about the site. Try asking 'recommend a game' or 'tell me a joke'!";
}

// ==================== STORAGE ==================== //
function getAIChat() {
  try {
    return JSON.parse(localStorage.getItem(getAIChatKey())) || [];
  } catch (e) {
    return [];
  }
}

function saveAIChat(messages) {
  try {
    localStorage.setItem(getAIChatKey(), JSON.stringify(messages.slice(-100)));
  } catch (e) {}
}

// ==================== RENDERING ==================== //
function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function loadAIChat() {
  const container = document.getElementById('aiMessagesContainer');
  if (!container) return;

  const messages = getAIChat();
  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="ai-message ai-bot">
        <div class="ai-avatar">🤖</div>
        <div class="ai-bubble">
          <div class="ai-name">Assistant</div>
          <div class="ai-text">Hi! I'm your AI assistant. 👋 Ask me for game recommendations, help, or just chat with me!</div>
        </div>
      </div>
    `;
    return;
  }

  messages.forEach(msg => {
    if (msg.role === 'user') {
      container.innerHTML += `
        <div class="ai-message ai-user">
          <div class="ai-bubble">
            <div class="ai-text">${escapeHtml(msg.text)}</div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML += `
        <div class="ai-message ai-bot">
          <div class="ai-avatar">🤖</div>
          <div class="ai-bubble">
            <div class="ai-name">Assistant</div>
            <div class="ai-text">${escapeHtml(msg.text)}</div>
          </div>
        </div>
      `;
    }
  });

  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

// ==================== SEND MESSAGE ==================== //
function sendAIMessage(event) {
  if (event) event.preventDefault();

  const input = document.getElementById('aiMessageInput');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const messages = getAIChat();
  messages.push({ role: 'user', text, time: Date.now() });
  saveAIChat(messages);
  input.value = '';
  loadAIChat();

  // Simulate "typing" with a short delay.
  const container = document.getElementById('aiMessagesContainer');
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-message ai-bot';
  typingEl.innerHTML = '<div class="ai-avatar">🤖</div><div class="ai-bubble"><div class="ai-name">Assistant</div><div class="ai-text ai-typing">...</div></div>';
  if (container) container.appendChild(typingEl);
  setTimeout(() => { if (container) container.scrollTop = container.scrollHeight; }, 50);

  setTimeout(() => {
    const reply = generateAIResponse(text);
    const updated = getAIChat();
    updated.push({ role: 'bot', text: reply, time: Date.now() });
    saveAIChat(updated);
    loadAIChat();
    updateKnowledgeCount();
  }, 700);
}

// ==================== SUGGESTION CHIPS ==================== //
function setAIPrompt(prompt) {
  const input = document.getElementById('aiMessageInput');
  if (!input) return;
  input.value = prompt;
  input.focus();
}

// ==================== CLEAR ==================== //
function clearAIChat() {
  if (confirm('Clear your AI chat history?')) {
    saveAIChat([]);
    loadAIChat();
  }
}

// ==================== SHARED KNOWLEDGE VIEWER ==================== //
function viewSharedKnowledge() {
  const el = document.getElementById('aiSharedKnowledgeList');
  if (!el) return;
  refreshSharedKnowledge().then(() => {
    const kb = getKnowledge();
    const shared = kb.shared;
    if (!shared.length) {
      el.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary);">No shared knowledge yet. Teach the AI something (learn: question | answer) and it will appear here for everyone!</p>';
    } else {
      el.innerHTML = '<p style="font-weight:700; margin-bottom: 0.5rem;">🧠 Shared knowledge from all users:</p>' +
        shared.map(e => '<div style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.06);"><strong>Q:</strong> ' + escapeHtml(e.q) + '<br><strong>A:</strong> ' + escapeHtml(e.a) + '</div>').join('');
    }
  });
}

// ==================== INIT ==================== //
function updateKnowledgeCount() {
  const el = document.getElementById('aiKnowledgeCount');
  if (el) el.textContent = getKnowledgeCount();
}

document.addEventListener('DOMContentLoaded', () => {
  loadAIChat();
  updateKnowledgeCount();

  // Load any cloud-shared knowledge (if Firebase is configured).
  refreshSharedKnowledge().then(() => {
    updateKnowledgeCount();
  });
});
