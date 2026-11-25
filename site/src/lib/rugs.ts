// The rugs section's data: the app's table (backend/src/data/mark-tables/
// rugs.json, built by hallmark-sources/rugs/build_table.py and copied here by
// sync-data), and the pictures of each type from the reference collection.
// Every page of /marks/rugs/ reads it: the types catalogue, the "turn it over"
// reader, the hand-made checks, the woven-date reader, the knot counts, the
// labels and the dyes.
import { collection, type Rec } from './portal';
import { soften } from './site';
import { media } from './media';
import { clean, yearsOf, type Sheet, type Fact, type Differ } from './records';
import rugsTable from '../data/app/rugs.json';

const T: any = (rugsTable as any).systems ?? {};
const S = (x: unknown) => (x == null || x === '' ? null : soften(String(x)));
const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String).filter(Boolean) : x ? [String(x)] : []);

// ── Sources ─────────────────────────────────────────────────────────────────
export type Src = { id: string; name: string; url: string | null; inCopyright: boolean };
const SOURCES = new Map<string, Src>();
for (const sys of Object.values<any>(T)) for (const s of sys?.sources ?? []) if (!SOURCES.has(s.id)) SOURCES.set(s.id, { id: s.id, name: String(s.name ?? s.id), url: s.url ?? null, inCopyright: !!s.in_copyright });
export const source = (id: string) => SOURCES.get(id) ?? null;
export const cite = (ids: unknown) => arr(ids).map((i) => SOURCES.get(i)).filter(Boolean) as Src[];

// ── Types ───────────────────────────────────────────────────────────────────
export type Structure = {
  knot: string[]; knotNote: string | null; kpsi: [number, number] | null; kpsiNote: string | null;
  warp: string[]; warpColor: string | null; warpOffset: string[]; weft: string[]; weftColor: string | null; wefts: number[]; weftsNote: string | null;
  pile: string[]; pileNote: string | null; sides: string | null; ends: string | null; handle: string | null; back: string | null;
};
export type Photo = { file: string; caption: string; credit: string; url: string | null; view: string | null; title: string };
export type RugType = {
  id: string; slug: string; group: string; name: string; others: string[]; native: string | null; translit: string | null;
  country: string | null; region: string | null; madeBy: string | null; kind: string | null;
  from: number | null; to: number | null; dateNote: string | null;
  st: Structure;
  design: { field: string | null; motifs: string[]; border: string | null; colors: string | null; formats: string[]; sizes: string | null };
  lookAlikes: { id: string | null; name: string; how: string }[];
  trade: string | null; tells: string | null; cautions: string | null;
  facts: { text: string; sources: string[]; single: boolean }[];
  differ: { about: string; says: { source: string; text: string }[] }[];
  sources: string[]; single: boolean; photos: Photo[];
};
export type Group = { id: string; name: string; blurb: string | null; region: string | null };

export const GROUPS: Group[] = (T.types?.groups ?? []).map((g: any) => ({ id: String(g.id), name: String(g.name), blurb: S(g.blurb), region: g.region ?? null }));

const nums = (x: unknown): number[] => (Array.isArray(x) ? x.map(Number).filter((n) => Number.isFinite(n)) : typeof x === 'number' ? [x] : []);
function structureOf(s: any = {}): Structure {
  const k = nums(s.kpsi);
  return {
    knot: arr(s.knot), knotNote: S(s.knot_note), kpsi: k.length ? [Math.min(...k), Math.max(...k)] : null, kpsiNote: S(s.kpsi_note),
    warp: arr(s.warp), warpColor: S(s.warp_color), warpOffset: arr(s.warp_offset), weft: arr(s.weft), weftColor: S(s.weft_color), wefts: nums(s.wefts), weftsNote: S(s.wefts_note),
    pile: arr(s.pile), pileNote: S(s.pile_note), sides: S(s.sides), ends: S(s.ends), handle: S(s.handle), back: S(s.back),
  };
}

