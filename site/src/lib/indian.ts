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

// ── Phase 2: figures and paintings ──────────────────────────────────────────
export type FigRow = {
  id: string; slug: string; group: string; name: string; iast: string | null; native: string[]; other: string[]; religion: string; kind: string;
  arms: number[]; holds: string[]; gestures: string[]; mount: string[]; posture: string[]; headBody: string[]; emblems: string[]; features: string | null;
  identifyBy: string; lookAlikes: { name: string; slug: string | null; how: string }[]; regions: string | null; dating: string | null; cautions: string | null;
  photos: Photo[]; sources: { citation: string; url: string | null }[]; singleSource: boolean;
};
const srcMap = (list: any[] = []) => new Map<string, any>(list.map((s: any) => [s.id, s]));

/** The photographs the collection ties to a record (museum examples), best first. */
function photosOf(recordId: string): Photo[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  return c.records
    .filter((r) => r.parent_id === recordId && r.image_id && img.has(r.image_id))
    .map((k) => { const i = img.get(k.image_id!)!; return { file: i.file, status: i.status ?? 'photo', label: k.name, caption: soften(k.summary ?? ''), credit: i.credit ?? '', url: i.source_url ?? null, visible: k.attributes.mark_visible ?? null }; })
    .sort((x, y) => (x.visible === 'yes' ? 0 : 1) - (y.visible === 'yes' ? 0 : 1));
}

/** Every figure, from the app's table (indian.json `figures`), with its museum photographs. */
export function figures(): FigRow[] {
  const F = T.figures ?? {};
  const src = srcMap(F.sources);
  const byId = new Map<string, any>((F.rows ?? []).map((r: any) => [r.id, r]));
  return (F.rows ?? []).map((r: any): FigRow => ({
    id: `in-fig-${r.id}`, slug: r.id, group: r.group, name: r.name, iast: r.iast ?? null, native: r.native ?? [], other: r.other_names ?? [], religion: r.religion, kind: r.kind,
    arms: r.arms ?? [], holds: r.holds ?? [], gestures: r.gestures ?? [], mount: r.mount ?? [], posture: r.posture ?? [], headBody: r.head_body ?? [], emblems: Array.isArray(r.jain_emblem) ? r.jain_emblem : r.jain_emblem ? [r.jain_emblem] : [],
    // The agents' plain-words description, without their notes to the build ("token wanted: …").
    features: r.features_other ? soften(String(r.features_other).replace(/\s*\(?token wanted:[^;.)]*\)?/gi, '').replace(/\s+([.,;])/g, '$1').trim()) || null : null,
    identifyBy: soften(String(r.identify_by ?? '')),
    lookAlikes: (r.look_alikes ?? []).map((l: any) => ({ name: l.id && byId.get(l.id) ? byId.get(l.id).name : String(l.name ?? ''), slug: l.id && byId.has(l.id) ? l.id : null, how: soften(String(l.how_to_tell ?? '')) })).filter((l: any) => l.name && l.how),
    regions: r.regions_styles ? soften(String(r.regions_styles)) : null, dating: r.dating_clues ? soften(String(r.dating_clues)) : null, cautions: r.cautions ? soften(String(r.cautions)) : null,
    photos: photosOf(`in-fig-${r.id}`),
    sources: (r.sources ?? []).map((id: string) => src.get(id)).filter(Boolean).map((s: any) => ({ citation: s.name, url: s.url ?? null })),
    singleSource: !!r.single_source,
  }));
}
/** The figure tables' tokens, only those some figure uses. */
export function figureVocab(): Record<string, string[]> {
  const v = (T.figures ?? {}).vocab ?? {};
  return { religion: v.religion ?? [], arms: (v.arms ?? []).map(String), holds: v.holds ?? [], gestures: v.gestures ?? [], mount: v.mount ?? [], posture: v.posture ?? [], headBody: v.head_body ?? [], emblem: v.jain_emblem ?? [] };
}

export type School = { id: string; name: string; other: string[]; period: string | null; from: number | null; to: number | null; region: string | null; patrons: string | null; recognize: string[]; writing: string | null; lookAlikes: { name: string; how: string }[]; copies: string | null; cautions: string | null; sources: { citation: string; url: string | null }[]; singleSource: boolean };
export type SealRow = { id: string; slug: string; kind: string; native: string | null; translit: string | null; meaning: string | null; owner: string | null; from: number | null; to: number | null; dateNote: string | null; where: string | null; tells: string | null; cautions: string | null; sources: { citation: string; url: string | null }[]; singleSource: boolean };

