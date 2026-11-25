/** @jsxImportSource preact */
// A date-letter specimen sheet: every cycle of one assay office as a band of
// the real letters in their shields. Type the letter you see (or a year) and
// the sheet narrows to the years it could be; open a letter for its year, the
// other marks the table says to expect, its image's source and the sources
// for its year. Rendered on the server too: the whole table is in the HTML.
import { useMemo, useRef, useState, useEffect } from 'preact/hooks';

export type Tile = {
  id: string;
  letter: string;
  case: 'upper' | 'lower' | 'either';
  style: string;
  styleWord: string;
  year: number;
  label: string;
  img: string | null;
  kind: string | null;
  credit: string | null;
  sourceUrl: string | null;
  alt: string;
  note: string | null;
  flagged: boolean;
  rules: number[];
  sources: string[];
};
export type Cycle = { start: number; end: number; label: string; tiles: Tile[] };
type Props = { office: string; cycles: Cycle[]; rules: string[]; styles: { key: string; word: string }[] };

const CASES = [
  { key: 'any', word: 'Either case' },
  { key: 'upper', word: 'Capital' },
  { key: 'lower', word: 'Small' },
];
// A cycle without a J used I in its place, and one without a U used V (London
// 1735 is a V in the U position): the twin only counts where the cycle lacks
// the letter typed.
const TWIN: Record<string, string> = { i: 'j', j: 'i', u: 'v', v: 'u' };
const caseWord = (c: string) => (c === 'upper' ? 'capital' : c === 'lower' ? 'small letter' : 'capital or small letter');

