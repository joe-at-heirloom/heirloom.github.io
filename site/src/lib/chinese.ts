// The Chinese reference family (marks/chinese/…): shared data and wording.
// Ported from the generated pages (scripts/pages/p_chinese*.py) so every
// rebuilt page says what the generated one did, at the same address.
//
// The people come from the reference collection (src/data/generated/
// collection.json, the records the Advisor reads): each painter, calligrapher
// or collector of the Shanghai Museum's seal book is a record of family
// chinese-people, with their seals as child records (images on R2 at
// media.heirloomapp.io), the national survey's records of their works (Lao
// Jixiong) and the Qing imperial catalogs' entries under their name in its
// attributes. The wording tables below (experts, verdicts, catalog series,
// halls, citations) are the Asian art research's, kept here as written.
import { collection } from './portal';

export const MEDIA = 'https://media.heirloomapp.io/';
export const IDX = '/marks/chinese/painters/';
export const HOME = '/marks/chinese/';
export const SEAL_BOOK =
  '《中國書畫家印鑑款識》 (Seals and Signatures of Chinese Painters and Calligraphers), compiled by the Shanghai Museum (Beijing: Wenwu chubanshe, 1987; reprinted 2005)';
export const SURVEY =
  '勞繼雄《中國古代書畫鑑定實錄》 (Lao Jixiong, A Complete Authentication and Documentation of Classical Chinese Calligraphy and Paintings), 9 vols. (Beijing: Dongfang chubanshe, 2011)';
export const SEAL_CREDIT = 'Facsimile from Shanghai Museum, 《中國書畫家印鑑款識》 (Beijing, 1987)';

/** The family's tabs (SectionNav), the same on every page of it. */
export const NAV = [
  { href: '/marks/chinese/', label: 'Overview' },
  { href: '/marks/chinese-reign-marks', label: 'Reign marks', match: '/marks/chinese-reign' },
  { href: '/marks/chinese-hall-marks', label: 'Hall marks' },
  { href: '/marks/chinese/painters/', label: 'Painters and collectors', match: '/marks/chinese/painters' },
];

export type Opinion = { expert: string; text: string; text_en?: string; doubt?: string };
export type SurveyRec = {
  museum: string | null; museum_en?: string | null; page: string; verdict: string; title: string; title_en?: string | null;
  medium: string | null; medium_en?: string; inscription: string | null; inscription_en?: string | null;
  note: string | null; note_en?: string | null; note_doubt?: string; opinions: Opinion[]; match: string;
};
export type SealItem = {
  n: number; reading: string; source: string; source_en?: string; date_text: string; collector_seal: boolean; rephotographed: boolean;
  img?: string; img_page?: string; pinyin?: string; gloss?: string; kind?: string;
};
export type ShiquEntry = {
  edition: string; edition_en: string; year: number; title: string; title_en?: string | null; count: string | null; format: string | null;
  hall: string | null; grade: string | null; cite: { juan?: string; folio?: string; volume?: number; page?: number; archive_org?: string | null };
};
export type Person = {
  id: string; name: string; pinyin: string; slug: string; collector: boolean; dynasty: string; dates_text: string;
  born: number | null; died: number | null; died_after: boolean; active: string | null; aliases: string[];
  aliases_en?: Record<string, { pinyin?: string; gloss?: string }>; place_zh: string; place_en: string; skills: string;
  writings: string; writings_en?: string | null; ethnicity: string; book: { no: number; page: number }; name_uncertain: boolean;
  items: SealItem[]; survey: SurveyRec[]; wikidata: { status?: string; qid?: string | null; born?: number[]; died?: number[] }; shiqu: ShiquEntry[];
  /** Where the person comes from: the Shanghai Museum's seal book, or Wikidata checked against Chinese Wikipedia (no seals). */
  set: 'seal-book' | 'wikidata';
  dict?: {
    single: boolean; twoSources: boolean; bornAll: number[]; diedAll: number[]; birthplace: string; polity: string[];
    courtesy: { name: string; two_sources: boolean; wikipedia_says?: string }[]; artNames: { name: string; two_sources: boolean; wikipedia_says?: string }[];
    wikipediaOnly: { courtesy: string[]; art_names: string[] }; zhwiki: string | null; enwiki: string | null;
  };
};

