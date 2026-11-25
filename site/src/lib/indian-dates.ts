// A copy of the app's backend/src/lib/indian-dates.ts (the Advisor's own
// reader), so the site's date reader and the Advisor read a date the same
// way. Copy it again after any change there.
/**
 * How a date written on an Indian item turns into Western years: pure
 * arithmetic over the tables in src/data/mark-tables/indian.json (`dates`),
 * built from the research in the website repo's hallmark-sources/indian/dating/.
 *
 * Indian items write a year as a number in one of a dozen scripts' digits
 * (Devanagari १९५५, Gujarati ૧૯૫૫, Bengali ১৯৫৫, Persian ۱۹۵۵, Tamil's old
 * ௲௯௱௫௰௫ …) beside a word naming the era: संवत् or सं. (Vikram Samvat),
 * शके (Shaka), سنه … هجری or …ھ (Hijri), सन् … ई. or …ء (the Western year),
 * সাল / বঙ্গাব্দ (Bengali San), കൊല്ലം (Kollam), the Burmese and Buddhist eras,
 * and "san … julus" (a Mughal emperor's regnal year). Each era is a fixed
 * offset (Samvat − 57), the Hijri lunar calendar, or a reign.
 *
 * What the rules are, and why the reader is careful:
 *   - a bare number is never read as a date: a word naming the era (or a
 *     word after it, ई. / هجری / A.H.) must stand beside it;
 *   - most Indian years begin partway through the Western year (Chaitra in
 *     March–April, Kārttika in October–November, Muharram anywhere), so a year
 *     written alone is two Western years, and both are given;
 *   - a word several eras share (सन् / san / سنه is used for Hijri, Faslī,
 *     Bengali and Western years) gives every era it could be, unless the word
 *     after the number says which;
 *   - a regnal year needs the ruler's name in the same writing.
 * A date says when the writing claims it was made, not that the item is of
 * that date. The site's date reader (website site/src/lib/indian-dates.ts) is a
 * copy of this file; the table's `examples` are the test set.
 */

// ── Digits ──────────────────────────────────────────────────────────────────
/** Every decimal digit block a date on an Indian, Burmese, Ceylonese or Persian item is written in: its zero, and the script's name. */
export const DIGIT_BLOCKS: ReadonlyArray<readonly [number, string]> = [
  [0x0030, 'Western'], [0x0660, 'Arabic'], [0x06f0, 'Persian/Urdu'], [0x0966, 'Devanagari'], [0x09e6, 'Bengali'], [0x0a66, 'Gurmukhi'],
  [0x0ae6, 'Gujarati'], [0x0b66, 'Odia'], [0x0be6, 'Tamil'], [0x0c66, 'Telugu'], [0x0ce6, 'Kannada'], [0x0d66, 'Malayalam'],
  [0x0de6, 'Sinhala'], [0x1040, 'Burmese'], [0x1090, 'Shan'], [0xa8d0, 'Saurashtra'], [0x11066, 'Brahmi'], [0x111d0, 'Sharada'], [0x116c0, 'Takri'],
];

/** The value of one digit of any of the blocks above, and its script; null for anything else. */
export function digitOf(ch: string): { value: number; script: string } | null {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return null;
  for (const [zero, script] of DIGIT_BLOCKS) if (cp >= zero && cp <= zero + 9) return { value: cp - zero, script };
  return null;
}

/** Tamil's and Malayalam's old way of writing numbers: digits 1–9 and signs for ten, hundred, thousand (௲௮௱௯௰௮ = 1898). */
const TEN_SIGNS: Readonly<Record<string, number>> = { '௰': 10, '௱': 100, '௲': 1000, '൰': 10, '൱': 100, '൲': 1000 };

/**
 * A number written either way: place-value digits in any script (१९५५, ۱۹۵۵,
 * 1955), or Tamil's and Malayalam's tens-hundreds-thousands signs
 * (௲௯௱௫௰௫ = 1955, ௨௲ = 2000). Null when it is not a number.
 */
export function readNumber(s: string): number | null {
  const chars = [...s];
  if (!chars.length) return null;
  if (chars.some((c) => c in TEN_SIGNS)) {
    let total = 0;
    let cur: number | null = null;
    for (const c of chars) {
      const sign = TEN_SIGNS[c];
      if (sign) { total += (cur ?? 1) * sign; cur = null; continue; }
      const d = digitOf(c);
      if (!d) return null;
      cur = cur === null ? d.value : cur * 10 + d.value;
    }
    return total + (cur ?? 0);
  }
  let n = 0;
  for (const c of chars) {
    const d = digitOf(c);
    if (!d) return null;
    n = n * 10 + d.value;
  }
  return n;
}

