(function () {
  function getAdState() {
    const enabled = localStorage.getItem('sponsorAdEnabled') === 'true';
    const image = (localStorage.getItem('sponsorAdImage') || '').trim();
    const link = (localStorage.getItem('sponsorAdLink') || '').trim();
    const text = (localStorage.getItem('sponsorAdText') || '').trim();

    if (!enabled) return null;
    if (!image && !text) return null;

    return { enabled, image, link, text };
  }

  function ensureStyles() {
    if (document.getElementById('sponsorAdStyles')) return;
    const style = document.createElement('style');
    style.id = 'sponsorAdStyles';
    style.textContent = `
      .sponsor-ad-corner {
        position: fixed;
        top: 85px;
        right: 16px;
        z-index: 200000;
        max-width: 220px;
        pointer-events: auto;
      }
      .sponsor-ad-box {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border-radius: 12px;
        background: rgba(10, 14, 39, 0.85);
        border: 1px solid rgba(0, 217, 255, 0.25);
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      }
      .sponsor-ad-box img {
        max-width: 200px;
        max-height: 90px;
        display: block;
      }
      .sponsor-ad-text {
        color: #fff;
        font-weight: 800;
        font-size: 14px;
        text-align: center;
        line-height: 1.2;
      }
    `;
    document.head.appendChild(style);
  }

  function renderAd() {
    const state = getAdState();
    const existing = document.getElementById('sponsorAdCorner');
    if (existing) existing.remove();

    if (!state) return;

    ensureStyles();

    const corner = document.createElement('div');
    corner.id = 'sponsorAdCorner';
    corner.className = 'sponsor-ad-corner';

    const box = document.createElement('div');
    box.className = 'sponsor-ad-box';

    let inner;
    if (state.image) {
      inner = document.createElement('img');
      inner.src = state.image;
      inner.alt = 'Sponsor Ad';
    } else {
      inner = document.createElement('div');
      inner.className = 'sponsor-ad-text';
      inner.textContent = state.text || '';
    }

    if (state.link) {
      const a = document.createElement('a');
      a.href = state.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.appendChild(inner);
      box.appendChild(a);
    } else {
      box.appendChild(inner);
    }

    corner.appendChild(box);
    document.body.appendChild(corner);
  }

  document.addEventListener('DOMContentLoaded', renderAd);
})();

