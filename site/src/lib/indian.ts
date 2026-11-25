// The Indian section's data, from the reference collection (the records the
// Advisor reads, built by the app's scripts/reference/collect.ts from
// backend/src/data/mark-tables/indian.json): every silver maker's and
// retailer's mark, pseudo-hallmark, origin stamp and Indian hallmark with its
// sources, and the date tables the date reader uses.
import { collection, type Rec } from './portal';
import { soften } from './site';
import { INDIC } from './scripts';
import indianTable from '../data/app/indian.json';

export type Photo = { file: string; status: string; label: string; caption: string; credit: string; url: string | null; visible: string | null };
export type InMark = {
  id: string; slug: string; group: string; family: string; kind: string;
  markText: string | null; native: string | null; script: string | null; translit: string | null; plain: string;
  variants: string[]; spellings: string[]; meaning: string; device: string | null; punchSet: string | null;
  maker: string | null; place: string | null; makerYears: string | null; wares: string[]; technique: string | null; where: string | null;
  fineness: string | null; from: number | null; to: number | null; dateNote: string | null; tells: string | null; cautions: string | null;
  photos: Photo[]; sources: { citation: string; url: string | null }[]; singleSource: boolean; keys: string[];
};
export type Group = { id: string; family: string; name: string; short: string; blurb: string };

const T = (indianTable as any).systems;

export const FAMILIES: { id: string; name: string }[] = (T.marks?.families ?? []).map((f: any) => ({ id: String(f.id), name: String(f.name) }));
export const GROUPS: Group[] = (T.marks?.groups ?? []).map((g: any) => ({
  id: String(g.id), family: String(g.family), name: String(g.name), short: String(g.short ?? g.name), blurb: soften(String(g.blurb ?? '')),
}));

const span = (a?: number | null, b?: number | null) => (a == null ? null : b == null ? `from ${a}` : a === b ? String(a) : `${a}–${b}`);

/** Every mark of the section, in its group's order, then by date. */
export function marks(): InMark[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const kids = new Map<string, Rec[]>();
  for (const r of c.records) if (r.parent_id) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  const order = new Map(GROUPS.map((g, i) => [g.id, i]));
  return c.records
    .filter((r) => r.family === 'indian-marks' && !['era', 'ruler'].includes(r.kind) && !r.parent_id)
    .map((r): InMark => {
      const a = r.attributes ?? {};
      const photos: Photo[] = (kids.get(r.id) ?? [])
        .filter((k) => k.image_id && img.has(k.image_id))
        .map((k) => {
          const i = img.get(k.image_id!)!;
          return { file: i.file, status: i.status ?? 'photo', label: k.name, caption: soften(k.summary ?? ''), credit: i.credit ?? '', url: i.source_url ?? null, visible: k.attributes.mark_visible ?? null };
        })
        .sort((x, y) => (x.visible === 'yes' ? 0 : 1) - (y.visible === 'yes' ? 0 : 1) || (x.status === 'photo' ? 0 : 1) - (y.status === 'photo' ? 0 : 1));
      const m = a.maker ?? {};
      return {
        // The family by its id (silver, hallmarks, stamps): the record keeps the family's name, the group knows its id.
        id: r.id, slug: r.anchor ?? r.id.replace(/^in-(hm-)?/, ''), group: String(a.group ?? ''),
        family: GROUPS.find((g) => g.id === a.group)?.family ?? (r.id.startsWith('in-hm-') ? 'hallmarks' : String(a.family ?? '')), kind: String(a.kind ?? r.kind),
        markText: a.mark_text ?? null, native: a.native ?? null, script: a.script ?? null, translit: a.translit ?? null, plain: String(a.plain ?? r.name),
        variants: Array.isArray(a.variants) ? a.variants.map(String) : [], spellings: Array.isArray(a.other_spellings) ? a.other_spellings.map(String) : [],
        meaning: soften(String(a.meaning ?? '')), device: a.device ?? null, punchSet: a.punch_set ?? null,
        maker: m.name ?? null, place: m.place ?? null, makerYears: span(m.from, m.to),
        wares: Array.isArray(a.wares) ? a.wares.map(String) : [], technique: a.technique ?? null, where: a.where_on_object ?? null, fineness: a.fineness ?? null,
        from: r.date_from ?? null, to: r.date_to ?? null, dateNote: r.date_note ? soften(r.date_note) : null,
        tells: a.what_it_tells ? soften(String(a.what_it_tells)) : null, cautions: a.cautions ? soften(String(a.cautions)) : null,
        photos,
        sources: r.sources.map((s) => src.get(s.id)).filter(Boolean).map((s) => ({ citation: s!.citation, url: s!.url ?? null })),
        singleSource: r.single_source, keys: r.keys,
      };
    })
    .sort((x, y) => (order.get(x.group) ?? 99) - (order.get(y.group) ?? 99) || (x.from ?? 9999) - (y.from ?? 9999) || x.plain.localeCompare(y.plain));
}

/** How to read the marks, and the cautions, from the app's table. */
export function readingNotes(): { reading: string[]; caveats: string[] } {
  const t = T.marks ?? {};
  return {
    reading: (t.reading ?? []).map((x: any) => soften(String(x.text ?? x))),
    caveats: (t.caveats ?? []).map((x: any) => soften(String(x.text ?? x))),
  };
}

/** The date tables (indian.json `dates`), for the date reader and its tables. */
export function dateTables(): any {
  return T.dates ?? {};
}

/** Every Indian, Burmese, Sinhala and Persian character a page sets, for the font subset request. */
export function indicChars(...texts: unknown[]): string {
  const all = texts.map((t) => (typeof t === 'string' ? t : JSON.stringify(t ?? ''))).join('');
  return [...new Set([...all].filter((c) => INDIC.test(c)))].join('');
}

/** The rules behind the origin stamps (US, UK and Indian law), from the app's table. */
export function stampRules(): { id: string; name: string; meaning: string | null; years: string | null; tells: string | null; cautions: string | null }[] {
  return (T.marks?.stamp_rules ?? []).map((r: any) => ({
    id: String(r.id), name: soften(String(r.name ?? '')), meaning: r.meaning ? soften(String(r.meaning)) : null,
    years: span(r.date_from, r.date_to), tells: r.what_it_tells ? soften(String(r.what_it_tells)) : null, cautions: r.cautions ? soften(String(r.cautions)) : null,
  }));
}
