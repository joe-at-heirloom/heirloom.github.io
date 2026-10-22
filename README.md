# Heirloom

**Know What You Own.**

Landing page for Heirloom — a private record of the art, antiques and keepsakes you own: photograph an item or write down one you already know, learn what is known about it (with an estimate when there is evidence for one), and keep its story for the people you trust.

**Live at [heirloomapp.io](https://heirloomapp.io)**

---

## About

Heirloom is for collectors and families preserving their items. Manual entry and photo-led capture are equal starting paths; the Advisor reads the evidence in the photos and says what it cannot tell; a record is complete without a price; family sharing is by invitation; estate wishes are recorded as intentions. Nothing is ever put up for sale.

This repo contains the landing page with a waitlist signup, plus the legal pages the app links to (`/privacy`, `/terms`).

**Claims on this site must match shipped behavior.** `npm test` (no dependencies) holds `index.html` and this README to the app's own copy rules — no universal-valuation, timing, genuineness or estate-access promises — and checks that the legal pages match their sources. See [Keeping the copy honest](#keeping-the-copy-honest).

## Features (on the landing page)

- Hero with waitlist CTA and an example record in the shape of the app's own (Grandpa's pocket watch, made up and badged Example): its story, a maker still unknown, an estimate still open, and under a loupe the photograph of the movement that would change that
- The watch lies on the hero's stone counter in 3D (`hero-watch.js`, three.js): a turned silver case, an enamel dial painted to a canvas, blued hands and a chain of real links. Scrolling turns the watch a little and the bow drags the chain the way a chain moves on a table: links carry almost no momentum, taut ones are pulled along their own line, slack ones stay put. The hands keep the visitor's own time, a minute fast, as the record's story says, and the loupe shows a rendered photograph of the movement. With reduced motion it is still; without WebGL or script the SVG drawing in `index.html` is shown instead
- Two ways in (photograph it / write it down)
- How it works, what it does, who it's for
- Email waitlist capture via [Formspree](https://formspree.io)
- Responsive design (mobile, tablet, desktop)
- Scroll-triggered animations
- Mobile navigation

## Tech Stack

- Static HTML / CSS / JavaScript (no framework, no build step; `package.json` only carries the check scripts)
- [three.js](https://threejs.org) 0.186.1 for the hero's watch, imported by `hero-watch.js` from jsDelivr's single-file bundle after the page has painted
- [Inter](https://fonts.google.com/specimen/Inter) + [Newsreader](https://fonts.google.com/specimen/Newsreader) via Google Fonts
- [Formspree](https://formspree.io) for waitlist email collection
- Hosted on [GitHub Pages](https://pages.github.com) with custom domain

## Project Structure

```
.
├── index.html      # Landing page
├── privacy.html    # Generated from the app repo's legal/PRIVACY_POLICY.md
├── terms.html      # Generated from the app repo's legal/TERMS_OF_SERVICE.md
├── styles.css      # All styles (CSS custom properties, responsive breakpoints)
├── main.js         # Interactions (nav, animations, form submission, the hero's leader line)
├── hero-watch.js   # The hero's watch and chain in 3D (three.js), with the SVG drawing as its fallback
├── logo.svg        # Heirloom wordmark logo
├── scripts/        # check-copy.mjs (npm test) and build-legal.mjs (legal page generator)
├── CNAME           # Custom domain config (heirloomapp.io)
└── README.md
```

## Local Development

No build tools needed. Just open `index.html` in a browser, or use any local server:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .

# PHP
php -S localhost:8000
```

## Keeping the copy honest

```bash
npm test                  # claim rules over index.html + README, required qualifications, legal drift
npm run legal:build       # regenerate privacy.html and terms.html from ../Heirloom/legal (or LEGAL_DIR)
npm run legal:check       # exit 1 if the committed legal pages differ from their sources
```

**Drafts are refused.** While counsel reads the next policy and terms, the app repo's `legal/` holds them as drafts, each with a header comment that says `DRAFT FOR COUNSEL`. `npm run legal:build` refuses such a source: it writes nothing and exits 2, because a push of this repo publishes what it wrote. To rebuild the published pages, put the published texts in a scratch folder and point `LEGAL_DIR` at it: the app repo's `docs/submission/legal.md` §6 names their commits (while the drafts of October 2026 wait, `git show 46347d1e:legal/PRIVACY_POLICY.md` and `git show d699c2ae:legal/TERMS_OF_SERVICE.md`; not `main`, which holds the drafts from build 19's merge on). `node scripts/build-legal.mjs --draft` writes a draft anyway, for a look on this machine; never commit what it writes. `npm test` runs the builder against a draft in a temporary folder to hold it to this, and fails if either page carries a draft's words.

The claim rules in `scripts/check-copy.mjs` are copied from the app's `src/components/branding/copy.ts`; when one list changes, change the other. The legal pages are never hand-edited: change the Markdown in the app repo, run `npm run legal:build`, commit both. Any deliberate difference from the Markdown would be listed in `scripts/build-legal.mjs` as `SOURCE_OVERRIDES`, a safety net that applies only while the source still carries the old phrase; the list has been empty since 2026-09-15, when the last corrections landed in the app repo's `legal/`.

The company facts in the legal pages (who provides Heirloom, where, which law governs) and the footer's © line are not edited here or in the Markdown. They sit between `pc:` comment markers and come from `scripts/company.json`, which the legal sync in [thepeninsularcompany.github.io](https://github.com/joe-at-heirloom/thepeninsularcompany.github.io/tree/main/legal) writes, rebuilding and pushing this site when those facts change. `build-legal.mjs` fills the markers from it.

**The legal sync builds from the app repo's `main`, by itself.** Its entry for this site (`legal/sites.json` there) clones `joe-at-heirloom/heirloom` at `main`, runs `node scripts/build-legal.mjs` with `LEGAL_DIR` pointed at that clone's `legal/`, then `node scripts/check-copy.mjs`, and pushes this repo's `main`, which publishes. It runs on any change to the company facts and every 1 January, when it rolls the © year. So the draft guard has to be on this repo's `main` before the app repo's `main` holds a draft for counsel: without it, the sync would write the drafts into both pages, and `npm test` would pass them, since its drift check compares the pages with what was just built. With it, the build is refused (exit 2), the sync run fails for this site and pushes nothing; that failure is the guard working, and the facts and the year follow on the first run after the app's `legal/` holds published texts again.

## Adding App Screenshots

When there are real screenshots to show, add them to the project root and reference them from `index.html` in place of the hero's drawn example record. Use screens that show an honest state — an open estimate is a normal result, not something to hide.

## Custom Domain Setup

The `CNAME` file points to `heirloomapp.io`. DNS records needed at your registrar:

| Type  | Name | Value                          |
|-------|------|--------------------------------|
| A     | @    | 185.199.108.153                |
| A     | @    | 185.199.109.153                |
| A     | @    | 185.199.110.153                |
| A     | @    | 185.199.111.153                |
| CNAME | www  | joe-at-heirloom.github.io      |

Then enable "Enforce HTTPS" in repo Settings > Pages.

## Brand

- **Primary color:** `#E84316`
- **Fonts:** Inter (UI/body), Newsreader (headings — the app's brand serif, `HEADING_FACES` in its `tamagui.config.ts`)
- **Logo:** `logo.svg` (wordmark)

## License

All rights reserved. Copyright 2026 Heirloom.
