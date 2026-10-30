#!/usr/bin/env node
// Holds the website to what the app actually does (plan item ON04).
//
//   node scripts/check-copy.mjs
//
// Four checks, all without dependencies:
//  1. The visible text of index.html, README.md and support.html makes none of the promises
//     the app's own copy rules forbid. The first list below is copied from
//     src/components/branding/copy.ts (UNSUPPORTED_CLAIM_RULES) in the app repo
//     with one deliberate difference: the app's bare /\bappraisal\b/ rule is
//     replaced by the sentence-level APPRAISAL_CONTEXT check, because the site
//     must be able to say what an estimate is not and to name the independent
//     professional who provides an appraisal. Keep the rest in step with the
//     app. The second list is website-specific.
//  2. The homepage still carries the qualifications the plan asks for
//     (evidence-conditioned estimates, "cannot tell", the wishes list grants
//     no access, nothing for sale), the home inventory first (D1), the App
//     Store badge's link and the US-only line (D57); it and this README use
//     the launch words (no beta or waitlist, nothing passed on or
//     transferred, D17; "item" and "specialist", D44, D24; American
//     spelling), and its titles
//     are in sentence case (the app repo's docs/VOICE.md).
//     What is owed before the publish fails the check: support.html's old
//     words (it changes with the release), the placeholder badge, and the
//     Terms of October 4 beside the insurer's PDF (S5-16). PRE_RELEASE=1
//     prints them as notes instead, to review the launch branch before
//     release day; CI, the push and the legal sync run without it.
//  3. privacy.html and terms.html match the app repo's legal Markdown when it
//     can be found (LEGAL_DIR, default ../Heirloom/legal); otherwise that check
//     is reported as skipped by name, never as a pass.
//  4. The draft guard: build-legal.mjs refuses a source whose header says
//     DRAFT FOR COUNSEL unless run with --draft (tried on a copy of the
//     builder in a temporary folder, so a broken guard writes nothing here),
//     and neither legal page carries a draft's words.

import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildAll, LEGAL_DIR, PAGES, isDraft, draftSources, markdownToHtml } from './build-legal.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');

/**
 * From src/components/branding/copy.ts — promises the shipped product does not
 * keep. All of UNSUPPORTED_CLAIM_RULES except /\bappraisal\b/ (see APPRAISAL_CONTEXT).
 */
const APP_CLAIM_RULES = [
  { pattern: /\binstant(ly|aneous)?\b/i, why: 'analysis takes time and can fail' },
  { pattern: /\bevery (item|object|piece)\b/i, why: 'many objects cannot be identified' },
  { pattern: /\banything\b/i, why: 'implies universal identification' },
  { pattern: /\bzero guesswork\b/i, why: 'estimates are uncertain by nature' },
  { pattern: /\bguarantee/i, why: 'nothing here is guaranteed' },
  { pattern: /\bverified\b/i, why: 'no expert is verified in the app today' },
  { pattern: /\bauthenticat/i, why: 'the app does not authenticate objects' },
  { pattern: /\b[\d,]{3,}\+?\s*(verified\s+)?(experts|appraisers|dealers)\b/i, why: 'there is one active expert' },
  {
    pattern: /\bwe (work out|figure out|identify|determine|tell you) what (it|this|they) (is|are)\b/i,
    why: 'identification depends on evidence and often fails',
  },
  { pattern: /\bin (about )?(a|one|1) minute\b/i, why: 'no measured timing supports this' },
  { pattern: /\bin seconds\b/i, why: 'no measured timing supports this' },
  { pattern: /\bmarketplace\b/i, why: 'Heirloom is not a marketplace' },
  { pattern: /\bsell (it|your)\b/i, why: 'Heirloom is not a marketplace' },
  { pattern: /\bgrants? (them )?access\b/i, why: 'estate sharing records an intention only' },
];