/** The script a number is written in (its first digit's), or "Tamil" / "Malayalam" for the old signs. */
export function scriptOfNumber(s: string): string {
  for (const c of s) {
    if (c in TEN_SIGNS) return c < 'ഀ' ? 'Tamil' : 'Malayalam';
    const d = digitOf(c);
    if (d) return d.script;
  }
  return 'unknown';
}

// ── Calendars ───────────────────────────────────────────────────────────────
/** The Julian day number at noon of a proleptic Gregorian date. */
export function gregorianToJd(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** The Gregorian date of a Julian day number. */
export function jdToGregorian(jd: number): [number, number, number] {
  const a = Math.floor(jd) + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return [100 * b + d - 4800 + Math.floor(m / 10), m + 3 - 12 * Math.floor(m / 10), e - Math.floor((153 * m + 2) / 5) + 1];
}

/**
 * The Julian day of 1 Muharram of a Hijri year, by the tabular calendar
 * (30-year cycle, leap years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29; epoch
 * 16 July 622 Julian). Real months began at the sighting of the moon, a day
 * or two either side, which never moves a year's span by more than that.
 */
export function hijriYearStartJd(ah: number): number {
  return Math.floor((11 * ah + 3) / 30) + 354 * (ah - 1) + 1948440;
}

/** The Western years a Hijri year falls in: one or (usually) two. */
export function hijriToWestern(ah: number): number[] {
  const first = jdToGregorian(hijriYearStartJd(ah))[0];
  const last = jdToGregorian(hijriYearStartJd(ah + 1) - 1)[0];
  return first === last ? [first] : [first, last];
}

// ── The table's shapes ──────────────────────────────────────────────────────
/**
 * An era as the reader uses it (indian.json `dates.eras`):
 *   words        written before the number (संवत्, सं., शके, سنه, Samvat, A.H.);
 *   after_words  written after it (ई., हिजरी, ھ, ء, A.D., B.E.);
 *   rule         offset: Western = n + add (and n + alt_add, the other candidate);
 *                hijri: the Western years the Hijri year spans;
 *                regnal: the ruler's accession plus the count, from `rulers`;
 *   min, max     the numbers the era is written with on items (a number outside is not read).
 */
export interface IndianEra {
  id: string;
  label: string;
  rule: 'offset' | 'hijri' | 'regnal';
  words: string[];
  after_words?: string[];
  add?: number;
  alt_add?: number | null;
  min?: number | null;
  max?: number | null;
  /** One line on why there are two years, for the reading. */
  why_two?: string | null;
}

/** A ruler whose regnal years are written ("san 12 julus" of Aurangzeb). */
export interface IndianRuler {
  id: string;
  name: string;
  /** Every way the name is written on items: Persian, Devanagari, Latin. */
  names: string[];
  /** Accession, YYYY-MM-DD (Gregorian). */
  accession: string;
  end?: string | null;
  /** How the regnal years ran: from the accession in lunar (Hijri) years, or in solar years. */
  years?: 'lunar' | 'solar';
}

export interface IndianDateReading {
  /** The date as found in the text (era word, number, word after). */
  text: string;
  /** The era's id, or several joined by "|" when the word does not decide. */
  system: string;
  /** The Western year or years it can be, best first. */
  years: number[];
  /** One year, by a rule the sources agree on. */
  exact: boolean;
  confidence: 'high' | 'medium' | 'low';
  /** How the year was worked out, in words. */
  how: string;
  /** The digits' script ("Devanagari", "Persian/Urdu", "Tamil"). */
  numerals: string;
  /** The number as read. */
  number: number;
  /** The ruler, for a regnal year. */
  ruler?: string | null;
}

// ── Reading ─────────────────────────────────────────────────────────────────
const ZW = /[\u200b-\u200d\u2060\ufeff]/g;
/** Letters and vowel signs of the scripts whose writers use their digit zero as an abbreviation dot (सं०, ई०). */
const ABBREV_ZERO = /([ऀ-ॣॱ-ॿঀ-ৣ਀-੣઀-ૣ])[०০੦૦]/g;

/** The text with zero-width marks gone, "सं०" and "सं॰" written "सं.", and nothing else changed. */
export function normalizeIndianText(s: string): string {
  return s.normalize('NFC').replace(ZW, '').replace(/\u0970/g, '.').replace(ABBREV_ZERO, '$1.');
}

/** One number in a text: where it is and what it reads. */
interface Num { at: number; end: number; raw: string; n: number; script: string }
const DIGIT_OR_SIGN = (c: string) => c in TEN_SIGNS || !!digitOf(c);
function numbersIn(t: string): Num[] {
  const cs = [...t];
  const out: Num[] = [];
  let i = 0;
  let pos = 0; // code-unit offset of cs[i]
  while (i < cs.length) {
    if (!DIGIT_OR_SIGN(cs[i])) { pos += cs[i].length; i++; continue; }
    const at = pos;
    let raw = '';
    // A thousands separator inside a year (1,955 / ١٬٩٥٥) is read through.
    while (i < cs.length && (DIGIT_OR_SIGN(cs[i]) || (/[,٬]/.test(cs[i]) && i + 1 < cs.length && DIGIT_OR_SIGN(cs[i + 1]) && raw.length > 0))) {
      if (!/[,٬]/.test(cs[i])) raw += cs[i];
      pos += cs[i].length;
      i++;
    }
    const n = readNumber(raw);
    if (n !== null) out.push({ at, end: pos, raw, n, script: scriptOfNumber(raw) });
  }
  return out;
}

const SEP = '[\\s.:,;\\-–—/।॥()\\[\\]]*';
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * An era word, matched whole: it may touch its number (१९५५ई., ۱۳۱۵ھ) but not
 * be the end or the start of another word (the ھ of a Persian word, the सन् of
 * हसन्, A.H. inside MAHAL). Latin words match in any case.
 */
const wordCache = new Map<string, RegExp>();
function wordRe(w: string, side: 'before' | 'after'): RegExp {
  const key = `${side}\u0000${w}`;
  const hit = wordCache.get(key);
  if (hit) return hit;
  const e = escapeRe(normalizeIndianText(w)).replace(/\\\.\s*/g, '\\.?\\s*').replace(/\s+/g, '\\s*');
  const flags = /^[A-Za-z. ]+$/.test(w) ? 'iu' : 'u';
  const re = side === 'before' ? new RegExp(`(?<![\\p{L}\\p{M}])(${e})${SEP}$`, flags) : new RegExp(`^${SEP}(${e})(?![\\p{L}\\p{M}])`, flags);
  wordCache.set(key, re);
  return re;
}

/** The longest era word ending just before `at` (before) or starting just after `end` (after), and the eras it names. */
function wordsAt(t: string, at: number, end: number, eras: readonly IndianEra[], side: 'before' | 'after'): { word: string; span: [number, number]; ids: string[] } | null {
  const window = side === 'before' ? t.slice(Math.max(0, at - 24), at) : t.slice(end, end + 24);
  let best: { word: string; len: number; ids: Set<string> } | null = null;
  for (const e of eras) {
    for (const w of (side === 'before' ? e.words : e.after_words ?? [])) {
      const m = wordRe(w, side).exec(window);
      if (!m) continue;
      const len = m[1].length;
      if (!best || len > best.len) best = { word: m[1], len, ids: new Set([e.id]) };
      else if (len === best.len) best.ids.add(e.id);
    }
  }
  if (!best) return null;
  const m = side === 'before' ? new RegExp(`${escapeRe(best.word)}${SEP}$`).exec(window) : new RegExp(`^${SEP}${escapeRe(best.word)}`).exec(window);
  const span: [number, number] = side === 'before' ? [at - (m ? m[0].length : best.word.length), at] : [end, end + (m ? m[0].length : best.word.length)];
  return { word: best.word, span, ids: [...best.ids] };
}

const inRange = (e: IndianEra, n: number) => (e.min == null || n >= e.min) && (e.max == null || n <= e.max);
const parseDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return gregorianToJd(y, m || 1, d || 1); };

