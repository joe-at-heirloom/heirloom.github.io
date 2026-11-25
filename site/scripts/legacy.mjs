// After the Astro build: carry every page and file of the current site that
// has not been rebuilt yet into dist/, unchanged, so the new site can replace
// the old one family by family with no address ever going missing. A file the
// Astro build wrote always wins. What is not part of the published site
// (../.assetsignore's list, plus site/ itself) is left out.
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(site, '..');
const dist = join(site, 'dist');
const SKIP = new Set(['site', '.git', '.github', '.claude', '.wrangler', 'node_modules', 'scripts', 'hallmark-sources', 'wrangler.jsonc', 'worker.js', 'package.json', 'package-lock.json', 'README.md', 'CNAME', '.gitignore', '.assetsignore', '.DS_Store', '__pycache__']);
let copied = 0, kept = 0, reskinned = 0;

// The new header and footer, rendered once by src/pages/shell-frame.astro.
// Every carried-over page gets them in place of the old nav and footer, with
// their CSS and script, so the whole site wears one frame before every page is
// rebuilt. The current section's door is marked from the page's address.
const shellPath = join(dist, 'shell-frame.html');
const shell = existsSync(shellPath) ? readFileSync(shellPath, 'utf8') : null;
if (!shell) throw new Error('[legacy] dist/shell-frame.html is missing: the header and footer cannot be carried to the old pages');
const pick = (re, what) => { const m = shell.match(re); if (!m) throw new Error(`[legacy] shell-frame has no ${what}`); return m[0]; };
const HEADER = pick(/<header\b[^>]*\bclass="hdr"[^>]*>[\s\S]*?<\/header>/, 'header');
const FOOTER = pick(/<footer\b[^>]*\bclass="ftr"[^>]*>[\s\S]*?<\/footer>/, 'footer');
const FONTS = pick(/<link[^>]*data-shell-fonts[^>]*>/, 'fonts link').replace(/\s*data-shell-fonts(="")?/, '');
const shellHead = shell.slice(0, shell.indexOf('</head>'));
const ASSETS = [
  ...shellHead.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\/_astro\/[^"]+"[^>]*>/g),
  ...shellHead.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g),
  ...shell.matchAll(/<script[^>]+type="module"[^>]*>[\s\S]*?<\/script>/g),
].map((m) => m[0]).join('\n');
function door(rel) {
  const r = rel.split('\\').join('/');
  if (r.startsWith('marks/') || r.startsWith('signatures')) return 'p-ref';
  if (/^(guides|home-inventory-checklist|silver-hallmarks|family-heirlooms)\.html$/.test(r)) return 'p-guides';
  if (/^(home-inventory-app|antique-identifier-app)\.html$/.test(r)) return 'p-app';
  return null;
}
function reskin(html, rel) {
  if (!html.includes('class="nav nav--solid"')) return null;
  const d = door(rel);
  const header = d ? HEADER.replace(`data-door="${d}"`, `data-door="${d}" aria-current="page"`) : HEADER;
  let out = html
    .replace(/<header class="nav nav--solid"[\s\S]*?<\/header>/, () => header)
    .replace(/<footer class="footer"[\s\S]*?<\/footer>/, () => FOOTER)
    .replace(/<script[^>]*src="\/nav\.js"[^>]*><\/script>\s*/g, '')
    .replace(/<link[^>]+fonts\.googleapis\.com\/css2\?family=Inter[^>]*>/, () => FONTS)
    .replace(/<html([^>]*)>/, (_m, attrs) => {
      const a = attrs.replace(/\sdata-theme="[^"]*"/, '');
      return /\sclass="/.test(a) ? `<html${a.replace(/\sclass="([^"]*)"/, ' class="$1 legacy"')} data-theme="light">` : `<html${a} class="legacy" data-theme="light">`;
    })
    .replace('</head>', () => `${ASSETS}\n</head>`);
  return out;
}
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
    if (name.endsWith('.html')) {
      const html = reskin(readFileSync(from, 'utf8'), rel);
      if (html) { writeFileSync(to, html); reskinned++; copied++; continue; }
    }
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
rmSync(shellPath);
console.log(`[legacy] ${copied} files of the current site carried over (${reskinned} pages given the new header and footer); ${kept} already rebuilt`);
