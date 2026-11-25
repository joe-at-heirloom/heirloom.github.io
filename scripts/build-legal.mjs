#!/usr/bin/env node
// Brings the app repo's published legal texts into the site.
//
// The Markdown in the Heirloom app repo (legal/PRIVACY_POLICY.md and
// legal/TERMS_OF_SERVICE.md) is the source of truth for the two legal pages.
// This script copies each, with the company facts applied (company.json), to
// site/src/content/legal/, and the Astro pages /privacy and /terms render that
// copy with markdownToHtml below (site/src/lib/legal.ts). Since Nov 25 2026
// there is no generated HTML: the committed Markdown is what is published.
// Run it whenever the sources change:
//
//   node scripts/build-legal.mjs            # rewrite site/src/content/legal/*.md
//   node scripts/build-legal.mjs --check    # exit 1 if the committed copies differ
//   node scripts/build-legal.mjs --draft    # write them from a draft, to look at only
//
// LEGAL_DIR points at the folder holding the two .md files (default:
// ../Heirloom/legal, i.e. the app repo checked out beside this one).
//
// A source whose header says DRAFT FOR COUNSEL is refused: a plain run writes
// nothing and exits 2, because a push of this repo publishes what it wrote.
// --draft writes it anyway, for a look on this machine; never commit that.
// See DRAFT_MARK below.
//
// No dependencies: the sources use a small, known subset of Markdown
// (headings, paragraphs, bullet and numbered lists with wrapped lines, one
// pipe table, **bold**, *italic* lines, HTML comments, --- rules), plus the
// pc: company-fact markers described at PAGES.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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

/**
 * The company facts in the sources (who provides Heirloom, where, which law)
 * sit between pc:KEY comment markers and are filled from scripts/company.json,
 * which the legal sync in joe-at-heirloom/thepeninsularcompany.github.io
 * writes. What the Markdown holds between the markers is only a fallback for
 * reading the source; the pages print company.json's values. A pc:updated
 * marker ("Last updated") moves to company.json's date, with the page's
 * `companyNote`, when that date is the later of the two.
 */
const COMPANY_PATH = resolve(here, 'company.json');
export const COMPANY = existsSync(COMPANY_PATH) ? JSON.parse(readFileSync(COMPANY_PATH, 'utf8')) : null;

export const PAGES = [
  {
    source: 'PRIVACY_POLICY.md',
    output: 'site/src/content/legal/privacy.md',
    path: '/privacy',
    title: 'Privacy Policy — Heirloom',
    companyNote: 'who provides Heirloom — introduction, §1, §15',
  },
  {
    source: 'TERMS_OF_SERVICE.md',
    output: 'site/src/content/legal/terms.md',
    path: '/terms',
    title: 'Terms of Service — Heirloom',
    companyNote: 'who provides Heirloom, and governing law — introduction, §§17, 19',
  },
];

/**
 * The app repo keeps the next policy and terms in legal/ as drafts while
 * counsel reads them, each with a header comment that says "DRAFT FOR
 * COUNSEL" (its docs/submission/legal.md, "Publishing"). The site's builder
 * reads that folder by default, so without this guard a plain run would write
 * a draft into the legal copies (site/src/content/legal) and the next push would publish it.
 *
 * The header is the run of HTML comments that opens the file, before its
 * first line of text; the mark is matched there only, so a published text that
 * names a draft in its body is not refused. The published texts' own header
 * says "This draft was generated…", which is not the mark.
 */
export const DRAFT_MARK = /\bDRAFT FOR COUNSEL\b/i;

/** The HTML comments, and the space between them, that open a source. */
export function headerOf(markdown) {
  return /^(?:\s*<!--[\s\S]*?-->)*/.exec(markdown)[0];
}

/** True when a source's header says DRAFT FOR COUNSEL. */
export function isDraft(markdown) {
  return DRAFT_MARK.test(headerOf(markdown));
}

