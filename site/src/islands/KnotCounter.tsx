/** @jsxImportSource preact */
// The knot-count converter: pick the notation on the tag or in the listing
// (knots per square inch, per square decimeter or meter, Iranian raj, Chinese
// line, Pakistani 16/18, Indian 9/60, Tibetan knot), type the number or
// numbers, and read the count in every other notation. Each notation's rule
// comes from the app's table (rugs.json `knots`), through the page.
import { useEffect, useMemo, useState } from 'preact/hooks';

/** How a notation turns into knots per square inch:
 *  kpsi    n
 *  area    n ÷ per (knots per dm²: per = 15.5; per m²: 1550)
 *  square  (n ÷ L)², n knots counted across L inches, the same along
 *  pair    (a ÷ x) × (b ÷ y), a knots across x inches, b along y inches */
export type Notation = { id: string; name: string; kind: 'kpsi' | 'area' | 'square' | 'pair'; per?: number; L?: number; x?: number; y?: number; placeholder: string; note?: string | null; written?: string[] };
type Props = { notations: Notation[] };

const kpsiOf = (n: Notation, a: number, b: number): number | null => {
  if (!(a > 0)) return null;
  switch (n.kind) {
    case 'kpsi': return a;
    case 'area': return a / (n.per ?? 1);
    case 'square': return (a / (n.L ?? 1)) ** 2;
    case 'pair': return b > 0 ? (a / (n.x ?? 1)) * (b / (n.y ?? 1)) : null;
  }
};
const fromKpsi = (n: Notation, k: number): string => {
  switch (n.kind) {
    case 'kpsi': return String(Math.round(k));
    case 'area': return Math.round(k * (n.per ?? 1)).toLocaleString('en-US');
    case 'square': return `${Math.round(Math.sqrt(k) * (n.L ?? 1))}`;
    case 'pair': { const side = Math.sqrt(k); return `${Math.round(side * (n.x ?? 1))}/${Math.round(side * (n.y ?? 1))}`; }
  }
};
const read = (s: string): [number, number] => {
  const m = s.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(?:[/x×]\s*(\d+(?:\.\d+)?))?/);
  return m ? [Number(m[1]), m[2] ? Number(m[2]) : NaN] : [NaN, NaN];
};

export default function KnotCounter({ notations }: Props) {
  const [id, setId] = useState(notations[0]?.id ?? '');
  const [val, setVal] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('as') && notations.some((n) => n.id === p.get('as'))) setId(p.get('as')!);
    if (p.get('n')) setVal(p.get('n')!);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set('as', id);
    val.trim() ? p.set('n', val.trim()) : p.delete('n');
    history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`);
  }, [id, val]);
  const n = notations.find((x) => x.id === id) ?? notations[0];
  const kpsi = useMemo(() => { const [a, b] = read(val); return n ? kpsiOf(n, a, b) : null; }, [id, val]);

  return (
    <div class="kc">
      <div class="kc__in">
        <label>As written
          <select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)}>
            {notations.map((x) => <option value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label>{n?.kind === 'pair' ? 'Across / along' : 'Number'}
          <input inputMode="decimal" autoComplete="off" placeholder={n?.placeholder} value={val} onInput={(e) => setVal((e.target as HTMLInputElement).value)} />
        </label>
      </div>
      {n?.note && <p class="faint">{n.note}</p>}
      <section class="kc__out" aria-live="polite">
        {kpsi == null || !Number.isFinite(kpsi) ? (
          <p class="muted">{n?.kind === 'pair' ? 'Type both numbers as written, e.g. 16/18.' : 'Type the number as written.'}</p>
        ) : (
          <>
            <p><span class="kc__big num">{Math.round(kpsi).toLocaleString('en-US')}</span> knots per square inch <span class="muted">· {Math.round(kpsi * 15.5).toLocaleString('en-US')} per square decimeter · {Math.round(kpsi * 1550).toLocaleString('en-US')} per square meter</span></p>
            <dl class="kc__list">
              {notations.filter((x) => x.id !== n.id && x.kind !== 'kpsi' && x.kind !== 'area').map((x) => <div><dt>{x.name}</dt><dd class="num">{fromKpsi(x, kpsi)}</dd></div>)}
            </dl>
            <p class="faint">Other notations are worked out assuming the knots are as close together along the rug as across it, which is often not quite so. A count says how fine the weave is, not how good the rug is.</p>
          </>
        )}
      </section>
    </div>
  );
}
