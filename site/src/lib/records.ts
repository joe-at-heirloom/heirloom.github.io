// A record of the collection as a reader sees it: the sheet. One shape for
// every family (a hall mark, a Japanese kiln mark, a Korean inscription, a
// British maker's mark), so every catalogue shows a record the same way:
// the mark (its picture, or its characters set in type), what it reads and
// means, the facts with labels in plain words, where the sources differ, a
// caution if there is one, and the sources, numbered.
//
// Research notes are not reader's words: the sheet leaves out what only says
// a source was silent ("not stated in sources read", "gap"), tidies spacing
// the citation markers left behind, and puts the site's words in (soften).
import { collection, SEAL_KINDS, urlOf, type Rec, type Img } from './portal';
import { soften } from './site';
import { media } from './media';
import { indicFace } from './scripts';

export type Pic = { file: string; status: string; credit: string; url: string | null; alt: string };
export type Fact = { label: string; text: string };
export type Differ = { label: string; values: { text: string; refs: number[] }[] };
export type Sheet = {
  id: string;
  anchor: string;
  url: string;
  kind: string;
  /** The characters of the mark, when it is written in them. */
  glyphs: string | null;
  /** false: the glyphs name the mark but are not what is written (a crest, a seal described as a pattern), so no specimen is set in type. */
  typeset?: boolean;
  lang: 'zh' | 'ja' | 'ko' | 'in' | null;
  /** How it is read aloud (pinyin, romaji, Revised Romanization), or its English name. */
  reading: string;
  means: string | null;
  /** The meaning is Heirloom's English for the mark's own words (a translation): the voice rules leave it alone. */
  meansTr?: boolean;
  years: string | null;
  facts: Fact[];
  differ: Differ[];
  caution: string | null;
  pics: Pic[];
  sources: { citation: string; url: string | null; where: string | null }[];
  single: boolean;
  /** Where to go next from this record: another part of the reference that reads the same item (an office's date letters). */
  links?: { label: string; href: string }[];
  /** Where to see the mark when its pictures aren't free to copy (components/SeeAt.tsx). */
  seeAt?: unknown;
  group: string;
  /** Everything a reader might type to find it, lower-cased. */
  keys: string;
};

export const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯ᄀ-ᇿ]/;
const SILENT = [
  /\bno source (read )?(documents|records|gives|states)[^.;]*[.;]?\s*(gap\.?)?/gi,
  /;?\s*\b(script|colou?r|mark colou?r|placement)?\s*not (explicitly )?stated in (the )?sources? read\b[^.;]*[.;]?/gi,
  /;?\s*\bgap\.?\s*$/gi,
  /^\s*\(literal\)\s*/i,
  // A transcriber speaking for themself ("I cannot read letters").
  /;?\s*\bI (cannot|can't|could not|can not) (read|make out)[^.;]*[.;]?/gi,
  // A researcher's "(per <source>)": the sheet lists its sources, numbered.
  /\s*\(per [^()]*\)/gi,
];
/** A researcher's line in a reader's words, or null when nothing is left. */
export function clean(s: unknown): string | null {
  if (s == null) return null;
  let t = String(s);
  for (const re of SILENT) t = t.replace(re, '');
  t = t
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/^[\s;,.:]+|[\s;,:]+$/g, '')
    .trim();
  if (!t || /^(unknown|none|n\/a|-|—)$/i.test(t)) return null;
  return voice(soften(t.charAt(0).toUpperCase() + t.slice(1)));
}

// The site's words (docs/VOICE.md, the copy check): American spelling, "item"
// for an owner's thing, "specialist" for an expert, nothing "for sale".
// "Catalogue" stays: it is the trade's word, and Joe's (D72).
const SPELL: [RegExp, string][] = [
  [/\bcolour/g, 'color'], [/\bColour/g, 'Color'], [/\bfavour/g, 'favor'], [/\bFavour/g, 'Favor'], [/\bhonour/g, 'honor'], [/\bHonour/g, 'Honor'],
  [/\bneighbour/g, 'neighbor'], [/\bNeighbour/g, 'Neighbor'], [/\brecognis/g, 'recogniz'], [/\breorganis/g, 'reorganiz'], [/\borganis/g, 'organiz'],
  [/\bCentre\b/g, 'Center'], [/\blicence\b/g, 'license'],
  [/\bobjects\b(?! \d)/g, 'items'], [/\bObjects\b(?! \d)/g, 'Items'], [/\bobject\b(?! \d)/g, 'item'], [/\bObject\b(?! \d)/g, 'Item'],
  [/\bnot every item\b/g, 'not all items'], [/\bNot every item\b/g, 'Not all items'],
  [/(\d)-piece\b/g, '$1-item'], [/\bexperts\b/g, 'specialists'], [/\bexpert\b/g, 'specialist'], [/\bfor sale to\b/g, 'to be sold to'],
];
export function voice(t: string) {
  let out = t;
  for (const [re, to] of SPELL) out = out.replace(re, to);
  // "a piece" softened to "a item": an item.
  return out.replace(/\b([Aa]) item/g, '$1n item');
}

export function yearsOf(a?: number | null, b?: number | null): string | null {
  if (a == null && b == null) return null;
  if (a != null && b != null) return a === b ? String(a) : `${a}–${b}`;
  return a != null ? `from ${a}` : `to ${b}`;
}

/** Pinyin as the site writes it in a list: tone marks kept, one capital. */
export function tidyReading(s: string) {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t;
}

const STATUS: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };
export const statusWord = (s: string) => STATUS[s] ?? 'Picture';

// ── The collection, indexed once ────────────────────────────────────────────
let ix: { img: Map<string, Img>; src: Map<string, { citation: string; url?: string | null }>; kids: Map<string, Rec[]> } | null = null;
function index() {
  if (ix) return ix;
  const c = collection();
  const kids = new Map<string, Rec[]>();
  for (const r of c.records) if (r.parent_id && !SEAL_KINDS.has(r.kind)) (kids.get(r.parent_id) ?? kids.set(r.parent_id, []).get(r.parent_id)!).push(r);
  return (ix = { img: new Map(c.images.map((i) => [i.id, i])), src: new Map(c.sources.map((s) => [s.id, s])), kids });
}
export const childrenOf = (id: string) => index().kids.get(id) ?? [];
// A record's links to where its mark can be seen (attributes.see_at), by the collection's id.
let byId: Map<string, Rec> | null = null;
const seeAtOf = (id: string) => (byId ??= new Map(collection().records.map((r) => [r.id, r]))).get(id)?.attributes?.see_at;

