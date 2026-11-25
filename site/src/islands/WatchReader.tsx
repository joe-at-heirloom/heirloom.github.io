/** @jsxImportSource preact */
// The watch serial reader: type the number found on a watch and it is read
// against every table at once (Rolex case serials, both numberings and the
// letter series; Omega movement serials; six American pocket-watch makers'
// movement serials). Naming the maker settles it. The rules are the site's own
// serial pages' (marks/marks.js), so both give the same answer. For Rolex and
// Omega, pictures show which number on the watch is the serial and which only
// names the model.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { media } from '../lib/media';

type Place = { id: string; maker: string; name: string; means: string; serial: boolean | null; img: string | null; years: string };
type Props = { places: Place[]; pocketMakers: string[] };
type Reading = { maker: string; what: string; big: string; lines: string[]; tone?: 'note' };

const fmt = (n: number) => n.toLocaleString('en-US');
const cache: Record<string, Promise<any>> = {};
const load = (name: string) => (cache[name] ??= fetch(`/marks/data/${name}.json`).then((r) => r.json()));

function rolex(t: any, raw: string): Reading[] | string {
  const span = (r: any) => (r.year_end && r.year_end !== r.year ? `${r.year}–${r.year_end}` : `c. ${r.year}`);
  const exs = (r: any) => (r.dated_examples || []).map((x: any) => `${typeof x.serial === 'number' ? fmt(x.serial) : x.serial}: ${x.date}`).join('; ');
  const SERIES: Record<string, string> = { first: 'Case serial, first numbering (to 1953–54)', second: 'Case serial, second numbering (from 1954)' };
  if (/^[A-Z]\d{6}$/.test(raw)) {
    const p = t.prefixes.find((x: any) => x.prefix === raw[0]);
    if (!p) return `${raw[0]} isn't one of the letters Rolex used before its six digits (${t.prefixes.map((x: any) => x.prefix).join(', ')}).`;
    const ex = exs(p);
    return [{ maker: 'Rolex', what: `Case serial, the ${p.prefix} series`, big: span(p), lines: [Object.entries(p.by_source).map(([k, v]) => `${({ S: 'Date chart', A: 'Bob’s list', W: 'Month-dated lists' } as Record<string, string>)[k] || k}: ${v}`).join(' · '), ...(ex ? [`Dated papers: ${ex}`] : []), 'A warranty-card date is when the watch was sold, often later.'] }];
  }
  if (raw.length === 8 && /[A-Z]/.test(raw)) return [{ maker: 'Rolex', what: 'Random serial', big: '2010 on', lines: ['Used from about late 2009 or 2010. These aren’t in sequence, so no year can be read from the number. The warranty card, or the retailer that sold it, has the date of sale.'] }];
  if (/[A-Z]/.test(raw)) return 'A Rolex serial is digits only (to 1987), one letter and six digits (about 1987 to 2010), or eight mixed letters and digits (from about 2010).';
  if (raw.length > 7) return 'Numeric Rolex serials have at most seven digits. A longer number may be the model reference and a serial read together.';
  if (raw.length < 4) return 'Keep typing.';
  const n = Number(raw);
  const hits = t.rows.filter((r: any) => n >= r.serial_start && n <= r.serial_end);
  if (!hits.length) return `${fmt(n)} isn't covered: the lists don't agree below 23,969 (about 1928), and the second numbering is listed from 10,001.`;
  return hits.map((r: any): Reading => r.year == null
    ? { maker: 'Rolex', what: SERIES[r.series], big: '?', lines: [r.note] }
    : { maker: 'Rolex', what: SERIES[r.series], big: span(r), lines: [...(r.note ? [r.note] : []), ...(exs(r) ? [`Dated watches in this block: ${exs(r)}`] : []), ...(hits.length > 1 ? ['Rolex used this number twice, before and after the 1953–54 restart. The model and its style decide which.'] : [])] });
}

