/** @jsxImportSource preact */
// The pottery date-code reader: five factories' codes, each read the way it is
// written on the ware. Wedgwood: the three impressed letters. Minton: the sign
// beside the name. Royal Worcester: the sign, letter or figures under the mark
// and the dots round it. Rookwood: the flames round the RP and the numeral under
// it. Sèvres: the letter in the crossed Ls. What fits stays lit on the maker's
// whole chart; any code opens in place with its sources, and Minton's signs
// open beside the ones they are mistaken for.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Code, CodeMaker } from '../lib/codes';

type Props = { makers: CodeMaker[] };
const years = (c: { from: number | null; to: number | null }) =>
  c.from && c.to ? (c.from === c.to ? `${c.from}` : `${c.from}–${c.to}`) : c.from ? `${c.from} on` : c.to ? `to ${c.to}` : '';
const STATUS: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const roman = (s: string) => [...s].reduce((t, ch, i, a) => (ROMAN[ch] < (ROMAN[a[i + 1]] ?? 0) ? t - ROMAN[ch] : t + ROMAN[ch]), 0);

const SERIES: Record<string, Record<string, string>> = {
  wedgwood: { month: 'First character: the month, or the figure 3 or 4', year: 'Last character: the year', mark: 'Marks beside the code' },
  minton: { cypher: 'Year signs', mark: 'The name' },
  worcester: { figures: 'Two figures below the mark', letter: 'A letter below the mark', dots: 'Dots round the mark', star: 'A star below the mark, and dots', sign: 'A sign below the mark', circles: 'Three linked circles, and dots', w: 'W (or R in a circle), and dots', mark: 'The mark' },
  rookwood: { other: 'Without the flames', flames: 'RP and its flames', numeral: 'RP, 14 flames and a Roman numeral' },
  sevres: { letter: 'One letter', double: 'Two letters', mark: 'Before the letters' },
};
const WORCESTER_SIGNS: [string, string][] = [
  ['figures', 'Two figures'], ['letter', 'A letter'], ['none', 'Only dots'], ['star', 'A star'], ['square', 'Open square'],
  ['diamond', 'Open diamond'], ['division', 'Division sign'], ['circles2', 'Two linked circles'], ['circles3', 'Three linked circles'], ['w', 'W or R in a circle'],
];
const HINT: Record<string, string> = {
  wedgwood: 'The three characters impressed beside WEDGWOOD, in the order they read: month, potter, year. One character alone is read as the year letter.',
  minton: 'Find the small sign impressed near MINTON or MINTONS in the chart below. Say which name is there and the signs outside its years fade.',
  worcester: 'Look under the crowned circle for a sign, a letter or two figures, and count the dots round the circle.',
  rookwood: 'Count the flames round the RP monogram. From 1901 a Roman numeral is impressed below it.',
  sevres: 'The letter (or two) painted inside or beside the two crossed Ls.',
};

type State = { code: string; england: boolean; made: boolean; name: string; sign: string; dots: number | null; flames: number | null };
const EMPTY: State = { code: '', england: false, made: false, name: '', sign: '', dots: null, flames: null };

