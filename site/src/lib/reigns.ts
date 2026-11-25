// The Chinese reign-mark explorer's data, from the reference collection (the
// records the Advisor reads): each reign with its marks, its book facsimiles
// and museum photographs, its kiln-site dating facts and its sources.
import { collection, type Rec } from './portal';
import { soften } from './site';
import chineseTable from '../data/app/chinese.json';

export type Fax = { file: string; script: 'regular' | 'seal' | 'other'; count: number; label: string; credit: string };
export type Photo = { file: string; label: string; caption: string; when: 'period' | 'later' | null; credit: string; url: string | null };
export type Fact = { topic: string; text: string; sources: string[] };
export type Reign = {
  id: string; pinyin: string; chars: string; dynasty: string; start: number; end: number; alt: string | null; yearNote: string | null;
  emperor: string | null; spellings: string[]; marks: { chars: string; count: number; script: string; note: string }[];
  summary: string; copies: string | null; singleSource: boolean; fax: Fax[]; photos: Photo[]; facts: Fact[]; sources: { citation: string; url: string | null }[];
  glyphs: string[];
};

const HAN = /[㐀-鿿豈-﫿]/;
const TOPIC: Record<string, string> = {
  mark: 'The mark', excavation: 'What the kiln site shows', apocryphal: 'Marks of other reigns', body: 'Body', glaze: 'Glaze',
  decoration: 'Decoration', forms: 'Forms', series: 'Across the Ming',
};

export function reigns(): Reign[] {
  const c = collection();
  const byId = new Map(c.records.map((r) => [r.id, r]));
  const img = new Map(c.images.map((i) => [i.id, i]));
  const src = new Map(c.sources.map((s) => [s.id, s]));
  const kids = new Map<string, Rec[]>();
  for (const r of c.records) if (r.parent_id) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  // Kiln facts written for a group of reigns (Zhengtong–Jingtai–Tianshun) belong to each of them.
  const groupFacts = c.records.filter((r) => r.kind === 'dating evidence' && String(r.attributes.reign ?? '').includes('–'));

  const rows = c.records.filter((r) => r.kind === 'reign mark');
  return rows
    .map((r): Reign => {
      const a = r.attributes;
      const pinyin = r.id.replace(/^reign-/, '');
      const name = pinyin.charAt(0).toUpperCase() + pinyin.slice(1);
      const children = kids.get(r.id) ?? [];
      const fax: Fax[] = children
        .filter((k) => k.kind.startsWith('book facsimile') && k.image_id)
        .map((k) => {
          // book-<reign>-<kaishu|seal|other><count>[-<book>]: "other" is a form the book prints beside the usual marks.
          const m = /book-[a-z]+-(kaishu|seal|other)(\d)?/.exec(k.id) ?? [];
          const script: Fax['script'] = m[1] === 'seal' ? 'seal' : m[1] === 'other' ? 'other' : 'regular';
          const count = m[2] ? Number(m[2]) : script === 'other' ? 0 : 6;
          const label = script === 'other' ? 'Another form in the books' : `${script === 'seal' ? 'Seal script' : 'Regular script'}, ${count} characters`;
          return { file: img.get(k.image_id!)!.file, script, count, label, credit: img.get(k.image_id!)!.credit ?? '' };
        })
        .sort((x, y) => (x.script === y.script ? y.count - x.count : ['regular', 'seal', 'other'].indexOf(x.script) - ['regular', 'seal', 'other'].indexOf(y.script)));
      const photos: Photo[] = children
        .filter((k) => k.kind.startsWith('museum example') && k.image_id)
        .map((k) => {
          const i = img.get(k.image_id!)!;
          const when = k.attributes.period_or_later === 'period' ? 'period' : k.attributes.period_or_later === 'later' ? 'later' : null;
          return { file: i.file, label: k.name, caption: soften(k.summary ?? ''), when, credit: i.credit ?? '', url: i.source_url ?? null };
        })
        .sort((x, y) => (x.when === y.when ? 0 : x.when === 'period' ? -1 : 1));
      const own = children.filter((k) => k.kind === 'dating evidence');
      const group = groupFacts.filter((f) => String(f.attributes.reign).split('–').map((x: string) => x.toLowerCase()).includes(pinyin) && f.parent_id !== r.id);
      const facts: Fact[] = [...own, ...group].map((f) => ({
        topic: TOPIC[String(f.attributes.topic)] ?? String(f.attributes.topic),
        text: soften(f.summary ?? ''),
        sources: f.sources.map((s) => src.get(s.id)?.citation ?? '').filter(Boolean),
      }));
      const marks = (Array.isArray(a.marks) ? a.marks : []).map((m: any) => ({ chars: String(m.chars), count: Number(m.chars_count ?? 0), script: String(m.script ?? ''), note: soften(String(m.note ?? '')) }));
      const reignChars0 = String(r.name).match(/[\u3400-\u9fff]+/)?.[0] ?? '';
      // A reign's own two characters always count, even where no mark of it is recorded.
      const glyphs = [...new Set([...marks.flatMap((m: { chars: string }) => [...m.chars].filter((ch) => HAN.test(ch))), ...reignChars0])] as string[];
      const alt = a.alt_start || a.alt_end ? `some tables give ${a.alt_start ?? r.date_from}–${a.alt_end ?? r.date_to}` : null;
      const reignChars = String(r.name).match(/[㐀-鿿]+/)?.[0] ?? '';
      return {
        id: r.id, pinyin: name, chars: reignChars, dynasty: String(a.dynasty ?? ''), start: r.date_from ?? 0, end: r.date_to ?? 0, alt,
        yearNote: r.date_note ?? null, emperor: a.emperor_name ?? null, spellings: r.keys.filter((k) => !HAN.test(k)),
        marks, summary: soften(r.summary ?? ''), copies: a.later_copies_note ? soften(String(a.later_copies_note)) : null, singleSource: r.single_source, fax, photos, facts,
        sources: r.sources.map((s) => src.get(s.id)).filter(Boolean).map((s) => ({ citation: s!.citation, url: s!.url ?? null })),
        glyphs,
      };
    })
    .sort((x, y) => x.start - y.start);
}

/** How to read a reign mark, and the cautions, from the app's table (chinese.json `reading`, `caveats`). */
export function readingNotes(): { reading: string[]; caveats: string[]; republic: string | null } {
  const t = (chineseTable as any).systems.reign_marks;
  return {
    reading: (t.reading ?? []).map((x: any) => String(x.text ?? x)),
    caveats: (t.caveats ?? []).map((x: any) => String(x.text ?? x)),
    republic: t.republic_note ? String(t.republic_note.text ?? t.republic_note) : null,
  };
}
