// After the Astro build: carry the repository's own files that the site serves
// (images, mark data, icons, the CSV template) into dist/. Every page is an
// Astro page since Nov 25 2026, so an HTML file here is a mistake and fails
// the build. A file the
// Astro build wrote always wins. What is not part of the published site
// (../.assetsignore's list, plus site/ itself) is left out.
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(site, '..');
const dist = join(site, 'dist');
const SKIP = new Set(['site', 'design', '.git', '.github', '.claude', '.wrangler', 'node_modules', 'scripts', 'hallmark-sources', 'wrangler.jsonc', 'worker.js', 'package.json', 'package-lock.json', 'README.md', 'CNAME', '.gitignore', '.assetsignore', '.DS_Store', '__pycache__']);
let copied = 0, kept = 0;
const carriedHtml = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.endsWith('.py')) continue;
    const from = join(dir, name);
    const rel = relative(repo, from);
    if (rel === join('marks', 'img')) continue; // prebuild already put the images in place
    if (statSync(from).isDirectory()) { walk(from); continue; }
    const to = join(dist, rel);
    if (existsSync(to)) { kept++; continue; }
    mkdirSync(dirname(to), { recursive: true });
    if (name.endsWith('.html')) carriedHtml.push(rel);
    copyFileSync(from, to);
    copied++;
  }
}
walk(repo);
// A review build (SITE_PREVIEW=1) is never indexed: it is a second copy of the site.
if (process.env.SITE_PREVIEW) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(join(dist, '_headers'), '\n/*\n  X-Robots-Tag: noindex, nofollow\n');
  console.log('[legacy] review build: noindex on every path');
}
const pages = [...new Set(carriedHtml)];
if (pages.length) throw new Error(`[legacy] the repository root has HTML pages again (${pages.slice(0, 5).join(', ')}): every page is an Astro page now`);
console.log(`[legacy] ${copied} files of the repository carried over (images, data, icons); ${kept} already built`);
