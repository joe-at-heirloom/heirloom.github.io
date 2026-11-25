// The pottery and porcelain maker pages' data, from the reference collection:
// each maker history record carries its page as ceramics_data.py writes it
// (attributes.page), and the cards are the marks-database records it names.
// Ported from scripts/pages/p_ceramics.py and marksdb.py so each page says and
// shows what the generated one did.
import { collection, type Rec } from './portal';
import { media } from './media';

export type MakerPage = {
  slug: string; title: string; desc: string; h1: string; crumb: string; lede: string; answer: string; maker_heading: string; history: string[];
  marks_heading: string; marks_intro: string | null; marks: { id: string; name: string; dates: string; body: string }[];
  careful_heading: string; cautions: string[]; disagree: string[]; cta: string; faqs: [string, string][];
  sources: { key: string; cite: string; url: string | null }[]; cards: Record<string, string[]>; others: [string, string] | null;
};

export function makers(): MakerPage[] {
  return collection().records
    .filter((r) => r.family === 'ceramics-makers' && r.kind === 'maker history' && r.attributes.page)
    .map((r) => ({ ...(r.attributes.page as Omit<MakerPage, 'slug'>), slug: r.page_path.replace(/^\/marks\//, '') }));
}

/** {src:a,b} in the copy, as superscript links to the page's numbered sources (p_ceramics.py refs). */
export function fill(text: string, keys: string[]) {
  return String(text ?? '').replace(/\{src:([^}]+)\}/g, (_m, list: string) => {
    const nums = list.split(',').map((k) => keys.indexOf(k.trim()) + 1).filter((n) => n > 0).sort((a, b) => a - b);
    return nums.length ? `<sup class="refs">${nums.map((n) => `<a href="#src-${n}">${n}</a>`).join(', ')}</sup>` : '';
  });
}
export const plainFaq = (text: string) => String(text ?? '').replace(/\{src:[^}]+\}/g, '');

const KIND: Record<string, string> = { photo: 'Photo', facsimile: 'Book facsimile', rendering: 'Drawing' };
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let byId: Map<string, Rec> | null = null;
let imgs: Map<string, { file: string; status: string; credit?: string | null }> | null = null;

/** One mark's card (marksdb.py card): its image, name, years and credit, or its description in words. */
export function card(id: string) {
  byId ??= new Map(collection().records.map((r) => [r.id, r]));
  imgs ??= new Map(collection().images.map((i) => [i.id, i]));
  const e = byId.get(id);
  if (!e) throw new Error(`maker pages: the collection has no mark ${id}`);
  const a = e.date_from, b = e.date_to;
  const years = a && b && a !== b ? `${a}–${b}` : a && !b ? `from ${a}` : String(a ?? '');
  const yr = years ? `<span class="mk__years">${esc(years)}</span>` : '';
  const i = e.image_id ? imgs.get(e.image_id) : undefined;
  if (i && KIND[i.status] && i.file) {
    return `<figure class="mk mk--${i.status}"><div class="mk__img"><img src="${esc(media(i.file))}" alt="${esc(e.looks_like || e.name)}" loading="lazy" decoding="async"></div>`
      + `<figcaption><b>${esc(e.name)}</b>${yr}<span class="mk__kind">${KIND[i.status]}</span><span class="mk__credit">${esc(i.credit ?? '')}</span></figcaption></figure>`;
  }
  const why = e.attributes?.photo_only ? "Shown only as a photograph, which we don't have yet." : 'No image yet.';
  return `<figure class="mk mk--none"><div class="mk__img mk__img--none"><p>${esc(e.looks_like ?? '')}</p></div><figcaption><b>${esc(e.name)}</b>${yr}<span class="mk__kind">${why}</span></figcaption></figure>`;
}
export const grid = (ids: string[]) => `<div class="mks">${ids.map(card).join('')}</div>`;
