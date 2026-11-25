// The site's top level, in order: the app first, then the reference (marks,
// signatures), then guides. The header's panels and the phone menu read this.
export type Link = { href: string; label: string; note?: string };

export const app: Link[] = [
  { href: '/app', label: 'How Heirloom works', note: 'Photograph it or write it down; the record, the story, the evidence' },
  { href: '/home-inventory-app', label: 'Home inventory for insurance', note: 'Room by room, with a PDF your insurer can read' },
  { href: '/family-heirlooms', label: 'Family heirlooms', note: 'The story, the paperwork, who each one is for' },
  { href: '/antique-identifier-app', label: 'For collectors and the curious', note: 'What a photo can tell, and what it cannot' },
];

export const marks: Link[] = [
  { href: '/marks/london-date-letters', label: 'British date letters', note: 'London, Birmingham, Sheffield, Chester' },
  { href: '/marks/silver-marks', label: 'Silver marks', note: 'Solid or plate, maker and years' },
  { href: '/marks/gold-marks', label: 'Gold marks', note: 'Karat, filled or plated' },
  { href: '/marks/pottery-marks', label: 'Pottery and porcelain', note: 'Every maker on one timeline' },
  { href: '/marks/pottery-date-codes', label: 'Pottery date codes', note: 'Wedgwood, Minton, Worcester, Rookwood, Sèvres' },
  { href: '/marks/chinese-reign-marks', label: 'Chinese reign marks', note: 'Ming and Qing, with a finder' },
  { href: '/marks/chinese-hall-marks', label: 'Chinese hall marks', note: 'Halls and studios' },
  { href: '/marks/watch-serial-numbers', label: 'Watch serial numbers', note: 'Rolex, Omega, pocket watches' },
  { href: '/marks/singer-serial-numbers', label: 'Singer serials', note: 'Year and factory' },
  { href: '/marks/leica-serial-numbers', label: 'Leica serials', note: 'Model and year' },
];

export const signatures: Link[] = [
  { href: '/signatures', label: 'Artists’ signatures', note: 'Search dated signatures, painter by painter' },
  { href: '/marks/chinese/painters/', label: 'Chinese painters and collectors', note: 'Their seals and signatures' },
];
export const artists: Link[] = [
  { href: '/marks/claude-monet-signature', label: 'Claude Monet' },
  { href: '/marks/pierre-auguste-renoir-signature', label: 'Pierre-Auguste Renoir' },
  { href: '/marks/vincent-van-gogh-signature', label: 'Vincent van Gogh' },
  { href: '/marks/edgar-degas-signature', label: 'Edgar Degas' },
  { href: '/marks/mary-cassatt-signature', label: 'Mary Cassatt' },
  { href: '/marks/winslow-homer-signature', label: 'Winslow Homer' },
  { href: '/marks/frederic-remington-signature', label: 'Frederic Remington' },
  { href: '/marks/utagawa-hiroshige-signature', label: 'Utagawa Hiroshige' },
];

export const guides: Link[] = [
  { href: '/home-inventory-checklist', label: 'Home inventory checklist', note: 'What to record, with a free spreadsheet' },
  { href: '/silver-hallmarks', label: 'Reading silver hallmarks', note: 'British, American and continental marks' },
  { href: '/marks/is-it-real-silver', label: 'Is it real silver?', note: 'The marks and tests that tell' },
  { href: '/family-heirlooms', label: 'Documenting family heirlooms', note: 'The story, the paperwork, who it’s for' },
  { href: '/antique-identifier-app', label: 'Identifying an antique from a photo', note: 'What a photo can tell, and what it cannot' },
  { href: '/guides', label: 'All guides' },
];

export const APP_STORE = 'https://apps.apple.com/us/app/id6754576251';
export const WEB_APP = 'https://web.heirloomapp.io';
