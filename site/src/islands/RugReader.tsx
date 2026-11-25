/** @jsxImportSource preact */
// "Turn it over": answer what the back, sides and ends of a rug show (the
// knot, how many knots to the inch, what the warps and wefts are, how many
// wefts run between each row of knots, whether the warps lie level or one
// sinks under the other, the pile) and the types whose structure fits are
// listed, best first, with what fits and what does not. Nothing has to be
// answered; an answer a type's sources do not cover neither counts for nor
// against it. Each type opens its sheet in the catalogue. The page passes the
// types (lib/rugs.ts) and how to look at each feature (rugs.json `dyes.features`).
import { useEffect, useMemo, useState } from 'preact/hooks';
import { media } from '../lib/media';

export type ReaderType = {
  slug: string; name: string; native: string | null; group: string; region: string | null; years: string | null;
  knot: string[]; kpsi: [number, number] | null; warp: string[]; weft: string[]; wefts: number[]; offset: string[]; pile: string[];
  img: string | null;
};
export type Pic = { src: string; alt: string };
export type Question = { id: Key; label: string; how: string[]; options: { value: string; label: string; note?: string | null; img?: Pic | null }[] };
export type Key = 'knot' | 'kpsi' | 'warp' | 'weft' | 'wefts' | 'offset' | 'pile';
type Props = { types: ReaderType[]; questions: Question[]; groups: { id: string; name: string; img?: Pic | null }[] };

const BANDS: Record<string, [number, number]> = { coarse: [0, 60], medium: [60, 150], fine: [150, 300], 'very-fine': [300, 2000] };
const offsetOf = (v: string) => (/deep|fully|strong/.test(v) ? 'depressed' : /half|slight|offset|partly/.test(v) ? 'offset' : /level|flat|none|not/.test(v) ? 'level' : '');
const knotOf = (v: string) => (/jufti/.test(v) ? 'jufti' : /asym|persian|senneh|sehna/.test(v) ? 'asymmetric' : /sym|turkish|ghiordes/.test(v) ? 'symmetric' : /single/.test(v) ? 'single-warp' : /tuft/.test(v) ? 'tufted' : /flat/.test(v) ? 'flatweave' : v);
const fiberOf = (v: string) => (/art silk|viscose|rayon|mercer/.test(v) ? 'art silk' : /silk/.test(v) ? 'silk' : /cotton/.test(v) ? 'cotton' : /goat|camel|hair/.test(v) ? 'hair' : /wool|kork/.test(v) ? 'wool' : v);

/** Does a type fit one answer: true, false, or null when its sources say nothing about it. */
function fits(t: ReaderType, k: Key, v: string): boolean | null {
  switch (k) {
    case 'knot': {
      if (!t.knot.length) return null;
      const ks = t.knot.map((x) => knotOf(x.toLowerCase()));
      // A jufti knot is tied over four warps in either form; a rug of either form may have some.
      return ks.includes(v) || (v === 'jufti' && ks.some((x) => x === 'asymmetric' || x === 'symmetric') ? null : false);
    }
    case 'kpsi': {
      if (!t.kpsi) return null;
      const [a, b] = BANDS[v];
      return t.kpsi[1] >= a && t.kpsi[0] <= b;
    }
    case 'warp': return t.warp.length ? t.warp.map((x) => fiberOf(x.toLowerCase())).includes(v) : null;
    case 'weft': return t.weft.length ? t.weft.map((x) => fiberOf(x.toLowerCase())).includes(v) : null;
    case 'wefts': return t.wefts.length ? (v === '3' ? t.wefts.some((n) => n >= 3) : t.wefts.includes(Number(v))) : null;
    case 'offset': return t.offset.length ? t.offset.map((x) => offsetOf(x.toLowerCase())).includes(v) : null;
    case 'pile': return t.pile.length ? t.pile.map((x) => fiberOf(x.toLowerCase())).includes(v) : null;
  }
}

