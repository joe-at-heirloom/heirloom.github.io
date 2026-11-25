/** @jsxImportSource preact */
// The Japanese marks explorer: every recorded mark, seal, signature and crest
// on Japanese porcelain and pottery, woodblock prints, cloisonné, bronze and
// silver, each on a timeline of when it was used. Type what you see (kanji or
// kana, old or new forms, or a name in romaji with or without the long marks),
// or pick the characters, or narrow to a kind of object; the marks that fit
// stay lit. One opens in place: what it names, when it was used, how and where
// it was applied, what it tells you, the copies to watch for, pictures, and
// every source.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JaCard as JaMark, JaDetails, Group, Family } from '../lib/japanese';
import { toShinjitai } from '../lib/japanese-dates';

type Props = { rows: JaMark[]; groups: Group[]; families: Family[] };
const JA = /[぀-ヿ㐀-鿿豈-﫿]/;
const norm = (s: string) => toShinjitai(s.normalize('NFC'));
/** Romaji compared without long marks, apostrophes, hyphens or spaces: Kinkōzan → kinkozan, Kin-kozan → kinkozan. */
const latin = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ou/g, 'o').replace(/[^a-z0-9]/g, '');
const yearsOf = (r: JaMark) => (r.from == null ? '' : r.to == null ? `${r.from} on` : r.to === r.from ? String(r.from) : `${r.from}–${r.to}`);
const nameOf = (r: JaMark) => r.romaji || r.romajiPlain || r.chars;
const KIND: Record<string, string> = {
  "maker's mark": "Maker's mark", 'kiln mark': 'Kiln mark', 'studio or painting-house mark': 'Studio mark', "painter's or artist's signature": 'Signature',
  "artist's seal": "Artist's seal", 'place name': 'Place name', 'era mark': 'Era mark', 'auspicious mark': 'Auspicious mark',
  'Chinese reign mark on a Japanese object': 'Chinese reign mark, as Japanese kilns wrote it', 'censor seal': 'Censor seal', 'date seal': 'Date seal',
  "publisher's seal": "Publisher's seal", "carver's or printer's seal": "Carver's or printer's seal", crest: 'Crest', 'purity mark': 'Silver mark',
  "retailer's or exporter's mark": "Retailer's or exporter's mark", 'country-of-origin mark': 'Country mark', other: 'Other',
};