/** What fits, for one maker. */
function solve(mk: CodeMaker, s: State): { lit: Code[]; answer: string; active: boolean } {
  const C = mk.codes;
  const yearsOf = (l: Code[]) => [...new Set(l.map((c) => years(c)).filter(Boolean))];
  const say = (l: Code[], what = '') => {
    const ys = yearsOf(l);
    return ys.length === 0 ? 'Nothing fits. Check the reading.' : ys.length === 1 ? `${what}${ys[0]}.` : `${what}${ys.slice(0, -1).join(', ')} or ${ys[ys.length - 1]}.`;
  };
  if (mk.key === 'wedgwood') {
    const chars = s.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    if (!chars && !s.england && !s.made) return { lit: [], answer: '', active: false };
    const last = chars ? chars[chars.length - 1] : '';
    const first = chars.length >= 2 ? chars[0] : '';
    let ys = C.filter((c) => c.series === 'year' && (!last || c.key === last));
    const firsts = first ? C.filter((c) => c.series === 'month' && c.key === first) : [];
    if (first && !firsts.length) return { lit: [], answer: `No Wedgwood code begins with ${first}: the first character is a month letter or the figure 3 or 4.`, active: true };
    if (firsts.length) ys = ys.filter((y) => firsts.some((f) => y.from! >= f.from! && y.from! <= (f.to ?? 9999)));
    const eng = C.find((c) => c.key === 'england'), made = C.find((c) => c.key === 'made');
    if (s.england && eng?.from) ys = ys.filter((y) => y.from! >= eng.from!);
    if (s.made && made?.from) ys = ys.filter((y) => y.from! >= made.from!);
    const usedFirst = firsts.filter((f) => ys.some((y) => y.from! >= f.from! && y.from! <= (f.to ?? 9999)));
    const month = usedFirst.length === 1 && usedFirst[0].key !== '3' && usedFirst[0].key !== '4' ? `${usedFirst[0].name.split(': ')[1]} ` : '';
    const lit = [...usedFirst, ...ys, ...(s.england && eng ? [eng] : []), ...(s.made && made ? [made] : [])];
    return { lit, answer: ys.length ? say(ys, month) : 'No year fits all of this. Check the letters, or the ENGLAND marks.', active: true };
  }
  if (mk.key === 'minton') {
    if (!s.name) return { lit: [], answer: '', active: false };
    const nm = C.find((c) => c.key === s.name);
    if (!nm) return { lit: [], answer: '', active: false };
    const lit = C.filter((c) => c.series === 'cypher' && c.from! >= (nm.from ?? 0) && c.from! <= (nm.to ?? 9999));
    return { lit: [nm, ...lit], answer: `${s.name === 'mintons' ? 'MINTONS' : 'MINTON'} was impressed ${years(nm)}: ${lit.length} year signs fall in those years.`, active: true };
  }
  if (mk.key === 'worcester') {
    if (!s.sign) return { lit: [], answer: '', active: false };
    let lit: Code[] = [];
    if (s.sign === 'letter' || s.sign === 'figures') {
      const k = s.code.trim();
      if (!k) return { lit: C.filter((c) => c.series === s.sign), answer: s.sign === 'letter' ? 'Type the letter.' : 'Type the two figures.', active: true };
      const pool = C.filter((c) => c.series === s.sign);
      lit = pool.filter((c) => c.key === k);
      if (!lit.length) lit = pool.filter((c) => c.key?.toLowerCase() === k.toLowerCase());
    } else {
      const pool = C.filter((c) => c.key === s.sign);
      lit = s.dots === null ? pool : pool.filter((c) => c.n === s.dots || (c.n === null && s.dots! >= 10));
    }
    return { lit, answer: say(lit), active: true };
  }
  if (mk.key === 'rookwood') {
    const num = s.code.toUpperCase().replace(/[^IVXLCDM]/g, '');
    if (num) {
      if (num.startsWith('MM')) {
        const modern = C.find((c) => c.id === 'rookwood-modern-mm-numeral');
        return { lit: modern ? [modern] : [], answer: `${num} is ${roman(num)}: the full year, on the revived Rookwood.`, active: true };
      }
      const lit = C.filter((c) => c.series === 'numeral' && c.key === num);
      return { lit, answer: lit.length ? say(lit) : `No Rookwood numeral reads ${num}. The numerals run from I to LXVII.`, active: true };
    }
    if (s.flames === null) return { lit: [], answer: '', active: false };
    const lit = C.filter((c) => c.series === 'flames' && c.n === s.flames);
    return { lit, answer: `${say(lit)}${s.flames === 14 ? ' With a Roman numeral below the RP, type it: the numeral gives the year.' : ''}`, active: true };
  }
  const k = s.code.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) return { lit: [], answer: '', active: false };
  const lit = C.filter((c) => (c.series === 'letter' || c.series === 'double') && c.key === k);
  return { lit, answer: lit.length ? `${lit[0].means}` : `No Sèvres date letter is ${k}.`, active: true };
}

