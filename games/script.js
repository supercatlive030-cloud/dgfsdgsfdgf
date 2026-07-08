// ==================== GAME DATA ==================== //
window.gamesData = window.gamesData || [
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
];





// ==================== STATE MANAGEMENT ==================== //
let currentCategory = 'all';
let soundEnabled = true;
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

function getFnafAccessRestriction() {
    const recent = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    const lastPlayedName = recent[0]?.name || '';
    const hasPlayedOther = lastPlayedName && lastPlayedName !== 'FNAF 3';
    return hasPlayedOther;
}

// ==================== SOUND EFFECTS ==================== //
function playSound(type) {
    // Sound disabled per user request.
    return;

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
    if (!gamesGrid) return;

    const fnafRestricted = getFnafAccessRestriction();

    // Debugging: if something is wrong with filtering/data, we’ll surface it.
    gamesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary);">Loading games...</p>';

    const filtered = (Array.isArray(gamesData) ? gamesData : []).filter(game => {
        const matchesSearch = String(game?.name || '').toLowerCase().includes(String(filter || '').toLowerCase());
        const matchesCategory = currentCategory === 'all' || game.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    if (!Array.isArray(gamesData) || gamesData.length === 0) {
        gamesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-secondary);">No gamesData found (JS error?)</p>';
        return;
    }

    if (filtered.length === 0) {
        gamesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No games found (category: ' + String(currentCategory) + ', filter: ' + String(filter) + ')</p>';
        return;
    }

    gamesGrid.innerHTML = '';

    filtered.forEach((game, index) => {
        const card = document.createElement('a');
        const isFnaf = String(game.name || '').startsWith('FNAF');

        if (isFnaf && fnafRestricted && game.name !== 'FNAF 3') {
            card.href = '#';
            card.className = 'game-card game-card-locked';
            card.style.cursor = 'not-allowed';
            card.setAttribute('aria-disabled', 'true');
            card.onclick = (event) => {
                event.preventDefault();
                alert('Only FNAF 3 can be played right now because another game was played.');
            };
        } else {
            card.href = game.path;
            card.className = 'game-card';
            card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.05}s both`;
            card.onclick = () => {
                playSound('click');
                addToRecentlyPlayed(game);
            };
        }

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
        // Sound toggle disabled per user request
        return;

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
