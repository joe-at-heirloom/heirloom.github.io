// What every page shares: the organization, the guides list, structured
// data, and the site's word rules. Ported from scripts/pages/shell.py so a
// rebuilt page says and declares what the generated one did.
export const SITE = 'https://heirloomapp.io';
export const APP_URL = 'https://apps.apple.com/us/app/id6754576251';
export const WEB_APP = 'https://web.heirloomapp.io';

export const ORG = {
  '@type': 'Organization',
  '@id': SITE + '/#org',
  name: 'Heirloom',
  legalName: 'The Peninsular Company, LLC',
  url: SITE + '/',
  logo: SITE + '/icon-192.png',
  email: 'support@heirloomapp.io',
  parentOrganization: { '@type': 'Organization', name: 'The Peninsular Company, LLC', url: 'https://thepeninsularcompany.com' },
};
export const WEBSITE = { '@type': 'WebSite', '@id': SITE + '/#website', name: 'Heirloom', url: SITE + '/', publisher: { '@id': SITE + '/#org' } };

export const GUIDES: [string, string, string][] = [
  ['/marks/', 'Marks and serial numbers', 'Date British silver by its letter, and look up Singer, pocket-watch and Leica serial numbers.'],
  ['/home-inventory-app', 'Home inventory app', 'Walk your home room by room and make a PDF inventory your insurer can read.'],
  ['/antique-identifier-app', 'Antique identifier app', 'What an app can read in a photo of an antique, and what it cannot tell.'],
  ['/home-inventory-checklist', 'Home inventory checklist', 'Room by room, what to record for each item, and a free spreadsheet template.'],
  ['/silver-hallmarks', 'Silver hallmarks', 'How to read British, American and continental silver marks, and the marks that mean plate.'],
  ['/family-heirlooms', 'Family heirlooms', "How to record an heirloom's story, keep its paperwork and decide who it is meant for."],
];

/** The site's word rules (scripts/pages/p_marks.py soften): an owner's thing is an item; American spelling. */
export function soften(text: string) {
  const pairs: [string, string][] = [
    ['with confidence', 'as certain'], ['being transferred to', 'being moved to'], ['transferred', 'moved'],
    ['Labelled', 'Labeled'], ['labelled', 'labeled'], ['centre', 'center'], ['grey', 'gray'], ['Pieces', 'Items'],
  ];
  for (const [a, b] of pairs) text = text.split(a).join(b);
  return text
    .replace(/first piece/g, 'first item')
    .replace(/a genuine piece/g, 'a genuine item')
    .replace(/ pieces/g, ' items')
    .replace(/ piece/g, ' item');
}

export const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function articleLd(path: string, headline: string, description: string, date: string, extra: object = {}) {
  return {
    '@type': 'Article',
    '@id': SITE + path + '#article',
    headline,
    description,
    url: SITE + path,
    mainEntityOfPage: SITE + path,
    datePublished: date,
    dateModified: date,
    inLanguage: 'en-US',
    image: SITE + '/og-image.jpg',
    author: { '@id': SITE + '/#org' },
    publisher: { '@id': SITE + '/#org' },
    isPartOf: { '@id': SITE + '/#website' },
    mentions: { '@id': SITE + '/#app' },
    ...extra,
  };
}

export function faqLd(path: string, faqs: [string, string][]) {
  return {
    '@type': 'FAQPage',
    '@id': SITE + path + '#faq',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: stripTags(q), acceptedAnswer: { '@type': 'Answer', text: stripTags(a) } })),
  };
}

export function crumbsLd(path: string, name: string, mid?: [string, string]) {
  const items: object[] = [{ '@type': 'ListItem', position: 1, name: 'Heirloom', item: SITE + '/' }];
  if (mid) items.push({ '@type': 'ListItem', position: 2, name: mid[1], item: SITE + mid[0] });
  items.push({ '@type': 'ListItem', position: items.length + 1, name, item: SITE + path });
  return { '@type': 'BreadcrumbList', '@id': SITE + path + '#crumbs', itemListElement: items };
}

export function longDate(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
