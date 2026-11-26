// Tiffany lamps and shades: the shades and bases Tiffany's own catalogues
// number (Tiffany Bronze Lamps, ca. 1915; Desk Sets, 1910), and museum lamps
// whose recorded marks give a number. From the reference collection (family
// tiffany-lamps, built by the app's collect.ts from the website's
// scripts/pages/data/tiffany_lamps.json; research in hallmark-sources/tiffany/lamps).
import { collection, type Rec } from './portal';

export const LAMPS = '/marks/tiffany-lamps';
export type Entry = {
  src: string; page?: number; ptr?: number; as_printed?: string | null; size?: number | null; price?: number | null; price_text?: string | null;
  height?: string | null; complete?: number | null; on_base?: string | null; with_shade?: string | null; shade_size?: number | null;
  shade_as_printed?: string | null; shade_price?: number | null; shape?: string | null; desk_set?: string | null; base_as_printed?: string | null;
};
export type Model = { id: string; no: string; kind: 'shade' | 'base'; anchor: string; entries: Entry[]; design: string | null; size: number | null; shape: string | null; museum: string[]; pic: string | null };
export type MuseumLamp = {
  id: string; anchor: string; title: string; museum: string; accession: string; kind: string; pattern: string | null; date: string | null;
  medium: string | null; dimensions: string | null; marks: string | null; shade_no: string | null; base_no: string | null; url: string; pic: { file: string; credit: string | null; licence: string | null } | null;
};
export const SOURCES: Record<string, { year: number; title: string; url: string; page: (ptr: number) => string }> = {
  T1915: { year: 1915, title: 'Tiffany Bronze Lamps (ca. 1915)', url: 'https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/1240', page: (p) => `https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/${p}` },
  T1910: { year: 1910, title: 'Desk Sets and Useful Articles (1910)', url: 'https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/1209', page: (p) => `https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/${p}` },
};

let cache: { shades: Model[]; bases: Model[]; museum: MuseumLamp[] } | null = null;
export function lamps() {
  if (cache) return cache;
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const recs = c.records.filter((r) => r.family === 'tiffany-lamps');
  const model = (r: Rec): Model => ({
    id: r.id, no: String(r.attributes.no), kind: r.attributes.kind, anchor: String(r.anchor), entries: r.attributes.entries ?? [],
    design: r.attributes.design ?? null, size: r.attributes.size ?? null, shape: r.attributes.shape ?? null, museum: r.attributes.museum ?? [],
    pic: r.image_id ? img.get(r.image_id)?.file ?? null : null,
  });
  const num = (s: string) => parseInt(s, 10) || 0;
  const shades = recs.filter((r) => r.kind === 'Tiffany shade model').map(model).sort((a, b) => num(a.no) - num(b.no) || a.no.localeCompare(b.no));
  const bases = recs.filter((r) => r.kind === 'Tiffany lamp base model').map(model).sort((a, b) => num(a.no) - num(b.no) || a.no.localeCompare(b.no));
  const museum = recs.filter((r) => r.kind === 'Tiffany lamp in a museum').map((r) => {
    const a = r.attributes; const i = r.image_id ? img.get(r.image_id) : null;
    return {
      id: r.id, anchor: String(r.anchor), title: String(a.title), museum: String(a.museum), accession: String(a.accession), kind: String(a.kind ?? ''),
      pattern: a.pattern ?? null, date: a.date ?? null, medium: a.medium ?? null, dimensions: a.dimensions ?? null, marks: a.marks ?? null,
      shade_no: a.shade_no ?? null, base_no: a.base_no ?? null, url: String(a.url), pic: i ? { file: i.file, credit: i.credit ?? null, licence: i.licence ?? null } : null,
    };
  });
  return (cache = { shades, bases, museum });
}

/** What a shade is, in a few words: "Dragonfly design, 20 in." */
export function shadeLine(m: Model) {
  const e = m.entries.find((x) => x.as_printed) ?? m.entries[0];
  const size = m.entries.map((x) => x.size).find((x) => x) ?? null;
  const what = e?.as_printed ? e.as_printed.replace(/^[^:]+desk set: /, '') : 'Leaded or glass shade';
  return [what, size ? `${size} in.` : null].filter(Boolean).join(', ');
}
export function baseLine(m: Model) {
  const e = m.entries[0];
  return [e?.as_printed, e?.height].filter(Boolean).join(', ');
}
/** "$90 (1915)" for each catalogue that prices it. */
export const prices = (m: Model, field: 'price' | 'complete' = 'price') =>
  m.entries.map((e) => (e[field] != null ? `$${e[field]} (${SOURCES[e.src].year})` : e.price_text ? `${e.price_text} (${SOURCES[e.src].year})` : null)).filter(Boolean) as string[];
