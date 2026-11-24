// After the Astro build: carry every page and file of the current site that
// has not been rebuilt yet into dist/, unchanged, so the new site can replace
// the old one family by family with no address ever going missing. A file the
// Astro build wrote always wins. What is not part of the published site
// (../.assetsignore's list, plus site/ itself) is left out.
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(site, '..');
const dist = join(site, 'dist');
const SKIP = new Set(['site', '.git', '.github', '.claude', '.wrangler', 'node_modules', 'scripts', 'hallmark-sources', 'wrangler.jsonc', 'worker.js', 'package.json', 'package-lock.json', 'README.md', 'CNAME', '.gitignore', '.assetsignore', '.DS_Store', '__pycache__']);
let copied = 0, kept = 0;
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
console.log(`[legacy] ${copied} files of the current site carried over; ${kept} already rebuilt`);
