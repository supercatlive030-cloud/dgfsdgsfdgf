// ==================== AUTH SYSTEM ==================== //

// Check if user is authenticated on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';
    const isGamePage = window.location.pathname.includes('/games/') && currentPage !== 'games.html';


    // Allow admin.html to be accessed (admin.js will handle its own password).


    // If on protected pages but not authenticated, redirect to index.
    // Allow returning from game pages (some games redirect users to home).
    const isHomeOrChatOrGames = ['home.html', 'chat.html', 'games.html'].includes(currentPage);
    if (isHomeOrChatOrGames && !isAuthenticated) {
        window.location.href = 'home.html';
        return;
    }


    // If on game pages but not authenticated, redirect to index
    if (isGamePage && !isAuthenticated) {
        window.location.href = 'home.html';
        return;
    }

    // If user is authenticated and tries to access any non-game protected page, allow.
    // (Game-to-home navigation is handled inside game pages; this script stays focused on auth.)


    // If on login page but already authenticated, redirect to home
    if (currentPage === 'login.html' && isAuthenticated) {
        window.location.href = 'home.html';
        return;
    }
});

// ==================== LOGOUT ==================== //
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authenticated');
        window.location.href = 'home.html';
    }
}


