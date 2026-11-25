// Staffordshire and other English potters' marks: the firms and their marks as
// the reference collection holds them (the app's marks/staffordshire.json, read
// from Godden 1964 in hallmark-sources/staffordshire). Each firm has a page at
// /marks/staffordshire-pottery-marks/<firm>; the hub lists them all with the
// general rules for dating an English backstamp.
import { collection, type Rec } from './portal';
import { sheet, clean, type Sheet } from './records';
import { media } from './media';

export const HUB = '/marks/staffordshire-pottery-marks/';
export const REG = '/marks/british-registration-marks';

export type FirmEntry = { name: string; works: string | null; town: string | null; dates: string | null; from: number | null; to: number | null; wares: string | null; notes: string | null; pages: string[]; marks: string[] };
export type Firm = { key: string; slug: string; title: string; where: string; page: string; entries: FirmEntry[]; from: number | null; to: number | null; marks: Rec[]; pictured: number; thumb: string | null; summary: string | null };

let cache: Firm[] | null = null;
export function firms(): Firm[] {
  if (cache) return cache;
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i.file]));
  const histories = c.records.filter((r) => r.family === 'ceramics-makers' && r.kind === 'maker history' && r.id.startsWith('maker-staffordshire-'));
  const marks = c.records.filter((r) => r.family === 'ceramics-makers' && r.kind !== 'maker history' && r.id.startsWith('stf-'));
  const byFirm = new Map<string, Rec[]>();
  for (const m of marks) { const k = String(m.attributes?.firm ?? ''); byFirm.set(k, [...(byFirm.get(k) ?? []), m]); }
  cache = histories.map((h) => {
    const key = h.id.replace(/^maker-staffordshire-/, '');
    const ms = (byFirm.get(key) ?? []).slice().sort((a, b) => (a.date_from ?? 2100) - (b.date_from ?? 2100) || num(a) - num(b));
    const entries: FirmEntry[] = h.attributes?.entries ?? [];
    const ends = entries.map((e) => e.to);
    const firstPic = ms.find((m) => m.image_id && m.date_from && m.date_from >= 1880) ?? ms.find((m) => m.image_id);
    return {
      key, slug: key, title: h.maker ?? h.name.replace(/ marks$/, ''), where: String(h.attributes?.where ?? h.place ?? ''), page: h.page_path, entries,
      from: h.date_from ?? null, to: ends.length && ends.every((e) => typeof e === 'number') ? Math.max(...(ends as number[])) : null,
      marks: ms, pictured: ms.filter((m) => m.image_id).length,
      thumb: firstPic?.image_id ? img.get(firstPic.image_id) ?? null : null, summary: clean(h.summary),
    };
  });
  return cache;
}
const num = (r: Rec) => Number(String(r.attributes?.godden_no ?? '').replace(/\D.*$/, '')) || 0;
export const firmBySlug = (slug: string) => firms().find((f) => f.slug === slug) ?? null;

/** A firm's marks grouped by the Godden entry (the firm under that name, with its years) they belong to. */
export function markGroups(f: Firm): { key: string; label: string; blurb: string; sheets: Sheet[] }[] {
  const byId = new Map(f.marks.map((m) => [m.id, m]));
  const groups = f.entries.filter((e) => e.marks.length).map((e, i) => ({
    key: `e${i}`, label: e.name + (e.dates ? `, ${e.dates.replace(/–\s*$/, ' on').replace(/\s*\.$/, '')}` : ''),
    blurb: [e.works, e.wares, e.notes].filter(Boolean).join('. ').replace(/\.\./g, '.'),
    sheets: e.marks.map((id) => byId.get(id)).filter((r): r is Rec => !!r).map((r) => markSheet(r, `e${i}`)),
  }));
  return groups.filter((g) => g.sheets.length);
}

export function markSheet(r: Rec, group: string): Sheet {
  const s = sheet(r, group);
  const a = r.attributes ?? {};
  s.kind = 'Mark';
  s.facts = [
    ...(a.reads ? [{ label: 'It reads', text: String(a.reads).replace(/\s*\/\s*/g, ' / ') }] : []),
    ...s.facts.filter((x) => x.label !== 'Place'),
    ...(a.godden_no ? [{ label: 'Godden number', text: `${a.godden_no} (the number collectors and dealers cite)` }] : []),
  ];
  s.keys = [s.keys, String(a.reads ?? '').toLowerCase(), a.godden_no ? `godden ${a.godden_no}` : ''].join(' ');
  return s;
}

