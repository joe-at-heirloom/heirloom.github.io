import json, html

SITE = "https://heirloomapp.io"
TODAY = "2026-11-22"
TODAY_TEXT = "November 22, 2026"
APP_URL = "https://apps.apple.com/us/app/id6754576251"

GUIDES = [
    ("/marks/", "Marks and serial numbers", "Date British silver by its letter, and look up Singer, pocket-watch and Leica serial numbers."),
    ("/home-inventory-app", "Home inventory app", "Walk your home room by room and make a PDF inventory your insurer can read."),
    ("/antique-identifier-app", "Antique identifier app", "What an app can read in a photo of an antique, and what it cannot tell."),
    ("/home-inventory-checklist", "Home inventory checklist", "Room by room, what to record for each item, and a free spreadsheet template."),
    ("/silver-hallmarks", "Silver hallmarks", "How to read British, American and continental silver marks, and the marks that mean plate."),
    ("/family-heirlooms", "Family heirlooms", "How to record an heirloom's story, keep its paperwork and decide who it is meant for."),
]

ORG = {
    "@type": "Organization",
    "@id": SITE + "/#org",
    "name": "Heirloom",
    "legalName": "The Peninsular Company, LLC",
    "url": SITE + "/",
    "logo": SITE + "/icon-192.png",
    "email": "support@heirloomapp.io",
    "parentOrganization": {"@type": "Organization", "name": "The Peninsular Company, LLC", "url": "https://thepeninsularcompany.com"},
}
WEBSITE = {"@type": "WebSite", "@id": SITE + "/#website", "name": "Heirloom", "url": SITE + "/", "publisher": {"@id": SITE + "/#org"}}
APP = {"@id": SITE + "/#app"}


def ld(graph):
    return '<script type="application/ld+json">\n' + json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=2, ensure_ascii=False) + "\n  </script>"


def strip_tags(s):
    import re
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(" ".join(s.split()))


def faq_html(faqs):
    out = ['<div class="faq">']
    for q, a in faqs:
        out.append(f"<details>\n  <summary>{q}</summary>\n  <div>{a}</div>\n</details>")
    out.append("</div>")
    return "\n".join(out)


