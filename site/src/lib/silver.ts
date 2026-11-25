// The silver explorer's data, from the reference collection (the records the
// Advisor reads): purity marks and words, British hallmarks (not the date
// letters, which have their own sheets), American plate makers, Gorham (with its
// year marks), France and Christofle, Russia and Mexico. Each mark says what it
// tells about the metal only where its own text says so (METAL, below).
import { collection } from './portal';
import { soften } from './site';

export type Metal = string;
export type SMark = {
  id: string; group: string; kind: string; name: string; looks: string; means: string; applied: string; maker: string | null;
  from: number | null; to: number | null; note: string | null; metal: Metal | null; year: boolean; sheet: string | null;
  img: { file: string; status: string; credit: string; url: string | null } | null;
  sources: { citation: string; url: string | null; where: string | null }[]; disagree: { says: string; who: string }[]; single: boolean; words: string;
};
export type SGroup = { key: string; label: string; page: string | null; count: number };

// What each mark says about the metal, read from its own "means" text:
// silver = it states a silver standard or says sterling / solid silver;
// plate = it says plated, plate grade or electroplate, or "not sterling";
// none = it says the alloy has no silver in it. Marks that only name a maker,
// a town or a year are left out: they say nothing about the metal.
const METAL: Record<string, 'silver' | 'plate' | 'none'> = {
  'lion-passant-guardant': 'silver', 'lion-passant': 'silver', 'britannia-figure': 'silver', 'lions-head-erased': 'silver',
  'silver-fineness-925': 'silver', 'silver-fineness-800': 'silver', 'silver-fineness-900': 'silver', 'sterling-word-us': 'silver',
  'coin-word-us': 'silver', 'pure-coin-word-us': 'silver', 'standard-word-us': 'silver', 'german-crescent-and-crown': 'silver',
  'russia-84-zolotnik': 'silver', 'russia-88-zolotnik': 'silver', 'russia-91-zolotnik': 'silver', 'soviet-star-silver': 'silver',
  'france-minerva-first-standard': 'silver', 'france-minerva-second-standard': 'silver', 'france-boar-head': 'silver', 'france-crab': 'silver',
  'gorham-lion-passant': 'silver', 'gorham-martele-950-1000-fine': 'silver', 'gorham-martele-9584': 'silver', 'mexico-eagle-assay-mark': 'silver',
  'plate-1847-rogers-bros-sterling': 'silver', 'plate-oneida-community-sterling': 'silver', 'plate-heirloom-sterling': 'silver', 'plate-international-sterling': 'silver',
  'plate-1847-rogers-bros': 'plate', 'plate-grade-a1': 'plate', 'plate-grade-xii': 'plate', 'plate-grade-triple': 'plate', 'plate-wm-rogers-and-son': 'plate',
  'plate-he-sterling-inlaid': 'plate', 'plate-he-xiv': 'plate', 'plate-he-deep-silver': 'plate', 'plate-community-plate': 'plate',
  'plate-oneida-reliance': 'plate', 'plate-oneida-tudor-plate': 'plate', 'plate-oneida-par-plate': 'plate', 'plate-international-s-co': 'plate',
  'epns-mark': 'plate', 'france-plate-square-mark': 'plate', 'christofle-knight-quality-mark': 'plate', 'gallia-cockerel': 'plate',
  'christofle-silver-weight-figures': 'plate', 'gorham-electroplate-anchor': 'plate',
  'nickel-silver-word': 'none', 'alp-nickel-silver': 'none', 'german-silver-word': 'none', 'mexico-alpaca': 'none',
};
// The date-letter sheet a British town mark sends you to.
const SHEET: [RegExp, string][] = [[/^leopards-head/, '/marks/london-date-letters'], [/^birmingham/, '/marks/birmingham-date-letters'], [/^sheffield/, '/marks/sheffield-date-letters'], [/^chester/, '/marks/chester-date-letters']];

