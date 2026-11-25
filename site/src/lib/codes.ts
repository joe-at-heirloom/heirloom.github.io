// The pottery date-code reader's data, from the reference collection (the
// records the Advisor reads): the five factories' codes, each record one
// letter, figure, sign or count with the year it gives. Each is read here into
// what the reader needs: which part of the code it is (series), the letter or
// numeral it shows (key), and the count of dots or flames (n).
import { collection } from './portal';
import { soften } from './site';

export type Code = {
  id: string; maker: string; kind: string; name: string; looks: string; means: string; applied: string; note: string | null;
  from: number | null; to: number | null; img: { file: string; status: string; credit: string; url: string | null } | null;
  sources: { citation: string; url: string | null; where: string | null }[]; disagree: { says: string; who: string }[]; single: boolean;
  series: string; key: string | null; n: number | null; confused: number[];
};
export type CodeMaker = { key: string; label: string; page: string; from: number; to: number; codes: Code[]; series: string[] };

const MAKERS: [string, string, RegExp][] = [
  ['wedgwood', 'Wedgwood', /^wedgwood-/],
  ['minton', 'Minton', /^minton-/],
  ['worcester', 'Royal Worcester', /^royal-worcester-/],
  ['rookwood', 'Rookwood', /^rookwood-/],
  ['sevres', 'Sèvres', /^(sevres|vincennes)-/],
];
const tidy = (s: string | null | undefined) =>
  soften(String(s ?? '').replace(/\s+([.,;:)])/g, '$1').replace(/\s{2,}/g, ' ').replace(/\bnot verified\b/g, 'not confirmed').trim());
const short = (citation: string) => {
  const year = /\((\d{4})\)\s*$/.exec(citation)?.[1];
  const who = citation.split(',')[0].trim();
  return year ? `${who} (${year})` : who;
};

/** Which part of the code a record is, read from its id and name. */
function read(maker: string, id: string, name: string): Pick<Code, 'series' | 'key' | 'n'> {
  let m: RegExpExecArray | null;
  if (maker === 'wedgwood') {
    if ((m = /^wedgwood-month-([a-z])-/.exec(id))) return { series: 'month', key: m[1].toUpperCase(), n: null };
    if ((m = /^wedgwood-code-prefix-(\d)/.exec(id))) return { series: 'month', key: m[1], n: null };
    if ((m = /^wedgwood-year-([a-z])-/.exec(id))) return { series: 'year', key: m[1].toUpperCase(), n: null };
    if (id === 'wedgwood-england') return { series: 'mark', key: 'england', n: null };
    if (id === 'wedgwood-made-in-england') return { series: 'mark', key: 'made', n: null };
    return { series: 'mark', key: null, n: null };
  }
  if (maker === 'minton') {
    if (/^minton-cypher-/.test(id)) return { series: 'cypher', key: null, n: null };
    return { series: 'mark', key: /mintons/.test(id) ? 'mintons' : 'minton', n: null };
  }
  if (maker === 'worcester') {
    const dots = Number(/(\d+) dots?\b/.exec(name)?.[1] ?? 0);
    if ((m = /^(\d\d) below the mark/.exec(name))) return { series: 'figures', key: m[1], n: null };
    if ((m = /^Letter (\w) below the mark/.exec(name))) return { series: 'letter', key: m[1], n: null };
    if (/round the circle, no dots/.test(name) || /^\d+ dots?:/.test(name)) return { series: 'dots', key: 'none', n: dots };
    if (/^Star/.test(name)) return { series: 'star', key: 'star', n: dots };
    if (/^Open square/.test(name)) return { series: 'sign', key: 'square', n: 0 };
    if (/^Open diamond/.test(name)) return { series: 'sign', key: 'diamond', n: 0 };
    if (/^Division sign/.test(name)) return { series: 'sign', key: 'division', n: 0 };
    if (/^Two linked circles/.test(name)) return { series: 'sign', key: 'circles2', n: 0 };
    if (/^Three linked circles/.test(name)) return { series: 'circles', key: 'circles3', n: dots };
    if (/^1942 to 1948/.test(name)) return { series: 'circles', key: 'circles3', n: null };
    if (/^W \(or R in a circle\)/.test(name)) return { series: 'w', key: 'w', n: dots };
    return { series: 'mark', key: null, n: null };
  }
  if (maker === 'rookwood') {
    if ((m = /^rookwood-rp-(\d+)-flames/.exec(id))) return { series: 'flames', key: null, n: Number(m[1]) };
    if ((m = /^rookwood-numeral-([ivxl]+)-/.exec(id))) return { series: 'numeral', key: m[1].toUpperCase(), n: 14 };
    return { series: 'other', key: null, n: null };
  }
  if ((m = /^sevres-letter-([a-z]+)$/.exec(id))) return { series: m[1].length > 1 ? 'double' : 'letter', key: m[1].toUpperCase(), n: null };
  return { series: 'mark', key: null, n: null };
}

const ORDER: Record<string, string[]> = {
  wedgwood: ['month', 'year', 'mark'],
  minton: ['cypher', 'mark'],
  worcester: ['figures', 'letter', 'dots', 'star', 'sign', 'circles', 'w', 'mark'],
  rookwood: ['other', 'flames', 'numeral'],
  sevres: ['letter', 'double', 'mark'],
};

export function codeMakers(): CodeMaker[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const rows = c.records.filter((r) => r.family === 'pottery-codes');
  return MAKERS.map(([key, label, re]) => {
    const codes: Code[] = rows
      .filter((r) => re.test(r.id))
      .map((r) => {
        const i = r.image_id ? img.get(r.image_id) : null;
        const means = tidy(r.summary);
        const conf = /confused with ([\d,\sand]+)/.exec(means)?.[1] ?? '';
        return {
          id: r.id, maker: label, kind: r.kind, name: r.name, looks: tidy(r.looks_like), means, applied: String(r.attributes.applied ?? ''),
          note: r.date_note ? tidy(r.date_note) : null, from: r.date_from ?? null, to: r.date_to ?? null,
          img: i && i.file ? { file: i.file, status: i.status, credit: i.credit ?? '', url: i.source_url ?? null } : null,
          sources: r.sources.map((s) => { const x = src.get(s.id); return x ? { citation: x.citation, url: x.url ?? null, where: s.where ?? null } : null; }).filter((x): x is NonNullable<typeof x> => !!x),
          disagree: (Array.isArray(r.attributes.disagreements) ? r.attributes.disagreements : [])
            .map((d: any) => ({ says: tidy(d.says), who: src.get(d.source) ? short(src.get(d.source)!.citation) : '' }))
            .filter((d: { says: string }) => d.says),
          single: !!r.single_source,
          confused: [...conf.matchAll(/\d{4}/g)].map((x) => Number(x[0])),
          ...read(key, r.id, r.name),
        };
      });
    const order = ORDER[key];
    codes.sort((a, b) => order.indexOf(a.series) - order.indexOf(b.series) || (a.from ?? 0) - (b.from ?? 0) || a.name.localeCompare(b.name));
    const dated = codes.filter((x) => x.series !== 'mark' && x.from);
    const page = rows.find((r) => re.test(r.id))!.page_path;
    return {
      key, label, page, codes, series: order.filter((s) => codes.some((x) => x.series === s)),
      from: Math.min(...dated.map((x) => x.from!)), to: Math.max(...dated.map((x) => x.to ?? x.from!)),
    };
  });
}
