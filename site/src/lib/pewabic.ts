// Pewabic Pottery, Detroit: the pages' data. Two places, kept in step by the
// app's collect.ts:
//   - the reference collection (src/data/generated/collection.json): the marks
//     (marks-database entries, family ceramics-makers, with their pictures) and
//     every other Pewabic record, with the ids and anchors the Advisor links to;
//   - the app's table itself (src/data/app/pewabic.json, from data:sync): what
//     the pages tell beyond the records (making, reading notes, numbers, the
//     holders), with each fact's sources.
// The anchors here must match collect.ts: tiles #<id>, glazes #<id> and
// #ware-<id>, history #ev-<nnn> and #person-<id>, marks #era-<id> and
// #lookalike-<id>, collections #<id>.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collection, type Rec } from './portal';
import { sheet, clean, yearsOf, type Sheet, type Differ, type Pic } from './records';
import { media } from './media';

export const PW = {
  hub: '/marks/pewabic-pottery/',
  marks: '/marks/pewabic-pottery-marks',
  tiles: '/marks/pewabic-pottery/tile-installations',
  glazes: '/marks/pewabic-pottery/glazes',
  history: '/marks/pewabic-pottery/history',
  pieces: '/marks/pewabic-pottery/museum-collections',
} as const;
export const MAKER = 'Pewabic Pottery, Detroit';

type Cite = { id: string; where?: string };
type Src = { id: string; name: string; url: string | null; kind: string | null };
let T: any = null;
/** The app's Pewabic table (src/data/app/pewabic.json); empty when the sync has not brought it yet. */
export function table(): any {
  if (T) return T;
  const f = join(process.cwd(), 'src', 'data', 'app', 'pewabic.json');
  T = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  return T;
}
let S: Map<string, Src> | null = null;
const srcMap = () => (S ??= new Map<string, Src>((table().sources ?? []).map((s: Src) => [s.id, s])));

/** A list of citations, numbered once for a block, as the sheets number theirs. */
export function numbering() {
  const list: { n: number; citation: string; url: string | null; where: string | null }[] = [];
  const at = new Map<string, number>();
  const refs = (cites: Cite[] = []) =>
    [...new Set(cites.map((c) => {
      const s = srcMap().get(c.id);
      if (!s) return null;
      const key = `${c.id}|${c.where ?? ''}`;
      if (!at.has(key)) { at.set(key, list.length + 1); list.push({ n: list.length + 1, citation: s.name, url: s.url, where: c.where ?? null }); }
      return at.get(key)!;
    }).filter((n): n is number => n != null))].sort((a, b) => a - b);
  return { list, refs };
}
/** One item's sources as a sheet lists them. */
function sheetSources(cites: Cite[] = []) {
  const seen = new Set<string>();
  return cites.flatMap((c) => {
    const s = srcMap().get(c.id);
    const k = `${c.id}|${c.where ?? ''}`;
    if (!s || seen.has(k)) return [];
    seen.add(k);
    return [{ citation: s.name, url: s.url, where: c.where ?? null }];
  });
}
const differ = (list: string[] = []): Differ[] => {
  const values = list.map((t) => ({ text: clean(t) ?? '', refs: [] as number[] })).filter((v) => v.text);
  return values.length ? [{ label: 'What each says', values }] : [];
};
const fact = (label: string, text: unknown) => { const t = clean(text); return t ? [{ label, text: t }] : []; };
const keys = (...parts: unknown[]) => [...new Set(parts.flat().filter(Boolean).map((p) => String(p).toLowerCase()))].join(' ');

