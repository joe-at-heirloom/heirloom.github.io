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
        return `<li>${r.img ? `<img class="dli" src="${esc(r.img)}" alt="" height="56">` : `<span class="dl dl--${esc(r.style)}">${esc(r.letter)}</span>`}<span><strong>${esc(r.year_label || r.year)}</strong> · ${esc(STYLE[r.style])}, ${r.case === 'upper' ? 'capital' : r.case === 'lower' ? 'small' : 'capital or small'}${flag ? `<br><small>${esc(flag)}</small>` : ''}</span></li>`;
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

  // ── Pottery ───────────────────────────────────────────────────────────────
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Three-letter words read on their own are not codes (the app's WEDGWOOD_NOT_CODES).
  const NOT_CODES = new Set(['THE', 'AND', 'USA', 'LTD', 'INC', 'PAT', 'NEW', 'OLD', 'FOR', 'ONE', 'TWO', 'SIX', 'TEN', 'ART', 'CUP', 'POT', 'TEA', 'BOX', 'LID', 'MUG', 'JUG', 'WMF', 'EPN', 'GBR', 'MFG']);
  function wedgwood() {
    const { rows, months } = window.WG || { rows: [], months: [] };
    const input = $('wg-code'), eng = $('wg-england'), out = $('wg-results');
    hint(out);
    const run = () => {
      const code = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) return say(out, out.dataset.hint);
      const m = /^([A-Z34])([A-Z])([A-Z])$/.exec(code);
      if (!m) return say(out, '<p>A Wedgwood date code is exactly three characters: a month letter (or 3 or 4), a potter\'s letter and the year letter, such as TOT or 3KC.</p>');
      if (NOT_CODES.has(code)) return say(out, `<p>${esc(code)} reads as a word, not a date code. Check the impressed characters again.</p>`);
      const digitFirst = m[1] === '3' || m[1] === '4';
      let hits = rows.filter((r) => r.letter === m[3] && (digitFirst ? r.cycle === 3 : r.cycle !== 3));
      if (eng.checked) hits = hits.filter((r) => r.year >= 1891);
      if (!hits.length) return say(out, `<p>No year fits ${esc(code)}${eng.checked ? ' with ENGLAND in the mark' : ''}. Check the last character, and whether the first is a letter or the figure 3 or 4.</p>`);
      const monthFor = (year) => {
        if (digitFirst) return '';
        const mm = months.find((x) => { const [a, b] = x.years.split('-').map(Number); return x.first_char === m[1] && year >= a && year <= b; });
        return mm ? MONTHS[mm.month - 1] + ' ' : '';
      };
      const li = (r) => `<li><span class="big">${r.year}</span><span>${esc(monthFor(r.year))}${r.year}<br><small>Year letter ${esc(m[3])}, cycle ${r.cycle}${r.year >= 1891 ? ' · ENGLAND expected in the mark' : ''}</small></span></li>`;
      say(out, `<p><strong>${esc(code)}</strong>${hits.length > 1 ? ': the year letter was used twice. ENGLAND on the base (from 1891) or other marks decide which.' : ':'}</p><ul class="hits">${hits.map(li).join('')}</ul>`);
    };
    [input, eng].forEach((el) => el.addEventListener('input', run));
  }

  function minton() {
    const rows = window.MN || [];
    const input = $('mn-q'), out = $('mn-results');
    hint(out);
    input.addEventListener('input', () => {
      const words = input.value.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
      if (!words.length) return say(out, out.dataset.hint);
      const hits = rows.filter((r) => words.every((w) => r.cypher_description.toLowerCase().includes(w)));
      if (!hits.length) return say(out, '<p>No cypher is described that way. Try one simple word for the shape: triangle, square, circle, cross, star, letter, number.</p>');
      say(out, `<p><strong>${hits.length}</strong> ${hits.length === 1 ? 'year matches' : 'years match'}:</p><ul class="hits">${hits.map((r) => `<li><span class="big">${r.year}</span><span>${esc(r.cypher_description)}${r.confusable_with ? `<br><small>Easily confused with ${r.confusable_with.join(', ')}</small>` : ''}</span></li>`).join('')}</ul>`);
    });
  }

  function worcester() {
    const type = $('rw-type'), letter = $('rw-letter'), dots = $('rw-dots'), shape = $('rw-shape'), digits = $('rw-digits'), out = $('rw-results');
    hint(out);
    const show = { letter: ['letter'], dots: ['dots'], star: ['dots'], shape: ['shape'], circles: ['dots'], w: ['dots'], digits: ['digits'] };
    const LETTERS = { A: 1867, B: 1868, C: 1869, D: 1870, E: 1871, G: 1872, H: 1873, I: 1874, K: 1875, L: 1876, M: 1877, N: 1878, P: 1879, R: 1880, S: 1881, T: 1882, U: 1883, X: 1886, Y: 1887, Z: 1888, O: 1889 };
    const res = (items, note) => say(out, `<ul class="hits">${items.map(([y, d]) => `<li><span class="big">${esc(y)}</span><span>${d}</span></li>`).join('')}</ul>${note ? `<p class="finder__hint">${note}</p>` : ''}`);
    const run = () => {
      ['letter', 'dots', 'shape', 'digits'].forEach((k) => { $(`rw-${k}-l`).hidden = !show[type.value].includes(k); });
      const n = dots.value === '' ? null : Number(dots.value);
      switch (type.value) {
        case 'letter': {
          const l = letter.value.trim();
          if (!l) return say(out, out.dataset.hint);
          if (l === 'a') return res([[1890, 'Small letter a below the circle']]);
          const L = l.toUpperCase();
          if (l !== L) return say(out, '<p>Only one small letter was used: a, for 1890. Every other letter is a capital.</p>');
          if (L === 'V') return res([[1884, 'V below the circle; crown sits down on the circle'], [1949, 'V below the mark, with ENGLAND']], 'V was used twice. The wording round the mark and the ware itself tell 1884 from 1949.');
          if (L === 'W') return res([[1885, 'W below the circle'], [1950, 'W with no dots']], 'W was used twice: 1885, and 1950 (with dots from 1951 for each later year).');
          if (LETTERS[L]) return res([[LETTERS[L], `${esc(L)} below the circle of the standard mark`]], LETTERS[L] < 1876 ? 'Before 1876 the crown sits slightly above the circle; from 1876 it sits down on it.' : '');
          return say(out, `<p>${esc(L)} isn't a Royal Worcester year letter: F, J and Q were never used.</p>`);
        }
        case 'dots':
          if (n === null) return say(out, out.dataset.hint);
          if (n === 0) return res([[1891, 'Royal Worcester England round the circle, no dots']], 'A no-dot mark is not always 1891: one documented piece with it carries a design registered in 1913.');
          if (n <= 24) return res([[1891 + n, `${n} dot${n === 1 ? '' : 's'}`]], 'Count every dot, both sides of the crown and below the circle.');
          return say(out, '<p>More than 24 dots with no star: some pieces kept the old dot plates after 1916, so this may be 1916 or later.</p>');
        case 'star':
          if (n === null || n === 0) return res([[1916, 'A small star or asterisk below the mark, no dots']], 'Smudged dots can look like a star.');
          if (n <= 11) return res([[1916 + n, `A star and ${n} dot${n === 1 ? '' : 's'}`]]);
          return say(out, '<p>The star period runs to 11 dots (1927). Count again, or check for three linked circles.</p>');
        case 'shape':
          return res([[Number(shape.value), shape.options[shape.selectedIndex].text + ' below the mark']]);
        case 'circles':
          if (n === null || n === 0) return res([[1932, 'Three linked circles, no dots']]);
          if (n < 9) return res([[1932 + n, `Three linked circles and ${n} dot${n === 1 ? '' : 's'}`]]);
          if (n === 9) return res([['1941–48', 'Three linked circles and 9 dots']], '1941 or later: the sources disagree on whether the mark was left unchanged until 1948.');
          return res([['1942–48', `Three linked circles and ${n} dots`]], 'Disputed: only one source\'s table uses 10 to 16 dots for 1942–1948; the factory museum says no code was used then.');
        case 'w':
          if (n === null || n === 0) return res([[1950, 'W with no dots']]);
          if (n <= 13) return res([[1950 + n, `W (or, from about 1956, R in a circle) with ${n} dot${n === 1 ? '' : 's'}`]]);
          return say(out, '<p>The dot code ends in 1963 (13 dots). After that there is no date code.</p>');
        case 'digits': {
          const d = digits.value.replace(/\D/g, '');
          if (d.length < 2) return say(out, out.dataset.hint);
          const y = 1800 + Number(d);
          if (y >= 1862 && y <= 1877) return res([[y, `${esc(d)} below the mark`]], 'Two-digit years are rare.');
          return say(out, '<p>Two-digit years appear only from 1862 to about 1877 (62 to 77).</p>');
        }
      }
    };
    [type, letter, dots, shape, digits].forEach((el) => el.addEventListener('input', run));
    run();
  }

  function romanValue(tok) {
    if (!/^[IVXLC]+$/.test(tok)) return null;
    const R = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    let total = 0;
    for (let i = 0; i < tok.length; i += 1) { const v = R[tok[i]], nx = R[tok[i + 1]] || 0; total += v < nx ? -v : v; }
    const map = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '', n = total; for (const [v, c] of map) while (n >= v) { s += c; n -= v; }
    return s === tok ? total : null;
  }
  function rookwood() {
    const flames = $('rk-flames'), numeral = $('rk-numeral'), out = $('rk-results');
    hint(out);
    const run = () => {
      const num = numeral.value.toUpperCase().replace(/[^IVXLCM]/g, '');
      const f = flames.value === '' ? null : Number(flames.value);
      if (num.startsWith('MM')) {
        const v = romanValue(num.slice(2));
        return say(out, v ? `<ul class="hits"><li><span class="big">${2000 + v}</span><span>${esc(num)}: a modern Rookwood mark, the full year in Roman numerals</span></li></ul>` : '<p>That numeral isn\'t well formed.</p>');
      }
      if (num) {
        const v = romanValue(num);
        if (v === null) return say(out, '<p>That numeral isn\'t well formed. Check each letter: I, V, X and L.</p>');
        if (v < 1 || v > 67) return say(out, '<p>Historic Roman numerals run from I (1901) to LXVII (1967).</p>');
        if (f !== null && f !== 14) return say(out, '<p>The numeral appears only under the full 14-flame mark. Count the flames again.</p>');
        return say(out, `<ul class="hits"><li><span class="big">${1900 + v}</span><span>14 flames and ${esc(num)} below</span></li></ul><p class="finder__hint">The Arabic number under the numeral is a shape number, not a date.</p>`);
      }
      if (f === null) return say(out, out.dataset.hint);
      if (f < 0 || f > 14) return say(out, '<p>The RP mark has between 0 and 14 flames.</p>');
      say(out, `<ul class="hits"><li><span class="big">${1886 + f}</span><span>RP monogram with ${f} flame${f === 1 ? '' : 's'}${f === 0 ? ' (unless later flames are blurred away)' : ''}</span></li></ul><p class="finder__hint">The tail of the R is not a flame. A 14-flame mark with a numeral below is 1901 or later.</p>`);
    };
    [flames, numeral].forEach((el) => el.addEventListener('input', run));
  }

  function sevres() {
    const rows = window.SV || [];
    const input = $('sv-letter'), out = $('sv-results');
    hint(out);
    input.addEventListener('input', () => {
      const l = input.value.toUpperCase().replace(/[^A-Z]/g, '');
      if (!l) return say(out, out.dataset.hint);
      if (l.length === 2 && l[0] !== l[1]) return say(out, '<p>The two letters of a Sèvres double are always the same. Different letters, such as CL, are not a date code, and one source takes them as a sign of a copied mark.</p>');
      const r = rows.find((x) => x.letter === l);
      if (!r) return say(out, `<p>${esc(l)} isn't in the date-letter tables, which run from A to QQ.</p>`);
      if (!r.year) return say(out, '<p>W was never used as a Sèvres date letter. A W inside the Ls is not a date code.</p>');
      const both = r.alt_year && r.alt_year !== r.year;
      say(out, `<ul class="hits"><li><span class="big">${both ? `${Math.min(r.year, r.alt_year)}–${Math.max(r.year, r.alt_year)}` : r.year}</span><span>${both ? `${r.year} in the revised table (current scholarship); ${r.alt_year} in the traditional one` : 'The same year in both tables'}</span></li></ul><p class="finder__hint">The mark is widely copied: the letter gives the date it claims, not proof of factory work.</p>`);
    });
  }

  const tools = { dateletters: dateLetters, singer, watch, leica, wedgwood, minton, worcester, rookwood, sevres };
  const start = () => tools[window.MARKS_TOOL] && tools[window.MARKS_TOOL]();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