export default function DateLetterSheet({ office, cycles, rules, styles }: Props) {
  const [q, setQ] = useState('');
  const [kase, setKase] = useState('any');
  const [style, setStyle] = useState('any');
  const [open, setOpen] = useState<Tile | null>(null);
  // A link from the Advisor names the letters a mark could be (?show=id,id):
  // the sheet opens showing just those. #<id> opens one letter.
  const [shown, setShown] = useState<Set<string> | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ids = (params.get('show') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const all = new Map(cycles.flatMap((c) => c.tiles.map((t) => [t.id, t] as const)));
    const known = ids.filter((id) => all.has(id));
    if (known.length) setShown(new Set(known));
    const hash = decodeURIComponent(location.hash.slice(1));
    if (all.has(hash)) {
      document.getElementById(hash)?.scrollIntoView({ block: 'center' });
      setOpen(all.get(hash)!);
    }
  }, []);

  const typed = q.trim();
  const yearQ = /^\d{3,4}$/.test(typed) ? Number(typed) : null;
  const letter = yearQ == null ? typed.replace(/[^a-z]/gi, '').slice(0, 1) : '';
  const active = !!letter || yearQ != null || kase !== 'any' || style !== 'any' || !!shown;

  const lettersIn = useMemo(() => new Map(cycles.map((c) => [c.start, new Set(c.tiles.map((t) => t.letter.toLowerCase()))])), [cycles]);
  const match = (t: Tile, cycle: number) => {
    if (shown && !shown.has(t.id)) return false;
    if (yearQ != null) {
      if (yearQ < 1000) return String(t.year).startsWith(String(yearQ));
      // Until 1975 a letter's assay year began in late spring or summer, so a
      // calendar year falls in two letters; from 1975 it is the calendar year.
      return t.year === yearQ || (t.year < 1975 && t.year + 1 === yearQ);
    }
    if (letter) {
      const l = t.letter.toLowerCase(), w = letter.toLowerCase();
      if (l !== w && !(TWIN[w] === l && !lettersIn.get(cycle)!.has(w))) return false;
    }
    if (kase !== 'any' && t.case !== 'either' && t.case !== kase) return false;
    if (style !== 'any' && t.style !== style) return false;
    return true;
  };
  const hits = useMemo(() => (active ? cycles.flatMap((c) => c.tiles.filter((t) => match(t, c.start))) : []), [q, kase, style, shown]);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    const want = open ? `#${open.id}` : '';
    if (location.hash !== want) history.replaceState(null, '', location.pathname + location.search + want);
  }, [open]);

  const total = cycles.reduce((n, c) => n + c.tiles.length, 0);
  let summary = `${total} letters in ${cycles.length} cycles. Type the letter on your silver, or a year.`;
  if (shown && !letter && yearQ == null) {
    summary = `The ${hits.length} ${hits.length === 1 ? 'letter' : 'letters'} Heirloom matched to the mark on your item. The style, the case and the other marks decide between them.`;
  } else if (active) {
    if (hits.length === 0) summary = 'No letter matches. Try either case and any style: worn punches hide the difference.';
    else if (hits.length === 1) summary = `One match: ${hits[0].label}. Check that the style and the other marks agree.`;
    else summary = `${hits.length} possible years. The style, the case and the other marks have to agree before one is certain.`;
  }

  return (
    <div class="dls">
      <div class="dls__bar" role="search" aria-label={`Find a ${office} date letter`}>
        <label class="dls__q">
          <span class="visually-hidden">The letter you see, or a year</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            class="field"
            type="search"
            autoComplete="off"
            autoCapitalize="off"
            spellcheck={false}
            maxLength={4}
            placeholder="Letter or year"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="dls__filters">
        <div class="dls__seg" role="group" aria-label="Case">
          {CASES.map((c) => (
            <button type="button" aria-pressed={kase === c.key} onClick={() => setKase(c.key)}>{c.word}</button>
          ))}
        </div>
        <div class="dls__seg" role="group" aria-label="Style">
          <button type="button" aria-pressed={style === 'any'} onClick={() => setStyle('any')}>Any style</button>
          {styles.map((s) => (
            <button type="button" aria-pressed={style === s.key} onClick={() => setStyle(s.key)}>{s.word}</button>
          ))}
        </div>
        </div>
        <p class="dls__sum" aria-live="polite">{summary}{shown && <> <button type="button" class="dls__clear" onClick={() => { setShown(null); history.replaceState(null, '', location.pathname); }}>Show every letter</button></>}</p>
      </div>

      {cycles.map((c) => {
        const shown = active ? c.tiles.filter((t) => match(t, c.start)) : c.tiles;
        if (active && shown.length === 0) return null;
        const notes = shown.filter((t) => t.note);
        return (
          <section class="band" id={`cycle-${c.start}`} aria-labelledby={`c${c.start}`} key={c.start}>
            <header class="band__head">
              <h3 id={`c${c.start}`} class="num">{c.start === c.end ? c.start : `${c.start}–${c.end}`}</h3>
              <p>{c.label}</p>
            </header>
            <div class="band__body">
              <ol class="band__grid">
                {shown.map((t) => (
                  <li key={t.id} id={t.id}>
                    <button type="button" class={`tile${t.flagged ? ' tile--flag' : ''}${t.note ? ' tile--note' : ''}`} onClick={() => setOpen(t)} aria-label={`${t.label}, ${t.styleWord} ${caseWord(t.case)} ${t.letter}${t.flagged ? ', the sources disagree' : ''}`}>
                      <span class="plate plate--print tile__plate">
                        {t.img ? <img src={t.img} alt="" loading="lazy" decoding="async" /> : <span class={`tile__type tile__type--${t.style}`}>{t.letter}</span>}
                      </span>
                      <span class="tile__year num">{t.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
              {notes.length > 0 && (
                <ul class="band__notes">
                  {notes.map((t) => <li><span class="num">{t.label}</span> {t.note}</li>)}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <dialog ref={dlg} class="sheet" aria-labelledby="sheet-title" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dlg.current) setOpen(null); }}>
        {open && (
          <article class="sheet__in">
            <button class="sheet__x" type="button" aria-label="Close" onClick={() => setOpen(null)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <figure class="sheet__fig">
              <div class="plate plate--print sheet__plate">
                {open.img ? <img src={open.img} alt={open.alt} /> : <span class={`tile__type tile__type--${open.style} sheet__type`}>{open.letter}</span>}
              </div>
              <figcaption class="faint">
                {open.img ? (<>{open.kind}. {open.credit}{open.sourceUrl && <> <a href={open.sourceUrl} rel="noopener">Source</a></>}</>) : 'No image of this letter yet; it is set in a similar typeface.'}
              </figcaption>
            </figure>
            <div class="sheet__text">
              <p class="sheet__kicker">{office} date letter</p>
              <h3 id="sheet-title" class="num">{open.label}</h3>
              <p>{open.styleWord}, {caseWord(open.case)} <strong>{open.letter}</strong>.{open.year < 1975 ? ' The letter covers an assay year, which began in late spring or summer.' : ' From 1975 the letter covers the calendar year.'}</p>
              {open.note && <p class={open.flagged ? 'sheet__warn' : 'sheet__note'}>{open.note}</p>}
              {open.rules.length > 0 && (
                <>
                  <h4>What the other marks can tell you</h4>
                  <ul>{open.rules.map((i) => <li>{rules[i]}</li>)}</ul>
                </>
              )}
              <h4>Sources for this year</h4>
              <p class="faint">{open.sources.join('; ')}</p>
            </div>
          </article>
        )}
      </dialog>
    </div>
  );
}
