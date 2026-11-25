// The reference pages at the site's root (marks/*.html, generated outside Astro,
// and the rebuilt ones that share their addresses), each by its own title.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Page = { href: string; title: string };

export function referencePages(): Page[] {
  const root = join(process.cwd(), '..', 'marks');
  return readdirSync(root)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => {
      const t = /<title>(.*?)<\/title>/s.exec(readFileSync(join(root, f), 'utf8'))?.[1] ?? f;
      return { href: `/marks/${f.replace(/\.html$/, '')}`, title: t.replace(/ \| Heirloom$/, '').replace(/&#x27;/g, '’').replace(/&amp;/g, '&') };
    })
    .concat([
      { href: '/marks/chinese/', title: 'Chinese marks: reign marks, hall marks and seals' },
      { href: '/marks/chinese/painters/', title: 'Chinese painters and collectors: seals and signatures' },
    ])
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Signature pages belong to /signatures, not to the marks. */
export const isSignaturePage = (href: string) => /-signature$|\/artist-signatures$|\/chinese\/painters\/$/.test(href);
