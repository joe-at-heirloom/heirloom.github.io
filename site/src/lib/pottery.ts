// The pottery and porcelain explorer's data, from the reference collection (the
// records the Advisor reads): each maker's marks with the years they were used,
// what they look like and mean, how they were put on, the image, the sources and
// where the sources disagree; and each maker's history and cautions (copies and
// look-alikes). Grouped by the maker's page, as the app's table groups them.
import { collection } from './portal';
import { soften } from './site';

export type How = 'clay' | 'ink' | 'paint' | 'label';
export const HOW: [How, string, string][] = [
  ['clay', 'Pressed into the clay', 'Impressed, incised or molded: you can feel it with a fingernail'],
  ['ink', 'Printed or stamped in ink', 'Flat, in a color, on or under the glaze'],
  ['paint', 'Painted', 'Painted by hand, often in underglaze blue'],
  ['label', 'A label', 'Paper or foil, stuck on'],
];

export type PMark = {
  id: string; maker: string; firm: string; kind: string; name: string; looks: string; means: string; applied: string; how: How[];
  from: number | null; to: number | null; note: string | null;
  img: { file: string; status: string; credit: string; url: string | null } | null;
  seeAt: unknown;
  sources: { citation: string; url: string | null; where: string | null }[];
  disagree: { says: string; who: string }[]; single: boolean; words: string;
};
export type PMaker = { key: string; label: string; page: string; country: string; summary: string; cautions: string[]; from: number; to: number; count: number };

// Citation markers were taken out of the prose and left a space before the stop.
// "Verified" is a word the site keeps for nothing (scripts/check-copy.mjs); a date not verified is not confirmed.
const tidy = (s: string | null | undefined) => soften(String(s ?? '').replace(/\s+([.,;:)])/g, '$1').replace(/\s{2,}/g, ' ').replace(/\bnot verified\b/g, 'not confirmed').trim());
const NOW = new Date().getFullYear();
/** How words are compared: lower case, no accents, no full stops (U.S.A. is usa). */
export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\./g, '');

function howOf(applied: string): How[] {
  const a = applied.toLowerCase();
  const out: How[] = [];
  if (/impress|incis|mold|ground|cut/.test(a)) out.push('clay');
  if (/print|stamp|ink/.test(a)) out.push('ink');
  if (/paint/.test(a)) out.push('paint');
  if (/label|disc/.test(a)) out.push('label');
  return out;
}
const short = (citation: string) => {
  const year = /\((\d{4})\)\s*$/.exec(citation)?.[1];
  const who = citation.split(',')[0].trim();
  return year ? `${who} (${year})` : who;
};

export function pottery(): { makers: PMaker[]; marks: PMark[] } {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const rows = c.records.filter((r) => r.family === 'ceramics-makers');
  const histories = new Map(rows.filter((r) => r.kind === 'maker history').map((r) => [r.page_path, r]));

  const marks: PMark[] = rows
    .filter((r) => r.kind !== 'maker history' && !r.kind.includes('(described)'))
    .map((r) => {
      const h = histories.get(r.page_path);
      const maker = h ? h.name.replace(/ (pottery )?marks$/i, '') : r.page_path;
      const i = r.image_id ? img.get(r.image_id) : null;
      const applied = String(r.attributes.applied ?? '');
      const looks = tidy(r.looks_like);
      const means = tidy(r.summary);
      return {
        id: r.id, maker, firm: r.maker ?? '', kind: r.kind, name: r.name, looks, means, applied, how: howOf(applied),
        from: r.date_from ?? null, to: r.date_to ?? null, note: r.date_note ? tidy(r.date_note) : null,
        img: i && i.file ? { file: i.file, status: i.status, credit: i.credit ?? '', url: i.source_url ?? null } : null,
        seeAt: r.attributes.see_at ?? null,
        sources: r.sources.map((s) => { const x = src.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter((x): x is NonNullable<typeof x> => !!x),
        disagree: (Array.isArray(r.attributes.disagreements) ? r.attributes.disagreements : [])
          .map((d: any) => ({ says: tidy(d.says), who: src.get(d.source) ? short(src.get(d.source)!.citation) : String(d.source ?? '') }))
          .filter((d: { says: string }) => d.says),
        single: !!r.single_source,
        words: norm([r.name, looks, means, r.maker ?? '', maker, applied, ...r.keys].join(' ')),
      };
    });

  const byMaker = new Map<string, PMark[]>();
  for (const m of marks) (byMaker.get(m.maker) ?? byMaker.set(m.maker, []).get(m.maker)!).push(m);
  const start = (m: PMark) => m.from ?? (m.to !== null ? m.to - 10 : NOW);
  for (const list of byMaker.values()) list.sort((a, b) => start(a) - start(b) || (a.to ?? NOW) - (b.to ?? NOW));

  const makers: PMaker[] = [...byMaker.entries()].map(([label, list]) => {
    const h = [...histories.values()].find((x) => x.name.replace(/ (pottery )?marks$/i, '') === label)!;
    return {
      key: h.page_path.replace(/^\/marks\//, '').replace(/-(pottery-)?marks$/, ''), label, page: h.page_path, country: rows.find((r) => r.id === list[0].id)?.country ?? '',
      summary: tidy(h.summary), cautions: (Array.isArray(h.attributes.cautions) ? h.attributes.cautions : []).map(tidy),
      // The first year a mark of theirs is recorded (a mark known only by its last year counts at that year).
      from: Math.min(...list.map((m) => m.from ?? m.to ?? NOW)), to: Math.max(...list.map((m) => m.to ?? NOW)), count: list.length,
    };
  }).sort((a, b) => a.from - b.from || a.label.localeCompare(b.label));
  const order = new Map(makers.map((m, i) => [m.label, i]));
  return { makers, marks: makers.flatMap((mk) => byMaker.get(mk.label)!).sort((a, b) => order.get(a.maker)! - order.get(b.maker)! || 0) };
}

/** Words often on a base, kept only where they pick out a handful of marks. */
export function baseWords(marks: PMark[]): string[] {
  const cands = ['crown', 'swords', 'bee', 'wreath', 'lion', 'circle', 'monogram', 'script', 'U.S.A.', 'England', 'France', 'Limoges', 'Germany', 'Denmark', 'Nippon', 'Japan', 'label', 'number'];
  return cands.filter((w) => {
    const n = marks.filter((m) => new RegExp(`\\b${norm(w)}`).test(m.words)).length;
    return n >= 2 && n <= 40;
  });
}
