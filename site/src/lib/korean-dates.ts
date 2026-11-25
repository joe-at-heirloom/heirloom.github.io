// How a date written on a Korean object turns into Western years: a copy of
// the app's backend/src/lib/korean-dates.ts (the Advisor's decoder uses that
// one; its header explains the rules and where they were checked), for the
// date reader. With ./cjk-dates.ts, a copy of the app's file of that name.
// Keep both in step: copy the app's files over these, keep this header.

import {
  BRANCHES, GZ, LATE_MONTH, NUM, STEMS, YEAR, firstGanjiFrom, fold, ganjiAfter, ganjiIndex, ganjiOfYear, hanNumber, normalizeDateText, pickByGanji, readEraDates, yearsOfGanji,
  type DateReading, type EraRow,
} from './cjk-dates';

export { STEMS, BRANCHES, ganjiIndex, ganjiOfYear, yearsOfGanji, firstGanjiFrom, hanNumber, fold };
export type { DateReading, EraRow };

/**
 * A count that is not an era (korean.json `dates.counts`):
 *   ordinal_ganji   崇禎紀元後三甲子, 永曆五辛亥: the Nth year of that ganji from `first_from`;
 *                   `reign_from`–`reign_to` are the era's own years, whose ganji are read
 *                   both ways; `self_year`'s ganji (戊辰 for 1628) is counted both ways too;
 *                   `open_to` bounds the candidates when no ordinal is written;
 *   year_offsets    崇禎紀元後百年, 大韓民國三十年, 주체86: AD = offset + N for each
 *                   offset (several where writers differed; the ganji picks);
 *   minus           檀紀4281: AD = N − offset;
 *   buddhist        佛紀: N − 1027 for the old Korean count (29xx), N − 544 for the modern.
 */
export interface CountRow {
  id: string;
  chars: string[];
  rule: 'ordinal_ganji' | 'year_offsets' | 'minus' | 'buddhist';
  first_from?: number; reign_from?: number | null; reign_to?: number | null; self_year?: number | null; open_to?: number;
  offsets?: number[]; offset?: number; nian_optional?: boolean;
}

const ORD: Readonly<Record<string, number>> = { 再: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
const ORDINAL_WORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];

/**
 * Read every date in one inscription: eras (Korean eras and whatever foreign
 * eras the caller passes) with a year count, and the counts. A ganji alone is
 * not read: on its own it is one year in sixty.
 */
