// Directories of marks, one page per place: a family of records whose pages
// sit under one address (attributes.intended_page), e.g. /marks/british-
// silver-makers/<town>. Each directory says how its places are named and
// grouped on its hub, how a page's marks are grouped (the first letter of the
// initials for British makers, of the maker's name for American trademarks,
// of the town for continental marks), and how a record reads as a sheet.
// A place with more marks than SPLIT (London, Okie's early American
// silversmiths) becomes a hub of letters with a page per letter.
//
// Directories (DIRS):
//   british      Jackson, English Goldsmiths and Their Marks (1921), by town
//   american     The Jewelers' Circular trade-mark book (1896) by section,
//                and Okie's early American silversmiths (1928)
//   yearmarks    American makers' year marks (Rainwater, Kovels), by firm
//   continental  Okie's continental town, standard, duty marks and date
//                letters (1928), by country
import { collection, type Rec } from './portal';
import { clean, yearsOf, type Sheet, type Pic } from './records';
import { media } from './media';
import { OFFICES } from './marks';

export type Place = { dir: string; slug: string; path: string; name: string; region: string; n: number; named: number; from: number | null; to: number | null };
export type Dir = {
  key: string;
  family: string;
  base: string;
  title: string;
  noun: [string, string];
  /** What its places are: towns, sections, firms, countries. */
  places: [string, string];
  /** A place's name from its address. */
  name: (slug: string) => string;
  /** The hub's grouping of places, in order. */
  regions: string[];
  regionOf: (slug: string) => string;
  /** How the places sit on the hub: most marks first, or in the regions' own order. */
  order: 'size' | 'name';
  /** The group a record falls in on its place's page, and that group's name. */
  groupOf: (r: Rec) => string;
  groupLabel: (key: string) => string;
  sheet: (r: Rec, place: Place) => Sheet;
  /** Within a group. */
  sort: (a: Sheet, b: Sheet) => number;
  placeholder: string;
};

