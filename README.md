# Heirloom

**Know What You Own.**

The website for Heirloom — a private record of the art, antiques and keepsakes you own: photograph an item or write down one you already know, learn what is known about it (with an estimate when there is evidence for one), and keep its story for the people you trust.

**Live at [heirloomapp.io](https://heirloomapp.io)**

---

## About

Heirloom is for collectors and families preserving their items. Manual entry and photo-led capture are equal starting paths; the Advisor reads the evidence in the photos and says what it cannot tell; a record is complete without a price; family sharing is by invitation; estate wishes are recorded as intentions. Nothing is ever put up for sale.

This repo is heirloomapp.io: the home page, the app's page, the marks and signatures reference, the guides, support and the legal pages the app links to (`/privacy`, `/terms`), all built by Astro in `site/`.

**Claims on this site must match shipped behavior.** `npm test` (no dependencies) holds the built pages and this README to the app's own copy rules — no universal-valuation, timing, genuineness or estate-access promises — and checks that the legal pages match their sources. See [Keeping the copy honest](#keeping-the-copy-honest).

## How the site is built and deployed

heirloomapp.io is a Cloudflare Worker (`heirloom-site`, `wrangler.jsonc`) serving
`site/dist`, which `site/` builds with Astro. **Every page is an Astro page**
(since Nov 25 2026 there is no HTML in the repository):

- The home page (the house under the loupe), `/app`, the reference (marks,
  signatures and their readers, built from the reference collection the
  Advisor reads; `npm --prefix site run data:sync`), the guides and `/support`
  live in `site/src/pages`. Edit their words there.
- `/privacy` and `/terms` render the published legal texts kept in
  `site/src/content/legal/` with `scripts/build-legal.mjs`'s own renderer.
  Change them in the app repo's `legal/` and run `node scripts/build-legal.mjs`
  (it refuses a DRAFT FOR COUNSEL); the company legal sync in
  thepeninsularcompany.github.io does the same once a year and keeps the
  footer's company markers current.
- `site/scripts/legacy.mjs` copies the repository's own files the site serves
  (images, mark data, icons, the CSV template) into the build, and fails the
  build if an HTML page appears at the root again.
- **The copy check reads the build.** `node scripts/check-copy.mjs` checks the
  home page, support and every guide and marks page in `site/dist` (or the
  folder `COPY_CHECK_PAGES` names), and the legal copies against the app's
  `legal/` (`LEGAL_DIR`). Without a build it says which page rules it skipped.
- **Deploys are automatic.** A launchd job on Joe's Mac
  (`com.heirloom.site-deploy`, `scripts/deploy/auto-deploy.sh`) builds `main`
  every 15 minutes when it or the app data changed, runs the copy check on the
  build, refuses a build that lost more than a tenth of its pages, uploads a
  version that takes no traffic, smoke-tests it, and only then switches
  heirloomapp.io. Push to `main` and it is live within about 15 minutes.
- **Review** with `npm --prefix site run deploy:preview` (`heirloom-site-next`,
  noindex). **Roll back** with `wrangler rollback`.

## Link previews, icons and search

`og-image.jpg` (1200 × 630, the headline and two real screens; JPEG because not every reader of `og:image` takes WebP) is the card a shared link draws. The tab icon and `apple-touch-icon.png` are the app's own icon (the wordmark is unreadable at a tab's size). `apple-itunes-app` gives Safari on iPhone its App Store banner. The home page carries `MobileApplication` structured data.

## Guide and marks pages

**The marks pages** (`/marks/…`, `/silver-hallmarks`, `/signatures`) are built by the site's templates from the reference collection, the records Heirloom Advisor reads (`site/src/pages/marks/`):

