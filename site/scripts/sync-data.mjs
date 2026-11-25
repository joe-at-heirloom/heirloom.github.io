// Bring the facts the site renders into src/data, committed, so a build needs
// nothing outside this repository (Cloudflare builds from the repo alone).
//
//   src/data/app/   the app's mark tables, read from the app repository with
//                   `git show` at APP_REF (default origin/main): the same
//                   tables Heirloom Advisor reads, so site and app agree.
//   src/data/site/  the website repo's own research data (image indexes,
//                   kiln-site notes), copied from ../marks and ../scripts.
//
//   APP_REPO  the app repository (default: ~/Apps/Heirloom)
//   APP_REF   branch or commit to read (default: origin/main, fetched first)
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const repo = join(site, '..');
const APP_REPO = process.env.APP_REPO || join(homedir(), 'Apps', 'Heirloom');
const APP_REF = process.env.APP_REF || 'origin/main';
const git = (...a) => execFileSync('git', ['-C', APP_REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

if (APP_REF.startsWith('origin/')) {
  try { git('fetch', '-q', 'origin', APP_REF.slice(7)); } catch { console.warn('[sync] fetch failed; using what is there'); }
}
const sha = git('rev-parse', '--short', APP_REF).trim();
const PREFIX = 'backend/src/data/mark-tables';
const out = join(site, 'src', 'data', 'app');
mkdirSync(join(out, 'marks'), { recursive: true });

const tables = ['hallmarks', 'chinese'];
for (const t of tables) writeFileSync(join(out, `${t}.json`), git('show', `${APP_REF}:${PREFIX}/${t}.json`));
const dbFiles = git('ls-tree', '--name-only', `${APP_REF}:${PREFIX}/marks`).split('\n').filter((n) => n.endsWith('.json'));
for (const n of dbFiles) writeFileSync(join(out, 'marks', n), git('show', `${APP_REF}:${PREFIX}/marks/${n}`));
// When each table last changed in the app repo: a page's "Updated" date is
// the day its facts last changed, not the day the site was built.
const changed = {};
for (const t of tables) changed[t] = git('log', '-1', '--format=%cs', APP_REF, '--', `${PREFIX}/${t}.json`).trim();
changed.marks = git('log', '-1', '--format=%cs', APP_REF, '--', `${PREFIX}/marks`).trim();
writeFileSync(join(out, 'SOURCE.json'), JSON.stringify({ repo: 'heirloom (app)', ref: APP_REF, commit: sha, changed }, null, 2) + '\n');

const siteOut = join(site, 'src', 'data', 'site');
mkdirSync(join(siteOut, 'chinese'), { recursive: true });
const chImg = join(repo, 'marks', 'img', 'chinese');
for (const f of readdirSync(chImg)) if (/^index.*\.json$/.test(f)) copyFileSync(join(chImg, f), join(siteOut, 'chinese', f));
copyFileSync(join(repo, 'scripts', 'pages', 'data', 'chinese_kiln.json'), join(siteOut, 'chinese_kiln.json'));
// The whole reference collection (marks, letters, reigns, halls, kiln facts,
// people and seals, signatures, makers), built by the same collect.ts that
// publishes it to the Advisor's database, from the app's kept checkout at its
// main (.claude/worktrees/_keep/reference-publisher; REFERENCE_CHECKOUT to
// name another). Generated, not committed: src/data/generated/.
const KEPT = process.env.REFERENCE_CHECKOUT || join(APP_REPO, '.claude', 'worktrees', '_keep', 'reference-publisher');
const genDir = join(site, 'src', 'data', 'generated');
mkdirSync(genDir, { recursive: true });
execFileSync(join(KEPT, 'node_modules', '.bin', 'tsx'), [join(KEPT, 'scripts', 'reference', 'collect.ts'), join(genDir, 'collection.json')], {
  env: { ...process.env, APP_REPO: KEPT, APP_REF, SITE_REPO: repo, SITE_REF: process.env.SITE_REF || 'origin/main' },
  stdio: ['ignore', 'ignore', 'inherit'],
  maxBuffer: 1 << 28,
});
// Drop the build time: the same research must give the same file, or the
// deploy job (which fingerprints src/data) would redeploy on every run.
{
  const file = join(genDir, 'collection.json');
  const c = JSON.parse(readFileSync(file, 'utf8'));
  delete c.meta.built_at;
  writeFileSync(file, JSON.stringify(c));
}
console.log(`[sync] ${tables.length} tables + ${dbFiles.length} marks-db files from app ${APP_REF} (${sha}); site data copied`);
