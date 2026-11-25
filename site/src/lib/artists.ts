// The artist signature pages' data, from the reference collection (family
// signatures): each artist with their dated examples, cut from museum
// photographs, and the facts about how they signed with their sources.
// Ported from scripts/pages/p_artist_sigs.py so each page says what the
// generated one did.
import { collection } from './portal';

const US: [string, string][] = [['watercolours', 'watercolors'], ['watercolour', 'watercolor'], ['colours', 'colors'], ['colour', 'color'], ['grey', 'gray'], ['Grey', 'Gray'],
  ['centre', 'center'], ['catalogued', 'cataloged'], ['honour', 'honor'], ['favourite', 'favorite']];
/** American spelling for our own words (never for what a signature reads). */
export const us = (s: string) => US.reduce((t, [a, b]) => t.split(a).join(b), s);

export type Example = {
  id: string; year: number; label: string; age: number | null; reads: string; position: string; form: string; medium: string; note: string;
  file: string; w: number | null; h: number | null; work: string; museum: string; url: string | null; cc0: boolean;
};
export type Artist = {
  id: string; name: string; slug: string; born: number; died: number; nationality: string;
  facts: { text: string; source: string; source_name: string }[]; examples: Example[];
};

export function artists(): Artist[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const kids = new Map<string, typeof c.records>();
  for (const r of c.records) if (r.kind === 'signature example' && r.parent_id) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  return c.records
    .filter((r) => r.family === 'signatures' && r.kind === 'artist')
    .map((r): Artist => {
      const a = r.attributes;
      const examples = (kids.get(r.id) ?? []).map((k): Example => {
        const s = k.attributes, i = k.image_id ? img.get(k.image_id) : undefined;
        return {
          id: k.id, year: k.date_from ?? 0, label: String(s.year_label ?? k.date_from ?? ''), age: s.age ?? null, reads: String(s.reads ?? ''),
          position: us(String(s.position ?? '')), form: us(String(s.form ?? '')), medium: us(String(s.medium ?? '')), note: us(String(s.note ?? '')),
          file: i?.file ?? '', w: s.w ?? null, h: s.h ?? null, work: i?.object ?? '', museum: i?.holder ?? '', url: i?.source_url ?? null,
          cc0: /CC0/.test(i?.licence ?? ''),
        };
      }).sort((x, y) => x.year - y.year || x.work.localeCompare(y.work));
      return {
        id: r.id, name: r.name, slug: r.page_path.replace(/^\/marks\//, '').replace(/-signature$/, ''), born: r.date_from ?? 0, died: r.date_to ?? 0,
        nationality: String(a.nationality ?? r.country ?? ''), facts: (Array.isArray(a.facts) ? a.facts : []).map((f: any) => ({ ...f, text: us(String(f.text)) })), examples,
      };
    })
    // A page shows a signature over time: at least three examples, from at least two years (p_artist_sigs.py MIN_ITEMS).
    .filter((a) => a.examples.length >= 3 && new Set(a.examples.map((e) => e.year)).size >= 2);
}
