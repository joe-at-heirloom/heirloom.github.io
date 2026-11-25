// The marks portal's data, from the reference collection (src/data/generated/
// collection.json, built by the app's scripts/reference/collect.ts: the same
// records the Advisor reads). Two searches, kept apart: marks (what is struck,
// painted or printed on an object) and signatures (who signed or sealed a
// painting). Three shapes:
//   index:  one search's records but the seals, compact, for searching as you type;
//   seals:  the Chinese seals and signatures, loaded only when asked for;
//   family: the full records of one family, loaded when a record is opened.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { soften } from './site';

export type Rec = {
  id: string; family: string; kind: string; name: string; summary?: string | null; looks_like?: string | null;
  maker?: string | null; place?: string | null; country?: string | null; date_from?: number | null; date_to?: number | null;
  date_note?: string | null; keys: string[]; parent_id?: string | null; image_id?: string | null; page_path: string;
  anchor?: string | null; single_source: boolean; attributes: Record<string, any>; sources: { id: string; where?: string | null }[];
};
export type Img = { id: string; file: string; status: string; credit?: string | null; licence?: string | null; holder?: string | null; source_url?: string | null; object?: string | null };
export type Src = { id: string; citation: string; url?: string | null };
export type Collection = { meta: { app_commit: string; site_commit: string; built_at: string }; records: Rec[]; images: Img[]; sources: Src[] };

let cached: Collection | null = null;
export function collection(): Collection {
  if (cached) return cached;
  const file = join(process.cwd(), 'src', 'data', 'generated', 'collection.json');
  if (!existsSync(file)) throw new Error('src/data/generated/collection.json is missing: run `npm run data:sync` first');
  cached = JSON.parse(readFileSync(file, 'utf8')) as Collection;
  return cached;
}

export const SEAL_KINDS = new Set(['seal or signature', "collector's seal"]);
export const FAMILY: Record<string, { label: string; order: number }> = {
  'british-hallmarks': { label: 'British hallmarks', order: 1 },
  'world-silver': { label: 'Silver from other countries', order: 2 },
  'silver-standards': { label: 'Silver standards', order: 3 },
  'silver-plate': { label: 'Silver plate', order: 4 },
  gold: { label: 'Gold', order: 5 },
  'ceramics-makers': { label: 'Porcelain and pottery makers', order: 6 },
  'pottery-codes': { label: 'Pottery date codes', order: 7 },
  'chinese-marks': { label: 'Chinese marks', order: 8 },
  'chinese-people': { label: 'Chinese painters and collectors', order: 9 },
  signatures: { label: 'Artist signatures', order: 10 },
  'swiss-watches': { label: 'Watches', order: 11 },
  'serial-numbers': { label: 'Serial numbers', order: 12 },
};
/** The families each search covers. Signatures are their own reference, not marks. */
export type Scope = 'marks' | 'signatures';
const SIGNATURE_FAMILIES = new Set(['signatures', 'chinese-people']);
export const inScope = (family: string, scope: Scope) => SIGNATURE_FAMILIES.has(family) === (scope === 'signatures');

export const familyLabel = (f: string) => FAMILY[f]?.label ?? f.replace(/-/g, ' ');

// A record whose page the site's templates make before the collection knows of it carries that address as intended_page.
export const urlOf = (r: Rec) => `${r.attributes?.intended_page ?? r.page_path}${r.anchor ? `#${r.anchor}` : ''}`;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** One search row: id, name, kind, family, years, thumbnail, short line, address, search words. */
export type IndexRow = [string, string, string, string, number | null, number | null, string | null, string, string, string];
export function indexRows(scope: Scope): IndexRow[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i.file]));
  // A record with no image of its own (a reign, an artist, a maker) shows its
  // first child's: a reign's regular-script six-character facsimile first.
  const childImg = new Map<string, string>();
  const rank = (id: string) => (/kaishu6/.test(id) ? 0 : /kaishu/.test(id) ? 1 : /book-/.test(id) ? 2 : 3);
  for (const r of [...c.records].sort((a, b) => rank(a.id) - rank(b.id))) {
    if (r.parent_id && r.image_id && !childImg.has(r.parent_id)) childImg.set(r.parent_id, img.get(r.image_id)!);
  }
  return c.records
    .filter((r) => !SEAL_KINDS.has(r.kind) && inScope(r.family, scope))
    .map((r) => {
      const words = [...new Set([...r.keys, r.maker ?? '', r.place ?? ''].map((w) => w.toLowerCase()).filter(Boolean))].join('|');
      return [r.id, r.name, r.kind, r.family, r.date_from ?? null, r.date_to ?? null, (r.image_id ? img.get(r.image_id) : null) ?? childImg.get(r.id) ?? null,
        soften(clip(r.summary || r.looks_like || '', 150)), urlOf(r), words];
    });
}

