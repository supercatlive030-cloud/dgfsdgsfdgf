// ==================== THEME SYSTEM ==================== //

const themes = {
    neon: {
        name: '🎆 Neon',
        colors: {
            primary: '#00d9ff',
            secondary: '#ff006e',
            green: '#39ff14',
            purple: '#b366ff'
        }
    },
    cyberpunk: {
        name: '💜 Cyberpunk',
        colors: {
            primary: '#ff00ff',
            secondary: '#00ffff',
            green: '#ffff00',
            purple: '#ff1493'
        }
    },
    pastel: {
        name: '🌸 Pastel',
        colors: {
            primary: '#ff91e8',
            secondary: '#a0e7e5',
            green: '#ffd4a3',
            purple: '#c9a0dc'
        }
    },
    ocean: {
        name: '🌊 Ocean',
        colors: {
            primary: '#00b4d8',
            secondary: '#0077b6',
            green: '#00d9ff',
            purple: '#4361ee'
        }
    },
    forest: {
        name: '🌲 Forest',
        colors: {
            primary: '#06a77d',
            secondary: '#2d6a4f',
            green: '#52b788',
            purple: '#95d5b2'
        }
    },
    sunset: {
        name: '🌅 Sunset',
        colors: {
            primary: '#ff6b35',
            secondary: '#f7931e',
            green: '#fdb833',
            purple: '#c1272d'
        }
    },
    matrix: {
        name: '💻 Matrix',
        colors: {
            primary: '#00ff00',
            secondary: '#00cc00',
            green: '#00ff00',
            purple: '#00aa00'
        }
    },
    "gay-pride": {
        name: '🏳️‍🌈 Gay Pride',
        colors: {
            // Rainbow-inspired palette (mapped onto existing theme variables)
            primary: '#FF0000',   // red
            secondary: '#FF7A00', // orange
            green: '#00D95F',     // green
            purple: '#6A00FF'     // blue/violet
        }
    },
    dark: {
        name: '🌑 Dark',
        colors: {
            primary: '#00d9ff',
            secondary: '#ff006e',
            green: '#39ff14',
            purple: '#b366ff'
        }
    }
};


document.addEventListener('DOMContentLoaded', () => {
    initThemeSystem();
});

function initThemeSystem() {
    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme') || 'neon';
    applyTheme(savedTheme);
    
    // Load custom colors if exist
    const customColors = localStorage.getItem('customThemeColors');
    if (customColors) {
        const colors = JSON.parse(customColors);
        applyCustomColors(colors);
    }
    
    // Setup theme dropdown
    setupThemeDropdown();
    setupColorCustomizer();
}

function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName);
    
    // Apply colors
    const { colors } = theme;
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--accent-green', colors.green);
    document.documentElement.style.setProperty('--accent-purple', colors.purple);
    
    // Update active button in menu
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === themeName) {
            btn.classList.add('active');
        }
    });
}

function applyCustomColors(colors) {
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--accent-green', colors.green);
    document.documentElement.style.setProperty('--accent-purple', colors.purple);
    
    // Mark custom as active
    document.querySelectorAll('.theme-option').forEach(btn => {
        if (btn.dataset.theme === 'custom') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setupThemeDropdown() {
    const themeBtn = document.getElementById('themeBtn');
    const themeMenu = document.getElementById('themeMenu');
    
    if (!themeBtn || !themeMenu) return;
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-dropdown')) {
            themeMenu.classList.remove('active');
        }
    });
    
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeMenu.classList.toggle('active');
    });
    
    // Populate theme options
    let menuHTML = '';
    Object.entries(themes).forEach(([key, theme]) => {
        menuHTML += `<button class="theme-option" data-theme="${key}" onclick="applyTheme('${key}')">${theme.name}</button>`;
    });
    
    menuHTML += '<div class="theme-divider"></div>';
    menuHTML += '<button class="theme-option" data-theme="custom" onclick="openColorCustomizer()">🎨 Custom</button>';
    
    themeMenu.innerHTML = menuHTML;
    
    // Mark current theme as active
    const savedTheme = localStorage.getItem('selectedTheme') || 'neon';
    document.querySelectorAll('.theme-option').forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
}

function setupColorCustomizer() {
    const modal = document.getElementById('customizerModal');
    const closeBtn = document.querySelector('.customizer-close');
    const saveBtn = document.querySelector('.customizer-save');
    const resetBtn = document.querySelector('.customizer-reset');
    
    if (!modal) return;
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Load current colors into inputs
    loadCustomizerValues();
    
    // Save custom theme
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const colors = {
                primary: document.getElementById('primaryColorInput').value,
                secondary: document.getElementById('secondaryColorInput').value,
                green: document.getElementById('greenColorInput').value,
                purple: document.getElementById('purpleColorInput').value
            };
            
            localStorage.setItem('customThemeColors', JSON.stringify(colors));
            localStorage.setItem('selectedTheme', 'custom');
            applyCustomColors(colors);
            modal.classList.remove('show');
        });
    }
    
    // Reset to default
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('customThemeColors');
            localStorage.removeItem('selectedTheme');
            applyTheme('neon');
            modal.classList.remove('show');
        });
    }
    
    // Update color displays in real-time
    document.querySelectorAll('[data-color-input]').forEach(input => {
        input.addEventListener('input', (e) => {
            const displayId = e.target.dataset.colorInput;
            document.getElementById(displayId).textContent = e.target.value;
            
            // Apply preview in real-time
            const colorMap = {
                primary: '--primary-color',
                secondary: '--secondary-color',
                green: '--accent-green',
                purple: '--accent-purple'
            };
            
            const cssVar = colorMap[displayId.replace('Display', '')];
            if (cssVar) {
                document.documentElement.style.setProperty(cssVar, e.target.value);
            }
        });
    });
}

function loadCustomizerValues() {
    const customColors = localStorage.getItem('customThemeColors');
    const colors = customColors ? JSON.parse(customColors) : themes.neon.colors;
    
    const inputs = {
        primaryColorInput: colors.primary,
        secondaryColorInput: colors.secondary,
        greenColorInput: colors.green,
        purpleColorInput: colors.purple
    };
    
    Object.entries(inputs).forEach(([inputId, value]) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = value;
            const displayId = inputId.replace('Input', 'Display');
            const display = document.getElementById(displayId);
            if (display) {
                display.textContent = value;
            }
        }
    });
}

function openColorCustomizer() {
    const modal = document.getElementById('customizerModal');
    if (modal) {
        modal.classList.add('show');
        loadCustomizerValues();
    }
    document.getElementById('themeMenu').classList.remove('active');
}
