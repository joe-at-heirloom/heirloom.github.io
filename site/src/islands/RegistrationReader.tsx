/** @jsxImportSource preact */
// The British registration reader: type an Rd number and it is found in The
// National Archives' design books (each holds a run of numbers registered
// between two dates; a number in two books lies in both windows), or set the
// letters and numbers of a diamond mark and the date is read from the code
// tables. The data is the app's registration.json, served at
// /marks/data/registration.json. The answer is when the design was registered:
// the piece is that old or younger.
import { useEffect, useMemo, useState } from 'preact/hooks';

type Piece = [number, number, string, string, string, string];
type Data = { pieces: Piece[]; diamond: { month: Record<string, number>; year_1842_67: Record<string, number>; year_1868_83: Record<string, number>; classes: Record<string, string> } };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const day = (s: string) => `${Number(s.slice(6, 8))} ${MONTHS[Number(s.slice(4, 6)) - 1]} ${s.slice(0, 4)}`;
const fmt = (n: number) => n.toLocaleString('en-GB');
let loading: Promise<Data> | null = null;
const load = () => (loading ??= fetch('/marks/data/registration.json').then((r) => r.json()));

export function windowText(from: string, to: string) {
  if (from.slice(4) === '0101' && to.slice(4) === '1231' && from.slice(0, 4) === to.slice(0, 4)) return `in ${from.slice(0, 4)}`;
  if (from === to) return `on ${day(from)}`;
  if (from.slice(0, 6) === to.slice(0, 6)) return `${Number(from.slice(6, 8))}–${day(to)}`;
  return `between ${day(from)} and ${day(to)}`;
}
function lookup(d: Data, n: number) {
  const hit = d.pieces.filter((p) => p[0] <= n && n <= p[1]);
  if (!hit.length) return null;
  hit.sort((a, b) => (+a[3] - +a[2]) - (+b[3] - +b[2]));
  let from = hit.map((p) => p[2]).sort().pop()!, to = hit.map((p) => p[3]).sort()[0];
  if (from > to) { from = hit[0][2]; to = hit[0][3]; }
  return { from, to, hit };
}
const discovery = (ref: string) => `https://discovery.nationalarchives.gov.uk/results/r?_q=${encodeURIComponent(`"${ref}"`)}`;