- **One template per kind of record:** `[office]-date-letters`, `[reign]-mark`, `chinese/painters/[slug]`, `[artist]-signature`, `[maker]` (the ceramics makers), and the explorers and readers (`silver-marks`, `pottery-marks`, `pottery-date-codes`, `watch-serial-numbers`, …).
- **Editorial pages** (American silver plate, silver and gold basics, the date-code and serial-number pages, the artist-signatures hub) are `site/src/components/GuidePage.astro` over `site/src/content/guides/<slug>.json`: the page's own words and tables, with each grid of mark cards drawn from the collection by record id. They were moved there word for word from the old generators (`site/scripts/extract-guides.py`), and look as those pages did (`site/src/styles/article.css`, first made from the old stylesheets by `site/scripts/article-css.py`; those stylesheets are gone, so edit `article.css` itself).
- **Every page keeps its address, title and description** (`site/src/data/site/page-meta.json`).
- **The facts are the collection's:** the app's mark tables and the research data here that the app's `scripts/reference/collect.ts` reads (`scripts/pages/data/*.json`, `scripts/pages/signatures/*.json`, `scripts/pages/ceramics_data.py`, where every fact carries at least two numbered sources, `{src:a,b}`). Change the data there, not a page.
- **Rolex and Omega:** their tables, `marks/data/rolex.json` and `marks/data/omega.json`, live in this site, compiled to the app's standard (two sources at least, both years kept, nothing interpolated, sources and caveats in the file) but not yet in the app, so the Advisor does not date these serials.
- **The lookups** on the date-code and serial-number pages (`marks/marks.js`, with `marks/data/*.json`) follow the app's decoders in `backend/src/services/mark-decoders.ts`; change them together.
- **Photographs** in `marks/img/` are open-license or public domain, each credited where it is shown.

**The guides** (`/guides`, `/home-inventory-app`, `/antique-identifier-app`, `/home-inventory-checklist`, `/family-heirlooms`) and `/support` are Astro pages in `site/src/pages/` (styles in `site/src/styles/guides.css`). Their words were moved there word for word from the old generator on Nov 25 2026; each guide's questions are one list that renders both the page's questions and its FAQ structured data.

`npm test` holds the home page, the guides, support and every marks page to the copy rules, reading them from a build (`site/dist`, or the folder `COPY_CHECK_PAGES` names).

## Keeping the copy honest

```bash
npm test                  # claim rules over the built pages + README, required qualifications, legal drift
npm run legal:build       # copy the published legal texts from ../Heirloom/legal (or LEGAL_DIR) to site/src/content/legal
npm run legal:check       # exit 1 if the committed copies differ from their sources
```

**Drafts are refused.** While counsel reads the next policy and terms, the app repo's `legal/` holds them as drafts, each with a header comment that says `DRAFT FOR COUNSEL`. `npm run legal:build` refuses such a source: it writes nothing and exits 2, because a push of this repo publishes what it wrote. To rebuild the published copies, put the published texts in a scratch folder and point `LEGAL_DIR` at it: the app repo's `docs/submission/legal.md` §6 names their commits (while the drafts of October 2026 wait, `git show 46347d1e:legal/PRIVACY_POLICY.md` and `git show d699c2ae:legal/TERMS_OF_SERVICE.md`; not `main`, which holds the drafts from build 19's merge on). `node scripts/build-legal.mjs --draft` writes a draft anyway, for a look on this machine; never commit what it writes. `npm test` runs the builder against a draft in a temporary folder to hold it to this, and fails if either page, as the site renders it, carries a draft's words.

The claim rules in `scripts/check-copy.mjs` are copied from the app's `src/components/branding/copy.ts`; when one list changes, change the other. The legal copies are never hand-edited: change the Markdown in the app repo, run `npm run legal:build`, commit both. Any deliberate difference from the Markdown would be listed in `scripts/build-legal.mjs` as `SOURCE_OVERRIDES`, a safety net that applies only while the source still carries the old phrase; the list has been empty since 2026-09-15, when the last corrections landed in the app repo's `legal/`.

The company facts in the legal pages (who provides Heirloom, where, which law governs) and the footer's © line (`site/src/components/Footer.astro`) are not edited here or in the Markdown. They sit between `pc:` comment markers and come from `scripts/company.json`, which the legal sync in [thepeninsularcompany.github.io](https://github.com/joe-at-heirloom/thepeninsularcompany.github.io/tree/main/legal) writes, rebuilding and pushing this site when those facts change. `build-legal.mjs` fills the markers from it.

**The legal sync builds from the app repo's `main`, by itself.** Its entry for this site (`legal/sites.json` there) clones `joe-at-heirloom/heirloom` at `main`, runs `node scripts/build-legal.mjs` with `LEGAL_DIR` pointed at that clone's `legal/`, then `node scripts/check-copy.mjs`, and pushes this repo's `main`, which publishes (its entry names `site/src/components/Footer.astro` for the markers and `site/src/content/legal/*.md` as the outputs). It runs on any change to the company facts and every 1 January, when it rolls the © year. So the draft guard has to be on this repo's `main` before the app repo's `main` holds a draft for counsel: without it, the sync would write the drafts into both copies, and `npm test` would pass them, since its drift check compares the pages with what was just built. With it, the build is refused (exit 2), the sync run fails for this site and pushes nothing; that failure is the guard working, and the facts and the year follow on the first run after the app's `legal/` holds published texts again.
