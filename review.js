/* =========================================================
   MOVIE REVIEW PAGE – minimal script
   • Handles: logo → home
   • Light/dark persistence with localStorage
   ========================================================= */

/* ---------- 1. Logo click ---------- */
function goHome() {
  window.location.href = "../index.html";
}

/* ---------- 2. Theme restore + toggle ---------- */
const themeBtn = document.querySelector('.theme-toggle');
const stored   = localStorage.getItem('theme');   // "light" or "dark"

/* apply saved theme if any */
if (stored === 'light') document.body.classList.add('light');
updateIcon();

/* toggle handler */
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(
    'theme',
    document.body.classList.contains('light') ? 'light' : 'dark'
  );
  updateIcon();
});

/* change icon graphic */
function updateIcon() {
  themeBtn.name = document.body.classList.contains('light')
    ? 'moon-outline' : 'sunny-outline';
}