/** The sources in legalDir whose header says DRAFT FOR COUNSEL (a missing one is not listed). */
export function draftSources(legalDir = LEGAL_DIR) {
  return PAGES.filter(({ source }) => {
    const path = resolve(legalDir, source);
    return existsSync(path) && isDraft(readFileSync(path, 'utf8'));
  }).map(({ source }) => source);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const isoDate = (text) => {
  const m = /^\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})/.exec(text);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  return month < 0 ? null : `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
};
const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** Fill a source's pc: markers from company.json (a no-op without it). */
export function applyCompany(markdown, note, company = COMPANY) {
  if (!company) return markdown;
  return markdown.replace(/<!--pc:([a-z-]+)-->([\s\S]*?)<!--\/pc:\1-->/g, (whole, key, inner) => {
    if (key === 'updated') {
      const own = isoDate(inner);
      return own && company.updated > own ? `${longDate(company.updated)} (${note})` : inner;
    }
    if (typeof company[key] !== 'string') throw new Error(`scripts/company.json has no "${key}" for a pc:${key} marker`);
    return company[key];
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // A whole line in single-star italics; no source has one at present.
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

/** A legal text as the page's body: the source's own H1 ("# Heirloom Privacy
 *  Policy") gives way to the shorter heading the site has always used. */
export function renderLegal(text, title) {
  return markdownToHtml(text).replace(/^<h1>.*?<\/h1>/, `<h1>${title.split(' — ')[0]}</h1>`);
}

export function buildAll(legalDir = LEGAL_DIR) {
  return PAGES.map(({ source, output, title, companyNote }) => {
    const path = resolve(legalDir, source);
    if (!existsSync(path)) throw new Error(`Legal source not found: ${path}`);
    // The published copy: the source with the company facts applied.
    return { output, title, text: applyCompany(readFileSync(path, 'utf8'), companyNote) };
  });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const check = process.argv.includes('--check');
  const draft = process.argv.includes('--draft');
  const drafts = draftSources();
  if (drafts.length && !check && !draft) {
    console.error(
      `refused: ${drafts.join(' and ')} in ${LEGAL_DIR} ${drafts.length > 1 ? 'say' : 'says'} DRAFT FOR COUNSEL in the header, ` +
        'and this repo publishes what is pushed. Nothing was written.\n' +
        'To rebuild the published pages, point LEGAL_DIR at the published texts in a scratch folder ' +
        "(the app repo's docs/submission/legal.md §6 names their commits; while the drafts of October 2026 wait, " +
        'git show 46347d1e:legal/PRIVACY_POLICY.md and git show d699c2ae:legal/TERMS_OF_SERVICE.md). ' +
        'To look at a draft on this machine only, run with --draft, and do not commit what it writes.\n' +
        "The legal sync in thepeninsularcompany.github.io runs this build from the app repo's main: a sync that stops " +
        'here kept the drafts off the site, and the company facts follow once legal/ there holds published texts again.',
    );
    process.exit(2);
  }
  let drift = 0;
  for (const { output, text } of buildAll()) {
    const target = resolve(siteRoot, output);
    const source = PAGES.find((p) => p.output === output).source;
    if (check) {
      const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
      if (current !== text) {
        drift += 1;
        console.error(
          drafts.includes(source)
            ? `${output} differs from ${LEGAL_DIR}, whose ${source} is a DRAFT FOR COUNSEL: the page is not built from a draft; set LEGAL_DIR to the published text`
            : `${output} differs from ${LEGAL_DIR}: run node scripts/build-legal.mjs`,
        );
      } else {
        console.log(`${output} matches its source`);
      }
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, text);
      console.log(drafts.includes(source) ? `wrote ${output} from a DRAFT FOR COUNSEL (--draft): do not commit it` : `wrote ${output}`);
    }
  }
  process.exit(drift ? 1 : 0);
}
