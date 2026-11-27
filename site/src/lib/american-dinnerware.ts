// American dinnerware and art pottery makers' marks: the firms and their marks
// as the reference collection holds them (the app's marks/american-dinnerware.json
// and marks/american-art-pottery.json, read from Lehner 1988 in
// hallmark-sources/american-dinnerware and american-art-pottery). Each firm has a
// page at <hub>/<firm>; each hub lists its firms, the dinnerware hub with the
// general rules for dating an American backstamp. Same shapes as
// lib/staffordshire.ts, so the pages share its styles and the Catalogue.
import { collection, type Rec } from './portal';
import { sheet, clean, type Sheet } from './records';
import { media } from './media';

export const HUB = '/marks/american-dinnerware-marks/';
export const ART_HUB = '/marks/american-art-pottery-marks/';
export const JX_HUB = '/marks/japanese-export-porcelain-marks/';
export const GP_HUB = '/marks/german-porcelain-marks/';
export const BP_HUB = '/marks/british-pottery-marks/';
/** The sets: their firm records are maker-<set>-<key>, their marks <prefix><key>-<no>; `wrote` is the year
 * the book was written, where a bar for a mark still in use ends; `book` names the book's number for a mark. */
export type SetId = 'american-dinnerware' | 'american-art-pottery' | 'japanese-export' | 'german-porcelain' | 'british-pottery';
const SETS: Record<SetId, { hub: string; marks: string; wrote: number; book: string }> = {
  'american-dinnerware': { hub: HUB, marks: 'amd-', wrote: 1988, book: 'Lehner' },
  'american-art-pottery': { hub: ART_HUB, marks: 'aap-', wrote: 1988, book: 'Lehner' },
  'japanese-export': { hub: JX_HUB, marks: 'jxp-', wrote: 1997, book: 'Van Patten' },
  'german-porcelain': { hub: GP_HUB, marks: 'gpm-', wrote: 1980, book: 'Röntgen' },
  'british-pottery': { hub: BP_HUB, marks: 'gbm-', wrote: 1964, book: 'Godden' },
};

export type DatingRule = { what: string; text: string; page: string | null };
export type FirmEntry = { name: string; place: string | null; dates: string | null; from: number | null; to: number | null; wares: string | null; history: string | null; pages: string[]; marks: string[]; dating_rules: DatingRule[] };
export type Firm = { set: SetId; hub: string; key: string; slug: string; title: string; where: string; page: string; entries: FirmEntry[]; from: number | null; to: number | null; marks: Rec[]; pictured: number; thumb: string | null; summary: string | null; rules: DatingRule[] };

const cache = new Map<SetId, Firm[]>();
export function firms(set: SetId = 'american-dinnerware'): Firm[] {
  const hit = cache.get(set);
  if (hit) return hit;
  const PREFIX = `maker-${set}-`;
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i.file]));
  const histories = c.records.filter((r) => r.family === 'ceramics-makers' && r.kind === 'maker history' && r.id.startsWith(PREFIX));
  const marks = c.records.filter((r) => r.family === 'ceramics-makers' && r.kind !== 'maker history' && r.id.startsWith(SETS[set].marks));
  const byFirm = new Map<string, Rec[]>();
  for (const m of marks) { const k = String(m.attributes?.firm ?? ''); byFirm.set(k, [...(byFirm.get(k) ?? []), m]); }
  const out = histories.map((h): Firm => {
    const key = h.id.slice(PREFIX.length);
    const ms = (byFirm.get(key) ?? []).slice().sort((a, b) => (a.date_from ?? 2100) - (b.date_from ?? 2100) || num(a) - num(b));
    const entries: FirmEntry[] = (h.attributes?.entries ?? []).map((e: FirmEntry) => ({ ...e, dating_rules: e.dating_rules ?? [] }));
    const ends = entries.map((e) => e.to);
    const firstPic = ms.find((m) => m.image_id);
    return {
      set, hub: SETS[set].hub, key, slug: key, title: h.maker ?? h.name.replace(/ marks$/, ''), where: String(h.attributes?.where ?? h.place ?? ''), page: h.page_path, entries,
      from: h.date_from ?? null, to: ends.length && ends.every((e) => typeof e === 'number') ? Math.max(...(ends as number[])) : null,
      marks: ms, pictured: ms.filter((m) => m.image_id).length,
      thumb: firstPic?.image_id ? img.get(firstPic.image_id) ?? null : null, summary: clean(h.summary),
      rules: entries.flatMap((e) => e.dating_rules),
    };
  });
  cache.set(set, out);
  return out;
}
const num = (r: Rec) => Number(String(r.attributes?.lehner_no ?? r.attributes?.book_no ?? '').replace(/\D.*$/, '')) || 0;
export const firmBySlug = (slug: string, set: SetId = 'american-dinnerware') => firms(set).find((f) => f.slug === slug) ?? null;
/** A decorator's or artist's mark (art pottery), not the pottery's own. */
export const isArtist = (r: Rec) => !!r.attributes?.artist;