// ── Marks ───────────────────────────────────────────────────────────────────
export const MARK_GROUPS: { key: string; label: string; blurb: string }[] = [
  { key: 'stamps', label: 'Stamps and seals', blurb: 'Pressed into the clay before firing, usually in the middle of the foot. Glaze often half fills them, and many pieces carry the stamp twice.' },
  { key: 'labels', label: 'Paper labels', blurb: 'Pewabic often labeled a piece instead of stamping it, and labels come off. A label can also be stuck on years after a piece was made.' },
  { key: 'names', label: 'Names and initials', blurb: 'Mary Chase Perry’s own marks from the first workshop, and the Strattons’ names and initials on later pieces.' },
  { key: 'modern', label: 'Modern Pewabic, 1983 to today', blurb: 'The nonprofit Pewabic Pottery has made pottery and tile in the same building since 1983. Its pieces are Pewabic too, but not of Mary Chase Perry Stratton’s time.' },
];
const MODERN = /modern|seconds/;
function markGroup(r: Rec): string {
  if (MODERN.test(r.id)) return 'modern';
  if (r.kind === 'label') return 'labels';
  if (r.kind === 'signature' || /mcp-initials/.test(r.id)) return 'names';
  return 'stamps';
}
export function markRecords(): Rec[] {
  return collection().records.filter((r) => r.family === 'ceramics-makers' && r.maker === MAKER && r.kind !== 'maker history');
}
const USED: Record<string, string> = { vessels: 'Vessels', tiles: 'Tiles', both: 'Vessels and tiles' };
export function markSheet(r: Rec): Sheet {
  const s = sheet(r, markGroup(r));
  const a = r.attributes ?? {};
  const seen = (Array.isArray(a.examples) ? a.examples : []).slice(0, 4)
    .map((x: any) => [[x.holder, x.accession].filter(Boolean).join(' '), x.object_date].filter(Boolean).join(', ')).filter(Boolean);
  s.kind = 'Pewabic mark';
  s.facts = [
    ...s.facts.filter((f) => f.label !== 'Maker' && f.label !== 'Place'),
    ...fact('Where on the piece', a.where_on_piece),
    ...fact('Found on', USED[a.used_on] ?? null),
    ...(seen.length ? [{ label: 'Dated pieces that carry it', text: seen.join('; ') }] : []),
  ];
  s.differ = differ(a.disagreements);
  s.keys = keys(s.keys, 'pewabic', a.applied, a.where_on_piece);
  // Photographs of dated pieces that carry this mark (the mark's own picture stays first).
  if (s.pics.length) {
    const accs = new Set((Array.isArray(a.examples) ? a.examples : []).filter((x: any) => /Detroit Institute/.test(String(x.holder ?? ''))).map((x: any) => String(x.accession)));
    const carry = piecesWithPhotos().filter((p) => accs.has(String(p.accession))).slice(0, 6);
    s.pics = [...s.pics, ...carry.map((p) => asPic(p.photo, `${p.title}, ${p.date}, Detroit Institute of Arts ${p.accession}`))];
  }
  return s;
}
export function markGroups() {
  const sheets = markRecords().map(markSheet).sort((x, y) => (startOf(x) - startOf(y)));
  return MARK_GROUPS.map((g) => ({ ...g, sheets: sheets.filter((s) => s.group === g.key) })).filter((g) => g.sheets.length);
}
const startOf = (s: Sheet) => { const m = /\d{4}/.exec(s.years ?? ''); return m ? +m[0] : 2100; };

/** The dating key: every dated mark as a bar on one time line. */
export function markBars() {
  return markRecords()
    .filter((r) => r.date_from != null || r.date_to != null)
    .map((r) => ({ id: r.id, name: r.name, from: r.date_from ?? (r.date_to! - 5), to: r.date_to ?? 2026, open: r.date_to == null, group: markGroup(r), img: r.image_id ? collection().images.find((i) => i.id === r.image_id)?.file ?? null : null, single: r.single_source }))
    .sort((a, b) => a.from - b.from || a.to - b.to);
}

