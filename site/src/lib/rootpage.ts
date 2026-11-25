// The guide, legal and support pages, built by Astro in the site's own layout
// from the pages the repository root holds. Those root files stay the source
// of the words: the guides come from scripts/pages (Joe-approved copy), the
// legal pages from the app's legal Markdown (scripts/build-legal.mjs), and
// scripts/check-copy.mjs reads exactly those files, so what it checks is what
// the site serves. This takes each page's title, description, structured data
// (less the organization and website, which Base adds) and the body of <main>.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// /silver-hallmarks has its own page (src/pages/silver-hallmarks.astro, the GitHub Pages alternative session's guide template, main 1fcb878).
export const ROOT_PAGES = [
  'guides', 'home-inventory-app', 'antique-identifier-app', 'home-inventory-checklist',
  'family-heirlooms', 'privacy', 'terms', 'support',
] as const;

const ENT: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  mdash: '—', ndash: '–', hellip: '…', nbsp: ' ', rarr: '→', copy: '©', eacute: 'é', middot: '·',
};
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);

export function rootPage(slug: string) {
  const html = readFileSync(join(process.cwd(), '..', `${slug}.html`), 'utf8');
  const title = decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1].trim() ?? slug);
  const description = decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '');
  const m = /<main class="([^"]*)"[^>]*>([\s\S]*?)<\/main>/.exec(html);
  if (!m) throw new Error(`[rootpage] ${slug}.html has no <main>`);
  const kind = m[1].includes('legal') ? 'legal' : 'guide';
  let jsonld: object[] = [];
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (ld) {
    const j = JSON.parse(ld[1]);
    const nodes: any[] = j['@graph'] ?? [j];
    jsonld = nodes.filter((n) => !['Organization', 'WebSite'].includes(n['@type']));
  }
  return { title, description, kind, jsonld, main: m[2] };
}
