const SIZE_TO_CLASS = {
  sm: 'art-tile--sm', md: 'art-tile--md', lg: 'art-tile--lg',
  tall: 'art-tile--tall', wide: 'art-tile--wide'
};

/**
 * Paths in data files (e.g. assets/doodles/Trail.png) are stored relative to the
 * 2026/ edition folder. If we drop them straight into <img src>, the browser
 * resolves them against the *document* URL. That breaks when the page is served
 * as …/2026 with no trailing slash: assets/… incorrectly becomes …/assets/…
 * instead of …/2026/assets/… (common on GitHub Pages / static hosts).
 * Anchoring to …/2026/js/2026-common.js fixes that (with a fallback if
 * document.currentScript is unavailable).
 */
function getEditionScriptDir() {
  const fromSrc = (src) => {
    if (!src) return null;
    try {
      return new URL('.', src);
    } catch (_) {
      return null;
    }
  };
  const cur = document.currentScript && document.currentScript.src;
  const fromCurrent = fromSrc(cur);
  if (fromCurrent) return fromCurrent;
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].src;
    if (src && /\/js\/2026-common\.js(\?|#|$)/.test(src)) return fromSrc(src);
  }
  return null;
}

function resolveEditionAsset(rel) {
  if (rel == null || typeof rel !== 'string') return rel;
  const t = rel.trim();
  if (!t) return rel;
  if (/^(https?:|data:|blob:|\/\/)/i.test(t)) return rel;
  if (t.charAt(0) === '/') return rel;
  const normalized = t.replace(/^\.\//, '');
  const jsDir = getEditionScriptDir();
  if (!jsDir) return rel;
  try {
    return new URL('../' + normalized, jsDir).href;
  } catch (_) {
    return rel;
  }
}

/** Literature rows used on the edition site (index): exclude 3D-only interaction stubs (e.g. bookstore exit). */
function getLitPiecesForEditionPage() {
  if (typeof LIT_PIECES === 'undefined' || !Array.isArray(LIT_PIECES)) return null;
  const filtered = LIT_PIECES.filter((p) => !p.interaction);
  return filtered.length ? filtered : null;
}

// ───────────────────────────────────────────────────────
//  RENDER — LITERATURE
// ───────────────────────────────────────────────────────
(function renderLiterature() {
  const list = document.getElementById('litList');
  if (!list) return;
  const litPool = getLitPiecesForEditionPage();
  if (!litPool) return;
  const fallbackDoodles = [
    // simple ink-style placeholder doodles used when a piece has no `doodle` set
    `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 90 C 30 60, 60 40, 90 30"/><path d="M30 95 C 45 75, 70 60, 100 55"/><circle cx="92" cy="32" r="3"/><path d="M16 100 L 104 100"/></svg>`,
    `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M30 80 Q 60 30 90 80"/><path d="M40 80 Q 60 50 80 80"/><path d="M25 92 L 95 92"/><path d="M60 30 L 60 18"/><path d="M55 22 L 65 22"/></svg>`,
    `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="60" cy="55" r="22"/><path d="M60 33 L 60 25"/><path d="M82 55 L 90 55"/><path d="M38 55 L 30 55"/><path d="M60 77 L 60 90"/><path d="M44 39 L 38 33"/><path d="M76 39 L 82 33"/><path d="M44 71 L 38 77"/><path d="M76 71 L 82 77"/></svg>`,
    `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M25 95 Q 45 70 60 90 Q 75 70 95 95"/><path d="M30 95 L 90 95"/><path d="M55 60 Q 60 50 65 60"/><path d="M50 50 L 70 50"/></svg>`,
    `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 60 Q 60 20 100 60 Q 60 100 20 60 Z"/><circle cx="60" cy="60" r="8"/></svg>`
  ];

    list.innerHTML = litPool.map((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    const kind = p.kind && p.kind.toLowerCase() !== 'literature' ? p.kind : 'Piece';
    const role = p.author_role ? `<span class="lit-author-dot" aria-hidden="true"></span><span>${escapeHTML(p.author_role)}</span>` : '';
    let doodleHTML;
    if (p.doodle) {
      doodleHTML = `<div class="lit-doodle"><img src="${escapeAttr(resolveEditionAsset(p.doodle))}" alt="" loading="lazy" /></div>`;
    } else {
      doodleHTML = `<div class="lit-doodle lit-doodle--empty">${fallbackDoodles[i % fallbackDoodles.length]}</div>`;
    }
    return `
    <article class="lit-item reveal" role="button" tabindex="0" data-type="lit" data-index="${i}" aria-label="Read ${escapeAttr(p.title)} by ${escapeAttr(p.author)}">
      <div class="lit-index" aria-hidden="true">${num}</div>
      <div class="lit-body">
        <div class="lit-kind">${escapeHTML(kind)}</div>
        <h3 class="lit-title">${escapeHTML(p.title)}</h3>
        <div class="lit-author"><strong>${escapeHTML(p.author)}</strong>${role}</div>
        <p class="lit-excerpt">${escapeHTML(p.excerpt)}</p>
        <span class="lit-cta"><span class="lit-cta-line" aria-hidden="true"></span>Read piece</span>
      </div>
      ${doodleHTML}
      <div class="lit-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </article>`;
  }).join('');
})();

// ───────────────────────────────────────────────────────
//  RENDER — FILM
// ───────────────────────────────────────────────────────
(function renderFilm() {
  const grid = document.getElementById('filmGrid');
  if (!grid) return;
  if (typeof FILM_PIECES === 'undefined' || !Array.isArray(FILM_PIECES)) return;
  grid.innerHTML = FILM_PIECES.map((f) => {
    const posterAttr = f.poster ? ` poster="${escapeAttr(f.poster)}"` : '';
    const posterSource = f.poster
      ? `<source src="${escapeAttr(f.poster)}" type="video/webm" />`
      : '';
    const crewHtml = (f.crew || []).map(c => `
      <div class="film-panel-credit"><span class="film-panel-credit-role">${escapeHTML(c.role)}</span><strong>${escapeHTML(c.name)}</strong></div>
    `).join('');
    const creditsHtml = crewHtml.trim()
      ? `<div class="film-panel-credits">${crewHtml}</div>`
      : '';
    const descHtml = (f.desc && String(f.desc).trim())
      ? `<p class="film-panel-desc">${escapeHTML(f.desc)}</p>`
      : '';
    const metaBits = [ f.kicker, f.duration, f.genre ].filter((x) => x != null && String(x).trim() !== '');
    const metaHtml = metaBits.length
      ? `<p class="film-panel-meta">${metaBits.map((x) => escapeHTML(String(x))).join(' · ')}</p>`
      : '';
    return `
    <article class="film-panel reveal">
      <h2 class="film-panel-title">${escapeHTML(f.title)}</h2>
      <div class="video-wrapper">
        <video controls${posterAttr}>
          ${posterSource}
          <source src="${escapeAttr(f.video)}" type="video/mp4" />
        </video>
      </div>
      ${metaHtml}
      ${descHtml}
      ${creditsHtml}
    </article>`;
  }).join('');

  grid.querySelectorAll('video').forEach((video) => {
    video.addEventListener('error', () => {
      const wrap = video.closest('.video-wrapper');
      if (wrap && wrap.querySelector('.film-panel-error')) return;
      video.insertAdjacentHTML('afterend', '<p class="film-panel-error" role="alert">Video could not be loaded. Check the file path in FILM_PIECES.</p>');
    }, { once: true });
  });
})();

// ───────────────────────────────────────────────────────
//  RENDER — ART
// ───────────────────────────────────────────────────────
(function renderArt() {
  const grid = document.getElementById('artGrid');
  if (!grid) return;
  if (typeof ART_PIECES === 'undefined' || !Array.isArray(ART_PIECES)) return;
    grid.innerHTML = ART_PIECES.map((a, i) => `
    <a href="#art" class="art-tile ${SIZE_TO_CLASS[a.size] || 'art-tile--md'} reveal" role="button" tabindex="0" data-type="art" data-index="${i}" data-tone="${a.tone}" aria-label="View ${escapeAttr(a.title)} by ${escapeAttr(a.artist)}">
      ${a.src ? `<img class="art-tile-img" src="${escapeAttr(resolveEditionAsset(a.src))}" alt="${escapeAttr(a.title)} by ${escapeAttr(a.artist)}" loading="lazy" decoding="async">` : ''}
      <div class="art-tile-caption">
        <div class="art-tile-medium">${escapeHTML(a.medium)}</div>
        <div class="art-tile-title">${escapeHTML(a.title)}</div>
        <div class="art-tile-author">by ${escapeHTML(a.artist)}</div>
      </div>
    </a>
  `).join('');
})();

function escapeHTML(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(str) { return escapeHTML(str); }

// ───────────────────────────────────────────────────────
//  NAV / HAMBURGER
// ───────────────────────────────────────────────────────
(function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  function setOpen(open) {
    navLinks.classList.toggle('open', open);
    hamburger.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  hamburger.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setOpen(false);
      hamburger.focus();
    }
  });
})();

