/** @jsxImportSource preact */
// The Korean inscription explorer: every recorded inscription and maker's mark
// on Korean ceramics (and the workshops' marks on metal), on one timeline from
// Goryeo to the present. Type what you see (hanja, hangul, or a romanized
// name in either spelling), or pick the characters, or narrow to a ware; the
// inscriptions that fit stay lit. One opens in place: what it names, when it
// was used, how it was applied and where, what it tells you, the copies to
// watch for, museum photographs, and every source.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Insc, Group } from '../lib/korean';

type Props = { rows: Insc[]; groups: Group[] };
const HAN = /[\u3400-\u9FFF\uF900-\uFAFF]/;
const HANGUL = /[가-힣]/;
// Forms a reader may type for the characters Korean inscriptions are written in
// (simplified Chinese and Japanese shinjitai → the traditional forms used on the wares).
const TRAD: Record<string, string> = {
  尚: '尙', 内: '內', 兴: '興', 库: '庫', 宫: '宮', 寿: '壽', 礼: '禮', 宾: '賓', 黄: '黃', 别: '別', 进: '進', 药: '藥', 赡: '贍', 资: '資',
  宁: '寧', 敬: '敬', 东: '東', 嫔: '嬪', 万: '萬', 福: '福', 禄: '祿', 庆: '慶', 阳: '陽', 晋: '晉', 陕: '陜', 灵: '靈', 盐: '鹽', 丰: '豐', 恵: '惠',
};
const norm = (s: string) => [...s.normalize('NFC')].map((c) => TRAD[c] ?? c).join('');
/** Romanized forms compared without diacritics, apostrophes, hyphens or spaces: Changhŭng-go → changhunggo. */
const latin = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const KIND: Record<string, string> = {
  'government office': 'Offices', 'place + office': 'Places with an office', 'place name': 'Places', 'palace hall': 'Palace halls',
  'character mark': 'Single characters', date: 'Dates', 'ritual use': 'Ritual use', dedication: 'Dedications', craftsman: 'Craftsmen',
  "maker's mark": 'Makers', other: 'Other',
};
const yearsOf = (r: Insc) => (r.from == null ? '' : r.to == null || r.to === r.from ? String(r.from) : `${r.from}–${r.to}`);

