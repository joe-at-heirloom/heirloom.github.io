// The reference, as one map. Seven areas, by what a reader is holding: silver
// and gold, pottery and porcelain, China, Japan, Korea, artists' signatures,
// and watches and serial numbers. Each area lists its pages in the order a
// reader needs them (the tools that read a mark first, then the catalogues,
// then the makers and guides). The header's panel, the reference home, each
// area's home, the rail beside every reference page, the breadcrumbs and the
// "next in this area" links all read this one map, so a page added here (or a
// family of records the collection gains) shows up everywhere at once.
//
// A link is shown only when its page is built: pages that data still to come
// will fill (British makers by office, Chinese dating, imperial seals) sit in
// the map already and appear the day their route exists.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { collection, SEAL_KINDS } from './portal';
import { OFFICES, HALLMARKS } from './marks';
import { makers } from './makers';
import { artists } from './artists';
import { places, allPlaces, DIRS, isSplit, letterPath, makerGroups } from './makers-dir';

export type AreaKey = 'silver' | 'pottery' | 'china' | 'japan' | 'korea' | 'signatures' | 'serials';
export type RefLink = {
  href: string;
  label: string;
  note?: string;
  /** Characters shown beside the label (a reign's name, a hall's mark). */
  glyph?: string;
  /** Years, as a reader would say them ("1479 to 2026"). */
  years?: string;
  /** Listed here, but at home in another area (its crumbs and rail are that area's). */
  away?: AreaKey;
};
export type RefGroup = { label: string; links: RefLink[]; fold?: boolean };
export type Area = {
  key: AreaKey;
  /** The area's name on its own page and in the rail. */
  label: string;
  /** In a crumb, a menu or a tight list. */
  short: string;
  href: string;
  /** One sentence: what is in here. */
  lede: string;
  /** What a reader sees on the item that sends them here. */
  cue: string;
  families: string[];
  /** The reference search this area's records belong to. */
  scope: 'marks' | 'signatures';
  /** The face its own characters are set in. */
  script?: 'han' | 'ja' | 'hangul';
  groups: RefGroup[];
};

const norm = (href: string) => (href.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/');

// ── What is built ───────────────────────────────────────────────────────────
// Astro's own pages (static files under src/pages), the pages its dynamic
// routes make, and the generated pages the build still carries over.
let built: Set<string> | null = null;
let made: Set<string> | null = null;
/** The pages Astro makes itself (its static pages and its dynamic routes, not the carried-over ones). */
export function astroRoutes(): Set<string> {
  if (made) return made;
  const out = new Set<string>();
  const pages = join(process.cwd(), 'src', 'pages');
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (!name.startsWith('[')) walk(p); continue; }
      if (!name.endsWith('.astro') || name.includes('[')) continue;
      const rel = '/' + relative(pages, p).replace(/\\/g, '/').replace(/\.astro$/, '').replace(/(^|\/)index$/, '');
      out.add(norm(rel));
    }
  };
  walk(pages);
  for (const o of OFFICES) out.add(`/marks/${o.slug}-date-letters`);
  for (const m of makers()) out.add(`/marks/${m.slug}`);
  for (const a of artists()) out.add(`/marks/${a.slug}-signature`);
  for (const r of collection().records) if (r.kind === 'reign mark') out.add(`/marks/${r.id.replace(/^reign-/, '')}-mark`);
  for (const p of allPlaces()) { out.add(p.path); if (isSplit(p)) for (const g of makerGroups(p)) out.add(letterPath(p, g.key)); }
  // The guide pages (pages/marks/[...guide].astro, src/content/guides/*.json).
  const guides = join(process.cwd(), 'src', 'content', 'guides');
  if (existsSync(guides)) for (const f of readdirSync(guides)) if (f.endsWith('.json')) out.add(norm(JSON.parse(readFileSync(join(guides, f), 'utf8')).path));
  return (made = out);
}
export function routes(): Set<string> {
  if (built) return built;
  const out = new Set(astroRoutes());
  // The generated pages at the site's root, carried into the build (or framed by marks/[...legacy].astro).
  const root = join(process.cwd(), '..');
  for (const dir of ['', 'marks']) {
    const d = join(root, dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) if (f.endsWith('.html') && f !== 'index.html' && !f.startsWith('shell')) out.add(norm(`/${dir ? dir + '/' : ''}${f.replace(/\.html$/, '')}`));
  }
  return (built = out);
}
export const isBuilt = (href: string) => routes().has(norm(href));

