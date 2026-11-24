// The marks database and the app's tables, typed for the pages.
// Everything here is read at build time from src/data (npm run data:sync).
import hallmarks from '../data/app/hallmarks.json';
import sourcesFile from '../data/app/marks/sources.json';

export type Visual = {
  status: 'photo' | 'facsimile' | 'rendering' | 'none';
  file?: string;
  credit?: string;
  holder?: string;
  licence?: string;
  source_url?: string;
  object?: string;
  method?: string;
};
export type MarkEntry = {
  id: string;
  group: string;
  office?: string;
  maker?: string;
  country?: string;
  kind: string;
  name: string;
  looks_like?: string;
  means?: string;
  date_from?: number | null;
  date_to?: number | null;
  date_note?: string;
  series?: string;
  sources?: { id: string; where?: string }[];
  disagreements?: unknown[];
  visual: Visual;
  pages?: string[];
};

const groupFiles = import.meta.glob<{ entries?: MarkEntry[]; sources?: Record<string, Source> }>('../data/app/marks/*.json', { eager: true, import: 'default' });

export type Source = { name?: string; title?: string; url?: string; author?: string; year?: number | string; notes?: string };
export const SOURCES: Record<string, Source> = { ...((sourcesFile as any).sources ?? sourcesFile) };
export const ENTRIES: MarkEntry[] = [];
for (const [path, file] of Object.entries(groupFiles)) {
  if (path.endsWith('sources.json') || path.endsWith('coverage.json')) continue;
  Object.assign(SOURCES, file.sources ?? {});
  ENTRIES.push(...(file.entries ?? []));
}
export const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));

export const VISUAL_LABEL: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };
export const img = (e?: MarkEntry) => (e && e.visual.status !== 'none' && e.visual.file ? '/' + e.visual.file : null);

// ── British date letters ─────────────────────────────────────────────────────
export type Office = 'London' | 'Birmingham' | 'Sheffield' | 'Chester';
export type DLRow = {
  office: Office;
  letter: string;
  case: 'upper' | 'lower' | 'either';
  style: string;
  year: number;
  year_label?: string;
  cycle_start: number;
  alt_year?: number;
  alt_year_source?: string;
  confidence?: string;
  sources: string[];
  note?: string;
};
export const HALLMARKS = hallmarks as unknown as {
  title: string;
  sources: { key: string; name: string; url?: string; notes?: string }[];
  caveats: string[];
  rules: { id: string; applies_to: string[]; from_year: number; to_year: number | null; fact: string; narrows?: string }[];
  rows: DLRow[];
};

export const OFFICES: { office: Office; slug: string; town: string; span: string }[] = [
  { office: 'London', slug: 'london', town: "Leopard's head", span: '1678–2000' },
  { office: 'Birmingham', slug: 'birmingham', town: 'Anchor', span: '1773–2000' },
  { office: 'Sheffield', slug: 'sheffield', town: 'Crown, then rose', span: '1773–2000' },
  { office: 'Chester', slug: 'chester', town: 'Three wheatsheaves and a sword', span: '1701–1962' },
];

export const STYLE_WORD: Record<string, string> = {
  roman: 'Roman',
  gothic: 'Old English',
  court_hand: 'Court hand',
  italic: 'Italic',
  script: 'Script',
  block: 'Block',
};
export const CASE_WORD: Record<string, string> = { upper: 'capital', lower: 'small', either: 'capital or small' };

export function letterEntry(r: DLRow) {
  return BY_ID.get(`${r.office.toLowerCase()}-${r.year}-${r.letter.toLowerCase()}`);
}

export function rulesFor(office: Office, year: number) {
  return HALLMARKS.rules.filter(
    (r) =>
      (r.applies_to.includes(office) || r.applies_to.includes('all')) &&
      r.from_year <= year &&
      (r.to_year == null || r.to_year >= year) &&
      r.id !== 'town_marks' &&
      r.id !== 'office_dates',
  );
}

export function cyclesOf(office: Office) {
  const rows = HALLMARKS.rows.filter((r) => r.office === office).sort((a, b) => a.year - b.year || a.letter.localeCompare(b.letter));
  const map = new Map<number, DLRow[]>();
  for (const r of rows) {
    if (!map.has(r.cycle_start)) map.set(r.cycle_start, []);
    map.get(r.cycle_start)!.push(r);
  }
  return [...map.entries()].map(([start, rs]) => {
    const styles = [...new Set(rs.map((r) => STYLE_WORD[r.style]))];
    const cases = [...new Set(rs.map((r) => r.case))];
    const caseWord = cases.length === 1 ? (cases[0] === 'upper' ? 'capitals' : cases[0] === 'lower' ? 'small letters' : 'capitals or small letters') : 'capitals and small letters';
    return { start, end: rs[rs.length - 1].year, rows: rs, label: `${styles.join(' and ')} ${caseWord}` };
  });
}

export function sourceName(key: string) {
  const s = HALLMARKS.sources.find((x) => x.key === key) ?? (SOURCES[key] as any);
  return s?.name ?? s?.title ?? key;
}
