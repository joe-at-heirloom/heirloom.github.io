/** @jsxImportSource preact */
// What is it? The reader taps what an item is made of, how it is decorated,
// what it is, and where it is said to come from, and the Indian crafts that
// fit come first, each with what matched, how to recognize it and the
// look-alikes. Nothing is ruled out by one choice: the same item can be
// described more than one way, so a craft missing something tapped only drops
// lower. Knowing the craft says where and how an item was made, not its age.
import { useEffect, useMemo, useState } from 'preact/hooks';

export type Craft = {
  id: string; slug: string; name: string; native: string[]; other: string[]; group: string; kind: string;
  materials: string[]; woods: string[]; techniques: string[]; forms: string[]; regions: string[];
  identifyBy: string; lookAlikes: { name: string; how: string }[];
  photo: { file: string; credit: string; url: string | null } | null;
};
type Field = 'materials' | 'woods' | 'techniques' | 'forms' | 'regions';
type Props = { crafts: Craft[]; vocab: Record<Field, string[]>; labels: Record<Field, string> };

const ORDER: Field[] = ['forms', 'materials', 'woods', 'techniques', 'regions'];
const WEIGHT: Record<Field, number> = { forms: 2, materials: 3, woods: 2, techniques: 3, regions: 1 };
const empty = (): Record<Field, string[]> => ({ materials: [], woods: [], techniques: [], forms: [], regions: [] });

export default function CraftFinder({ crafts, vocab, labels }: Props) {
  const [picked, setPicked] = useState<Record<Field, string[]>>(empty());
  const [q, setQ] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const next = empty();
    for (const k of ORDER) { const v = p.get(k); if (v) next[k] = v.split(',').filter(Boolean); }
    setPicked(next);
    setQ(p.get('q') ?? '');
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    for (const k of ORDER) if (picked[k].length) p.set(k, picked[k].join(','));
    if (q.trim()) p.set('q', q.trim());
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [picked, q]);

  const toggle = (k: Field, v: string) => setPicked((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const any = ORDER.some((k) => picked[k].length) || q.trim().length > 0;
  const words = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!any) return [];
    return crafts.map((c) => {
      let score = 0;
      const matched: string[] = [];
      for (const k of ORDER) for (const v of picked[k]) {
        if (c[k].includes(v)) { score += WEIGHT[k]; matched.push(v); }
        else if (c[k].length) score -= 1;
      }
      let out = false;
      if (words) {
        const hay = [c.name, ...c.native, ...c.other].join(' ').toLowerCase();
        if (hay.includes(words)) score += 10; else if (!ORDER.some((k) => picked[k].length)) out = true;
      }
      return { c, score, matched, out };
    }).filter((r) => !r.out && r.score > 0 && (r.matched.length > 0 || words)).sort((a, b) => b.score - a.score || (a.c.kind === 'craft' ? 0 : 1) - (b.c.kind === 'craft' ? 0 : 1) || a.c.name.localeCompare(b.c.name)).slice(0, 24);
  }, [picked, q]);

  return (
    <div class="ff">
      <div class="ff__pick">
        <label class="rx__q ff__q">
          <span class="visually-hidden">A name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" placeholder="Or type a name: bidri, Moradabad brass, pietra dura, kundan" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        {ORDER.filter((k) => vocab[k]?.length).map((k) => (
          <fieldset class="ff__group">
            <legend>{labels[k]}</legend>
            <div class="ff__chips">
              {vocab[k].map((v) => <button type="button" aria-pressed={picked[k].includes(v)} onClick={() => toggle(k, v)}>{v}</button>)}
            </div>
          </fieldset>
        ))}
        {any && <button type="button" class="ff__clear" onClick={() => { setPicked(empty()); setQ(''); }}>Start again</button>}
      </div>

      <div class="ff__out" aria-live="polite">
        {!any && <p class="muted">Tap what the item is, what it is made of and how it is decorated. Start with what stands out: a black metal box with silver inlay, an engraved brass tray, a marble box inlaid with colored stone. The crafts that fit come first.</p>}
        {any && !results.length && <p>Nothing here fits that. Try fewer choices, or only the material and what the item is.</p>}
        {results.map(({ c, matched }) => (
          <article class="ff__card">
            {c.photo && <a class="ff__pic plate plate--print" href={`#${c.slug}`}><img src={c.photo.file} alt={c.name} loading="lazy" /></a>}
            <div>
              <h3><a href={`#${c.slug}`}>{c.name}</a>{c.native[0] && <> <span class="indic">{c.native[0]}</span></>}</h3>
              {c.other.length > 0 && <p class="ff__iast muted">{c.other.slice(0, 3).join(', ')}</p>}
              <p>{c.identifyBy}</p>
              {matched.length > 0 && <p class="ff__matched">Fits: {matched.join(', ')}</p>}
              {c.lookAlikes.length > 0 && (
                <ul class="ff__like">
                  {c.lookAlikes.slice(0, 3).map((l) => <li><strong>{l.name}:</strong> {l.how}</li>)}
                </ul>
              )}
            </div>
          </article>
        ))}
        {results.length > 0 && <p class="faint">Knowing the craft says where and how an item was made, not how old it is: most of these crafts are still practiced, much of it for export.</p>}
      </div>
    </div>
  );
}