def faq_ld(path, faqs):
    return {
        "@type": "FAQPage",
        "@id": SITE + path + "#faq",
        "mainEntity": [
            {"@type": "Question", "name": strip_tags(q), "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}}
            for q, a in faqs
        ],
    }


def crumbs_ld(path, name, mid=None):
    items = [{"@type": "ListItem", "position": 1, "name": "Heirloom", "item": SITE + "/"}]
    if mid:
        items.append({"@type": "ListItem", "position": 2, "name": mid[1], "item": SITE + mid[0]})
    items.append({"@type": "ListItem", "position": len(items) + 1, "name": name, "item": SITE + path})
    return {"@type": "BreadcrumbList", "@id": SITE + path + "#crumbs", "itemListElement": items}


def crumbs_html(name, mid=None):
    parts = ['<li><a href="/">Heirloom</a></li>']
    if mid:
        parts.append(f'<li><a href="{mid[0]}">{mid[1]}</a></li>')
    parts.append(f'<li aria-current="page">{name}</li>')
    return '<ol class="crumbs" aria-label="Breadcrumb">' + "".join(parts) + "</ol>"


APP_BOX = f"""<aside class="app-box" aria-labelledby="app-box-title">
  <h2 id="app-box-title">Start with one item</h2>
  <p>Heirloom is free on iPhone and on the web. Photograph an item, or write down what you already know about it, and add the rest room by room.</p>
  <div class="app-box__actions">
    <a class="store-badge" href="{APP_URL}"><img class="store-badge__art" src="/app-store-badge.svg" alt="Download Heirloom on the App Store" width="156" height="52"></a>
    <a class="btn btn--outline" href="https://web.heirloomapp.io">Open Heirloom on the web</a>
  </div>
  <p class="app-box__note">The iPhone app is in the US App Store for now. Heirloom on the web works everywhere, at <a href="https://web.heirloomapp.io">web.heirloomapp.io</a>.</p>
</aside>"""

FOOTER_GUIDES = '<nav class="footer__guides" aria-label="Guides">' + "".join(
    f'<a href="{p}" class="footer__link">{n}</a>' for p, n, _ in GUIDES
) + '<a href="/guides" class="footer__link">All guides</a></nav>'

FOOTER = f"""  <footer class="footer">
    <div class="container">
      <div class="footer__inner">
        <div class="footer__brand">
          <img src="/logo.svg" alt="Heirloom" height="24">
          <p class="footer__tagline">Know what you own.</p>
        </div>
        <nav class="footer__links" aria-label="Legal">
          <a href="/privacy" class="footer__link">Privacy Policy</a>
          <a href="/terms" class="footer__link">Terms of Service</a>
          <a href="/support" class="footer__link">Support</a>
        </nav>
        {FOOTER_GUIDES}
        <p class="footer__copy">&copy; <!--pc:year-->2026<!--/pc:year--> <a href="https://thepeninsularcompany.com"><!--pc:name-->The Peninsular Company, LLC<!--/pc:name--></a>. All rights reserved.<br><span class="footer__note">Value estimates are informational only and are not professional appraisals. Many items have no market value, and a record is complete without one. Specialists, sale conversations, sold prices and Heirloom&rsquo;s price estimates are offered in the United States only for now.</span></p>
      </div>
    </div>
  </footer>"""


def related(path):
    cards = "".join(
        f'<li><a class="card" href="{p}"><span class="card__title">{n}</span><span class="card__desc">{d}</span></a></li>'
        for p, n, d in GUIDES if p != path
    )
    return f'<section class="related" aria-labelledby="related-title"><p class="related__title" id="related-title">More from Heirloom</p><ul class="cards">{cards}</ul></section>'


def _main(path, h1, body, crumb_name, mid, show_related, top, main_attrs, side, toc):
    """The page's <main>: the guide column, or with `side` the reference layout
    (section sidebar | article | on-this-page)."""
    attrs = (" " + main_attrs) if main_attrs else ""
    if not side:
        return f"""  <main class="guide"{attrs}>
{(top + chr(10)) if top else ""}    <article>
      {crumbs_html(crumb_name or h1, mid)}
      <h1>{h1}</h1>
{body}
    </article>
    {related(path) if show_related else ''}
  </main>"""
    return f"""  <main class="ref"{attrs}>
{top}
    <div class="ref__grid">
      <aside class="ref__side" id="ref-side" aria-label="In this section">
{side}
      </aside>
      <article class="ref__main">
        {crumbs_html(crumb_name or h1, mid)}
        <h1>{h1}</h1>
{body}
      </article>
      <aside class="ref__toc" aria-label="On this page">{toc}</aside>
    </div>
  </main>"""


def page(path, title, description, h1, body, graph, og_type="article", show_related=True, crumb_name=None, mid=None, extra_head="", extra_body="", top="", main_attrs="", side="", toc=""):
    url = SITE + path
    title_attr = html.escape(title, quote=True)
    description = html.escape(description, quote=True)
    graph = [ORG, WEBSITE] + graph + [crumbs_ld(path, crumb_name or h1, mid)]
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-69Q6D26EG0"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-69Q6D26EG0');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title_attr}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#faf9f7">
  <meta name="apple-itunes-app" content="app-id=6754576251">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="Heirloom">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{title_attr}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{SITE}/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{SITE}/og-image.jpg">
  {ld(graph)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/guide.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&display=swap" rel="stylesheet">
  {extra_head}
</head>
<body>
  <header class="nav nav--solid" id="nav">
    <div class="nav__container">
      <a href="/" class="nav__logo"><img src="/logo.svg" alt="Heirloom" width="156" height="28"></a>
      <nav class="nav__links" aria-label="Main">
        <a href="/#how" class="nav__link">How it works</a>
        <a href="/home-inventory-app" class="nav__link">Home inventory</a>
        <a href="/antique-identifier-app" class="nav__link">Antiques</a>
        <div class="nav__group">
          <a href="/guides" class="nav__link">Guides<svg class="nav__chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg></a>
          <div class="nav__panel">
            <a class="nav__panel-item" href="/home-inventory-checklist"><span class="nav__panel-title">Home inventory checklist</span><span class="nav__panel-desc">Room by room, with a free spreadsheet template</span></a>
            <a class="nav__panel-item" href="/silver-hallmarks"><span class="nav__panel-title">Reading silver hallmarks</span><span class="nav__panel-desc">British, American and continental marks, and plate</span></a>
            <a class="nav__panel-item" href="/family-heirlooms"><span class="nav__panel-title">Documenting family heirlooms</span><span class="nav__panel-desc">The story, the paperwork, and who each one is for</span></a>
            <a class="nav__panel-item" href="/marks/"><span class="nav__panel-title">Marks and serial numbers</span><span class="nav__panel-desc">Date silver by its letter; look up Singer, watch and Leica serials</span></a>
            <a class="nav__panel-all" href="/guides">All guides &rarr;</a>
          </div>
        </div>
      </nav>
      <div class="nav__actions">
        <a href="https://web.heirloomapp.io" class="nav__signin">Sign in</a>
        <a href="https://apps.apple.com/us/app/id6754576251" class="btn btn--primary nav__cta">Get Heirloom</a>
      </div>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="navSheet" aria-label="Open menu"><span></span><span></span></button>
    </div>
    <div class="nav__sheet" id="navSheet" hidden>
      <nav aria-label="Menu">
        <ul class="nav__sheet-links">
          <li><a href="/#how">How it works</a></li>
          <li><a href="/home-inventory-app">Home inventory</a></li>
          <li><a href="/antique-identifier-app">Antiques</a></li>
          <li><a href="/guides">Guides</a></li>
        </ul>
        <p class="nav__sheet-heading">From the guides</p>
        <ul class="nav__sheet-guides">
          <li><a href="/home-inventory-checklist">Home inventory checklist</a></li>
          <li><a href="/silver-hallmarks">Reading silver hallmarks</a></li>
          <li><a href="/family-heirlooms">Documenting family heirlooms</a></li>
          <li><a href="/marks/">Marks and serial numbers</a></li>
        </ul>
      </nav>
      <div class="nav__sheet-foot">
        <a class="store-badge" href="https://apps.apple.com/us/app/id6754576251"><img class="store-badge__art" src="/app-store-badge.svg" alt="Download Heirloom on the App Store" width="156" height="52"></a>
        <a class="btn btn--outline" href="https://web.heirloomapp.io">Sign in on the web</a>
      </div>
    </div>
  </header>

{_main(path, h1, body, crumb_name, mid, show_related, top, main_attrs, side, toc)}

{FOOTER}
  <script src="/nav.js" defer></script>
  {extra_body}
</body>
</html>
"""


def article_ld(path, headline, description, about_app=True, extra=None):
    d = {
        "@type": "Article",
        "@id": SITE + path + "#article",
        "headline": headline,
        "description": description,
        "url": SITE + path,
        "mainEntityOfPage": SITE + path,
        "datePublished": TODAY,
        "dateModified": TODAY,
        "inLanguage": "en-US",
        "image": SITE + "/og-image.jpg",
        "author": {"@id": SITE + "/#org"},
        "publisher": {"@id": SITE + "/#org"},
        "isPartOf": {"@id": SITE + "/#website"},
    }
    if about_app:
        d["mentions"] = APP
    if extra:
        d.update(extra)
    return d


META = f'<p class="guide__meta">By Heirloom &middot; Updated <time datetime="{TODAY}">{TODAY_TEXT}</time></p>'