// ── Installations ───────────────────────────────────────────────────────────
export const TILE_GROUPS = [
  { key: 'detroit', label: 'Detroit', blurb: 'Churches, schools, libraries, office buildings, hospitals and houses in the city, from the 1900s to the People Mover stations of 1987.' },
  { key: 'michigan', label: 'Elsewhere in Michigan', blurb: 'The Grosse Pointes, Bloomfield Hills, Ann Arbor, East Lansing and the rest of the state.' },
  { key: 'us', label: 'Other states', blurb: 'From the National Shrine in Washington to churches and houses across the country.' },
  { key: 'abroad', label: 'Outside the United States', blurb: '' },
  { key: 'listed', label: 'Other commissions in the pottery’s books', blurb: 'Clients and buildings that Lillian Myers Pear’s 1976 appendix lists under the year of the commission, from the pottery’s own records, with no word on what Pewabic made for them. Many are firms that bought tile rather than buildings with a known installation.' },
];
const ERA: Record<string, string> = { stratton: 'Mary Chase Perry Stratton’s time (1903–1961)', after: 'After her death (1962–1966)', modern: 'After 1966', society: 'Pewabic today (since 1981)', unknown: '' };
const STATUS: Record<string, string> = { extant: 'Standing', altered: 'Altered', demolished: 'Gone', moved: 'Moved', unknown: '' };
const ACCESS: Record<string, string> = { 'open to public': 'Open to visit', 'by appointment': 'By appointment', private: 'Private', unknown: '' };
export function installations(): any[] { return table().installations ?? []; }
export function tileGroup(i: any) {
  if (i.listed_only) return 'listed';
  if ((i.country ?? 'US') !== 'US') return 'abroad';
  if (i.state !== 'MI') return 'us';
  return /^detroit$/i.test(String(i.city ?? '').trim()) ? 'detroit' : 'michigan';
}
export function tileSheet(i: any): Sheet {
  const place = [i.address, [i.city, i.state && i.state !== 'MI' ? i.state : null].filter(Boolean).join(', '), i.country && i.country !== 'US' ? i.country : null].filter(Boolean).join(', ');
  return {
    id: `pewabic-tile-${i.id}`, anchor: i.id, url: `${PW.tiles}#${i.id}`, kind: 'Pewabic installation', group: tileGroup(i),
    glyphs: null, lang: null, reading: clean(i.building) ?? i.building, means: clean([i.city && (tileGroup(i) !== 'detroit') ? `${i.city}${i.state && i.state !== 'MI' ? `, ${i.state}` : ''}` : null, i.what ?? (i.listed_only ? null : 'The work is not described')].filter(Boolean).join(': ')),
    years: i.from ? String(i.from) : null,
    facts: [
      ...fact('Where', place),
      ...fact('The Pewabic work', i.what),
      ...fact('Years', i.years),
      ...fact('Building', [i.type, i.architect ? `architect ${i.architect}` : null].filter(Boolean).join('; ')),
      ...fact('Tile design', i.designer),
      ...fact('Made', ERA[i.era] || null),
      ...fact('Today', [STATUS[i.status] || null, i.status_note && i.status !== 'unknown' ? i.status_note.replace(/^[a-z]+,?\s*/i, '').replace(/^\((.*)\)$/, '$1') : null].filter(Boolean).join(': ')),
      ...fact('Visiting', ACCESS[i.access] || null),
      ...(i.other_names?.length ? fact('Also called', i.other_names.join('; ')) : []),
    ],
    differ: differ(i.disagreements),
    caution: i.disputed ? 'The sources disagree on whether this work is Pewabic’s.' : null,
    pics: photosOf(i.id).map((p) => asPic(p, p.caption ?? i.building)), sources: sheetSources(i.sources), single: !!i.single,
    keys: keys(i.building, i.other_names, i.city, i.state, i.address, i.architect, i.what, i.type),
  };
}
/** Each group in the order the work was made (undated last), then by name. */
export function tileGroups() {
  const sheets = installations().map(tileSheet);
  const y = (s: Sheet) => (s.years ? +s.years : 9999);
  return TILE_GROUPS.map((g) => ({ ...g, sheets: sheets.filter((s) => s.group === g.key).sort((a, b) => y(a) - y(b) || a.reading.localeCompare(b.reading)) })).filter((g) => g.sheets.length);
}

// ── Glazes, wares, making ───────────────────────────────────────────────────
export const GLAZE_FAMILIES: [string, string, string][] = [
  ['matte', 'The first glazes: matte', 'Thick, opaque glazes with a dull, soft surface, in greens, yellows, buffs and browns: what Pewabic made first, and never stopped making.'],
  ['drip', 'Flowing and dripped glazes', 'A heavy glaze of one color run down over another while firing.'],
  ['crystalline', 'Crystals in the glaze', 'Small light spots that formed in the glaze as it cooled; not the large crystal flowers some potters made.'],
  ['iridescent', 'The iridescent glazes', 'The glazes Pewabic is known for: a metallic, shifting skin made in the glaze itself by a third, smoky firing. First sold in 1909.'],
  ['luster', 'Luster', 'A brilliant metallic surface, described by the Detroit Museum of Art in 1913.'],
  ['gloss', 'Gloss and crackle', 'Shiny glazes, and a crackled glaze over a buff body.'],
  ['other', 'Other glazes and surfaces', 'Named glazes the sources mention, unglazed tile, and today’s glazes.'],
];
export function glazes(): any[] { return table().glazes ?? []; }
export function wares(): any[] { return table().wares ?? []; }
export function making(): any[] { return table().making ?? []; }
export function reading(): any[] { return table().reading ?? []; }

