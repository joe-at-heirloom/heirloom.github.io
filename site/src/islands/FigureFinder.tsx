/** @jsxImportSource preact */
// Who is this figure? The reader taps what they see on a figure (how many
// arms, what the hands hold, the animal beneath or beside it, the pose, a
// distinctive head or body, the emblem on a Jain pedestal) and the figures that
// fit rise to the top, each with what matched and the one sign that tells it
// from its look-alikes. Nothing is ruled out by one sign alone except the arms
// and the Jain emblem: artists varied the rest, so a figure missing one thing
// tapped only drops lower. It names who the figure shows, never its age.
import { useEffect, useMemo, useState } from 'preact/hooks';

export type Fig = {
  id: string; slug: string; name: string; iast: string | null; native: string[]; other: string[];
  religion: string; kind: string; arms: number[]; holds: string[]; gestures: string[]; mount: string[];
  posture: string[]; headBody: string[]; emblems: string[]; identifyBy: string;
  lookAlikes: { name: string; slug: string | null; how: string }[];
  photo: { file: string; credit: string; url: string | null } | null;
};
type Field = 'religion' | 'arms' | 'holds' | 'gestures' | 'mount' | 'posture' | 'headBody' | 'emblem';
type Props = { figures: Fig[]; vocab: Record<Field, string[]>; labels: Record<Field, string> };

const ORDER: Field[] = ['religion', 'arms', 'holds', 'mount', 'headBody', 'posture', 'gestures', 'emblem'];
const WEIGHT: Record<Field, number> = { religion: 0, arms: 2, holds: 2, gestures: 1, mount: 3, posture: 1, headBody: 3, emblem: 6 };
const has = (f: Fig, k: Field, v: string) => (k === 'religion' ? f.religion === v : k === 'arms' ? f.arms.includes(Number(v)) : k === 'emblem' ? f.emblems.includes(v) : (f[k] as string[]).includes(v));
const known = (f: Fig, k: Field) => (k === 'religion' ? true : k === 'emblem' ? f.emblems.length > 0 : k === 'arms' ? f.arms.length > 0 : (f[k] as string[]).length > 0);

export default function FigureFinder({ figures, vocab, labels }: Props) {
  const [picked, setPicked] = useState<Record<Field, string[]>>({ religion: [], arms: [], holds: [], gestures: [], mount: [], posture: [], headBody: [], emblem: [] });
  const [q, setQ] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const next = { ...picked };
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

  const toggle = (k: Field, v: string) => setPicked((s) => {
    const one = k === 'religion' || k === 'arms' || k === 'emblem';
    const cur = s[k];
    return { ...s, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : one ? [v] : [...cur, v] };
  });
  const any = ORDER.some((k) => picked[k].length) || q.trim().length > 0;
  const words = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!any) return [];
    return figures.map((f) => {
      let score = 0;
      const matched: string[] = [];
      let out = false;
      for (const k of ORDER) for (const v of picked[k]) {
        if (has(f, k, v)) { score += WEIGHT[k] || 1; if (k !== 'religion') matched.push(k === 'arms' ? `${v} arms` : v); }
        else if (k === 'religion' || ((k === 'arms' || k === 'emblem') && known(f, k))) out = true;
        else if (known(f, k)) score -= k === 'mount' || k === 'headBody' ? 1 : 0;
      }
      if (words) {
        const hay = [f.name, f.iast, ...f.native, ...f.other].join(' ').toLowerCase();
        if (hay.includes(words)) score += 10; else if (!ORDER.some((k) => picked[k].length)) out = true;
      }
      return { f, score, matched, out };
    }).filter((r) => !r.out && r.score > 0).sort((a, b) => b.score - a.score || a.f.name.localeCompare(b.f.name)).slice(0, 24);
  }, [picked, q]);

  return (
    <div class="ff">
      <div class="ff__pick">
        <label class="rx__q ff__q">
          <span class="visually-hidden">A name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" placeholder="Or type a name: Ganesha, Nataraja, Parshvanatha, Tara" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        {ORDER.filter((k) => vocab[k]?.length).map((k) => (
          <fieldset class="ff__group">
            <legend>{labels[k]}</legend>
            <div class="ff__chips">
              {vocab[k].map((v) => <button type="button" aria-pressed={picked[k].includes(v)} onClick={() => toggle(k, v)}>{v}</button>)}
            </div>
          </fieldset>
        ))}
        {any && <button type="button" class="ff__clear" onClick={() => { setPicked({ religion: [], arms: [], holds: [], gestures: [], mount: [], posture: [], headBody: [], emblem: [] }); setQ(''); }}>Start again</button>}
      </div>

      <div class="ff__out" aria-live="polite">
        {!any && <p class="muted">Tap what you see on the figure. Start with what stands out most: an elephant head, a dancing pose in a ring of fire, the animal it rides, an emblem on a Jain pedestal. The figures that fit come first.</p>}
        {any && !results.length && <p>Nothing here fits all of that. Try fewer signs: artists varied what a figure holds, and a worn or broken hand can hide one.</p>}
        {results.map(({ f, matched }) => (
          <article class="ff__card">
            {f.photo && <a class="ff__pic plate plate--print" href={`#${f.slug}`}><img src={f.photo.file} alt={f.name} loading="lazy" /></a>}
            <div>
              <h3><a href={`#${f.slug}`}>{f.name}</a>{f.native[0] && <> <span class="indic" lang="hi">{f.native[0]}</span></>}</h3>
              {f.iast && f.iast !== f.name && <p class="ff__iast">{f.iast}{f.other.length > 0 && <span class="muted"> · {f.other.slice(0, 3).join(', ')}</span>}</p>}
              <p>{f.identifyBy}</p>
              {matched.length > 0 && <p class="ff__matched">Fits: {matched.join(', ')}</p>}
              {f.lookAlikes.length > 0 && (
                <ul class="ff__like">
                  {f.lookAlikes.slice(0, 3).map((l) => <li><strong>{l.slug ? <a href={`#${l.slug}`}>{l.name}</a> : l.name}:</strong> {l.how}</li>)}
                </ul>
              )}
            </div>
          </article>
        ))}
        {results.length > 0 && <p class="faint">A figure’s identity says who it shows, not how old it is: workshops still cast and carve these forms today.</p>}
      </div>
    </div>
  );
}
