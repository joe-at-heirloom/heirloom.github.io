/** @jsxImportSource preact */
// The pottery and porcelain explorer: every maker's marks on one timeline, each
// bar the years a mark was used. Type the words or the picture on the base, or
// say how the mark was put on, and the marks that fit stay lit while the rest
// fade. A maker opens its own lane, spread across the page, with its history
// and the copies to watch for. A mark opens in place: what it looks like and
// means, the years, the image, the sources and where they disagree; arrows step
// through the maker's marks in order.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { PMark, PMaker, How } from '../lib/pottery';
import { media } from '../lib/media';

type Props = { makers: PMaker[]; marks: PMark[]; how: [How, string, string][]; words: string[] };
const NOW = new Date().getFullYear();
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\./g, '');
const years = (m: { from: number | null; to: number | null }) =>
  m.from && m.to ? (m.from === m.to ? `${m.from}` : `${m.from}–${m.to}`) : m.from ? `${m.from} on` : m.to ? `to ${m.to}` : 'Years not recorded';
const startOf = (m: PMark) => m.from ?? (m.to !== null ? m.to - 10 : NOW - 10);
const endOf = (m: PMark) => m.to ?? NOW;
const STATUS: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };

/** Bars of one lane, packed into rows so none overlaps. */
function pack(list: PMark[]) {
  const ends: number[] = [];
  return list.map((m) => {
    let row = ends.findIndex((e) => e < startOf(m) - 1);
    if (row < 0) { row = ends.length; ends.push(0); }
    ends[row] = endOf(m);
    return { m, row };
  });
}

