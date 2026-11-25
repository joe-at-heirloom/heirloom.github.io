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
| Guide pages | `components/GuidePage.astro` (main's `[...guide].astro`, `content/guides`) | the article pages (plate makers, silver by country, standards, date codes, serial lookups) inside the frame; a page with a lookup is reached by a full page load so `marks.js` runs |

## Sheets on demand, and big directories

A catalogue with `lazy="<name>"` carries only its rows; each group's sheets
are one companion file, `/marks/data/sheets/<name>--<group>.html`
(`pages/marks/data/sheets/[chunk].astro`), fetched the first time a row of
that group opens. Pages and companion files build from the same functions
(`lib/catalogues.ts`); add a new lazy catalogue to `sheetChunks()` there.

Directories (`lib/makers-dir.ts`, DIRS) are one page per place under one
address, with a hub (`components/ref/DirHub.astro`), place pages
(`DirPlace.astro`) and, for a place over 1,500 marks, a page per letter
(`DirLetter.astro`; the place page becomes a hub of letters and sends an old
`#id` link to its letter):

- `british`: Jackson's makers' marks by town, `/marks/british-silver-makers/`
- `american`: the 1896 trademarks by section and Okie's early silversmiths,
  `/marks/american-silver-makers/`
- `yearmarks`: American firms' year marks, `/marks/american-silver-date-marks/`
- `continental`: Okie's continental marks by country, `/marks/continental-silver-marks/`

A new directory is one DIRS entry (family, address, how places are named and
grouped, a sheet), a hub page, thin route files like the others, its links in
the map, and its route in the app's collect.ts BUILDS_EVERY.

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
- Every other reference page inside the frame, the guide pages included;
  the seven new assay offices (cherry-picked from `marks/more-offices`).
- Record text in the site's voice (`clean`, `voice` in `lib/records.ts`);
  translations marked `class="tr"`, designations as names. Checked against
  the live build with the copy rules: nothing new, about 190 fewer findings.

## Not done yet

- The record text itself: hall-mark owners still read like research
  ("Disputed: princely (饮流斋…) vs. a Forbidden City hall"). The templates
  tidy what they safely can; an editorial pass on the data, like the Japanese
  one, is the real fix.
- Per-record pages (one address per hall, maker or seal) are not made; records
  keep their anchors on their catalogue page.

## Landing

Merged to main on Nov 25, 2026 (Joe: "merge to main"). A new dynamic route
must add its pages to `astroRoutes()` in `lib/reference.ts`, or the map will
not link them. The site-identity branch (header, Base) will need a rebase
over this. Build with
`APP_REPO=… APP_REF=origin/main node scripts/sync-data.mjs` first, then
`npm run build`.

## Pewabic Pottery (Nov 25, 2026)

A maker with a section of its own, in the pottery area (map group "Pewabic
Pottery, Detroit"): `/marks/pewabic-pottery/` (home), `/marks/pewabic-pottery-marks`
(dating key + catalogue of the marks), `…/tile-installations` (catalogue by
place, sheets on demand as `pewabic-tiles--<group>`), `…/glazes`, `…/history`,
`…/museum-collections`. Data: the marks are marks-database entries (the app's
`marks/pewabic.json`, group `ceramics-makers`, so the pottery explorer shows
them); everything else is the app's `pewabic.json`, read by `lib/pewabic.ts`
from `src/data/app/` (synced) and, as family `pewabic` records, by the Advisor.
Both are built from the research in `hallmark-sources/pewabic/`
(`build_marks.py`, `build_table.py`, `edits.json`); change those, not the JSON.
Anchors match the app's collect.ts (tiles `#<id>`, glazes `#<id>` and
`#ware-<id>`, history `#ev-nnn` and `#person-<id>`, marks `#era-<id>` and
`#lookalike-<id>`).

## Oriental rugs (Nov 25, 2026)

An area of its own (map key `rugs`, `/marks/rugs/`): the area home, `identify`
("turn it over": the RugReader island matches answered structure features
against every type), `handmade-or-machine-made` (the checks, materials
`#mat-<id>`), `dates` (RugDateReader island on `lib/rug-dates.ts`, a copy of
the app's `backend/src/lib/rug-dates.ts`, the Advisor's own rules; calendars
`#cal-<id>`, signatures `#sig-<id>`), `knot-count` (KnotCounter island, each
notation's `formula` from the table, `#knot-<id>`), `types` (catalogue, `#<id>`),
`labels` (`#label-<id>`) and `dyes` (`#dye-<id>`, `#treat-<id>`, rules
`#dye-rule-<id>`). Data: the app's `rugs.json`, read by `lib/rugs.ts` from
`src/data/app/` (synced) and, as family `rugs` records, by the Advisor. It is
built from the research in `hallmark-sources/rugs/` (`build_table.py`,
`edits.json`); change those, not the JSON. Pictures of types:
`marks/img/rugs/` (`images_to_web.py`), museum photographs under open
licences only. Anchors match the app's `reference-ids.ts`.
