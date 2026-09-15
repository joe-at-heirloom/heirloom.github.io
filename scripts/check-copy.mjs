#!/usr/bin/env node
// Holds the website to what the app actually does (plan item ON04).
//
//   node scripts/check-copy.mjs
//
// Three checks, all without dependencies:
//  1. The visible text of index.html and README.md makes none of the promises
//     the app's own copy rules forbid. The first list below is copied from
//     src/components/branding/copy.ts (UNSUPPORTED_CLAIM_RULES) in the app repo;
//     keep the two in step. The second list is website-specific.
//  2. The homepage still carries the qualifications the plan asks for
//     (evidence-conditioned estimates, "cannot tell", estate list grants no
//     access, transfers need acceptance, nothing for sale).
//  3. privacy.html and terms.html match the app repo's legal Markdown when it
//     can be found (LEGAL_DIR, default ../Heirloom/legal); otherwise that check
//     is reported as skipped by name, never as a pass.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll, LEGAL_DIR } from './build-legal.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');

/** From src/components/branding/copy.ts — promises the shipped product does not keep. */
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
];

/**
 * "appraisal" may only appear while saying what Heirloom is not, or while
 * naming the independent professional who provides one.
 */
const APPRAISAL_CONTEXT = /\b(not|never|no|independent|professional)\b/i;

/** Sentences the homepage must keep, each the qualification of a former claim. */
const REQUIRED_ON_HOMEPAGE = [
  { pattern: /evidence for one/i, why: 'estimates are conditioned on evidence' },
  { pattern: /no market value/i, why: 'unknown value is normal' },
  { pattern: /cannot tell/i, why: 'the Advisor says what it cannot tell' },
  { pattern: /grants no one access/i, why: 'the estate list grants nothing' },
  { pattern: /once they accept/i, why: 'a transfer needs the recipient to accept' },
  { pattern: /put up for sale/i, why: 'never a marketplace' },
  { pattern: /write it down/i, why: 'manual entry is an equal starting path' },
  { pattern: /not professional appraisals/i, why: 'estimates are not appraisals' },
  { pattern: /\bnow in beta\b/i, why: 'the beta is named as a beta' },
];

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
    .replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ');
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/);
}

const failures = [];
const notes = [];

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

// 2. Qualifications the homepage must keep.
for (const { pattern, why } of REQUIRED_ON_HOMEPAGE) {
  if (!pattern.test(indexText)) failures.push(`index.html is missing ${pattern} — ${why}`);
}

// 3. Legal pages: the estate wording is asserted directly; full drift needs the source.
for (const [file, musts, mustNots] of [
  ['privacy.html', [/does not grant access/, /no access is granted from this list/], [/grant estate-plan access/, /estate-share recipient/]],
  ['terms.html', [/does not send an invitation, grant account access, or transfer ownership/, /must accept through their own account/], [/Expert-lead marketplace/, /grant estate-plan access/]],
]) {
  const html = readFileSync(resolve(siteRoot, file), 'utf8');
  for (const p of musts) if (!p.test(html)) failures.push(`${file} is missing ${p}`);
  for (const p of mustNots) if (p.test(html)) failures.push(`${file} still contains ${p}`);
}

if (existsSync(LEGAL_DIR)) {
  for (const { output, html } of buildAll(LEGAL_DIR)) {
    const current = readFileSync(resolve(siteRoot, output), 'utf8');
    if (current !== html) failures.push(`${output} differs from ${LEGAL_DIR}/… — run node scripts/build-legal.mjs`);
    else notes.push(`${output} matches ${LEGAL_DIR}`);
  }
} else {
  notes.push(`skipped: legal drift check (LEGAL_DIR not found at ${LEGAL_DIR})`);
}

for (const n of notes) console.log(n);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`copy check passed: ${APP_CLAIM_RULES.length + SITE_CLAIM_RULES.length} claim rules, ${REQUIRED_ON_HOMEPAGE.length} required qualifications`);
