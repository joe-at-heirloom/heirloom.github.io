# The reference: how it is put together

Branch `reference/overhaul` (Nov 25, 2026). Built while the data imports finish;
not on main, not live.

## What was wrong

- **No structure between collections.** The marks hub mixed raw data groups
  ("british makers", "chinese dating" in lower case), a hand-kept list of
  13 tools (no Japan, half of Korea) and a dump of 76 page titles. Maker pages
  (Meissen, Hummel, Gorham…), the serial lookups and the silver guides were
  reachable only through that dump.
- **Marks and Signatures were two doors**, but Chinese painters, Japanese
  print artists and Hokusai/Hiroshige belong to both, so the header,
  breadcrumbs and tabs disagreed page to page.
- **Three looks**: the old generated article pages, the Astro explorers, and
  the Chinese section with its own tabs. Japan and Korea had their own tabs;
  silver and pottery had none.
- **Records shown as research notes**: "(per 百度TA說)", "not stated in
  sources read; gap", British spelling, "object" where the site says "item";
  Japanese marks set horizontally in beige tiles though marks are written in
  columns; source shorthand instead of numbered sources.
- Stale facts in titles (London "1678–2000" when the table runs 1479–2026).

## The structure

`src/lib/reference.ts` is the one map. Seven areas, by what a reader is
holding: silver and gold, pottery and porcelain, China, Japan, Korea, artists'
signatures, watches and serial numbers. Each area lists its pages in the order
a reader needs them (the tools that read a mark, then catalogues, makers,
guides). Everything reads the map:

- the header (one **Reference** door; its panel lists every area),
- the reference home (`/marks/`) and each area's home,
- the rail beside every reference page (a menu under the crumbs on a phone),
- the breadcrumbs (Heirloom › Reference › area › page) and their JSON-LD,
- next and previous within an area, and the other areas at the foot.

**A link appears only when its page is built** (`isBuilt`). Pages that data
still to come will fill already sit in the map (British makers by office);
they show up everywhere the day their route exists.

## Page kinds

| Kind | Where | What it is |
| --- | --- | --- |
| Reference home | `pages/marks/index.astro` | search; "what do you see on it?" (one card per area, real pictures); Chinese, Japanese or Korean told apart; every area; how the reference is made |
| Area home | `components/ref/AreaHome.astro` (`/marks/silver/`, `/marks/pottery/`, `/marks/serial-numbers/`) | the tools as cards, every page by group, what the collection holds there, the sources most of it comes from |
| Catalogue | `components/ref/Catalogue.astro` | every record of a kind, grouped; each row opens into its sheet in place; search, group chips, a character picker; `#anchor` and the old `?mark=` open a record |
| Record sheet | `components/ref/RecordSheet.astro`, `lib/records.ts` | the mark (photo, book cut, drawing, or characters set in type in columns, labeled as such); facts in plain words; where the sources differ; a caution; sources numbered |
| Tools and readers | the islands | kept as they were (silver, gold, pottery, date codes, reigns, date letters, watches, Japanese and Korean dates, print seals), now inside the frame |
| Older generated pages | `pages/marks/[...legacy].astro` | the remaining `marks/*.html` pages framed with their own words, structured data and lookups (`styles/lookups.css`); reached by a full page load so `marks.js` runs |

## Adding a collection (what is still coming)

1. The records reach the collection (the app's `collect.ts`), as today.
2. A page: usually a catalogue. Write a sheet adapter in `lib/records.ts`
   (the record's fields → labeled facts) and a page that groups the sheets
   (see `pages/marks/chinese/imperial-seals.astro`, about 40 lines).
3. One line in the map (`lib/reference.ts`), in the area and group it belongs to.

## What is on the branch

- Map, frame, header, reference home, three new area homes.
- Hall marks, Japanese marks and Korean inscriptions rebuilt as catalogues
  (the Japanese and Korean timelines are gone; the character picker stays).
- New pages from records already in the collection:
  `/marks/chinese/dating` (a date reader: 乾隆十年, 康熙辛亥, 民國二十年, a
  cyclical year alone; era names Song to Yuan, the sixty-year cycle, taboo
  characters) and `/marks/chinese/imperial-seals` (69 seals by dynasty, the
  catalogue seal sets).
- Every other reference page inside the frame; the 28 older generated pages
  framed; the seven new assay offices (cherry-picked from `marks/more-offices`).
- Record text in the site's voice (`clean`, `voice` in `lib/records.ts`);
  translations marked `class="tr"`, designations as names. Checked against
  the live build with the copy rules: nothing new, about 190 fewer findings.

## Not done yet

- British makers by place (`/marks/british-silver-makers/<place>`, 7,833
  marks across 41 places): the map lists every place the records name; the
  pages are being built elsewhere. London alone is 4,349 marks, too many for
  full sheets in one page: rows first, sheets fetched when opened.
- The record text itself: hall-mark owners still read like research
  ("Disputed: princely (饮流斋…) vs. a Forbidden City hall"). The templates
  tidy what they safely can; an editorial pass on the data, like the Japanese
  one, is the real fix.
- Guides at the site's root (`/silver-hallmarks`) open outside the frame.
- Per-record pages (one address per hall, maker or seal) are not made; records
  keep their anchors on their catalogue page.

## Landing

Rebase on main once the imports stop. Expect conflicts in `Header.astro` and
`Base.astro` (the site-identity branch), the pages other sessions converted
since (e.g. main 1fcb878, the silver, plate and gold guides: if they become a
dynamic route, add its pages to `astroRoutes()` or `[...legacy]` will make
them twice), and the Japanese and Korean pages. Build with
`APP_REPO=… APP_REF=origin/main node scripts/sync-data.mjs` first, then
`npm run build`.
