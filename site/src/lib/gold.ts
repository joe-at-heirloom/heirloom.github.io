// The gold explorer's data (the metal explorer, src/islands/MetalExplorer), from
// the reference collection: fineness numbers and karats, the layered and plated
// golds, British, French, German, Russian and Swiss gold marks. What each mark
// says about the metal is read from its own text (METAL, below).
import { collection } from './portal';
import { toMark, type SMark, type SGroup } from './silver';

// gold = it states a gold standard (a fineness, a karat, an assay or control mark);
// filled = a bonded layer of gold on base metal (GF, RGP); plate = gold put on by
// electrolysis or thinner (GE, HGE, flashed); vermeil = sterling silver coated with gold.
const METAL: Record<string, 'gold' | 'filled' | 'plate' | 'vermeil'> = {
  'gold-filled-gf': 'filled', 'rolled-gold-plate-rgp': 'filled',
  'gold-electroplate': 'plate', 'heavy-gold-electroplate-hge': 'plate', 'gold-flashed-washed': 'plate', vermeil: 'vermeil',
};
const GROUPS: [string, string, RegExp][] = [
  ['numbers', 'Numbers and karats', /^(gold-fineness-|us-karat-)/],
  ['layers', 'Filled, rolled and plated', /^(gold-filled|rolled-gold|gold-electroplate|heavy-gold|vermeil|gold-flashed)/],
  ['british', 'British gold', /^(british-gold-|convention-mark)/],
  ['europe', 'France, Germany and Russia', /^(france-gold-|germany-gold-|soviet-gold-)/],
  ['swiss', 'Swiss watch cases', /^switzerland-/],
];

export function gold(): { groups: SGroup[]; marks: SMark[] } {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const marks: SMark[] = [];
  const pages = new Map<string, string>();
  for (const r of c.records) {
    if (r.family !== 'gold') continue;
    const g = GROUPS.find(([, , re]) => re.test(r.id));
    if (!g) continue;
    if (!pages.has(g[0])) pages.set(g[0], r.page_path);
    marks.push(toMark(r, g[0], METAL[r.id] ?? 'gold', img, src));
  }
  const order = new Map(GROUPS.map(([k], i) => [k, i]));
  marks.sort((a, b) => order.get(a.group)! - order.get(b.group)! || (a.from ?? 0) - (b.from ?? 0) || a.name.localeCompare(b.name, 'en', { numeric: true }));
  const groups = GROUPS.map(([key, label]) => ({ key, label, page: pages.get(key) ?? null, count: marks.filter((m) => m.group === key).length }));
  return { groups, marks };
}
