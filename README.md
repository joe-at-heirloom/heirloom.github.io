# Heirloom

**Know What You Own.**

Pre-launch teaser site for Heirloom — an AI-powered platform for identifying, valuing, and managing art, antiques, and luxury collections.

**Live at [heirloomapp.io](https://heirloomapp.io)**

---

## About

Heirloom helps collectors, appraisers, auction houses, and estate professionals manage physical assets with confidence. The app combines AI identification, expert authentication, insurance-ready reporting, and marketplace tools in one platform.

This repo contains the pre-launch landing page with a waitlist signup.

## Features (on the landing page)

- Hero section with waitlist CTA
- Feature overview (AI identification, expert network, collection management, insurance, marketplace, estate planning)
- Audience cards (collectors, experts, auction houses, insurance/estate professionals)
- Email waitlist capture via [Formspree](https://formspree.io)
- Responsive design (mobile, tablet, desktop)
- Scroll-triggered animations
- Mobile navigation

## Tech Stack

- Static HTML / CSS / JavaScript (no framework, no build step)
- [Inter](https://fonts.google.com/specimen/Inter) + [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) via Google Fonts
- [Formspree](https://formspree.io) for waitlist email collection
- Hosted on [GitHub Pages](https://pages.github.com) with custom domain

## Project Structure

```
.
├── index.html      # Landing page
├── styles.css      # All styles (CSS custom properties, responsive breakpoints)
├── main.js         # Interactions (nav, animations, form submission)
├── logo.svg        # Heirloom wordmark logo
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

## Adding App Screenshots

There are commented-out sections in `index.html` ready for screenshots. When the app is ready:

1. Add these image files to the project root:
   - `screenshot-dashboard.png` — App dashboard / collection overview
   - `screenshot-ai.png` — AI identification screen
   - `screenshot-collection.png` — Collection grid/list view
   - `screenshot-detail.png` — Single item detail page

2. Uncomment the hero screenshot block (~line 55)

3. Uncomment the full preview section (~line 130)

4. Uncomment the "Preview" nav link (~line 23)

Search for `TODO` in `index.html` to find all placeholder locations.

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
