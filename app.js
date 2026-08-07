// ==================== APP UTILITIES ==================== //

// Game data
const gamesData = [
    { name: '1v1 LOL', emoji: '⚔️', path: 'games/1v1lol.html', category: 'action' },




    { name: 'Basketball', emoji: '🏀', path: 'games/basketball.html', category: 'sports' },

    { name: 'Soccer', emoji: '⚽', path: 'games/soccer.html', category: 'sports' },
    { name: 'Football', emoji: '🏈', path: 'games/football.html', category: 'sports' },
    { name: 'FNF', emoji: '🎵', path: 'games/fnf.html', category: 'music' },
    { name: 'Moto X3M', emoji: '🏍️', path: 'games/motox3m.html', category: 'arcade' },
    { name: 'Crossy Road', emoji: '🐔', path: 'games/crossyroad.html', category: 'arcade' },

    // Added from your list:
    { name: 'Small World Cup', emoji: '🏆', path: 'games/small-world-cup.html', category: 'sports' },
    { name: 'Arcade Car Driving', emoji: '🚗', path: 'games/arcade-car-driving.html', category: 'arcade' },
    { name: 'Awesome Tanks', emoji: '💥', path: 'games/awesome-tanks.html', category: 'action' },
    { name: 'Axis Football League', emoji: '⚽', path: 'games/axis-football-league.html', category: 'sports' },
    { name: 'Apple Shooter', emoji: '🍎', path: 'games/apple-shooter.html', category: 'arcade' },
    { name: 'Matching Game', emoji: '🧩', path: 'games/matching-game.html', category: 'arcade' },
    { name: 'Betrayal.io', emoji: '🗡️', path: 'games/betrayal-io.html', category: 'action' },
    { name: 'Cookie Clicker', emoji: '🍪', path: 'games/cookie-clicker.html', category: 'idle' },
    { name: 'FNAF 4', emoji: '🪓', path: 'games/fnaf-4.html', category: 'horror' },
    { name: 'FNAF 3', emoji: '🐻', path: 'games/fnaf-3.html', category: 'horror' },
    { name: 'FNAF 2', emoji: '🦴', path: 'games/fnaf-2.html', category: 'horror' },
    { name: 'FNAF 1', emoji: '🐻‍❄️', path: 'games/fnaf-1.html', category: 'horror' },
    { name: 'Basket Bros', emoji: '🏀', path: 'games/basket-bros.html', category: 'sports' },
    { name: 'Basketball Stars', emoji: '✨', path: 'games/basket-stars.html', category: 'sports' },
    { name: 'Baseball Bros', emoji: '⚾', path: 'games/basketballs-bros-baseball.html', category: 'sports' },

    // Newest additions:
    { name: '1 on 1 Soccer', emoji: '⚽', path: 'games/1on1soccer.html', category: 'sports' },
    { name: 'Drive Mad', emoji: '🚗', path: 'games/drive-mad.html', category: 'arcade' },
];

// Expose on window so shared scripts (e.g. wheel.js) can read the game list.
window.gamesData = gamesData;


document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    
    setupCursorTrail();
    
    if (currentPage === 'home.html') {
        setupHomePage();
    }

    addHoverSounds();
});

// ==================== CURSOR TRAIL ==================== //
function setupCursorTrail() {
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create trail particles every 10ms
        if (Math.random() > 0.7) {
            createTrailParticle(mouseX, mouseY);
        }
    });
}

function createTrailParticle(x, y) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    
    const size = Math.random() * 6 + 3;
    // Use rainbow accents when Gay Pride theme is active
    const currentTheme = localStorage.getItem('selectedTheme');
    const colors = currentTheme === 'gay-pride'
        ? ['#FF0000', '#FF7A00', '#FFFF00', '#00D95F', '#00B7FF', '#6A00FF', '#FF1493']
        : ['#00d9ff', '#ff006e', '#b366ff', '#39ff14'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    trail.style.width = size + 'px';
    trail.style.height = size + 'px';
    trail.style.background = color;
    trail.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + color;
    
    document.body.appendChild(trail);
    
    // Remove after animation
    setTimeout(() => trail.remove(), 800);
}

// ==================== RECENTLY PLAYED ==================== //
function trackGamePlay(gameName) {
    let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    
    // Remove if already exists
    recentlyPlayed = recentlyPlayed.filter(g => g.name !== gameName);
    
    // Add to front
    const game = gamesData.find(g => g.name === gameName);
    if (game) {
        recentlyPlayed.unshift({ ...game, timestamp: Date.now() });
        
        // Keep only last 5
        recentlyPlayed = recentlyPlayed.slice(0, 5);
        
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));

        // Track play count for "Most Played" stats
        incrementGamePlayCount(gameName);
    }
}

