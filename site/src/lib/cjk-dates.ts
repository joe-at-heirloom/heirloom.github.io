/**
 * Dates written in Chinese characters, as China, Korea and Japan wrote them:
 * the sixty-year cycle (干支), numbers in hanja/kanji, variant forms of the
 * same character, and an era name followed by a year count (光武五年,
 * 乾隆十年乙丑, 明治三十年). Pure arithmetic; the tables come from the caller.
 *
 * Shared by the Korean reader (lib/korean-dates.ts, which adds Korea's own
 * counts: 崇禎紀元後, 檀紀 …) and the Japanese one (lib/japanese-dates.ts). The
 * Japanese session keeps a byte-for-byte copy of this file on its branch:
 * change it here, then tell them, so the two stay identical.
 *
 * An era's year 1 is `year1`; year n is year1 + n − 1. That holds for every
 * tradition here once year1 is right: Korean official records start an era or
 * a reign in the year after accession (踰年稱元), Japanese eras in the same
 * calendar year as the old era's last; the table says which year that is.
 * Before the solar calendar (Korea 1896, Japan 1873) a date is lunar, so the
 * 11th and 12th months usually fall early in the next Western year.
 */

export const STEMS = '甲乙丙丁戊己庚辛壬癸';
export const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

/** Position in the sixty-year cycle, 0 = 甲子, or null if the two characters are no cyclical year. */
export function ganjiIndex(g: string): number | null {
  const cs = [...g];
  if (cs.length !== 2) return null;
  const s = STEMS.indexOf(cs[0]);
  const b = BRANCHES.indexOf(cs[1]);
  if (s < 0 || b < 0 || s % 2 !== b % 2) return null;
  for (let i = s; i < 60; i += 10) if (i % 12 === b) return i;
  return null;
}

/** The cyclical year of a Western year (the lunar year that mostly falls in it): 1984 → 甲子. */
export function ganjiOfYear(year: number): string {
  const i = (((year - 4) % 60) + 60) % 60;
  return STEMS[i % 10] + BRANCHES[i % 12];
}

/** The first year at or after `from` that carries cyclical year `i`. */
export function firstGanjiFrom(i: number, from: number): number {
  return from + ((((i - (from - 4)) % 60) + 60) % 60);
}

/** Every year from `from` to `to` that carries cyclical year `i`. */
export function yearsOfGanji(i: number, from: number, to: number): number[] {
  const out: number[] = [];
  for (let y = firstGanjiFrom(i, from); y <= to; y += 60) out.push(y);
  return out;
}

const DIGIT: Readonly<Record<string, number>> = {
  〇: 0, 零: 0, 一: 1, 壹: 1, 壱: 1, 二: 2, 貳: 2, 弐: 2, 弍: 2, 三: 3, 參: 3, 参: 3, 叁: 3, 四: 4, 肆: 4, 五: 5, 伍: 5, 六: 6, 陸: 6, 七: 7, 柒: 7, 漆: 7, 八: 8, 捌: 8, 九: 9, 玖: 9,
};
const UNIT: Readonly<Record<string, number>> = { 十: 10, 拾: 10, 百: 100, 佰: 100, 陌: 100, 千: 1000, 仟: 1000, 阡: 1000 };
/** Tens written as one character: 廿 20, 卅 30, 卌 40. */
const TENS: Readonly<Record<string, number>> = { 廿: 20, 卄: 20, 卅: 30, 丗: 30, 卌: 40 };

/**
 * A number written in hanja/kanji or digits: 五 → 5, 十五 → 15, 二十 → 20,
 * 廿五 → 25, 卅 → 30, 百十 → 110, 一百二十三 → 123, 四仟貳百八拾壹 → 4281,
 * 四二八一 → 4281 (digit by digit), 元 → 1 (元年, the first year), 4281 and
 * fullwidth ４２８１. Null when it is no number.
 */
export function hanNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (/^[0-9０-９]+$/.test(t)) return Number(t.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10)));
  if (t === '元') return 1;
  const cs = [...t];
  if (cs.length > 1 && cs.every((c) => c in DIGIT)) return Number(cs.map((c) => DIGIT[c]).join(''));
  let total = 0;
  let cur = 0;
  for (const c of cs) {
    if (c in DIGIT) cur = DIGIT[c];
    else if (c in TENS) { total += TENS[c]; cur = 0; }
    else if (c in UNIT) { total += (cur || 1) * UNIT[c]; cur = 0; }
    else return null;
  }
  return total + cur;
}

/**
 * Variant forms Korean, Chinese and Japanese texts write for one character
 * (Korea's 光緖 and 淸 for China's 光緒 and 清; 煕 for 熙; 豊 for 豐; 歷 for 曆),
 * folded on both sides before a name is matched, so the tables need not list
 * every form.
 */