const pageOf = (r: Rec) => String(r.attributes?.intended_page ?? r.attributes?.pages?.[0] ?? r.page_path);
const titleCase = (slug: string) => slug.split('-').map((w) => (['and', 'of'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const firstLetter = (s: unknown) => {
  const t = String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();
  return /^[A-Z]/i.test(t) ? t.charAt(0).toUpperCase() : '0';
};
export const letterLabel = (key: string) => (key === '0' ? 'Without letters' : key);
const byReading = (a: Sheet, b: Sheet) => a.reading.localeCompare(b.reading) || (parseInt(a.years ?? '0') - parseInt(b.years ?? '0'));
const byYear = (a: Sheet, b: Sheet) => (parseInt(a.years ?? '9999') - parseInt(b.years ?? '9999')) || a.reading.localeCompare(b.reading);

// ── Shared pieces of a sheet ────────────────────────────────────────────────
let imgs: Map<string, { file: string; status: string; credit?: string | null; source_url?: string | null; licence?: string | null }> | null = null;
let srcs: Map<string, { citation: string; url?: string | null }> | null = null;
function picOf(r: Rec): Pic | null {
  imgs ??= new Map(collection().images.map((i) => [i.id, i]));
  const img = r.image_id ? imgs.get(r.image_id) : undefined;
  if (!img?.file) return null;
  // A crop from a book still in copyright says so, beside its credit.
  const credit = `${img.credit ?? ''}${img.licence === 'in-copyright-reference' ? ' Shown for reference; the original is in copyright.' : ''}`.trim();
  return { file: media(img.file), status: img.status, credit, url: img.source_url ?? null, alt: clean(r.looks_like) ?? r.name };
}
function sourcesOf(r: Rec) {
  srcs ??= new Map(collection().sources.map((s) => [s.id, s]));
  return r.sources.map((s) => { const x = srcs!.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter((x): x is NonNullable<typeof x> => !!x);
}
const facts = (list: [string, string | null | undefined][]) => list.filter(([, v]) => v).map(([label, text]) => ({ label, text: text as string }));
const keys = (...parts: unknown[]) => parts.flat().filter(Boolean).map(String).join(' ').toLowerCase();
/** A transcriber's note on the book's layout (columns, ditto marks, boxes), not something said about the mark. */
const layoutNote = (t: string) => /\b(column|ditto|row|box(es)?\b|footnote|printed (twice|with)|OCR|zoom|my reading|page says|straddl|alignment|typeset|read from)\b/i.test(t);
const bookNote = (n: unknown) => {
  let t = String(n ?? '').trim()
    .replace(/\s*\([^()]*\bbox(es)?\b[^()]*\)/gi, '')
    // "Asterisk:" or "Dagger sign beside the marks:" introduces what the sign means: keep the meaning.
    .replace(/^(\*|asterisk|dagger(?: sign)?(?: beside the marks?)?)\s*[:,]?\s*/i, '')
    .replace(/^single source\.\s*/i, '');
  if (!t || /^(unboxed|brace|the (two )?marks are joined|trade given as|period (as printed|not printed)|letters hard|cannot read|last two)/i.test(t)) return null;
  if (layoutNote(t) || /\b(text layer|cropped|crop(s)? for this entry|image reads)\b/i.test(t)) return null;
  return clean(t.charAt(0).toUpperCase() + t.slice(1));
};

// ── British makers (Jackson, 1921) ──────────────────────────────────────────
const SCOTLAND = new Set(['edinburgh', 'glasgow', 'aberdeen', 'arbroath', 'ayr', 'banff', 'dundee', 'elgin', 'greenock', 'inverness', 'montrose', 'perth', 'tain', 'stirling', 'unascribed-scottish']);
const IRELAND = new Set(['dublin', 'cork', 'youghal', 'galway', 'limerick', 'belfast', 'unascribed-irish']);
const SURE: Record<string, (m: string) => string> = {
  named: (m) => m,
  probably: (m) => `Probably ${m}`,
  queried: (m) => `Perhaps ${m} (Jackson queries it)`,
};
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

function britishSheet(r: Rec, place: Place): Sheet {
  const a = r.attributes ?? {};
  const initials = String(a.initials ?? '').trim();
  const device = clean(a.device);
  const sure = String(a.maker_certainty ?? 'none');
  const maker = r.maker ? (SURE[sure] ?? SURE.named)(r.maker) : null;
  const office = officeSlug(String(r.place ?? place.name));
  const pic = picOf(r);
  return {
    id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind: 'Maker’s mark', group: firstLetter(initials),
    glyphs: null, lang: null,
    reading: initials ? `${initials}${device ? `, ${device.charAt(0).toLowerCase()}${device.slice(1)}` : ''}` : device ?? 'A device without letters',
    means: maker ?? 'Maker not identified',
    years: yearsOf(r.date_from, r.date_to),
    facts: facts([
      ['The mark', clean(r.looks_like)],
      ['Maker', maker],
      ['As Jackson prints the name', a.maker_as_printed && a.maker_as_printed !== r.maker ? String(a.maker_as_printed) : null],
      ['Registered', entered(a.maker_admitted)],
      ['Seen on', clean(a.seen_on)],
      ['Owned in 1921 by', clean(a.owner_1921)],
      ['Assay master', clean(a.assay_master)],
      ['Dates', clean(r.date_note)],
      ['Jackson’s note', jacksonSays(a.jackson_note)],
    ]),
    differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
    links: office ? [{ label: `${place.name} date letters, to date the item by its letter`, href: `/marks/${office}-date-letters` }] : [],
    keys: keys(initials, r.maker, a.maker_as_printed, a.seen_on, a.owner_1921, r.date_from, device),
  };
}

// ── American makers (The Jewelers' Circular, 1896; Okie, 1928) ──────────────
const SECTION: Record<string, string> = {
  sterling: 'Sterling silver', 'silver-plate': 'Silver plate', 'watch-cases': 'Watch cases', jewelry: 'Jewelry', early: 'Early American silversmiths',
};
const STATUS: Record<string, string> = {
  old: 'An older mark, shown in 1896 beside the firm’s current one',
  discontinued: 'Discontinued by 1896',
  'out of business': 'The firm was out of business by 1896',
  present: 'The firm’s current mark in 1896',
};
const surname = (maker: string) => {
  const t = maker.replace(/\s*\(.*\)$/, '').replace(/,?\s+(Jr|Sr|II|III)\.?$/i, '').trim();
  return t.split(/\s+/).at(-1) ?? t;
};
function americanSheet(r: Rec, place: Place): Sheet {
  const a = r.attributes ?? {};
  const pic = picOf(r);
  if (a.section === 'early') {
    const said = clean(a.marks_text) ?? clean(String(r.looks_like ?? '').replace(/^As Okie describes it:\s*/, ''));
    return {
      id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind: 'Maker’s mark', group: firstLetter(surname(String(r.maker ?? ''))),
      glyphs: null, lang: null,
      reading: said ?? String(r.maker ?? r.name),
      means: [r.maker, r.place].filter(Boolean).join(', '),
      years: yearsOf(r.date_from, r.date_to),
      facts: facts([
        [pic ? 'The mark' : 'The mark, as Okie describes it', said],
        ['Maker', r.maker],
        ['Where', r.place],
        ['Date', clean(r.date_note)],
        ['Okie’s note', bookNote(a.okie_note)],
      ]),
      differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
      keys: keys(said, r.maker, r.place, r.date_from),
    };
  }
  const words = String(a.text_in_mark ?? '').split(/\s*;\s*/).filter(Boolean).join(', ');
  return {
    id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind: 'Trademark', group: firstLetter(r.maker),
    glyphs: null, lang: null,
    reading: String(r.maker ?? r.name).replace(/\s+trademark.*$/i, ''),
    means: clean(r.looks_like),
    years: yearsOf(r.date_from, r.date_to),
    facts: facts([
      ['Words in the mark', words || null],
      ['Maker', r.maker],
      ['Address in 1896', [a.address, r.place].filter(Boolean).join(', ') || null],
      ['Dates', clean(r.date_note) ?? (a.mark_status ? STATUS[String(a.mark_status)] ?? clean(a.mark_status) : null)],
      ['Note', bookNote(a.jc_note)],
    ]),
    differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
    keys: keys(r.maker, words, r.looks_like, r.place, a.address),
  };
}

// ── American year marks (Rainwater, Kovels) ─────────────────────────────────
/** The year-mark notes, without what is only about how the books lay out their boxes. */
const markNote = (n: unknown) => {
  const t = String(n ?? '').replace(/\s*\([^()]*\bbox(es)?\b[^()]*\)/gi, '');
  const kept = t.split(/(?<=\.)\s+/).filter((x) => x && !/\bbox(es)?\b|\bmerged\b|\bprint of\b|\bbroken\b/i.test(x));
  return clean(kept.join(' '));
};
function yearSheet(r: Rec, place: Place): Sheet {
  const pic = picOf(r);
  const y = r.date_from && r.date_to && r.date_to !== r.date_from ? `${r.date_from}–${r.date_to}` : String(r.date_from ?? '');
  return {
    id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind: 'Year mark', group: r.date_from ? `${Math.floor(r.date_from / 10) * 10}` : '0',
    glyphs: null, lang: null,
    reading: y || r.name,
    means: clean(r.looks_like),
    years: null,
    facts: facts([['The mark', clean(r.looks_like)], ['Notes', markNote(r.date_note)]]),
    differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
    keys: keys(r.date_from, r.date_to, r.looks_like, r.name),
  };
}

// ── Continental silver (Okie, 1928) ─────────────────────────────────────────
const KIND_WORD = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
function continentalSheet(r: Rec, place: Place): Sheet {
  const a = r.attributes ?? {};
  const pic = picOf(r);
  const kind = clean(a.okie_kind) ?? KIND_WORD(r.kind);
  return {
    id: r.id, anchor: r.id, url: `${place.path}#${r.id}`, kind, group: firstLetter(r.place),
    glyphs: null, lang: null,
    reading: r.place ? `${r.place}, ${kind.charAt(0).toLowerCase()}${kind.slice(1)}` : r.name,
    means: clean(r.looks_like),
    years: yearsOf(r.date_from, r.date_to),
    facts: facts([
      ['It shows', clean(r.looks_like)],
      ['Reads', clean(a.reads)],
      ['Town', r.place],
      ['Dates', clean(r.date_note)],
      ['Okie’s note', bookNote(a.okie_note)],
      ['Note', bookNote(a.eu20_note)],
    ]),
    differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
    keys: keys(r.place, r.name, kind, a.reads, r.looks_like, r.date_from),
  };
}
const COUNTRY_NAME: Record<string, string> = { netherlands: 'The Netherlands', 'austria-hungary': 'Austria-Hungary' };
const NORTH = new Set(['denmark', 'norway', 'sweden', 'finland']);
const WEST = new Set(['france', 'belgium', 'netherlands', 'switzerland']);
const SOUTH = new Set(['italy', 'spain', 'portugal']);

// ── The directories ─────────────────────────────────────────────────────────
export const DIRS: Record<string, Dir> = {
  british: {
    key: 'british', family: 'british-makers', base: '/marks/british-silver-makers/', title: 'British silver makers’ marks', noun: ['mark', 'marks'], places: ['town', 'towns and groups'],
    name: (slug) => (slug === 'king-s-lynn' ? 'King’s Lynn' : slug.startsWith('unascribed-') ? `Not tied to a town (${titleCase(slug.slice(11))})` : titleCase(slug)),
    regions: ['England', 'Scotland', 'Ireland', 'Overseas'],
    regionOf: (slug) => (SCOTLAND.has(slug) ? 'Scotland' : IRELAND.has(slug) ? 'Ireland' : slug === 'calcutta' ? 'Overseas' : 'England'),
    order: 'size', groupOf: (r) => firstLetter(r.attributes?.initials), groupLabel: letterLabel, sheet: britishSheet, sort: byReading,
    placeholder: 'Initials, a maker or a year: RA, Rand, 1712',
  },
  american: {
    key: 'american', family: 'american-makers', base: '/marks/american-silver-makers/', title: 'American silver makers’ marks', noun: ['mark', 'marks'], places: ['section', 'sections'],
    name: (slug) => SECTION[slug] ?? titleCase(slug),
    regions: ['Trademarks in 1896', 'Before 1850'],
    regionOf: (slug) => (slug === 'early' ? 'Before 1850' : 'Trademarks in 1896'),
    order: 'name', groupOf: (r) => (r.attributes?.section === 'early' ? firstLetter(surname(String(r.maker ?? ''))) : firstLetter(r.maker)), groupLabel: letterLabel,
    sheet: americanSheet, sort: (a, b) => a.reading.localeCompare(b.reading), placeholder: 'A maker, a word in the mark or a town: Gorham, sterling, Boston',
  },
  yearmarks: {
    key: 'yearmarks', family: 'us-year-marks', base: '/marks/american-silver-date-marks/', title: 'American silver year marks', noun: ['year mark', 'year marks'], places: ['firm', 'firms'],
    name: (slug) => ({ 'reed-barton': 'Reed & Barton', stieff: 'Stieff', whiting: 'Whiting', tiffany: 'Tiffany & Co.' } as Record<string, string>)[slug] ?? titleCase(slug),
    regions: ['Firms'], regionOf: () => 'Firms', order: 'name',
    groupOf: (r) => (r.date_from ? `${Math.floor(r.date_from / 10) * 10}` : '0'), groupLabel: (k) => (k === '0' ? 'Undated' : `${k}s`),
    sheet: yearSheet, sort: byYear, placeholder: 'A year or what the mark shows: 1935, bell, star',
  },
  continental: {
    key: 'continental', family: 'continental-silver', base: '/marks/continental-silver-marks/', title: 'Continental European silver marks', noun: ['mark', 'marks'], places: ['country', 'countries'],
    name: (slug) => COUNTRY_NAME[slug] ?? titleCase(slug),
    regions: ['Western Europe', 'Central Europe', 'Northern Europe', 'Southern Europe', 'Eastern Europe'],
    regionOf: (slug) => (WEST.has(slug) ? 'Western Europe' : NORTH.has(slug) ? 'Northern Europe' : SOUTH.has(slug) ? 'Southern Europe' : slug === 'russia' ? 'Eastern Europe' : 'Central Europe'),
    order: 'size', groupOf: (r) => (r.place ? firstLetter(r.place) : 'national'), groupLabel: (k) => (k === 'national' ? 'National marks' : letterLabel(k)), sheet: continentalSheet,
    sort: (a, b) => a.reading.localeCompare(b.reading) || byYear(a, b), placeholder: 'A town, a mark or a year: Augsburg, pine cone, 1750',
  },
};
export const dirOf = (key: string) => DIRS[key];

// ── Places ──────────────────────────────────────────────────────────────────
const placesCache = new Map<string, Place[]>();
/** Every place a directory's records name, with how many marks and how many makers named. */
export function places(dir: Dir = DIRS.british): Place[] {
  const got = placesCache.get(dir.key);
  if (got) return got;
  const by = new Map<string, Place>();
  for (const r of collection().records) {
    if (r.family !== dir.family) continue;
    const path = pageOf(r);
    if (!path.startsWith(dir.base)) continue;
    const slug = path.slice(dir.base.length).replace(/\/$/, '');
    if (!slug) continue;
    const p = by.get(slug) ?? { dir: dir.key, slug, path: `${dir.base}${slug}`, name: dir.name(slug), region: dir.regionOf(slug), n: 0, named: 0, from: null, to: null };
    p.n++;
    if (r.maker) p.named++;
    if (r.date_from) { p.from = Math.min(p.from ?? r.date_from, r.date_from); p.to = Math.max(p.to ?? r.date_from, r.date_to ?? r.date_from); }
    by.set(slug, p);
  }
  const out = [...by.values()].sort((a, b) => (dir.order === 'size' ? b.n - a.n : 0) || a.name.localeCompare(b.name));
  placesCache.set(dir.key, out);
  return out;
}
export const allPlaces = () => Object.values(DIRS).flatMap((d) => places(d));

export const recordsOf = (place: Place) => {
  const dir = DIRS[place.dir];
  return collection().records.filter((r) => r.family === dir.family && pageOf(r).replace(/\/$/, '') === place.path);
};

/** One place's records as sheets, in the directory's groups (marks without letters last), each group in the directory's order. */
export function makerGroups(place: Place) {
  const dir = DIRS[place.dir];
  const sheets = recordsOf(place).map((r) => ({ ...dir.sheet(r, place), group: dir.groupOf(r) }));
  // National marks first, marks without letters last, the rest in order.
  const rank = (k: string) => (k === 'national' ? -1 : k === '0' ? 1 : 0);
  const order = [...new Set(sheets.map((s) => s.group))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'en', { numeric: true }));
  return order.map((k) => ({ key: k, label: dir.groupLabel(k), sheets: sheets.filter((s) => s.group === k).sort(dir.sort) }));
}

// ── Big places, a page per letter ───────────────────────────────────────────
/** A place with more marks than this gets a page per group (London: 4,349), its own page a hub of them. */
export const SPLIT = 1500;
export const isSplit = (p: Place) => p.n > SPLIT;
export const letterSlug = (key: string) => (key === '0' ? 'without-letters' : key.toLowerCase());
export const letterPath = (p: Place, key: string) => `${p.path}/${letterSlug(key)}`;
/** The letter a British record id points to by its own shape (mm-<office>-<year>-<initials>[-n]), for sending an old link to its letter page. */
export function letterFromId(id: string) {
  const part = /^mm-[a-z-]+?-\d{4}-([a-z0-9]+)/.exec(id)?.[1] ?? '';
  if (!part || /^device$/.test(part)) return '0';
  return /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() : '0';
}

// ── Old Sheffield plate (Okie, 1928): one page, by town ─────────────────────
/** "Hancock, Joseph" → "Joseph Hancock"; a firm's name stays as printed. */
const natural = (m: string) => (/^[^,]+,\s*[A-Z][a-z]+(\s[A-Z][a-z.]+)?$/.test(m) ? m.replace(/^([^,]+),\s*(.+)$/, '$2 $1') : m);
export function sheffieldPlateSheet(r: Rec): Sheet {
  const a = r.attributes ?? {};
  const pic = picOf(r);
  const maker = r.maker ? natural(String(r.maker)) : null;
  const reads = String(a.reads ?? '').trim();
  const readsWords = reads && !/^(no letters read|unclear)/i.test(reads) ? reads : null;
  return {
    id: r.id, anchor: r.id, url: `/marks/old-sheffield-plate-makers#${r.id}`, kind: 'Maker’s mark', group: r.place ? String(r.place) : 'Town not recorded',
    glyphs: null, lang: null,
    reading: (readsWords ? readsWords.charAt(0).toUpperCase() + readsWords.slice(1) : null) ?? clean(r.looks_like) ?? 'A mark without letters',
    means: maker ? `${maker}${a.trade ? `, ${String(a.trade).replace(/\.$/, '').toLowerCase()}` : ''}` : 'Maker not traced',
    years: yearsOf(r.date_from, r.date_to),
    facts: facts([
      ['The mark', clean(r.looks_like)],
      ['It reads', readsWords],
      ['Maker', maker],
      ['Trade', clean(a.trade)],
      ['Address', clean(a.location)],
      ['Date', clean(r.date_note)],
      ['Okie’s note', bookNote(a.okie_note)],
    ]),
    differ: [], caution: null, pics: pic ? [pic] : [], sources: sourcesOf(r), single: r.single_source,
    keys: keys(reads, r.maker, maker, a.trade, a.location, r.place, r.date_from),
  };
}