// ── The data each list is drawn from ────────────────────────────────────────
const span = (a: number, b: number) => (a === b ? String(a) : `${a} to ${b}`);
function officeYears() {
  const by = new Map<string, [number, number]>();
  for (const r of HALLMARKS.rows as { office: string; year: number }[]) {
    const s = by.get(r.office) ?? [r.year, r.year];
    by.set(r.office, [Math.min(s[0], r.year), Math.max(s[1], r.year)]);
  }
  return by;
}
function reignLinks(): RefLink[] {
  return collection().records
    .filter((r) => r.kind === 'reign mark')
    .sort((a, b) => (a.date_from ?? 0) - (b.date_from ?? 0))
    .map((r) => {
      const glyph = r.name.split(' ').find((w) => /[\u3400-\u9fff]/.test(w));
      const pinyin = r.id.replace(/^reign-/, '');
      return { href: `/marks/${pinyin}-mark`, label: pinyin.charAt(0).toUpperCase() + pinyin.slice(1), glyph, years: r.date_from ? span(r.date_from, r.date_to ?? r.date_from) : undefined };
    });
}
const MAKER_LABEL: Record<string, string> = {
  'limoges-haviland-marks': 'Haviland and Limoges', 'hummel-marks': 'Hummel (Goebel)', 'royal-copenhagen-marks': 'Royal Copenhagen',
  'royal-doulton-marks': 'Royal Doulton', 'meissen-marks': 'Meissen', 'nippon-marks': 'Nippon', 'noritake-marks': 'Noritake',
  'weller-pottery-marks': 'Weller', 'roseville-pottery-marks': 'Roseville', 'mccoy-pottery-marks': 'McCoy', 'hull-pottery-marks': 'Hull',
};
function makerLinks(): RefLink[] {
  return makers()
    .map((m) => ({ href: `/marks/${m.slug}`, label: MAKER_LABEL[m.slug] ?? m.crumb }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
function artistLinks(): RefLink[] {
  return artists()
    .map((a) => ({ href: `/marks/${a.slug}-signature`, label: a.name, years: a.born ? span(a.born, a.died) : undefined }))
    .sort((a, b) => a.label.split(' ').at(-1)!.localeCompare(b.label.split(' ').at(-1)!));
}

// ── The map ─────────────────────────────────────────────────────────────────
function build(): Area[] {
  const years = officeYears();
  const offices: RefLink[] = OFFICES.map((o) => {
    const y = years.get(o.office);
    return { href: `/marks/${o.slug}-date-letters`, label: o.office, note: o.town, years: y ? span(y[0], y[1]) : undefined };
  });
  // Every town Jackson lists makers for (lib/makers-dir.ts), most marks first, after the directory itself.
  const makerOffices: RefLink[] = [
    { href: '/marks/british-silver-makers/', label: 'Every town', note: 'The directory, by country' },
    { href: '/marks/old-sheffield-plate-makers', label: 'Old Sheffield plate makers', note: 'Fused plate, 1743 to the 1860s' },
    ...places(DIRS.british).map((p) => ({ href: p.path, label: p.name, note: `${p.n.toLocaleString('en-US')} marks` })),
  ];
  // The other directories (lib/makers-dir.ts): each one's hub, then its pages.
  const dirLinks = (k: string, hub: string, note: string): RefLink[] => [
    { href: DIRS[k].base, label: hub, note },
    ...places(DIRS[k]).map((p) => ({ href: p.path, label: p.name, note: `${p.n.toLocaleString('en-US')} ${p.n === 1 ? DIRS[k].noun[0] : DIRS[k].noun[1]}` })),
  ];

  return [
    {
      key: 'silver', label: 'Silver and gold', short: 'Silver and gold', href: '/marks/silver/', scope: 'marks',
      families: ['british-hallmarks', 'british-makers', 'world-silver', 'silver-standards', 'silver-plate', 'gold'],
      lede: 'Hallmarks, date letters and makers’ marks on silver and gold: what each mark says about the metal, who made it, and when.',
      cue: 'Letters, a lion or a number struck into metal',
      groups: [
        { label: 'Read the marks', links: [
          { href: '/marks/silver-marks', label: 'Silver marks', note: 'Tap the marks you see: solid or plate, maker, years' },
          { href: '/marks/gold-marks', label: 'Gold marks', note: 'Karat, gold-filled or plated' },
          { href: '/silver-hallmarks', label: 'How to read a hallmark', note: 'British, American and continental marks' },
          { href: '/marks/is-it-real-silver', label: 'Is it real silver?', note: 'The marks and tests that tell' },
        ] },
        { label: 'British date letters', fold: true, links: offices },
        { label: 'British makers’ marks', fold: true, links: makerOffices },
        { label: 'American makers’ marks', fold: true, links: [
          ...dirLinks('american', 'Every section', 'Trademarks in 1896, and the early silversmiths'),
          ...dirLinks('yearmarks', 'Year marks', 'The firms that marked the year').map((l, i) => (i === 0 ? l : { ...l, label: `${l.label} year marks` })),
        ] },
        { label: 'Continental marks', fold: true, links: dirLinks('continental', 'Every country', 'Town, standard and duty marks') },
        { label: 'Silver from other countries', links: [
          { href: '/marks/gorham-silver-marks', label: 'Gorham', note: 'American, with year marks' },
          { href: '/marks/french-silver-marks', label: 'France', note: 'Minerva, the boar’s head, makers’ lozenges' },
          { href: '/marks/christofle-marks', label: 'Christofle', note: 'French silver plate' },
          { href: '/marks/german-silver-marks', label: 'Germany', note: 'The crescent and crown' },
          { href: '/marks/russian-silver-marks', label: 'Russia', note: 'Zolotnik standards and town marks' },
          { href: '/marks/mexican-silver-marks', label: 'Mexico', note: 'The eagle and Taxco' },
        ] },
        { label: 'American silver plate', links: [
          { href: '/marks/1847-rogers-bros', label: '1847 Rogers Bros.' },
          { href: '/marks/wm-rogers', label: 'Wm. Rogers' },
          { href: '/marks/community-plate-oneida', label: 'Community (Oneida)' },
          { href: '/marks/holmes-and-edwards', label: 'Holmes & Edwards' },
          { href: '/marks/international-silver-co', label: 'International Silver' },
        ] },
        { label: 'Standards and metals', links: [
          { href: '/marks/silver-purity-marks', label: 'Silver purity marks', note: '925, 800, 84 and the rest' },
          { href: '/marks/britannia-silver', label: 'Britannia silver' },
          { href: '/marks/coin-silver', label: 'Coin silver' },
          { href: '/marks/german-silver', label: 'German silver', note: 'Nickel silver: no silver in it' },
          { href: '/marks/gold-karat-marks', label: 'Gold karat marks' },
        ] },
      ],
    },
    {
      key: 'pottery', label: 'Pottery and porcelain', short: 'Pottery and porcelain', href: '/marks/pottery/', scope: 'marks',
      families: ['ceramics-makers', 'pottery-codes'],
      lede: 'Factory marks, backstamps and date codes on European, American and Japanese export ceramics, maker by maker.',
      cue: 'A name, an emblem or a code under a plate or a vase',
      groups: [
        { label: 'Read the marks', links: [
          { href: '/marks/pottery-marks', label: 'Pottery and porcelain marks', note: 'Every maker on one timeline' },
          { href: '/marks/pottery-date-codes', label: 'Pottery date codes', note: 'Wedgwood, Minton, Worcester, Rookwood, Sèvres' },
        ] },
        { label: 'Makers', links: makerLinks() },
        { label: 'Date codes, factory by factory', links: [
          { href: '/marks/wedgwood-date-codes', label: 'Wedgwood' },
          { href: '/marks/minton-date-marks', label: 'Minton' },
          { href: '/marks/royal-worcester-date-marks', label: 'Royal Worcester' },
          { href: '/marks/rookwood-pottery-marks', label: 'Rookwood' },
          { href: '/marks/sevres-date-letters', label: 'Sèvres' },
        ] },
        { label: 'East Asian ceramics', links: [
          { href: '/marks/chinese-reign-marks', label: 'Chinese reign marks', away: 'china' },
          { href: '/marks/japanese/', label: 'Japanese kiln marks', away: 'japan' },
          { href: '/marks/korean-ceramics', label: 'Korean ceramics', away: 'korea' },
        ] },
      ],
    },
    {
      key: 'china', label: 'Chinese marks and seals', short: 'China', href: '/marks/chinese/', scope: 'marks', script: 'han',
      families: ['chinese-marks', 'chinese-dating', 'chinese-people'],
      lede: 'Reign and hall marks on Chinese porcelain, how a Chinese date is written, and the seals of painters, calligraphers and collectors, with sources in Chinese and English.',
      cue: 'Chinese characters in a square or a ring',
      groups: [
        { label: 'Marks on porcelain', links: [
          { href: '/marks/chinese/', label: 'Overview' },
          { href: '/marks/chinese-reign-marks', label: 'Reign marks', note: 'Ming and Qing, with a finder' },
          { href: '/marks/chinese-hall-marks', label: 'Hall marks', note: 'Halls, studios and palace buildings' },
          { href: '/marks/chinese/dating', label: 'Reading a Chinese date', note: 'Era names, the sixty-year cycle, taboo characters' },
          { href: '/marks/chinese/other-marks', label: 'Other marks', note: 'Symbols, good wishes, makers and export marks' },
        ] },
        { label: 'Every reign', fold: true, links: reignLinks() },
        { label: 'Seals', links: [
          { href: '/marks/chinese/painters/', label: 'Painters and collectors', note: 'Their seals and signatures' },
          { href: '/marks/chinese/imperial-seals', label: 'Imperial collection seals', note: 'The emperors’ seals on paintings' },
        ] },
      ],
    },
    {
      key: 'japan', label: 'Japanese marks and seals', short: 'Japan', href: '/marks/japanese/', scope: 'marks', script: 'ja',
      families: ['japanese-marks'],
      lede: 'Kiln marks on porcelain, seals on woodblock prints, signatures and crests, and the way a Japanese date is written.',
      cue: 'Kanji with kana, or seals in the margin of a print',
      groups: [
        { label: 'Marks and seals', links: [
          { href: '/marks/japanese/', label: 'Marks, seals and signatures', note: 'Porcelain, prints, metalwork, crests' },
          { href: '/marks/japanese-dates', label: 'Reading a Japanese date', note: 'Era names and the imperial count' },
          { href: '/marks/japanese-print-seals', label: 'Dating a print by its seals', note: 'Censor and date seals' },
        ] },
        { label: 'Export porcelain makers', links: [
          { href: '/marks/nippon-marks', label: 'Nippon', away: 'pottery' },
          { href: '/marks/noritake-marks', label: 'Noritake', away: 'pottery' },
        ] },
        { label: 'Print artists’ signatures', links: [
          { href: '/marks/katsushika-hokusai-signature', label: 'Katsushika Hokusai', away: 'signatures' },
          { href: '/marks/utagawa-hiroshige-signature', label: 'Utagawa Hiroshige', away: 'signatures' },
        ] },
      ],
    },
    {
      key: 'korea', label: 'Korean marks and inscriptions', short: 'Korea', href: '/marks/korean/', scope: 'marks', script: 'hangul',
      families: ['korean-marks'],
      lede: 'Inscriptions on Goryeo celadon, buncheong and Joseon porcelain, and the ways a Korean date is written.',
      cue: 'Hangul, or characters inlaid in celadon',
      groups: [
        { label: 'Marks and dates', links: [
          { href: '/marks/korean/', label: 'Inscriptions and marks', note: 'Goryeo to the 20th century' },
          { href: '/marks/korean-dates', label: 'Reading a Korean date', note: 'Eras, kings, the Chongzhen count' },
          { href: '/marks/korean-ceramics', label: 'Ceramics by period', note: 'Celadon, buncheong, white porcelain' },
        ] },
      ],
    },
    {
      key: 'signatures', label: 'Artists’ signatures', short: 'Signatures', href: '/signatures', scope: 'signatures',
      families: ['signatures', 'chinese-people'],
      lede: 'How painters signed over their careers, from dated examples in museum collections, and the seals of Chinese painters and collectors.',
      cue: 'A signature, a monogram or a seal on a painting or print',
      groups: [
        { label: 'Find a signature', links: [
          { href: '/signatures', label: 'Search signatures', note: 'By name, year or what it reads' },
          { href: '/marks/artist-signatures', label: 'Reading a signature', note: 'What a signature can and cannot tell' },
        ] },
        { label: 'Artists', links: artistLinks() },
        { label: 'East Asian painters', links: [
          { href: '/marks/chinese/painters/', label: 'Chinese painters and collectors', away: 'china' },
          { href: '/marks/japanese/', label: 'Japanese print artists’ seals', away: 'japan' },
        ] },
      ],
    },
    {
      key: 'serials', label: 'Watches and serial numbers', short: 'Serial numbers', href: '/marks/serial-numbers/', scope: 'marks',
      families: ['swiss-watches', 'serial-numbers'],
      lede: 'Serial numbers that date a watch, a sewing machine or a camera, from the makers’ own tables.',
      cue: 'A serial number on a watch, a sewing machine or a camera',
      groups: [
        { label: 'Watches', links: [
          { href: '/marks/watch-serial-numbers', label: 'Watch serial numbers', note: 'One box for Rolex, Omega and pocket watches' },
          { href: '/marks/rolex-serial-numbers', label: 'Rolex' },
          { href: '/marks/omega-serial-numbers', label: 'Omega' },
          { href: '/marks/pocket-watch-serial-numbers', label: 'American pocket watches', note: 'Elgin, Waltham, Hamilton and others' },
        ] },
        { label: 'Machines and cameras', links: [
          { href: '/marks/singer-serial-numbers', label: 'Singer sewing machines' },
          { href: '/marks/leica-serial-numbers', label: 'Leica cameras' },
        ] },
      ],
    },
  ];
}

let areas: Area[] | null = null;
/** Every area, with only the links whose pages are built. */
export function AREAS(): Area[] {
  if (areas) return areas;
  return (areas = build().map((a) => ({
    ...a,
    groups: a.groups.map((g) => ({ ...g, links: g.links.filter((l) => isBuilt(l.href)) })).filter((g) => g.links.length > 0),
  })));
}
export const area = (key: AreaKey) => AREAS().find((a) => a.key === key)!;

// Pages the map does not list one by one, by where they live.
const HOMES: [RegExp, AreaKey][] = [
  [/^\/marks\/chinese(\/|-)/, 'china'],
  [/^\/marks\/japanese/, 'japan'],
  [/^\/marks\/korean/, 'korea'],
  [/-signature$|^\/signatures/, 'signatures'],
  [/^\/marks\/(british|american)-silver-makers\/|^\/marks\/american-silver-date-marks\/|^\/marks\/continental-silver-marks\//, 'silver'],
  [/-date-letters$/, 'silver'],
];

/** The area a page belongs to, and the link that names it there. */
export function placeOf(path: string): { area: Area | null; link: RefLink | null } {
  const p = norm(path);
  for (const a of AREAS()) {
    if (norm(a.href) === p) return { area: a, link: { href: a.href, label: a.short } };
    for (const g of a.groups) for (const l of g.links) if (!l.away && norm(l.href) === p) return { area: a, link: l };
  }
  const hit = HOMES.find(([re]) => re.test(p));
  return { area: hit ? area(hit[1]) : null, link: null };
}

/** The area's pages in reading order (its own, not those it lists from elsewhere). */
export function order(a: Area): RefLink[] {
  const seen = new Set<string>();
  const out: RefLink[] = [];
  for (const g of a.groups) for (const l of g.links) if (!l.away && !seen.has(norm(l.href))) { seen.add(norm(l.href)); out.push(l); }
  return out;
}

// ── What each area holds ────────────────────────────────────────────────────
export type Holdings = { records: number; images: number; sources: number; kinds: [string, number][]; topSources: { citation: string; url: string | null; n: number }[] };
const held = new Map<AreaKey, Holdings>();
export function holdings(a: Area): Holdings {
  const got = held.get(a.key);
  if (got) return got;
  const c = collection();
  const fam = new Set(a.families);
  const recs = c.records.filter((r) => fam.has(r.family));
  const kinds = new Map<string, number>();
  const bySource = new Map<string, number>();
  let images = 0;
  for (const r of recs) {
    if (r.image_id) images++;
    if (!SEAL_KINDS.has(r.kind)) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);
    for (const s of r.sources) bySource.set(s.id, (bySource.get(s.id) ?? 0) + 1);
  }
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const h: Holdings = {
    records: recs.length,
    images,
    sources: bySource.size,
    kinds: [...kinds.entries()].sort((x, y) => y[1] - x[1]),
    topSources: [...bySource.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 8)
      .map(([id, n]) => ({ citation: src.get(id)?.citation ?? id, url: src.get(id)?.url ?? null, n })),
  };
  held.set(a.key, h);
  return h;
}

/** A few real pictures from an area's records, for its card: marks first, never an empty plate. */
export function pictures(a: Area, n = 4): string[] {
  if (a.key === 'japan') {
    const dir = join(process.cwd(), 'src', 'data', 'site', 'japanese');
    const out: string[] = [];
    if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => /^index.*museum.*\.json$|^index\.json$/.test(x))) {
      for (const i of JSON.parse(readFileSync(join(dir, f), 'utf8')) as any[]) if (i.file && /-mark\./.test(i.file) && out.length < n) out.push(`marks/img/japanese/${i.file}`);
    }
    if (out.length) return out;
  }
  const c = collection();
  const fam = new Set(a.families);
  const img = new Map(c.images.map((i) => [i.id, i]));
  const out: string[] = [];
  const seenKind = new Map<string, number>();
  // Prefer photographs, and spread the picks across kinds of record.
  const recs = c.records.filter((r) => fam.has(r.family) && r.image_id && img.has(r.image_id));
  const rank = (s: string) => (s === 'photo' ? 0 : s === 'facsimile' ? 1 : 2);
  recs.sort((x, y) => rank(img.get(x.image_id!)!.status) - rank(img.get(y.image_id!)!.status));
  for (const r of recs) {
    if (out.length >= n) break;
    const k = seenKind.get(r.kind) ?? 0;
    if (k >= 2) continue;
    seenKind.set(r.kind, k + 1);
    out.push(img.get(r.image_id!)!.file);
  }
  return out;
}
