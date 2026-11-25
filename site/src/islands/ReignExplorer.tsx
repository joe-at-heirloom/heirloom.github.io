/** @jsxImportSource preact */
// The Chinese reign-mark explorer: every reign's mark at once, in order, as
// the mark itself (a book facsimile, or the characters set in the mark's own
// columns). Tap the characters you can see on the base, or type them (or a
// name), and the reigns that fit stay lit while the rest fade. A timeline
// from 1368 to 1916 shows the same. A reign opens in place: its marks in
// both scripts, museum examples of the period and later, the kiln-site
// facts, the copies, its sources; arrows step to the next reign.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Reign } from '../lib/reigns';
import { media } from '../lib/media';

type Props = { reigns: Reign[] };
const HAN = /[㐀-鿿豈-﫿]/;
// Simplified forms a reader may give (backend mark-decoders TO_TRADITIONAL).
const TRAD: Record<string, string> = { 乐: '樂', 庆: '慶', 丰: '豐', 绪: '緒', 统: '統', 顺: '順', 万: '萬', 历: '曆', 启: '啟', 祯: '禎', 宪: '憲', 制: '製', 歷: '曆', 啓: '啟', 熙: '熙' };
const trad = (s: string) => [...s].map((c) => TRAD[c] ?? c).join('');
const COMMON: [string, string][] = [['大', 'great'], ['明', 'Ming'], ['清', 'Qing'], ['年', 'period'], ['製', 'made'], ['御', 'imperial'], ['造', 'made']];
const DYN = ['Ming', 'Qing', 'Hongxian'];

/** The characters in the mark's own layout: columns read top to bottom, taken right to left. */
export function MarkSet({ chars, size = 'md' }: { chars: string; size?: 'sm' | 'md' | 'lg' }) {
  const cs = [...chars].filter((c) => HAN.test(c));
  const rows = cs.length === 6 ? 3 : cs.length === 4 ? 2 : cs.length;
  const cols: string[][] = [];
  for (let i = 0; i < cs.length; i += rows) cols.push(cs.slice(i, i + rows));
  return (
    <span class={`markset markset--${size}`} aria-label={chars} role="img">
      {cols.map((col) => <span class="markset__col">{col.map((c) => <span>{c}</span>)}</span>)}
    </span>
  );
}

function cardImage(r: Reign) {
  return r.fax.find((f) => f.script === 'regular' && f.count === 6) ?? r.fax.find((f) => f.script === 'regular') ?? r.fax[0] ?? null;
}

