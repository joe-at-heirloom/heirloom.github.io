// The reference pages under /marks/, each by its own title: the pages the
// templates build at the addresses the generated pages had, named as those
// pages were (src/data/site/page-meta.json keeps every one's title), and the
// sections Astro alone renders.
import meta from '../data/site/page-meta.json';

export type Page = { href: string; title: string };

export function referencePages(): Page[] {
  return Object.entries(meta as Record<string, { title: string }>)
    .filter(([path]) => /^\/marks\/[^/]+$/.test(path))
    .map(([href, m]) => ({ href, title: m.title.replace(/ \| Heirloom$/, '').replace(/'/g, '’') }))
    .concat([
      { href: '/marks/chinese/', title: 'Chinese marks: reign marks, hall marks and seals' },
      { href: '/marks/chinese/painters/', title: 'Chinese painters and collectors: seals and signatures' },
      // The Korean section, rendered by Astro only (no generated page at the root).
      { href: '/marks/korean/', title: 'Korean pottery marks and inscriptions: Goryeo, buncheong, Joseon' },
      { href: '/marks/korean-dates', title: 'Korean dates on art and inscriptions: eras, cyclical years, kings' },
      { href: '/marks/korean-ceramics', title: 'Korean pottery and porcelain by period: celadon, buncheong, moon jars' },
    ])
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Signature pages belong to /signatures, not to the marks. */
export const isSignaturePage = (href: string) => /-signature$|\/artist-signatures$|\/chinese\/painters\/$/.test(href);