/** The dating key's bars: every dated mark of a firm on one time line. */
export function bars(f: Firm) {
  const c = collection(); const img = new Map(c.images.map((i) => [i.id, i.file]));
  return f.marks.filter((r) => r.date_from != null).map((r) => ({
    id: r.id, name: r.name, from: r.date_from as number, to: r.date_to ?? (r.attributes?.and_later || r.date_to == null ? 1965 : r.date_from as number),
    open: r.date_to == null, circa: !!r.attributes?.circa, img: r.image_id ? img.get(r.image_id) ?? null : null,
  })).sort((a, b) => a.from - b.from || a.to - b.to);
}

export const thumbUrl = (file: string | null) => (file ? media(file) : null);

/**
 * The general rules for dating an English backstamp, as Godden (1964, pp. 1-2) and
 * the Archives' guide give them. Each is a "not before" or a "usually after".
 */
export const RULES: { mark: string; says: string; from: string; why: string; link?: [string, string] }[] = [
  { mark: 'ENGLAND', says: 'Made in or after 1891', from: '1891', why: 'English potters added the country to their marks from 1891, to comply with the American McKinley Tariff Act. A mark without it is not proof of an earlier date.' },
  { mark: 'MADE IN ENGLAND', says: 'A 20th-century piece', from: '1900s', why: 'Godden: the fuller wording signifies a 20th-century date.' },
  { mark: 'Rd No 123456', says: 'The design was registered in or after 1884', from: '1884', why: 'Registered designs were numbered in one run from January 1884. The number dates the registration of the design, so the piece is that old or younger, often by years.', link: ['Read an Rd number', REG] },
  { mark: 'A diamond with letters and numbers', says: 'The design was registered between 1842 and 1883', from: '1842', why: 'The diamond’s corners give the year, month and day the design was registered.', link: ['Read a diamond mark', `${REG}#diamond`] },
  { mark: 'Ltd., Ld. or Limited', says: 'Usually after about 1880', from: '1861', why: 'No Staffordshire pottery became a limited company before 1861 (the Old Hall Earthenware Co., March 1861), and the word was not generally used in marks before the 1880s.' },
  { mark: 'TRADE MARK', says: 'Usually after 1875', from: '1862', why: 'The words follow the Trade-Mark Act of 1862 and normally denote a date after 1875.' },
  { mark: 'BONE CHINA, ENGLISH BONE CHINA', says: 'A 20th-century piece', from: '1900s', why: 'Godden: these words denote a 20th-century date.' },
  { mark: 'A pattern name in the mark', says: 'After about 1810', from: '1810', why: 'Printed marks naming the pattern belong to the 19th century and later.' },
  { mark: 'ROYAL in the firm’s name', says: 'Usually after the mid-19th century', from: 'mid-19th century', why: 'Royal Cauldon, Royal Grafton, Royal Worcester: the word came into potters’ titles and trade names from the middle of the century.' },
  { mark: 'The royal arms', says: 'The 19th century or later', from: '1800s', why: 'Printed marks built on the royal arms are 19th century or later; a clear shield with no small central shield (inescutcheon) is after 1837.' },
  { mark: 'A Staffordshire knot', says: 'Usually after about 1845', from: '1845', why: 'A looped knot with the firm’s initials, much used in the 1870s and 1880s and on into the 20th century. It points to a Staffordshire potter.' },
  { mark: 'Initials with a letter under them', says: 'The town, not part of the firm', from: '', why: 'In marks like F & R over B, the lower letter is the pottery town: Burslem (B), Cobridge (C), Fenton (F), Hanley (H), Longton (L), Tunstall (T).' },
  { mark: 'ESTD. 1770 and similar', says: 'Not the date of the piece', from: '', why: 'A date in a printed mark is usually the year the firm (or its earliest predecessor) claims as its founding, not the year it was made.' },
];