export default function RegistrationReader() {
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<'number' | 'diamond'>('number');
  const [raw, setRaw] = useState('');
  const [period, setPeriod] = useState<'1842' | '1868'>('1842');
  const [yearL, setYearL] = useState('');
  const [monthL, setMonthL] = useState('');
  const [dayN, setDayN] = useState('');
  const [cls, setCls] = useState('IV');
  useEffect(() => {
    load().then(setData);
    const h = location.hash;
    if (h === '#diamond') setMode('diamond');
    const q = new URLSearchParams(location.search).get('rd');
    if (q) { setRaw(q); setMode('number'); }
  }, []);

  const n = Number(raw.replace(/[^\d]/g, ''));
  const rd = useMemo(() => (data && n ? lookup(data, n) : null), [data, n]);
  const yearTable = data ? (period === '1842' ? data.diamond.year_1842_67 : data.diamond.year_1868_83) : {};
  const yearLetters = Object.keys(yearTable).sort();
  const monthLetters = data ? Object.keys(data.diamond.month).sort() : [];
  let dYear: number | null = yearL ? yearTable[yearL] ?? null : null;
  let dMonth: number | null = monthL && data ? data.diamond.month[monthL] ?? null : null;
  const dDay = dayN ? Number(dayN) : null;
  const notes: string[] = [];
  // The code tables' exceptions: R for 1-19 September 1857, K for December 1860, G and W for 1-6 March 1878.
  if (period === '1842' && monthL === 'R' && dYear === 1857 && (!dDay || dDay <= 19)) { notes.push('In 1857 R also stood for September, from the 1st to the 19th: this is August or early September 1857.'); }
  if (period === '1842' && monthL === 'K' && dYear === 1860) { notes.push('K was used for December in 1860, as well as for November: the day can’t settle which.'); }
  if (period === '1868' && monthL === 'G' && yearL === 'W') { dYear = 1878; dMonth = 3; notes.push('From 1 to 6 March 1878 the office used G for the month and W for the year.'); }
  if (period === '1868' && yearL === 'W' && monthL !== 'G') { dYear = 1878; notes.push('W was the year letter only from 1 to 6 March 1878.'); }

  return (
    <div class="rg">
      <div class="rg__tabs" role="group" aria-label="What is on the piece">
        <button type="button" aria-pressed={mode === 'number'} onClick={() => setMode('number')}>An Rd number</button>
        <button type="button" aria-pressed={mode === 'diamond'} onClick={() => setMode('diamond')}>A diamond mark</button>
      </div>

      {mode === 'number' && (
        <section class="rg__card" id="number" aria-labelledby="rg-n">
          <h2 id="rg-n">Rd No, 1884 to 1991</h2>
          <p>Type the number after “Rd”, “Rd No” or “Registered”. Only the digits count.</p>
          <div class="rg__row">
            <label class="rg__field">Registered number
              <input inputMode="numeric" autoComplete="off" placeholder="351202" value={raw} onInput={(e) => setRaw((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          {!n ? null : !data ? <div class="rg__answer rg__answer--none"><strong class="big">Loading the books…</strong></div> : !rd ? (
            <div class="rg__answer rg__answer--none">
              <strong class="big">{fmt(n)} isn’t in the books we hold</strong>
              <p>The Archives’ catalogue lists design numbers from 1 (January 1884) to 2,012,308 (January 1991), with a few short gaps. A number above that is later; a number with letters may be from another country’s register.</p>
            </div>
          ) : (
            <div class="rg__answer" aria-live="polite">
              <strong class="big">Registered {windowText(rd.from, rd.to)}</strong>
              <p>Design no. {fmt(n)} is in The National Archives’ {rd.hit.length > 1 ? 'books' : 'book'} {rd.hit.slice(0, 3).map((p, i) => <>{i ? ', ' : ''}<a href={discovery(p[4])} rel="noopener">{p[4]}</a></>)}{rd.hit[0][5] === 'registers' ? ' (a register)' : ''}, which {rd.hit.length > 1 ? 'hold' : 'holds'} designs {fmt(rd.hit[0][0])} to {fmt(rd.hit[0][1])}{rd.hit.length > 1 ? ' and others' : ''}.</p>
              <p>That dates the design. The piece was made then or later, often years later, and the firm that registered it may be a retailer or a designer rather than the maker. The register gives the owner’s name; the Archives at Kew holds it.</p>
            </div>
          )}
        </section>
      )}

      {mode === 'diamond' && (
        <section class="rg__card" id="diamond" aria-labelledby="rg-d">
          <h2 id="rg-d">The diamond mark, 1842 to 1883</h2>
          <p>Choose which way round your diamond is, then the letters and numbers in its corners. The Roman numeral at the top is the material: IV is pottery and porcelain.</p>
          <div class="rg__tabs" role="group" aria-label="Which diamond">
            <button type="button" aria-pressed={period === '1842'} onClick={() => { setPeriod('1842'); setYearL(''); }}>Year letter at the top (1842–67)</button>
            <button type="button" aria-pressed={period === '1868'} onClick={() => { setPeriod('1868'); setYearL(''); }}>Year letter at the right (1868–83)</button>
          </div>
          <div class="rg__diamond">
            <div class="rg__selects">
              <label class="rg__field">Year letter ({period === '1842' ? 'top' : 'right'})
                <select value={yearL} onChange={(e) => setYearL((e.target as HTMLSelectElement).value)}><option value="">—</option>{yearLetters.map((l) => <option value={l}>{l}</option>)}</select>
              </label>
              <label class="rg__field">Month letter ({period === '1842' ? 'left' : 'bottom'})
                <select value={monthL} onChange={(e) => setMonthL((e.target as HTMLSelectElement).value)}><option value="">—</option>{monthLetters.map((l) => <option value={l}>{l}</option>)}</select>
              </label>
              <label class="rg__field">Day ({period === '1842' ? 'right' : 'top'})
                <select value={dayN} onChange={(e) => setDayN((e.target as HTMLSelectElement).value)}><option value="">—</option>{Array.from({ length: 31 }, (_, i) => <option value={String(i + 1)}>{i + 1}</option>)}</select>
              </label>
              <label class="rg__field">Class (top)
                <select value={cls} onChange={(e) => setCls((e.target as HTMLSelectElement).value)}>{['I', 'II', 'III', 'IV'].map((c) => <option value={c}>{c}</option>)}</select>
              </label>
            </div>
            <svg viewBox="0 0 220 220" role="img" aria-label={`A ${period === '1842' ? '1842 to 1867' : '1868 to 1883'} diamond mark`}>
              <circle cx="110" cy="34" r="20" fill="none" stroke="currentColor" stroke-width="1.5" />
              <text x="110" y="39" text-anchor="middle">{cls}</text>
              <path d="M110 58 L190 130 L110 202 L30 130 Z" fill="none" stroke="currentColor" stroke-width="1.5" />
              <text x="110" y="132" text-anchor="middle" class="lab">Rd</text>
              {period === '1842' ? (
                <>
                  <text x="110" y="84" text-anchor="middle" class={yearL ? 'hit' : ''}>{yearL || 'year'}</text>
                  <text x="52" y="135" text-anchor="middle" class={monthL ? 'hit' : ''}>{monthL || 'month'}</text>
                  <text x="168" y="135" text-anchor="middle" class={dayN ? 'hit' : ''}>{dayN || 'day'}</text>
                  <text x="110" y="188" text-anchor="middle" class="lab">parcel</text>
                </>
              ) : (
                <>
                  <text x="110" y="84" text-anchor="middle" class={dayN ? 'hit' : ''}>{dayN || 'day'}</text>
                  <text x="52" y="135" text-anchor="middle" class="lab">parcel</text>
                  <text x="168" y="135" text-anchor="middle" class={yearL ? 'hit' : ''}>{yearL || 'year'}</text>
                  <text x="110" y="188" text-anchor="middle" class={monthL ? 'hit' : ''}>{monthL || 'month'}</text>
                </>
              )}
            </svg>
          </div>
          {(dYear || dMonth) && (
            <div class="rg__answer" aria-live="polite">
              <strong class="big">Registered {dDay && dMonth ? `${dDay} ` : ''}{dMonth ? `${MONTHS[dMonth - 1]} ` : ''}{dYear ?? '(choose the year letter)'}</strong>
              {data && <p>Class {cls}: {data.diamond.classes[cls] ?? ''}.</p>}
              {notes.map((t) => <p>{t}</p>)}
              <p>That dates the design or shape. The piece was made then or later. A printed diamond usually belongs to the printed pattern; a diamond pressed into the clay to the shape.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
