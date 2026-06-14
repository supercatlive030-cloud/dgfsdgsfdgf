// ==================== CHAT SYSTEM ==================== //

// Game data
const gamesData = [
    { name: '1v1 LOL', emoji: '⚔️', path: 'games/1v1lol.html', category: 'action' },
    { name: 'Basketball', emoji: '🏀', path: 'games/basketball.html', category: 'sports' },
    { name: 'Soccer', emoji: '⚽', path: 'games/soccer.html', category: 'sports' },
    { name: 'Football', emoji: '🏈', path: 'games/football.html', category: 'sports' },
    { name: 'FNF', emoji: '🎵', path: 'games/fnf.html', category: 'music' },
    { name: 'Moto X3M', emoji: '🏍️', path: 'games/motox3m.html', category: 'arcade' },
    { name: 'Crossy Road', emoji: '🐔', path: 'games/crossyroad.html', category: 'arcade' },
];

// ==================== BROADCAST CHANNEL ==================== //
let chatChannel;
try {
    chatChannel = new BroadcastChannel('file_club_chat');
    chatChannel.onmessage = (event) => {
        if (event.data.type === 'new_message' || event.data.type === 'clear_chat') {
            loadMessages();
        }
    };
} catch (e) {
    console.log('BroadcastChannel not supported, using fallback polling');
}

document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    setupMessageForm();
    setupUsernameToggle();
    setupMicahEasterEgg();
    if (!chatChannel) autoRefreshMessages(); // Fallback polling if no BroadcastChannel
    addHoverSounds();
});

// ==================== USERNAME SYSTEM ==================== //
function setupUsernameToggle() {
    const toggle = document.getElementById('usernameToggle');
    const input = document.getElementById('customUsername');
    if (!toggle || !input) return;
    
    const isAnonymous = localStorage.getItem('chatAnonymous') !== 'false';
    const customName = localStorage.getItem('chatUsername') || '';
    
    if (!isAnonymous) {
        toggle.classList.add('active');
        input.value = customName;
        input.style.display = 'block';
    }
    
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const isNowNamed = toggle.classList.contains('active');
        
        localStorage.setItem('chatAnonymous', isNowNamed ? 'false' : 'true');
        input.style.display = isNowNamed ? 'block' : 'none';
    });
    
    input.addEventListener('change', () => {
        localStorage.setItem('chatUsername', input.value || 'Player');
    });
}

function getCurrentUsername() {
    const isAnonymous = localStorage.getItem('chatAnonymous') !== 'false';
    if (isAnonymous) return 'Anonymous';
    return localStorage.getItem('chatUsername') || 'Player';
}

// ==================== MICAH EASTER EGG ==================== //
function setupMicahEasterEgg() {
    let micahTyped = '';
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    messageInput.addEventListener('keydown', (e) => {
        const char = e.key.toLowerCase();
        micahTyped += char;
        
        // Keep only last 5 characters
        if (micahTyped.length > 5) {
            micahTyped = micahTyped.slice(-5);
        }
        
        // Check for "micah"
        if (micahTyped.includes('micah')) {
            triggerMicahEasterEgg();
            micahTyped = ''; // Reset
        }
    });
}

function triggerMicahEasterEgg() {
    const options = [
        '🤔 hm interesting...',
        '😏 you know something i dont?',
        '🤫 shhh keep it secret',
        '😁 good taste in names',
        '💯 quality choice',
        '🎯 BINGO!',
        '🔥 thats the one',
        '✨ special mention'
    ];
    
    const randomOption = options[Math.floor(Math.random() * options.length)];
    
    const messageInput = document.getElementById('messageInput');
    messageInput.value = randomOption;
    messageInput.style.color = '#ff006e';
    
    setTimeout(() => {
        messageInput.value = '';
        messageInput.style.color = 'var(--text-primary)';
    }, 3000);
}

// ==================== MESSAGE STORAGE ==================== //
function getAllMessages() {
    return JSON.parse(localStorage.getItem('chatMessages')) || [];
}

function saveMessage(message) {
    const messages = getAllMessages();
    messages.push(message);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Broadcast to all tabs
    if (chatChannel) {
        chatChannel.postMessage({ type: 'new_message', message: message });
    }
}

function clearAllMessages() {
    localStorage.setItem('chatMessages', JSON.stringify([]));
    
    // Broadcast clear to all tabs
    if (chatChannel) {
        chatChannel.postMessage({ type: 'clear_chat' });
    }
    
    loadMessages();
}

// ==================== LOAD MESSAGES ==================== //
function loadMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    const messages = getAllMessages();
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
        return;
    }

    const reactionEmojis = ['👍', '❤️', '😂', '🔥', '😮', '😢', '🎉', '🚀', '💯', '✨'];

    messages.forEach((msg, index) => {
        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';
        
        // Create avatar with user's first initial
        const initial = (msg.username || 'A')[0].toUpperCase();
        
        const reactionButtons = reactionEmojis.map(emoji => 
            `<button class="reaction-btn" onclick="addReaction(${index}, '${emoji}')">
                ${emoji}
                <span class="reaction-count">${msg.reactions?.[emoji] || 0}</span>
            </button>`
        ).join('');

        profileCard.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${initial}</div>
                <div class="profile-info">
                    <span class="username-glow">${escapeHtml(msg.username)}</span>
                    <span class="message-time">${msg.time}</span>
                </div>
            </div>
            <span class="message-text">${escapeHtml(msg.text)}</span>
            <div class="reactions-container">
                ${reactionButtons}
            </div>
        `;
        
        container.appendChild(profileCard);
    });

    // Auto-scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function addReaction(messageIndex, emoji) {
    const messages = getAllMessages();
    if (!messages[messageIndex]) return;
    
    if (!messages[messageIndex].reactions) {
        messages[messageIndex].reactions = {};
    }
    
    messages[messageIndex].reactions[emoji] = (messages[messageIndex].reactions[emoji] || 0) + 1;
    
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Broadcast reaction update
    if (chatChannel) {
        chatChannel.postMessage({ type: 'reaction_added', messageIndex });
    }
    
    loadMessages();
}

// ==================== SEND MESSAGE ==================== //
function setupMessageForm() {
    const form = document.getElementById('messageForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(e);
    });
}

function sendMessage(event) {
    if (event) event.preventDefault();

    const input = document.getElementById('messageInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text || text.length === 0) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const message = {
        username: getCurrentUsername(),
        text: text,
        time: time,
        timestamp: now.getTime(),
        reactions: {}
    };

    saveMessage(message);
    input.value = '';
    loadMessages();
}

// ==================== AUTO-REFRESH ==================== //
function autoRefreshMessages() {
    setInterval(() => {
        loadMessages();
    }, 2000);
}

// ==================== CLEAR CHAT ==================== //
function clearChatHistory() {
    if (confirm('Are you sure? This will delete all chat messages permanently.')) {
        clearAllMessages();
    }
}

// ==================== UTILITY ==================== //
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function addHoverSounds() {
    // Hover sounds removed
}