/** Website-only rules: the claims the September 11 review found, and their neighbours. */
const SITE_CLAIM_RULES = [
  { pattern: /\bAI\b/, why: 'plain copy; "Advisor" is the product name' },
  { pattern: /\b(executor|heir|attorney)s? (access|can (see|view|open|log))\b/i, why: 'estate-recipient access is not built (FAM08)' },
  { pattern: /\bshar(e|ing) (your )?(estate|collection|plan)s? with (your )?(attorney|executor)/i, why: 'the estate list delivers nothing to anyone' },
  { pattern: /\bestate sharing\b/i, why: 'say what it is: a private list of intentions' },
  { pattern: /\bbeneficiary designations?\b/i, why: 'plain words: who each object is meant for' },
  { pattern: /\b(be|get) first\b|\bfirst through the door\b|\bhurry\b|\blimited (spots|places)\b|\bdon'?t miss\b/i, why: 'no urgency language' },
  { pattern: /\bin touch soon\b|\bcoming soon\b/i, why: 'no timing promise' },
  { pattern: /\b(sale|selling) advice\b|\b(buy|sell|auction) (it|them|your)\b|\bfor sale\b(?!\.)/i, why: 'never a marketplace' },
  { pattern: /\baudio notes?\b|\bvoice (notes?|stories)\b/i, why: 'durable voice stories are deferred (FAM03)' },
  { pattern: /\bmaker confirmed\b/i, why: 'the Advisor reads evidence; it does not confirm' },
  { pattern: /\banchor the value\b|\breal comparable sales\b/i, why: 'comparable search has not run in production' },
  { pattern: /\bwith confidence\b|\bconfidence levels?\b/i, why: 'confidence labels are not guarantees (AI03)' },
  { pattern: /\b(what|how much) (they|it)'?s? (are )?worth\b/i, why: 'unknown value is never a defect' },
  { pattern: /\bidentified,? (and )?valued\b|\bidentified & valued\b/i, why: 'not every object can be identified or valued' },
  { pattern: /\bshows each one with\b/i, why: 'comparable display is conditional: the search has not returned anything in production' },
  { pattern: /\bhow it differs from yours\b/i, why: 'per-comparable differences are not rendered (RES03 Partial)' },
  { pattern: /\bnothing runs unless\b|\bonly runs when you ask\b/i, why: 'the photo path searches for comparable sales on its own (captureStore.backgroundCrawlDraft)' },
];

/**
 * "appraisal" may only appear in a sentence that denies it ("not", "never",
 * "no" before the word) or that names the independent professional who
 * provides one ("appraisal from an independent"). "professional" alone is not
 * enough: "a professional appraisal for your collection" must fail.
 */
const APPRAISAL_CONTEXT = /\b(not|never|no)\b[^.!?]*\bappraisals?\b|\bappraisals?\b[^.!?]*\bfrom an independent\b/i;
const APPRAISAL_FIXTURES = [
  ['Heirloom provides a professional appraisal for your collection.', false],
  ['Value estimates are informational only and are not professional appraisals.', true],
  ['a written appraisal from an independent professional in your specialty.', true],
  ['It is labelled as an estimate, never dressed up as an appraisal.', true],
];

/** Sentences the homepage must keep, each the qualification of a former claim, or a launch promise. */
const REQUIRED_ON_HOMEPAGE = [
  { pattern: /evidence for one/i, why: 'estimates are conditioned on evidence' },
  { pattern: /no market value/i, why: 'unknown value is normal' },
  { pattern: /cannot tell/i, why: 'the Advisor says what it cannot tell' },
  { pattern: /grants no one access/i, why: 'the list of who each item is meant for grants nothing' },
  { pattern: /put up for sale/i, why: 'never a marketplace' },
  {
    // Joe's sentence with its scope ("No money for a sale changes hands
    // through Heirloom"), or the launch draft's.
    pattern: /\bno money for a sale changes hands through Heirloom\b|\btakes no part in any sale and handles no money for one\b/i,
    why: "never a marketplace, and no money for a sale; specialists do buy credits from Heirloom (the app repo's legal/TERMS_OF_SERVICE.md §9, counsel's Q8), so the sentence keeps its scope",
  },
  { pattern: /write it down/i, why: 'manual entry is an equal starting path' },
  { pattern: /not professional appraisals/i, why: 'estimates are not appraisals' },
  { pattern: /room by room/i, why: 'the home inventory comes first (D1)' },
  { pattern: /\bThe iPhone app is in the US App Store for now\./, why: 'the US-only line (D57)' },
  // "Works everywhere" holds while web sign-up is open outside the US. If
  // counsel's answer to Q7 (due Nov 20) brings in D66, web sign-up is limited
  // to the US: the hero's and the download band's US-only line, the meta
  // description's "on the web everywhere" and the family card's "can join
  // from a web browser" are reworded, and this pattern with them (the app
  // repo's docs/RELEASE.md, "The website on release day").
  { pattern: /\bHeirloom on the web works everywhere\b/, why: 'the US-only line names the web app (D57)' },
  { pattern: /\bweb\.heirloomapp\.io\b/, why: 'the US-only line names the web app by its address (D57)' },
  // The web works everywhere, but outside the US an account sees no
  // specialists, sold figures or Heirloom's estimates (the app repo's
  // src/lib/release-flags.ts US_ONLY_SURFACES; D26, D57, D85, and the Oct 22
  // answer abroad-total). One sentence scopes the page's estimate, sold-price
  // and specialist lines: Joe's own, approved Oct 22 for the app's country
  // question (country-copy), in the footer note beside his value caveats.
  {
    pattern: /\bSpecialists, sale conversations, sold prices and Heirloom’s price estimates are offered in the United States only for now\./,
    why: 'the US-only surfaces (D85), in the sentence Joe approved on Oct 22 (country-copy)',
  },
];

/** What the homepage's markup must carry, read from the HTML itself (a link is not visible text). */
const REQUIRED_IN_HOMEPAGE_HTML = [
  { pattern: /<a\b[^>]*\bhref="https:\/\/apps\.apple\.com\/us\/app\/id6754576251"/, why: 'the App Store badge opens the app\'s US App Store page (D31)' },
  { pattern: /<a\b[^>]*\bhref="https:\/\/web\.heirloomapp\.io\/?"/, why: 'the US-only line links the web app (D57)' },
];

/**
 * Words the homepage and this README no longer use (S5-16). The beta and its
 * waitlist end at launch. Pass it on is hidden until accepting it moves the
 * whole record (D17), so nothing on the page passes or transfers a record.
 * "Item" is the thing a person owns, never asset, piece, object, possession
 * or treasure (D13, D44, the app's src/lib/glossary.ts and docs/VOICE.md);
 * the professional is a "specialist" (D24, D25). Android has no date (D61).
 * Heirloom keeps a record of what was sent, not a copy of the file (the app
 * repo's docs/submission/listing.md, 2026-10-14).
 * Heirloom takes no part in a sale, but specialists buy credits from it, so
 * no sentence about money goes without that scope (MONEY_RULE).
 * Not part of the claim rules above, which the app repo's
 * docs/submission/check-store-copy.mjs reads and applies to the store copy.
 */
const MONEY_RULE = {
  pattern: /\bno money changes hands\b|\bhandles? (no )?money\b(?! for)/i,
  why: "specialists buy credits from Heirloom (the app repo's legal/TERMS_OF_SERVICE.md §9): say Heirloom takes no part in any sale and handles no money for one",
};
const MONEY_FIXTURES = [
  ['No money changes hands through Heirloom.', true],
  ['No money changes hands through Heirloom: any sale is between you and the specialist you chose.', true],
  ['Heirloom never sells items, takes offers or handles money, and nothing is put up for sale.', true],
  ['It takes no part in any sale and handles no money for one: any sale is between you and the specialist you chose.', false],
  ['No money for a sale changes hands through Heirloom: any sale is between you and the specialist you chose.', false],
];
const HOMEPAGE_WORD_RULES = [
  { pattern: /\bbeta\b/i, why: 'the beta ends at launch' },
  { pattern: /\bearly access\b|\bon the list\b|\ba place for you\b/i, why: 'the waitlist ends at launch: the App Store badge and the web app instead' },
  { pattern: /\bpass(es|ed|ing)? (it|the record|a record|records|an individual record) on\b|\bpass(es|ed|ing)? (a|an individual|the) record to\b/i, why: 'Pass it on is hidden (D17)' },
  { pattern: /\btransfer/i, why: 'nothing on the site transfers a record (D17)' },
  { pattern: /\bonce they accept\b|\bwho accepts it\b/i, why: 'Pass it on is hidden (D17)' },
  {
    pattern: /\bkeeps? a copy of (exactly )?what\b/i,
    why: 'say "keeps a record of what you sent": the app keeps the rows, fields, totals and photo paths, not the file itself (the app repo\'s docs/submission/listing.md, 2026-10-14)',
  },
  MONEY_RULE,
  { pattern: /\b(assets?|pieces?|objects?|possessions?|treasures?)\b/i, why: 'say "item" (D13, D44)' },
  { pattern: /\bexperts?\b/i, why: 'say "specialist" (D24, D25)' },
  { pattern: /\bAndroid\b|\bto follow\b/i, why: 'Android has no date (D61)' },
  {
    // The same list as the app repo's docs/submission/check-store-copy.mjs (BRITISH), plus "labelled".
    pattern: /\b(?!catalogu(?:e|er|ers|es|ed|ing)\b)(catalogu\w*|colour\w*|favour\w*|\w*organis\w*|\w*recognis\w*|jewellery|centre|licence|analys(e|ed|ing)|grey|cheque|honour\w*|behaviour\w*|neighbour\w*|travell\w*|\w*labell\w*)\b/i,
    why: 'American spelling (docs/VOICE.md); "catalogue", "cataloguer" and "cataloguing" are the trade\'s, and Joe\'s (D72)',
  },
];

/**
 * Sentence case for the homepage's titles, eyebrows, navigation and buttons
 * (docs/VOICE.md, "The sentences"): a capital inside one is a name or it is
 * wrong. These are the names the page uses.
 */
const TITLE_NAMES = new Set(['Heirloom', 'Advisor', 'App', 'Store', 'US', 'PDF', 'CSV', 'Apple', 'I', 'Done', 'Settings']);
const TITLE_FIXTURES = [
  ['<h3 class="feature-card__title">An Overview That Adds Up</h3>', ['Overview', 'That', 'Adds', 'Up']],
  ['<p class="section-header__eyebrow">Two Ways In</p>', ['Ways', 'In']],
  ['<h2 class="pitch__title">Your money has an app.<br><em>What about your things?</em></h2>', []],
  ['<h3 class="feature-card__title">Heirloom Advisor</h3>', []],
  ['<div class="nav__links"><a class="nav__link">How it works</a><a class="nav__link">What it does</a></div>', []],
  ['<a class="btn btn--primary">Get Early Access</a>', ['Early', 'Access']],
];

/** The words in a title-like element that are capitalised and not a name. */
function titleCaseHits(html) {
  const pieces = [
    ...[...html.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]),
    ...[...html.matchAll(/<(a|p|span|button|div)\b[^>]*\bclass="[^"]*(?:__eyebrow\b|nav__link(?![\w-])|\bbtn(?![\w-])|hero__kicker(?![\w-]))[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]),
  ];
  const hits = [];
  for (const raw of pieces) {
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&rsquo;|&lsquo;/g, '\u2019')
      .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const words = sentence.split(' ').map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z\u2019']+$/g, ''));
      for (const w of words.slice(1)) {
        const bare = w.replace(/[\u2019']s$/, '');
        if (/^[A-Z]/.test(bare) && !TITLE_NAMES.has(bare)) hits.push({ word: bare, in: text });
      }
    }
  }
  return hits;
}

function visibleText(html) {
  const metas = [...html.matchAll(/<meta[^>]+content="([^"]*)"/g)].map((m) => m[1]);
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return [title, ...metas, body]
    .join(' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&lsquo;/g, '\u2019')
    .replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ');
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/);
}

const failures = [];
const notes = [];
// What must change before the homepage is published (S5-16). Each is a
// failure, so a push to main, CI on a pull request and the legal sync's run
// of this script cannot be green with one left; PRE_RELEASE=1 (a review of
// the launch branch before release day) prints them as notes instead.
const PRE_RELEASE = process.env.PRE_RELEASE === '1';
const beforePublishing = [];

// Self-check: the appraisal context rule must reject the unqualified claim.
for (const [sentence, allowed] of APPRAISAL_FIXTURES) {
  if (APPRAISAL_CONTEXT.test(sentence) !== allowed) {
    failures.push(`APPRAISAL_CONTEXT self-check: expected ${allowed ? 'allowed' : 'rejected'}: ${sentence}`);
  }
}

function checkClaims(label, text) {
  for (const { pattern, why } of [...APP_CLAIM_RULES, ...SITE_CLAIM_RULES]) {
    const hit = pattern.exec(text);
    if (hit) failures.push(`${label}: "${hit[0]}" — ${why}`);
  }
  for (const sentence of sentences(text)) {
    if (/\bappraisals?\b/i.test(sentence) && !APPRAISAL_CONTEXT.test(sentence)) {
      failures.push(`${label}: "appraisal" outside a denial or an independent-professional context: ${sentence.trim()}`);
    }
  }
}

// 1. Claims on the homepage and in the README.
// COPY_CHECK_INDEX lets the rules be run against another homepage (for example
// the previous one, to show what they catch) without touching the site.
const indexPath = process.env.COPY_CHECK_INDEX || resolve(siteRoot, 'index.html');
const indexText = visibleText(readFileSync(indexPath, 'utf8'));
checkClaims('index.html', indexText);
checkClaims('README.md', readFileSync(resolve(siteRoot, 'README.md'), 'utf8'));
// The support page (the App Store's Support URL) answers questions about the
// app in its own words, so it is held to the same claims.
checkClaims('support.html', visibleText(readFileSync(resolve(siteRoot, 'support.html'), 'utf8')));

// 2. Qualifications the homepage must keep.
for (const { pattern, why } of REQUIRED_ON_HOMEPAGE) {
  if (!pattern.test(indexText)) failures.push(`index.html is missing ${pattern} — ${why}`);
}
const indexHtml = readFileSync(indexPath, 'utf8');
for (const { pattern, why } of REQUIRED_IN_HOMEPAGE_HTML) {
  if (!pattern.test(indexHtml)) failures.push(`index.html is missing ${pattern} — ${why}`);
}
// The launch words. A hit reads "index.html says …", not "index.html: …", so
// the app repo's check-store-copy.mjs, which runs this script with
// support.html in the homepage's place (COPY_CHECK_INDEX), does not count a
// word as a broken claim; it reads support.html's words itself (its 5a).
function checkWords(label, text) {
  const found = [];
  for (const { pattern, why } of HOMEPAGE_WORD_RULES) {
    const g = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const m of text.matchAll(g)) found.push(`${label} says "${m[0]}" — ${why}`);
  }
  return found;
}
failures.push(...checkWords('index.html', indexText));
failures.push(...checkWords('README.md', readFileSync(resolve(siteRoot, 'README.md'), 'utf8')));
for (const [sentence, hit] of MONEY_FIXTURES) {
  if (MONEY_RULE.pattern.test(sentence) !== hit) failures.push(`money rule self-check: expected ${hit ? 'caught' : 'allowed'}: ${sentence}`);
}
// support.html answers questions about the build that is live, so its words
// change with the release (S5-16's release-day steps), and are owed before it.
const supportWords = checkWords('support.html', visibleText(readFileSync(resolve(siteRoot, 'support.html'), 'utf8')));
if (supportWords.length) {
  beforePublishing.push(`support.html has ${supportWords.length} word(s) the homepage no longer uses: ${[...new Set(supportWords.map((w) => /says "([^"]+)"/.exec(w)[1].toLowerCase()))].join(', ')}`);
}
for (const [html, want] of TITLE_FIXTURES) {
  const got = titleCaseHits(html).map((h) => h.word);
  if (got.join() !== want.join()) failures.push(`sentence-case self-check: ${html} gave [${got}], expected [${want}]`);
}
for (const { word, in: title } of titleCaseHits(indexHtml)) failures.push(`index.html title case: "${word}" in "${title}" — sentence case (docs/VOICE.md)`);
// The badge is a stand-in until Apple's artwork is downloaded with Joe's OK.
// Apple's guidelines allow only its own badge artwork to be published.
if (/data-badge="placeholder"/.test(indexHtml)) {
  beforePublishing.push("the App Store badge is the placeholder; put Apple's own artwork in its place");
}
// The Terms of October 4 say identifications and valuations "must not be used
// to obtain, set, or support insurance coverage or claims", and the
// homepage's bold line is an inventory ready for your insurer. S5-04 republishes the Terms
// with counsel's answer to Q10; the homepage goes out with them or after.
const termsHtml = readFileSync(resolve(siteRoot, 'terms.html'), 'utf8');
if (/must not be used to obtain, set, or support insurance coverage or claims/.test(termsHtml) && /\binsurer\b/i.test(indexText)) {
  beforePublishing.push(
    'terms.html is still the Terms of October 4 ("must not be used to obtain, set, or support insurance coverage or claims") ' +
      "while the homepage offers an inventory ready for your insurer: publish the homepage with or after S5-04's republished Terms (counsel's Q10)",
  );
}

