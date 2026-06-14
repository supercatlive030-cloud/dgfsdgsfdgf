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
    { name: 'Betrayal.io', emoji: '🗡️', path: 'games/betrayal-io.html', category: 'action' },
];


document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    
    setupCursorTrail();
    
    if (currentPage === 'home.html') {
        setupHomePage();
    } else if (currentPage === 'games.html') {
        renderGames();
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
    const colors = ['#00d9ff', '#ff006e', '#b366ff', '#39ff14'];
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
    }
}

function renderRecentlyPlayed() {
    const container = document.getElementById('recentlyPlayedContainer');
    if (!container) return;
    
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    
    if (recentlyPlayed.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No games played yet. Start playing!</p>';
        return;
    }
    
    container.innerHTML = recentlyPlayed.map(game => `
        <a href="${game.path}" class="recently-played-card" onclick="trackGamePlay('${game.name}')">
            <div class="recently-played-emoji">${game.emoji}</div>
            <div class="recently-played-name">${game.name}</div>
        </a>
    `).join('');
}

// ==================== HOME PAGE ==================== //
function setupHomePage() {
    updateStats();
    renderRecentlyPlayed();
    showWhatsNewModal();
}

function updateStats() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

    if (document.getElementById('totalPlayers')) {
        document.getElementById('totalPlayers').textContent = '∞';
    }

    if (document.getElementById('messageCount')) {
        document.getElementById('messageCount').textContent = messages.length || '0';
    }
}

function showWhatsNewModal() {
    // Show modal only once per session
    if (sessionStorage.getItem('whatsNewShown')) return;
    
    const modal = document.getElementById('whatsNewModal');
    if (modal) {
        setTimeout(() => {
            modal.classList.add('show');
            sessionStorage.setItem('whatsNewShown', 'true');
        }, 800);
    }
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
        card.href = game.path;
        card.className = 'game-card';
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`;
        card.onclick = () => {
            trackGamePlay(game.name);
        };

        card.innerHTML = `
            <div class="game-card-content">
                <span class="game-emoji">${game.emoji}</span>
                <span class="game-name">${game.name}</span>
                <span class="game-category">${game.category}</span>
            </div>
        `;

        gamesGrid.appendChild(card);
    });
}

// ==================== HELPERS ==================== //
function addHoverSounds() {
    // intentionally left blank (sound feature removed)
}

