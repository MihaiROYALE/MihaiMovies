/* =========================================================
   0. CLEAR SCROLL IF FULL RELOAD (keep on back/forward)
   ========================================================= */
if ('performance' in window) {
  const nav =
    performance.getEntriesByType('navigation')[0] || performance.navigation;
  if (nav && (nav.type === 'reload' || nav.type === 1)) {
    sessionStorage.removeItem('scrollState');
  }
}

/* =========================================================
   1. NORMALISE FOR SEARCH
   ========================================================= */
const normalise = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

/* =========================================================
   2. THEME TOGGLE
   ========================================================= */
const themeToggle = document.querySelector('.theme-toggle');
if (localStorage.getItem('theme') === 'light')
  document.body.classList.add('light');
updateThemeIcon();

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(
    'theme',
    document.body.classList.contains('light') ? 'light' : 'dark'
  );
  updateThemeIcon();
});
function updateThemeIcon() {
  themeToggle.name = document.body.classList.contains('light')
    ? 'moon-outline'
    : 'sunny-outline';
}

/* =========================================================
   3. BUILD MOVIE INDEX
   ========================================================= */
const movies = [...document.querySelectorAll('.movie-card')].map(card => {
  const img = card.querySelector('.poster');
  const link = card.querySelector('a');
  return {
    title: img.alt.trim(),
    key: normalise(img.alt),
    url: link.href,
    poster: img.src,
    rating: parseInt(card.dataset.rating, 10) || 0
  };
});

/* =========================================================
   4. GLASS SEARCH OVERLAY
   ========================================================= */
const searchIcon = document.querySelector('.search-icon');

/* build overlay once */
const overlay = document.createElement('div');
overlay.className = 'search-overlay';

const closeBtn = document.createElement('ion-icon');
closeBtn.className = 'overlay-close';
closeBtn.name = 'close-outline';

const left = document.createElement('div');
left.className = 'search-left';

const right = document.createElement('div');
right.className = 'search-right'; // ← grid wrapper

const input = document.createElement('input');
input.id = 'searchInput';
input.type = 'text';
input.placeholder = 'Search…';

const suggest = document.createElement('ul');
suggest.id = 'suggestList';

left.appendChild(input);
left.appendChild(suggest);
overlay.appendChild(closeBtn);
overlay.appendChild(left);
overlay.appendChild(right);
document.body.appendChild(overlay);

/* open / close */
function openSearch() {
  if (document.body.classList.contains('searching')) return;
  document.body.classList.add('searching');
  input.value = '';
  input.focus();
  suggest.innerHTML = '';
  right.innerHTML = '';
}
function closeSearch() {
  document.body.classList.remove('searching');
}

searchIcon.addEventListener('click', openSearch);
closeBtn.addEventListener('click', closeSearch);
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeSearch();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
});

/* ---------------------------------------------------------
   Debounced live filter (80 ms)
   --------------------------------------------------------- */
let debounceTimer;
input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runFilter, 80);
});

function runFilter() {
  const q = normalise(input.value.trim());
  suggest.innerHTML = '';
  right.innerHTML = '';
  if (!q) return;

  /* suggestions (max 10) */
  movies
    .filter(m => m.key.includes(q))
    .slice(0, 10)
    .forEach(m => {
      const li = document.createElement('li');
      li.textContent = m.title;
      li.addEventListener('click', () => (window.location.href = m.url));
      suggest.appendChild(li);
    });

  /* poster grid (max 60) */
  movies
    .filter(m => m.key.includes(q))
    .slice(0, 60)
    .forEach(renderCard);
}

function renderCard(m) {
  const a = document.createElement('a');
  a.href = m.url;
  a.className = 'search-card';

  const img = document.createElement('img');
  img.src = m.poster;
  img.alt = m.title;
  a.appendChild(img);

  if (m.rating && !a.querySelector('.movie-rating')) {
    const stars =
      '★'.repeat(m.rating) + '☆'.repeat(5 - m.rating);
    const div = document.createElement('div');
    div.className = 'movie-rating';
    div.textContent = stars;
    a.appendChild(div);
  }
  right.appendChild(a);
}

/* =========================================================
   5. STAR RATING FOR MAIN GRID
   ========================================================= */
document.querySelectorAll('.movie-card').forEach(card => {
  const r = parseInt(card.dataset.rating, 10);
  if (!r || r < 1 || r > 5) return;
  const stars = '★'.repeat(r) + '☆'.repeat(5 - r);
  const d = document.createElement('div');
  d.className = 'movie-rating';
  d.textContent = stars;
  card.appendChild(d);
});

/* =========================================================
   6. LOGO → SCROLL TOP
   ========================================================= */
const logo = document.querySelector('.sidebar img.logo');
if (logo)
  logo.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );

/* =========================================================
   7. SAVE + RESTORE SCROLL
   ========================================================= */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* save */
document.querySelectorAll('.movie-card a').forEach(link => {
  link.addEventListener('click', () => {
    const row = link.closest('.movie-scroll');
    sessionStorage.setItem(
      'scrollState',
      JSON.stringify({
        y: window.scrollY,
        row: row?.dataset.rowid || row?.dataset.year || '',
        x: row?.scrollLeft || 0
      })
    );
  });
});

/* tag rows once */
document.querySelectorAll('.year-row .movie-scroll').forEach((row, i) => {
  if (!row.dataset.rowid) {
    const yr = row.previousElementSibling?.textContent.trim();
    row.dataset.rowid = yr || `row-${i}`;
    row.dataset.year = yr || '';
  }
});

/* restore */
function restore() {
  const raw = sessionStorage.getItem('scrollState');
  if (!raw) return;
  const { y, row, x } = JSON.parse(raw);

  window.scrollTo(0, y || 0);

  /* two frames to ensure layout is ready */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const tgt = document.querySelector(`[data-rowid="${row}"]`);
      if (tgt) tgt.scrollLeft = x || 0;
    })
  );
}
window.addEventListener('pageshow', e => {
  if (e.persisted) restore();
});
window.addEventListener('DOMContentLoaded', restore);

/* =========================================================
   8. ARCHIVE TOGGLE  (Movies ↔ Series)
   ========================================================= */
function toggleArchive () {
  const body   = document.body;
  const title  = document.querySelector('h1');
  const toggle = document.querySelector('.archive-toggle');

  const toSeries = !body.classList.contains('series-mode');
  body.classList.toggle('series-mode', toSeries);

  title.textContent = toSeries
    ? "Mihai's Series Archive"
    : "Mihai's Movie Archive";

  /* change icon & tooltip */
  if (toSeries) {
    toggle.name  = 'film-outline';      // icon now says “Movies”
    toggle.title = 'Switch to movies';
  } else {
    toggle.name  = 'tv-outline';        // icon now says “Series”
    toggle.title = 'Switch to series';
  }

  /* optional: close search overlay if open */
  if (body.classList.contains('searching')) closeSearch();
}