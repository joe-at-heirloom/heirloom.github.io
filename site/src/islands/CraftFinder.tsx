/** @jsxImportSource preact */
// What is it? The reader taps what the item is (outlines), what it is made of
// (swatches) and how it is decorated (close-ups from museum photographs), and
// the crafts narrow as they tap: every choice keeps only the crafts that fit
// it, each choice shows how many would be left, and a choice that would leave
// none is greyed out. A craft whose record says nothing about a question (no
// regions, say) is not ruled out by it. Before any tap the reader sees every
// craft, photographs first, to recognize theirs by eye. Knowing the craft says
// where and how an item was made, not its age.
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { formIcon, MATERIAL_SWATCH, TECHNIQUE_WORDS } from '../lib/craft-pictures';

export type Craft = {
  id: string; slug: string; name: string; native: string[]; other: string[]; group: string; kind: string;
  materials: string[]; woods: string[]; techniques: string[]; forms: string[]; regions: string[];
  identifyBy: string; lookAlikes: { name: string; how: string }[];
  photo: { file: string; credit: string; url: string | null } | null;
};
export type TechPic = { file: string; title: string | null; credit: string | null };
type Field = 'materials' | 'woods' | 'techniques' | 'forms' | 'regions';
type Picked = Record<Field, string[]>;
type Props = { crafts: Craft[]; vocab: Record<Field, string[]>; labels: Record<Field, string>; techPics: Record<string, TechPic>; techCredit: string };

const ORDER: Field[] = ['forms', 'materials', 'woods', 'techniques', 'regions'];
// What the item is, the wood and the place are one answer each; an item can be
// made of several materials and decorated several ways.
const SINGLE: Record<Field, boolean> = { forms: true, woods: true, regions: true, materials: false, techniques: false };
const WEIGHT: Record<Field, number> = { forms: 2, materials: 3, woods: 2, techniques: 3, regions: 1 };
// A technique with no close-up borrows its material's swatch.
const TECH_SWATCH: Record<string, string> = { lacquering: 'lacquer' };
const FIRST = 24;
const empty = (): Picked => ({ materials: [], woods: [], techniques: [], forms: [], regions: [] });

const fits = (c: Craft, p: Picked, words: string) => {
  for (const k of ORDER) for (const v of p[k]) if (c[k].length && !c[k].includes(v)) return false;
  if (words && ![c.name, ...c.native, ...c.other].join(' ').toLowerCase().includes(words)) return false;
  return true;
};
const withChoice = (p: Picked, k: Field, v: string): Picked =>
  ({ ...p, [k]: SINGLE[k] ? [v] : p[k].includes(v) ? p[k] : [...p[k], v] });