function omega(t: any, input: string): Reading[] | string {
  const digits = input.replace(/[^\d]/g, '');
  if (/[a-z]/i.test(input)) return 'A movement serial is digits only. Letters and a dot or dash, such as ST 145.022 or 2915-1, are a model reference, not a serial.';
  if (digits.length < 6) return 'Keep typing: Omega movement serials from 1894 on have seven or eight digits.';
  if (digits.length > 8) return 'That is longer than an Omega serial. A long code with dots, such as 311.30.42.30.01.005, is the model’s product code.';
  const n = Number(digits), rows = t.rows;
  if (n < rows[0].serial_start) return `${fmt(n)} is below 1,000,000, the first entry in the lists (about 1894). Omega’s earliest movements aren’t dated here.`;
  const row = rows.find((x: any) => n >= x.serial_start && n <= x.serial_end);
  if (!row) return `${fmt(n)} can’t be dated from the number alone. From about 1995 Omega gave blocks of numbers to particular movements, so a higher number isn’t a later watch. Omega’s Extract from the Archives gives the date from its own records.`;
  if (row.year == null) return `${fmt(n)}: ${row.note}`;
  const ex = (row.dated_examples || []).map((x: any) => `${fmt(x.serial)}: ${x.date}`).join('; ');
  const ys = [row.year, row.alt_year || row.year], a = Math.min(...ys), b = Math.max(...ys);
  return [{ maker: 'Omega', what: 'Movement serial', big: a === b ? `c. ${a}` : `${a}–${b}`, lines: [...(a === b ? [] : [`${row.year} by one list, ${row.alt_year} by the other`]), ...(row.note ? [row.note] : []), ...(ex ? [`Dated examples in this block: ${ex}`] : []), 'This dates the movement, to a year or two. It doesn’t say the watch is original or genuine.'] }];
}

function pocket(rows: any[], maker: string, input: string): Reading[] | string {
  const digits = input.replace(/[^\d]/g, '');
  if (/[a-z]/i.test(input)) return 'A pocket-watch movement serial is digits only.';
  if (digits.length < 3) return 'Keep typing: movement serials are longer than this.';
  const mine = rows.filter((r) => r.maker === maker).sort((a, b) => a.serial_start - b.serial_start);
  const n = Number(digits), last = mine[mine.length - 1];
  const row = mine.find((x) => n >= x.serial_start && (x.serial_end == null || n <= x.serial_end)) || (last && last.serial_end == null && n >= last.serial_start ? last : null);
  if (!row) return `${maker}’s list doesn’t cover ${fmt(n)}. Its table runs from ${fmt(mine[0].serial_start)}; check the maker named on the movement, and that this is the movement’s number, not the case’s.`;
  const ys = [row.year, row.alt_year || row.year], a = Math.min(...ys), b = Math.max(...ys);
  return [{ maker, what: 'Movement serial', big: a === b ? `c. ${a}` : `${a}–${b}`, lines: [...(a === b ? [] : [`${row.year} by the standard list, ${row.alt_year} by another`]), 'Serial-year lists are approximate: movements were made in blocks and finished as needed.'] }];
}