export function readKoreanDates(text: string, eras: readonly EraRow[], counts: readonly CountRow[]): DateReading[] {
  const t = normalizeDateText(text);
  const late = LATE_MONTH.test(t);
  const out: DateReading[] = [];
  const taken: [number, number][] = [];
  const free = (a: number, b: number) => !taken.some(([x, y]) => a < y && x < b);
  const take = (a: number, b: number) => taken.push([a, b]);
  const pick = pickByGanji;

  // Longest words first, so 崇禎紀元後 is read before 崇禎紀元, 崇禎甲申後 before 崇禎後.
  const words = counts.flatMap((c) => [...new Set(c.chars.map(fold))].map((w) => ({ c, w }))).sort((a, b) => [...b.w].length - [...a.w].length);
  for (const { c, w } of words) {
    for (let at = t.indexOf(w); at >= 0; at = t.indexOf(w, at + 1)) {
      if (!free(at, at + w.length)) continue;
      const rest = t.slice(at + w.length).replace(/^(歲次|歲在)/, (m) => m);
      if (c.rule === 'ordinal_ganji') {
        // 崇禎紀元後三甲子 / 再丁卯 / 五周甲辰 / 周甲戊辰 / 歲次五丙子 / 甲子 (no ordinal).
        const m = new RegExp(`^(?:歲次)?(?:([再二三四五六七])周?|(周甲))?(?:歲次)?(${GZ})`).exec(rest);
        if (!m) continue;
        const gz = m[3];
        const i = ganjiIndex(gz);
        if (i === null) continue;
        const first = c.first_from ?? 1629;
        const n = m[1] ? ORD[m[1]] : m[2] ? 2 : null;
        const y1 = firstGanjiFrom(i, first);
        const end = at + w.length + m[0].length;
        let r: Omit<DateReading, 'text' | 'system' | 'late_month'>;
        // 三甲子歲次丙午: here 三甲子 names a sixty-year cycle and the year is the ganji after it (one case read).
        const cycle = gz === '甲子' && n ? new RegExp(`^(?:歲次|歲在)(${GZ})`).exec(t.slice(end)) : null;
        if (cycle && ganjiIndex(cycle[1]) !== null) {
          const j = ganjiIndex(cycle[1])!;
          const starts = [1624 + 60 * (n! - 1), 1684 + 60 * (n! - 1)];
          r = { years: starts.map((s) => firstGanjiFrom(j, s)), exact: false, confidence: 'low', ganji: null, how: `${m[0]} names a sixty-year cycle and ${cycle[1]} the year in it; writers counted the cycles differently` };
          take(at, end + cycle[0].length);
          out.push({ text: w + m[0] + cycle[0], system: c.id, late_month: late, ...r });
          continue;
        }
        if (n === null) {
          const from = (c.reign_to ?? first - 1) + 1;
          r = { years: yearsOfGanji(i, from, c.open_to ?? 1930), exact: false, confidence: 'low', ganji: null, how: `no cycle is written, so it can be any ${gz} year after ${from - 1}; the person, office or event named decides` };
        } else if (c.self_year != null && ganjiOfYear(c.self_year) === gz) {
          r = { years: [y1 + 60 * (n - 1), c.self_year + 60 * (n - 1)], exact: false, confidence: 'medium', ganji: null, how: `the ${ORDINAL_WORD[n]} ${gz} year: writers counted ${c.self_year} itself as the first, or did not` };
        } else if (c.reign_from != null && c.reign_to != null && y1 <= c.reign_to) {
          r = { years: [y1 + 60 * (n - 1), y1 + 60 * n], exact: false, confidence: 'medium', ganji: null, how: `the ${ORDINAL_WORD[n]} ${gz} year: most writers counted ${y1}, inside the era, as the first; some started after it` };
        } else {
          r = { years: [y1 + 60 * (n - 1)], exact: true, confidence: 'high', ganji: null, how: `the ${ORDINAL_WORD[n]} ${gz} year from ${first} on` };
        }
        take(at, end);
        out.push({ text: w + m[0], system: c.id, late_month: late, ...r });
      } else if (c.rule === 'year_offsets') {
        // 崇禎紀元後八十三年庚寅, 崇禎紀元後周甲四十五年, 大韓民國三十年, 주체86.
        const m = new RegExp(`^(周甲)?(${NUM})(${YEAR})${c.nian_optional ? '?' : ''}`).exec(rest);
        if (!m) continue;
        const n = hanNumber(m[2]);
        if (n === null || n < 1) continue;
        const extra = m[1] ? 60 : 0;
        const gz = ganjiAfter(rest.slice(m[0].length));
        const p = pick((c.offsets ?? []).map((o) => o + extra + n), gz);
        const one = p.years.length === 1;
        take(at, at + w.length + m[0].length);
        out.push({
          text: w + m[0], system: c.id, years: p.years, exact: one && (!p.ganji || p.ganji.agrees), confidence: one ? 'high' : 'medium', ganji: p.ganji,
          how: (c.offsets ?? []).length > 1 && !one ? `writers counted from ${(c.offsets ?? []).map((o) => o + 1).join(', ')}; the cyclical year would settle it` : `${(c.offsets ?? [])[0] + extra} + ${n}`,
          late_month: late,
        });
      } else if (c.rule === 'minus') {
        const m = new RegExp(`^(${NUM})`).exec(rest);
        if (!m) continue;
        const n = hanNumber(m[1]);
        if (n === null || n <= (c.offset ?? 0)) continue;
        const y = n - (c.offset ?? 0);
        const gz = ganjiAfter(rest.slice(m[0].length));
        take(at, at + w.length + m[0].length);
        out.push({ text: w + m[1], system: c.id, years: [y], exact: !gz || ganjiOfYear(y) === gz, confidence: 'high', ganji: gz ? { chars: gz, agrees: ganjiOfYear(y) === gz } : null, how: `${n} − ${c.offset}`, late_month: late });
      } else if (c.rule === 'buddhist') {
        const m = new RegExp(`^(${NUM})`).exec(rest);
        if (!m) continue;
        const n = hanNumber(m[1]);
        if (n === null) continue;
        const cands = n >= 2900 ? [n - 1027] : n >= 2400 && n < 2700 ? [n - 544] : [];
        if (!cands.length) continue;
        const gz = ganjiAfter(rest.slice(m[0].length));
        take(at, at + w.length + m[0].length);
        out.push({ text: w + m[1], system: c.id, years: cands, exact: !gz || ganjiOfYear(cands[0]) === gz, confidence: 'medium', ganji: gz ? { chars: gz, agrees: ganjiOfYear(cands[0]) === gz } : null, how: n >= 2900 ? `the old Korean count from 1027 BC: ${n} − 1027` : `the modern count: ${n} − 544`, late_month: late });
      }
    }
  }

  out.push(...readEraDates(t, eras, free));
  return out.sort((a, b) => Number(b.exact) - Number(a.exact));
}
