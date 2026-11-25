// /privacy and /terms: the published legal texts the repository keeps in
// site/src/content/legal (written by scripts/build-legal.mjs from the app
// repo's legal/, company facts applied, drafts refused), rendered with that
// script's own markdownToHtml, so the page is exactly what the copy check and
// the legal sync check.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function legalPage(name: 'privacy' | 'terms') {
  const repo = join(process.cwd(), '..');
  const builder = await import(/* @vite-ignore */ pathToFileURL(join(repo, 'scripts', 'build-legal.mjs')).href);
  const page = builder.PAGES.find((p: { path: string }) => p.path === `/${name}`);
  const text = readFileSync(join(repo, page.output), 'utf8');
  return { title: page.title as string, heading: (page.title as string).split(' — ')[0], body: builder.renderLegal(text, page.title) as string };
}
