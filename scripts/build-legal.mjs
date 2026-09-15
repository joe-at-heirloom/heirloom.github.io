#!/usr/bin/env node
// Regenerates privacy.html and terms.html from the app repo's legal sources.
//
// The Markdown in the Heirloom app repo (legal/PRIVACY_POLICY.md and
// legal/TERMS_OF_SERVICE.md) is the source of truth for the two legal pages.
// This script turns each into the <main> of the matching page, keeping the
// site's own head, nav and footer. Run it whenever the sources change:
//
//   node scripts/build-legal.mjs            # rewrite privacy.html and terms.html
//   node scripts/build-legal.mjs --check    # exit 1 if the committed pages differ
//
// LEGAL_DIR points at the folder holding the two .md files (default:
// ../Heirloom/legal, i.e. the app repo checked out beside this one).
//
// No dependencies: the sources use a small, known subset of Markdown
// (headings, paragraphs, bullet and numbered lists with wrapped lines, one
// pipe table, **bold**, a closing *italic* line, HTML comments, --- rules).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
export const LEGAL_DIR = process.env.LEGAL_DIR || resolve(siteRoot, '..', 'Heirloom', 'legal');

/**
 * Wording that deliberately differs from the Markdown source. Each entry is a
 * safety net: it applies only while the source still carries the old phrase,
 * and is a no-op once the Markdown has followed; report each in the founder's
 * review so the app repo's legal/*.md is corrected and the entry deleted.
 *
 * Empty since 2026-09-15: the last corrections (Terms §7 "Expert
 * introductions", Terms §4 / Privacy §2 naming a transfer — not the estate
 * list — as what lets a recipient see a record, Privacy §8 "a transfer
 * recipient who accepted a record", two Markdown typos) now live in the app
 * repo's legal/ Markdown, and `--check` passes against it with no override.
 */
export const SOURCE_OVERRIDES = [];

export const PAGES = [
  { source: 'PRIVACY_POLICY.md', output: 'privacy.html', title: 'Privacy Policy — Heirloom' },
  { source: 'TERMS_OF_SERVICE.md', output: 'terms.html', title: 'Terms of Service — Heirloom' },
];

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Only the closing "*This document is a draft…*" line uses single-star italics.
  out = out.replace(/^\*([^*].*?)\*$/g, '<em>$1</em>');
  return out;
}

function applyOverrides(markdown) {
  let out = markdown;
  for (const { from, to } of SOURCE_OVERRIDES) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

/** Convert the legal Markdown subset to HTML. Exported for the check script. */
export function markdownToHtml(markdown) {
  const lines = applyOverrides(markdown)
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');
  const html = [];
  let i = 0;
  // The contact address is one paragraph whose lines are an address, not a
  // wrapped sentence: recognised by its "Email:" line, its breaks are kept.
  const isAddressBlock = (para) => para.length > 1 && para.some((l) => /^Email:/.test(l));

  const isBullet = (l) => /^- /.test(l);
  const isNumbered = (l) => /^\d+\. /.test(l);
  const isContinuation = (l) => /^\s{2,}\S/.test(l);
  const isTableRow = (l) => /^\|/.test(l);
  const isBlockStart = (l) =>
    l.trim() === '' || /^#{1,3} /.test(l) || isBullet(l) || isNumbered(l) || isTableRow(l) || l.trim() === '---';

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '' || trimmed === '---') {
      i += 1;
      continue;
    }

    const heading = /^(#{1,3}) (.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (isBullet(line) || isNumbered(line)) {
      const ordered = isNumbered(line);
      const items = [];
      while (i < lines.length && (ordered ? isNumbered(lines[i]) : isBullet(lines[i]))) {
        let item = lines[i].replace(ordered ? /^\d+\. / : /^- /, '');
        i += 1;
        while (i < lines.length && isContinuation(lines[i])) {
          item += ' ' + lines[i].trim();
          i += 1;
        }
        items.push(`<li>${inline(item)}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>\n${items.join('\n')}\n</${tag}>`);
      continue;
    }

    if (isTableRow(line)) {
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (row) =>
        row
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const [head, , ...body] = rows; // second row is the |---| separator
      const th = cells(head).map((c) => `<th>${inline(c)}</th>`).join('');
      const trs = body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
      html.push(`<table>\n<tr>${th}</tr>\n${trs.join('\n')}\n</table>`);
      continue;
    }

    // Paragraph: join wrapped lines until the next block.
    const para = [line.trim()];
    i += 1;
    while (i < lines.length && !isBlockStart(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${isAddressBlock(para) ? para.map(inline).join('<br>') : inline(para.join(' '))}</p>`);
  }

  return html.join('\n');
}

export function renderPage({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="icon" type="image/svg+xml" href="logo.svg">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="nav nav--scrolled" id="nav">
    <div class="nav__container">
      <a href="/" class="nav__logo"><img src="logo.svg" alt="Heirloom" height="32"></a>
      <div class="nav__actions"><a href="/" class="btn btn--outline">Back to Home</a></div>
    </div>
  </nav>
  <main class="legal-page">
${body}
  </main>
  <footer class="footer">
    <div class="container">
      <div class="footer__inner">
        <div class="footer__brand">
          <img src="logo.svg" alt="Heirloom" height="24">
          <p class="footer__tagline">Know what you own.</p>
        </div>
        <nav class="footer__links" aria-label="Legal">
          <a href="/privacy" class="footer__link">Privacy Policy</a>
          <a href="/terms" class="footer__link">Terms of Service</a>
        </nav>
        <p class="footer__copy">&copy; 2026 Heirloom. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>
`;
}

/** Build every page; returns [{output, html}]. Throws if a source is missing. */
export function buildAll(legalDir = LEGAL_DIR) {
  return PAGES.map(({ source, output, title }) => {
    const path = resolve(legalDir, source);
    if (!existsSync(path)) throw new Error(`Legal source not found: ${path}`);
    const markdown = readFileSync(path, 'utf8');
    // The page title comes from the site, the body from the source. The
    // source's own H1 ("# Heirloom Privacy Policy") is replaced by the shorter
    // page heading the site has always used.
    const body = markdownToHtml(markdown).replace(/^<h1>.*?<\/h1>/, `<h1>${title.split(' — ')[0]}</h1>`);
    return { output, html: renderPage({ title, body: body.replace(/^/gm, '    ') }) };
  });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const check = process.argv.includes('--check');
  let drift = 0;
  for (const { output, html } of buildAll()) {
    const target = resolve(siteRoot, output);
    if (check) {
      const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
      if (current !== html) {
        drift += 1;
        console.error(`${output} differs from ${LEGAL_DIR}: run node scripts/build-legal.mjs`);
      } else {
        console.log(`${output} matches its source`);
      }
    } else {
      writeFileSync(target, html);
      console.log(`wrote ${output}`);
    }
  }
  process.exit(drift ? 1 : 0);
}
