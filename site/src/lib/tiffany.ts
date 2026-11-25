// Tiffany windows: every building Tiffany's own published lists name as
// holding its windows, mosaics and other work, from the reference collection
// (family tiffany-windows, built by the app's collect.ts from the website's
// scripts/pages/data/tiffany_windows.json; research in hallmark-sources/tiffany).
// One record per building, a child record per window, mosaic or other work.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { collection, type Rec } from './portal';

export const BASE = '/marks/tiffany-windows';
export type ListRef = { page: number; url: string; printed?: string | null };
export type Work = {
  n: number; anchor: string; text: string; memorial: string | null; subjects: string[]; kind: string; glass: boolean;
  lists: Record<string, ListRef>; text1897: string | null; ocr: boolean;
  drawing: { accession: string; date: string; url: string; stage: string; museum: string } | null;
  booklet: { year: number; url: string } | null;
};
export type Site = {
  id: string; place: string; building: string; address: string | null; town: string; state: string | null; stateName: string | null;
  country: string; x: number | null; y: number | null; lat: number | null; lon: number | null; notes: string[];
  lists: Record<string, ListRef>; works: Work[]; ocr: boolean; townAsPrinted: string | null; regionAsPrinted: string | null;
  photos: Photo[]; later: boolean; commons: boolean;
};
export type Photo = { image: string; thumb?: string; credit: string; licence: string; licence_url?: string | null; source_url: string; title?: string; w?: number; h?: number };
export type Place = { slug: string; name: string; path: string; sites: Site[]; towns: [string, Site[]][]; works: number; glass: number };

export const LISTS: Record<string, { year: number; short: string; title: string; url: string }> = {
  '1893': { year: 1893, short: '1893', title: 'A Synopsis of the Exhibit … with an Appendix on Memorial Windows (Tiffany Glass and Decorating Company, 1893)', url: 'https://archive.org/details/synopsisexhibit00tiff/page/n31/mode/1up' },
  '1897': { year: 1897, short: '1897', title: 'A List of Windows (Tiffany Glass and Decorating Company, 1897)', url: 'https://cambridge2000.com/tiffany/pdfs/Tiffany1897.pdf' },
  '1913': { year: 1913, short: '1913', title: 'Memorials in Glass and Stone (Tiffany Studios, 1913)', url: 'https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/1544' },
  '1910': { year: 1910, short: '1910', title: 'A Partial List of Windows (Tiffany Studios, 1910)', url: 'https://libmma.contentdm.oclc.org/digital/collection/p16028coll5/id/1471' },
};

/** A window, mosaic or other glass a list or booklet names (a drawing is a design, not a work). */
export const isGlassWork = (w: Work) => w.glass && !w.drawing;
const placeOf = (r: Rec) => String(r.attributes?.intended_page ?? r.page_path).replace(/\/$/, '').split('/').pop()!;

let cache: Site[] | null = null;
export function sites(): Site[] {
  if (cache) return cache;
  const recs = collection().records.filter((r) => r.family === 'tiffany-windows');
  const kids = new Map<string, Rec[]>();
  for (const r of recs) if (r.parent_id) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  const out: Site[] = [];
  for (const r of recs) {
    if (r.parent_id || r.kind !== 'building with Tiffany work') continue;
    const a = r.attributes;
    const works = (kids.get(r.id) ?? []).map((k) => {
      const b = k.attributes;
      return {
        n: Number(String(k.anchor).split('--').pop()), anchor: String(k.anchor), text: String(b.text), memorial: b.memorial ?? null,
        subjects: b.subjects ?? [], kind: String(b.kind), glass: !!b.glass, lists: b.lists ?? {}, text1897: b.text_1897 ?? null, ocr: !!b.ocr,
        drawing: b.drawing ?? null, booklet: b.booklet ?? null,
      };
    }).sort((x, y) => x.n - y.n);
    out.push({
      id: String(r.anchor), place: placeOf(r), building: String(a.building), address: a.address ?? null, town: String(a.town),
      state: a.state ?? null, stateName: a.state_name ?? null, country: String(a.country ?? ''), x: a.x ?? null, y: a.y ?? null,
      lat: a.lat ?? null, lon: a.lon ?? null, notes: a.notes ?? [], lists: a.lists ?? {}, works, ocr: !!a.ocr,
      townAsPrinted: a.town_as_printed ?? null, regionAsPrinted: a.region_as_printed ?? null, photos: a.photos ?? [], later: !!a.later, commons: !!a.commons,
    });
  }
  return (cache = out);
}