function picOf(r: Rec): Pic | null {
  const i = r.image_id ? index().img.get(r.image_id) : undefined;
  if (!i?.file) return null;
  return { file: media(i.file), status: i.status, credit: i.credit ?? '', url: i.source_url ?? null, alt: clean(r.looks_like) ?? r.name };
}

/** Sources numbered for one sheet; a disagreement's source ids resolve to the same numbers. */
function numbered(r: Rec) {
  const { src } = index();
  const prefix = r.sources[0]?.id.includes(':') ? r.sources[0].id.split(':')[0] + ':' : '';
  const list: { id: string; citation: string; url: string | null; where: string | null }[] = [];
  const at = new Map<string, number>();
  const add = (id: string, where: string | null = null) => {
    const key = src.has(id) ? id : src.has(prefix + id) ? prefix + id : null;
    if (!key) return null;
    if (!at.has(key)) { at.set(key, list.length + 1); const s = src.get(key)!; list.push({ id: key, citation: s.citation, url: s.url ?? null, where }); }
    return at.get(key)!;
  };
  for (const s of r.sources) add(s.id, s.where ?? null);
  return { list, add };
}

function differences(r: Rec, add: (id: string) => number | null, labels: Record<string, string>): Differ[] {
  const raw = Array.isArray(r.attributes?.disagreements) ? r.attributes.disagreements : [];
  const out: Differ[] = [];
  for (const d of raw) {
    const label = labels[String(d?.field ?? '')];
    if (!label || !Array.isArray(d.values)) continue;
    const values = d.values
      .map((v: any) => ({ text: clean(v?.value) ?? '', refs: (v?.source_ids ?? []).map((id: string) => add(id)).filter((n: number | null): n is number => n != null) }))
      .filter((v: { text: string }) => v.text);
    if (values.length > 1) {
      const same = out.find((o) => o.label === label);
      if (same) same.values.push(...values); else out.push({ label, values });
    }
  }
  return out;
}

const keysOf = (...parts: unknown[]) => [...new Set(parts.flat().filter(Boolean).map((p) => String(p).toLowerCase()))].join(' ');

// ── Chinese hall marks ──────────────────────────────────────────────────────
export const HALL_GROUPS: [string, string, string][] = [
  ['imperial', 'Emperors, empresses and palace buildings', 'Halls of the imperial palaces and gardens, and the studios of emperors and their consorts.'],
  ['private', 'Princes, officials, scholars and private studios', 'Marks ordered by princes, officials and collectors, or used by private kilns and studios.'],
  ['republic', 'Republic-period halls', 'Halls of the Republic (1912–1949), among them Yuan Shikai’s Hall of Benevolence.'],
  ['painter', 'Jingdezhen painters’ studios, Republic period', 'The studios of porcelain painters at Jingdezhen in the 1910s to 1940s.'],
  ['placement', 'Palace placement inscriptions', 'Not makers’ marks: the name of the hall an item was made to stand in.'],
];
const HALL_DIFFER = { owner: 'Whose hall', periods: 'When', wares: 'Found on', script: 'How it is written', placement_colour: 'Where, and in what color' };