let cache: RugType[] | null = null;
/** Every rug type, in its group's order, then by name. */
export function types(): RugType[] {
  if (cache) return cache;
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const kids = new Map<string, Rec[]>();
  for (const r of c.records) if (r.parent_id && r.family === 'rugs') (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  const order = new Map(GROUPS.map((g, i) => [g.id, i]));
  cache = (T.types?.rows ?? []).map((r: any): RugType => {
    const photos: Photo[] = (kids.get(`rug-${r.id}`) ?? []).filter((k) => k.image_id && img.has(k.image_id)).map((k) => {
      const i = img.get(k.image_id!)!;
      return { file: i.file, caption: S(k.summary) ?? '', credit: i.credit ?? '', url: i.source_url ?? null, view: (k.attributes as any)?.view ?? null, title: k.name };
    });
    const d = r.design ?? {};
    return {
      id: `rug-${r.id}`, slug: r.id, group: String(r.group ?? ''), name: String(r.name), others: arr(r.other_names), native: r.native ?? null, translit: r.translit ?? null,
      country: r.country ?? null, region: S(r.region), madeBy: S(r.made_by), kind: r.kind ?? null,
      from: r.date_from ?? null, to: r.date_to ?? null, dateNote: S(r.date_note),
      st: structureOf(r.structure),
      design: { field: S(d.field), motifs: arr(d.motifs), border: S(d.border), colors: S(d.colors), formats: arr(d.formats), sizes: S(d.sizes) },
      lookAlikes: (r.look_alikes ?? []).map((l: any) => ({ id: l.id ?? null, name: String(l.name ?? l.id ?? ''), how: S(l.how_to_tell) ?? '' })).filter((l: any) => l.name),
      trade: S(r.trade_use), tells: S(r.what_it_tells), cautions: S(r.cautions),
      facts: (r.facts ?? []).map((f: any) => ({ text: S(f.text) ?? '', sources: arr(f.sources), single: !!f.single_source })),
      differ: (r.disagreements ?? []).map((x: any) => ({ about: String(x.about ?? ''), says: (x.says ?? []).map((y: any) => ({ source: String(y.source ?? ''), text: S(y.text) ?? '' })) })),
      sources: arr(r.sources), single: !!r.single_source, photos,
    };
  }).sort((a: RugType, b: RugType) => (order.get(a.group) ?? 99) - (order.get(b.group) ?? 99) || a.name.localeCompare(b.name));
  return cache!;
}
export const typeBySlug = (slug: string) => types().find((t) => t.slug === slug) ?? null;

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);
const kpsiText = (st: Structure) => (st.kpsi ? (st.kpsi[0] === st.kpsi[1] ? `about ${st.kpsi[0]}` : `${st.kpsi[0]} to ${st.kpsi[1]}`) : null);
const KIND: Record<string, string> = {
  'city workshop': 'City workshop rug', village: 'Village rug', 'tribal': 'Tribal rug', 'tribal (nomadic or settled)': 'Tribal rug', 'court or classical': 'Classical design',
  'trade name': 'Trade name', revival: 'Revival', 'export production': 'Export production', 'machine-made': 'Machine-made',
};
export const kindLabel = (k: string | null) => (k ? KIND[k] ?? k.charAt(0).toUpperCase() + k.slice(1) : 'Rug type');