/** The Western years a regnal year can fall in: from the accession, in lunar or solar years. */
export function regnalToWestern(ruler: IndianRuler, n: number): number[] {
  const start = parseDate(ruler.accession);
  const len = ruler.years === 'solar' ? 365.2425 : 354.367;
  const from = jdToGregorian(Math.floor(start + (n - 1) * len))[0];
  const to = jdToGregorian(Math.floor(start + n * len) - 1)[0];
  return from === to ? [from] : [from, to];
}

/**
 * Every date in one inscription. Each number with an era word beside it is
 * one reading; a number with no era word is not a date. Readings with one
 * year come first.
 */
export function readIndianDates(text: string, eras: readonly IndianEra[], rulers: readonly IndianRuler[] = [], context = ''): IndianDateReading[] {
  const t = normalizeIndianText(text);
  // A coin names its ruler on one face and the regnal year on the other: the ruler may be in the context.
  const named = context ? `${t} ${normalizeIndianText(context)}` : t;
  const out: IndianDateReading[] = [];
  const byId = new Map(eras.map((e) => [e.id, e]));
  for (const num of numbersIn(t)) {
    const before = wordsAt(t, num.at, num.end, eras, 'before');
    const after = wordsAt(t, num.at, num.end, eras, 'after');
    if (!before && !after) continue;
    // The word after a number is the more specific (सन् … ई. is a Western year): keep the eras both name, else the one after.
    let ids = before && after ? before.ids.filter((id) => after.ids.includes(id)) : (before ?? after)!.ids;
    if (!ids.length) ids = after!.ids;
    const cands = ids.map((id) => byId.get(id)!).filter((e) => inRange(e, num.n));
    if (!cands.length) continue;
    const from = before ? before.span[0] : num.at;
    const to = after ? after.span[1] : num.end;
    const written = t.slice(from, to).trim();
    const base = { text: written, numerals: num.script, number: num.n };

    if (cands.length > 1) {
      // A word several eras share: every era it could be.
      const years = cands.flatMap((e) => yearsFor(e, num.n, named, rulers).years).filter((y, i, a) => a.indexOf(y) === i).sort((a, b) => a - b);
      if (!years.length) continue;
      out.push({ ...base, system: cands.map((e) => e.id).join('|'), years, exact: false, confidence: 'low', how: `the word does not say which era: ${cands.map((e) => `${e.label} ${yearsFor(e, num.n, named, rulers).years.join('–') || '?'}`).join('; ')}` });
      continue;
    }
    const e = cands[0];
    const r = yearsFor(e, num.n, named, rulers);
    if (!r.years.length) continue;
    out.push({ ...base, system: e.id, years: r.years, exact: r.years.length === 1, confidence: r.years.length === 1 ? 'high' : 'medium', how: r.how, ruler: r.ruler ?? null });
  }
  return out.sort((a, b) => Number(b.exact) - Number(a.exact));
}

