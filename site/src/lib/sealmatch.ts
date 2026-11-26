// The seal reader's matching, the same steps as hallmark-sources/chinese/seal_reader
// (rerank.py ink_mask + square, build_index.py bm): a photo's ink as a blurred 32 px
// map, projected to 64 numbers, compared with every seal in the index. Pillow's blur
// and resize are reproduced (box-blur Gaussian, triangle resample) so the browser and
// the index agree. Pure functions on RGBA pixel arrays: no DOM, testable in Node.

export type Pixels = { width: number; height: number; data: Uint8ClampedArray | Uint8Array };

function otsu(v: Uint8Array): number {
  const h = new Float64Array(256);
  for (let i = 0; i < v.length; i++) h[v[i]]++;
  let w = 0, m = 0, mt = 0;
  const n = v.length;
  for (let i = 0; i < 256; i++) mt += (i * h[i]) / n;
  let best = 0, at = 0;
  for (let i = 0; i < 256; i++) {
    w += h[i] / n; m += (i * h[i]) / n;
    const d = w * (1 - w);
    const s = d > 1e-12 ? ((mt * w - m) ** 2) / d : 0;
    if (s > best) { best = s; at = i; }
  }
  return at;
}

/** The seal's ink: what is red in a colour photo, what is dark in a print. */
export function inkMask(p: Pixels): Uint8Array {
  const n = p.width * p.height, d = p.data;
  let sat = 0;
  for (let i = 0; i < n; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    sat += Math.max(r, g, b) - Math.min(r, g, b);
  }
  sat /= n;
  const v = new Uint8Array(n), out = new Uint8Array(n);
  if (sat > 25) {
    for (let i = 0; i < n; i++) v[i] = Math.max(0, Math.min(255, d[i * 4] - Math.max(d[i * 4 + 1], d[i * 4 + 2])));
    const t = Math.max(otsu(v), 20);
    for (let i = 0; i < n; i++) out[i] = v[i] > t ? 1 : 0;
  } else {
    for (let i = 0; i < n; i++) v[i] = d[i * 4 + 1];
    const t = otsu(v);
    for (let i = 0; i < n; i++) out[i] = v[i] <= t ? 1 : 0;
  }
  return out;
}

// ── Pillow's resampling (bilinear = triangle filter, scaled when shrinking) ──
function coeffs(inSize: number, outSize: number) {
  const scale = inSize / outSize, filterscale = Math.max(scale, 1), support = 1 * filterscale;
  const ksize = Math.ceil(support) * 2 + 1;
  const bounds: number[] = [], ks: Float64Array[] = [];
  for (let xx = 0; xx < outSize; xx++) {
    const center = (xx + 0.5) * scale;
    let xmin = Math.trunc(center - support + 0.5); if (xmin < 0) xmin = 0;
    let xmax = Math.trunc(center + support + 0.5); if (xmax > inSize) xmax = inSize;
    xmax -= xmin;
    const k = new Float64Array(ksize); let ww = 0;
    for (let x = 0; x < xmax; x++) {
      const t = (x + xmin - center + 0.5) / filterscale;
      const w = Math.abs(t) < 1 ? 1 - Math.abs(t) : 0;
      k[x] = w; ww += w;
    }
    if (ww) for (let x = 0; x < xmax; x++) k[x] /= ww;
    bounds.push(xmin, xmax); ks.push(k);
  }
  return { bounds, ks };
}
const clip8 = (v: number) => (v <= 0 ? 0 : v >= 255 ? 255 : Math.round(v));
/** Resize a one-channel 8-bit image as Pillow's BILINEAR does (horizontal, then vertical). */
export function resize(src: Uint8Array, w: number, h: number, ow: number, oh: number): Uint8Array {
  const H = coeffs(w, ow), mid = new Uint8Array(ow * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < ow; x++) {
      const xmin = H.bounds[x * 2], xmax = H.bounds[x * 2 + 1], k = H.ks[x];
      let s = 0; for (let i = 0; i < xmax; i++) s += src[y * w + xmin + i] * k[i];
      mid[y * ow + x] = clip8(s);
    }
  const V = coeffs(h, oh), out = new Uint8Array(ow * oh);
  for (let y = 0; y < oh; y++) {
    const ymin = V.bounds[y * 2], ymax = V.bounds[y * 2 + 1], k = V.ks[y];
    for (let x = 0; x < ow; x++) {
      let s = 0; for (let i = 0; i < ymax; i++) s += mid[(ymin + i) * ow + x] * k[i];
      out[y * ow + x] = clip8(s);
    }
  }
  return out;
}