/** A rug type as a catalogue sheet (components/ref/Catalogue, RecordSheet). */
export function rugSheet(t: RugType): Sheet {
  const st = t.st;
  // The sheet's sources, numbered; each fact's and disagreement's sources take the same numbers.
  const ids = [...new Set([...t.sources, ...t.facts.flatMap((f) => f.sources), ...t.differ.flatMap((d) => d.says.map((s) => s.source))])].filter((i) => SOURCES.has(i));
  const num = (id: string) => ids.indexOf(id) + 1;
  const facts: [string, string | null][] = [
    ['Also called', t.others.join(', ') || null],
    ['Made in', t.region],
    ['Woven by', t.madeBy],
    ['Dates', t.dateNote],
    ['Knot', st.knot.length ? (st.knotNote && st.knotNote.toLowerCase().startsWith(st.knot[0].split(' ')[0].toLowerCase()) ? st.knotNote : [list(st.knot), st.knotNote].filter(Boolean).join('. ')) : st.knotNote],
    ['Knots per square inch', [kpsiText(st), st.kpsiNote].filter(Boolean).join('. ') || null],
    ['Warps (the lengthwise threads)', st.warp.length ? [list(st.warp), st.warpColor, st.warpOffset.length ? `${list(st.warpOffset)}` : null].filter(Boolean).join('; ') : null],
    ['Wefts (the crosswise threads)', st.weft.length || st.wefts.length ? [st.weft.length ? list(st.weft) : null, st.wefts.length ? `${list(st.wefts.map(String))} between each row of knots` : null, st.weftColor, st.weftsNote].filter(Boolean).join('; ') : null],
    ['Pile', st.pile.length ? [list(st.pile), st.pileNote].filter(Boolean).join('; ') : null],
    ['Sides', st.sides],
    ['Ends', st.ends],
    ['How it feels', st.handle],
    ['The back', st.back],
    ['Designs', [t.design.field, t.design.border && `Border: ${t.design.border}`].filter(Boolean).join(' ') || null],
    ['Colors', t.design.colors],
    ['Sizes', [t.design.formats.join(', '), t.design.sizes].filter(Boolean).join('; ') || null],
    ['Easily mistaken for', t.lookAlikes.map((l) => `${l.name}${l.how ? `: ${l.how}` : ''}`).join(' ') || null],
    ['In the trade', t.trade],
    ['What it tells you', t.tells],
  ];
  const differ: Differ[] = t.differ.filter((d) => d.says.length > 1).map((d) => ({
    label: d.about.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    values: d.says.map((s) => ({ text: s.text, refs: SOURCES.has(s.source) ? [num(s.source)] : [] })),
  }));
  const pics = t.photos.map((p) => ({ file: media(p.file), status: 'photo', credit: p.credit, url: p.url, alt: p.caption || p.title }));
  const keys = [t.name, ...t.others, t.native, t.translit, t.region, t.country, t.madeBy, ...t.design.motifs].filter(Boolean).map((x) => String(x).toLowerCase());
  return {
    id: t.id, anchor: t.slug, url: `/marks/rugs/types#${t.slug}`, kind: kindLabel(t.kind), group: t.group,
    glyphs: t.native, typeset: false, lang: t.native ? 'in' : null, reading: t.name, means: t.country,
    years: yearsOf(t.from, t.to),
    facts: facts.filter(([, v]) => v).map(([label, text]) => ({ label, text: clean(text) ?? '' })).filter((f: Fact) => f.text),
    differ, caution: clean(t.cautions),
    pics,
    sources: ids.map((i) => { const s = SOURCES.get(i)!; return { citation: s.name, url: s.url, where: null }; }),
    single: t.single,
    keys: [...new Set(keys)].join(' '),
  };
}

// ── The other tables ────────────────────────────────────────────────────────
export const dates = (): any => T.dates ?? {};
export const labels = (): any[] => T.labels?.rows ?? [];
export const knots = (): any[] => T.knots?.rows ?? [];
export const checks = (): any => T.checks ?? {};
export const dyes = (): any => T.dyes ?? {};
export const caveats = (): string[] => (T.types?.caveats ?? []).map((c: any) => S(c.text ?? c) ?? '').filter(Boolean);
export { yearsOf, clean };

/** Persian, Arabic and Armenian characters a page sets, for the font subset request. */
export function rugChars(...texts: unknown[]): string {
  const all = texts.map((t) => (typeof t === 'string' ? t : JSON.stringify(t ?? ''))).join('');
  return [...new Set([...all].filter((c) => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(c)))].join('');
}
