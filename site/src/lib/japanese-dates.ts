/**
 * How a date written on a Japanese object turns into Western years: pure
 * arithmetic over the tables in src/data/mark-tables/japanese.json (`dates`),
 * built from the research in the website repo's hallmark-sources/japanese/dating/.
 *
 * Japanese objects write years in a few ways:
 *   - an era name (nengō) and a year count, 明治十五年 (Meiji 15 = 1882), 天保
 *     十三壬寅 with the cyclical year as a check. In Japan a new era's first
 *     year (元年) is the same calendar year as the old era's last, so year n of
 *     an era is year1 + n − 1; the two courts of 1331–1392 each kept eras;
 *   - the imperial count (皇紀 / 紀元), counted from 660 BC: 紀元二千六百年 =
 *     1940, the year of the great celebration, written on commemorative and
 *     military things;
 *   - an era with no number before 年製, 大日本明治年製: an era mark, naming
 *     the era only (readEraMarks);
 *   - a cyclical year alone (壬寅): one year in sixty, not read here.
 * A date says when the writing claims it was made, not that the item is of
 * that date; and before 1873 (明治5年12月2日 was followed by 1 January 1873)
 * a date is lunar, so its 11th and 12th months usually fall early in the next
 * Western year.
 *
 * The cycle, the numbers, variant folding and the era reader are shared with
 * the Korean reader in ./cjk-dates.ts. The site's date reader (website
 * site/src/lib/japanese-dates.ts and cjk-dates.ts) is a copy of both.
 */

import { GZ, NUM, YEAR, fold, ganjiAfter, ganjiOfYear, hanNumber, normalizeDateText, readEraDates, type DateReading, type EraRow } from './cjk-dates';

export type { DateReading, EraRow };

/** An era as japanese.json keeps it. */
export interface JapaneseEra extends EraRow { romaji?: string; romaji_plain?: string; kana?: string; court?: 'northern' | 'southern' | 'both' | null }

/**
 * The old character forms (kyūjitai) Japanese objects and older books write,
 * folded to the forms Japan uses now (shinjitai), so 慶應, 寶暦 and 寶曆 all
 * read as 慶応 and 宝暦; 曆 and 歷 (which the shared fold turns into 曆) read
 * as 暦. Used on both the text and the table before they are compared.
 */
export const KYU_SHIN: Readonly<Record<string, string>> = {
  應: '応', 龜: '亀', 寶: '宝', 祿: '禄', 萬: '万', 壽: '寿', 德: '徳', 觀: '観', 曆: '暦', 歷: '暦', 靈: '霊', 齊: '斉', 實: '実',
  寬: '寛', 國: '国', 廣: '広', 會: '会', 樂: '楽', 藝: '芸', 澤: '沢', 圓: '円', 發: '発', 燒: '焼', 縣: '県', 傳: '伝', 龍: '竜',
  黑: '黒', 貳: '弐', 壹: '壱', 參: '参', 與: '与', 邊: '辺', 邉: '辺', 濱: '浜', 佛: '仏', 臺: '台', 畫: '画', 圖: '図', 號: '号',
  兒: '児', 將: '将', 榮: '栄', 齋: '斎', 藏: '蔵', 郞: '郎', 團: '団', 處: '処', 祕: '秘', 經: '経', 繼: '継', 眞: '真', 惠: '恵',
};
export const toShinjitai = (s: string) => [...s].map((c) => KYU_SHIN[c] ?? c).join('');

/** The year the lunar calendar ended: dates before it are lunar. */
export const LUNAR_UNTIL = 1872;
/** 皇紀 / 紀元 N年 → N − 660 (year 1 = 660 BC). */
export const KOKI_OFFSET = 660;
const KOKI_WORDS = ['皇紀', '紀元'];
/** Japanese names of the 11th and 12th months that the shared reader does not know. */
const JA_LATE = /(極月|臘月|霜月|師走|十一月|十二月)/;

/**
 * Read every date in one inscription: era dates and imperial-count dates.
 * Era dates in the 11th or 12th month before 1873 are marked `late_month`.
 */
export function readJapaneseDates(text: string, eras: readonly JapaneseEra[]): DateReading[] {
  // 天保十三壬寅年 (era, number, cycle, 年): the shared reader wants 天保十三年壬寅.
  const t = toShinjitai(normalizeDateText(text)).replace(new RegExp(`(${NUM})(${GZ})${YEAR}?`, 'g'), '$1年$2');
  eras = shinEras(eras);
  const late = JA_LATE.test(t);
  const out: DateReading[] = [];
  const taken: [number, number][] = [];
  const free = (a: number, b: number) => !taken.some(([x, y]) => a < y && x < b);

  for (const w of KOKI_WORDS) {
    const re = new RegExp(`${w}(${NUM})${YEAR}?`, 'g');
    for (let m = re.exec(t); m; m = re.exec(t)) {
      const n = hanNumber(m[1]);
      // The count was used for modern years (1872 on): 2532 and later.
      if (n === null || n < 2532 || n > 2700) continue;
      const y = n - KOKI_OFFSET;
      const gz = ganjiAfter(t.slice(m.index + m[0].length - 1));
      taken.push([m.index, m.index + m[0].length]);
      out.push({
        text: m[0], system: 'koki', years: [y], exact: !gz || ganjiOfYear(y) === gz, confidence: 'high',
        ganji: gz ? { chars: gz, agrees: ganjiOfYear(y) === gz } : null, how: `the imperial count from 660 BC: ${n} − ${KOKI_OFFSET}`, late_month: false,
      });
    }
  }
  for (const d of readEraDates(t, eras, free)) out.push({ ...d, late_month: late && d.years[0] <= LUNAR_UNTIL });
  return out.sort((a, b) => Number(b.exact) - Number(a.exact));
}

const shinCache = new WeakMap<readonly JapaneseEra[], JapaneseEra[]>();
/** The eras with their names in today's forms (variants kept, folded the same way). */
function shinEras(eras: readonly JapaneseEra[]): JapaneseEra[] {
  let e = shinCache.get(eras);
  if (!e) {
    e = eras.map((x) => ({ ...x, chars: toShinjitai(fold(x.chars)), variants: [...new Set((x.variants ?? []).map((v) => toShinjitai(fold(v))))] }));
    shinCache.set(eras, e);
  }
  return e;
}

/** An era named with no year count: 明治年製, 大日本明治年製, 大正年造. */
export interface EraMark { text: string; era: JapaneseEra }

export function readEraMarks(text: string, eras: readonly JapaneseEra[]): EraMark[] {
  const t = toShinjitai(normalizeDateText(text));
  const out: EraMark[] = [];
  for (const e of shinEras(eras)) {
    for (const word of new Set([e.chars, ...(e.variants ?? [])].map(fold))) {
      const m = new RegExp(`(?:大日本)?${word}(?:年製|年造|年製造|年作)`).exec(t);
      if (m) { out.push({ text: m[0], era: e }); break; }
    }
  }
  return out;
}
