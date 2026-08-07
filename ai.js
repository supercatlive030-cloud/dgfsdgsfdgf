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

// ==================== AI RESPONSE ENGINE ==================== //
function generateAIResponse(input) {
  const text = String(input || '').toLowerCase().trim();

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

// ==================== INIT ==================== //
document.addEventListener('DOMContentLoaded', () => {
  loadAIChat();
});
