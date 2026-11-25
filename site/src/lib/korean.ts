// The Korean section's data, from the reference collection (the records the
// Advisor reads, built by the app's scripts/reference/collect.ts from
// backend/src/data/mark-tables/korean.json and this repo's
// marks/img/korean/index.json): every inscription and maker's mark with its
// museum photographs and sources, and the date tables the date reader uses.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collection, type Rec } from './portal';
import { soften } from './site';
import koreanTable from '../data/app/korean.json';

export type Photo = { file: string; label: string; caption: string; credit: string; url: string | null; view: string | null; visible: string | null };
export type Fact = { text: string; sources: string[]; single: boolean };
export type Insc = {
  id: string; slug: string; group: string; kind: string; chars: string; variants: string[]; hangul: string | null; rr: string; mr: string | null;
  meaning: string; wares: string[]; technique: string | null; where: string | null; from: number | null; to: number | null; dateNote: string | null;
  tells: string | null; cautions: string | null; maker: string | null; place: string | null; facts: Fact[]; photos: Photo[];
  sources: { citation: string; url: string | null }[]; singleSource: boolean; glyphs: string[]; keys: string[];
};
export type Group = { id: string; name: string; short: string; start: number; end: number; blurb: string };

const HAN = /[\u3400-\u9FFF\uF900-\uFAFF]/;

/** The Korean section's own navigation (components/SectionNav). */
export const NAV = [
  { href: '/marks/korean/', label: 'Inscriptions and marks' },
  { href: '/marks/korean-dates', label: 'Reading a date' },
  { href: '/marks/korean-ceramics', label: 'Ceramics by period' },
];
const T = (koreanTable as any).systems;

export const GROUPS: Group[] = (T.inscriptions.groups ?? []).map((g: any) => ({
  id: String(g.id), name: String(g.name), short: String(g.short ?? g.name), start: Number(g.start), end: Number(g.end), blurb: soften(String(g.blurb ?? '')),
}));

// Within a ware: the royal orders first; white porcelain in time order (the court kiln's
// characters, then its cyclical years, then the palace marks); the others offices, places,
// characters, dates and makers, each in time order.
const KIND_ORDER = ['government office', 'palace hall', 'place + office', 'place name', 'character mark', 'ritual use', 'dedication', 'craftsman', 'date', "maker's mark", 'other'];
const kindRank = (r: { kind: string; slug: string; group: string }) => {
  if (/-(1417|1421)$/.test(r.slug)) return -1;
  if (r.group === 'white') return 0;
  const i = KIND_ORDER.indexOf(r.kind);
  return i < 0 ? 99 : i;
};

export function inscriptions(): Insc[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const kids = new Map<string, Rec[]>();
  for (const r of c.records) if (r.parent_id) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  const order = new Map(GROUPS.map((g, i) => [g.id, i]));
  return c.records
    .filter((r) => r.family === 'korean-marks' && (r.kind === 'inscription' || r.kind === "maker's mark"))
    .map((r): Insc => {
      const a = r.attributes;
      const photos: Photo[] = (kids.get(r.id) ?? [])
        .filter((k) => k.image_id && img.has(k.image_id))
        .map((k) => {
          const i = img.get(k.image_id!)!;
          return { file: i.file, label: k.name, caption: soften(k.summary ?? ''), credit: i.credit ?? '', url: i.source_url ?? null, view: k.attributes.view ?? null, visible: k.attributes.inscription_visible ?? null };
        })
        .sort((x, y) => (x.visible === 'yes' ? 0 : 1) - (y.visible === 'yes' ? 0 : 1));
      const chars = String(a.chars ?? '');
      const variants: string[] = Array.isArray(a.variants) ? a.variants.map(String) : [];
      return {
        id: r.id, slug: r.anchor ?? r.id.replace(/^ko-/, ''), group: String(a.group ?? ''), kind: String(a.kind ?? r.kind),
        chars, variants, hangul: a.hangul ?? null, rr: String(a.rr ?? ''), mr: a.mr ?? null, meaning: soften(String(a.meaning ?? '')),
        wares: Array.isArray(a.wares) ? a.wares.map(String) : [], technique: a.technique ?? null, where: a.where_on_object ?? null,
        from: r.date_from ?? null, to: r.date_to ?? null, dateNote: r.date_note ? soften(r.date_note) : null,
        tells: a.what_it_tells ? soften(String(a.what_it_tells)) : null, cautions: a.cautions ? soften(String(a.cautions)) : null,
        maker: r.maker ?? null, place: r.place ?? null,
        facts: (Array.isArray(a.facts) ? a.facts : []).map((f: any) => ({
          text: soften(String(f.text ?? '')), single: !!f.single_source,
          sources: (f.sources ?? []).map((id: string) => src.get(`korean:${id}`)?.citation ?? '').filter(Boolean),
        })),
        photos,
        sources: r.sources.map((s) => src.get(s.id)).filter(Boolean).map((s) => ({ citation: s!.citation, url: s!.url ?? null })),
        singleSource: r.single_source,
        glyphs: [...new Set([...chars, ...variants.join('')].filter((ch) => HAN.test(ch)))],
        keys: r.keys,
      };
    })
    .sort((x, y) => (order.get(x.group) ?? 9) - (order.get(y.group) ?? 9) || kindRank(x) - kindRank(y) || (x.from ?? 9999) - (y.from ?? 9999) || x.rr.localeCompare(y.rr));
}

