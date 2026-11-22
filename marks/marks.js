// The marks reference's lookups. Each follows the app's own decoder
// (backend/src/services/mark-decoders.ts in the app repo) so the site and
// Heirloom Advisor give the same answer for the same mark:
//   - date letters list every year a letter could be, never the nearest one;
//   - Singer reads "G 7572" and the zero-padded 1923 G series apart;
//   - Leica refuses a number that starts with 0;
//   - watches give both years where the published lists disagree.
(() => {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const $ = (id) => document.getElementById(id);
  const say = (el, html) => { el.innerHTML = html; };
  const hint = (el) => el.dataset.hint || (el.dataset.hint = el.innerHTML);
  const cache = {};
  const load = (name) => (cache[name] ||= fetch(`/marks/data/${name}.json`).then((r) => r.json()));

  // ── Date letters ──────────────────────────────────────────────────────────
  const STYLE = { gothic: 'Old English (black letter)', court_hand: 'Court hand', roman: 'Roman', italic: 'Italic', script: 'Script', block: 'Plain capitals' };
  // Letters a worn punch is commonly misread as (the app's HALLMARK_CONFUSABLE).
  const LOOKS = { s: ['f'], f: ['s'], i: ['l', 'j'], l: ['i'], j: ['i'], u: ['n', 'v'], n: ['u'], v: ['u', 'y'], c: ['e'], e: ['c'], h: ['b'], b: ['h'] };
  function dateLetters() {
    const rows = window.DL_ROWS || [];
    const L = $('dl-letter'), C = $('dl-case'), S = $('dl-style'), out = $('dl-results');
    hint(out);
    const run = () => {
      const raw = L.value.trim();
      if (!raw) return say(out, out.dataset.hint);
      const want = raw.toLowerCase();
      const caseSel = C.value, styleSel = S.value;
      const match = (r, letters) => letters.includes(r.letter.toLowerCase()) && (!caseSel || r.case === caseSel || r.case === 'either') && (!styleSel || r.style === styleSel);
      const exact = rows.filter((r) => match(r, [want]));
      const alike = rows.filter((r) => match(r, LOOKS[want] || []));
      const li = (r) => {
        const flag = [r.alt_year ? `another source gives ${r.alt_year}` : '', r.confidence ? (r.confidence === 'disputed' ? 'sources disagree' : `${r.confidence} confidence`) : '', r.note || ''].filter(Boolean).join('; ');
        return `<li><span class="dl dl--${esc(r.style)}">${esc(r.letter)}</span><span><strong>${esc(r.year_label || r.year)}</strong> · ${esc(STYLE[r.style])}, ${r.case === 'upper' ? 'capital' : r.case === 'lower' ? 'small' : 'capital or small'}${flag ? `<br><small>${esc(flag)}</small>` : ''}</span></li>`;
      };
      let html = exact.length
        ? `<p><strong>${exact.length === 1 ? 'One year' : `${exact.length} possible years`}</strong> for “${esc(raw)}”${caseSel || styleSel ? ' with those choices' : ''}. Match the style to your mark:</p><ul class="hits">${exact.map(li).join('')}</ul>`
        : `<p>No ${esc(raw)} in this office's table with those choices. Try “Either” and “Any”, or check the town mark: this page covers one office only.</p>`;
      if (alike.length) html += `<details class="alike"><summary>A worn punch can look like this letter: ${alike.length} more possibilities</summary><ul class="hits">${alike.map(li).join('')}</ul></details>`;
      say(out, html);
    };
    [L, C, S].forEach((el) => el.addEventListener('input', run));
  }

  // ── Singer ────────────────────────────────────────────────────────────────
  function singer() {
    const input = $('sn'), out = $('sn-results');
    hint(out);
    const run = async () => {
      const m = /^\s*(?:NO\.?\s*|SERIAL\s*)?([A-Z]{1,2})?[\s\-.]*(\d{3,8})\s*$/.exec(input.value.toUpperCase().replace(/[\[\]]/g, ''));
      if (!input.value.trim()) return say(out, out.dataset.hint);
      if (!m) return say(out, '<p>Enter one or two letters followed by the number, such as G 7572, or a number on its own.</p>');
      const t = await load('singer');
      const col = Object.fromEntries(t.cols.map((c, i) => [c, i]));
      const prefix = m[1] || '', digits = m[2], n = Number(digits);
      let hits = t.rows.filter((r) => r[col.prefix] === prefix && n >= r[col.from] && (r[col.to] == null || n <= r[col.to]));
      // The 1923 G series is printed with a leading zero ("G0007572"); a plate without one is the 1910 series.
      const printedWithZero = (r) => r[col.digits] >= 7 && String(r[col.to]).length < r[col.digits];
      const narrowed = digits.startsWith('0') ? hits.filter((r) => r[col.digits] === digits.length) : hits.filter((r) => !printedWithZero(r));
      if (narrowed.length) hits = narrowed;
      if (!hits.length) return say(out, `<p>No block in Singer's published registers contains ${esc(prefix ? `${prefix} ` : '')}${esc(digits)}. Some prefixes belong to plants whose registers aren't published (C, and some A, E, T and S serials), and a few blocks are missing. That doesn't say anything is wrong with the machine.</p>`);
      const rowHtml = (r) => {
        const model = t.models[r[col.model]], fac = t.factories[r[col.factory]], conf = t.conf[r[col.confidence]];
        const when = r[col.allotted] ? `allotted ${esc(r[col.allotted])}` : `${esc(r[col.year])}`;
        const alt = r[col.alt_year] && r[col.alt_year] !== r[col.year] ? ` (Singer's year table says ${esc(r[col.alt_year])})` : '';
        // As stamped: no thousands commas, padded to the register's width for prefixed blocks.
        const serial = (v) => `${esc(r[col.prefix])}${r[col.prefix] && r[col.digits] ? String(v).padStart(r[col.digits], '0') : v}`;
        return `<li><span class="big">${esc(r[col.year])}</span><span>${model ? `Model <strong>${esc(model)}</strong>, ` : ''}${when}${alt}${fac ? `<br><small>${esc(fac)}</small>` : ''}${conf !== 'high' ? `<br><small>A ${esc(conf)}-confidence block</small>` : ''}<br><small>Block ${serial(r[col.from])} to ${r[col.to] != null ? serial(r[col.to]) : '…'}</small></span></li>`;
      };
      say(out, `<p><strong>${esc(prefix ? `${prefix} ` : '')}${esc(digits)}</strong>${hits.length > 1 ? ` falls in ${hits.length} blocks; your machine's model decides which:` : ':'}</p><ul class="hits">${hits.map(rowHtml).join('')}</ul><p class="finder__hint">The date is when Singer allotted the block of numbers, not always the day the machine was built.</p>`);
    };
    input.addEventListener('input', run);
  }

  // ── Pocket watches ────────────────────────────────────────────────────────
  function watch() {
    const maker = $('w-maker'), input = $('w-serial'), out = $('w-results');
    hint(out);
    const run = async () => {
      const digits = input.value.replace(/[^\d]/g, '');
      if (!digits) return say(out, out.dataset.hint);
      if (digits.length < 3) return say(out, '<p>Keep typing: movement serials are longer than this.</p>');
      const rows = (await load('watches')).filter((r) => r.maker === maker.value).sort((a, b) => a.serial_start - b.serial_start);
      const n = Number(digits);
      const last = rows[rows.length - 1];
      const row = rows.find((x) => n >= x.serial_start && (x.serial_end == null || n <= x.serial_end)) || (last && last.serial_end == null && n >= last.serial_start ? last : null);
      if (!row) return say(out, `<p>${esc(maker.value)}'s list doesn't cover ${fmt(n)}. Its table runs from ${fmt(rows[0].serial_start)}; check the maker named on the movement, and that this is the movement's number, not the case's.</p>`);
      const years = [row.year, row.alt_year || row.year];
      const from = Math.min(...years), to = Math.max(...years);
      say(out, `<ul class="hits"><li><span class="big">${from === to ? `c. ${from}` : `${from}–${to}`}</span><span>${esc(maker.value)} movement ${fmt(n)}${from === to ? '' : `<br><small>${row.year} by the standard list, ${row.alt_year} by another</small>`}</span></li></ul><p class="finder__hint">Serial-year lists are approximate: movements were made in blocks and finished as needed.</p>`);
    };
    [maker, input].forEach((el) => el.addEventListener('input', run));
  }

  // ── Leica ─────────────────────────────────────────────────────────────────
  function leica() {
    const input = $('l-serial'), out = $('l-results');
    hint(out);
    const run = async () => {
      const t = input.value.replace(/[^\d]/g, '');
      if (!t) return say(out, out.dataset.hint);
      if (t.startsWith('0')) return say(out, '<p><strong>Leitz never began a body number with 0.</strong> Soviet FED and Zorki cameras engraved as Leicas often did, so don\'t date this body from the Leitz list.</p>');
      if (t.length < 3) return say(out, '<p>Keep typing.</p>');
      const n = Number(t);
      const hits = (await load('leica')).filter((r) => n >= r.from && n <= r.to);
      if (!hits.length) return say(out, `<p>${fmt(n)} isn't in a camera-body block in these lists. That doesn't mean the camera is a copy: later numbers were shared with Leicaflex, R-series and compact cameras, which are left out, and some blocks were never used.</p>`);
      const when = (x) => { const ys = [x.year, x.year_end || x.year, x.alt_year || x.year]; const a = Math.min(...ys), b = Math.max(...ys); return a === b ? `c. ${a}` : `c. ${a}–${b}`; };
      say(out, `<ul class="hits">${hits.map((h) => `<li><span class="big">${esc(when(h))}</span><span><strong>${esc(h.model)}</strong>${h.variant ? `, ${esc(h.variant)}` : ''}${h.alt_model ? `<br><small>The other list says ${esc(h.alt_model)}</small>` : ''}<br><small>Block ${fmt(h.from)}–${fmt(h.to)}</small></span></li>`).join('')}</ul><p class="finder__hint">This is the model the body was made as; Leitz converted many bodies later and kept the number.</p>`);
    };
    input.addEventListener('input', run);
  }

  const tools = { dateletters: dateLetters, singer, watch, leica };
  const start = () => tools[window.MARKS_TOOL] && tools[window.MARKS_TOOL]();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
