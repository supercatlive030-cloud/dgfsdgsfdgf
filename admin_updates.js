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

  async function loadSharedIdeaSubmissions() {
    const response = await fetch('/api/ideas', { cache: 'no-store' });
    if (!response.ok) throw new Error('Shared ideas are unavailable');
    const ideas = await response.json();
    if (!Array.isArray(ideas)) throw new Error('Invalid shared ideas response');
    return ideas;
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



  async function deleteIdeaSubmissionsAll() {
    localStorage.removeItem(IDEA_SUBMISSIONS_KEY);
    const response = await fetch('/api/ideas', { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not delete shared ideas');
  }

  async function deleteIdeaSubmissionById(id) {
    const submissions = loadIdeaSubmissions().map(normalizeSubmission);
    const filtered = submissions.filter(s => String(s.id) !== String(id));
    localStorage.setItem(IDEA_SUBMISSIONS_KEY, JSON.stringify(filtered));
    const response = await fetch(`/api/ideas?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not delete shared idea');
  }

  async function emailIdeaSubmissions() {
    let submissions;
    try {
      submissions = (await loadSharedIdeaSubmissions()).map(normalizeSubmission);
    } catch (error) {
      submissions = loadIdeaSubmissions().map(normalizeSubmission);
    }
    const resultEl = document.getElementById('adminUpdateDeleteResult');

    if (submissions.length === 0) {
      if (resultEl) {
        resultEl.textContent = 'There are no ideas to email yet.';
        resultEl.style.display = 'block';
      }
      return;
    }

    const savedEmail = localStorage.getItem('ideaEmailRecipient') || '';
    const recipient = window.prompt('What email address should receive the ideas?', savedEmail);
    if (recipient === null) return;

    const email = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.alert('Please enter a valid email address.');
      return;
    }

    localStorage.setItem('ideaEmailRecipient', email);
    const body = submissions
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((submission, index) => {
        const date = formatDate(submission.createdAt);
        const title = submission.title || 'Untitled';
        const link = submission.link ? `\nLink: ${submission.link}` : '';
        return `${index + 1}. ${title}\nSubmitted: ${date}\n${submission.text}${link}`;
      })
      .join('\n\n--------------------\n\n');

    const subject = `Ideas for diddys playhouse (${submissions.length})`;
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  async function renderIdeaSubmissions() {
    const listEl = document.getElementById('adminIdeaSubmissionsList');
    const countEl = document.getElementById('adminIdeaSubmissionsCount');
    const emptyEl = document.getElementById('adminIdeaSubmissionsEmpty');

    if (!listEl || !countEl || !emptyEl) return;

    let submissions;
    try {
      submissions = (await loadSharedIdeaSubmissions()).map(normalizeSubmission);
    } catch (error) {
      submissions = loadIdeaSubmissions().map(normalizeSubmission);
    }

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
  window.adminDeleteUpdateSubmissions = async function () {
    if (!confirm('Delete all shared idea submissions?')) return;
    try {
      await deleteIdeaSubmissionsAll();
    } catch (error) {
      const el = document.getElementById('adminUpdateDeleteResult');
      if (el) {
        el.textContent = 'Could not delete shared ideas. Is the server running?';
        el.style.display = 'block';
      }
      return;
    }
    // Optionally set banner back to "working" so users don’t think it was ignored.
    setStatus('working');
    const el = document.getElementById('adminUpdateDeleteResult');
    if (el) {
      el.textContent = 'Deleted shared submissions. Banner set to working.';
      el.style.display = 'block';
    }
    renderIdeaSubmissions();
  };

  window.adminDeleteIdeaSubmission = async function (id) {
    if (!confirm('Delete this shared idea submission?')) return;
    try {
      await deleteIdeaSubmissionById(id);
    } catch (error) {
      const el = document.getElementById('adminUpdateDeleteResult');
      if (el) {
        el.textContent = 'Could not delete the shared idea. Is the server running?';
        el.style.display = 'block';
      }
      return;
    }
    setStatus('working');
    const el = document.getElementById('adminUpdateDeleteResult');
    if (el) {
      el.textContent = 'Deleted 1 submission. Banner set to working.';
      el.style.display = 'block';
    }
    renderIdeaSubmissions();
  };

  window.adminEmailIdeaSubmissions = emailIdeaSubmissions;

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