// ───────────────────────────────────────────────────────
//  REVEAL ANIMATIONS
// ───────────────────────────────────────────────────────
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || items.length === 0) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(el => io.observe(el));
})();

// ───────────────────────────────────────────────────────
//  LIGHTBOX
// ───────────────────────────────────────────────────────
(function () {
  const lightbox = document.getElementById('lightbox');
  const panel = document.getElementById('lightboxPanel');
  const content = document.getElementById('lightboxContent');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  if (!lightbox || !content) return;

  const POOLS = {
    lit:  getLitPiecesForEditionPage(),
    art:  typeof ART_PIECES  !== 'undefined' ? ART_PIECES  : null,
  };
  let currentType = null;
  let currentIndex = -1;
  let lastFocused = null;

  function open(type, index) {
    const pool = POOLS[type];
    if (!pool || !pool[index]) return;
    currentType = type;
    currentIndex = index;
    lastFocused = document.activeElement;

    render(type, pool[index]);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    // Focus close button
    window.requestAnimationFrame(() => closeBtn.focus());
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');

    const video = content.querySelector('video');
    if (video) { try { video.pause(); } catch (_) {} }
    content.innerHTML = '';
    currentType = null;
    currentIndex = -1;

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function step(delta) {
    if (currentType == null) return;
    const pool = POOLS[currentType];
    const len = pool.length;
    currentIndex = (currentIndex + delta + len) % len;
    render(currentType, pool[currentIndex]);
    panel.scrollTop = 0;
    const c = content.querySelector('.lightbox-content, [data-scroll]') || content;
    c.scrollTop = 0;
  }

  function render(type, piece) {
    content.innerHTML = '';
    let html = '';
    if (type === 'lit') html = renderLitModal(piece);
    else if (type === 'art') html = renderArtModal(piece);
    content.innerHTML = html;
  }

  /** Join soft line wraps in prose (e.g. column breaks); hyphen at line end joins without hyphen. */
  function reflowProseParagraph(raw) {
    const lines = String(raw || '').split(/\n/).map(l => l.trim()).filter(l => l.length);
    if (!lines.length) return '';
    let out = lines[0];
    for (let i = 1; i < lines.length; i++) {
      if (/-$/.test(out)) out = out.slice(0, -1) + lines[i];
      else out += ' ' + lines[i];
    }
    return out;
  }

  /** One poem stanza: newlines → <br />; lines starting with tab → indented line. */
  function formatPoemStanza(block) {
    const lines = String(block || '').split('\n');
    const parts = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tabm = /^(\t+)(.*)$/.exec(line);
      if (tabm && tabm[1].length) {
        parts.push(`<span class="lb-lit-poemline lb-lit-poemline--indented" style="--tab-depth:${tabm[1].length}">${escapeHTML(tabm[2])}</span>`);
        continue;
      }
      if (!line.trim()) {
        parts.push('<br />');
        continue;
      }
      parts.push(escapeHTML(line));
    }
    return parts.join('<br />');
  }

  /** Trim a body block without stripping a leading tab (used for inner-dialogue paragraphs, e.g. Gabriel’s Sapphire). */
  function trimLitBodyBlock(b) {
    return String(b || '').replace(/^\n+/, '').replace(/\s+$/, '');
  }

  /**
   * Body markup (in LIT_PIECES[].body):
   * - Blank line (\n\n+) = new paragraph (prose) or new stanza (poem).
   * - Prose: single newlines inside a block are reflowed into one paragraph (soft hyphen at line end joins words).
   * - Poem: single newline = line break within stanza.
   * - Tab at start of a poem line = indented line.
   * - Prose block starting with tab = inner-dialogue / inset (leading tabs stripped before reflow); only used in Gabriel’s Sapphire.
   */
  function renderLitBodyHtml(p) {
    const isPoem = p.format === 'poem';
    const blocks = String(p.body || '').split(/\n\n+/).map(trimLitBodyBlock).filter(b => b.length);
    return blocks.map(block => {
      if (isPoem) {
        return `<p class="lb-lit-stanza">${formatPoemStanza(block)}</p>`;
      }
      let cls = 'lb-lit-prose';
      let text = block;
      if (/^\t+/.test(text)) {
        cls += ' lb-lit-prose--indented-block';
        text = text.replace(/^\t+/, '');
      }
      const flowed = reflowProseParagraph(text);
      return `<p class="${cls}">${escapeHTML(flowed)}</p>`;
    }).join('');
  }

  function renderLitModal(p) {
    const isPoem = p.format === 'poem';
    const bodyHtml = renderLitBodyHtml(p);
    const altText = `Illustration for ${p.title}`;
    const doodleHtml = p.doodle
      ? `<div class="lb-lit-head-doodle" aria-hidden="true">
           <img src="${escapeAttr(resolveEditionAsset(p.doodle))}" alt="${escapeAttr(altText)}" loading="lazy" />
         </div>`
      : '';

    return `
      <div class="lb-lit">
        <header class="lb-lit-head">
          <div class="lb-lit-head-text">
            <h2 class="lb-lit-title" id="lightboxTitle">${escapeHTML(p.title)}</h2>
            <div class="lb-lit-byline">By <strong>${escapeHTML(p.author)}</strong></div>
          </div>
          ${doodleHtml}
        </header>
        <div class="lb-lit-body ${isPoem ? 'lb-lit-body--poem' : ''}">${bodyHtml}</div>
        <div class="lb-lit-end">◆ ◆ ◆</div>
      </div>
    `;
  }

  function renderArtModal(a) {
    return `
      <div class="lb-art">
        <div class="lb-art-visual" data-tone="${escapeAttr(a.tone)}">
          ${a.src ? `<img class="lb-art-img" src="${escapeAttr(resolveEditionAsset(a.src))}" alt="${escapeAttr(a.title)} by ${escapeAttr(a.artist)}">` : ''}
          <div class="lb-art-visual-badge">${escapeHTML(a.year || '2026')}</div>
        </div>
        <div class="lb-art-body">
          <div class="lb-art-medium">${escapeHTML(a.medium)}</div>
          <h2 class="lb-art-title" id="lightboxTitle">${escapeHTML(a.title)}</h2>
          <div class="lb-art-artist">by ${escapeHTML(a.artist)}</div>
          <p class="lb-art-statement">${escapeHTML(a.statement)}</p>
        </div>
      </div>
    `;
  }

  // Event delegation for opening
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-type][data-index]');
    if (!el) return;
    e.preventDefault();
    const type = el.getAttribute('data-type');
    const index = parseInt(el.getAttribute('data-index'), 10);
    if (Number.isFinite(index)) open(type, index);
  });

  document.addEventListener('keydown', (e) => {
    // Open via Enter/Space when a trigger has focus
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement) {
      const el = document.activeElement.closest('[data-type][data-index]');
      if (el && !lightbox.classList.contains('is-open')) {
        e.preventDefault();
        const type = el.getAttribute('data-type');
        const index = parseInt(el.getAttribute('data-index'), 10);
        if (Number.isFinite(index)) open(type, index);
        return;
      }
    }

    // When open: keyboard controls
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  // Click outside the panel closes
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
})();