const GROUPS: [string, string, (r: { family: string; page_path: string }) => boolean][] = [
  ['standards', 'Silver, plate or neither', (r) => r.family === 'silver-standards'],
  ['british', 'British hallmarks', (r) => r.family === 'british-hallmarks'],
  ['plate', 'American silver plate', (r) => r.family === 'silver-plate'],
  ['gorham', 'Gorham', (r) => r.page_path === '/marks/gorham-silver-marks'],
  ['france', 'France and Christofle', (r) => r.page_path === '/marks/french-silver-marks' || r.page_path === '/marks/christofle-marks'],
  ['russia', 'Russia', (r) => r.page_path === '/marks/russian-silver-marks'],
  ['mexico', 'Mexico', (r) => r.page_path === '/marks/mexican-silver-marks'],
];
const PAGES: Record<string, string> = {
  standards: '/marks/is-it-real-silver', british: '/silver-hallmarks', plate: '/marks/1847-rogers-bros', gorham: '/marks/gorham-silver-marks',
  france: '/marks/french-silver-marks', russia: '/marks/russian-silver-marks', mexico: '/marks/mexican-silver-marks',
};

const tidy = (s: string | null | undefined) =>
  soften(String(s ?? '').replace(/\s+([.,;:)])/g, '$1').replace(/\s{2,}/g, ' ').replace(/\bnot verified\b/g, 'not confirmed').replace(/\banything\b/g, 'any item').trim());
const short = (citation: string) => {
  const year = /\((\d{4})\)\s*$/.exec(citation)?.[1];
  const who = citation.split(',')[0].trim();
  return year ? `${who} (${year})` : who;
};
export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\./g, '');

type Rec = ReturnType<typeof collection>['records'][number];
type Img = ReturnType<typeof collection>['images'][number];
type Src = ReturnType<typeof collection>['sources'][number];
/** One record as the metal explorer shows it. */
export function toMark(r: Rec, group: string, metal: string | null, img: Map<string, Img>, src: Map<string, Src>): SMark {
  const i = r.image_id ? img.get(r.image_id) : null;
  const looks = tidy(r.looks_like), means = tidy(r.summary);
  return {
    id: r.id, group, kind: r.kind, name: r.name, looks, means, applied: String(r.attributes.applied ?? ''),
    maker: r.maker && /maker|trademark/.test(r.kind) ? r.maker : null,
    from: r.date_from ?? null, to: r.date_to ?? null, note: r.date_note ? tidy(r.date_note) : null,
    metal, year: /date (letter|code)/.test(r.kind), sheet: SHEET.find(([re]) => re.test(r.id))?.[1] ?? null,
    img: i && i.file ? { file: i.file, status: i.status, credit: i.credit ?? '', url: i.source_url ?? null } : null,
    sources: r.sources.map((s) => { const x = src.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter((x): x is NonNullable<typeof x> => !!x),
    disagree: (Array.isArray(r.attributes.disagreements) ? r.attributes.disagreements : [])
      .map((d: any) => ({ says: tidy(d.says), who: src.get(d.source) ? short(src.get(d.source)!.citation) : '' }))
      .filter((d: { says: string }) => d.says),
    single: !!r.single_source,
    words: norm([r.name, looks, means, r.maker ?? '', ...r.keys].join(' ')),
  };
}

export function silver(): { groups: SGroup[]; marks: SMark[] } {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const marks: SMark[] = [];
  for (const r of c.records) {
    if (!['silver-standards', 'british-hallmarks', 'silver-plate', 'world-silver'].includes(r.family)) continue;
    if (r.family === 'british-hallmarks' && (r.kind === 'date letter' || r.kind === 'dating rule')) continue;
    const g = GROUPS.find(([, , test]) => test(r));
    if (!g) continue;
    marks.push(toMark(r, g[0], METAL[r.id] ?? null, img, src));
  }
  const order = new Map(GROUPS.map(([k], i) => [k, i]));
  marks.sort((a, b) => order.get(a.group)! - order.get(b.group)! || Number(a.year) - Number(b.year) || (a.from ?? 0) - (b.from ?? 0) || a.name.localeCompare(b.name));
  const groups = GROUPS.map(([key, label]) => ({ key, label, page: PAGES[key] ?? null, count: marks.filter((m) => m.group === key && !m.year).length }));
  return { groups, marks };
}