/** A firm's marks grouped by the Lehner entry (the firm under that name, with its years) they belong to;
 * an entry's decorators' marks, where it has them, follow as a group of their own. */
export function markGroups(f: Firm): { key: string; label: string; blurb: string; sheets: Sheet[] }[] {
  const byId = new Map(f.marks.map((m) => [m.id, m]));
  const groups = f.entries.filter((e) => e.marks.length).flatMap((e, i) => {
    // In the entry's order (Lehner's numbers), then by date inside the catalogue's own sort.
    const recs = e.marks.map((id) => byId.get(id)).filter((r): r is Rec => !!r);
    const own = recs.filter((r) => !isArtist(r)), artists = recs.filter(isArtist);
    return [
      { key: `e${i}`, label: e.name + (e.dates ? `, ${e.dates}` : ''), blurb: [e.place, e.wares].filter(Boolean).join('. ').replace(/\.\./g, '.'), sheets: own.map((r) => markSheet(r, `e${i}`)) },
      { key: `e${i}d`, label: `${e.name}: decorators’ marks`, blurb: 'The monograms and signatures of the decorators and artists, as Lehner gives them, with their years at the pottery where she has them.', sheets: artists.map((r) => markSheet(r, `e${i}d`)) },
    ];
  });
  return groups.filter((g) => g.sheets.length);
}

export function markSheet(r: Rec, group: string): Sheet {
  const s = sheet(r, group);
  const a = r.attributes ?? {};
  s.kind = a.handwritten || r.kind === 'signature' ? 'Signature' : 'Mark';
  s.facts = [
    ...(a.artist ? [{ label: 'Decorator', text: String(a.artist) }] : []),
    ...(a.reads ? [{ label: 'It reads', text: String(a.reads).replace(/\s*\/\s*/g, ' / ') }] : []),
    ...(a.line ? [{ label: 'Line', text: String(a.line) }] : []),
    ...(a.made_for ? [{ label: 'Made for', text: String(a.made_for) }] : []),
    ...s.facts.filter((x) => x.label !== 'Place'),
    ...(a.lehner_no ? [{ label: 'Lehner number', text: `${a.lehner_no} in the firm's entry` }] : []),
    ...(a.book_no ? [{ label: `${a.book_name ?? 'Book'} number`, text: String(a.book_no) }] : []),
  ];
  s.keys = [s.keys, String(a.artist ?? '').toLowerCase(), String(a.reads ?? '').toLowerCase(), String(a.line ?? '').toLowerCase(), String(a.made_for ?? '').toLowerCase()].join(' ');
  return s;
}

/** The dating key's bars: every dated mark of a firm on one time line (the pottery's own marks, or, with
 * artists, its decorators' years). Lehner wrote in 1986-88. */
export const WROTE = 1988;
export function bars(f: Firm, artists = false) {
  const c = collection(); const img = new Map(c.images.map((i) => [i.id, i.file]));
  return f.marks.filter((r) => r.date_from != null && isArtist(r) === artists).map((r) => ({
    id: r.id, name: r.name, from: r.date_from as number, to: r.date_to ?? (r.attributes?.and_later || r.date_to == null ? SETS[f.set].wrote : r.date_from as number),
    open: r.date_to == null, circa: !!r.attributes?.circa, img: r.image_id ? img.get(r.image_id) ?? null : null,
  })).sort((a, b) => a.from - b.from || a.to - b.to);
}

export const thumbUrl = (file: string | null) => (file ? media(file) : null);

/**
 * Words on an American backstamp that date it, whatever the firm. Each rests on
 * the law or the Post Office that made it, so each gives a "not before".
 */
export const RULES: { mark: string; says: string; why: string; cite: string }[] = [
  { mark: '®', says: 'Made in or after 1947', why: 'The circled R became the notice of a federally registered trademark with the Lanham Act of 1946, in force from July 1947. Before it, firms printed “Reg. U.S. Pat. Off.”, and many went on doing so.', cite: 'Trademark Act of 1946, 60 Stat. 427, § 29; 15 U.S.C. § 1111' },
  { mark: 'Reg. U.S. Pat. & Tm. Off.', says: 'Made in or after 1975', why: 'The Patent Office was renamed the Patent and Trademark Office on January 2, 1975. The older “Reg. U.S. Pat. Off.” wording does not date a piece by itself: it was used before and after.', cite: 'Public Law 93-596, 88 Stat. 1949 (1975); 35 U.S.C. § 1' },
  { mark: 'A five-digit ZIP code in the address', says: 'Made in or after 1963', why: 'The Post Office introduced ZIP codes on July 1, 1963. Firms added them to their marks over the following years, so a mark without one can still be later.', cite: 'United States Postal Service, Postal History: ZIP Code; Smithsonian National Postal Museum' },
  { mark: 'A two-letter state (OH, WV, CA)', says: 'Made in or after 1963', why: 'The two-letter state abbreviations were issued in October 1963, for use with ZIP codes. Before that a mark spells the state out or abbreviates it the old way (O., W. Va., Calif.).', cite: 'United States Postal Service, Postal History: State Abbreviations' },
];