export default function JapaneseExplorer({ rows, groups, families }: Props) {
  const [q, setQ] = useState('');
  const [family, setFamily] = useState('');
  const [group, setGroup] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const bySlug = useMemo(() => new Map(rows.map((r) => [r.slug, r])), [rows]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const m = p.get('mark') ?? location.hash.replace(/^#/, '');
    if (m && bySlug.has(m)) setOpen(bySlug.get(m)!.id);
    const f = p.get('kind');
    if (f && families.some((x) => x.id === f)) setFamily(f);
    const g = p.get('group');
    if (g && groups.some((x) => x.id === g)) setGroup(g);
    const c = p.get('chars');
    if (c) setPicked([...norm(c)].filter((x) => JA.test(x)));
    const qq = p.get('q');
    if (qq) setQ(qq);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    const r = rows.find((x) => x.id === open);
    if (r) p.set('mark', r.slug);
    if (family) p.set('kind', family);
    if (group) p.set('group', group);
    if (picked.length) p.set('chars', picked.join(''));
    if (q.trim()) p.set('q', q.trim());
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [open, family, group, picked, q]);

  const glyphs = useMemo(() => new Map(rows.map((r) => [r.id, new Set(r.glyphs.map(norm))])), [rows]);
  const typed = norm(q);
  const typedJa = [...typed].filter((c) => JA.test(c));
  const typedLatin = latin(typed.replace(/[぀-ヿ㐀-鿿豈-﫿]/g, ''));
  const want = [...new Set([...picked, ...typedJa])];
  const query = want.length > 0 || typedLatin.length > 1;
  const active = query || !!family || !!group;
  const visGroups = groups.filter((g) => !family || g.family === family);

  const fits = (r: JaMark) => {
    if (family && r.family !== family) return false;
    if (group && r.group !== group) return false;
    if (want.length && !want.every((c) => glyphs.get(r.id)!.has(c))) return false;
    if (typedLatin.length > 1) {
      const names = [r.romaji, r.romajiPlain ?? '', ...r.spellings].map(latin);
      const words = latin(`${r.meaning} ${r.maker ?? ''} ${r.artist ?? ''}`);
      if (!names.some((n) => n.includes(typedLatin)) && !(typedLatin.length > 3 && words.includes(typedLatin))) return false;
    }
    return true;
  };
  const lit = useMemo(() => new Set(rows.filter(fits).map((r) => r.id)), [rows, want.join(''), typedLatin, family, group]);
  const possible = useMemo(() => new Set(rows.filter(fits).flatMap((r) => [...glyphs.get(r.id)!])), [lit]);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  // The palette: each mark's characters once (short marks only; crests are pictures, not writing).
  const palette = useMemo(() => {
    const seen = new Set<string>();
    return visGroups.filter((g) => g.family !== 'crests').map((g) => ({
      group: g,
      items: rows.filter((r) => r.group === g.id).flatMap((r) => {
        const cs = [...norm(r.chars)].filter((c) => JA.test(c));
        const key = cs.join('');
        if (!cs.length || cs.length > 7 || seen.has(key)) return [];
        seen.add(key);
        return [{ chars: cs, label: nameOf(r) }];
      }),
    })).filter((p) => p.items.length);
  }, [rows, family]);

  const span = [1600, 2030];
  const x = (y: number) => ((Math.max(span[0], Math.min(span[1], y)) - span[0]) / (span[1] - span[0])) * 100;
  const n = lit.size;
  const shown = rows.filter((r) => lit.has(r.id));

  return (
    <div class="rx jx">
      <div class="rx__bar" role="search">
        <label class="rx__q">
          <span class="visually-hidden">The characters on the item, or a name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type what is written (錦光山, 廣重画, 純銀) or a name (Kinkozan, Fukagawa, Watanabe)" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <button type="button" class={`btn rx__pick${showPalette ? ' is-on' : ''}`} aria-expanded={showPalette} onClick={() => setShowPalette(!showPalette)}>
          {showPalette ? 'Hide the characters' : 'Pick the characters you see'}
        </button>
        <div class="rx__dyn jx__groups" role="group" aria-label="Kind of object">
          <button type="button" aria-pressed={family === ''} onClick={() => { setFamily(''); setGroup(''); }}>All</button>
          {families.map((f) => <button type="button" aria-pressed={family === f.id} onClick={() => { setFamily(family === f.id ? '' : f.id); setGroup(''); }}>{f.name}</button>)}
        </div>
        {family && visGroups.length > 1 && (
          <div class="rx__dyn jx__groups jx__sub" role="group" aria-label="Group">
            {visGroups.map((g) => <button type="button" aria-pressed={group === g.id} onClick={() => setGroup(group === g.id ? '' : g.id)}>{g.short}</button>)}
          </div>
        )}
        <p class="rx__sum" aria-live="polite">
          {!active ? `${rows.length} marks, seals, signatures and crests. Type or pick what is written on the item.`
            : n === 0 ? 'Nothing recorded has all of these. Check a character, or pick fewer.'
            : n === 1 ? `One fits: ${nameOf(shown[0])} ${shown[0].chars}.`
            : `${n} fit.`}
          {(picked.length > 0 || q || family || group) && <> <button type="button" class="link" onClick={() => { setPicked([]); setQ(''); setFamily(''); setGroup(''); }}>Clear</button></>}
        </p>
      </div>

      {showPalette && (
        <div class="rx__palette jx__palette">
          {palette.map((p) => (
            <div class="jx__pgroup">
              <h3>{p.group.name}</h3>
              <div class="rx__pairs">
                {p.items.map((it) => (
                  <span class="pair">
                    <span class="pair__chars">
                      {it.chars.map((c) => (
                        <button type="button" class="glyph" aria-pressed={picked.includes(c)} disabled={!picked.includes(c) && !possible.has(c)} onClick={() => toggle(c)} aria-label={`${c}, in ${it.label}`}>
                          <span class="han ja" lang="ja">{c}</span>
                        </button>
                      ))}
                    </span>
                    <span class="pair__name">{it.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {query && n > 0 && n <= 6 && (
        <section class="rx__fits" aria-label="What fits">
          <ol>
            {shown.map((r) => (
              <li>
                <button type="button" class="fit" onClick={() => setOpen(r.id)}>
                  <span class="plate plate--print fit__mark"><Pic r={r} size="lg" /></span>
                  <span class="fit__text">
                    <span class="fit__name">{nameOf(r)} <span class="han ja" lang="ja">{r.chars}</span></span>
                    <span class="num muted">{[yearsOf(r), groups.find((g) => g.id === r.group)?.name].filter(Boolean).join(' · ')}</span>
                    <span class="fit__line">{r.meaning}</span>
                    <span class="fit__open">Open {nameOf(r)} →</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div class="jx__timeline" role="img" aria-label="When each mark was in use, 1600 to today">
        {visGroups.map((g) => (
          <div class="jx__lane">
            <span class="jx__lane-name">{g.short}</span>
            <div class="jx__lane-bar">
              {rows.filter((r) => r.group === g.id && r.from != null).map((r) => (
                <button type="button" class={`jx__seg jx__seg--${g.family}${active && !lit.has(r.id) ? ' is-dim' : ''}${open === r.id ? ' is-open' : ''}`}
                  style={{ left: `${x(r.from!)}%`, width: `max(3px, ${x((r.to ?? Math.max(r.from!, 2025)) + 1) - x(r.from!)}%)` }}
                  title={`${nameOf(r)} ${r.chars}, ${yearsOf(r)}`} aria-label={`${nameOf(r)}, ${yearsOf(r)}`} onClick={() => setOpen(r.id)} />
              ))}
            </div>
          </div>
        ))}
        <div class="timeline__ticks num jx__ticks">{[1600, 1700, 1800, 1900, 2000].map((y) => <span style={{ left: `${x(y)}%` }}>{y}</span>)}</div>
      </div>

      {visGroups.map((g) => {
        const rs = rows.filter((r) => r.group === g.id);
        if (!rs.length || (group && group !== g.id)) return null;
        return (
          <section class="rx__group" aria-labelledby={`g-${g.id}`}>
            <h2 class="rx__dynasty" id={`g-${g.id}`}>{g.name} <span class="num muted">{rs.length}</span></h2>
            <ol class="rx__grid jx__grid">
              {rs.map((r) => (
                <li id={r.slug}>
                  <button type="button" class={`rcard jcard${query && !lit.has(r.id) ? ' is-dim' : ''}${query && lit.has(r.id) ? ' is-lit' : ''}`} onClick={() => setOpen(r.id)}>
                    <span class="plate plate--print rcard__mark"><Pic r={r} /></span>
                    <span class="rcard__name">{nameOf(r)}</span>
                    <span class="jcard__means">{r.meaning.length > 70 ? `${r.meaning.slice(0, 69).trimEnd()}…` : r.meaning}</span>
                    <span class="rcard__years num">{yearsOf(r)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <Panel rows={rows} groups={groups} id={open} onOpen={setOpen} onClose={() => setOpen('')} order={active ? shown : rows} />
    </div>
  );
}

/** A picture of the mark when one shows it; else the characters set in type (not a picture of the writing). */
function Pic({ r, size = 'md' }: { r: JaMark; size?: 'md' | 'lg' }) {
  const p = r.photo;
  if (p) return <img src={`/${p.file}`} alt={`${nameOf(r)}: ${p.label}`} loading="lazy" decoding="async" />;
  const cs = [...r.chars].filter((c) => JA.test(c));
  if (!cs.length || r.family === 'crests') return <span class="muted jx__noc">{r.family === 'crests' ? r.chars : r.chars || nameOf(r)}</span>;
  return <span class={`jx__chars jx__chars--${size}${cs.length > 4 ? ' is-long' : ''}`} lang="ja" aria-label={r.chars}>{cs.join('')}</span>;
}

function Panel({ rows, groups, id, onOpen, onClose, order }: { rows: JaMark[]; groups: Group[]; id: string; onOpen: (id: string) => void; onClose: () => void; order: JaMark[] }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const r = rows.find((x) => x.id === id) ?? null;
  const i = order.findIndex((x) => x.id === id);
  const prev = i > 0 ? order[i - 1] : null;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
  const [factsOpen, setFactsOpen] = useState(false);
  const [all, setAll] = useState<JaDetails | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!r || all) return;
    fetch('/marks/data/japanese-details.json').then((x) => x.json()).then(setAll).catch(() => setFailed(true));
  }, [id]);
  const det = r && all ? all.rows[r.id] ?? null : null;
  const cite = (i: number) => all!.src[i];
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (r && !d.open) d.showModal();
    if (!r && d.open) d.close();
    d.querySelector('.rpanel__in')?.scrollTo({ top: 0 });
    setFactsOpen(false);
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!r) return;
      if (e.key === 'ArrowLeft' && prev) onOpen(prev.id);
      if (e.key === 'ArrowRight' && next) onOpen(next.id);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [id, order]);
  const g = r ? groups.find((x) => x.id === r.group) : null;

  return (
    <dialog ref={dlg} class="panel rpanel" aria-label={r ? `${nameOf(r)} ${r.chars}` : 'Mark'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {r && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)} aria-label={prev ? `Previous: ${nameOf(prev)}` : 'None before'}>← {prev ? nameOf(prev) : ''}</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)} aria-label={next ? `Next: ${nameOf(next)}` : 'None after'}>{next ? nameOf(next) : ''} →</button>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{[g?.name, KIND[r.kind] ?? r.kind].filter(Boolean).join(' · ')}</p>
          <h2 class="panel__name"><span class="han ja jx__big" lang="ja">{r.chars}</span></h2>
          <p class="jx__names">
            <strong>{nameOf(r)}</strong>
            {r.kana && <span lang="ja" class="ja"> · {r.kana}</span>}
            {r.charsNote && <span class="muted"> · {r.charsNote}</span>}
          </p>
          {r.variants.length > 0 && <p class="jx__variants">Also written <span class="han ja" lang="ja">{r.variants.join('、')}</span></p>}
          {(() => {
            // Spellings as written, skipping the name above and the search keys that only differ in case or long marks.
            const seen = new Set([latin(r.romaji), latin(r.romajiPlain ?? '')]);
            const more = r.spellings.filter((s) => { const k = latin(s); if (!k || seen.has(k)) return false; seen.add(k); return /[A-Z]/.test(s); });
            return more.length > 0 && <p class="jx__variants">Also spelled {more.slice(0, 6).join(', ')}</p>;
          })()}
          <p class="panel__summary">{r.meaning}</p>
          {yearsOf(r) && <p class="panel__years num">{yearsOf(r)}</p>}
          {!det && !failed && <p class="muted">Loading the evidence…</p>}
          {failed && <p class="panel__warn">The evidence did not load. Check the connection and open the mark again.</p>}
          {det && (
            <>
              {det.dateNote && <p class="muted jx__datenote">{det.dateNote}</p>}
              <dl class="jx__dl">
                {det.device && <><dt>Looks like</dt><dd>{det.device}</dd></>}
                {r.maker && <><dt>Maker</dt><dd>{r.maker}</dd></>}
                {r.artist && <><dt>Artist</dt><dd>{r.artist}</dd></>}
                {det.wares.length > 0 && <><dt>On</dt><dd>{det.wares.join(', ')}</dd></>}
                {det.technique && <><dt>How</dt><dd>{det.technique}</dd></>}
                {det.where && <><dt>Where</dt><dd>{det.where}</dd></>}
              </dl>
              {det.tells && <p class="jx__tells"><strong>What it tells you.</strong> {det.tells}</p>}
              {det.cautions && <p class="rcopies"><strong>Watch for.</strong> {det.cautions}</p>}

              {det.photos.length > 0 && (
                <section class="rphotos">
                  <h3>{det.photos.every((p) => p.kind === 'crest') ? 'Drawing' : det.photos.every((p) => p.kind === 'book') ? 'In an old book of marks' : 'Pictures'}</h3>
                  <ul>
                    {det.photos.map((p) => (
                      <li>
                        <figure>
                          <span class="plate plate--print"><img src={`/${p.file}`} alt={p.label} loading="lazy" /></span>
                          <figcaption>
                            <span>{p.caption || p.label}</span>
                            <span class="faint">{p.credit}{p.url && <> <a href={p.url} rel="noopener">Source</a></>}</span>
                          </figcaption>
                        </figure>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {det.facts.length > 0 && (
                <section class="rfactsx">
                  <h3>The evidence <span class="muted num">{det.facts.length}</span></h3>
                  <ul>
                    {(factsOpen ? det.facts : det.facts.slice(0, 5)).map((f) => (
                      <li>{f.t} <span class="faint">({f.one ? 'one source' : `${f.s.length} sources`})</span></li>
                    ))}
                  </ul>
                  {det.facts.length > 5 && !factsOpen && <button type="button" class="link" onClick={() => setFactsOpen(true)}>All {det.facts.length}</button>}
                </section>
              )}

              {det.single && <p class="panel__warn">Part of this record rests on one source only.</p>}
              <details class="rsources">
                <summary>Sources <span class="muted num">{det.sources.length}</span></summary>
                <ol>{det.sources.map(cite).map((s) => <li>{s.u ? <a href={s.u} rel="nofollow noopener">{s.c}</a> : s.c}</li>)}</ol>
              </details>
            </>
          )}
          <p class="panel__actions">
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}?mark=${r.slug}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
