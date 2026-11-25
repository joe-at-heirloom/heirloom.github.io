// The catalogues whose record sheets load on demand: each catalogue page
// carries its rows (what a reader scans and searches), and the sheets of a
// group come from one small companion file, /marks/data/sheets/<chunk>.html
// (pages/marks/data/sheets/[chunk].astro), fetched the first time a row of
// that group is opened. The page and its companion files build their sheets
// from the same functions here, so they always agree.
import { marks, GROUPS as JA_GROUPS } from './japanese';
import { inscriptions, GROUPS as KO_GROUPS } from './korean';
import { jaSheet, koSheet, type Sheet } from './records';
import { allPlaces, makerGroups, type Place } from './makers-dir';

export type Group = { key: string; label: string; blurb?: string; sheets: Sheet[] };

let ja: Group[] | null = null;
export function japaneseGroups(): Group[] {
  if (ja) return ja;
  const sheets = marks().map(jaSheet);
  return (ja = JA_GROUPS.map((g) => ({ key: g.id, label: g.name, sheets: sheets.filter((x) => x.group === g.id) })).filter((g) => g.sheets.length));
}
let ko: Group[] | null = null;
export function koreanGroups(): Group[] {
  if (ko) return ko;
  const sheets = inscriptions().map(koSheet);
  return (ko = KO_GROUPS.map((g) => ({ key: g.id, label: g.name, blurb: g.blurb, sheets: sheets.filter((x) => x.group === g.id) })).filter((g) => g.sheets.length));
}
const places = new Map<string, Group[]>();
/** One directory place's groups (lib/makers-dir.ts), built once for the page and its companion files. */
export function placeGroups(p: Place): Group[] {
  const k = `${p.dir}-${p.slug}`;
  const got = places.get(k);
  if (got) return got;
  const g = makerGroups(p);
  places.set(k, g);
  return g;
}

/** Every companion file: its name (catalogue--group) and its sheets. */
export function sheetChunks(): { chunk: string; sheets: Sheet[] }[] {
  const out: { chunk: string; sheets: Sheet[] }[] = [];
  for (const g of japaneseGroups()) out.push({ chunk: `japanese--${g.key}`, sheets: g.sheets });
  for (const g of koreanGroups()) out.push({ chunk: `korean--${g.key}`, sheets: g.sheets });
  for (const p of allPlaces()) for (const g of placeGroups(p)) out.push({ chunk: `${p.dir}-${p.slug}--${g.key}`, sheets: g.sheets });
  return out;
}
