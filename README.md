# Heirloom

**Know What You Own.**

Landing page for Heirloom — a private record of the art, antiques and keepsakes you own: photograph a possession or write down one you already know, learn what is known about it (with an estimate when there is evidence for one), keep its story, and pass the record on to the people you trust.

**Live at [heirloomapp.io](https://heirloomapp.io)**

---

## About

Heirloom is for collectors and families preserving their possessions. Manual entry and photo-led capture are equal starting paths; the Advisor reads the evidence in the photos and says what it cannot tell; a record is complete without a price; family sharing is by invitation; estate wishes are recorded as intentions, and an individual record can be passed to a named person who accepts it. Nothing is ever put up for sale.

This repo contains the landing page with a waitlist signup, plus the legal pages the app links to (`/privacy`, `/terms`).

**Claims on this site must match shipped behaviour.** `npm test` (no dependencies) holds `index.html` and this README to the app's own copy rules — no universal-valuation, timing, genuineness or estate-access promises — and checks that the legal pages match their sources. See [Keeping the copy honest](#keeping-the-copy-honest).

## Features (on the landing page)

- Hero with waitlist CTA and an honest mock-up (estimate still open, Advisor naming what it cannot tell)
- Two ways in (photograph it / write it down)
- How it works, what it does, who it's for
- Email waitlist capture via [Formspree](https://formspree.io)
- Responsive design (mobile, tablet, desktop)
- Scroll-triggered animations
- Mobile navigation

## Tech Stack

- Static HTML / CSS / JavaScript (no framework, no build step; `package.json` only carries the check scripts)
- [Inter](https://fonts.google.com/specimen/Inter) + [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) via Google Fonts
- [Formspree](https://formspree.io) for waitlist email collection
- Hosted on [GitHub Pages](https://pages.github.com) with custom domain

## Project Structure

```
.
├── index.html      # Landing page
├── privacy.html    # Generated from the app repo's legal/PRIVACY_POLICY.md
├── terms.html      # Generated from the app repo's legal/TERMS_OF_SERVICE.md
├── styles.css      # All styles (CSS custom properties, responsive breakpoints)
├── main.js         # Interactions (nav, animations, form submission)
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

The claim rules in `scripts/check-copy.mjs` are copied from the app's `src/components/branding/copy.ts`; when one list changes, change the other. The legal pages are never hand-edited: change the Markdown in the app repo, run `npm run legal:build`, commit both. Any deliberate difference from the Markdown would be listed in `scripts/build-legal.mjs` as `SOURCE_OVERRIDES`, a safety net that applies only while the source still carries the old phrase; the list has been empty since 2026-09-15, when the last corrections landed in the app repo's `legal/`.

## Adding App Screenshots

When there are real screenshots to show, add them to the project root and reference them from `index.html` in place of the CSS mock-up. Use screens that show an honest state — an open estimate is a normal result, not something to hide.

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
- **Fonts:** Inter (UI/body), Playfair Display (headings)
- **Logo:** `logo.svg` (wordmark)

## License

All rights reserved. Copyright 2026 Heirloom.
