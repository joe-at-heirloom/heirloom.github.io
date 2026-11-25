// The Japanese section's data, from the reference collection (the records the
// Advisor reads, built by the app's scripts/reference/collect.ts from
// backend/src/data/mark-tables/japanese.json) and this repo's
// marks/img/japanese/index-*.json (museum photographs, book cuts and crest
// drawings, matched to rows by row_id): every mark, seal, signature and crest
// with its pictures and sources; the date tables the date reader uses; the
// censor- and date-seal rules the print-seal reader uses.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { collection } from './portal';
import { soften } from './site';
import jaTable from '../data/app/japanese.json';

export type Photo = { file: string; label: string; caption: string; credit: string; url: string | null; view: string | null; visible: string | null; kind: 'museum' | 'book' | 'crest' };
export type Fact = { text: string; sources: string[]; single: boolean };
export type JaMark = {
  id: string; slug: string; group: string; family: string; kind: string; chars: string; charsNote: string | null; variants: string[];
  kana: string | null; romaji: string; romajiPlain: string | null; spellings: string[]; meaning: string; device: string | null;
  wares: string[]; technique: string | null; where: string | null; from: number | null; to: number | null; dateNote: string | null;
  tells: string | null; cautions: string | null; maker: string | null; artist: string | null; facts: Fact[]; photos: Photo[];
  sources: { citation: string; url: string | null }[]; singleSource: boolean; glyphs: string[]; keys: string[];
};
export type Family = { id: string; name: string };
export type Group = { id: string; family: string; name: string; short: string; start: number; end: number };

/** Kanji (with compatibility ideographs) and kana. Escaped: a literal range is folded by NFC on write. */
export const JA = /[぀-ヿ㐀-鿿豈-﫿]/;
const T = (jaTable as any).systems;

export const FAMILIES: Family[] = (T.marks.families ?? []).map((f: any) => ({ id: String(f.id), name: String(f.name) }));
// The years each group's lane shows on the timeline.
const SPAN: Record<string, [number, number]> = {
  hizen: [1610, 2000], satsuma_kyoto: [1640, 2000], kutani_export: [1650, 2000], prints_censor: [1790, 1880], prints_publishers: [1660, 1990],
  prints_artists: [1680, 1990], cloisonne: [1830, 1990], metal_silver: [1850, 2000], kamon: [1600, 2000],
};
export const GROUPS: Group[] = (T.marks.groups ?? []).map((g: any) => ({
  id: String(g.id), family: String(g.family), name: String(g.name), short: String(g.short ?? g.name), start: SPAN[g.id]?.[0] ?? 1600, end: SPAN[g.id]?.[1] ?? 2000,
}));

function images(): Map<string, Photo[]> {
  const dir = join(process.cwd(), 'src', 'data', 'site', 'japanese');
  const by = new Map<string, Photo[]>();
  if (!existsSync(dir)) return by;
  for (const f of readdirSync(dir).filter((n) => /^index.*\.json$/.test(n))) {
    const kind: Photo['kind'] = /book/.test(f) ? 'book' : /crest/.test(f) ? 'crest' : 'museum';
    for (const i of JSON.parse(readFileSync(join(dir, f), 'utf8')) as any[]) {
      if (!i.row_id || !i.file) continue;
      const p: Photo = {
        file: `marks/img/japanese/${i.file}`, kind,
        label: String(i.title ?? i.book ?? i.commons_file ?? ''), caption: soften(String(i.caption ?? '')),
        credit: String(i.credit ?? ''), url: i.object_url ?? i.url ?? null, view: i.view ?? null,
        visible: kind === 'museum' ? (i.inscription_visible ?? null) : 'yes',
      };
      (by.get(i.row_id) ?? by.set(i.row_id, []).get(i.row_id)!).push(p);
    }
  }
  return by;
}

