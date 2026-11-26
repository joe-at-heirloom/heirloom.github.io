/** @jsxImportSource preact */
// The seal reader: a photo of a Chinese seal, matched against the 21,093 seals and
// signatures of the Shanghai Museum's seal book that the reference has read. The
// photo never leaves the device: its ink is taken (what is red in a photo, what is
// dark in a print), squared, blurred to a 32 px map and reduced to 64 numbers, the
// same steps that made the index (hallmark-sources/chinese/seal_reader). The closest
// seals are shown with their readings, their owners and the works they come from.
// A close match says the seal looks like a recorded one, never that a work is genuine.
import { useEffect, useRef, useState } from 'preact/hooks';
import { fingerprint, makeIndex, nearest, type Index } from '../lib/sealmatch';

type Person = [string, string, string, string]; // name, pinyin, slug, dynasty
type Seal = [number, number, string, string, string, string, string, number]; // person, n, img, reading, pinyin, gloss, work, collector
type Data = { ix: Index; people: Person[]; seals: Seal[] };
type Box = { x: number; y: number; w: number; h: number };

const BASE = '/marks/chinese/seal-reader/';
const MEDIA = 'https://media.heirloomapp.io/seals/';
const MAX = 900;
let loading: Promise<Data> | null = null;
function load(): Promise<Data> {
  loading ??= Promise.all([
    fetch(BASE + 'pca.bin').then((r) => r.arrayBuffer()),
    fetch(BASE + 'seals.bin').then((r) => r.arrayBuffer()),
    fetch(BASE + 'pca.meta.json').then((r) => r.json()),
    fetch(BASE + 'seals.json').then((r) => r.json()),
  ]).then(([pca, seals, meta, s]) => ({ ix: makeIndex(pca, seals, meta), people: s.people, seals: s.seals }));
  return loading;
}
const band = (s: number) => (s >= 0.9 ? ['very', 'Very close'] : s >= 0.8 ? ['close', 'Close'] : ['far', 'Similar layout only']);

export default function SealReader({ total }: { total: number }) {
  const [img, setImg] = useState<HTMLCanvasElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [results, setResults] = useState<{ i: number; score: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const view = useRef<HTMLCanvasElement>(null);

  // Draw the photo and the box being drawn.
  useEffect(() => {
    const c = view.current;
    if (!c || !img) return;
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    if (box && box.w > 4 && box.h > 4) {
      g.fillStyle = 'rgba(20,18,15,0.45)';
      g.fillRect(0, 0, c.width, box.y); g.fillRect(0, box.y + box.h, c.width, c.height - box.y - box.h);
      g.fillRect(0, box.y, box.x, box.h); g.fillRect(box.x + box.w, box.y, c.width - box.x - box.w, box.h);
      g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, c.width / 300); g.strokeRect(box.x, box.y, box.w, box.h);
    }
  }, [img, box]);

  const open = async (file: File) => {
    setErr(''); setResults(null); setBox(null);
    try {
      const bmp = await createImageBitmap(file);
      const s = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      setImg(c);
      load().then(setData).catch(() => setErr('The seal index did not load. Check the connection and try again.'));
    } catch {
      setErr('That file could not be opened as a picture.');
    }
  };

  const at = (e: PointerEvent) => {
    const c = view.current!, r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: PointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); const p = at(e); setDrag(p); setBox({ x: p.x, y: p.y, w: 0, h: 0 }); };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const p = at(e);
    setBox({ x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) });
  };
  const up = () => setDrag(null);

  const find = async () => {
    if (!img) return;
    setBusy(true); setErr('');
    try {
      const d = data ?? (await load()); setData(d);
      const b = box && box.w > 12 && box.h > 12 ? box : { x: 0, y: 0, w: img.width, h: img.height };
      const px = img.getContext('2d')!.getImageData(Math.round(b.x), Math.round(b.y), Math.max(1, Math.round(b.w)), Math.max(1, Math.round(b.h)));
      setResults(nearest(fingerprint(px, d.ix), d.ix, 12));
    } catch {
      setErr('Something went wrong reading the photo. Try drawing the box closer around the seal.');
    } finally { setBusy(false); }
  };

  return (
    <div class="sr">
      <div class="sr__pick">
        <label class="btn btn--primary">
          {img ? 'Choose another photo' : 'Choose a photo of a seal'}
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) open(f); }} />
        </label>
        <span class="sr__hint">The photo stays on your device: it is read here, in the page, and never uploaded.</span>
      </div>

      {img && (
        <div class="sr__work">
          <div class="sr__canvas">
            <canvas ref={view} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Your photo. Drag a box around one seal." />
            <p class="sr__step">Drag a box around one seal, as close to its edges as you can. Without a box the whole photo is read.</p>
          </div>
          <div class="sr__actions">
            <button type="button" class="btn btn--ink" onClick={find} disabled={busy}>{busy ? 'Reading…' : 'Find this seal'}</button>
            {box && box.w > 4 && <button type="button" class="btn" onClick={() => { setBox(null); setResults(null); }}>Clear the box</button>}
          </div>
        </div>
      )}

      {err && <p class="panel__warn">{err}</p>}

      {results && data && (
        <section class="sr__results" aria-live="polite">
          <h2>The closest of {total.toLocaleString('en-US')} recorded seals</h2>
          {results[0].score < 0.8 && <p class="panel__warn">Nothing here is close. The seal may not be in the book, or the box may hold more than one seal: try a tighter box.</p>}
          <ol class="sr__list">
            {results.map(({ i, score }) => {
              const s = data.seals[i], p = data.people[s[0]], [cls, label] = band(score);
              return (
                <li class={`sr__hit sr__hit--${cls}`}>
                  <span class="plate plate--print sr__img"><img src={`${MEDIA}${s[2]}.webp`} alt={s[3] ? `Seal reading ${s[3]}` : 'Seal'} loading="lazy" /></span>
                  <span class="sr__text">
                    <span class="sr__band">{label}</span>
                    {s[3] && <span class="han sr__reading">{s[3]}</span>}
                    {(s[4] || s[5]) && <span class="sr__py">{[s[4], s[5]].filter(Boolean).join(' · ')}</span>}
                    <a class="sr__who" href={`/marks/chinese/painters/${p[2]}#seals`}><span class="han">{p[0]}</span> {p[1]}</a>
                    <span class="sr__meta">{[s[7] ? 'collector’s seal' : 'seal or signature', `no. ${s[1]}`, s[6]].filter(Boolean).join(' · ')}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