export default function ReignExplorer({ reigns }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [dyn, setDyn] = useState('');
  const [open, setOpen] = useState('');
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const r = p.get('reign');
    if (r && reigns.some((x) => x.id === `reign-${r}`)) setOpen(`reign-${r}`);
    const c = p.get('chars');
    if (c) setPicked([...trad(c)].filter((x) => HAN.test(x)));
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (open) p.set('reign', open.replace(/^reign-/, ''));
    if (picked.length) p.set('chars', picked.join(''));
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [open, picked]);

  const typedHan = [...trad(q)].filter((c) => HAN.test(c));
  const latin = q.replace(/[㐀-鿿豈-﫿]/g, '').trim().toLowerCase().replace(/[^a-z]/g, '');
  const want = [...new Set([...picked, ...typedHan])];
  const active = want.length > 0 || latin.length > 0 || !!dyn;

  const fits = (r: Reign) => {
    if (dyn && r.dynasty !== dyn) return false;
    if (want.length && !want.every((c) => r.glyphs.includes(c))) return false;
    if (latin && !(r.pinyin.toLowerCase().startsWith(latin) || r.spellings.some((s) => s.replace(/[^a-z]/g, '').startsWith(latin)))) return false;
    return true;
  };
  const lit = useMemo(() => new Set(reigns.filter(fits).map((r) => r.id)), [reigns, want.join(''), latin, dyn]);

  // The palette: the characters every mark shares, then each reign's two.
  const palette = useMemo(() => reigns.map((r) => ({ id: r.id, pinyin: r.pinyin, chars: [...r.chars] })), [reigns]);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  // Characters still possible given what is picked: tapping one that fits nothing is not offered.
  const possible = useMemo(() => new Set(reigns.filter(fits).flatMap((r) => r.glyphs)), [lit]);

  const span = [1368, 1916];
  const x = (y: number) => ((y - span[0]) / (span[1] - span[0])) * 100;
  const n = lit.size;

  return (
    <div class="rx">
      <div class="rx__bar" role="search">
        <label class="rx__q">
          <span class="visually-hidden">The characters on the base, or a reign's name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type the characters (大明成化年製) or a name (Kangxi)" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <button type="button" class={`btn rx__pick${showPalette ? ' is-on' : ''}`} aria-expanded={showPalette} onClick={() => setShowPalette(!showPalette)}>
          {showPalette ? 'Hide the characters' : 'Pick the characters you see'}
        </button>
        <div class="rx__dyn" role="group" aria-label="Dynasty">
          {['', ...DYN].map((d) => <button type="button" aria-pressed={dyn === d} onClick={() => setDyn(d)}>{d || 'All'}</button>)}
        </div>
        <p class="rx__sum" aria-live="polite">
          {!active ? `${reigns.length} reigns, 1368 to 1916. Pick or type the characters on the base.`
            : n === 0 ? 'No reign has all of these. Check a character, or pick fewer.'
            : n === 1 ? `One reign fits: ${reigns.find((r) => lit.has(r.id))!.pinyin}.`
            : `${n} reigns fit.`}
          {picked.length > 0 && <> <button type="button" class="link" onClick={() => setPicked([])}>Clear {picked.join(' ')}</button></>}
        </p>
      </div>

      {showPalette && (
          <div class="rx__palette">
            <div class="rx__common">
              {COMMON.map(([c, m]) => (
                <button type="button" class="glyph" aria-pressed={picked.includes(c)} disabled={!picked.includes(c) && !possible.has(c)} onClick={() => toggle(c)}>
                  <span class="han">{c}</span><span class="glyph__m">{m}</span>
                </button>
              ))}
            </div>
            <div class="rx__pairs">
              {palette.map((p) => (
                <span class="pair">
                  {p.chars.map((c) => (
                    <button type="button" class="glyph" aria-pressed={picked.includes(c)} disabled={!picked.includes(c) && !possible.has(c)} onClick={() => toggle(c)} aria-label={`${c}, in ${p.pinyin}`}>
                      <span class="han">{c}</span>
                    </button>
                  ))}
                  <span class="pair__name">{p.pinyin}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      {active && n > 0 && n <= 8 && (
        <section class="rx__fits" aria-label="The reigns that fit">
          <ol>
            {reigns.filter((r) => lit.has(r.id)).map((r) => {
              const im = cardImage(r);
              return (
                <li>
                  <button type="button" class="fit" onClick={() => setOpen(r.id)}>
                    <span class="plate plate--print fit__mark">{im ? <img src={media(im.file)} alt={`${r.pinyin} mark`} /> : <MarkSet chars={r.marks.find((m) => m.count >= 4 && HAN.test(m.chars))?.chars ?? r.chars} size="lg" />}</span>
                    <span class="fit__text">
                      <span class="fit__name">{r.pinyin} <span class="han">{r.chars}</span></span>
                      <span class="num muted">{r.start === r.end ? r.start : `${r.start}–${r.end}`} · {r.dynasty === 'Hongxian' ? 'Hongxian empire' : `${r.dynasty} dynasty`}</span>
                      <span class="fit__line">{r.summary.length > 180 ? `${r.summary.slice(0, 179).trimEnd()}…` : r.summary}</span>
                      <span class="fit__open">Open {r.pinyin} →</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <div class="timeline" role="img" aria-label="The reigns from 1368 to 1916">
        <div class="timeline__bar">
          {reigns.map((r) => (
            <button type="button" class={`seg seg--${r.dynasty.toLowerCase()}${active && !lit.has(r.id) ? ' is-dim' : ''}${open === r.id ? ' is-open' : ''}`}
              style={{ left: `${x(r.start)}%`, width: `max(4px, ${x(r.end + 1) - x(r.start)}%)` }} title={`${r.pinyin} ${r.chars}, ${r.start}–${r.end}`}
              aria-label={`${r.pinyin}, ${r.start} to ${r.end}`} onClick={() => setOpen(r.id)} />
          ))}
        </div>
        <div class="timeline__ticks num">{[1400, 1500, 1600, 1700, 1800, 1900].map((y) => <span style={{ left: `${x(y)}%` }}>{y}</span>)}</div>
      </div>

      {DYN.map((d) => {
        const rs = reigns.filter((r) => r.dynasty === d);
        if (!rs.length) return null;
        return (
          <section class="rx__group" aria-label={`${d} reigns`}>
            <h2 class="rx__dynasty">{d === 'Hongxian' ? 'After the Qing' : `${d} dynasty`} <span class="num muted">{rs[0].start}–{rs[rs.length - 1].end}</span></h2>
            <ol class="rx__grid">
              {rs.map((r) => {
                const im = cardImage(r);
                return (
                  <li id={r.id.replace(/^reign-/, '')}>
                    <button type="button" class={`rcard${active && !lit.has(r.id) ? ' is-dim' : ''}${active && lit.has(r.id) ? ' is-lit' : ''}`} onClick={() => setOpen(r.id)}>
                      <span class="plate plate--print rcard__mark">
                        {im ? <img src={media(im.file)} alt={`${r.pinyin} mark`} loading="lazy" decoding="async" /> : <MarkSet chars={r.marks.find((m) => m.count >= 4 && HAN.test(m.chars))?.chars ?? r.chars} />}
                      </span>
                      <span class="rcard__name">{r.pinyin} <span class="han">{r.chars}</span></span>
                      <span class="rcard__years num">{r.start === r.end ? r.start : `${r.start}–${r.end}`}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <ReignPanel reigns={reigns} id={open} onOpen={setOpen} onClose={() => setOpen('')} />
    </div>
  );
}

function ReignPanel({ reigns, id, onOpen, onClose }: { reigns: Reign[]; id: string; onOpen: (id: string) => void; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const i = reigns.findIndex((r) => r.id === id);
  const r = i >= 0 ? reigns[i] : null;
  const prev = i > 0 ? reigns[i - 1] : null;
  const next = i >= 0 && i < reigns.length - 1 ? reigns[i + 1] : null;
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (r && !d.open) d.showModal();
    if (!r && d.open) d.close();
    d.querySelector('.rpanel__in')?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!r) return;
      if (e.key === 'ArrowLeft' && prev) onOpen(prev.id);
      if (e.key === 'ArrowRight' && next) onOpen(next.id);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [id]);
  const [factsOpen, setFactsOpen] = useState(false);
  useEffect(() => setFactsOpen(false), [id]);

  return (
    <dialog ref={dlg} class="panel rpanel" aria-label={r ? `${r.pinyin} reign` : 'Reign'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {r && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)} aria-label={prev ? `Earlier: ${prev.pinyin}` : 'No earlier reign'}>← {prev?.pinyin ?? ''}</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)} aria-label={next ? `Later: ${next.pinyin}` : 'No later reign'}>{next?.pinyin ?? ''} →</button>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{r.dynasty === 'Hongxian' ? 'Hongxian empire' : `${r.dynasty} dynasty`} reign mark</p>
          <h2 class="panel__name">{r.pinyin} <span class="han">{r.chars}</span></h2>
          <p class="panel__years num">{r.start === r.end ? r.start : `${r.start}–${r.end}`}{r.emperor && <span class="muted"> · {r.emperor}</span>}{r.alt && <span class="muted"> · {r.alt}</span>}</p>

          <section class="rmarks">
            <h3>The marks</h3>
            <ul>
              {r.marks.filter((m) => HAN.test(m.chars) || m.chars.startsWith('(')).map((m) => {
                const fax = r.fax.find((f) => f.count === m.count && f.script === (m.script === 'seal' ? 'seal' : 'regular'));
                return (
                  <li>
                    <span class="plate plate--print rmarks__img">{fax ? <img src={media(fax.file)} alt={`${m.chars}, ${m.script} script`} loading="lazy" /> : HAN.test(m.chars) ? <MarkSet chars={m.chars} size="sm" /> : <span class="muted">{m.chars}</span>}</span>
                    <span class="rmarks__text">
                      <span class="han rmarks__chars">{HAN.test(m.chars) ? m.chars : ''}</span>
                      <span class="rmarks__kind">{m.count ? `${m.count} ${m.count === 1 ? 'character' : 'characters'}, ` : ''}{m.script} script{fax ? ' · book facsimile' : HAN.test(m.chars) ? ' · set in type' : ''}</span>
                      {m.note && <span class="rmarks__note">{m.note}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {r.summary && <p class="panel__summary">{r.summary}</p>}
          {r.copies && <p class="rcopies"><strong>Later copies.</strong> {r.copies}</p>}

          {r.photos.length > 0 && (
            <section class="rphotos">
              <h3>In museum collections</h3>
              <ul>
                {r.photos.map((p) => (
                  <li>
                    <figure>
                      <span class="plate plate--print"><img src={media(p.file)} alt={p.label} loading="lazy" /></span>
                      <figcaption>
                        {p.when && <span class={`when when--${p.when}`}>{p.when === 'period' ? 'Of the period' : 'Later than the mark'}</span>}
                        <span>{p.caption || p.label}</span>
                        <span class="faint">{p.credit}{p.url && <> <a href={p.url} rel="noopener">Source</a></>}</span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.facts.length > 0 && (
            <section class="rfactsx">
              <h3>How specialists date {r.pinyin} wares <span class="muted num">{r.facts.length}</span></h3>
              <ul>
                {(factsOpen ? r.facts : r.facts.slice(0, 4)).map((f) => (
                  <li><strong>{f.topic}.</strong> {f.text} {f.sources.length > 0 && <span class="faint">({f.sources.length === 1 ? 'one source' : `${f.sources.length} sources`})</span>}</li>
                ))}
              </ul>
              {r.facts.length > 4 && !factsOpen && <button type="button" class="link" onClick={() => setFactsOpen(true)}>All {r.facts.length}</button>}
            </section>
          )}

          {r.singleSource && <p class="panel__warn">Part of this record rests on one source only.</p>}
          <details class="rsources">
            <summary>Sources <span class="muted num">{r.sources.length}</span></summary>
            <ol>{r.sources.map((s) => <li>{s.url ? <a href={s.url} rel="nofollow noopener">{s.citation}</a> : s.citation}</li>)}</ol>
          </details>
          <p class="panel__actions">
            <a class="btn" href={`/marks/${r.id.replace(/^reign-/, '')}-mark`}>The full {r.pinyin} page</a>
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}/marks/chinese-reign-marks?reign=${r.id.replace(/^reign-/, '')}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
