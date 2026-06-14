// ==================== GAME DATA ==================== //
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


// ==================== STATE MANAGEMENT ==================== //
let currentCategory = 'all';
let soundEnabled = true;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

// ==================== SOUND EFFECTS ==================== //
function playSound(type) {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'click') {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'hover') {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }
}

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    renderGames();
    setupSearchListener();
    setupCategoryButtons();
    setupSoundToggle();
    setupCarouselClickListeners();
    displayRecentlyPlayed();
});

// ==================== RENDER GAMES ==================== //
function renderGames(filter = '') {
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = '';
    
    const filtered = gamesData.filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = currentCategory === 'all' || game.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    
    if (filtered.length === 0) {
        gamesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No games found</p>';
        return;
    }
    
    filtered.forEach((game, index) => {
        const card = document.createElement('a');
        card.href = game.path;
        card.className = 'game-card';
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`;
        card.onclick = () => {
            playSound('click');
            addToRecentlyPlayed(game);
        };
        
        const isFavorited = favorites.some(g => g.name === game.name);
        
        card.innerHTML = `
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(event, '${game.name}')" title="Add to favorites">
                ${isFavorited ? '❤️' : '🤍'}
            </button>
            <div class="game-card-content">
                <span class="game-emoji">${game.emoji}</span>
                <span class="game-name">${game.name}</span>
                <span class="game-category">${game.category}</span>
            </div>
        `;
        
        gamesGrid.appendChild(card);
    });
}

// ==================== SEARCH FUNCTIONALITY ==================== //
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        playSound('hover');
        renderGames(e.target.value);
    });
}

// ==================== CATEGORY FILTERING ==================== //
function setupCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderGames(document.getElementById('searchInput')?.value || '');
        });
    });
}

// ==================== SOUND TOGGLE ==================== //
function setupSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    if (!soundToggle) return;
    
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        localStorage.setItem('soundEnabled', soundEnabled);
    });
    
    // Load saved preference
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) {
        soundEnabled = JSON.parse(saved);
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    }
}

// ==================== FAVORITES ==================== //
function toggleFavorite(event, gameName) {
    event.preventDefault();
    event.stopPropagation();
    
    playSound('click');
    
    const game = gamesData.find(g => g.name === gameName);
    const index = favorites.findIndex(g => g.name === gameName);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(game);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderGames(document.getElementById('searchInput')?.value || '');
}

// ==================== RECENTLY PLAYED ==================== //
function addToRecentlyPlayed(game) {
    const index = recentlyPlayed.findIndex(g => g.name === game.name);
    if (index > -1) {
        recentlyPlayed.splice(index, 1);
    }
    recentlyPlayed.unshift(game);
    recentlyPlayed = recentlyPlayed.slice(0, 10); // Keep only last 10
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}

function displayRecentlyPlayed() {
    const recentSection = document.getElementById('recentSection');
    const recentGrid = document.getElementById('recentGames');
    
    if (!recentSection || recentlyPlayed.length === 0) return;
    
    recentSection.style.display = 'block';
    recentGrid.innerHTML = '';
    
    recentlyPlayed.forEach((game, index) => {
        const card = document.createElement('a');
        card.href = game.path;
        card.className = 'game-card';
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`;
        card.onclick = () => {
            playSound('click');
            addToRecentlyPlayed(game);
        };
        
        card.innerHTML = `
            <div class="game-card-content">
                <span class="game-emoji">${game.emoji}</span>
                <span class="game-name">${game.name}</span>
                <span class="game-category">${game.category}</span>
            </div>
        `;
        
        recentGrid.appendChild(card);
    });
}

// ==================== CAROUSEL ==================== //
function setupCarouselClickListeners() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    carouselItems.forEach(item => {
        item.addEventListener('click', () => {
            playSound('click');
            const gameName = item.dataset.game;
            const game = gamesData.find(g => g.name === gameName);
            if (game) {
                addToRecentlyPlayed(game);
                window.location.href = game.path;
            }
        });
    });
}

// ==================== HOVER SOUND ==================== //
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game-card, .carousel-card, .category-btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
            playSound('hover');
        });
    });
});