/** The ink cropped to itself, padded square by 8 %, as a 0/255 square of side n. */
export function square(mask: Uint8Array, w: number, h: number, n = 96): Uint8Array {
  let x0 = w, y0 = h, x1 = -1, y1 = -1, count = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { count++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (count < 10) return new Uint8Array(n * n);
  const mw = x1 - x0 + 1, mh = y1 - y0 + 1, s = Math.trunc(Math.max(mw, mh) * 1.08) + 2;
  const sq = new Uint8Array(s * s), oy = Math.floor((s - mh) / 2), ox = Math.floor((s - mw) / 2);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) if (mask[(y0 + y) * w + x0 + x]) sq[(oy + y) * s + ox + x] = 255;
  const r = resize(sq, s, s, n, n);
  for (let i = 0; i < r.length; i++) r[i] = r[i] > 100 ? 255 : 0;
  return r;
}

// ── Pillow's GaussianBlur: three passes of a fractional box blur ──
function boxLine(line: Float64Array, out: Float64Array, len: number, radius: number) {
  const r = Math.floor(radius), frac = radius - r, ww = 1 / (radius * 2 + 1);
  const at = (i: number) => line[i < 0 ? 0 : i >= len ? len - 1 : i];
  for (let x = 0; x < len; x++) {
    let s = at(x - r - 1) * frac + at(x + r + 1) * frac;
    for (let i = -r; i <= r; i++) s += at(x + i);
    out[x] = s * ww; // edge pixels extended, as Pillow does
  }
}
export function gaussianBlur(src: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const passes = 3, sigma2 = (radius * radius) / passes, L = Math.sqrt(12 * sigma2 + 1), l = Math.floor((L - 1) / 2);
  const a = ((2 * l + 1) * (l * (l + 1) - 3 * sigma2)) / (6 * (sigma2 - (l + 1) * (l + 1)));
  const br = l + a;
  let img = new Float64Array(src);
  const line = new Float64Array(Math.max(w, h)), out = new Float64Array(Math.max(w, h));
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) line[x] = img[y * w + x]; boxLine(line, out, w, br); for (let x = 0; x < w; x++) img[y * w + x] = Math.round(out[x]); }
  }
  for (let p = 0; p < passes; p++) {
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) line[y] = img[y * w + x]; boxLine(line, out, h, br); for (let y = 0; y < h; y++) img[y * w + x] = Math.round(out[y]); }
  }
  const r = new Uint8Array(w * h); for (let i = 0; i < r.length; i++) r[i] = clip8(img[i]);
  return r;
}

export type Index = { k: number; n: number; blur: number; mean: Float32Array; pca: Float32Array; seals: Int8Array; norms: Float32Array };

export function makeIndex(pcaBin: ArrayBuffer, sealsBin: ArrayBuffer, meta: { n: number; blur: number; k: number }): Index {
  const D = meta.n * meta.n, f = new Float32Array(pcaBin);
  const seals = new Int8Array(sealsBin), count = seals.length / meta.k, norms = new Float32Array(count);
  for (let i = 0; i < count; i++) { let s = 0; for (let j = 0; j < meta.k; j++) s += seals[i * meta.k + j] ** 2; norms[i] = Math.sqrt(s) || 1; }
  return { ...meta, mean: f.subarray(0, D), pca: f.subarray(D, D + meta.k * D), seals, norms };
}

/** A photo (already cropped to the seal) → its 64 numbers. */
export function fingerprint(p: Pixels, ix: Pick<Index, 'n' | 'blur' | 'k' | 'mean' | 'pca'>): Float32Array {
  const sq = square(inkMask(p), p.width, p.height, 96);
  const bl = resize(gaussianBlur(sq, 96, 96, ix.blur), 96, 96, ix.n, ix.n);
  const D = ix.n * ix.n, v = new Float64Array(D);
  let mean = 0; for (let i = 0; i < D; i++) mean += bl[i]; mean /= D;
  let nn = 0; for (let i = 0; i < D; i++) { v[i] = bl[i] - mean; nn += v[i] * v[i]; }
  nn = Math.sqrt(nn) + 1e-6; for (let i = 0; i < D; i++) v[i] = v[i] / nn - ix.mean[i];
  const z = new Float32Array(ix.k); let zn = 0;
  for (let j = 0; j < ix.k; j++) { let s = 0; for (let i = 0; i < D; i++) s += v[i] * ix.pca[j * D + i]; z[j] = s; zn += s * s; }
  zn = Math.sqrt(zn) || 1; for (let j = 0; j < ix.k; j++) z[j] /= zn;
  return z;
}

/** The closest seals: indices and scores (cosine), best first. */
export function nearest(z: Float32Array, ix: Index, top = 24): { i: number; score: number }[] {
  const count = ix.norms.length, best: { i: number; score: number }[] = [];
  for (let i = 0; i < count; i++) {
    let s = 0; const o = i * ix.k; for (let j = 0; j < ix.k; j++) s += z[j] * ix.seals[o + j];
    s /= ix.norms[i];
    if (best.length < top || s > best[best.length - 1].score) {
      best.push({ i, score: s }); best.sort((a, b) => b.score - a.score); if (best.length > top) best.pop();
    }
  }
  return best;
}