/** The people, from the collection. */
function people(): Person[] {
  const c = collection();
  const img = new Map(c.images.map((i) => [i.id, i.file]));
  const seals = new Map<string, typeof c.records>();
  for (const r of c.records) if (r.family === 'chinese-people' && r.parent_id) (seals.get(r.parent_id) ?? seals.set(r.parent_id, []).get(r.parent_id)!).push(r);
  return c.records
    .filter((r) => r.family === 'chinese-people' && !r.parent_id)
    .map((r): Person => {
      const a = r.attributes;
      const [name, ...rest] = r.name.split(' ');
      const wd = a.source_set === 'wikidata-dictionary';
      const all = (v: unknown) => (Array.isArray(v) ? v.map(Number) : v != null ? [Number(v)] : []);
      // A person the site has no generated page for carries the address the template gives it (intended_page).
      const page = String(a.intended_page ?? r.page_path);
      return {
        id: r.id, name, pinyin: rest.join(' '), slug: page.replace(/\/$/, '').replace(/^.*\//, ''), collector: r.kind === 'collector',
        set: wd ? 'wikidata' : 'seal-book',
        dict: wd ? {
          single: !!r.single_source, twoSources: !!a.dates_two_sources, bornAll: all(a.born_all), diedAll: all(a.died_all),
          birthplace: String(a.birthplace_zh ?? ''), polity: Array.isArray(a.polity) ? a.polity : [],
          courtesy: Array.isArray(a.courtesy) ? a.courtesy : [], artNames: Array.isArray(a.art_names) ? a.art_names : [],
          wikipediaOnly: { courtesy: a.wikipedia_only?.courtesy ?? [], art_names: a.wikipedia_only?.art_names ?? [] },
          zhwiki: a.zhwiki ?? null, enwiki: a.enwiki ?? null,
        } : undefined,
        dynasty: String(a.dynasty ?? ''), dates_text: wd ? '' : (r.date_note ?? ''), born: r.date_from ?? null, died: r.date_to ?? null,
        died_after: /\bor after\b/.test(r.summary ?? ''), active: /\bactive ([^;]+)/.exec(r.summary ?? '')?.[1] ?? null,
        aliases: Array.isArray(a.aliases) ? a.aliases : [], aliases_en: a.aliases_en ?? undefined,
        place_zh: a.place_zh ?? '', place_en: r.place ?? '', skills: a.skills ?? '', writings: a.writings ?? '', writings_en: a.writings_en ?? null,
        ethnicity: a.ethnicity ?? '', book: a.book ?? { no: 0, page: 0 }, name_uncertain: !!a.name_uncertain,
        items: (seals.get(r.id) ?? []).map((k) => {
          const s = k.attributes;
          return {
            n: Number(s.n), reading: s.reading ?? '', source: s.work ?? '', source_en: s.work_en ?? undefined, date_text: s.date_text ?? '',
            collector_seal: k.kind === "collector's seal", rephotographed: !!s.rephotographed,
            img: k.image_id ? img.get(k.image_id) : undefined, img_page: s.book_page ?? undefined,
            pinyin: s.pinyin ?? undefined, gloss: s.gloss ?? undefined, kind: s.seal_kind ?? undefined,
          };
        }),
        survey: Array.isArray(a.survey) ? a.survey : [], wikidata: a.wikidata ?? {}, shiqu: Array.isArray(a.shiqu) ? a.shiqu : [],
      };
    })
    .filter((p) => p.slug && p.slug !== 'marks');
}
export const PEOPLE = people();
export const url = (p: Person) => IDX + p.slug;

export function dates(p: Person) {
  if (p.born || p.died) return `${p.born ?? '?'}–${p.died ?? '?'}${p.died_after ? ' or after' : ''}`;
  if (p.active) return `active ${p.active}`;
  return '';
}

const SKILL: Record<string, string> = {
  山水: 'landscape', 人物: 'figures', 花卉: 'flowers', 花鳥: 'birds and flowers', 書法: 'calligraphy', 篆刻: 'seal carving',
  墨竹: 'ink bamboo', 竹: 'bamboo', 梅: 'plum blossom', 蘭: 'orchids', 鞍馬: 'horses', 仕女: 'beauties', 佛像: 'Buddhist figures',
  界畫: 'ruled-line painting', 走獸: 'animals', 草蟲: 'insects', 魚: 'fish', 指畫: 'finger painting', 隸書: 'clerical script',
  楷書: 'regular script', 行書: 'running script', 草書: 'cursive script', 篆書: 'seal script', 詩: 'poetry', 鑑賞: 'connoisseurship',
  收藏: 'collecting', 鑑藏: 'collecting', 肖像: 'portraits', 畫: 'painting', 書: 'calligraphy', 石: 'rocks', 松: 'pines',
  雜畫: 'miscellaneous subjects', 寫真: 'portraits', 白描: 'line drawing', 水墨: 'ink painting', 工筆: 'fine-line painting',
};
export const skills = (t: string) =>
  (t || '').split(/[、，,]/).map((s) => s.trim()).filter(Boolean).map((s) => ({ zh: s, en: SKILL[s] ?? '' }));

export function role(p: Person) {
  const r: string[] = [];
  const s = p.skills || '';
  if (['山水', '人物', '花', '竹', '梅', '畫', '蘭', '鞍馬', '仕女', '佛像'].some((k) => s.includes(k))) r.push('painter');
  if (['書', '篆刻'].some((k) => s.includes(k))) r.push(s.includes('書') ? 'calligrapher' : 'seal carver');
  if (p.collector) r.push('collector');
  return r.join(', ') || 'painter or calligrapher';
}

export function wikidataLine(p: Person): { text: string; qid?: string } {
  const w = p.wikidata || {};
  const st = w.status;
  if (st === 'confirmed') return { text: 'the years agree.', qid: w.qid ?? undefined };
  if (st === 'partly confirmed') return { text: 'one year agrees; Wikidata does not give the other.', qid: w.qid ?? undefined };
  if (st === 'differs') {
    const b = (w.born ?? []).join(', ') || 'no year', d = (w.died ?? []).join(', ') || 'no year';
    return { text: `which gives ${b} to ${d}: the sources differ, so both are given here.`, qid: w.qid ?? undefined };
  }
  if (st === 'no book dates') return { text: 'The book gives a period, not years.', qid: w.qid ?? undefined };
  return { text: 'No matching entry was found in Wikidata, so the dates rest on the book alone.' };
}

export const VERDICT: Record<string, [string, string]> = { genuine: ['真迹', 'genuine'], forgery: ['僞迹', 'a forgery'], reference: ['資料', 'for reference only'] };
export const EXPERT_EN: Record<string, string> = {
  徐邦達: 'Xu Bangda', 謝稚柳: 'Xie Zhiliu', 啟功: 'Qi Gong', 啓功: 'Qi Gong', 劉九庵: 'Liu Jiu’an', 劉九菴: 'Liu Jiu’an',
  楊仁愷: 'Yang Renkai', 傅熹年: 'Fu Xinian', 謝辰生: 'Xie Chensheng',
};
export const SHIQU_SERIES: Record<number, string> = { 1744: 'first series', 1745: 'first series', 1793: 'second series', 1816: 'third series' };
const HALL_EN: Record<string, string> = {
  乾清宮: 'Palace of Heavenly Purity', 養心殿: 'Hall of Mental Cultivation', 重華宮: 'Palace of Double Brilliance', 寧壽宮: 'Palace of Tranquil Longevity',
  延春閣: 'Pavilion of Prolonged Spring', 御書房: 'Imperial Study', 淳化軒: 'Chunhua Gallery', 避暑山莊: 'Chengde summer palace',
  懋勤殿: 'Hall of Diligence', 南薰殿: 'Hall of the South Wind', 毓慶宮: 'Palace of Abundant Blessing', 中正殿: 'Hall of Rectitude', 三希堂: 'Hall of Three Rarities',
};
export const hallEn = (h: string | null) => (h ? HALL_EN[h.replace(/[一二三四五六七八九十]+$/, '').replace('宫', '宮')] ?? '' : '');

/** "vol. 1, PDF p. 54" from a page id like v1-0054. */
export function pdfPage(id?: string) {
  const m = /^v(\d)-(\d+)$/.exec(id ?? '');
  return m ? `vol. ${m[1]}, PDF p. ${Number(m[2])}` : '';
}

/** Survey pages cited by volume: "vol. 3, pp. 12, 40; vol. 5, pp. 7". */
export function surveyPages(recs: SurveyRec[]) {
  const by = new Map<string, Set<number>>();
  for (const r of recs) {
    const v = r.page?.[1];
    if (!v) continue;
    (by.get(v) ?? by.set(v, new Set()).get(v)!).add(Number(r.page.slice(3)));
  }
  return [...by.keys()].sort().map((v) => `vol. ${v}, pp. ${[...by.get(v)!].sort((a, b) => a - b).join(', ')}`).join('; ');
}

const HAN = /[㐀-鿿豈-﫿]/g;
/** The Chinese characters a page sets, for the han font's subset request. */
export const hanOf = (...texts: string[]) => [...new Set(texts.join('').match(HAN) ?? [])].join('');

export const DYN_ORDER = ['Tang', 'Five Dynasties', 'Song', 'Northern Song', 'Southern Song', 'Jin', 'Yuan', 'Ming', 'Qing', 'Republic', 'Modern'];