/** One seal row: id, reading, person id, person (pinyin), the work it is on, its date. */
export type SealRow = [string, string, string, string, string, string];
export function sealRows(): SealRow[] {
  const c = collection();
  const people = new Map(c.records.filter((r) => r.family === 'chinese-people' && !SEAL_KINDS.has(r.kind)).map((r) => [r.id, r]));
  return c.records
    .filter((r) => SEAL_KINDS.has(r.kind))
    .map((r) => {
      const p = people.get(r.parent_id ?? '');
      const pinyin = p ? p.name.split(' ').slice(1).join(' ') : '';
      return [r.id, String(r.attributes.reading ?? ''), r.parent_id ?? '', pinyin, clip(String(r.attributes.work ?? ''), 60), String(r.attributes.date_text ?? '')];
    });
}

/** Full records of one family, with their image, sources resolved, parent name and children ids. */
export function familyRecords(family: string) {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const byId = new Map(c.records.map((r) => [r.id, r]));
  const children = new Map<string, string[]>();
  for (const r of c.records) if (r.parent_id && !SEAL_KINDS.has(r.kind)) (children.get(r.parent_id) ?? children.set(r.parent_id, []).get(r.parent_id)!).push(r.id);
  return c.records
    .filter((r) => r.family === family && !SEAL_KINDS.has(r.kind))
    .map((r) => {
      const { keys, sources, image_id, ...rest } = r;
      const i = image_id ? img.get(image_id) : null;
      const parent = r.parent_id ? byId.get(r.parent_id) : null;
      return {
        ...rest,
        summary: rest.summary ? soften(rest.summary) : rest.summary,
        // What the panel shows, in the site's words (quotations in the original language stay as written).
        attributes: Object.fromEntries(Object.entries(rest.attributes ?? {}).map(([k, v]) => [k,
          typeof v === 'string' && !k.endsWith('_zh') ? soften(v)
            : k === 'marks' && Array.isArray(v) ? v.map((m: any) => (m && typeof m.note === 'string' ? { ...m, note: soften(m.note) } : m))
            : v])),
        looks_like: rest.looks_like ? soften(rest.looks_like) : rest.looks_like,
        url: urlOf(r),
        image: i ? { file: i.file, status: i.status, credit: i.credit ?? null, source_url: i.source_url ?? null } : null,
        sources: sources.map((s) => { const x = src.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter(Boolean),
        parent: parent ? { id: parent.id, name: parent.name } : null,
        children: children.get(r.id) ?? [],
      };
    });
}

/** Families whose records are each a file of their own (data/r/<id>.json): one is too big to fetch whole. */
export const PER_RECORD = new Set(['chinese-people']);

/** One record in full, as familyRecords gives it. */
export function recordsOne(family: string) {
  return familyRecords(family);
}

export function families(scope?: Scope) {
  const c = collection();
  const counts = new Map<string, number>();
  for (const r of c.records) if (!SEAL_KINDS.has(r.kind) && (!scope || inScope(r.family, scope))) counts.set(r.family, (counts.get(r.family) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => (FAMILY[a[0]]?.order ?? 99) - (FAMILY[b[0]]?.order ?? 99)).map(([f, n]) => ({ family: f, label: familyLabel(f), count: n }));
}