export function hallSheet(r: Rec): Sheet {
  const a = r.attributes;
  const [chars, ...rest] = r.name.split(' ');
  const { list, add } = numbered(r);
  const periods = (Array.isArray(a.periods) ? a.periods : [])
    .map((p: any) => `${p.period}${p.start ? ` (${p.start === p.end || !p.end ? p.start : `${p.start}–${p.end}`})` : ''}`)
    .join('; ');
  const pics = childrenOf(r.id).map(picOf).filter((p): p is Pic => !!p)
    // A photograph of the mark on a real item first, then the book's cut.
    .sort((x, y) => (x.status === 'photo' ? 0 : 1) - (y.status === 'photo' ? 0 : 1));
  const variants = r.keys.filter((k) => CJK.test(k) && k !== chars);
  const owner = [clean(a.owner), clean(a.owner_dates)].filter(Boolean).join(' ');
  return {
    id: r.id, anchor: r.anchor ?? r.id, url: urlOf(r), kind: 'Hall mark', group: String(a.hall_kind ?? 'private'),
    glyphs: chars, lang: 'zh', reading: tidyReading(rest.join(' ')), means: clean(r.summary), meansTr: true,
    years: yearsOf(r.date_from, r.date_to),
    facts: [
      ['Whose hall', owner],
      ['When', periods],
      ['Also written', variants.join('、')],
      ['How it is written', clean(a.script)],
      ['Where, and in what color', clean(a.placement_colour)],
      ['Found on', clean(a.wares)],
      ['Later copies', clean(a.later_copies_note)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: differences(r, add, HALL_DIFFER),
    caution: null,
    pics, sources: list, single: r.single_source, seeAt: r.attributes?.see_at,
    keys: keysOf(r.keys, chars, rest.join(' '), r.summary, owner),
  };
}

// ── Any record: the fields every family shares ──────────────────────────────
const APPLIED: Record<string, string> = { struck: 'Struck (punched into the metal)', impressed: 'Impressed into the clay', stamped: 'Stamped', printed: 'Printed', painted: 'Painted', incised: 'Incised', 'printed or stamped': 'Printed or stamped' };
export function sheet(r: Rec, group = ''): Sheet {
  const a = r.attributes ?? {};
  const { list, add } = numbered(r);
  const [first, ...rest] = r.name.split(' ');
  const cjk = CJK.test(first) ? first : null;
  const own = picOf(r);
  const pics = [own, ...childrenOf(r.id).map(picOf)].filter((p): p is Pic => !!p);
  return {
    id: r.id, anchor: r.anchor ?? r.id, url: urlOf(r), kind: r.kind.charAt(0).toUpperCase() + r.kind.slice(1), group,
    glyphs: cjk, lang: cjk ? (/[぀-ヿ]/.test(cjk) ? 'ja' : /[가-힯]/.test(cjk) ? 'ko' : 'zh') : null,
    reading: cjk ? rest.join(' ') : r.name, means: clean(r.summary),
    years: yearsOf(r.date_from, r.date_to),
    facts: [
      ['What it looks like', clean(r.looks_like)],
      ['How it was applied', a.applied ? APPLIED[a.applied] ?? clean(a.applied) : null],
      ['Maker', clean(r.maker)],
      ['Place', clean(r.place)],
      ['Dates', clean(r.date_note)],
      ['Seen on', clean(a.seen_on)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: differences(r, add, { date_from: 'From', date_to: 'Until', maker: 'Maker', place: 'Place', means: 'What it means' }),
    caution: clean(a.caution ?? a.cautions),
    pics, sources: list, single: r.single_source, seeAt: r.attributes?.see_at,
    keys: keysOf(r.keys, r.name, r.maker, r.place, r.summary),
  };
}

// ── The face a mark's characters are set in ─────────────────────────────────
const HANGUL = /[가-힯ᄀ-ᇿ]/;
const KANA = /[぀-ヿ]/;
/** The site's class for a run of characters (its font), and its lang attribute. */
export function faceOf(text: string, lang: Sheet['lang']): { cls: 'han' | 'ja' | 'hangul' | 'indic' | 'nastaliq' | ''; lang: string } {
  const ind = indicFace(text);
  if (ind) return { cls: ind.cls, lang: ind.lang };
  // An Indian record's Latin letters (P. ORR & SONS) are set like the page's own text.
  if (lang === 'in') return { cls: '', lang: 'en' };
  if (HANGUL.test(text)) return { cls: 'hangul', lang: 'ko' };
  if (KANA.test(text) || lang === 'ja') return { cls: 'ja', lang: 'ja' };
  return { cls: 'han', lang: lang === 'ko' ? 'ko' : 'zh-Hant' };
}

// ── Japanese marks (lib/japanese.ts) ────────────────────────────────────────
import type { JaMark } from './japanese';
const jaPic = (p: { file: string; kind: string; credit: string; url: string | null; label: string; caption: string }): Pic => ({
  file: media(p.file), status: p.kind === 'museum' ? 'photo' : p.kind === 'book' ? 'facsimile' : 'rendering',
  credit: p.credit, url: p.url, alt: p.caption || p.label,
});
export function jaSheet(m: JaMark): Sheet {
  // A mark shown first only when its picture shows the mark; the other views follow it.
  const shows = m.photos.filter((p) => p.visible === 'yes' || p.kind !== 'museum');
  const rest = m.photos.filter((p) => !shows.includes(p));
  const flat = (x: string) => x.toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '');
  const others = m.spellings.filter((x) => flat(x) !== flat(m.romaji) && flat(x) !== flat(m.romajiPlain ?? ''));
  // The sheet's sources, numbered; a fact's own sources (citations) take the same numbers.
  const sources = m.sources.map((s) => ({ citation: s.citation, url: s.url, where: null as string | null }));
  const num = (c: string) => {
    let i = sources.findIndex((s) => s.citation === c);
    if (i < 0) { sources.push({ citation: c, url: null, where: null }); i = sources.length - 1; }
    return i + 1;
  };
  // Where the sources disagree: the research writes each as a fact beginning
  // "Sources differ on the <field>: …" or "Another source differs: …".
  const differ: Differ[] = [];
  for (const f of m.facts) {
    const on = /^Sources differ on (?:the )?([^:]+):\s*(.+)$/s.exec(f.text);
    const another = /^Another source differs:\s*(.+)$/s.exec(f.text);
    if (!on && !another) continue;
    const label = on ? on[1].charAt(0).toUpperCase() + on[1].slice(1) : 'Another source';
    const text = clean(on ? on[2] : another![1]);
    if (!text) continue;
    const refs = [...new Set(f.sources.map(num))];
    const same = differ.find((d) => d.label === label);
    if (same) same.values.push({ text, refs }); else differ.push({ label, values: [{ text, refs }] });
  }
  return {
    id: m.id, anchor: m.slug, url: `/marks/japanese/#${m.slug}`, kind: m.kind, group: m.group,
    glyphs: m.chars || null, lang: 'ja', reading: m.romaji,
    // A crest is a picture, and a seal described as a pattern (極 + 子丑寅… + 月) is not one mark (main 0ab5985).
    typeset: m.family !== 'crests' && !/[+＋／]/.test(m.chars), means: clean(m.meaning), meansTr: true,
    years: yearsOf(m.from, m.to),
    facts: [
      ['Read as', m.kana],
      ['Also written', m.variants.join('、')],
      ['Other spellings', others.join(', ')],
      ['What it looks like', clean(m.device)],
      ['How it was applied', clean(m.technique)],
      ['Where on the item', clean(m.where)],
      ['The mark', m.markForm ? [m.markForm.chars, m.markForm.shape].map((x) => clean(x)).filter(Boolean).join('; ') : null],
      ['How the mark is put on', m.markForm ? clean(m.markForm.applied) : null],
      ['Where the mark is', m.markForm ? clean(m.markForm.position) : null],
      ['Color', m.markForm ? clean(m.markForm.colour) : null],
      ['Its forms over the years', m.markForm?.variants?.length ? m.markForm.variants.map((v) => [v.period, v.form].map((x) => clean(x)).filter(Boolean).join(': ')).filter(Boolean).join('; ') : null],
      ['Found on', m.wares.map((w) => clean(w)).filter(Boolean).join('; ')],
      ['Maker', clean(m.maker)],
      ['Artist', clean(m.artist)],
      ['Dates', clean(m.dateNote)],
      ['What it tells you', clean(m.tells)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ, caution: clean(m.cautions),
    pics: [...shows, ...rest].map(jaPic), seeAt: seeAtOf(m.id),
    sources, single: m.singleSource,
    keys: keysOf(m.keys, m.chars, m.variants, m.kana, m.romaji, m.romajiPlain, m.spellings, m.meaning, m.maker, m.artist),
  };
}

// ── Korean inscriptions (lib/korean.ts) ─────────────────────────────────────
import type { Insc } from './korean';
export function koSheet(m: Insc): Sheet {
  const shows = m.photos.filter((p) => p.visible === 'yes');
  const rest = m.photos.filter((p) => p.visible !== 'yes');
  return {
    id: m.id, anchor: m.slug, url: `/marks/korean/#${m.slug}`, kind: m.kind, group: m.group,
    glyphs: m.chars || m.hangul || null, lang: 'ko', reading: m.rr, means: clean(m.meaning), meansTr: true,
    years: yearsOf(m.from, m.to),
    facts: [
      ['In hangul', m.hangul && m.hangul !== m.chars ? m.hangul : null],
      ['Also written', m.variants.join('、')],
      ['Older romanization', m.mr && m.mr !== m.rr ? m.mr : null],
      ['How it was applied', clean(m.technique)],
      ['Where on the item', clean(m.where)],
      ['Found on', m.wares.map((w) => clean(w)).filter(Boolean).join('; ')],
      ['Maker', clean(m.maker)],
      ['Place', clean(m.place)],
      ['Dates', clean(m.dateNote)],
      ['What it tells you', clean(m.tells)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(m.cautions),
    pics: [...shows, ...rest].map((p) => ({ file: media(p.file), status: p.status ?? 'photo', credit: p.credit, url: p.url, alt: p.caption || p.label })), seeAt: seeAtOf(m.id),
    sources: m.sources.map((s) => ({ citation: s.citation, url: s.url, where: null })), single: m.singleSource,
    keys: keysOf(m.keys, m.chars, m.variants, m.hangul, m.rr, m.mr, m.meaning, m.maker, m.place),
  };
}

// ── Indian marks (lib/indian.ts) ────────────────────────────────────────────
import type { InMark } from './indian';
/**
 * A mark from India, Burma or Ceylon. A mark in Latin letters (P. ORR & SONS)
 * is its own reading and is never set in type: struck letters in a punch are
 * not a typeface. A mark in an Indian script (or Burmese, or Persian) is set in
 * type in a line, labelled so, with its transliteration as the reading.
 */
export function inSheet(m: InMark): Sheet {
  const shows = m.photos.filter((p) => p.visible === 'yes');
  const rest = m.photos.filter((p) => p.visible !== 'yes');
  const hall = m.id.startsWith('in-hm-');
  const flat = (x: string) => x.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
  const reading = m.native ? (m.translit || m.plain) : (m.markText || m.plain);
  const others = m.spellings.filter((x) => flat(x) !== flat(reading) && flat(x) !== flat(m.plain));
  return {
    id: m.id, anchor: m.slug, url: `${hall ? '/marks/indian-hallmarks' : '/marks/indian/'}#${m.slug}`, kind: m.kind.charAt(0).toUpperCase() + m.kind.slice(1), group: m.group,
    glyphs: m.native || null, lang: 'in', reading, means: clean(m.meaning),
    years: yearsOf(m.from, m.to),
    facts: [
      ['Struck as', m.native && m.markText ? m.markText : null],
      ['Read as', m.native && m.plain && flat(m.plain) !== flat(reading) ? m.plain : null],
      ['Also written', m.variants.join(' · ')],
      ['Other spellings', others.join(', ')],
      ['What it looks like', clean(m.device)],
      ['Struck with it', clean(m.punchSet)],
      ['How it was applied', clean(m.technique)],
      ['Where on the item', clean(m.where)],
      ['Standard', clean(m.fineness)],
      ['Found on', m.wares.map((w) => clean(w)).filter(Boolean).join('; ')],
      ['Maker', m.maker ? clean([m.maker, m.place, m.makerYears].filter(Boolean).join(', ')) : null],
      ['Dates', clean(m.dateNote)],
      ['What it tells you', clean(m.tells)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(m.cautions),
    pics: [...shows, ...rest].map((p) => ({ file: media(p.file), status: p.status, credit: p.credit, url: p.url, alt: p.caption || p.label })),
    sources: m.sources.map((s) => ({ citation: s.citation, url: s.url, where: null })), single: m.singleSource,
    keys: keysOf(m.keys, m.markText, m.native, m.translit, m.plain, m.variants, m.spellings, m.meaning, m.maker, m.place),
  };
}

// ── Indian figures and the seals on paintings (lib/indian.ts, phase 2) ──────
import type { FigRow, SealRow } from './indian';
const RELIGION: Record<string, string> = { hindu: 'Hindu', buddhist: 'Buddhist', jain: 'Jain' };
/** A figure by who it shows: its signs in plain words, the look-alikes and how to tell them, the regions and styles. */
export function figSheet(f: FigRow): Sheet {
  const list = (a: string[]) => a.join(', ');
  return {
    id: f.id, anchor: f.slug, url: `/marks/indian-figures#${f.slug}`, kind: `${RELIGION[f.religion] ?? ''} ${f.kind}`.trim(), group: f.group,
    glyphs: f.native[0] ?? null, lang: 'in', reading: f.name, means: clean(f.identifyBy), meansTr: false,
    years: null,
    facts: [
      ['Also called', [f.iast, ...f.other].filter((x) => x && x !== f.name).join(', ')],
      ['In its own script', f.native.join(' · ')],
      ['Arms', f.arms.length ? f.arms.join(' or ') : null],
      ['In the hands', list(f.holds)],
      ['Gestures', list(f.gestures)],
      ['Beneath or beside', list(f.mount)],
      ['Pose', list(f.posture)],
      ['Head and body', list(f.headBody)],
      ['Emblem on the pedestal', f.emblems.join(' or ')],
      ['Other signs', clean(f.features)],
      ['Look-alikes', f.lookAlikes.map((l) => `${l.name}: ${l.how}`).join(' ')],
      ['Where and when', clean(f.regions)],
      ['What style can say', clean(f.dating)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(f.cautions),
    pics: f.photos.map((p) => ({ file: media(p.file), status: p.status, credit: p.credit, url: p.url, alt: p.caption || f.name })),
    sources: f.sources.map((x) => ({ citation: x.citation, url: x.url, where: null })), single: f.singleSource,
    keys: keysOf(f.name, f.iast, f.native, f.other, f.holds, f.mount, f.posture, f.headBody, f.emblems),
  };
}
/** A seal or note on a painting: its Persian as written (set in Nastaliq), whose it is, what it tells. */
export function sealSheet(r: SealRow): Sheet {
  return {
    id: r.id, anchor: r.slug, url: `/marks/indian-paintings#${r.slug}`, kind: r.kind.charAt(0).toUpperCase() + r.kind.slice(1), group: r.kind,
    glyphs: r.native, lang: 'in', reading: r.translit || r.meaning || r.slug, means: clean(r.meaning), meansTr: true,
    years: yearsOf(r.from, r.to),
    facts: [
      ['Whose', clean(r.owner)],
      ['Where on the painting', clean(r.where)],
      ['Dates', clean(r.dateNote)],
      ['What it tells you', clean(r.tells)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(r.cautions), pics: [],
    sources: r.sources.map((x) => ({ citation: x.citation, url: x.url, where: null })), single: r.singleSource,
    keys: keysOf(r.native, r.translit, r.meaning, r.owner, r.kind),
  };
}

// ── Indian decorative arts (lib/indian.ts, phase 3) ───────────────────────────
import type { CraftRow } from './indian';
/** A craft: what it is, how to recognize it, the marks and labels on it, what was made later and how sources tell old from new. */
export function craftSheet(c: CraftRow): Sheet {
  const list = (a: string[]) => a.join(', ');
  return {
    id: c.id, anchor: c.slug, url: `/marks/indian-crafts#${c.slug}`, kind: c.kind.charAt(0).toUpperCase() + c.kind.slice(1), group: c.group,
    glyphs: c.native[0] ?? null, lang: 'in', reading: c.name, means: clean(c.identifyBy), meansTr: false,
    years: yearsOf(c.from, c.to),
    facts: [
      ['Also called', list(c.other.filter((x) => x !== c.name))],
      ['In its own script', c.native.join(' · ')],
      ['Materials', list([...c.materials, ...c.woods.map((w) => `${w} wood`)])],
      ['Techniques', list(c.techniques)],
      ['Found as', list(c.forms)],
      ['Where', list(c.regions)],
      ['How to recognize it', c.recognize.map((x) => clean(x)).filter(Boolean).join(' ')],
      ['Marks and labels', clean(c.marks)],
      ['Made later', clean(c.later)],
      ['Old or new', clean(c.tellOld)],
      ['Not to confuse with', c.lookAlikes.map((l) => `${l.name}: ${l.how}`).join(' ')],
      ['Other signs', clean(c.features)],
      ['Dates', clean(c.dateNote)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(c.cautions),
    pics: c.photos.map((p) => ({ file: media(p.file), status: p.status, credit: p.credit, url: p.url, alt: p.caption || c.name })),
    sources: c.sources.map((x) => ({ citation: x.citation, url: x.url, where: null })), single: c.singleSource,
    keys: keysOf(c.name, c.native, c.other, c.materials, c.woods, c.techniques, c.forms, c.regions),
  };
}

// ── Chinese imperial collection seals ───────────────────────────────────────
export const SEAL_DYNASTIES: [string, string, string][] = [
  ['tang', 'Southern Tang', 'The seals of the Southern Tang court (937–975), the oldest imperial collection seals recorded.'],
  ['song', 'Song', 'Huizong’s seven Xuanhe seals, Gaozong’s Shaoxing seals and the Southern Song palace seals.'],
  ['jin', 'Jin', 'Zhangzong’s seven Mingchang seals, modeled on Huizong’s.'],
  ['yuan', 'Yuan', 'The Kuizhang Pavilion and the Yuan palace collection.'],
  ['ming', 'Ming', 'State, princely and storehouse seals: the early Ming palace did not seal its paintings as the Qing did.'],
  ['qing', 'Qing', 'Qianlong’s catalogue seals (the 石渠寶笈 and 祕殿珠林), the hall seals, and the inventory seals of Puyi’s court.'],
];
const dynKey = (d: string) => (/tang/i.test(d) ? 'tang' : /song/i.test(d) ? 'song' : /jin/i.test(d) ? 'jin' : /yuan/i.test(d) ? 'yuan' : /ming/i.test(d) ? 'ming' : 'qing');
const SCRIPT_WORD = (s: string) => {
  const t = clean(s);
  if (!t || /not confirmed/i.test(t)) return null;
  return t.replace(/^Mostly zhuwen/i, 'Mostly red characters (zhuwen)').replace(/^Zhuwen(?! \()/i, 'Red characters (zhuwen)').replace(/^Baiwen(?! \()/i, 'White characters (baiwen)')
    .replace(/^Zhuwen \(red characters\)/i, 'Red characters (zhuwen)').replace(/^Baiwen \(white characters\)/i, 'White characters (baiwen)').replace(/^Zhuwen \(陽文\)/, 'Red characters (zhuwen, 陽文)');
};
export function imperialSheet(r: Rec): Sheet {
  const a = r.attributes;
  const [chars, ...rest] = r.name.split(' ');
  const { list } = numbered(r);
  const seen = (Array.isArray(a.museum_examples) ? a.museum_examples : []).slice(0, 4)
    .map((m: any) => `${String(m.object ?? '').replace(/\u3000/g, ' ').trim()}${m.npm_no ? ' (National Palace Museum, Taipei)' : ''}`).filter(Boolean);
  return {
    id: r.id, anchor: r.anchor ?? r.id.replace(/^imperial-seal-/, ''), url: urlOf(r), kind: 'Imperial collection seal', group: dynKey(String(a.dynasty ?? '')),
    glyphs: String(a.characters ?? chars), lang: 'zh', reading: tidyReading(rest.join(' ')), means: clean(a.english), meansTr: true,
    years: clean(a.reign),
    facts: [
      ['Whose seal', [clean(a.emperor), clean(a.dynasty)].filter(Boolean).join(', ')],
      ['What kind of seal', clean(a.category)],
      ['Shape', clean(a.shape)],
      ['Characters', SCRIPT_WORD(String(a.script ?? ''))],
      ['Where it is found', clean(a.usual_position)],
      ['Seen on', seen.join('; ')],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: null,
    pics: [picOf(r)].filter((p): p is Pic => !!p), seeAt: r.attributes?.see_at,
    sources: list, single: r.single_source,
    keys: keysOf(r.keys, chars, rest.join(' '), a.english, a.emperor, a.dynasty),
  };
}
export function sealSetSheet(r: Rec): Sheet {
  const a = r.attributes;
  const { list } = numbered(r);
  const [title, ...rest] = r.name.split(' ');
  const seals: string[] = (Array.isArray(a.seals) ? a.seals : []).map(String).map((x: string) => (x === 'hall seal' ? 'a hall seal' : x));
  return {
    id: r.id, anchor: r.id.replace(/^imperial-set-/, 'set-'), url: urlOf(r), kind: 'Seal set', group: 'sets',
    glyphs: null, lang: 'zh', reading: `${title} ${rest.join(' ')}`.trim(), means: `The seals stamped on a work entered in ${clean(a.edition) ?? title}.`,
    years: (/\((\d{4})\)/.exec(String(a.edition ?? '')) ?? [])[1] ?? null,
    facts: [['The seals, in order', seals.join('、')]].map(([label, text]) => ({ label, text })),
    differ: [], caution: null, pics: [], sources: list, single: r.single_source,
    keys: keysOf(r.keys, r.name, seals),
  };
}

// ── Chinese dating: era names, the cycle, taboo characters ──────────────────
export function eraSheet(r: Rec): Sheet {
  const a = r.attributes;
  const { list } = numbered(r);
  return {
    id: r.id, anchor: r.id, url: urlOf(r), kind: 'Era name', group: 'eras',
    glyphs: String(a.era ?? r.name.split(' ')[0]), lang: 'zh', reading: String(a.pinyin ?? ''), means: clean(a.dynasty ? `${a.dynasty}, ${a.emperor ?? ''}` : r.summary),
    years: yearsOf(r.date_from, r.date_to),
    facts: [
      ['Year 1', r.date_from ? `${r.date_from}: year n of ${a.era} is ${r.date_from - 1} + n` : null],
      ['Emperor', clean(a.emperor)],
      ['Where sources differ', clean(a.conflict)],
      ['Notes', (Array.isArray(a.notes) ? a.notes : []).map((x: unknown) => clean(x)).filter(Boolean).join(' ')],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: a.dubious ? 'Some sources doubt this era name was used; read a date in it with care.' : null,
    pics: [], sources: list, single: r.single_source,
    keys: keysOf(r.keys, a.era, a.pinyin, a.dynasty, a.emperor),
  };
}
export function cycleSheet(r: Rec): Sheet {
  const a = r.attributes;
  const { list } = numbered(r);
  const years: number[] = Array.isArray(a.years) ? a.years : [];
  const near = years.filter((y) => y >= 1300 && y <= 2000);
  return {
    id: r.id, anchor: `cycle-${a.n}`, url: urlOf(r), kind: 'Cyclical year', group: 'cycle',
    glyphs: String(a.chars), lang: 'zh', reading: tidyReading(String(a.pinyin ?? '')), means: `Year ${a.n} of the sixty.`,
    years: null,
    facts: [['From 1300 to 2000', near.join(', ')], ['Earlier', years.filter((y) => y < 1300).join(', ')]]
      .filter(([, v]) => v).map(([label, text]) => ({ label, text })),
    differ: [], caution: null, pics: [], sources: list, single: false,
    keys: keysOf(a.chars, a.pinyin, `year ${a.n}`),
  };
}
export function tabooSheet(r: Rec): Sheet {
  const a = r.attributes;
  const { list } = numbered(r);
  const rule = r.kind === 'taboo rule';
  const tabooed = (Array.isArray(a.tabooed) ? a.tabooed : []).map((t: any) =>
    `${t.char}${Array.isArray(t.methods) && t.methods.length ? `: ${t.methods.join(', ')}` : ''}${Array.isArray(t.examples) && t.examples.length ? ` (${t.examples.join('; ')})` : ''}`);
  const [who] = String(a.emperor ?? '').split(' (');
  return {
    id: r.id, anchor: r.id, url: urlOf(r), kind: rule ? 'Rule' : 'Taboo character', group: rule ? 'rules' : 'taboos',
    glyphs: rule ? null : String(a.personal_name ?? '') || null, lang: 'zh',
    reading: rule ? String(a.dynasty ?? '').replace(/\s*\(.*\)$/, '') : `${who}, ${a.dynasty ?? ''}`.replace(/, $/, ''),
    means: clean(a.collector_use) ?? clean(r.summary),
    years: clean(a.period),
    facts: [
      ['Avoided', tabooed.join('; ')],
      ['The rule', rule ? clean(r.summary) : null],
      ['Where sources differ', clean(a.conflict)],
      ['Notes', clean(Array.isArray(a.notes) ? a.notes.join(' ') : a.notes)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: null, pics: [], sources: list, single: r.single_source,
    keys: keysOf(r.name, r.summary, a.personal_name, a.dynasty, a.emperor, tabooed),
  };
}

// ── Chinese porcelain marks other than reign and hall marks ─────────────────
export const OTHER_MARK_GROUPS: [string, string, string][] = [
  ['symbol', 'Symbol marks', 'A picture in place of characters: a leaf, a hare, a conch, a fungus. Most are Kangxi, when writing the reign name was avoided, and were used again later.'],
  ['commendation', 'Commendation marks', 'Words of praise or good wishes, 玉 “jade” or 富貴佳器 “fine vessel for the rich and honorable”, instead of a date.'],
  ['maker', 'Makers and workshops', 'Palace and workshop names, from the Yuan 樞府 wares to the Republic and the People’s Republic.'],
  ['dynasty', 'A dynasty, no reign', 'Marks that name the dynasty but no reign.'],
  ['export', 'Export marks', 'Marks in English for the countries the porcelain was sold to, and what each says about date.'],
  ['date', 'Dates in the sixty-year cycle', 'A cyclical date on porcelain, and where to read it.'],
];
export function otherMarkSheet(r: Rec): Sheet {
  const a = r.attributes;
  const { list } = numbered(r);
  const chars = a.chars && CJK.test(String(a.chars)) ? String(a.chars) : null;
  const periods = (Array.isArray(a.periods) ? a.periods : [])
    .map((p: any) => [p.label, p.start ? (p.end && p.end !== p.start ? `${p.start}–${p.end}` : `from ${p.start}`) : null].filter(Boolean).join(', ')).filter(Boolean);
  const differs = (Array.isArray(a.conflicts) ? a.conflicts : []).map((c: any) => clean(`${c.topic}: ${(c.positions ?? []).join(' / ')}${c.resolution ? ` ${c.resolution}` : ''}`)).filter(Boolean);
  const group = OTHER_MARK_GROUPS.some(([k]) => k === a.category) ? String(a.category) : 'date';
  const KIND: Record<string, string> = { symbol: 'Symbol mark', commendation: 'Commendation mark', maker: 'Maker’s mark', dynasty: 'Dynasty mark', export: 'Export mark', date: 'Cyclical date' };
  return {
    id: r.id, anchor: r.anchor ?? r.id.replace(/^cnmark-/, ''), url: urlOf(r), kind: KIND[group] ?? 'Mark', group,
    glyphs: chars, typeset: !!chars, lang: chars ? 'zh' : null,
    reading: a.pinyin ? tidyReading(String(a.pinyin)) : String(a.english ?? r.name), means: a.pinyin ? clean(a.english) : null, meansTr: !!chars,
    years: yearsOf(r.date_from, r.date_to),
    facts: [
      ['What it is', clean(a.dating_value && r.summary ? r.summary.replace(String(a.dating_value), '').trim() : r.summary)],
      ['What it looks like', clean(r.looks_like)],
      ['Found on', periods.join('; ')],
      ['What it says about date', clean(a.dating_value)],
      ['Later copies', clean(a.later_copies)],
      ['Also written', (Array.isArray(a.variants) ? a.variants : []).filter((v: string) => v && v !== a.chars).join(', ')],
      ['Do not confuse', clean(a.overlap)],
      ['Where sources differ', differs.join(' ')],
      ['Notes', clean(a.notes)],
    ].filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: null,
    pics: [picOf(r)].filter((p): p is Pic => !!p), seeAt: r.attributes?.see_at,
    sources: list, single: r.single_source,
    keys: keysOf(r.keys, a.chars, a.pinyin, a.english, a.chinese_name, a.variants),
  };
}

// ── Chinese export silver: makers, workshop chops, unidentified marks, dating rules ──
export const EXPORT_SILVER_GROUPS: [string, string, string][] = [
  ['rules', 'Dating a piece', 'What the marks, the address and the style say about when a piece was made. Each rule lists its sources; one flagged as resting on one source is the weakest.'],
  ['canton', 'Canton (Guangzhou)', 'The first export silversmiths, in the streets by the foreign factories and, after 1856, on Honam Island across the river.'],
  ['hong-kong', 'Hong Kong', 'Retailers and makers on Queen’s Road and Wing Lok Street, from the 1840s.'],
  ['shanghai', 'Shanghai', 'The largest center after the 1880s, many firms on Nanking Road.'],
  ['ports', 'Beijing, Jiujiang and the other ports', 'Beijing, Tianjin, Jiujiang, Hankou, Ningbo, Chengdu and the other cities named in the sources.'],
  ['unplaced', 'City not recorded', 'Firms a source names, with its mark and characters, but no city.'],
  ['chops', 'Workshop chops', 'The small Chinese-character stamp of the workshop that made a piece a retailer marked.'],
  ['unidentified', 'Marks not yet tied to a maker', 'Marks recorded on export silver whose maker no source names. Where a named firm used the same letters, the sheet says so.'],
];
const ES_CITY: Record<string, string> = { Canton: 'canton', Guangzhou: 'canton', 'Hong Kong': 'hong-kong', Shanghai: 'shanghai' };
type EsFact = { v: string; ss?: boolean; src?: string[] };
export function exportSilverSheet(r: Rec): Sheet {
  const a = r.attributes as any;
  const { list, add } = numbered(r);
  const one = (f: EsFact) => (f.ss ? `${f.v} (one source)` : f.v);
  const join = (l: EsFact[] | undefined, sep = '; ') => (l ?? []).map(one).join(sep);
  if (r.kind === 'dating rule') {
    return {
      id: r.id, anchor: r.anchor ?? r.id, url: urlOf(r), kind: 'Dating rule', group: 'rules',
      glyphs: null, lang: null, reading: r.name, means: null, years: null,
      facts: [['The rule', clean(a.claim)], ...((a.says ?? []) as any[]).filter((s) => s.says).map((s) => [`Source ${add(s.source) ?? ''}`.trim(), clean(s.says)])]
        .filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
      differ: [], caution: null, pics: [], sources: list, single: r.single_source,
      keys: keysOf(r.name, a.claim, a.topic),
    };
  }
  const chinese: EsFact[] = (a.chinese ?? []).filter((f: EsFact) => CJK.test(f.v));
  // A chop is named by its characters ("Chop 善 (Shan)"): they are the mark.
  const chop = a.type === 'workshop_chop' ? /^Chop\s+(\S+)\s*(?:\((.+)\))?/.exec(r.name) : null;
  const glyph = chop ? chop[1] : (chinese.find((f) => !f.ss) ?? chinese[0])?.v.replace(/\s*[(/].*$/, '').trim() || null;
  const city = r.place ?? null;
  const group = a.type === 'workshop_chop' ? 'chops' : a.type === 'unidentified_mark' ? 'unidentified' : city ? ES_CITY[city] ?? 'ports' : 'unplaced';
  const differ: Differ[] = [];
  if (chinese.length > 1) differ.push({ label: 'Chinese name', values: chinese.map((f) => ({ text: f.v, refs: (f.src ?? []).map((s) => add(s)).filter((n): n is number => !!n) })) });
  const said = (a.active?.said ?? []) as { v: string; src: string[] }[];
  if (a.active?.conflict && said.length > 1) differ.push({ label: 'When it was active', values: said.map((x) => ({ text: x.v, refs: x.src.map((s) => add(s)).filter((n): n is number => !!n) })) });
  const marks = ((a.marks ?? []) as (EsFact & { pseudo?: boolean })[]).map((m) => `${one(m)}${m.pseudo ? ', with pseudo-hallmarks' : ''}`);
  const KIND: Record<string, string> = { maker: 'Silversmith or retailer', workshop_chop: 'Workshop chop', unidentified_mark: 'Unidentified mark' };
  return {
    id: r.id, anchor: r.anchor ?? r.id, url: urlOf(r), kind: KIND[a.type] ?? 'Export silver', group,
    glyphs: glyph, typeset: !!glyph, lang: glyph ? 'zh' : null,
    reading: chop ? chop[2] ?? chop[1] : String(r.name).replace(/\s+[㐀-鿿𠀀-𪛟].*$/u, ''),
    means: clean([((a.roles ?? []) as EsFact[])[0]?.v, city].filter(Boolean).join(', ')),
    years: r.date_from ? `c.${yearsOf(r.date_from, r.date_to)}` : null,
    facts: [
      ['Marks', marks.join('; ')],
      ['Name as written', join(a.names)],
      ['Chinese name', chinese.length === 1 ? one(chinese[0]) : null],
      ['Romanization', join(a.romanization)],
      ['Where', [join(a.cities), join(a.addresses)].filter(Boolean).join('; ')],
      ['Active', a.active?.conflict ? null : said.map((x) => x.v).join('; ')],
      ['Dated pieces', ((a.dated_examples ?? []) as EsFact[]).map((x) => x.v).join('; ')],
      ['What the marks say about date', ((a.dating_hints ?? []) as { hint: string }[]).map((h) => h.hint).join('; ')],
      ['Same letters as', (a.possible_attributions ?? []).length ? `a mark of ${a.possible_attributions.join(', ')}; the sources of this mark do not say it is theirs` : null],
      ['Notes', ((a.notes ?? []) as EsFact[]).map(one).join(' · ')],
      ['A shop of this name in Chen’s lists', ((a.chen_shops ?? []) as any[]).map((c) => [c.name, c.place, c.address, c.opened && (/前/.test(c.opened) ? `recorded by ${c.opened.replace(/前/, '')}` : c.opened), c.note].filter(Boolean).join(', ')).join('; ') || null],
    ].map(([label, text]) => [label, clean(text)]).filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    links: ((a.chen_shops ?? []) as any[]).length ? ((a.chen_shops ?? []) as any[]).map((c) => ({ label: `${c.name}, ${c.place}: Chen’s record (possibly the same firm)`, href: String(c.href) })) : undefined,
    differ, caution: clean(a.caution),
    // The record's image first, then every other photograph or book plate of the marks.
    pics: ((main) => [main, ...((a.photos ?? []) as any[]).filter((p) => !main || media(p.file) !== main.file).map((p): Pic => ({
      file: media(p.file), status: p.book ? 'facsimile' : 'photo',
      credit: p.book ? `${p.title}, ${p.object_number}` : [p.institution, p.object_number].filter(Boolean).join(', '),
      url: p.object_page ?? null, alt: clean(p.shows) ?? r.name,
    }))].filter((p): p is Pic => !!p))(picOf(r)),
    sources: list, single: r.single_source,
    keys: keysOf(r.keys, r.name, city, (a.marks ?? []).map((m: EsFact) => m.v)),
  };
}

/** A Chinese silver shop (银楼) from Chen Zhigao's province lists: its name in characters, where and
 *  when it traded, and the marks Chen photographed. Grouped on its province's page by city. */
export function silverShopSheet(r: Rec): Sheet {
  const a = r.attributes as any;
  const { list } = numbered(r);
  // Chen's dates: 1911前 (first recorded by), 1936后 (recorded after), 约1800 (about), or a period.
  const ERA: [RegExp, string][] = [[/清代|清朝|清末/, 'Qing dynasty'], [/民国初/, 'early Republic (1910s)'], [/民国/, 'Republican period (1912–1949)'], [/道光/, 'Daoguang reign (1821–1850)'],
    [/咸丰/, 'Xianfeng reign (1851–1861)'], [/同治/, 'Tongzhi reign (1862–1874)'], [/光绪/, 'Guangxu reign (1875–1908)'], [/宣统/, 'Xuantong reign (1909–1911)'], [/乾隆/, 'Qianlong reign (1736–1795)'], [/嘉庆/, 'Jiaqing reign (1796–1820)'], [/康熙/, 'Kangxi reign (1662–1722)']];
  const when = (t: string | null) => {
    if (!t) return null;
    const y = /(\d{4})/.exec(t)?.[1];
    const era = ERA.find(([re]) => re.test(t))?.[1];
    const base = y ?? era ?? t;
    if (/前/.test(t)) return `Recorded by ${base} (the earliest record Chen found, not the opening)`;
    if (/后/.test(t)) return `Recorded after ${base}`;
    if (/约/.test(t)) return `About ${base}`;
    return y ? (era ? `${y} (${era})` : y) : era ?? t;
  };
  const opened = when(a.opened);
  const credit = (r.sources[0] as any)?.where ?? '';
  return {
    id: r.id, anchor: r.anchor ?? r.id, url: urlOf(r), kind: 'Silver shop', group: a.place ?? 'unplaced',
    glyphs: a.chinese, typeset: true, lang: 'zh', reading: a.pinyin, means: clean([a.place_py, a.province_en].filter((x: string, i: number, l: string[]) => x && l.indexOf(x) === i).join(', ')),
    years: r.date_from ? (/前/.test(a.opened ?? '') ? `by ${r.date_from}` : /后/.test(a.opened ?? '') ? `after ${r.date_from}` : /约/.test(a.opened ?? '') ? `c.${r.date_from}` : String(r.date_from)) : null,
    facts: [
      ['Where', [a.place ? `${a.place_py} ${a.place}` : null, a.address].filter(Boolean).join(', ')],
      ['Opened', opened],
      ['Manager', a.manager],
      ['Western-style shop', a.western_style ? 'Chen lists it as 洋装, a shop making silver and jewellery in Western forms' : null],
      ['Chen notes', a.western_style ? (a.note ?? '').replace(/洋装[，,、\s]*/, '') || null : a.note],
      ['Marks', a.marks?.length ? `${a.marks.length === 1 ? 'One mark' : `${a.marks.length} marks`} photographed by Chen on pieces from the shop` : a.object_seen ? 'Chen saw a piece with its mark' : null],
      ['Name read by', 'Machine, from the book; check the characters against the mark'],
    ].map(([label, text]) => [label, clean(text)]).filter(([, v]) => v).map(([label, text]) => ({ label: label as string, text: text as string })),
    differ: [], caution: clean(a.caution),
    pics: ((a.marks ?? []) as string[]).map((f, i) => ({ file: media(f), status: 'facsimile', credit: `Chen Zhigao, ${credit}`, url: null, alt: `${i ? 'Another mark' : 'Mark'} of ${a.chinese} ${a.pinyin}` })),
    links: a.export_maker ? [{ label: 'Possibly the export silver firm of this name', href: `/marks/chinese/export-silver#${String(a.export_maker).replace(/^cn-export-silver-/, '')}` }] : undefined,
    sources: list, single: r.single_source,
    keys: keysOf(r.keys, r.name, a.place, a.place_py, a.address, a.pinyin),
  };
}

const escHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** A sheet's text as HTML, with official designations (Korea's National Treasure) marked as names, not Heirloom's words. */
export function withNames(t: string) {
  return escHtml(t).replace(/\b(National Treasure|Important Cultural Property|Treasure No\. ?\d+)\b/g, '<span class="tr">$1</span>');
}