// ── History ─────────────────────────────────────────────────────────────────
export function events(): any[] { return table().events ?? []; }
export function people(): any[] { return table().people ?? []; }
export function places(): any[] { return table().places ?? []; }
export function eras(): any[] { return table().eras ?? []; }
export function lookalikes(): any[] { return table().lookalikes ?? []; }
export function reproductions(): any[] { return table().reproductions ?? []; }
export function salvage(): any[] { return table().salvage ?? []; }
export function numbers(): any[] { return table().numbers ?? []; }
export function claims(): { name: any[]; founding: any[] } { return table().claims ?? { name: [], founding: [] }; }

// ── Pieces in collections ───────────────────────────────────────────────────
export function pieces(): any[] { return table().pieces ?? []; }
export function holders(): { name: string; count: number }[] { return table().holders ?? []; }
export type Photo = { file: string; size?: number[]; caption?: string; title?: string; date?: string; holder?: string | null; accession?: string; page: string | null; licence: string; credit: string; base?: boolean; ref?: string | null; set?: string };
/** The table's photographs other than the DIA's pieces: installations, the building, today's Pewabic, making, displays, look-alikes. */
export function photos(set?: string): Photo[] { return (table().photos ?? []).filter((p: Photo) => !set || p.set === set); }
/** Photographs of one installation (by its id). */
export const photosOf = (ref: string) => photos().filter((p) => p.ref === ref);
/** Pieces in collections with a photograph, each with its first view that is not the base. */
export function piecesWithPhotos(): (any & { photo: Photo })[] {
  return pieces().filter((p) => p.photos?.length).map((p) => {
    const ph = p.photos.find((x: any) => !x.base) ?? p.photos[0];
    return { ...p, photo: { ...ph, holder: p.holder, accession: p.accession, title: p.title, date: p.date } };
  });
}
/** A few pieces, by accession, in the order given (for a page's chosen pictures). */
export function chosen(accs: string[]) {
  const all = new Map(piecesWithPhotos().map((p) => [p.accession, p]));
  return accs.map((a) => all.get(a)).filter(Boolean) as ReturnType<typeof piecesWithPhotos>;
}
/** Up to n photographed pieces the museum dates inside an era, spread across it. */
export function eraPieces(e: { from: number | null; to: number | null }, n = 5) {
  const inside = piecesWithPhotos().filter((p) => p.from != null && e.from != null && p.from >= e.from && p.from < (e.to ?? 9999) && (p.to ?? p.from) <= (e.to ?? 9999) + 1)
    .sort((a, b) => a.from - b.from);
  if (inside.length <= n) return inside;
  return Array.from({ length: n }, (_, k) => inside[Math.round((k * (inside.length - 1)) / (n - 1))]);
}
/** The DIA's base photographs (marks with their labels). */
export function basePhotos() {
  return pieces().flatMap((p) => (p.photos ?? []).filter((x: any) => x.base).map((x: any) => ({ ...x, holder: p.holder, accession: p.accession, title: p.title, date: p.date, pieceUrl: p.url })));
}
/** A piece's photograph as a PwPhotos item (links to its row on the collections page). */
export const pieceItem = (p: any) => ({
  file: p.photo.file, w: p.photo.size?.[0], h: p.photo.size?.[1], alt: `${p.title ?? 'Piece'}, Pewabic Pottery, ${p.date ?? ''}`.trim(),
  title: `${p.title ?? 'Piece'}${p.date ? `, ${String(p.date).replace(/^between (\d{4}) and (\d{4})$/i, '$1–$2').replace(/^ca\.\s*/i, 'about ')}` : ''}`,
  sub: `${p.holder === 'Detroit Institute of Arts' ? 'DIA' : p.holder} ${p.accession ?? ''}`.trim(), credit: 'Photograph: Detroit Institute of Arts', page: p.url ?? null, href: `${PW.pieces}#${p.id}`,
});
/** Any other photograph as a PwPhotos item. */
export const photoItem = (p: Photo, href?: string | null) => ({ file: p.file, w: p.size?.[0], h: p.size?.[1], alt: p.caption ?? '', title: p.caption ?? '', sub: null, credit: p.credit, page: p.page ?? null, href: href ?? null });
/** A photograph as a sheet's picture. */
export const asPic = (p: Photo, alt: string): Pic => ({ file: media(p.file), status: 'photo', credit: p.credit, url: p.page ?? null, alt });

export { yearsOf, clean };
