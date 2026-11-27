// What the app does, said once for the home page's feature grid and the /app
// page's longer tour. The sentences come from the App Store description the
// app repo keeps (docs/submission/listing.md), cut short; the pictures are the
// store's own screenshots of the shipped app on the demo account (/screens/,
// 440 and 660 pixels wide) and, for the marks, a museum photograph from the
// home page's house (data/home/house.json). Keep the words inside what the
// listing says: scripts/check-copy.mjs reads the home page.
export type Shot = { f: string; alt: string; /** Which end of the screen a cropped card shows (default the top). */ crop?: 'top' | 'bottom' };
export type Feature = {
  key: string;
  kicker: string;
  title: string;
  body: string;
  points?: string[];
  shot?: Shot;
  /** A photograph and its mark instead of a screen (the marks feature). */
  photo?: { src: string; mark: string; alt: string; caption: string; credit: string };
};

export const SHOTS: Record<string, Shot> = {
  rooms: { f: '01-rooms', alt: 'Heirloom’s Home screen on iPhone: five rooms, each showing how many of its items are documented, the collection, and the market-estimate and insured-value lines.' },
  pdf: { f: '03-insurance-pdf', alt: 'The insurance inventory PDF Heirloom prepares, open on iPhone: a summary of the owner’s items, a list by room, and each item with its photos.' },
  ask: { f: '04-whats-missing', crop: 'bottom', alt: 'Home on iPhone answering “What isn’t documented yet?”: three items still missing details, listed by name.' },
  value: { f: '06-value', alt: 'A silver cake basket’s record on iPhone: no estimate yet, and an insurance figure shown with who made it and when.' },
  search: { f: '07-search', alt: 'Search on iPhone for “my mother’s things”: two of eight items found, each matched on its description and the owner’s notes.' },
  family: { f: '08-family', alt: 'The “Who can see this” screen on iPhone: the owner, and a relative invited as a Commenter.' },
};

export const FEATURES: Feature[] = [
  {
    key: 'rooms',
    kicker: 'Room by room',
    title: 'Walk a room, one item at a time',
    body: 'Name a room and photograph what is in it. Each item is saved with its photos and its room, so you can keep walking. Or write it down without a photo: both are full records.',
    points: ['Each room and collection shows how much of it is documented', 'Bring in a spreadsheet you already keep, as a CSV file'],
    shot: SHOTS.rooms,
  },
  {
    key: 'pdf',
    kicker: 'For your insurer',
    title: 'A PDF your insurer can read',
    body: 'Choose the items, and Heirloom prepares a PDF, room by room: what each item is in plain words, its photos, serial number, measurements and condition, and its replacement value with where that figure comes from.',
    points: ['Receipts and documents you attach are numbered as exhibits at the back', 'Heirloom names what is missing first, and keeps a record of what you sent, version by version', 'Record your policies, with a reminder 30 days before a renewal'],
    shot: SHOTS.pdf,
  },
  {
    key: 'marks',
    kicker: 'From its marks',
    title: 'What each item is, from its marks',
    body: 'The Advisor reads each item’s photos and marks. Some hallmarks, pottery marks and serial numbers can be dated from published tables, and a dated mark heads the record with the table it came from. It says what it cannot tell, and it never decides whether an item is genuine.',
    points: ['Each detail says how it is known: read from your photo, said by you, from a source, or likely', 'The Advisor is optional, and Heirloom asks first'],
    photo: {
      src: '/home/CD-06-front.jpg',
      mark: '/home/CD-06-hallmarks.jpg',
      alt: 'A pierced silver cake basket with a swing handle.',
      caption: 'Silver cake basket: a lion for sterling, the leopard’s head for London, the maker’s mark, and the date letter for 1753–54.',
      credit: 'Cleveland Museum of Art, open access',
    },
  },
  {
    key: 'value',
    kicker: 'Value',
    title: 'A figure only with its source',
    body: 'Your own figure comes first, and Heirloom never shows a guess of its own as a value. An estimate appears only when there is evidence for one, with its sources. Many items have no market value: a record is complete without one, and it counts as not yet valued, never as zero.',
    points: ['Asking prices, auction estimates and look-alikes are never counted', 'Estimates are labeled as estimates and are not professional appraisals'],
    shot: SHOTS.value,
  },
  {
    key: 'ask',
    kicker: 'Ask',
    title: 'Ask what isn’t documented yet',
    body: 'Ask about what you own in plain words, and Heirloom answers from your own records, showing what it searched for, item by item.',
    shot: SHOTS.ask,
  },
  {
    key: 'search',
    kicker: 'Search',
    title: 'Find things in your own words',
    body: 'Search by name, maker, room, tag, serial number, story or the name your family uses. “My mother’s things” finds what you wrote about her.',
    shot: SHOTS.search,
  },
  {
    key: 'family',
    kicker: 'Family',
    title: 'Your family sees what you choose',
    body: 'Share a collection with a relative by sending a link. By default they see each item’s photos, story and what it is; you choose, share by share, whether they also see values, serial numbers, documents or where things are kept. A relative can add what they remember, from a web browser.',
    points: ['Note who you’d like each item to go to: a private note, and the list grants no one access'],
    shot: SHOTS.family,
  },
];

/** The smaller things, each one line. */
export const ALSO: { t: string; d: string }[] = [
  { t: 'Sold, gifted or lost', d: 'Mark an item that way and its record and history stay.' },
  { t: 'Undo a delete', d: 'A deleted item can be restored for 30 days.' },
  { t: 'Take it all with you', d: 'Download a spreadsheet, your full data and every photo.' },
  { t: 'Two-factor sign-in', d: 'With recovery codes.' },
  { t: 'Private by default', d: 'Photos and documents in private storage. No ads, and your personal information is not sold.' },
  { t: 'Specialists, if you ask', d: 'In the US, an introduction to an independent appraiser or dealer. Nothing is shared unless you accept.' },
];

export const feature = (key: string) => FEATURES.find((f) => f.key === key)!;