export default function PotteryExplorer({ makers, marks, how, words }: Props) {
  const [q, setQ] = useState('');
  const [hows, setHows] = useState<How[]>([]);
  const [maker, setMaker] = useState('');
  const [open, setOpen] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ(p.get('q') ?? '');
    const mk = p.get('maker');
    if (mk && makers.some((x) => x.key === mk)) setMaker(mk);
    const h = (p.get('how') ?? '').split(',').filter((x) => how.some(([k]) => k === x)) as How[];
    setHows(h);
    const m = p.get('mark');
    if (m && marks.some((x) => x.id === m)) setOpen(m);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (maker) p.set('maker', maker);
    if (hows.length) p.set('how', hows.join(','));
    if (open) p.set('mark', open);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [q, maker, hows, open]);

  const prepared = useMemo(() => marks.map((m) => ({ m, w: m.words.split(/[^a-z0-9&]+/).filter(Boolean) })), [marks]);
  const tokens = norm(q).split(/[^a-z0-9&]+/).filter(Boolean);
  const year = tokens.find((t) => /^\d{4}$/.test(t));
  const textTokens = tokens.filter((t) => t !== year);
  const active = tokens.length > 0 || hows.length > 0;
  const lit = useMemo(() => {
    const out = new Set<string>();
    for (const { m, w } of prepared) {
      if (hows.length && !hows.some((h) => m.how.includes(h))) continue;
      // A short word matches whole (bee, not been); a longer one as the start of a word (sword, swords).
      if (!textTokens.every((t) => w.some((x) => (t.length <= 3 ? x === t || x === `${t}s` : x.startsWith(t))))) continue;
      if (year) { const y = Number(year); if (!(startOf(m) <= y && y <= endOf(m)) || (m.from === null && m.to === null)) continue; }
      out.add(m.id);
    }
    return out;
  }, [prepared, q, hows.join()]);
  const mk = makers.find((x) => x.key === maker) ?? null;
  const shown = mk ? marks.filter((m) => m.maker === mk.label) : marks;
  const litShown = shown.filter((m) => lit.has(m.id));
  const n = active ? litShown.length : shown.length;
  const fitsYears = (() => {
    const l = litShown.filter((m) => m.from || m.to);
    if (!active || !l.length) return '';
    const a = Math.min(...l.map((m) => m.from ?? m.to!)), b = Math.max(...l.map(endOf));
    return a === b ? ` (${a})` : `, used between ${a} and ${b >= NOW ? 'now' : b}`;
  })();
  const toggleHow = (h: How) => setHows((x) => (x.includes(h) ? x.filter((y) => y !== h) : [...x, h]));
  const pickWord = (w: string) => setQ((x) => (norm(x).split(/\s+/).includes(norm(w)) ? x : `${x.trim()} ${w}`.trim()));

  return (
    <div class="px">
      <div class="px__bar" role="search">
        <label class="px__q">
          <span class="visually-hidden">The words or the picture on the base, or a year</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="What the mark says or shows: Made in England, crown, swords, Rozane, 1925" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
          {q && <button type="button" class="px__clear" aria-label="Clear the search" onClick={() => setQ('')}>×</button>}
        </label>
        <div class="px__how" role="group" aria-label="How the mark is put on">
          {how.map(([k, label, hint]) => <button type="button" aria-pressed={hows.includes(k)} title={hint} onClick={() => toggleHow(k)}>{label}</button>)}
        </div>
        <p class="px__sum" aria-live="polite">
          {!active ? (mk ? `${mk.count} ${mk.label} marks, ${mk.from} to ${mk.to >= NOW ? 'now' : mk.to}.` : `${marks.length} marks of ${makers.length} makers. Type what the mark says or shows, or say how it is put on.`)
            : n === 0 ? `No ${mk ? `${mk.label} ` : ''}mark fits all of this. Try fewer words.`
            : n === 1 ? `One mark fits: ${litShown[0].name}, ${litShown[0].maker}${fitsYears}.`
            : `${n} marks fit${fitsYears}.`}
        </p>
      </div>

      <div class="px__words" aria-label="Words often on a base">
        {words.map((w) => <button type="button" class="chip" aria-pressed={norm(q).split(/\s+/).includes(norm(w))} onClick={() => pickWord(w)}>{w}</button>)}
      </div>

      <div class="px__makers" role="group" aria-label="Maker">
        <button type="button" aria-pressed={!maker} onClick={() => setMaker('')}>Every maker</button>
        {makers.map((x) => {
          const c = active ? marks.filter((m) => m.maker === x.label && lit.has(m.id)).length : x.count;
          return <button type="button" aria-pressed={maker === x.key} class={active && !c ? 'is-dim' : ''} onClick={() => setMaker(maker === x.key ? '' : x.key)}>{x.label} <span class="num">{c}</span></button>;
        })}
      </div>

      {active && n > 0 && n <= 8 && (
        <section class="px__fits" aria-label="The marks that fit">
          <ol>{litShown.map((m) => <li><MarkCard m={m} big onOpen={setOpen} /></li>)}</ol>
        </section>
      )}

      <Timeline makers={mk ? [mk] : makers} marks={shown} lit={lit} active={active} open={open} onOpen={setOpen} onMaker={(k) => setMaker(k)} zoom={!!mk} />

      {mk && (
        <section class="px__maker" aria-label={`${mk.label}`}>
          <p class="px__makersum">{mk.summary}</p>
          {mk.cautions.length > 0 && (
            <details class="px__cautions" open>
              <summary>Copies and look-alikes <span class="num muted">{mk.cautions.length}</span></summary>
              <ul>{mk.cautions.map((c) => <li>{c}</li>)}</ul>
            </details>
          )}
          <p><a href={mk.page}>The full {mk.label} page</a></p>
        </section>
      )}

      {(mk ? [mk] : makers).map((x) => {
        const list = marks.filter((m) => m.maker === x.label);
        return (
          <section class="px__group" aria-label={`${x.label} marks`}>
            <h2 class="px__groupname">
              {mk ? `${x.label} marks in order` : <button type="button" class="link" onClick={() => { setMaker(x.key); scrollTo({ top: 0, behavior: 'smooth' }); }}>{x.label}</button>}
              <span class="num muted">{x.from}–{x.to >= NOW ? 'now' : x.to}</span>
            </h2>
            <ol class="px__grid">
              {list.map((m) => <li><MarkCard m={m} dim={active && !lit.has(m.id)} lit={active && lit.has(m.id)} onOpen={setOpen} /></li>)}
            </ol>
          </section>
        );
      })}

      <MarkPanel marks={marks} makers={makers} id={open} onOpen={setOpen} onClose={() => setOpen('')} onMaker={(k) => { setOpen(''); setMaker(k); }} />
    </div>
  );
}