export default function RugReader({ types, questions, groups }: Props) {
  const [ans, setAns] = useState<Partial<Record<Key, string>>>({});
  const [group, setGroup] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const a: Partial<Record<Key, string>> = {};
    for (const q of questions) { const v = p.get(q.id); if (v && q.options.some((o) => o.value === v)) a[q.id] = v; }
    setAns(a);
    setGroup(p.get('from') ?? '');
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(ans)) if (v) p.set(k, v);
    if (group) p.set('from', group);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [ans, group]);

  const set = (k: Key, v: string) => setAns((a) => ({ ...a, [k]: a[k] === v ? undefined : v }));
  const answered = Object.entries(ans).filter(([, v]) => v) as [Key, string][];
  const scored = useMemo(() => types
    .filter((t) => !group || t.group === group)
    .map((t) => {
      const res = answered.map(([k, v]) => ({ k, v, fit: fits(t, k, v) }));
      return { t, yes: res.filter((r) => r.fit === true), no: res.filter((r) => r.fit === false), unknown: res.filter((r) => r.fit === null) };
    })
    .sort((a, b) => a.no.length - b.no.length || b.yes.length - a.yes.length || a.t.name.localeCompare(b.t.name)), [ans, group]);
  const best = scored.filter((s) => s.no.length === 0 && s.yes.length > 0);
  const near = scored.filter((s) => s.no.length === 1 && s.yes.length > 0);
  const label = (k: Key, v: string) => questions.find((q) => q.id === k)?.options.find((o) => o.value === v)?.label ?? v;
  const qLabel = (k: Key) => questions.find((q) => q.id === k)?.label ?? k;

  return (
    <div class="rr">
      <ol class="rr__qs">
        {questions.map((q) => (
          <li class="rr__q" id={`q-${q.id}`}>
            <h3>{q.label}</h3>
            <div class="rpicks" role="group" aria-label={q.label}>
              {q.options.map((o) => (
                <button type="button" class="rpick" aria-pressed={ans[q.id] === o.value} onClick={() => set(q.id, o.value)} title={o.note ?? o.img?.alt ?? undefined}>
                  <span class="rpick__img">{o.img ? <img src={o.img.src} alt={o.img.alt} loading="lazy" decoding="async" /> : null}</span>
                  <span class="rpick__label">{o.label}</span>
                </button>
              ))}
            </div>
            {ans[q.id] && <button type="button" class="link rr__clear" onClick={() => set(q.id, ans[q.id]!)}>I can’t tell</button>}
            {q.how.length > 0 && <details class="rr__how"><summary>How to look</summary>{q.how.length === 1 ? <p>{q.how[0]}</p> : <ol>{q.how.map((t) => <li>{t}</li>)}</ol>}</details>}
          </li>
        ))}
        <li class="rr__q">
          <h3>Where do you think it is from? <span class="muted">(optional)</span></h3>
          <div class="rpicks rpicks--groups" role="group" aria-label="Where it is from">
            {groups.map((g) => (
              <button type="button" class="rpick" aria-pressed={group === g.id} onClick={() => setGroup(group === g.id ? '' : g.id)} title={g.img?.alt}>
                <span class="rpick__img">{g.img ? <img src={g.img.src} alt={g.img.alt} loading="lazy" decoding="async" /> : null}</span>
                <span class="rpick__label">{g.name}</span>
              </button>
            ))}
          </div>
          {group && <button type="button" class="link rr__clear" onClick={() => setGroup('')}>Anywhere</button>}
        </li>
      </ol>

      <section class="rr__out" aria-live="polite" aria-label="Types that fit">
        {!answered.length ? (
          <p class="sread__empty"><strong>Answer what you can see.</strong> Every answer narrows the list; skip anything you can’t tell. The types that fit appear here.</p>
        ) : (
          <>
            <p class="rr__sum">
              {answered.map(([k, v]) => <span class="schip rr__chip">{qLabel(k)}: {label(k, v)}</span>)}
              <button type="button" class="link" onClick={() => setAns({})}>Start again</button>
            </p>
            <h2 class="px__groupname">{best.length ? `${best.length} ${best.length === 1 ? 'type fits' : 'types fit'} everything you chose` : 'No type fits everything you chose'}</h2>
            {best.length > 0 && <ol class="rr__grid">{best.slice(0, 60).map((s) => <Card s={s} label={label} />)}</ol>}
            {near.length > 0 && (
              <details class="rr__near" open={!best.length}>
                <summary>{near.length} more fit all but one answer</summary>
                <ol class="rr__grid">{near.slice(0, 60).map((s) => <Card s={s} label={label} />)}</ol>
              </details>
            )}
            <p class="faint">A fit means this type’s sources describe the same structure, not that your rug is one: structure narrows the field, and the design, the colors and the sheet’s look-alikes decide it. Rugs vary, and so do the books.</p>
          </>
        )}
      </section>
    </div>
  );
}

function Card({ s, label }: { s: { t: ReaderType; yes: { k: Key; v: string }[]; no: { k: Key; v: string }[]; unknown: { k: Key }[] }; label: (k: Key, v: string) => string }) {
  const t = s.t;
  return (
    <li class="rcard">
      <a href={`/marks/rugs/types#${t.slug}`}>
        <span class="plate plate--print rcard__img">{t.img ? <img src={media(t.img)} alt="" loading="lazy" decoding="async" /> : <span class="pcard__none">No photo yet</span>}</span>
        <span class="rcard__name">{t.name}{t.native && (/[؀-ۿ]/.test(t.native) ? <span class="nastaliq" lang="fa" dir="rtl"> {t.native}</span> : <span class="rcard__native"> {t.native}</span>)}</span>
        <span class="rcard__meta">{[t.region, t.years].filter(Boolean).join(' · ')}</span>
        {s.no.length > 0 && <span class="rcard__no">Not: {s.no.map((n) => label(n.k, n.v)).join(', ')}</span>}
        {s.unknown.length > 0 && <span class="rcard__unk">Sources silent on {s.unknown.length === 1 ? 'one answer' : `${s.unknown.length} answers`}</span>}
      </a>
    </li>
  );
}