// 3. Legal pages: the estate wording is asserted directly; full drift needs the source.
for (const [file, musts, mustNots] of [
  [
    'privacy.html',
    [/does not grant access/, /no access is granted from this list/],
    [/grant estate-plan access/, /estate-share recipient/, /record your estate-planning intentions, the information/],
  ],
  [
    'terms.html',
    [
      /does not send an invitation, grant account access, or transfer ownership/,
      /must accept through their own account/,
      /Recording estate-planning intentions grants no one access; see Section 6/,
    ],
    [/Expert-lead marketplace/, /grant estate-plan access/, /record estate-planning intentions, you grant/],
  ],
]) {
  const html = readFileSync(resolve(siteRoot, file), 'utf8');
  for (const p of musts) if (!p.test(html)) failures.push(`${file} is missing ${p}`);
  for (const p of mustNots) if (p.test(html)) failures.push(`${file} still contains ${p}`);
}

if (existsSync(LEGAL_DIR)) {
  const drafts = draftSources(LEGAL_DIR);
  for (const { output, html } of buildAll(LEGAL_DIR)) {
    const source = PAGES.find((p) => p.output === output).source;
    const current = readFileSync(resolve(siteRoot, output), 'utf8');
    // The problem line keeps its wording: the app repo's
    // docs/submission/check-store-copy.mjs reads it as owed to S5-04. Its
    // hint is safe now, since the builder refuses a draft; the note says why.
    if (current !== html) failures.push(`${output} differs from ${LEGAL_DIR}/… — run node scripts/build-legal.mjs`);
    else notes.push(`${output} matches ${LEGAL_DIR}`);
    if (current !== html && drafts.includes(source)) {
      notes.push(
        `${output}: ${source} in LEGAL_DIR is a DRAFT FOR COUNSEL, which build-legal.mjs refuses; ` +
          "to rebuild the published page, set LEGAL_DIR to a folder holding the published texts (the app repo's docs/submission/legal.md §6 names their commits)",
      );
    }
  }
} else {
  notes.push(`skipped: legal drift check (LEGAL_DIR not found at ${LEGAL_DIR})`);
}