/** The paintings guide (indian.json `paintings`): schools, and the seals and notes found on paintings. */
export function paintings(): { schools: School[]; seals: SealRow[] } {
  const P = T.paintings ?? {};
  const src = srcMap(P.sources);
  const cite = (ids: string[] = []) => ids.map((id) => src.get(id)).filter(Boolean).map((s: any) => ({ citation: s.name, url: s.url ?? null }));
  const txt = (x: unknown) => (x == null || x === '' ? null : soften(typeof x === 'string' ? x : Array.isArray(x) ? x.join('; ') : JSON.stringify(x)));
  return {
    schools: (P.schools ?? []).map((r: any): School => ({
      id: r.id, name: r.name, other: r.other_names ?? [], period: txt(r.period), from: typeof r.date_from === 'number' ? r.date_from : null, to: typeof r.date_to === 'number' ? r.date_to : null,
      region: txt(r.region), patrons: txt(r.patrons), recognize: (r.how_to_recognize ?? []).map((x: any) => soften(String(x))), writing: txt(r.writing_found),
      lookAlikes: (r.look_alikes ?? []).map((l: any) => (typeof l === 'string' ? { name: '', how: soften(l) } : { name: String(l.name ?? l.id ?? ''), how: soften(String(l.how_to_tell ?? '')) })).filter((l: any) => l.how),
      copies: txt(r.later_copies), cautions: txt(r.cautions), sources: cite(r.sources), singleSource: !!r.single_source,
    })),
    seals: (P.seals ?? []).map((r: any): SealRow => ({
      id: `in-ptg-${r.id}`, slug: r.id, kind: String(r.kind ?? 'seal'), native: r.native ?? null, translit: r.translit ?? null, meaning: txt(r.meaning), owner: txt(r.owner),
      from: typeof r.date_from === 'number' ? r.date_from : null, to: typeof r.date_to === 'number' ? r.date_to : null, dateNote: txt(r.date_note), where: txt(r.where_on_object),
      tells: txt(r.what_it_tells), cautions: txt(r.cautions), sources: cite(r.sources), singleSource: !!r.single_source,
    })),
  };
}

// ── Phase 3: the decorative arts ────────────────────────────────────────────
export type CraftRow = {
  id: string; slug: string; group: string; name: string; native: string[]; other: string[]; kind: string;
  materials: string[]; woods: string[]; techniques: string[]; forms: string[]; regions: string[];
  from: number | null; to: number | null; dateNote: string | null; identifyBy: string; recognize: string[];
  marks: string | null; later: string | null; tellOld: string | null; lookAlikes: { name: string; how: string }[];
  features: string | null; cautions: string | null; photos: Photo[]; sources: { citation: string; url: string | null }[]; singleSource: boolean;
};
/** Every craft (indian.json `crafts`), with its museum photographs. */
export function crafts(): CraftRow[] {
  const C = T.crafts ?? {};
  const src = srcMap(C.sources);
  const t = (x: unknown) => (x == null || x === '' ? null : soften(typeof x === 'string' ? x : JSON.stringify(x)));
  return (C.rows ?? []).map((r: any): CraftRow => ({
    id: `in-craft-${r.id}`, slug: r.id, group: r.group, name: r.name, native: r.native ?? [], other: r.other_names ?? [], kind: r.kind ?? 'craft',
    materials: r.materials ?? [], woods: r.woods ?? [], techniques: r.techniques ?? [], forms: r.forms ?? [], regions: r.regions ?? [],
    from: r.date_from ?? null, to: r.date_to ?? null, dateNote: t(r.date_note), identifyBy: soften(String(r.identify_by ?? '')),
    recognize: (r.how_to_recognize ?? []).map((x: any) => soften(String(x))), marks: t(r.marks_and_labels), later: t(r.later_production), tellOld: t(r.how_to_tell_old),
    lookAlikes: (r.look_alikes ?? []).map((l: any) => ({ name: String(l.name ?? ''), how: soften(String(l.how_to_tell ?? '')) })).filter((l: any) => l.name && l.how),
    features: r.features_other ? soften(String(r.features_other).replace(/\s*\(?token wanted:[^;.)]*\)?/gi, '').trim()) || null : null, cautions: t(r.cautions),
    photos: photosOf(`in-craft-${r.id}`),
    sources: (r.sources ?? []).map((id: string) => src.get(id)).filter(Boolean).map((s: any) => ({ citation: s.name, url: s.url ?? null })),
    singleSource: !!r.single_source,
  }));
}
/** The crafts tables' tokens, only those some craft uses. */
export function craftVocab(): Record<string, string[]> {
  const v = (T.crafts ?? {}).vocab ?? {};
  return { materials: v.materials ?? [], woods: v.woods ?? [], techniques: v.techniques ?? [], forms: v.forms ?? [], regions: v.regions ?? [] };
}