function MarkCard({ m, big, dim, lit, onOpen }: { m: PMark; big?: boolean; dim?: boolean; lit?: boolean; onOpen: (id: string) => void }) {
  return (
    <button type="button" class={`pcard${big ? ' pcard--big' : ''}${dim ? ' is-dim' : ''}${lit ? ' is-lit' : ''}`} onClick={() => onOpen(m.id)}>
      <span class="plate plate--print pcard__img">{m.img ? <img src={media(m.img.file)} alt={m.looks || m.name} loading="lazy" decoding="async" /> : <span class="pcard__none">No image yet</span>}</span>
      <span class="pcard__text">
        <span class="pcard__name">{m.name}</span>
        <span class="pcard__years num">{years(m)}{big && <span class="muted"> · {m.maker}</span>}</span>
        {big && m.looks && <span class="pcard__line">{m.looks}</span>}
        {big && <span class="pcard__open">Open it →</span>}
      </span>
    </button>
  );
}

function Timeline({ makers, marks, lit, active, open, onOpen, onMaker, zoom }: {
  makers: PMaker[]; marks: PMark[]; lit: Set<string>; active: boolean; open: string; onOpen: (id: string) => void; onMaker: (k: string) => void; zoom: boolean;
}) {
  // Every maker: 1700 to 1850 is squeezed into the first fifth, where only the oldest factories are.
  // One maker: its own years, spread across the width.
  const lo = zoom ? Math.floor((Math.min(...makers.map((m) => m.from)) - 5) / 10) * 10 : 1700;
  const hi = zoom ? Math.min(NOW + 2, Math.ceil((Math.max(...makers.map((m) => m.to)) + 5) / 10) * 10) : NOW + 2;
  const x = (y: number) => {
    const v = Math.max(lo, Math.min(hi, y));
    if (zoom) return ((v - lo) / (hi - lo)) * 100;
    return v < 1850 ? ((v - 1700) / 150) * 20 : 20 + ((v - 1850) / (hi - 1850)) * 80;
  };
  const ticks = zoom
    ? Array.from({ length: 12 }, (_, i) => Math.ceil(lo / 10) * 10 + i * Math.max(10, Math.round((hi - lo) / 60) * 10)).filter((y) => y < hi)
    : [1700, 1850, 1900, 1950, 2000];
  return (
    <div class={`ptl${zoom ? ' ptl--zoom' : ''}`}>
      {makers.map((mk) => {
        // Every maker: one line each, the bars over one another. One maker: a row for each overlap, named.
        const mine = marks.filter((m) => m.maker === mk.label);
        const packed = zoom ? pack(mine) : mine.map((m) => ({ m, row: 0 }));
        const rows = Math.max(1, ...packed.map((p) => p.row + 1));
        return (
          <div class="ptl__lane">
            <button type="button" class="ptl__name" onClick={() => onMaker(mk.key)} disabled={zoom}>{mk.label}</button>
            <div class="ptl__track" style={{ height: `calc(${rows} * var(--row))` }}>
              {packed.map(({ m, row }) => (
                <button type="button" class={`pbar${m.from === null ? ' pbar--nofrom' : ''}${m.to === null ? ' pbar--open' : ''}${active && !lit.has(m.id) ? ' is-dim' : ''}${active && lit.has(m.id) ? ' is-lit' : ''}${open === m.id ? ' is-open' : ''}`}
                  style={{ left: `${x(startOf(m))}%`, width: `max(8px, ${x(endOf(m) + 1) - x(startOf(m))}%)`, top: `calc(${row} * var(--row))` }}
                  title={`${m.name}: ${years(m)}`} aria-label={`${m.name}, ${years(m)}`} onClick={() => onOpen(m.id)}>
                  {zoom && <span class="pbar__label">{m.name}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div class="ptl__lane ptl__axis" aria-hidden="true">
        <span />
        <div class="ptl__ticks num">{ticks.map((y) => <span style={{ left: `${x(y)}%` }}>{y}</span>)}</div>
      </div>
    </div>
  );
}

function MarkPanel({ marks, makers, id, onOpen, onClose, onMaker }: { marks: PMark[]; makers: PMaker[]; id: string; onOpen: (id: string) => void; onClose: () => void; onMaker: (k: string) => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const m = marks.find((x) => x.id === id) ?? null;
  const same = m ? marks.filter((x) => x.maker === m.maker) : [];
  const i = m ? same.findIndex((x) => x.id === m.id) : -1;
  const prev = i > 0 ? same[i - 1] : null;
  const next = i >= 0 && i < same.length - 1 ? same[i + 1] : null;
  const mk = m ? makers.find((x) => x.label === m.maker) ?? null : null;
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (m && !d.open) d.showModal();
    if (!m && d.open) d.close();
    d.querySelector('.rpanel__in')?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!m) return;
      if (e.key === 'ArrowLeft' && prev) onOpen(prev.id);
      if (e.key === 'ArrowRight' && next) onOpen(next.id);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [id]);
  // Where this mark sits among the maker's marks.
  const lo = mk ? mk.from : 0, hi = mk ? mk.to : 1;
  const px = (y: number) => ((Math.max(lo, Math.min(hi, y)) - lo) / Math.max(1, hi - lo)) * 100;

  return (
    <dialog ref={dlg} class="panel rpanel" aria-label={m ? m.name : 'Mark'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {m && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)} aria-label={prev ? `Earlier: ${prev.name}` : 'No earlier mark'}>← Earlier</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)} aria-label={next ? `Later: ${next.name}` : 'No later mark'}>Later →</button>
            <span class="muted num pmark__pos">{i + 1} of {same.length}</span>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{m.kind} · {m.maker}</p>
          <h2 class="panel__name">{m.name}</h2>
          <p class="panel__years num">{years(m)}{m.note && <span class="muted"> · {m.note}</span>}</p>
          {mk && (
            <div class="pmark__run" aria-hidden="true">
              {same.map((x) => <span class={`pmark__tick${x.id === m.id ? ' is-on' : ''}`} style={{ left: `${px(startOf(x))}%`, width: `max(4px, ${px(endOf(x) + 1) - px(startOf(x))}%)` }} />)}
              <span class="pmark__ends num"><span>{lo}</span><span>{hi >= NOW ? 'now' : hi}</span></span>
            </div>
          )}
          {m.img ? (
            <figure class="panel__fig">
              <div class="plate plate--print panel__plate"><img src={media(m.img.file)} alt={m.looks || m.name} /></div>
              <figcaption>{STATUS[m.img.status] ?? ''}{m.img.credit ? `. ${m.img.credit}` : ''}{m.img.url && <> <a href={m.img.url} rel="noopener">Source</a></>}</figcaption>
            </figure>
          ) : <p class="muted">No image of this mark yet.</p>}
          <dl class="rfacts">
            {m.looks && <div><dt>Looks like</dt><dd>{m.looks}</dd></div>}
            {m.means && <div><dt>What it means</dt><dd>{m.means}</dd></div>}
            {m.applied && <div><dt>How it is put on</dt><dd>{m.applied}</dd></div>}
            {m.firm && <div><dt>Maker</dt><dd>{m.firm}</dd></div>}
          </dl>
          {m.disagree.length > 0 && (
            <section class="pmark__disagree">
              <h3>Where the sources disagree</h3>
              <ul>{m.disagree.map((d) => <li>{d.who && <strong>{d.who}: </strong>}{d.says}</li>)}</ul>
            </section>
          )}
          {m.single && <p class="panel__warn">Part of this record rests on one source only.</p>}
          {m.sources.length > 0 && (
            <details class="rsources" open>
              <summary>Sources <span class="muted num">{m.sources.length}</span></summary>
              <ol>{m.sources.map((s) => <li>{s.url ? <a href={s.url} rel="nofollow noopener">{s.citation}</a> : s.citation}{s.where ? `, ${s.where}` : ''}</li>)}</ol>
            </details>
          )}
          <p class="panel__actions">
            {mk && <button type="button" class="btn btn--primary" onClick={() => onMaker(mk.key)}>Every {mk.label} mark</button>}
            {mk && <a class="btn" href={mk.page}>The {mk.label} page</a>}
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}?mark=${m.id}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