const OUTSIDE = 'outside-the-united-states';
export function places(): Place[] {
  const by = new Map<string, Site[]>();
  for (const s of sites()) (by.get(s.place) ?? by.set(s.place, []).get(s.place)!).push(s);
  const out: Place[] = [];
  for (const [slug, ss] of by) {
    const name = slug === OUTSIDE ? 'Outside the United States' : ss[0].stateName ?? slug;
    const towns = new Map<string, Site[]>();
    const townKey = (s: Site) => (slug === OUTSIDE ? `${s.town}, ${s.country}` : s.town);
    for (const s of ss) (towns.get(townKey(s)) ?? towns.set(townKey(s), []).get(townKey(s))!).push(s);
    const sorted = [...towns.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, list] of sorted) list.sort((a, b) => a.building.localeCompare(b.building));
    out.push({
      slug, name, path: `${BASE}/${slug}`, sites: ss, towns: sorted,
      works: ss.reduce((n, s) => n + s.works.length, 0), glass: ss.reduce((n, s) => n + s.works.filter(isGlassWork).length, 0),
    });
  }
  return out.sort((a, b) => (a.slug === OUTSIDE ? 1 : b.slug === OUTSIDE ? -1 : a.name.localeCompare(b.name)));
}
export const placeBySlug = (slug: string) => places().find((p) => p.slug === slug);

export const townSlug = (t: string) => 'town-' + t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "1897 and 1910" */
export const yearsText = (lists: Record<string, ListRef>) => {
  const ys = Object.keys(lists).sort();
  return ys.length < 2 ? ys.join('') : `${ys.slice(0, -1).join(', ')} and ${ys.at(-1)}`;
};

/** The subjects Tiffany repeated most, for "what is my window of?" */
export function subjects(min = 6): [string, number][] {
  const n = new Map<string, number>();
  const norm = (s: string) => s.replace(/^the /i, '').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim();
  const shown = new Map<string, string>();
  for (const s of sites()) for (const w of s.works) for (const t of w.subjects) {
    const k = norm(t).toLowerCase().replace(/^angel of (the )?resurrection$/, 'angel of the resurrection').replace(/^resurrection angel$/, 'angel of the resurrection');
    if (k.length < 4 || k.length > 60) continue;
    n.set(k, (n.get(k) ?? 0) + 1);
    if (!shown.has(k)) shown.set(k, norm(t));
  }
  return [...n.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).map(([k, c]) => [shown.get(k)!.replace(/^./, (x) => x.toUpperCase()), c]);
}

export type MapData = { width: number; height: number; source: string; states: { code: string; name: string; d: string }[] };
let mapCache: MapData | null = null;
export function usMap(): MapData {
  if (mapCache) return mapCache;
  return (mapCache = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'site', 'tiffany', 'us-map.json'), 'utf8')));
}

/** One dot per town: where on the map, how many buildings, which page. */
export function dots(filter?: (s: Site) => boolean) {
  const by = new Map<string, { x: number; y: number; town: string; n: number; href: string; state: string }>();
  for (const s of sites()) {
    if (s.x == null || s.y == null || (filter && !filter(s))) continue;
    const k = `${s.place}|${s.town}`;
    const d = by.get(k);
    if (d) d.n++;
    else by.set(k, { x: s.x, y: s.y, town: s.town, n: 1, href: `${BASE}/${s.place}#${townSlug(s.town)}`, state: s.stateName ?? s.country });
  }
  return [...by.values()].sort((a, b) => b.n - a.n);
}

/** The search's index: one short row per building. */
export function searchIndex() {
  return sites().map((s) => ({
    b: s.building, t: s.town, s: s.stateName ?? s.country, h: `${BASE}/${s.place}#${s.id}`, n: s.works.length,
    k: [s.building, s.town, s.address ?? '', s.stateName ?? s.country, ...s.works.map((w) => [w.memorial ?? '', ...w.subjects].join(' '))].join(' ').toLowerCase(),
  }));
}

/** Tiffany windows now in museums, with the museum's own open-access photograph. */
export function museumWindows() {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  return c.records.filter((r) => r.family === 'tiffany-windows' && r.kind === 'Tiffany window in a museum').map((r) => ({
    id: String(r.anchor), title: String(r.attributes.title), museum: String(r.attributes.museum), accession: String(r.attributes.accession),
    date: r.attributes.date ?? null, from: r.attributes.from_building ?? null, url: String(r.attributes.url), licence: String(r.attributes.licence),
    pic: r.image_id ? img.get(r.image_id) ?? null : null,
  }));
}