export default function KoreanExplorer({ rows, groups }: Props) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const bySlug = useMemo(() => new Map(rows.map((r) => [r.slug, r])), [rows]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const m = p.get('mark') ?? location.hash.replace(/^#/, '');
    if (m && bySlug.has(m)) setOpen(bySlug.get(m)!.id);
    const g = p.get('ware');
    if (g && groups.some((x) => x.id === g)) setGroup(g);
    const c = p.get('chars');
    if (c) setPicked([...norm(c)].filter((x) => HAN.test(x)));
    const qq = p.get('q');
    if (qq) setQ(qq);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    const r = rows.find((x) => x.id === open);
    if (r) p.set('mark', r.slug);
    if (group) p.set('ware', group);
    if (picked.length) p.set('chars', picked.join(''));
    if (q.trim()) p.set('q', q.trim());
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [open, group, picked, q]);

  const typed = norm(q);
  const typedHan = [...typed].filter((c) => HAN.test(c));
  const typedHangul = typed.replace(/[^가-힣]/g, '');
  const typedLatin = latin(typed.replace(/[\u3400-\u9FFF\uF900-\uFAFF가-힣]/g, ''));
  const want = [...new Set([...picked, ...typedHan])];
  const query = want.length > 0 || typedHangul.length > 0 || typedLatin.length > 1;
  const active = query || !!group;

  const fits = (r: Insc) => {
    if (group && r.group !== group) return false;
    if (want.length && !want.every((c) => r.glyphs.includes(c))) return false;
    if (typedHangul && !(r.hangul ?? '').replace(/\s/g, '').includes(typedHangul) && !r.keys.some((k) => k.replace(/\s/g, '').includes(typedHangul))) return false;
    if (typedLatin.length > 1) {
      const names = [r.rr, r.mr ?? '', ...r.keys.filter((k) => !HAN.test(k) && !HANGUL.test(k))].map(latin);
      const words = latin(r.meaning + ' ' + (r.maker ?? '') + ' ' + (r.place ?? ''));
      if (!names.some((n) => n.includes(typedLatin)) && !(typedLatin.length > 3 && words.includes(typedLatin))) return false;
    }
    return true;
  };
  const lit = useMemo(() => new Set(rows.filter(fits).map((r) => r.id)), [rows, want.join(''), typedHangul, typedLatin, group]);
  const possible = useMemo(() => new Set(rows.filter(fits).flatMap((r) => r.glyphs)), [lit]);
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  // The palette: each inscription's characters once, grouped by what they name.
  const palette = useMemo(() => {
    const seen = new Set<string>();
    const by = new Map<string, { chars: string[]; label: string }[]>();
    for (const r of rows) {
      const cs = [...r.chars].filter((c) => HAN.test(c));
      const key = cs.join('');
      if (!cs.length || cs.length > 6 || seen.has(key)) continue;
      seen.add(key);
      const k = KIND[r.kind] ?? 'Other';
      (by.get(k) ?? by.set(k, []).get(k)!).push({ chars: cs, label: r.rr });
    }
    return Object.values(KIND).filter((k, i, a) => a.indexOf(k) === i && by.has(k)).map((k) => ({ kind: k, items: by.get(k)! }));
  }, [rows]);

  const span = [900, 2000];
  const x = (y: number) => ((Math.max(span[0], Math.min(span[1], y)) - span[0]) / (span[1] - span[0])) * 100;
  const n = lit.size;
  const shown = rows.filter((r) => lit.has(r.id));

  return (
    <div class="rx kx">
      <div class="rx__bar" role="search">
        <label class="rx__q">
          <span class="visually-hidden">The characters on the item, in hanja or hangul, or a name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type what is written (長興庫, 장흥고) or a name (Changhŭnggo, Haegang)" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <button type="button" class={`btn rx__pick${showPalette ? ' is-on' : ''}`} aria-expanded={showPalette} onClick={() => setShowPalette(!showPalette)}>
          {showPalette ? 'Hide the characters' : 'Pick the characters you see'}
        </button>
        <div class="rx__dyn kx__groups" role="group" aria-label="Ware">
          <button type="button" aria-pressed={group === ''} onClick={() => setGroup('')}>All</button>
          {groups.map((g) => <button type="button" aria-pressed={group === g.id} onClick={() => setGroup(group === g.id ? '' : g.id)}>{g.short}</button>)}
        </div>
        <p class="rx__sum" aria-live="polite">
          {!active ? `${rows.length} inscriptions and marks, from Goryeo to the present. Type or pick what is written on the item.`
            : n === 0 ? 'Nothing recorded has all of these. Check a character, or pick fewer.'
            : n === 1 ? `One fits: ${shown[0].rr} ${shown[0].chars}.`
            : `${n} fit.`}
          {(picked.length > 0 || q || group) && <> <button type="button" class="link" onClick={() => { setPicked([]); setQ(''); setGroup(''); }}>Clear</button></>}
        </p>
      </div>

      {showPalette && (
        <div class="rx__palette kx__palette">
          {palette.map((p) => (
            <div class="kx__pgroup">
              <h3>{p.kind}</h3>
              <div class="rx__pairs">
                {p.items.map((it) => (
                  <span class="pair">
                    <span class="pair__chars">
                      {it.chars.map((c) => (
                        <button type="button" class="glyph" aria-pressed={picked.includes(c)} disabled={!picked.includes(c) && !possible.has(c)} onClick={() => toggle(c)} aria-label={`${c}, in ${it.label}`}>
                          <span class="han">{c}</span>
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
                  <span class="plate plate--print fit__mark">{r.photos[0] ? <img src={`/${r.photos[0].file}`} alt={r.photos[0].label} /> : <Chars r={r} size="lg" />}</span>
                  <span class="fit__text">
                    <span class="fit__name">{r.rr} <span class="han">{r.chars}</span></span>
                    <span class="num muted">{[yearsOf(r), groups.find((g) => g.id === r.group)?.name].filter(Boolean).join(' · ')}</span>
                    <span class="fit__line">{r.meaning}</span>
                    <span class="fit__open">Open {r.rr} →</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div class="kx__timeline" role="img" aria-label="When each inscription was in use, 900 to 2000">
        {groups.map((g) => (
          <div class="kx__lane">
            <span class="kx__lane-name">{g.short}</span>
            <div class="kx__lane-bar">
              <span class={`kx__era kx__era--${g.id}`} style={{ left: `${x(g.start)}%`, width: `${x(g.end) - x(g.start)}%` }} />
              {rows.filter((r) => r.group === g.id && r.from != null).map((r) => (
                <button type="button" class={`kx__seg kx__seg--${g.id}${active && !lit.has(r.id) ? ' is-dim' : ''}${open === r.id ? ' is-open' : ''}`}
                  style={{ left: `${x(r.from!)}%`, width: `max(3px, ${x((r.to ?? r.from!) + 1) - x(r.from!)}%)` }}
                  title={`${r.rr} ${r.chars}, ${yearsOf(r)}`} aria-label={`${r.rr}, ${yearsOf(r)}`} onClick={() => setOpen(r.id)} />
              ))}
            </div>
          </div>
        ))}
        <div class="timeline__ticks num kx__ticks">{[1000, 1200, 1400, 1600, 1800, 2000].map((y) => <span style={{ left: `${x(y)}%` }}>{y}</span>)}</div>
      </div>

      {groups.map((g) => {
        const rs = rows.filter((r) => r.group === g.id);
        if (!rs.length || (group && group !== g.id)) return null;
        return (
          <section class="rx__group" aria-labelledby={`g-${g.id}`}>
            <h2 class="rx__dynasty" id={`g-${g.id}`}>{g.name} <span class="num muted">{g.start}–{g.end === 2000 ? 'today' : g.end}</span></h2>
            {g.blurb && <p class="kx__blurb">{g.blurb}</p>}
            <ol class="rx__grid kx__grid">
              {rs.map((r) => (
                <li id={r.slug}>
                  <button type="button" class={`rcard kcard${query && !lit.has(r.id) ? ' is-dim' : ''}${query && lit.has(r.id) ? ' is-lit' : ''}`} onClick={() => setOpen(r.id)}>
                    <span class="plate plate--print rcard__mark">
                      {r.photos[0] && r.photos[0].visible === 'yes' ? <img src={`/${r.photos[0].file}`} alt={r.photos[0].label} loading="lazy" decoding="async" /> : <Chars r={r} />}
                    </span>
                    <span class="rcard__name">{r.rr}</span>
                    <span class="kcard__means">{r.meaning.length > 70 ? `${r.meaning.slice(0, 69).trimEnd()}…` : r.meaning}</span>
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

/** The characters as the inscription gives them, set in type (not a picture of the writing). */
function Chars({ r, size = 'md' }: { r: Insc; size?: 'md' | 'lg' }) {
  const cs = [...r.chars].filter((c) => HAN.test(c) || HANGUL.test(c));
  if (!cs.length) return <span class="muted kx__noc">{r.chars || r.rr}</span>;
  return <span class={`kx__chars kx__chars--${size}${cs.length > 4 ? ' is-long' : ''}`} lang="ko" aria-label={r.chars}>{cs.join('')}</span>;
}

function Panel({ rows, groups, id, onOpen, onClose, order }: { rows: Insc[]; groups: Group[]; id: string; onOpen: (id: string) => void; onClose: () => void; order: Insc[] }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const r = rows.find((x) => x.id === id) ?? null;
  const i = order.findIndex((x) => x.id === id);
  const prev = i > 0 ? order[i - 1] : null;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
  const [factsOpen, setFactsOpen] = useState(false);
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
    <dialog ref={dlg} class="panel rpanel" aria-label={r ? `${r.rr} ${r.chars}` : 'Inscription'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {r && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)} aria-label={prev ? `Previous: ${prev.rr}` : 'None before'}>← {prev?.rr ?? ''}</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)} aria-label={next ? `Next: ${next.rr}` : 'None after'}>{next?.rr ?? ''} →</button>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{[g?.name, r.kind === "maker's mark" ? "Maker's mark" : (KIND[r.kind] ?? r.kind).replace(/s$/, '').replace(/^Offic$/, 'Office').replace(/^Palace hall$/, 'Palace hall')].filter(Boolean).join(' · ')}</p>
          <h2 class="panel__name"><span class="han kx__big" lang="ko">{r.chars}</span></h2>
          <p class="kx__names">
            <strong>{r.rr}</strong>
            {r.mr && r.mr !== r.rr && <span> · {r.mr}</span>}
            {r.hangul && <span lang="ko" class="kx__hangul"> · {r.hangul}</span>}
          </p>
          {r.variants.length > 0 && <p class="kx__variants">Also written <span class="han" lang="ko">{r.variants.join('、')}</span></p>}
          <p class="panel__summary">{r.meaning}</p>
          {yearsOf(r) && <p class="panel__years num">{yearsOf(r)}{r.dateNote && <span class="muted"> · {r.dateNote}</span>}</p>}
          <dl class="kx__dl">
            {r.wares.length > 0 && <><dt>On</dt><dd>{r.wares.join(', ')}</dd></>}
            {r.technique && <><dt>How</dt><dd>{r.technique}</dd></>}
            {r.where && <><dt>Where</dt><dd>{r.where}</dd></>}
            {r.maker && <><dt>Maker</dt><dd>{r.maker}</dd></>}
            {r.place && <><dt>Place</dt><dd>{r.place}</dd></>}
          </dl>
          {r.tells && <p class="kx__tells"><strong>What it tells you.</strong> {r.tells}</p>}
          {r.cautions && <p class="rcopies"><strong>Watch for.</strong> {r.cautions}</p>}

          {r.photos.length > 0 && (
            <section class="rphotos">
              <h3>In museum collections</h3>
              <ul>
                {r.photos.map((p) => (
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

          {r.facts.length > 0 && (
            <section class="rfactsx">
              <h3>The evidence <span class="muted num">{r.facts.length}</span></h3>
              <ul>
                {(factsOpen ? r.facts : r.facts.slice(0, 5)).map((f) => (
                  <li>{f.text} <span class="faint">({f.single || f.sources.length === 1 ? 'one source' : `${f.sources.length} sources`})</span></li>
                ))}
              </ul>
              {r.facts.length > 5 && !factsOpen && <button type="button" class="link" onClick={() => setFactsOpen(true)}>All {r.facts.length}</button>}
            </section>
          )}

          {r.singleSource && <p class="panel__warn">Part of this record rests on one source only.</p>}
          <details class="rsources">
            <summary>Sources <span class="muted num">{r.sources.length}</span></summary>
            <ol>{r.sources.map((s) => <li>{s.url ? <a href={s.url} rel="nofollow noopener">{s.citation}</a> : s.citation}</li>)}</ol>
          </details>
          <p class="panel__actions">
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}?mark=${r.slug}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
