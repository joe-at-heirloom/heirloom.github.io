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
import { firms as staffsFirms } from './staffordshire';
import { firms as dinnerFirms } from './american-dinnerware';
import { places as tiffanyPlaces } from './tiffany';

export type AreaKey = 'silver' | 'pottery' | 'china' | 'japan' | 'korea' | 'india' | 'signatures' | 'serials' | 'glass' | 'rugs';
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
  script?: 'han' | 'ja' | 'hangul' | 'indic';
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
  // Korean painters, calligraphers and collectors (pages/marks/korean/painters/[slug].astro).
  for (const r of collection().records) if (r.family === 'korean-people' && !r.parent_id) out.add(norm(r.page_path));
  // Staffordshire and English potters, a page per firm (pages/marks/staffordshire-pottery-marks/[firm].astro).
  for (const f of staffsFirms()) out.add(norm(f.page));
  // American dinnerware and pottery firms, a page per firm (pages/marks/american-dinnerware-marks/[firm].astro).
  for (const f of dinnerFirms()) out.add(norm(f.page));
  // American art potteries, a page per pottery (pages/marks/american-art-pottery-marks/[firm].astro).
  for (const f of dinnerFirms('american-art-pottery')) out.add(norm(f.page));
  // Japanese export porcelain, a page per maker or set of marks (pages/marks/japanese-export-porcelain-marks/[firm].astro).
  for (const f of dinnerFirms('japanese-export')) out.add(norm(f.page));
  // Tiffany windows, a page per state (pages/marks/tiffany-windows/[place].astro).
  for (const p of tiffanyPlaces()) out.add(p.path);
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
function staffsLinks(): RefLink[] {
  return staffsFirms().map((f) => ({ href: f.page, label: f.title, note: f.where }));
}
function dinnerLinks(set: 'american-dinnerware' | 'american-art-pottery' | 'japanese-export' = 'american-dinnerware'): RefLink[] {
  return dinnerFirms(set).map((f) => ({ href: f.page, label: f.title, note: f.where })).sort((a, b) => a.label.localeCompare(b.label));
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
          { href: '/marks/chinese/export-silver', label: 'China', note: 'Export silver of Canton, Hong Kong and Shanghai' },
          { href: '/marks/chinese/silver-shops', label: 'Chinese silver shops', note: 'Shop marks in characters, province by province' },
          { href: '/marks/mexican-silver-marks', label: 'Mexico', note: 'The eagle and Taxco' },
          { href: '/marks/indian/', label: 'India, Burma and Ceylon', note: 'Calcutta, Madras, Kutch and Rangoon makers', away: 'india' },
          { href: '/marks/indian-hallmarks', label: 'Indian hallmarks', note: 'The BIS mark, 916 and HUID', away: 'india' },
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
        { label: 'Staffordshire and English potters', links: [
          { href: '/marks/staffordshire-pottery-marks/', label: 'Staffordshire pottery marks', note: 'Dating an English backstamp, firm by firm' },
          { href: '/marks/british-registration-marks', label: 'British registration marks', note: 'Read an Rd number or a diamond mark' },
          ...staffsLinks(),
        ], fold: true },
        { label: 'American dinnerware and pottery', links: [
          { href: '/marks/american-dinnerware-marks/', label: 'American dinnerware marks', note: 'Dating an American backstamp, firm by firm' },
          ...dinnerLinks(),
        ], fold: true },
        { label: 'American art pottery', links: [
          { href: '/marks/american-art-pottery-marks/', label: 'American art pottery marks', note: 'Marks and decorators’ monograms, pottery by pottery' },
          ...dinnerLinks('american-art-pottery'),
        ], fold: true },
        { label: 'Pewabic Pottery, Detroit', links: [
          { href: '/marks/pewabic-pottery/', label: 'Pewabic Pottery', note: 'Detroit, 1903 to today' },
          { href: '/marks/pewabic-pottery-marks', label: 'Pewabic marks', note: 'Dating a piece by its mark' },
          { href: '/marks/pewabic-pottery/tile-installations', label: 'Pewabic tile installations', note: 'Every building, by place' },
          { href: '/marks/pewabic-pottery/glazes', label: 'Pewabic glazes and wares' },
          { href: '/marks/pewabic-pottery/history', label: 'Pewabic history and people' },
          { href: '/marks/pewabic-pottery/museum-collections', label: 'Pewabic in museums' },
        ] },
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
      families: ['chinese-marks', 'chinese-dating', 'chinese-people', 'chinese-export-silver', 'chinese-silver-shops'],
      lede: 'Reign and hall marks on Chinese porcelain, how a Chinese date is written, and the seals of painters, calligraphers and collectors, with sources in Chinese and English.',
      cue: 'Chinese characters in a square or a ring',
      groups: [
        { label: 'Marks on porcelain', links: [
          { href: '/marks/chinese/', label: 'Overview' },
          { href: '/marks/chinese-reign-marks', label: 'Reign marks', note: 'Ming and Qing, with a finder' },
          { href: '/marks/chinese-hall-marks', label: 'Hall marks', note: 'Halls, studios and palace buildings' },
          { href: '/marks/chinese/dating', label: 'Reading a Chinese date', note: 'Era names, the sixty-year cycle, taboo characters' },
          { href: '/marks/chinese/other-marks', label: 'Other marks', note: 'Symbols, good wishes, makers and export marks' },
          { href: '/marks/chinese/modern-marks', label: 'Republic and modern', note: 'Jingdezhen factories, painters and export marks after 1900' },
          { href: '/marks/chinese/export-porcelain', label: 'Export porcelain', note: 'Rose Medallion, Canton, Nanking, Fitzhugh and their dates' },
        ] },
        { label: 'Other wares', links: [
          { href: '/marks/chinese/yixing', label: 'Yixing', note: 'Teapot potters and their seals' },
          { href: '/marks/chinese/works-of-art', label: 'Works of art', note: 'Cloisonné, bronze, jade, snuff bottles and lacquer' },
        ] },
        { label: 'Silver', links: [
          { href: '/marks/chinese/export-silver', label: 'Export silver', note: 'Makers, marks and chops of Canton, Hong Kong and Shanghai' },
          { href: '/marks/chinese/silver-shops', label: 'Silver shops', note: 'Shop marks (银楼) of every province, with their towns and dates' },
        ] },
        { label: 'Every reign', fold: true, links: reignLinks() },
        { label: 'Seals', links: [
          { href: '/marks/chinese/painters/', label: 'Painters and collectors', note: 'Their seals and signatures' },
          { href: '/marks/chinese/seal-reader', label: 'Read a seal from a photo', note: 'Find a seal among 21,000 recorded' },
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
          { href: '/marks/japanese-export-porcelain-marks/', label: 'Japanese export porcelain marks', note: 'Every Nippon-era mark and Noritake backstamp Van Patten pictures' },
          ...dinnerLinks('japanese-export'),
          { href: '/marks/nippon-marks', label: 'Nippon, in brief', away: 'pottery' },
          { href: '/marks/noritake-marks', label: 'Noritake, in brief', away: 'pottery' },
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
        { label: 'Guides by kind', links: [
          { href: '/marks/korean-furniture', label: 'Furniture', note: 'Chests, cabinets, tables; telling old from export' },
          { href: '/marks/korean-metalwork', label: 'Metalwork and lacquer', note: 'Brass, silver, inlaid iron, mother-of-pearl' },
          { href: '/marks/korean-folk-art', label: 'Folk painting and textiles', note: 'Minhwa, screens, wrapping cloths, ornaments' },
        ] },
        { label: 'Painters and seals', links: [
          { href: '/marks/korean/painters/', label: 'Painters and calligraphers', note: 'Art names, dates and seals' },
        ] },
      ],
    },
    {
      key: 'india', label: 'Indian marks and dates', short: 'India', href: '/marks/indian/', scope: 'marks', script: 'indic',
      families: ['indian-marks', 'indian-figures', 'indian-paintings', 'indian-crafts'],
      lede: 'Silver makers’ marks from Calcutta, Bombay, Madras, Kutch, Burma and Ceylon, Indian hallmarks on gold and silver since 2000, origin stamps, the ways an Indian date is written, who a figure on a bronze or a painting shows, and the kinds of Indian painting.',
      cue: 'Devanagari, Gujarati or Persian writing, or a maker’s name and an elephant struck into silver',
      groups: [
        { label: 'Marks and dates', links: [
          { href: '/marks/indian/', label: 'Silver marks and stamps', note: 'Makers, retailers and origin stamps, 1770s to today' },
          { href: '/marks/indian-hallmarks', label: 'Indian hallmarks', note: 'The BIS mark, 22K916, year letters, HUID' },
          { href: '/marks/indian-dates', label: 'Reading an Indian date', note: 'Samvat, Shaka, Hijri and regnal years' },
        ] },
        { label: 'Figures, paintings and crafts', links: [
          { href: '/marks/indian-figures', label: 'Who is this figure?', note: 'Hindu, Buddhist and Jain figures by what they hold and ride' },
          { href: '/marks/indian-paintings', label: 'Indian paintings', note: 'Schools, later copies, and the seals on paintings' },
          { href: '/marks/indian-crafts', label: 'Indian decorative arts', note: 'Bidri and brass, enamel, marble inlay, carving, jewelry' },
        ] },
      ],
    },
    {
      key: 'signatures', label: 'Artists’ signatures', short: 'Signatures', href: '/signatures', scope: 'signatures',
      families: ['signatures', 'chinese-people', 'korean-people'],
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
      key: 'glass', label: 'Art glass', short: 'Art glass', href: '/marks/tiffany-windows/', scope: 'marks',
      families: ['tiffany-windows'],
      lede: 'Where Tiffany’s windows and mosaics were installed, from the firm’s own lists, and Tiffany’s lamps and shades by the numbers its catalogues gave them.',
      cue: 'A leaded glass window, a mosaic, or a leaded glass lamp',
      groups: [
        { label: 'Tiffany windows', links: [
          { href: '/marks/tiffany-windows/', label: 'Tiffany windows', note: 'Every building Tiffany listed, 1893 to 1910' },
        ] },
        { label: 'Tiffany lamps', links: [
          { href: '/marks/tiffany-lamps', label: 'Tiffany lamps and shades', note: 'Every shade and base number in Tiffany’s catalogues' },
        ] },
        { label: 'Windows by state', fold: true, links: [...tiffanyPlaces()].sort((a, b) => (a.slug === 'outside-the-united-states' ? 1 : b.slug === 'outside-the-united-states' ? -1 : b.sites.length - a.sites.length)).map((p) => ({ href: p.path, label: p.name, note: `${p.sites.length.toLocaleString('en-US')} ${p.sites.length === 1 ? 'building' : 'buildings'}` })) },
      ],
    },
    {
      key: 'rugs', label: 'Oriental rugs', short: 'Rugs', href: '/marks/rugs/', scope: 'marks',
      families: ['rugs'],
      lede: 'What a rug’s back, sides and ends say about where it was made, whether it was knotted by hand, how to read a date or a name woven into it, the knot counts and labels on its tags, and what its dyes say about its age.',
      cue: 'A rug or carpet with a pattern, a woven date, or a label on the back',
      groups: [
        { label: 'Read your rug', links: [
          { href: '/marks/rugs/identify', label: 'Turn it over', note: 'What the back, sides and ends point to' },
          { href: '/marks/rugs/handmade-or-machine-made', label: 'Hand-knotted or machine-made?', note: 'The checks, and what each answer means' },
          { href: '/marks/rugs/dates', label: 'A date or a name woven in', note: 'Persian, Arabic and Armenian numbers' },
          { href: '/marks/rugs/knot-count', label: 'Knot counts', note: 'Raj, line, 16/18, 9/9 and knots per inch' },
          { href: '/marks/rugs/turkmen-guls', label: 'Turkmen guls', note: 'Which tribe wove the medallion on your rug or bag' },
        ] },
        { label: 'Reference', links: [
          { href: '/marks/rugs/types', label: 'Rug types', note: 'Persian, Caucasian, Turkish, Turkmen, Chinese, Indian and more' },
          { href: '/marks/rugs/motifs', label: 'Motifs and designs', note: 'Boteh, herati, mina khani, borders, and where each is woven' },
          { href: '/marks/rugs/knots', label: 'Knots and weaves', note: 'Turkish and Persian knots, kilim, soumak, sides and ends, drawn' },
          { href: '/marks/rugs/labels', label: 'Labels and import rules', note: 'Made in Persia, Made in Iran, brands, embargo years' },
          { href: '/marks/rugs/dyes', label: 'Dyes, washes and age', note: 'Natural and synthetic dyes, painted and washed rugs' },
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
  [/^\/marks\/pewabic-pottery/, 'pottery'],
  [/^\/marks\/indian/, 'india'],
  [/-signature$|^\/signatures/, 'signatures'],
  [/^\/marks\/(british|american)-silver-makers\/|^\/marks\/american-silver-date-marks\/|^\/marks\/continental-silver-marks\//, 'silver'],
  [/-date-letters$/, 'silver'],
  [/^\/marks\/tiffany-windows(\/|$)/, 'glass'],
  [/^\/marks\/rugs(\/|$)/, 'rugs'],
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