// ==================== GAME PLAY COUNTS ==================== //
function getGamePlayCounts() {
    try {
        return JSON.parse(localStorage.getItem('gamePlayCounts')) || {};
    } catch (e) {
        return {};
    }
}

function incrementGamePlayCount(gameName) {
    const counts = getGamePlayCounts();
    counts[gameName] = (counts[gameName] || 0) + 1;
    try {
        localStorage.setItem('gamePlayCounts', JSON.stringify(counts));
    } catch (e) {}
    return counts[gameName];
}

function renderRecentlyPlayed() {
    const container = document.getElementById('recentlyPlayedContainer');
    if (!container) return;
    
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    
    if (recentlyPlayed.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No games yet. Start playing and your progress will show up here!</p>';
        return;
    }
    
    container.innerHTML = recentlyPlayed.map((game) => {
        const favKey = game.path || game.name;
        return `
        <a href="${game.path}" class="recently-played-card" onclick="if(event.target.closest && event.target.closest('.favorite-btn')){event.preventDefault();return false;} trackGamePlay('${game.name}')">
            <button
                class="favorite-btn"
                data-fav-key="${favKey}"
                data-fav-title="${game.name}"
                data-fav-category="${game.category}"
                data-fav-url="${game.path}"
                aria-label="Favorite ${game.name}"
                aria-pressed="false"
                title="Toggle Favorite"
            >★</button>
            <div class="recently-played-emoji">${game.emoji}</div>
            <div class="recently-played-name">${game.name}</div>
        </a>
    `;
    }).join('');

    // Mark already-favorited recently played cards.
    if (typeof window.favoritesManager !== 'undefined') {
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            const key = btn.dataset.favKey;
            if (key && window.favoritesManager.isFavorite(key)) {
                btn.classList.add('favorited');
                btn.setAttribute('aria-pressed', 'true');
            }
        });
    }
}

// ==================== HOME PAGE ==================== //
function setupHomePage() {
    updateStats();
    renderRecentlyPlayed();

    // Only show the modal when we're on the actual marketing home (`home.html`).
    // (Avoid showing it on other entry points like `index.html`.)
    if ((window.location.pathname || '').split('/').pop() === 'home.html') {
        showWhatsNewModal();
    }
}




function updateStats() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

    if (document.getElementById('totalPlayers')) {
        document.getElementById('totalPlayers').textContent = '∞';
    }

    if (document.getElementById('messageCount')) {
        document.getElementById('messageCount').textContent = messages.length || '0';
    }

    if (document.getElementById('gameCount')) {
        document.getElementById('gameCount').textContent = gamesData.length || '0';
    }
}

function showWhatsNewModal(force) {
    const modal = document.getElementById('whatsNewModal');
    if (!modal) return;

    // Auto-show only happens once per session; manual requests still open the modal.
    if (!force && sessionStorage.getItem('whatsNewShown')) return;

    setTimeout(() => {
        modal.classList.add('show');
        sessionStorage.setItem('whatsNewShown', 'true');
    }, 800);
}

function closeWhatsNewModal() {
    const modal = document.getElementById('whatsNewModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ==================== GAMES PAGE ==================== //
function renderGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '';

    gamesData.forEach((game, index) => {
        const card = document.createElement('a');
        const favKey = game.path || game.name;
        card.href = game.path;
        card.className = 'game-card';
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`;
        card.onclick = (event) => {
            // Do not launch the game when the favorite star is clicked.
            if (event.target.closest && event.target.closest('.favorite-btn')) {
                event.preventDefault();
                return;
            }
            trackGamePlay(game.name);
        };

        card.innerHTML = `
            <button
                class="favorite-btn"
                data-fav-key="${favKey}"
                data-fav-title="${game.name}"
                data-fav-category="${game.category}"
                data-fav-url="${game.path}"
                aria-label="Favorite ${game.name}"
                aria-pressed="false"
                title="Toggle Favorite"
            >★</button>
            <div class="game-card-content">
                <span class="game-emoji">${game.emoji}</span>
                <span class="game-name">${game.name}</span>
                <span class="game-category">${game.category}</span>
            </div>
        `;

        gamesGrid.appendChild(card);
    });

    // Mark already-favorited games (stars filled gold)
    if (typeof window.favoritesManager !== 'undefined') {
        gamesGrid.querySelectorAll('.favorite-btn').forEach(btn => {
            const key = btn.dataset.favKey;
            if (key && window.favoritesManager.isFavorite(key)) {
                btn.classList.add('favorited');
                btn.setAttribute('aria-pressed', 'true');
            }
        });
    }
}

// ==================== HELPERS ==================== //
function addHoverSounds() {
    // intentionally left blank (sound feature removed)
}

