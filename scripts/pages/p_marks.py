"""The marks reference: pages built from the app's own mark tables.

Reads backend/src/data/mark-tables/*.json from the app repo (tables.py says
how), the tables Heirloom Advisor dates marks with, so the site and the app
say the same thing. Writes static pages under /marks/.
"""
import html as H
import json
import os
from collections import OrderedDict, defaultdict

from shell import *

import tables

HALL = tables.load("hallmarks")
SINGER = tables.load("singer")
WATCH = tables.load("watches")
LEICA = tables.load("leica")

e = lambda s: H.escape(str(s), quote=True)
MID = ("/marks/", "Marks")

STYLE_WORD = {
    "gothic": "Old English (black letter)",
    "court_hand": "Court hand",
    "roman": "Roman",
    "italic": "Italic",
    "script": "Script",
    "block": "Plain capitals",
}
CASE_WORD = {"upper": "capital", "lower": "small", "either": "capital or small"}

FONT_HEAD = (
    '<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Pinyon+Script&display=swap" rel="stylesheet">\n'
    '  <link rel="stylesheet" href="/marks/marks.css">'
)


def tool_script(name):
    return f'<script src="/marks/marks.js" defer></script>\n  <script>window.MARKS_TOOL = "{name}";</script>'


def sources_list(t):
    items = "".join(
        f'<li>{e(s.get("name", ""))}' + (f' (<a href="{e(s["url"])}" rel="nofollow">source</a>)' if s.get("url") else "") + "</li>"
        for s in t.get("sources", []) if s.get("key") != "not_used"
    )
    # Citations, not claims: the copy check skips them (a source may be named "Appraisals").
    return f"<!--copy-check:skip--><ul class=\"sources\">{items}</ul><!--/copy-check:skip-->"


def cta(text):
    return f"""<aside class="app-box" aria-labelledby="app-box-title">
  <h2 id="app-box-title">Let Heirloom read the marks for you</h2>
  <p>{text}</p>
  <div class="app-box__actions">
    <a class="store-badge" href="{APP_URL}"><img class="store-badge__art" src="/app-store-badge.svg" alt="Download Heirloom on the App Store" width="156" height="52"></a>
    <a class="btn btn--outline" href="https://web.heirloomapp.io">Open Heirloom on the web</a>
  </div>
  <p class="app-box__note">The iPhone app is in the US App Store for now. Heirloom on the web works everywhere, at <a href="https://web.heirloomapp.io">web.heirloomapp.io</a>.</p>
</aside>
<aside class="pro-note" aria-label="For auction professionals">
  <p><strong>Art professional?</strong> If you catalog for a regional auction house, <a href="https://theca.auction">Theca</a> is built for your house: cataloging, photography, consignments and sales in one system.</p>
</aside>"""


def stamp_row(files, caption, credit, alts):
    imgs = "".join(
        f'<figure class="stamp"><img src="/marks/img/{f}.webp" alt="{e(a)}" height="120" loading="lazy" decoding="async"><figcaption>{e(a.split(":")[0])}</figcaption></figure>'
        for f, a in zip(files, alts)
    )
    return f'<div class="stamps"><div class="stamps__row">{imgs}</div><p class="stamps__caption">{caption} <span class="stamps__credit">{credit}</span></p></div>'


MET_CREDIT = 'Photograph: The Metropolitan Museum of Art, Open Access (public domain), cut out and toned by Heirloom.'

# ── Date letters ──────────────────────────────────────────────────────────────

OFFICES = OrderedDict([
    ("London", dict(slug="london", town="a leopard's head", span="1678 to 2000")),
    ("Birmingham", dict(slug="birmingham", town="an anchor", span="1773 to 2000")),
    ("Sheffield", dict(slug="sheffield", town="a crown (a rose from 1975)", span="1773 to 2000")),
    ("Chester", dict(slug="chester", town="three wheatsheaves and a sword", span="1701 to 1962")),
])


def office_rows(office):
    return [r for r in HALL["rows"] if r["office"] == office]