// 4. The draft guard (the app repo's docs/submission/legal.md, "Publishing").
// Kept out of part 3, whose sentence list the app repo's check-legal.mjs reads.
const DRAFT_HEADER =
  '<!-- Placeholders completed 2026-07-12 (published at heirloomapp.io). -->\n<!--\nDRAFT FOR COUNSEL, prepared 2026-10-13. NOT PUBLISHED.\n-->\n';
const PUBLISHED_HEADER =
  '<!-- Placeholders completed 2026-07-12 (published at heirloomapp.io). -->\n<!--\nThis draft was generated from a code-level data inventory.\n-->\n';
const DRAFT_FIXTURES = [
  [`${DRAFT_HEADER}# Heirloom Privacy Policy\n`, true, 'the mark in the second header comment'],
  ['<!-- draft for counsel -->\n# Heirloom Terms of Service\n', true, 'the mark in lower case'],
  [`${PUBLISHED_HEADER}# Heirloom Privacy Policy\n`, false, "the published texts' own header (\"This draft was generated\")"],
  [`${PUBLISHED_HEADER}# Heirloom Privacy Policy\n\nAn old DRAFT FOR COUNSEL is gone.\n`, false, 'the mark in the body, not the header'],
];
for (const [text, want, what] of DRAFT_FIXTURES) {
  if (isDraft(text) !== want) failures.push(`draft guard self-check: ${what} should be ${want ? 'refused' : 'allowed'}`);
}

