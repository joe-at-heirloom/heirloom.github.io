// A copy of the app's backend/src/lib/rug-dates.ts (the Advisor's own
// reader), so the site's date reader and the Advisor read a woven date the
// same way. Copy it again after any change there.
/**
 * How a date woven into a rug turns into Western years: pure arithmetic, with
 * the words and ranges from src/data/mark-tables/rugs.json (`dates`), built
 * from the research in the website repo's hallmark-sources/rugs/dates_inscriptions/.
 *
 * Rugs are dated in the weaver's own numbers, usually with no word beside
 * them: a year in Persian or Arabic digits woven into a small panel (۱۳۲۴),
 * Western digits on Caucasian, Armenian and later rugs (1885), or Armenian
 * letters used as numbers (ՌՊՁԵ = 1885). The same number can be a year of
 * more than one calendar, and the reader gives every one that fits rather
 * than pick:
 *   - the lunar Hijri year (A.H.), on Persian, Caucasian, Turkish and Central
 *     Asian rugs: about 11 days shorter than ours, so one A.H. year falls in
 *     two Western years;
 *   - the Iranian solar year (S.H.), in official use from 1911 (1290 S.H.)
 *     and Iran's calendar by law since 1925: Western = S.H. + 621 from
 *     Nowruz (20 or 21 March) to the end of December, + 622 before it, so
 *     one year again falls in two;
 *   - the imperial count Iran used from March 1976 to August 1978
 *     (2535–2537 = S.H. 1355–1357; Encyclopaedia Iranica and the Majlis
 *     records), offered only for those three numbers;
 *   - the Ottoman fiscal (Rumi) year on Turkish items of 1840–1926: + 584 from
 *     1 March, + 585 before it, offered only when the item is Turkish;
 *   - an Armenian date: letters as numbers. When the sum + 551 would be in
 *     the future the weaver wrote the Western year; otherwise it is a year of
 *     the Armenian church era (+ 551).
 * A Persian number from 1290 to the present solar year can be either Hijri
 * or solar, so both are given. Three figures may have lost the leading 1
 * (۳۲۴ = 1324) or the last figure (۱۱۷ = 1170–1179): both are given. A number read the wrong way round (a date
 * woven mirrored, or read from the back) is offered reversed only when the
 * number as read fits no calendar.
 *
 * A woven date says when the weaver (or the rug the weaver copied) said it
 * was made; dates were copied from older rugs and added to newer ones, so a
 * date names a year, it does not date the rug by itself. The site's date
 * reader (website site/src/lib/rug-dates.ts) is a copy of this file.
 */
import { digitOf, hijriToWestern, jdToGregorian } from './indian-dates';

export type RugCalendar = 'ah' | 'sh' | 'rumi' | 'ad' | 'armenian-ad' | 'armenian-era' | 'imperial';
export type Numerals = 'Persian' | 'Arabic' | 'Western' | 'Armenian';

export interface RugCalendarReading {
  calendar: RugCalendar;
  /** The years the date can be, earliest first (one or two). */
  years: number[];
  /** How the number became those years, in words. */
  how: string;
}
export interface RugDateReading {
  /** The number as it was found in the text. */
  text: string;
  /** Its value. */
  value: number;
  numerals: Numerals;
  /** The value read the other way round, when it was. */
  reversed: boolean;
  /** Three figures, read with the thousand or the last figure left off (۳۲۴: 1324, or 3240–3249 never; ۱۱۷: 1117 or 1170–1179). */
  shortened?: boolean;
  readings: RugCalendarReading[];
}
export interface RugDateOptions {
  /** The current Western year (the reader stops there). */
  now?: number;
  /** The item is Turkish or Ottoman: the Rumi year is a candidate. */
  turkish?: boolean;
  /** Read a lone number with no word beside it (the item is a rug). Off: only numbers beside a date word. */
  bare?: boolean;
}

// ── Numbers ─────────────────────────────────────────────────────────────────
/** Armenian letters as numbers: Ա–Թ 1–9, Ժ–Ղ 10–90, Ճ–Ջ 100–900, Ռ–Ք 1000–9000 (capitals and small letters). */
const ARMENIAN: Readonly<Record<string, number>> = (() => {
  const caps = 'ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔ';
  const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000];
  const out: Record<string, number> = {};
  [...caps].forEach((c, i) => { out[c] = vals[i]; out[c.toLowerCase()] = vals[i]; });
  return out;
})();

/** An Armenian number (ՌՊՁԵ = 1885): letters summed, largest first. Null when a letter is no number or the order is wrong. */
export function armenianValue(s: string): number | null {
  const letters = [...s.replace(/[.\s՝՛՜]/g, '')];
  if (!letters.length) return null;
  let total = 0;
  let last = Infinity;
  for (const c of letters) {
    const v = ARMENIAN[c];
    if (!v || v >= last) return null;
    // One letter per order of magnitude (no ՌՌ, no ՊՄ).
    if (String(v).length === String(last).length) return null;
    total += v;
    last = v;
  }
  return total;
}