def letter_html(r):
    return f'<span class="dl dl--{e(r["style"])}">{e(r["letter"])}</span>'


def cycles(rows):
    by = OrderedDict()
    for r in sorted(rows, key=lambda r: (r["cycle_start"], r["year"])):
        by.setdefault(r["cycle_start"], []).append(r)
    return by


def cycle_label(rs):
    styles = sorted({STYLE_WORD[r["style"]] for r in rs})
    cases = sorted({CASE_WORD[r["case"]] for r in rs})
    first, last = rs[0]["year"], rs[-1]["year"]
    return f"{first}–{last}", f"{' / '.join(styles)}, {' / '.join(cases)} letters"


def row_note(r):
    bits = []
    if r.get("alt_year"):
        bits.append(f"another source gives {r['alt_year']}")
    if r.get("confidence"):
        bits.append("sources disagree" if r["confidence"] == "disputed" else f"{r['confidence']} confidence")
    if r.get("note"):
        bits.append(soften(r["note"]))
    return "; ".join(bits)


def soften(text):
    """The site's word rules: an owner's thing is an item."""
    for a, b in [("with confidence", "as certain"), ("being transferred to", "being moved to"), ("transferred", "moved"), ("Labelled", "Labeled"), ("labelled", "labeled"), ("centre", "center"), ("grey", "gray"), ("Pieces", "Items")]:
        text = text.replace(a, b)
    return text.replace("first piece", "first item").replace("a genuine piece", "a genuine item").replace(" pieces", " items").replace(" piece", " item")


def office_rules(office):
    out = []
    for r in HALL["rules"]:
        ap = r.get("applies_to", [])
        if office in ap or "all" in ap:
            out.append(r)
    return out


def office_caveats(office):
    general = HALL["caveats"][:3]
    specific = [c for c in HALL["caveats"][3:] if office in c]
    return general + specific


