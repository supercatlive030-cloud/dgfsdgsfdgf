(function () {
  const STORAGE_KEY = 'diddysSiteActivity_v1';
  const TTL_MS = 90 * 1000;
  const ID_KEY = 'diddysSiteActivitySessionId';

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function readState() {
    return safeParse(localStorage.getItem(STORAGE_KEY), {});
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getSessionId() {
    let id = sessionStorage.getItem(ID_KEY);
    if (!id) {
      id = 'site-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
      sessionStorage.setItem(ID_KEY, id);
    }
    return id;
  }

  function pruneExpired(state, now) {
    const next = {};
    Object.keys(state).forEach((key) => {
      const entry = state[key];
      if (!entry || typeof entry.lastSeen !== 'number') return;
      if (now - entry.lastSeen <= TTL_MS) {
        next[key] = entry;
      }
    });
    return next;
  }

  function heartbeat() {
    try {
      const now = Date.now();
      const sessionId = getSessionId();
      const state = pruneExpired(readState(), now);
      state[sessionId] = {
        id: sessionId,
        page: (window.location.pathname || '').split('/').pop() || 'home.html',
        lastSeen: now,
        timestamp: new Date(now).toISOString()
      };
      writeState(state);
    } catch (err) {
      // Ignore storage/permission issues in private or restricted browsing.
    }
  }

  function getActivePlayers() {
    try {
      const now = Date.now();
      const state = pruneExpired(readState(), now);
      const count = Object.keys(state).length;
      if (count === 0) return 0;
      return count;
    } catch (err) {
      return 0;
    }
  }

  function cleanup() {
    try {
      const sessionId = getSessionId();
      const state = readState();
      delete state[sessionId];
      writeState(pruneExpired(state, Date.now()));
    } catch (err) {
      // Ignore cleanup issues.
    }
  }

  function startTracking() {
    heartbeat();
    const interval = window.setInterval(heartbeat, 15000);
    window.addEventListener('beforeunload', cleanup);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        heartbeat();
      }
    });
    window.__siteActivityInterval = interval;
  }

  window.siteActivity = {
    getActivePlayers,
    heartbeat,
    cleanup,
    startTracking
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTracking);
  } else {
    startTracking();
  }
})();