/** "In the year" before an Armenian date (Թվ., Թվին, ԹՎ), which would otherwise read as a 9. */
const ARMENIAN_YEAR_WORD = /(?:^|\s)(?:թվին|թվ\.?|թ\.)\s*/i;

const digitScript = (s: string): Numerals => {
  const d = digitOf([...s][0] ?? '');
  return d?.script === 'Persian/Urdu' ? 'Persian' : d?.script === 'Arabic' ? 'Arabic' : 'Western';
};
const valueOf = (s: string) => [...s].reduce((n, c) => n * 10 + (digitOf(c)?.value ?? 0), 0);
const reverse = (s: string) => [...s].reverse().join('');

// ── Calendars ───────────────────────────────────────────────────────────────
/** The Julian day number of a Julian-calendar date. */
const julianToJd = (y: number, m: number, d: number) => {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
};
/** The Western years an Armenian-era year falls in: 365 days from 11 July 552 (Julian) + 365 × (n − 1), no leap days. */
export function armenianEraToWestern(n: number): number[] {
  const start = julianToJd(552, 7, 11) + 365 * (n - 1);
  const a = jdToGregorian(start)[0], b = jdToGregorian(start + 364)[0];
  return a === b ? [a] : [a, b];
}
/** The current years in each calendar, from the Western year (late in the year, so the latest that can have begun). */
const nowAh = (y: number) => Math.floor((y - 621.57) / 0.970229) + 1;
const nowSh = (y: number) => y - 621;
/** The first solar year in official use (1911); the law of 1925 (1304) made it the calendar. */
export const SH_ADOPTED = 1290;
export const IMPERIAL = [2535, 2537] as const;
export const RUMI_FIRST = 1256;
export const RUMI_LAST = 1341;

const span = (ys: number[]) => (ys.length > 1 ? `${ys[0]} or ${ys[ys.length - 1]}` : String(ys[0]));

/** Every calendar a woven number can be a year of, earliest first within each. */
export function calendarReadings(n: number, numerals: Numerals, opts: RugDateOptions = {}): RugCalendarReading[] {
  const now = opts.now ?? new Date().getFullYear();
  const out: RugCalendarReading[] = [];
  if (numerals === 'Armenian') {
    // The sum + 551 in the future: the weaver wrote the Western year in letters.
    if (n + 551 > now) {
      if (n >= 1000 && n <= now) out.push({ calendar: 'armenian-ad', years: [n], how: `the letters add up to ${n}, the Western year` });
    } else if (n >= 500) {
      const ys = armenianEraToWestern(n);
      out.push({ calendar: 'armenian-era', years: ys, how: `${n} of the Armenian church era, whose 365-day year began on 11 July 552 and slid back about a day every four years: ${span(ys)}` });
    }
    return out;
  }
  if (numerals === 'Western') {
    if (n >= 1600 && n <= now) out.push({ calendar: 'ad', years: [n], how: `written in Western digits: the Western year ${n}` });
    // A Hijri year in Western digits is rare on rugs; it is given only when the number cannot be a Western year.
    if (!out.length && n >= 1000 && n <= nowAh(now)) {
      const ys = hijriToWestern(n);
      out.push({ calendar: 'ah', years: ys, how: `${n} A.H. (the lunar Hijri year) began and ended in ${span(ys)}` });
    }
    return out;
  }
  // Persian or Arabic digits.
  if (n >= 1000 && n <= nowAh(now)) {
    const ys = hijriToWestern(n);
    out.push({ calendar: 'ah', years: ys, how: `${n} A.H. (the lunar Hijri year) began and ended in ${span(ys)}` });
  }
  if (n >= SH_ADOPTED && n <= nowSh(now)) {
    const ys = [n + 621, n + 622];
    out.push({ calendar: 'sh', years: ys, how: `${n} S.H. (Iran’s solar year, in official use from 1911) ran from March ${n + 621} to March ${n + 622}` });
  }
  if (n >= IMPERIAL[0] && n <= IMPERIAL[1]) {
    const ys = [n - 1180 + 621, n - 1180 + 622];
    out.push({ calendar: 'imperial', years: ys, how: `the imperial year Iran used from March 1976 to August 1978: ${n} − 1180 = ${n - 1180} S.H., ${span(ys)}` });
  }
  if (opts.turkish && n >= RUMI_FIRST && n <= RUMI_LAST) {
    const ys = [n + 584, n + 585];
    out.push({ calendar: 'rumi', years: ys, how: `${n} in the Ottoman fiscal (Rumi) year + 584 from March = ${span(ys)}` });
  }
  return out;
}