// Within a group: in time order, then by name.
export function marks(): JaMark[] {
  const c = collection();
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const pics = images();
  const order = new Map(GROUPS.map((g, i) => [g.id, i]));
  return c.records
    .filter((r) => r.family === 'japanese-marks' && r.kind !== 'era name' && r.kind !== 'date system' && !r.parent_id)
    .map((r): JaMark => {
      const a = r.attributes;
      const slug = r.anchor ?? r.id.replace(/^ja-/, '');
      const chars = String(a.chars ?? '');
      const variants: string[] = Array.isArray(a.variants) ? a.variants.map(String) : [];
      // A crop of the mark first, then views where the mark shows, then the rest.
      const rank = (p: Photo) => (p.kind === 'book' || p.kind === 'crest' ? 1 : p.visible === 'yes' ? (/-mark\./.test(p.file) ? 0 : 1) : p.visible === 'partly' ? 2 : 3);
      const photos = (pics.get(slug) ?? []).sort((x, y) => rank(x) - rank(y));
      return {
        id: r.id, slug, group: String(a.group ?? ''), family: String(a.group ? GROUPS.find((g) => g.id === a.group)?.family ?? '' : ''), kind: String(a.kind ?? r.kind),
        chars, charsNote: a.chars_note ?? null, variants, kana: a.kana ?? null, romaji: String(a.romaji ?? ''), romajiPlain: a.romaji_plain ?? null,
        spellings: (r.keys ?? []).filter((k) => !JA.test(k)),
        meaning: soften(String(a.meaning ?? '')), device: a.device ? soften(String(a.device)) : null,
        wares: Array.isArray(a.wares) ? a.wares.map(String) : [], technique: a.technique ? soften(String(a.technique)) : null, where: a.where_on_object ? soften(String(a.where_on_object)) : null,
        from: r.date_from ?? null, to: r.date_to ?? null, dateNote: r.date_note ? soften(r.date_note) : null,
        tells: a.what_it_tells ? soften(String(a.what_it_tells)) : null, cautions: a.cautions ? soften(String(a.cautions)) : null,
        maker: r.maker ?? null, artist: a.artist?.name_romaji ? `${a.artist.name_romaji}${a.artist.name_ja ? ` ${a.artist.name_ja}` : ''}${a.artist.born ? ` (${a.artist.born}–${a.artist.died ?? ''})` : ''}` : null,
        facts: (Array.isArray(a.facts) ? a.facts : []).map((f: any) => ({
          text: soften(String(f.text ?? '')), single: !!f.single_source,
          sources: (f.sources ?? []).map((id: string) => src.get(`japanese:${id}`)?.citation ?? '').filter(Boolean),
        })),
        photos,
        sources: r.sources.map((s) => src.get(s.id)).filter(Boolean).map((s) => ({ citation: s!.citation, url: s!.url ?? null })),
        singleSource: r.single_source,
        glyphs: [...new Set([...chars, ...variants.join('')].filter((ch) => JA.test(ch)))],
        keys: r.keys,
      };
    })
    .sort((x, y) => (order.get(x.group) ?? 99) - (order.get(y.group) ?? 99) || (x.from ?? 9999) - (y.from ?? 9999) || x.romaji.localeCompare(y.romaji));
}

/** The date tables (japanese.json `dates`), for the date reader and its tables. */
export function dateTables(): any {
  return T.dates;
}

/** Citations of the table's sources, by id. */
export function sourceNames(): Map<string, { name: string; url: string | null }> {
  return new Map((T.marks.sources ?? []).map((s: any) => [String(s.id), { name: String(s.name ?? s.id), url: s.url ?? null }]));
}

/** The print-seal rules: date seals by period, the censors' seals, Watanabe's seals. */
export function printSealTables() {
  return {
    dateSeals: (T.marks.date_seal_rules?.rows ?? []) as any[],
    watanabe: (T.marks.watanabe_seal_rules?.rows ?? []) as any[],
  };
}

/** Every kanji and kana a page sets, for the font subset request. */
export function pageChars(text: unknown, extra = ''): string {
  const all = (typeof text === 'string' ? text : JSON.stringify(text)) + extra;
  return [...new Set([...all].filter((c) => JA.test(c)))].join('');
}

// ── Cards in the page, details on demand ────────────────────────────────────
// The explorer page carries what its cards, timeline and search need; what
// the panel shows (facts, pictures, sources) is one JSON file the panel fetches
// when a mark is first opened (/marks/data/japanese-details.json), with each
// source written once and referred to by number.
export type JaCard = Pick<JaMark, 'id' | 'slug' | 'group' | 'family' | 'kind' | 'chars' | 'charsNote' | 'variants' | 'kana' | 'romaji' | 'romajiPlain' | 'spellings' | 'meaning' | 'from' | 'to' | 'maker' | 'artist' | 'glyphs'> & { photo: Photo | null; pictures: number };
export type JaDetail = {
  device: string | null; wares: string[]; technique: string | null; where: string | null; dateNote: string | null; tells: string | null; cautions: string | null;
  facts: { t: string; s: number[]; one: boolean }[]; photos: Photo[]; sources: number[]; single: boolean;
};
export type JaDetails = { src: { c: string; u: string | null }[]; rows: Record<string, JaDetail> };

export function cards(rows: JaMark[]): JaCard[] {
  return rows.map((r) => ({
    id: r.id, slug: r.slug, group: r.group, family: r.family, kind: r.kind, chars: r.chars, charsNote: r.charsNote, variants: r.variants, kana: r.kana,
    romaji: r.romaji, romajiPlain: r.romajiPlain, spellings: r.spellings, meaning: r.meaning, from: r.from, to: r.to, maker: r.maker, artist: r.artist, glyphs: r.glyphs,
    photo: r.photos.find((p) => p.visible === 'yes') ?? null, pictures: r.photos.length,
  }));
}

export function details(rows: JaMark[]): JaDetails {
  const src: { c: string; u: string | null }[] = [];
  const at = new Map<string, number>();
  const ref = (c: string, u: string | null = null) => {
    const k = `${c}\u0000${u ?? ''}`;
    if (!at.has(k)) { at.set(k, src.length); src.push({ c, u }); }
    return at.get(k)!;
  };
  const byCitation = new Map<string, string | null>();
  for (const r of rows) for (const s of r.sources) byCitation.set(s.citation, s.url);
  const out: Record<string, JaDetail> = {};
  for (const r of rows) {
    out[r.id] = {
      device: r.device, wares: r.wares, technique: r.technique, where: r.where, dateNote: r.dateNote, tells: r.tells, cautions: r.cautions,
      facts: r.facts.map((f) => ({ t: f.text, s: f.sources.map((c) => ref(c, byCitation.get(c) ?? null)), one: f.single || f.sources.length < 2 })),
      photos: r.photos, sources: r.sources.map((s) => ref(s.citation, s.url)), single: r.singleSource,
    };
  }
  return { src, rows: out };
}
