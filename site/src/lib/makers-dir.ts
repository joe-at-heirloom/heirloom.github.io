// Makers' marks, place by place: the British makers of Jackson's English
// Goldsmiths and Their Marks (1921), family british-makers, each record
// naming its page (attributes.intended_page, /marks/british-silver-makers/
// <place>). A place's page lists its marks by the first letter of the
// initials, because that is how a mark is looked up: you see "RA" in a
// shield and turn to R. Each mark's sheet says who made it (as surely as
// Jackson does), what it was seen on, who owned that in 1921, and links to
// the date letters of the same office.
//
// Written for one family and one address prefix, so the next directories
// (American makers, continental marks) are the same template over another
// family: see DIRS.
import { collection, type Rec } from './portal';
import { clean, yearsOf, type Sheet, type Pic } from './records';
import { media } from './media';
import { OFFICES } from './marks';

export type Dir = { family: string; base: string; title: string };
export const DIRS: Record<string, Dir> = {
  british: { family: 'british-makers', base: '/marks/british-silver-makers/', title: 'British silver makers’ marks' },
};

const pageOf = (r: Rec) => String(r.attributes?.intended_page ?? r.attributes?.pages?.[0] ?? r.page_path);

/** A place's name from its address: king-s-lynn → King’s Lynn, unascribed-irish → Unascribed, Irish. */
export function placeName(slug: string) {
  if (slug === 'king-s-lynn') return 'King’s Lynn';
  if (slug.startsWith('unascribed-')) return `Not tied to a town (${slug.slice(11).charAt(0).toUpperCase()}${slug.slice(12)})`;
  return slug.split('-').map((w) => (w === 'and' ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

// Where each place is, for the directory's own grouping.
const SCOTLAND = new Set(['edinburgh', 'glasgow', 'aberdeen', 'arbroath', 'ayr', 'banff', 'dundee', 'elgin', 'greenock', 'inverness', 'montrose', 'perth', 'tain', 'stirling', 'unascribed-scottish']);
const IRELAND = new Set(['dublin', 'cork', 'youghal', 'galway', 'limerick', 'belfast', 'unascribed-irish']);
const ABROAD = new Set(['calcutta']);
export const COUNTRY_ORDER = ['England', 'Scotland', 'Ireland', 'Overseas'] as const;
export const countryOf = (slug: string) => (SCOTLAND.has(slug) ? 'Scotland' : IRELAND.has(slug) ? 'Ireland' : ABROAD.has(slug) ? 'Overseas' : 'England');

export type Place = { slug: string; path: string; name: string; country: string; n: number; named: number; from: number | null; to: number | null };
let placesCache: Map<string, Place[]> | null = null;
/** Every place the records name, with how many marks and how many makers named. */
export function places(dir: Dir = DIRS.british): Place[] {
  placesCache ??= new Map();
  const got = placesCache.get(dir.family);
  if (got) return got;
  const by = new Map<string, Place>();
  for (const r of collection().records) {
    if (r.family !== dir.family) continue;
    const path = pageOf(r);
    if (!path.startsWith(dir.base)) continue;
    const slug = path.slice(dir.base.length).replace(/\/$/, '');
    const p = by.get(slug) ?? { slug, path: `${dir.base}${slug}`, name: placeName(slug), country: countryOf(slug), n: 0, named: 0, from: null, to: null };
    p.n++;
    if (r.maker) p.named++;
    if (r.date_from) { p.from = Math.min(p.from ?? r.date_from, r.date_from); p.to = Math.max(p.to ?? r.date_from, r.date_to ?? r.date_from); }
    by.set(slug, p);
  }
  const out = [...by.values()].sort((a, b) => b.n - a.n);
  placesCache.set(dir.family, out);
  return out;
}

/** The records of one place. */
export const recordsOf = (place: Place, dir: Dir = DIRS.british) =>
  collection().records.filter((r) => r.family === dir.family && pageOf(r).replace(/\/$/, '') === place.path);

// ── The sheet ───────────────────────────────────────────────────────────────
const SURE: Record<string, (m: string) => string> = {
  named: (m) => m,
  probably: (m) => `Probably ${m}`,
  queried: (m) => `Perhaps ${m} (Jackson queries it)`,
};
/** Jackson's own remarks, not the transcription's notes on his rows ("town mark ditto"). */
const jacksonSays = (n: unknown) => {
  const t = String(n ?? '');
  if (!/^Jackson\b|Jackson says/.test(t)) return null;
  return clean(t.replace(/^Jackson:\s*/, 'Jackson: ').replace(/;?\s*OCR[^;]*/g, ''));
};
const entered = (s: unknown) => {
  const t = String(s ?? '').trim();
  if (!t) return null;
  const y = /(\d{4})/.exec(t)?.[1];
  return y ? `Registered at the assay office in ${y}` : clean(t);
};
const officeSlug = (place: string) => OFFICES.find((o) => o.office.toLowerCase() === place.toLowerCase())?.slug ?? null;

let imgs: Map<string, { file: string; status: string; credit?: string | null; source_url?: string | null }> | null = null;
let srcs: Map<string, { citation: string; url?: string | null }> | null = null;
export function makerSheet(r: Rec, place: Place): Sheet {
  imgs ??= new Map(collection().images.map((i) => [i.id, i]));
  srcs ??= new Map(collection().sources.map((s) => [s.id, s]));
  const a = r.attributes ?? {};
  const initials = String(a.initials ?? '').trim();
  const device = clean(a.device);
  const sure = String(a.maker_certainty ?? 'none');
  const maker = r.maker ? (SURE[sure] ?? SURE.named)(r.maker) : null;
  const office = officeSlug(String(r.place ?? place.name));
  const img = r.image_id ? imgs.get(r.image_id) : undefined;
  const pic: Pic | null = img?.file ? { file: media(img.file), status: img.status, credit: img.credit ?? '', url: img.source_url ?? null, alt: clean(r.looks_like) ?? r.name } : null;
  return {
    id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind: 'Maker’s mark', group: letterOf(initials),
    glyphs: null, lang: null,
    reading: initials ? `${initials}${device ? `, ${device.charAt(0).toLowerCase()}${device.slice(1)}` : ''}` : device ?? 'A device without letters',
    means: maker ?? 'Maker not identified',
    years: yearsOf(r.date_from, r.date_to),
    facts: [
      ['The mark', clean(r.looks_like)],
      ['Maker', maker],
      ['As Jackson prints the name', a.maker_as_printed && a.maker_as_printed !== r.maker ? String(a.maker_as_printed) : null],
      ['Registered', entered(a.maker_admitted)],
      ['Seen on', clean(a.seen_on)],
      ['Owned in 1921 by', clean(a.owner_1921)],
      ['Assay master', clean(a.assay_master)],
      ['Dates', clean(r.date_note)],
      ['Jackson’s note', jacksonSays(a.jackson_note)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: null,
    pics: pic ? [pic] : [],
    sources: r.sources.map((s) => { const x = srcs!.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter((x): x is NonNullable<typeof x> => !!x),
    single: r.single_source,
    links: office ? [{ label: `${place.name} date letters, to date the item by its letter`, href: `/marks/${office}-date-letters` }] : [],
    keys: [initials, r.maker, a.maker_as_printed, a.seen_on, a.owner_1921, r.date_from, device].filter(Boolean).join(' ').toLowerCase(),
  };
}

export const letterOf = (initials: string) => (/^[A-Z]/i.test(initials) ? initials.charAt(0).toUpperCase() : '0');

/** One place's marks, in groups by the first letter of the initials (marks without letters last), each group in date order. */
export function makerGroups(place: Place) {
  const sheets = recordsOf(place).map((r) => makerSheet(r, place));
  const letters = [...new Set(sheets.map((s) => s.group))].sort((a, b) => (a === '0' ? 1 : b === '0' ? -1 : a.localeCompare(b)));
  return letters.map((l) => ({
    key: l,
    label: l === '0' ? 'Without letters' : l,
    sheets: sheets.filter((s) => s.group === l).sort((x, y) => x.reading.localeCompare(y.reading) || (parseInt(x.years ?? '0') - parseInt(y.years ?? '0'))),
  }));
}

// ── Big towns, a page per letter ────────────────────────────────────────────
/** A town with more marks than this gets a page per letter (London: 4,349), its own page a hub of letters. */
export const SPLIT = 1500;
export const isSplit = (p: Place) => p.n > SPLIT;
export const letterSlug = (key: string) => (key === '0' ? 'without-letters' : key.toLowerCase());
export const letterPath = (p: Place, key: string) => `${p.path}/${letterSlug(key)}`;
/** The letter a record id points to by its own shape (mm-<office>-<year>-<initials>[-n]), for sending an old link to its letter page. */
export function letterFromId(id: string) {
  const part = /^mm-[a-z-]+?-\d{4}-([a-z0-9]+)/.exec(id)?.[1] ?? '';
  if (!part || /^device$/.test(part)) return '0';
  return /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() : '0';
}
