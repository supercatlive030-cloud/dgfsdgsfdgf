// When a user is authenticated (logged into the main site), this script will:
// - show an “Admin” button/section if their status indicates they are admin
// - otherwise keep the regular site behavior.
//
// Admin rule (simple): if localStorage.admin === 'true', treat user as admin.
// Admin account can be toggled from the browser console OR via a future admin-login.

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const isAuthed = localStorage.getItem('authenticated') === 'true';
    if (!isAuthed) return;

    const isAdmin = localStorage.getItem('admin') === 'true';

    const navControls = document.querySelector('.nav-controls');
    if (!navControls) return;

    // If already present, do nothing.
    if (document.getElementById('adminPortalBtn')) return;

    // If not admin, we still keep the normal admin link hidden.
    // If admin, add a button that goes to admin.html.
    if (!isAdmin) return;

    const a = document.createElement('a');
    a.id = 'adminPortalBtn';
    a.href = 'admin.html';
    a.className = 'nav-link';
    a.textContent = '🔧 Admin';
    navControls.appendChild(a);
  });
})();