/** How to read an inscription, and the cautions, from the app's table. */
export function readingNotes(): { reading: string[]; caveats: string[] } {
  const t = T.inscriptions;
  return {
    reading: (t.reading ?? []).map((x: any) => soften(String(x.text ?? x))),
    caveats: (t.caveats ?? []).map((x: any) => soften(String(x.text ?? x))),
  };
}

/** The date tables (korean.json `dates`), for the date reader and its tables. */
export function dateTables() {
  return T.dates;
}

/** Every hanja and hangul character a page sets, for the font subset requests. */
export function pageChars(rows: Insc[], extra = ''): { han: string; hangul: string } {
  const all = rows.map((r) => r.chars + r.variants.join('') + (r.hangul ?? '')).join('') + extra;
  const han = [...new Set([...all].filter((c) => HAN.test(c)))].join('');
  const hangul = [...new Set([...all].filter((c) => /[가-힣ㄱ-ㆎ]/.test(c)))].join('');
  return { han, hangul };
}

// ── The ceramics guide ──────────────────────────────────────────────────────

export type WarePhoto = { file: string; title: string; date: string; credit: string; url: string | null };
export type Ware = {
  id: string; name: string; hanja: string | null; hangul: string | null; rr: string | null; mr: string | null; period: string | null;
  from: number | null; to: number | null; dateNote: string | null; kilns: string[]; what: string; recognize: string[];
  copies: { text: string; sources: string[] }[]; facts: Fact[]; examples: { holder: string; id: string; title: string; url: string | null }[];
  photos: WarePhoto[]; sources: { citation: string; url: string | null }[]; singleSource: boolean; era: string;
};
export const WARE_ERAS: [string, string][] = [
  ['before', 'Before Goryeo'], ['goryeo', 'Goryeo, 918–1392'], ['buncheong', 'Buncheong, about 1365–1600'],
  ['joseon', 'Joseon porcelain, 15th century to 1910'], ['other', 'Storage jars'], ['modern', 'Since 1910'],
];
const eraOf = (id: string) =>
  /^(silla|early-celadon)/.test(id) ? 'before' : id.startsWith('goryeo') ? 'goryeo' : id.startsWith('buncheong') ? 'buncheong'
  : id === 'onggi' ? 'other' : /^(colonial|post1945)/.test(id) ? 'modern' : 'joseon';

export function wares(): Ware[] {
  const c = collection();
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const cite = (ids: string[] = []) => ids.map((id) => src.get(`korean:${id}`)?.citation ?? '').filter(Boolean);
  const file = join(process.cwd(), 'src', 'data', 'site', 'korean', 'index.json');
  const imgs: any[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  return c.records
    .filter((r) => r.family === 'korean-marks' && r.kind === 'ware')
    .map((r): Ware => {
      const a = r.attributes;
      const id = r.anchor ?? r.id.replace(/^ko-ware-/, '');
      return {
        id, name: r.name.replace(/\s+[\u3400-\u9FFF].*$/, ''), hanja: a.hanja ?? null, hangul: a.hangul ?? null, rr: a.rr ?? null, mr: a.mr ?? null, period: a.period ?? null,
        from: r.date_from ?? null, to: r.date_to ?? null, dateNote: r.date_note ? soften(r.date_note) : null, kilns: a.kilns ?? [],
        what: soften(r.summary ?? ''), recognize: (a.how_to_recognize ?? []).map((x: string) => soften(x)),
        copies: (a.copies ?? []).map((x: any) => ({ text: soften(String(x.text ?? '')), sources: cite(x.sources) })),
        facts: (a.facts ?? []).map((f: any) => ({ text: soften(String(f.text ?? '')), sources: cite(f.sources), single: !!f.single_source })),
        examples: (a.examples ?? []).map((x: any) => ({ holder: String(x.holder ?? ''), id: String(x.accession_or_designation ?? x.accession ?? ''), title: String(x.title ?? ''), url: x.url ?? null })),
        photos: imgs.filter((i) => i.group === 'ware_type' && i.ware_id === id).map((i) => ({ file: `marks/img/korean/${i.file}`, title: String(i.title ?? ''), date: String(i.date ?? '').replace(/\s+/g, ' '), credit: String(i.credit ?? ''), url: i.object_url ?? null })),
        sources: r.sources.map((s) => src.get(s.id)).filter(Boolean).map((s) => ({ citation: s!.citation, url: s!.url ?? null })),
        singleSource: r.single_source, era: eraOf(id),
      };
    })
    .sort((x, y) => WARE_ERAS.findIndex(([e]) => e === x.era) - WARE_ERAS.findIndex(([e]) => e === y.era) || (x.from ?? 0) - (y.from ?? 0));
}
