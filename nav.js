// The menu on every page (styles.css, "Navigation"): the bar frosts once the
// homepage scrolls, the current page is marked, and on phones the toggle opens
// a full-height sheet that closes on a link, on Escape, or when the window
// grows past the phone layout.
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const toggle = nav.querySelector('.nav__toggle');
  const sheet = document.getElementById('navSheet');

  const solid = nav.classList.contains('nav--solid');
  const onScroll = () => nav.classList.toggle('nav--scrolled', solid || window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mark the current page; a guide also marks Guides.
  const clean = (p) => p.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  const here = clean(location.pathname);
  const guides = ['/home-inventory-checklist', '/silver-hallmarks', '/family-heirlooms'];
  nav.querySelectorAll('a[href^="/"]').forEach((a) => {
    const url = new URL(a.getAttribute('href'), location.origin);
    if (url.hash || a.classList.contains('nav__logo')) return;
    const p = clean(url.pathname);
    if (p !== '/' && (p === here || (p === '/guides' && guides.includes(here) && !a.closest('.nav__sheet-guides')))) {
      a.setAttribute('aria-current', 'page');
    }
  });

  if (!toggle || !sheet) return;
  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    sheet.hidden = !open;
    document.documentElement.classList.toggle('nav-locked', open);
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
})();