export default function CraftFinder({ crafts, vocab, labels, techPics, techCredit }: Props) {
  const [picked, setPicked] = useState<Picked>(empty());
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const out = useRef<HTMLDivElement>(null);
  const [outSeen, setOutSeen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const next = empty();
    for (const k of ORDER) {
      const v = p.get(k);
      if (v) next[k] = v.split(',').filter((x) => vocab[k]?.includes(x)).slice(0, SINGLE[k] ? 1 : undefined);
    }
    setPicked(next);
    setQ(p.get('q') ?? '');
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    for (const k of ORDER) if (picked[k].length) p.set(k, picked[k].join(','));
    if (q.trim()) p.set('q', q.trim());
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
    setAll(false);
  }, [picked, q]);
  useEffect(() => {
    if (!out.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setOutSeen(e.isIntersecting), { rootMargin: '0px 0px -40% 0px' });
    io.observe(out.current);
    return () => io.disconnect();
  }, []);

  const words = q.trim().toLowerCase();
  const any = ORDER.some((k) => picked[k].length) || words.length > 0;
  const toggle = (k: Field, v: string) => setPicked((s) => {
    const on = s[k].includes(v);
    const next = { ...s, [k]: on ? s[k].filter((x) => x !== v) : SINGLE[k] ? [v] : [...s[k], v] };
    if (k === 'materials' && on && v === 'wood') next.woods = [];
    return next;
  });

  const results = useMemo(() => crafts
    .filter((c) => fits(c, picked, words))
    .map((c) => {
      let score = 0;
      const matched: string[] = [];
      for (const k of ORDER) for (const v of picked[k]) if (c[k].includes(v)) { score += WEIGHT[k]; matched.push(k === 'techniques' ? (TECHNIQUE_WORDS[v]?.[0] ?? v).toLowerCase() : v); }
      return { c, score, matched };
    })
    .sort((a, b) => b.score - a.score
      || (a.c.kind === 'craft' ? 0 : 1) - (b.c.kind === 'craft' ? 0 : 1)
      || (a.c.photo ? 0 : 1) - (b.c.photo ? 0 : 1)
      || a.c.name.localeCompare(b.c.name)), [picked, words]);

  // How many crafts each choice would leave.
  const left = useMemo(() => {
    const n = {} as Record<Field, Record<string, number>>;
    for (const k of ORDER) {
      n[k] = {};
      for (const v of vocab[k] ?? []) {
        const p = withChoice(picked, k, v);
        n[k][v] = crafts.reduce((m, c) => m + (fits(c, p, words) ? 1 : 0), 0);
      }
    }
    return n;
  }, [picked, words]);

  const showWoods = picked.materials.includes('wood') || picked.woods.length > 0;
  const chip = (k: Field, v: string, body: ComponentChildren, cls: string) => {
    const on = picked[k].includes(v);
    const n = left[k]?.[v] ?? 0;
    return (
      <button type="button" class={cls} aria-pressed={on} disabled={!on && n === 0} onClick={() => toggle(k, v)}
        title={!on && n === 0 ? 'No craft here fits this with what you have chosen' : undefined}>
        {body}
        {!on && n > 0 && any && <span class="cf__n">{n}</span>}
      </button>
    );
  };
  const shown = all ? results : results.slice(0, FIRST);

  return (
    <div class="cf">
      <div class="cf__pick">
        <label class="rx__q cf__q">
          <span class="visually-hidden">A name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" placeholder="Or type a name: bidri, Moradabad brass, pietra dura, kundan" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>

        <fieldset class="cf__group">
          <legend>{labels.forms}</legend>
          <div class="cf__forms">
            {(vocab.forms ?? []).map((v) => chip('forms', v, <>
              <span class="cf__icon" dangerouslySetInnerHTML={{ __html: formIcon(v) }} />
              <span class="cf__word">{v}</span>
            </>, 'cf__form'))}
          </div>
        </fieldset>

        <fieldset class="cf__group">
          <legend>{labels.materials}</legend>
          <div class="cf__chips">
            {(vocab.materials ?? []).map((v) => chip('materials', v, <>
              <span class="cf__swatch" aria-hidden="true" style={{ background: MATERIAL_SWATCH[v] ?? 'var(--paper-2)' }} />
              <span class="cf__word">{v}</span>
            </>, 'cf__chip'))}
          </div>
        </fieldset>

        {showWoods && (vocab.woods ?? []).length > 0 && (
          <fieldset class="cf__group">
            <legend>{labels.woods}</legend>
            <div class="cf__chips">
              {vocab.woods.map((v) => chip('woods', v, <span class="cf__word">{v}</span>, 'cf__chip cf__chip--plain'))}
            </div>
          </fieldset>
        )}

        <fieldset class="cf__group">
          <legend>{labels.techniques}</legend>
          <div class="cf__techs">
            {(vocab.techniques ?? []).map((v) => {
              const [plain, term] = TECHNIQUE_WORDS[v] ?? [v, ''];
              const pic = techPics[v];
              const sw = MATERIAL_SWATCH[TECH_SWATCH[v] ?? ''];
              return chip('techniques', v, <>
                {pic ? <img class="cf__close" src={pic.file} alt="" loading="lazy" width={72} height={72} title={pic.title ? `Detail: ${pic.title}${pic.credit ? `, ${pic.credit}` : ''}` : undefined} />
                  : <span class="cf__close" aria-hidden="true" style={{ background: sw ?? 'var(--paper-2)' }} />}
                <span class="cf__tword"><strong>{plain}</strong>{term && <span>{term}</span>}</span>
              </>, 'cf__tech');
            })}
          </div>
          {techCredit && <p class="cf__credit faint">{techCredit}</p>}
        </fieldset>

        <fieldset class="cf__group">
          <legend>{labels.regions}</legend>
          <div class="cf__chips">
            {(vocab.regions ?? []).map((v) => chip('regions', v, <span class="cf__word">{v}</span>, 'cf__chip cf__chip--plain'))}
          </div>
        </fieldset>
      </div>

      <div class="cf__out" ref={out} aria-live="polite">
        <div class="cf__head">
          <p class="cf__count">
            {!any ? <>All {crafts.length} crafts, photographed ones first. Tap what you see to narrow them.</>
              : results.length ? <><strong>{results.length}</strong> {results.length === 1 ? 'craft fits' : 'crafts fit'}, the closest first.</>
              : <>Nothing here fits that name with those choices. Try fewer choices or another spelling.</>}
          </p>
          {any && <button type="button" class="cf__clear" onClick={() => { setPicked(empty()); setQ(''); }}>Start again</button>}
        </div>
        <div class="cf__grid">
          {shown.map(({ c, matched }) => (
            <a class={`cf__card${c.photo ? '' : ' cf__card--text'}`} href={`#${c.slug}`}>
              {c.photo && <span class="cf__pic"><img src={c.photo.file} alt="" loading="lazy" /></span>}
              <span class="cf__body">
                <span class="cf__name">{c.name}</span>
                {c.native[0] && <span class="cf__native indic">{c.native[0]}</span>}
                {matched.length > 0 && <span class="cf__fits">Fits: {matched.join(', ')}</span>}
                <span class="cf__id">{c.identifyBy}</span>
              </span>
            </a>
          ))}
        </div>
        {results.length > shown.length && <button type="button" class="cf__more" onClick={() => setAll(true)}>Show all {results.length}</button>}
        {results.length > 0 && <p class="faint cf__note">Knowing the craft says where and how an item was made, not how old it is: most of these crafts are still practiced, much of it for export.</p>}
      </div>

      {any && results.length > 0 && !outSeen && (
        <button type="button" class="cf__jump" onClick={() => out.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          See the {results.length} {results.length === 1 ? 'craft' : 'crafts'} that fit
        </button>
      )}
    </div>
  );
}
