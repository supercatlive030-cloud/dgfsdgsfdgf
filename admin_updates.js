// Admin helpers for deleting user update submissions.
// This project stores user idea/update submissions in localStorage.

(function () {
  const UPDATE_STATUS_STORAGE_KEY = 'creatorUpdateStatus_v1';
  const IDEA_SUBMISSIONS_KEY = 'ideaSubmissions';

  function safeParseJSON(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setStatus(mode) {
    // mode: 'working' | 'applied'
    const current = safeParseJSON(localStorage.getItem(UPDATE_STATUS_STORAGE_KEY), {});
    localStorage.setItem(
      UPDATE_STATUS_STORAGE_KEY,
      JSON.stringify({
        ...current,
        message: mode,
        updatedAt: Date.now()
      })
    );
  }

  function loadIdeaSubmissions() {
    const raw = localStorage.getItem(IDEA_SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = safeParseJSON(raw, null);
    if (!parsed) return [];

    // Support both array and { submissions: [...] } shapes.
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.submissions)) return parsed.submissions;
    return [];
  }

  function normalizeSubmission(submission) {
    if (!submission || typeof submission !== 'object') {
      return {
        id: String(Math.random()).slice(2),
        createdAt: Date.now(),
        text: String(submission)
      };
    }

    // ideas.html saves: { title, text, link, timestamp }
    const id = submission.id != null ? String(submission.id) : (submission.submissionId != null ? String(submission.submissionId) : String(submission.timestamp || Math.random()).slice(0, 20));
    const createdAt = submission.createdAt || submission.timestamp || submission.created || Date.now();

    const name = submission.name || submission.username || submission.user || submission.from || submission.title || '';
    const text = submission.text || submission.message || submission.idea || submission.updateText || submission.update || submission.want || submission.request || '';

    const photoUrl = submission.photoUrl || submission.image || submission.imageUrl || submission.pic || submission.photo || '';
    const link = submission.link || submission.url || submission.adLink || submission.prototypeLink || '';

    // For ideas.html: title is the “what they want”, and text is the details.
    const title = submission.title || submission.ideaTitle || '';
    const normalizedText = (text && text.length > 0) ? text : (title ? title : '');

    return {
      ...submission,
      id,
      createdAt: typeof createdAt === 'number' ? createdAt : Date.parse(createdAt) || Date.now(),
      text: typeof normalizedText === 'string' ? normalizedText : JSON.stringify(normalizedText),
      photoUrl: typeof photoUrl === 'string' ? photoUrl : '',
      link: typeof link === 'string' ? link : '',
      name: typeof name === 'string' ? name : ''
    };
  }



  function deleteIdeaSubmissionsAll() {
    localStorage.removeItem(IDEA_SUBMISSIONS_KEY);
  }

  function deleteIdeaSubmissionById(id) {
    const submissions = loadIdeaSubmissions().map(normalizeSubmission);
    const filtered = submissions.filter(s => String(s.id) !== String(id));
    localStorage.setItem(IDEA_SUBMISSIONS_KEY, JSON.stringify(filtered));
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '<', '>': '>', '"': '"' }[c]));
  }

  function renderIdeaSubmissions() {
    const listEl = document.getElementById('adminIdeaSubmissionsList');
    const countEl = document.getElementById('adminIdeaSubmissionsCount');
    const emptyEl = document.getElementById('adminIdeaSubmissionsEmpty');

    if (!listEl || !countEl || !emptyEl) return;

    const submissions = loadIdeaSubmissions().map(normalizeSubmission);

    countEl.textContent = String(submissions.length);

    if (submissions.length === 0) {
      emptyEl.style.display = 'block';
      listEl.style.display = 'none';
      listEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display = 'grid';

    listEl.innerHTML = submissions
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map(s => {
        const safeName = s.name ? escapeHtml(s.name) : '';
        const safeText = s.text ? escapeHtml(s.text) : '';
        const safePhoto = s.photoUrl ? escapeHtml(s.photoUrl) : '';
        const safeLink = s.link ? escapeHtml(s.link) : '';

        return `
          <div class="admin-submission-card" data-submission-id="${escapeHtml(s.id)}">
            <div class="admin-submission-meta">
              <div class="admin-submission-date">${escapeHtml(formatDate(s.createdAt))}</div>
              ${safeName ? `<div class="admin-submission-name">From: ${safeName}</div>` : ''}
            </div>

            ${safePhoto ? `<div class="admin-submission-photo"><img src="${safePhoto}" alt="Upload" /></div>` : ''}

            ${safeLink ? `<div class="admin-submission-link"><a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeLink}</a></div>` : ''}

            ${safeText ? `<div class="admin-submission-text">${safeText}</div>` : ''}

            <div class="admin-submission-actions">
              <button type="button" class="back-btn admin-submission-delete" style="border-color: rgba(255, 107, 107, 0.35); color: #ff6b6b;" onclick="adminDeleteIdeaSubmission('${escapeHtml(s.id)}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Expose for onclick handlers
  window.adminDeleteUpdateSubmissions = function () {
    if (!confirm('Delete update submissions stored in this browser? (local only)')) return;
    deleteIdeaSubmissionsAll();
    // Optionally set banner back to "working" so users don’t think it was ignored.
    setStatus('working');
    const el = document.getElementById('adminUpdateDeleteResult');
    if (el) {
      el.textContent = 'Deleted local submissions. Banner set to working.';
      el.style.display = 'block';
    }
    renderIdeaSubmissions();
  };

  window.adminDeleteIdeaSubmission = function (id) {
    if (!confirm('Delete this single submission from this browser only?')) return;
    deleteIdeaSubmissionById(id);
    setStatus('working');
    const el = document.getElementById('adminUpdateDeleteResult');
    if (el) {
      el.textContent = 'Deleted 1 submission. Banner set to working.';
      el.style.display = 'block';
    }
    renderIdeaSubmissions();
  };

  // Load on admin page
  window.adminRenderIdeaSubmissions = function () {
    renderIdeaSubmissions();
  };

  // Auto-render if on the admin page.
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof window.adminRenderIdeaSubmissions === 'function') {
        window.adminRenderIdeaSubmissions();
      }
    } catch (e) {}
  });
})();