/** The rulers a text names, by the longest name found (شاه عالم ثانی before شاه عالم); several when the same name fits several (Alamgir). */
export function rulersNamed(text: string, rulers: readonly IndianRuler[]): IndianRuler[] {
  const flat = normalizeIndianText(text).toLowerCase();
  let best = 0;
  let found: IndianRuler[] = [];
  for (const r of rulers) {
    const len = Math.max(0, ...r.names.filter(Boolean).map((nm) => normalizeIndianText(nm).toLowerCase()).filter((nm) => flat.includes(nm)).map((nm) => nm.length));
    if (!len) continue;
    if (len > best) { best = len; found = [r]; } else if (len === best) found.push(r);
  }
  return found;
}

function yearsFor(e: IndianEra, n: number, t: string, rulers: readonly IndianRuler[]): { years: number[]; how: string; ruler?: string } {
  if (e.rule === 'hijri') {
    const years = hijriToWestern(n);
    return { years, how: years.length === 1 ? `Hijri year ${n} falls within ${years[0]}` : `Hijri year ${n} ran from ${years[0]} into ${years[1]}` };
  }
  if (e.rule === 'regnal') {
    const named = rulersNamed(t, rulers);
    if (!named.length) return { years: [], how: 'a regnal year needs the ruler’s name' };
    const years = [...new Set(named.flatMap((r) => regnalToWestern(r, n)))].sort((a, b) => a - b);
    const each = named.map((r) => `${r.name} (accession ${r.accession}, ${r.years === 'solar' ? 'solar' : 'lunar'} years)`);
    return {
      years,
      how: named.length === 1 ? `year ${n} of the reign of ${each[0]}` : `year ${n} of a reign, and the name fits more than one ruler: ${each.join(' or ')}`,
      ruler: named.map((r) => r.name).join(' or '),
    };
  }
  const y1 = n + (e.add ?? 0);
  const years = e.alt_add != null && e.alt_add !== e.add ? [y1, n + e.alt_add].sort((a, b) => a - b) : [y1];
  return {
    years,
    how: years.length === 1 ? `${e.label} ${n} ${(e.add ?? 0) < 0 ? '−' : '+'} ${Math.abs(e.add ?? 0)}` : `${e.label} ${n} began in ${years[0]} and ended in ${years[1]}${e.why_two ? ` (${e.why_two})` : ''}`,
  };
}