export default function CodeReader({ makers }: Props) {
  const [mkKey, setMk] = useState(makers[0].key);
  const [s, setS] = useState<State>(EMPTY);
  const [open, setOpen] = useState('');
  const mk = makers.find((m) => m.key === mkKey) ?? makers[0];
  const set = (p: Partial<State>) => setS((x) => ({ ...x, ...p }));

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const m = p.get('maker');
    if (m && makers.some((x) => x.key === m)) setMk(m);
    const num = (k: string) => (p.get(k) !== null && p.get(k) !== '' ? Number(p.get(k)) : null);
    setS({ code: p.get('code') ?? '', england: p.get('england') === '1', made: p.get('made') === '1', name: p.get('name') ?? '', sign: p.get('sign') ?? '', dots: num('dots'), flames: num('flames') });
    const o = p.get('open');
    if (o && makers.some((x) => x.codes.some((c) => c.id === o))) setOpen(o);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (mkKey !== makers[0].key) p.set('maker', mkKey);
    if (s.code) p.set('code', s.code);
    if (s.england) p.set('england', '1');
    if (s.made) p.set('made', '1');
    if (s.name) p.set('name', s.name);
    if (s.sign) p.set('sign', s.sign);
    if (s.dots !== null) p.set('dots', String(s.dots));
    if (s.flames !== null) p.set('flames', String(s.flames));
    if (open) p.set('open', open);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [mkKey, s, open]);

  const { lit, answer, active } = useMemo(() => solve(mk, s), [mk, s]);
  const litIds = new Set(lit.map((c) => c.id));
  const dated = lit.filter((c) => c.series !== 'mark');
  const pick = (k: string) => { setMk(k); setS(EMPTY); };

  return (
    <div class="cx">
      <div class="cx__makers" role="tablist" aria-label="Maker">
        {makers.map((m) => (
          <button type="button" role="tab" aria-selected={m.key === mkKey} onClick={() => pick(m.key)}>
            <span>{m.label}</span><span class="num muted">{m.from}–{m.to}</span>
          </button>
        ))}
      </div>

      <div class="cx__reader">
        <p class="cx__hint">{HINT[mk.key]}</p>
        <Inputs mk={mk} s={s} set={set} />
        <p class="cx__answer" aria-live="polite">
          {active ? <><strong>{answer}</strong>{dated.length > 0 && dated.length <= 3 && <span class="muted"> {dated.map((c) => c.name).join('; ')}</span>}</> : <span class="muted">{mk.codes.filter((c) => c.series !== 'mark').length} codes, {mk.from} to {mk.to}.</span>}
          {active && <> <button type="button" class="link" onClick={() => setS(EMPTY)}>Start again</button></>}
        </p>
      </div>

      {active && dated.length > 0 && dated.length <= 4 && (
        <section class="px__fits" aria-label="The codes that fit">
          <ol>
            {dated.map((c) => (
              <li>
                <button type="button" class="pcard pcard--big" onClick={() => setOpen(c.id)}>
                  <span class="plate plate--print pcard__img">{c.img ? <img src={`/${c.img.file}`} alt={c.looks || c.name} /> : <span class="cx__key">{c.key ?? ''}</span>}</span>
                  <span class="pcard__text">
                    <span class="pcard__name">{years(c) || c.name}</span>
                    <span class="pcard__years">{c.name}</span>
                    <span class="pcard__line">{c.means}</span>
                    <span class="pcard__open">Open it →</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {mk.series.map((sr) => {
        const list = mk.codes.filter((c) => c.series === sr);
        const ys = list.filter((c) => c.from);
        const span = ys.length ? `${Math.min(...ys.map((c) => c.from!))}–${Math.max(...ys.map((c) => c.to ?? c.from!))}` : '';
        return (
          <section class="cx__series" aria-label={SERIES[mk.key][sr] ?? sr}>
            <h2 class="cx__sname">{SERIES[mk.key][sr] ?? sr} {span && <span class="num muted">{span}</span>}</h2>
            <ol class={`cx__grid cx__grid--${sr}`}>
              {list.map((c) => (
                <li>
                  <button type="button" class={`ctile${active && !litIds.has(c.id) ? ' is-dim' : ''}${active && litIds.has(c.id) ? ' is-lit' : ''}`} onClick={() => setOpen(c.id)} title={c.name}>
                    <span class="plate plate--print ctile__img">{c.img ? <img src={`/${c.img.file}`} alt={c.looks || c.name} loading="lazy" decoding="async" /> : <span class="cx__key">{c.key ?? '—'}</span>}</span>
                    <span class="ctile__cap num">{mk.key === 'wedgwood' && sr === 'month' ? `${c.key}: ${c.name.split(': ')[1] ?? years(c)}` : sr === 'mark' ? c.name : years(c)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <p class="cx__page"><a href={mk.page}>The full {mk.label} page</a></p>
      <CodePanel mk={mk} id={open} onOpen={setOpen} onClose={() => setOpen('')} />
    </div>
  );
}

function Inputs({ mk, s, set }: { mk: CodeMaker; s: State; set: (p: Partial<State>) => void }) {
  const text = (placeholder: string, label: string, max = 6) => (
    <label class="cx__field">
      <span class="visually-hidden">{label}</span>
      <input type="text" inputMode="text" autoComplete="off" autoCapitalize="characters" spellcheck={false} maxLength={max} placeholder={placeholder} value={s.code} onInput={(e) => set({ code: (e.target as HTMLInputElement).value })} />
    </label>
  );
  const stepper = (label: string, value: number | null, max: number, on: (n: number | null) => void) => (
    <div class="cx__count" role="group" aria-label={label}>
      <span>{label}</span>
      <button type="button" aria-label="One fewer" disabled={value === null || value <= 0} onClick={() => on(value === null ? 0 : value - 1)}>−</button>
      <output class="num">{value === null ? '?' : value}</output>
      <button type="button" aria-label="One more" disabled={value !== null && value >= max} onClick={() => on(value === null ? 0 : value + 1)}>+</button>
      {value !== null && <button type="button" class="link" onClick={() => on(null)}>Not sure</button>}
    </div>
  );
  if (mk.key === 'wedgwood') {
    return (
      <div class="cx__inputs">
        {text('AOX, or 3BS', 'The three characters beside WEDGWOOD', 3)}
        <label class="cx__check"><input type="checkbox" checked={s.england} onChange={(e) => set({ england: (e.target as HTMLInputElement).checked })} /> ENGLAND is impressed too</label>
        <label class="cx__check"><input type="checkbox" checked={s.made} onChange={(e) => set({ made: (e.target as HTMLInputElement).checked })} /> MADE IN ENGLAND</label>
      </div>
    );
  }
  if (mk.key === 'minton') {
    return (
      <div class="cx__inputs" role="group" aria-label="The name impressed">
        {[['minton', 'MINTON'], ['mintons', 'MINTONS']].map(([k, l]) => (
          <button type="button" class="chip" aria-pressed={s.name === k} onClick={() => set({ name: s.name === k ? '' : k })}>{l} is impressed</button>
        ))}
      </div>
    );
  }
  if (mk.key === 'worcester') {
    const icon = (k: string) => mk.codes.find((c) => (k === 'figures' || k === 'letter' ? c.series === k : c.key === k) && c.img)?.img?.file;
    // The most dots any record of this sign has, or a range a record gives in words ("10 to 16 dots").
    const maxDots = Math.max(0, ...mk.codes.filter((c) => c.key === s.sign).map((c) => c.n ?? Number(/to (\d+) dots/.exec(c.looks)?.[1] ?? 0)));
    return (
      <div class="cx__inputs cx__inputs--col">
        <div class="cx__signs" role="group" aria-label="Under the crowned circle">
          {WORCESTER_SIGNS.map(([k, l]) => {
            const f = icon(k);
            return (
              <button type="button" class="csign" aria-pressed={s.sign === k} onClick={() => set({ sign: s.sign === k ? '' : k, dots: null, code: '' })}>
                <span class="plate plate--print csign__img">{f ? <img src={`/${f}`} alt="" loading="lazy" /> : null}</span>
                <span>{l}</span>
              </button>
            );
          })}
        </div>
        {(s.sign === 'letter' || s.sign === 'figures') && text(s.sign === 'letter' ? 'The letter, as written (A or a)' : 'The two figures (67)', s.sign === 'letter' ? 'The letter' : 'The two figures', 2)}
        {s.sign && s.sign !== 'letter' && s.sign !== 'figures' && maxDots > 0 && stepper('Dots round the circle', s.dots, maxDots, (n) => set({ dots: n }))}
      </div>
    );
  }
  if (mk.key === 'rookwood') {
    return (
      <div class="cx__inputs">
        {stepper('Flames round the RP', s.flames, 14, (n) => set({ flames: n }))}
        {text('Roman numeral below: XII', 'The Roman numeral below the RP', 8)}
      </div>
    );
  }
  return <div class="cx__inputs">{text('The letter: K, or two: KK', 'The letter in the crossed Ls', 2)}</div>;
}

function CodePanel({ mk, id, onOpen, onClose }: { mk: CodeMaker; id: string; onOpen: (id: string) => void; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const list = mk.codes;
  const i = list.findIndex((c) => c.id === id);
  const c = i >= 0 ? list[i] : null;
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const twins = c ? c.confused.map((y) => list.find((x) => x.series === c.series && x.from === y)).filter((x): x is Code => !!x) : [];
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (c && !d.open) d.showModal();
    if (!c && d.open) d.close();
    d.querySelector('.rpanel__in')?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!c) return;
      if (e.key === 'ArrowLeft' && prev) onOpen(prev.id);
      if (e.key === 'ArrowRight' && next) onOpen(next.id);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [id]);
  return (
    <dialog ref={dlg} class="panel rpanel" aria-label={c ? c.name : 'Code'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {c && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)}>← Earlier</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)}>Later →</button>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{c.kind} · {mk.label}</p>
          <h2 class="panel__name">{c.name}</h2>
          {years(c) && <p class="panel__years num">{years(c)}{c.note && <span class="muted"> · {c.note}</span>}</p>}
          {c.img ? (
            <figure class="panel__fig">
              <div class="plate plate--print panel__plate"><img src={`/${c.img.file}`} alt={c.looks || c.name} /></div>
              <figcaption>{STATUS[c.img.status] ?? ''}{c.img.credit ? `. ${c.img.credit}` : ''}{c.img.url && <> <a href={c.img.url} rel="noopener">Source</a></>}</figcaption>
            </figure>
          ) : <p class="muted">No image of this code yet.</p>}
          {twins.length > 0 && (
            <section class="cx__twins">
              <h3>Easily mistaken for</h3>
              <ul>
                {twins.map((t) => (
                  <li><button type="button" class="ctile" onClick={() => onOpen(t.id)}>
                    <span class="plate plate--print ctile__img">{t.img ? <img src={`/${t.img.file}`} alt={t.looks || t.name} /> : null}</span>
                    <span class="ctile__cap num">{years(t)}</span>
                  </button></li>
                ))}
              </ul>
            </section>
          )}
          <dl class="rfacts">
            {c.looks && <div><dt>Looks like</dt><dd>{c.looks}</dd></div>}
            {c.means && <div><dt>What it gives</dt><dd>{c.means}</dd></div>}
            {c.applied && <div><dt>How it is put on</dt><dd>{c.applied}</dd></div>}
          </dl>
          {c.disagree.length > 0 && (
            <section class="pmark__disagree">
              <h3>Where the sources disagree</h3>
              <ul>{c.disagree.map((d) => <li>{d.who && <strong>{d.who}: </strong>}{d.says}</li>)}</ul>
            </section>
          )}
          {c.single && <p class="panel__warn">Part of this record rests on one source only.</p>}
          {c.sources.length > 0 && (
            <details class="rsources" open>
              <summary>Sources <span class="muted num">{c.sources.length}</span></summary>
              <ol>{c.sources.map((x) => <li>{x.url ? <a href={x.url} rel="nofollow noopener">{x.citation}</a> : x.citation}{x.where ? `, ${x.where}` : ''}</li>)}</ol>
            </details>
          )}
          <p class="panel__actions">
            <a class="btn" href={mk.page}>The {mk.label} page</a>
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}?maker=${mk.key}&open=${c.id}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
