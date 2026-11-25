// The scripts of India, Burma, Ceylon and Persian/Urdu writing, as the site
// sets them: which face each is set in (a Noto serif from Google Fonts,
// requested only for the characters a page sets), the class and lang a run of
// them takes, and which way it reads. Marks in these scripts run in a line,
// left to right, except Persian and Urdu (Nastaliq), right to left; they are
// never set in columns as Chinese, Japanese and Korean marks are.
export type IndicScript = {
  name: string;
  /** Unicode block(s), as a character class body. */
  range: string;
  /** Google Fonts family. */
  family: string;
  lang: string;
  rtl?: boolean;
};

export const SCRIPTS: IndicScript[] = [
  { name: 'Devanagari', range: '\\u0900-\\u097F\\uA8E0-\\uA8FF', family: 'Noto Serif Devanagari', lang: 'hi' },
  { name: 'Bengali', range: '\\u0980-\\u09FF', family: 'Noto Serif Bengali', lang: 'bn' },
  { name: 'Gurmukhi', range: '\\u0A00-\\u0A7F', family: 'Noto Serif Gurmukhi', lang: 'pa' },
  { name: 'Gujarati', range: '\\u0A80-\\u0AFF', family: 'Noto Serif Gujarati', lang: 'gu' },
  { name: 'Odia', range: '\\u0B00-\\u0B7F', family: 'Noto Serif Oriya', lang: 'or' },
  { name: 'Tamil', range: '\\u0B80-\\u0BFF', family: 'Noto Serif Tamil', lang: 'ta' },
  { name: 'Telugu', range: '\\u0C00-\\u0C7F', family: 'Noto Serif Telugu', lang: 'te' },
  { name: 'Kannada', range: '\\u0C80-\\u0CFF', family: 'Noto Serif Kannada', lang: 'kn' },
  { name: 'Malayalam', range: '\\u0D00-\\u0D7F', family: 'Noto Serif Malayalam', lang: 'ml' },
  { name: 'Sinhala', range: '\\u0D80-\\u0DFF', family: 'Noto Serif Sinhala', lang: 'si' },
  { name: 'Burmese', range: '\\u1000-\\u109F', family: 'Noto Serif Myanmar', lang: 'my' },
  { name: 'Persian/Urdu', range: '\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF', family: 'Noto Nastaliq Urdu', lang: 'fa', rtl: true },
];
const RE = SCRIPTS.map((s) => ({ s, re: new RegExp(`[${s.range}]`) }));
/** Any character of these scripts. */
export const INDIC = new RegExp(`[${SCRIPTS.map((s) => s.range).join('')}]`);

/** The script of a run of text (its first such character's), or null. */
export function scriptOf(text: string): IndicScript | null {
  for (const ch of text) for (const { s, re } of RE) if (re.test(ch)) return s;
  return null;
}

/** The class, lang and direction a run of these characters is set with. */
export function indicFace(text: string): { cls: 'indic' | 'nastaliq'; lang: string; dir: 'ltr' | 'rtl' } | null {
  const s = scriptOf(text);
  if (!s) return null;
  return { cls: s.rtl ? 'nastaliq' : 'indic', lang: s.lang, dir: s.rtl ? 'rtl' : 'ltr' };
}

/** The Google Fonts request for the characters a page sets: only the faces its scripts need, subset to those characters. */
export function indicFontUrl(chars: string | undefined): string | null {
  if (!chars) return null;
  const used = [...new Set([...chars].filter((c) => INDIC.test(c)))].join('');
  if (!used) return null;
  const families = SCRIPTS.filter((s) => new RegExp(`[${s.range}]`).test(used)).map((s) => `family=${s.family.replace(/ /g, '+')}`);
  // Digits and the danda the faces share are part of the subset too.
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap&text=${encodeURIComponent(used + '0123456789.।॥')}`;
}