export default function WatchReader({ places, pocketMakers }: Props) {
  const makers = ['Rolex', 'Omega', ...pocketMakers];
  const [n, setN] = useState('');
  const [maker, setMaker] = useState('');
  const [tables, setTables] = useState<{ rolex: any; omega: any; watches: any[] } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setN(p.get('n') ?? '');
    const m = p.get('maker');
    if (m && makers.includes(m)) setMaker(m);
    Promise.all([load('rolex'), load('omega'), load('watches')]).then(([rolex, omega, watches]) => setTables({ rolex, omega, watches }));
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (n.trim()) p.set('n', n.trim());
    if (maker) p.set('maker', maker);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [n, maker]);

  // Every maker's reading of the number; with a maker named, only that one (and its message if it can't read it).
  const result = useMemo(() => {
    const raw = n.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!raw || !tables) return { readings: [] as Reading[], notes: [] as string[] };
    // A dot or a dash belongs to a model reference (ST 145.022, 2915-1), not a serial.
    if (!maker && /[.\-]/.test(n)) return { readings: [] as Reading[], notes: ['This looks like a model reference, not a serial: a dot or a dash, as in ST 145.022 or 2915-1, belongs to the number that names the model. Look for the serial in the places shown below.'] };
    const ask = maker ? [maker] : makers;
    const readings: Reading[] = [], notes: string[] = [];
    for (const m of ask) {
      const r = m === 'Rolex' ? rolex(tables.rolex, raw) : m === 'Omega' ? omega(tables.omega, n) : pocket(tables.watches, m, n);
      // With no maker named, a block the lists give no year for is left out: it reads nothing.
      if (typeof r === 'string') { if (maker) notes.push(r); } else readings.push(...(maker ? r : r.filter((x) => x.big !== '?')));
    }
    // Four or five figures is how Rolex writes a model reference (the reference record's own examples, 16234 and 5513).
    if ((!maker || maker === 'Rolex') && /^\d{4,5}$/.test(raw)) notes.unshift('On a Rolex, four or five figures is usually the model reference, such as 16234 or 5513: the number between the lugs at 12 o’clock. The serial is between the lugs at 6.');
    if (!maker && !readings.length) notes.push(raw.length < 4 ? 'Keep typing.' : 'No table reads this number. Name the maker to see why.');
    return { readings, notes };
  }, [n, maker, tables]);

  const showPlaces = maker === 'Rolex' || maker === 'Omega' ? places.filter((p) => p.maker === maker) : !maker ? places : [];

  return (
    <div class="wx">
      <div class="wx__reader">
        <label class="wx__field">
          <span class="wx__label">The number on the watch</span>
          <input type="text" autoComplete="off" autoCapitalize="characters" spellcheck={false} placeholder="R123456, 1234567, 18245102" value={n} onInput={(e) => setN((e.target as HTMLInputElement).value)} />
        </label>
        <div class="px__makers" role="group" aria-label="The name on the dial or movement">
          <button type="button" aria-pressed={!maker} onClick={() => setMaker('')}>Any maker</button>
          {makers.map((m) => <button type="button" aria-pressed={maker === m} onClick={() => setMaker(maker === m ? '' : m)}>{m}</button>)}
        </div>
      </div>

      <section class="wx__out" aria-live="polite">
        {!n.trim() ? <p class="muted">Type the serial and every table that can read it answers. Name the maker on the dial or movement to settle it.</p>
          : !tables ? <p class="muted">Loading the tables…</p>
          : (
            <>
              {result.notes.map((x) => <p class="wx__note">{x}</p>)}
              {result.readings.length > 1 && !maker && <p class="wx__many"><strong>{result.readings.length} readings.</strong> The same number means different years to different makers: name the maker on the dial or movement.</p>}
              <ol class="wx__hits">
                {result.readings.map((r) => (
                  <li class="wx__hit">
                    <span class="wx__big num">{r.big}</span>
                    <span class="wx__text">
                      <span class="wx__what"><strong>{r.maker}</strong> · {r.what}</span>
                      {r.lines.map((l) => <span class="wx__line">{l}</span>)}
                    </span>
                    {!maker && <button type="button" class="link" onClick={() => setMaker(r.maker)}>It is {r.maker}</button>}
                  </li>
                ))}
              </ol>
            </>
          )}
      </section>

      {showPlaces.length > 0 && (
        <section class="wx__places" aria-labelledby="where">
          <h2 id="where">Which number is the serial{maker ? ` on ${maker === 'Omega' ? 'an' : 'a'} ${maker}` : ''}</h2>
          <ol class="wx__grid">
            {showPlaces.map((p) => (
              <li class={`wplace${p.serial === true ? ' is-serial' : p.serial === false ? ' is-not' : ''}`}>
                <span class="plate plate--print wplace__img">{p.img ? <img src={media(p.img)} alt={p.name} loading="lazy" decoding="async" /> : null}</span>
                <span class="wplace__tag">{p.serial === true ? 'Serial: dates it' : p.serial === false ? 'Not a serial' : p.maker}</span>
                <span class="wplace__name">{p.name}</span>
                {p.years && <span class="wplace__years num">{p.years}</span>}
                <span class="wplace__means">{p.means}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