export const VARIANT: Readonly<Record<string, string>> = { 緖: '緒', 淸: '清', 靑: '青', 眞: '真', 歷: '曆', 啓: '啟', 敎: '教', 煕: '熙', 豊: '豐' };
export const fold = (s: string) => [...s.normalize('NFC')].map((c) => VARIANT[c] ?? c).join('');
/** A text ready for matching: folded, without spaces, brackets or punctuation. */
export const normalizeDateText = (s: string) => fold(s).replace(/[\s[\]()（）·,，。.、|/'"‘’“”「」『』]/g, '');

/** A number as the reader matches it (any of the forms hanNumber reads). */
export const NUM = '[〇零一壹壱二貳弐弍三參参叁四肆五伍六陸七柒漆八捌九玖十拾百佰陌千仟阡廿卄卅丗卌元0-9０-９]+';
/** A cyclical year. */
export const GZ = `[${STEMS}][${BRANCHES}]`;
/** "Year" after a count: 年, its variant 秊, Korean 년. */
export const YEAR = '[年秊년]';
/** The 11th or 12th month, by number or by name (至月, 臘月, 仲冬, 季冬; Korean 동짓달, 섣달). */
export const LATE_MONTH = /(十一月|十二月|至月|臘月|仲冬|季冬|霜月|師走|동짓달|섣달|11월|12월)/;

/** The cyclical year written right after a date's year, if any: 光武五年辛丑, 乾隆十年歲次乙丑. */
export function ganjiAfter(rest: string): string | null {
  const m = new RegExp(`^(?:${YEAR})?(?:歲次|歲在|太歲)?(${GZ})`).exec(rest);
  return m && ganjiIndex(m[1]) !== null ? m[1] : null;
}

/** An era: year 1 is `year1` (alt_year1 where sources count it from another year). `end` null where an era may have been written after it ended. */
export interface EraRow { id: string; chars: string; variants?: string[]; year1: number; alt_year1?: number | null; start?: number | null; end?: number | null }

export interface DateReading {
  /** The date as found in the text, normalized. */
  text: string;
  /** Which system: an era's id or a count's id. */
  system: string;
  /** The Western year or years the date can be, best first. */
  years: number[];
  /** One year, by a rule the sources agree on. */
  exact: boolean;
  confidence: 'high' | 'medium' | 'low';
  /** The cyclical year written with it, and whether it agrees with years[0]. */
  ganji: { chars: string; agrees: boolean } | null;
  /** How the year was worked out, in words. */
  how: string;
  /** The date is in the 11th or 12th lunar month: it may fall early in the next Western year. */
  late_month: boolean;
}

/** Keep the candidate years a written cyclical year agrees with; if none, all of them, marked as disagreeing. */
export function pickByGanji(cands: number[], gz: string | null): { years: number[]; ganji: DateReading['ganji'] } {
  if (!gz) return { years: cands, ganji: null };
  const ok = cands.filter((y) => ganjiOfYear(y) === gz);
  return ok.length ? { years: ok, ganji: { chars: gz, agrees: true } } : { years: cands, ganji: { chars: gz, agrees: false } };
}

/**
 * Every "era + N年" date in a normalized text (normalizeDateText), with the
 * cyclical year after it checked. `free(a, b)` says whether characters a..b
 * are still unread (a caller's own counts may have read them first). An era
 * whose count runs past its `end` is not read there: a misreading, or another
 * era of the same name.
 */
export function readEraDates(t: string, eras: readonly EraRow[], free: (a: number, b: number) => boolean = () => true): DateReading[] {
  const late = LATE_MONTH.test(t);
  const out: DateReading[] = [];
  for (const e of eras) {
    for (const word of [...new Set([e.chars, ...(e.variants ?? [])].filter(Boolean).map(fold))]) {
      const re = new RegExp(`${word}(${NUM})${YEAR}`, 'g');
      for (let m = re.exec(t); m; m = re.exec(t)) {
        if (!free(m.index, m.index + m[0].length)) continue;
        const n = hanNumber(m[1]);
        if (n === null || n < 1) continue;
        const ys = [e.year1, ...(e.alt_year1 != null && e.alt_year1 !== e.year1 ? [e.alt_year1] : [])].map((y1) => y1 + n - 1);
        if (e.end != null && ys.every((y) => y > e.end! + 1)) continue;
        const p = pickByGanji(ys, ganjiAfter(t.slice(m.index + m[0].length - 1)));
        const one = p.years.length === 1;
        out.push({ text: m[0], system: e.id, years: p.years, exact: one && (!p.ganji || p.ganji.agrees), confidence: one ? 'high' : 'medium', ganji: p.ganji, how: `year 1 = ${e.year1}${e.alt_year1 != null && e.alt_year1 !== e.year1 ? ` (or ${e.alt_year1})` : ''}`, late_month: late });
      }
    }
  }
  return out;
}