def date_letter_page(office, info):
    rows = office_rows(office)
    path = f"/marks/{info['slug']}-date-letters"
    title = f"{office} Hallmark Date Letters, {info['span'].replace(' to ', '–')} | Heirloom"
    desc = f"Every {office} assay office date letter from {info['span']}, with a letter finder, the {office} town mark, duty and standard marks, and the sources for each year."
    h1 = f"{office} hallmark date letters, {info['span']}"
    cyc = cycles(rows)
    styles_present = sorted({r["style"] for r in rows}, key=list(STYLE_WORD).index)

    tables = []
    for start, rs in cyc.items():
        span, kind = cycle_label(rs)
        cells = "".join(
            f'<li class="dlc{" dlc--flag" if (r.get("alt_year") or r.get("confidence")) else ""}"'
            f' title="{e(row_note(r))}">{letter_html(r)}<span class="dlc__year">{e(r.get("year_label") or r["year"])}</span>'
            + (f'<span class="dlc__note">{e(row_note(r))}</span>' if row_note(r) else "")
            + "</li>"
            for r in rs
        )
        tables.append(f'<section class="cycle" id="cycle-{start}"><h3>{span}</h3><p class="cycle__kind">{e(kind)}</p><ul class="dlg">{cells}</ul></section>')

    rules = office_rules(office)
    rule_items = "".join(
        f'<li><strong>{e(r.get("from_year") or "")}{"–" + str(r["to_year"]) if r.get("to_year") else (" on" if r.get("from_year") else "")}:</strong> {e(soften(r["fact"]))}'
        + (f' <em>{e(soften(r["narrows"]))}</em>' if r.get("narrows") else "")
        + "</li>"
        for r in rules
    )
    caveats = "".join(f"<li>{e(soften(c))}</li>" for c in office_caveats(office))

    photos = ""
    if office == "London":
        photos = (
            stamp_row(
                ["m14-london-toilet-box-1", "m14-london-toilet-box-2", "m14-london-toilet-box-3", "m14-london-toilet-box-4"],
                "Marks on a silver toilet box made in London.",
                MET_CREDIT,
                ["Date letter", "Leopard's head, crowned: the London town mark before 1821", "Lion passant guardant: sterling", "Maker's mark"],
            )
            + stamp_row(
                ["m00-london-candlestick-IF-1", "m00-london-candlestick-IF-2", "m00-london-candlestick-IF-3", "m00-london-candlestick-IF-4"],
                "Marks on a London silver candlestick, in the order they were struck.",
                MET_CREDIT,
                ["Maker's mark: IF", "Lion passant guardant: sterling", "Leopard's head, crowned: London", "Date letter"],
            )
        )
    if office == "Sheffield":
        photos = stamp_row(
            ["02-sheffield-crown-1", "02-sheffield-crown-2"],
            "Sheffield marks: the crown, the lion passant and a date letter, then the maker's mark.",
            'Photograph: <a href="https://commons.wikimedia.org/wiki/File:British_hallmarks.jpg" rel="nofollow">British hallmarks</a> by Mrs rockefeller, <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="nofollow">CC BY-SA 3.0</a>, cut out and toned by Heirloom.',
            ["Crown, lion passant and date letter n", "Maker's mark: W&H"],
        )
    britannia = ""
    if office == "London":
        britannia = "<h3>The Britannia standard, 1697 to 1720</h3>" + stamp_row(
            ["m02-london-britannia-chocolate-pot-1", "m02-london-britannia-chocolate-pot-2", "m02-london-britannia-chocolate-pot-3", "m02-london-britannia-chocolate-pot-4"],
            "Britannia-standard marks on a London silver chocolate pot: in this period the figure of Britannia and a lion's head erased replace the lion passant and the leopard's head.",
            MET_CREDIT,
            ["Maker's mark", "Britannia", "Lion's head erased", "Date letter"],
        )

    finder = f"""<div class="finder" data-office="{e(office)}">
  <div class="finder__row">
    <label>Letter <input id="dl-letter" maxlength="2" autocomplete="off" inputmode="text" placeholder="e.g. u"></label>
    <label>Case <select id="dl-case"><option value="">Either</option><option value="upper">Capital</option><option value="lower">Small</option></select></label>
    <label>Style <select id="dl-style"><option value="">Any</option>{"".join(f'<option value="{s}">{STYLE_WORD[s]}</option>' for s in styles_present)}</select></label>
  </div>
  <div id="dl-results" class="finder__results" aria-live="polite"><p class="finder__hint">Type the letter you see. Every {office} year that used it appears here, with its style, so you can match the shape.</p></div>
</div>
<script>window.DL_ROWS = {json.dumps([{**{k: r.get(k) for k in ("letter", "case", "style", "year", "year_label", "alt_year", "confidence")}, "note": soften(r["note"]) if r.get("note") else None} for r in rows], separators=(",", ":"), ensure_ascii=False)};</script>"""

    faqs = [
        (f"How do I find the year from a {office} hallmark?",
         f"<p>Check the town mark first: {office} used {info['town']}. Then find the date letter, note whether it is a capital or a small letter and its style, and match all three to one cycle above. A letter usually covers an assay year that straddles two calendar years, so most entries read like 1753-54.</p>"),
        ("Why does the same letter appear in more than one cycle?",
         "<p>Each office ran through the alphabet again and again, changing the letter style and usually the shield shape each time. The same small Roman letter can mean four different years, so the style, the case and the other marks have to agree before a year is certain.</p>"),
        ("What if my letter doesn't match any style exactly?",
         "<p>Then the year is uncertain, and the honest answer is a range. Worn punches make letters look alike: a long s can read as f, I or l. Heirloom Advisor reports every year a letter could be rather than picking the nearest one.</p>"),
    ]

    body = f"""      <p class="guide__lede">Every date letter the {office} assay office used from {info['span']}, from the same table Heirloom Advisor dates silver with. Type a letter to see every year it could be.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A {office} hallmark has {info['town']} as its town mark. To date it, match the date letter's case and style to one of the cycles below; a single letter appears in several cycles, so all three have to agree. Until 1974 each letter covers an assay year, not a calendar year.</p>
      </div>
      <h2 id="finder">Find a letter</h2>
{finder}
      {photos}
      <h2 id="marks">{office}'s marks, and what they narrow</h2>
      <ul class="rules">{rule_items}</ul>
      {britannia}
      <h2 id="tables">Every cycle</h2>
      <p class="note">Letters are set in a matching typeface to help you scan the tables; a real punch differs, and shield shapes are not shown. A flagged year is one where the sources disagree.</p>
      {''.join(tables)}
      <h2 id="caveats">Read these before you rely on a year</h2>
      <ul>{caveats}</ul>
      <h2 id="sources">Sources</h2>
      <p>Each year here is supported by at least two of these, cross-checked letter by letter:</p>
      {sources_list(HALL)}
{cta("Photograph the marks on your silver. The Advisor reads the letter and the town mark and dates them from this same table, and when a letter could be more than one year, it says so.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, about_app=True, extra={"about": {"@type": "Thing", "name": f"{office} hallmark date letters"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name=f"{office} date letters", extra_head=FONT_HEAD, extra_body=tool_script("dateletters"))


# ── Singer ────────────────────────────────────────────────────────────────────

def singer_page():
    path = "/marks/singer-serial-numbers"
    title = "Singer Serial Number Lookup: How Old Is My Singer? | Heirloom"
    desc = "Look up a Singer sewing machine serial number: the year its number block was allotted, the model and the factory, from Singer's own registers, 1850 to 1971."
    h1 = "Singer serial number lookup"
    rows = SINGER["rows"]
    by = defaultdict(list)
    for r in rows:
        by[r.get("prefix", "")].append(r)
    prefix_rows = []
    for p in sorted(by, key=lambda x: (len(x), x)):
        rs = by[p]
        ys = [r["year"] for r in rs if r.get("year")]
        facs = sorted({r.get("factory") or "" for r in rs} - {""})
        prefix_rows.append(f'<tr><th scope="row">{e(p or "None (numbers only)")}</th><td>{min(ys)}–{max(ys)}</td><td>{e("; ".join(facs))}</td></tr>')
    caveats = "".join(f"<li>{e(soften(c))}</li>" for c in SINGER["caveats"][:9])
    faqs = [
        ("How old is my Singer sewing machine?",
         "<p>Find the serial number, usually stamped on the bed or the slide plate, and enter it above, letters and all. The result is the date Singer allotted that block of numbers, which is close to, but not always the same as, the year the machine was built.</p>"),
        ("Can I find a Singer's value by its serial number?",
         "<p>No. The serial dates the machine and names its model, which is where any value starts, but condition, the model and what similar machines have actually sold for decide the rest. Many sewing machines have little market value; a record of yours is complete without one.</p>"),
        ("Why does my serial number match more than one block?",
         "<p>Singer sometimes allotted overlapping numbers to different machine classes or plants. When that happens the lookup shows every block, and the model of your machine decides which is right.</p>"),
        ("My serial number isn't found. Is something wrong with my machine?",
         "<p>Not necessarily. Some prefixes were used by Singer plants whose registers are not in this table (C, and some A, E, T and S serials from Germany and Russia), and a few blocks are missing from the published registers.</p>"),
    ]
    body = f"""      <p class="guide__lede">Enter your Singer's serial number to see when Singer allotted it, the model it was allotted to and the factory, from Singer's own registers cross-checked against the ISMACS database.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A Singer serial number is a letter prefix and a number, such as G 7572, stamped on the machine, usually on the bed or the slide plate. Singer allotted numbers in blocks, so a serial gives the date its block was allotted, the machine class and the plant: G 7572 was allotted in 1910. Numbers without a letter are mostly from 1850 to 1899.</p>
      </div>
      <h2 id="lookup">Look up a serial number</h2>
      <div class="finder">
        <div class="finder__row"><label class="grow">Serial number <input id="sn" autocomplete="off" placeholder="e.g. G 7572 or AB123456"></label></div>
        <div id="sn-results" class="finder__results" aria-live="polite"><p class="finder__hint">Enter the letters and the number exactly as stamped. Spaces and dashes don't matter.</p></div>
      </div>
      <h2 id="prefixes">Prefixes and factories</h2>
      <div class="table-wrap"><table><thead><tr><th scope="col">Prefix</th><th scope="col">Years</th><th scope="col">Factory</th></tr></thead><tbody>{"".join(prefix_rows)}</tbody></table></div>
      <h2 id="caveats">Read these before you rely on a date</h2>
      <ul>{caveats}</ul>
      <h2 id="sources">Sources</h2>
      {sources_list(SINGER)}
{cta("Photograph your machine's serial plate. The Advisor reads the number, looks it up in this same table and keeps the date on the machine's record, with the photo it was read from.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Singer sewing machine serial numbers"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Singer serial numbers", extra_head='<link rel="stylesheet" href="/marks/marks.css">', extra_body=tool_script("singer"))


# ── Pocket watches ────────────────────────────────────────────────────────────

WATCH_MAKERS = ["Waltham", "Elgin", "Hamilton", "Illinois", "South Bend", "Hampden"]


def watch_page():
    path = "/marks/pocket-watch-serial-numbers"
    title = "Pocket Watch Serial Number Lookup: Elgin, Waltham, Hamilton | Heirloom"
    desc = "Date an American pocket watch by its movement serial number: Waltham, Elgin, Hamilton, Illinois, South Bend and Hampden, with the year tables and where the lists disagree."
    h1 = "Pocket watch serial number lookup"
    rows = WATCH["rows"]
    sections = []
    for m in WATCH_MAKERS:
        rs = sorted([r for r in rows if r["maker"] == m and r.get("boundary") == "primary"], key=lambda r: r["serial_start"])
        trs = "".join(
            f'<tr><th scope="row">{r["year"]}</th><td>{r["serial_start"]:,}</td><td>{e(str(r["alt_year"]) if r.get("alt_year") else "")}</td></tr>' for r in rs
        )
        cav = [c for c in WATCH["caveats"] if c.startswith(m) or c.startswith(f"{m} ")]
        cav_html = "".join(f"<p class=\"note\">{e(soften(c))}</p>" for c in cav)
        slug = m.lower().replace(" ", "-")
        sections.append(f'<section id="{slug}"><h3>{m}</h3>{cav_html}<div class="table-wrap"><table><thead><tr><th scope="col">Year</th><th scope="col">Serials from</th><th scope="col">Another list says</th></tr></thead><tbody>{trs}</tbody></table></div></section>')
    general = "".join(f"<li>{e(soften(c))}</li>" for c in WATCH["caveats"][:7])
    faqs = [
        ("Where is the serial number on a pocket watch?",
         "<p>On the movement, the works inside, usually engraved on one of the plates or bridges. Open the back of the case carefully. A number stamped inside the case itself is the case maker's number and can't be dated with these tables.</p>"),
        ("How accurate is a pocket watch serial number date?",
         "<p>Close, not exact. Serials were allotted to production runs in blocks, and a movement could be finished a year or more after its nominal year. Where the published lists disagree, the lookup gives both years.</p>"),
        ("Does a serial number tell me a pocket watch's value?",
         "<p>No. It dates the movement; the grade, the jewel count, the case and its condition matter more, and many pocket watches have modest market value. A record is complete without a price.</p>"),
    ]
    body = f"""      <p class="guide__lede">Choose the maker named on the movement, enter its serial number, and see the year that serial was made, from the same lists Heirloom Advisor dates watches with.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>An American pocket watch is dated by the serial number engraved on its movement, not the case. Each maker numbered movements in sequence, so the serial falls between two year markers in that maker's list. Treat the year as approximate: movements were made in blocks and finished as needed.</p>
      </div>
      <h2 id="lookup">Look up a movement serial</h2>
      <div class="finder">
        <div class="finder__row">
          <label>Maker <select id="w-maker">{"".join(f'<option>{m}</option>' for m in WATCH_MAKERS)}</select></label>
          <label class="grow">Movement serial <input id="w-serial" inputmode="numeric" autocomplete="off" placeholder="e.g. 13477185"></label>
        </div>
        <div id="w-results" class="finder__results" aria-live="polite"><p class="finder__hint">Use the number on the movement, not inside the case.</p></div>
      </div>
      <h2 id="read">Read these before you rely on a year</h2>
      <ul>{general}</ul>
      <h2 id="tables">Year tables by maker</h2>
      {''.join(sections)}
      <h2 id="sources">Sources</h2>
      {sources_list(WATCH)}
{cta("Photograph the movement. The Advisor reads the maker and the serial, dates it from these lists, and keeps the date on the watch's record with the photo it came from.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Pocket watch serial numbers"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Pocket watch serial numbers", extra_head='<link rel="stylesheet" href="/marks/marks.css">', extra_body=tool_script("watch"))


# ── Leica ─────────────────────────────────────────────────────────────────────

def leica_page():
    path = "/marks/leica-serial-numbers"
    title = "Leica Serial Number Lookup: Model and Year | Heirloom"
    desc = "Look up a Leica camera body serial number: the model and the year it was made, screw-mount 1923–1960 and M-mount 1954–1999, from two transcriptions of Leitz's production records."
    h1 = "Leica serial number lookup"
    rows = LEICA["rows"]
    by = OrderedDict()
    for r in sorted(rows, key=lambda r: r["from"]):
        by.setdefault(r["model"], []).append(r)
    trs = []
    for m, rs in by.items():
        ys = [y for r in rs for y in (r["year"], r.get("year_end") or r["year"])]
        trs.append(f'<tr><th scope="row">{e(m)}</th><td>{min(ys)}–{max(ys)}</td><td>{min(r["from"] for r in rs):,}–{max(r["to"] for r in rs):,}</td><td>{len(rs)}</td></tr>')
    caveats = "".join(f"<li>{e(soften(c))}</li>" for c in LEICA["caveats"][:7])
    faqs = [
        ("Where is the serial number on a Leica?",
         "<p>On the top plate of the camera body, usually after \"No\". A number on the lens is a separate Leitz series in the same range, and looking it up here gives a wrong answer.</p>"),
        ("My Leica's serial number starts with a 0. What does that mean?",
         "<p>Leitz never began a body number with a zero. Soviet FED and Zorki cameras re-engraved as Leicas often did, so such a camera should not be dated from the Leitz list.</p>"),
        ("Why does my serial number say a different model from my camera?",
         "<p>Leitz converted many older bodies to later models and kept the original number, so a body numbered as a Leica I or II may now be a III or IIIf. The serial tells you what the body was made as.</p>"),
    ]
    body = f"""      <p class="guide__lede">Enter the number from your Leica's top plate to see the model it was made as and the year, from two independent transcriptions of Leitz's production records.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A Leica body serial is on the top plate, usually after "No". Leitz numbered bodies in blocks by model, so the serial gives the model the body was made as and the year: 140890 is a Leica III of 1934. A serial that begins with 0 is not a Leitz number.</p>
      </div>
      <h2 id="lookup">Look up a body serial</h2>
      <div class="finder">
        <div class="finder__row"><label class="grow">Body serial <input id="l-serial" inputmode="numeric" autocomplete="off" placeholder="e.g. 140890"></label></div>
        <div id="l-results" class="finder__results" aria-live="polite"><p class="finder__hint">Use the number on the body's top plate, not the lens.</p></div>
      </div>
      <h2 id="read">Read these before you rely on a result</h2>
      <ul>{caveats}</ul>
      <h2 id="models">Models by serial range</h2>
      <div class="table-wrap"><table><thead><tr><th scope="col">Model</th><th scope="col">Years</th><th scope="col">Serials (lowest–highest block)</th><th scope="col">Blocks</th></tr></thead><tbody>{"".join(trs)}</tbody></table></div>
      <h2 id="sources">Sources</h2>
      {sources_list(LEICA)}
{cta("Photograph the top plate. The Advisor reads the serial, looks it up in this same table and keeps the model and year on the camera's record.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Leica camera serial numbers"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Leica serial numbers", extra_head='<link rel="stylesheet" href="/marks/marks.css">', extra_body=tool_script("leica"))


# ── Hub ───────────────────────────────────────────────────────────────────────

def hub_page(children):
    path = "/marks/"
    title = "Marks and Serial Numbers: Date Silver, Singers, Watches | Heirloom"
    desc = "Date British silver by its hallmark letter, decode Wedgwood, Minton, Royal Worcester, Rookwood and Sèvres date codes, and look up Singer, pocket-watch and Leica serials."
    h1 = "Marks and serial numbers"
    cards = "".join(
        f'<li><a class="card" href="{p}"><span class="card__title">{e(n)}</span><span class="card__desc">{e(d)}</span></a></li>'
        for p, n, d in children
    )
    body = f"""      <p class="guide__lede">Many things carry a small mark that dates them: a silver hallmark's letter, a sewing machine's serial, a watch movement's number. These pages turn the mark into a year, from the same published tables Heirloom Advisor uses.</p>
      {stamp_row(["m12-exeter-tankard-1", "m12-exeter-tankard-2", "m12-exeter-tankard-3", "m12-exeter-tankard-4", "m12-exeter-tankard-5"],
                 "A full set of marks on a silver tankard made in Exeter: maker, leopard's head, lion passant, the Exeter town mark and a date letter.",
                 MET_CREDIT,
                 ["Maker's mark: IF", "Leopard's head, crowned", "Lion passant", "Exeter town mark", "Date letter"])}
      <ul class="cards">{cards}</ul>
      <h2 id="how">How these tables were made</h2>
      <p>Every table was compiled from at least two published sources and checked row by row. Where the sources disagree, the page shows both years rather than choosing one. Nothing is filled in between rows. Each page lists its sources and the cautions that come with them.</p>
      <p>A mark dates an item; it does not prove what the item is. Marks can be worn, copied or added later, and Heirloom never decides whether an item is genuine.</p>
      <p>More to read: <a href="/silver-hallmarks">how to read silver hallmarks</a>, and <a href="/antique-identifier-app">what Heirloom Advisor reads in a photo</a>.</p>
{cta("Photograph a mark or a serial plate. The Advisor reads it, dates it from these tables, and keeps the date on the item's record with the photo it came from.")}
"""
    graph = [{"@type": "CollectionPage", "@id": SITE + path, "url": SITE + path, "name": title, "description": desc, "isPartOf": {"@id": SITE + "/#website"},
              "hasPart": [{"@type": "WebPage", "url": SITE + p, "name": n} for p, n, _ in children]}]
    return path, page(path, title, desc, h1, body, graph, og_type="website", crumb_name="Marks", extra_head='<link rel="stylesheet" href="/marks/marks.css">')


def build(extra_children=()):
    pages = []
    children = []
    for office, info in OFFICES.items():
        p, h = date_letter_page(office, info)
        pages.append((p, h))
        children.append((p, f"{office} date letters", f"Every {office} hallmark date letter, {info['span']}, with a letter finder."))
    for fn, name, d in [
        (singer_page, "Singer serial numbers", "The year, model and factory for a Singer sewing machine serial, 1850–1971."),
        (watch_page, "Pocket watch serial numbers", "Waltham, Elgin, Hamilton, Illinois, South Bend and Hampden movement serials, by year."),
        (leica_page, "Leica serial numbers", "The model and year for a Leica body serial, screw-mount and M."),
    ]:
        p, h = fn()
        pages.append((p, h))
        children.append((p, name, d))
    children.extend(extra_children)
    pages.insert(0, hub_page(children))
    return pages