/** A year with its last figure left off (1170–1179): every calendar the whole decade fits, as one span. */
function decadeReadings(first: number, numerals: Numerals, opts: RugDateOptions): RugCalendarReading[] {
  const a = calendarReadings(first, numerals, opts);
  const b = calendarReadings(first + 9, numerals, opts);
  return a.filter((x) => b.some((y) => y.calendar === x.calendar)).map((x) => {
    const y = b.find((z) => z.calendar === x.calendar)!;
    const ys = [x.years[0], y.years[y.years.length - 1]];
    return { calendar: x.calendar, years: ys, how: `with the last figure left off, ${first}–${first + 9} in the same calendar: ${ys[0]} to ${ys[1]}` };
  });
}

// ── Reading a text ──────────────────────────────────────────────────────────
/** Words that make a number beside them a date: سنه / سال (year), the A.H. and S.H. signs, Թվ, "year", "dated". */
const DATE_WORDS = /(سنه|سنة|سال|هجری|هجري|شمسی|قمری|ھ|ه\.?ق|ه\.?ش|تاریخ|تحریر|ثبت|tarih|sene|yıl|a\.?h\.?|s\.?h\.?|dated|year|թվ)/i;
const NUMBER_RUN = /[0-9٠-٩۰-۹]{3,4}/g;
const ARMENIAN_RUN = /[Ա-Քա-ք]{2,5}/g;

/**
 * Every date the text can hold. With `bare` (the item is a rug), a lone
 * three- or four-figure number in Persian, Arabic or Western digits is read;
 * without it, only a number with a date word in the same text. Three figures
 * are read only in Persian or Arabic digits, and only as a year of the
 * calendars with the thousand left off (۳۲۴ = 1324), which weavers did; a
 * Western three-figure number is a size or a count, never a date.
 */
export function readRugDates(text: string, opts: RugDateOptions = {}): RugDateReading[] {
  const t = String(text ?? '').normalize('NFC');
  const out: RugDateReading[] = [];
  const dated = DATE_WORDS.test(t);
  if (!opts.bare && !dated) return out;
  const seen = new Set<string>();
  for (const m of t.matchAll(NUMBER_RUN)) {
    const s = m[0];
    // One script per number: a run that mixes Western and Persian digits is a misread.
    if (new Set([...s].map((c) => digitScript(c))).size > 1) continue;
    const numerals = digitScript(s);
    if (s.length === 3 && numerals === 'Western') continue;
    if (seen.has(s)) continue;
    seen.add(s);
    const tryRead = (str: string, reversed: boolean): RugDateReading | null => {
      const v = valueOf(str);
      if (str.length === 4) {
        const readings = calendarReadings(v, numerals, opts);
        return readings.length ? { text: s, value: v, numerals, reversed, readings } : null;
      }
      // Three figures: the leading 1 left off (۳۲۴ = 1324), or the last figure (۱۱۷ = 1170–1179).
      const lead = calendarReadings(1000 + v, numerals, opts);
      const decade = v * 10 >= 1000 ? decadeReadings(v * 10, numerals, opts) : [];
      const readings = [...lead.map((x) => ({ ...x, how: `with the leading 1 left off, ${x.how}` })), ...decade];
      return readings.length ? { text: s, value: 1000 + v, numerals, reversed, readings, shortened: true } : null;
    };
    const straight = tryRead(s, false);
    if (straight) { out.push(straight); continue; }
    // Mirrored only when the number as read fits nothing and its reverse is four figures.
    if (s.length === 4 && [...s].at(-1) !== '0' && numerals !== 'Western') {
      const back = tryRead(reverse(s), true);
      if (back) out.push(back);
    }
  }
  const armenianText = t.replace(ARMENIAN_YEAR_WORD, ' ');
  for (const m of armenianText.matchAll(ARMENIAN_RUN)) {
    const n = armenianValue(m[0]);
    if (n === null || n < 1000) continue;
    const readings = calendarReadings(n, 'Armenian', opts);
    if (readings.length && !seen.has(m[0])) {
      seen.add(m[0]);
      out.push({ text: m[0], value: n, numerals: 'Armenian', reversed: false, readings });
    }
  }
  return out;
}

/** Every Western year a reading allows, earliest first. */
export const yearsOf = (r: RugDateReading): number[] => [...new Set(r.readings.flatMap((x) => x.years))].sort((a, b) => a - b);

/** What the record says the item is, for reading a lone woven number as a date. */
export const RUG_ITEM = /\b(rugs?|carpets?|kilims?|kelims?|runners?|soumaks?|sumakh?s?|khorjins?|saddle ?bags?|bag ?faces?|prayer rugs?|gabbehs?|dhurr?ies?|tent bands?|chuvals?|torbas?|ensis?|namaz?liks?|sejjadeh)\b/i;
/** Signs the item is Turkish or Ottoman, for the Rumi year. */
export const TURKISH_ITEM = /\b(turk(ish|ey)?|anatolia[n]?|ottoman|oushak|ushak|uşak|ghiordes|gördes|kula|ladik|konya|bergama|milas|melas|mudjur|kirsehir|kırşehir|hereke|kayseri|sivas|yuruk|yürük|smyrna)\b/i;
