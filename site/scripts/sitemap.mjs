// After the build: write dist/sitemap.xml from the pages themselves, so it
// lists every page and nothing else. Each page's own canonical address is used
// (Base.astro writes one on every page); a page marked noindex, the 404 page,
// and a review build (SITE_PREVIEW=1, noindex everywhere) are left out.
// Replaces the hand-kept sitemap.xml, which had 130 of the site's 4,300 pages.
import { readdirSync, readFileSync, writeFileSync, statSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const out = join(dist, 'sitemap.xml');
if (process.env.SITE_PREVIEW) {
  if (existsSync(out)) rmSync(out);
  console.log('[sitemap] review build: no sitemap');
  process.exit(0);
}

const urls = new Set();
let skipped = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith('.html') || name === '404.html') continue;
    const head = readFileSync(p, 'utf8').slice(0, 20000);
    if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(head)) { skipped++; continue; }
    const canonical = head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
    if (!canonical || !canonical.startsWith('https://heirloomapp.io/')) { skipped++; continue; }
    urls.add(canonical);
  }
}
walk(dist);
if (urls.size > 50000) throw new Error(`[sitemap] ${urls.size} pages: over a sitemap's 50,000; split it into an index`);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const body = [...urls].sort().map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
writeFileSync(out, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
console.log(`[sitemap] ${urls.size} pages in sitemap.xml; ${skipped} left out (noindex or no canonical)`);