// The command itself, on a copy of the builder in a temporary site, so that a
// guard that failed would overwrite the copy's pages and not this repo's. The
// real path, because the builder runs only when its own path is the one node
// was given (macOS's temporary folder is reached through a link).
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'heirloom-site-guard-')));
try {
  mkdirSync(join(scratch, 'scripts'));
  mkdirSync(join(scratch, 'legal'));
  copyFileSync(resolve(here, 'build-legal.mjs'), join(scratch, 'scripts', 'build-legal.mjs'));
  const companyPath = resolve(here, 'company.json');
  if (existsSync(companyPath)) copyFileSync(companyPath, join(scratch, 'scripts', 'company.json'));
  const pages = () => PAGES.map(({ output }) => readFileSync(join(scratch, output), 'utf8'));
  const run = (...args) =>
    spawnSync(process.execPath, [join(scratch, 'scripts', 'build-legal.mjs'), ...args], {
      env: { ...process.env, LEGAL_DIR: join(scratch, 'legal') },
      encoding: 'utf8',
    });
  const sources = (header) => {
    for (const { source, output } of PAGES) {
      writeFileSync(join(scratch, 'legal', source), `${header}# Heirloom ${source}\n\nThe text.\n`);
      writeFileSync(join(scratch, output), 'the page as published\n');
    }
  };

  sources(DRAFT_HEADER);
  const refused = run();
  if (refused.status !== 2) failures.push(`draft guard: a plain build of a DRAFT FOR COUNSEL exited ${refused.status}, not 2 (refused)`);
  if (pages().some((p) => p !== 'the page as published\n')) failures.push('draft guard: a plain build of a DRAFT FOR COUNSEL wrote a page');
  if (!/refused: .*DRAFT FOR COUNSEL/.test(refused.stderr)) failures.push('draft guard: the refusal does not say why');
  const checked = run('--check');
  if (checked.status !== 1 || !/is a DRAFT FOR COUNSEL/.test(checked.stderr)) failures.push('draft guard: --check on a draft should report it as a draft and exit 1');
  const looked = run('--draft');
  if (looked.status !== 0 || pages().some((p) => !p.includes('The text.'))) failures.push('draft guard: --draft should write the pages');

  sources(PUBLISHED_HEADER);
  const built = run();
  if (built.status !== 0 || pages().some((p) => !p.includes('The text.'))) failures.push('draft guard: a published text should build as before');
  if (!failures.some((f) => f.startsWith('draft guard'))) notes.push('draft guard: a DRAFT FOR COUNSEL is refused (exit 2, nothing written), --draft writes it, a published text builds');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

// A draft built by mistake shows its own dated line. Neither page may carry it.
for (const { output } of PAGES) {
  const html = readFileSync(resolve(siteRoot, output), 'utf8');
  if (/draft for counsel/i.test(html)) failures.push(`${output} says "draft for counsel": it was built from a draft`);
  if (/Last updated:<\/strong> pending\b/.test(html)) failures.push(`${output} is dated "pending": it was built from a draft`);
}

// The Terms sentence part 3 asserts is wrapped across two lines in the app
// repo's next draft ("does not send an" / "invitation, …"). The builder joins
// a paragraph's lines with one space, so the sentence still reads whole on the
// page; this holds the builder to that.
const wrapped = markdownToHtml('Recording a beneficiary or a bequest does not send an\ninvitation, grant account access, or transfer ownership.\n');
if (!wrapped.includes('does not send an invitation, grant account access, or transfer ownership')) {
  failures.push("build-legal.mjs no longer joins a paragraph's wrapped lines, so terms.html's estate sentence would not read whole");
}

for (const o of beforePublishing) {
  if (PRE_RELEASE) notes.push(`owed before publishing (S5-16), a note under PRE_RELEASE=1: ${o}`);
  else failures.push(`owed before publishing (S5-16): ${o} (PRE_RELEASE=1 reviews the launch branch before release day)`);
}

for (const n of notes) console.log(n);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `copy check passed: ${APP_CLAIM_RULES.length + SITE_CLAIM_RULES.length} claim rules, ` +
    `${REQUIRED_ON_HOMEPAGE.length + REQUIRED_IN_HOMEPAGE_HTML.length} required on the homepage, ` +
    `${HOMEPAGE_WORD_RULES.length} word rules, sentence case, ` +
    `the draft guard (${DRAFT_FIXTURES.length} headers and 4 runs of the builder)` +
    (PRE_RELEASE ? `; PRE_RELEASE=1: ${beforePublishing.length} owed before publishing, above` : '; nothing owed before publishing'),
);
