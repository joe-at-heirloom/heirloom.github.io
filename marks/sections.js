// Sections of the marks reference: the sidebar's search and its drawer on
// phones, the "on this page" list that follows the reader, and the reign rail.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const TRAD = { 斋: '齋', 宫: '宮', 静: '靜', 远: '遠', 体: '體', 储: '儲', 养: '養', 宁: '寧', 颐: '頤', 书: '書', 华: '華', 宝: '寶', 长: '長', 寿: '壽', 庆: '慶', 乐: '樂', 制: '製', 楼: '樓', 园: '園', 阁: '閣', 轩: '軒', 万: '萬', 历: '曆', 启: '啟', 祯: '禎', 顺: '順', 丰: '豐', 绪: '緒', 统: '統', 宪: '憲' };
  const key = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9㐀-鿿]/g, '').replace(/./g, (c) => TRAD[c] || c);

  function sidebar() {
    const side = $('#ref-side'); if (!side) return;
    const input = $('.side-search input', side), tree = $('.side-tree', side), empty = $('.side-empty', side);
    if (input && tree) {
      const items = $$('.side-list li', tree);
      const groups = $$('.side-group', tree);
      const openState = new Map(groups.map((g) => [g, g.open]));
      input.addEventListener('input', () => {
        const k = key(input.value);
        tree.classList.toggle('is-filtering', !!k);
        let shown = 0;
        for (const li of items) {
          const ok = !k || key(li.dataset.keys || li.textContent).includes(k);
          li.hidden = !ok; if (ok) shown += 1;
        }
        for (const sub of $$('.side-sub', tree)) {
          const list = sub.nextElementSibling;
          sub.hidden = !!k && !!list && !$$('li', list).some((li) => !li.hidden);
        }
        for (const g of groups) {
          const any = $$('li', g).some((li) => !li.hidden);
          g.hidden = !!k && !any;
          g.open = k ? any : openState.get(g);
        }
        if (empty) empty.style.display = k && !shown ? 'block' : 'none';
      });
    }
    // Keep the current page in view inside the sidebar.
    const cur = $('[aria-current="page"]', side);
    if (cur) side.scrollTop = Math.max(0, cur.getBoundingClientRect().top - side.getBoundingClientRect().top - side.clientHeight / 2);
    // Phone drawer.
    const btn = $('.sec-bar__menu'); if (!btn) return;
    const scrim = document.createElement('div'); scrim.className = 'ref-scrim'; document.body.appendChild(scrim);
    const set = (open) => { side.classList.toggle('is-open', open); scrim.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); if (open && input) setTimeout(() => input.focus(), 250); };
    btn.addEventListener('click', () => set(!side.classList.contains('is-open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  function toc() {
    const box = $('.ref__toc'); const art = $('.ref__main'); if (!box || !art) return;
    const hs = $$('h2[id]', art).filter((h) => !h.closest('aside')); if (hs.length < 2) return;
    box.innerHTML = '<p>On this page</p><ol>' + hs.map((h) => `<li><a href="#${h.id}">${h.textContent}</a></li>`).join('') + '</ol>';
    const links = $$('a', box);
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      }
    }, { rootMargin: '-140px 0px -65% 0px' });
    hs.forEach((h) => obs.observe(h));
  }

  function rail() {
    for (const r of $$('.cn-rail')) {
      const track = $('.cn-rail__track', r); if (!track) continue;
      const cur = $('[aria-current="page"]', track);
      if (cur) track.scrollLeft = cur.offsetLeft - track.clientWidth / 2 + cur.clientWidth / 2;
      const step = () => Math.max(240, track.clientWidth * 0.7);
      $('.cn-rail__btn--prev', r)?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
      $('.cn-rail__btn--next', r)?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    }
  }

  const start = () => { sidebar(); toc(); rail(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
