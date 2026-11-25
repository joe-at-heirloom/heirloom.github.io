"""Wristwatch serial numbers: Rolex case serials and Omega movement serials.

Unlike the other marks pages, these tables are not (yet) in the app: they live
in this site, at marks/data/rolex.json and marks/data/omega.json, compiled to
the app's standard (two independent sources at least, cross-checked row by
row, both years kept where they disagree, nothing interpolated) with their
sources and caveats in the files. The lookups are rolex() and omega() in
marks/marks.js. Every mark image comes from the marks database (marksdb.py,
group swiss-watches): one image per mark, or its description in words.
"""
import json
import os

from shell import *
from p_marks import e, MID, cta, sources_list, soften, tables
import marksdb

DATA = os.path.join(tables.SITE_ROOT, "marks", "data")


def _load(name):
    with open(os.path.join(DATA, f"{name}.json")) as f:
        return json.load(f)


ROLEX = _load("rolex")
OMEGA = _load("omega")

CSS = '<link rel="stylesheet" href="/marks/marks.css">'


def tool_script(name):
    return f'<script src="/marks/marks.js" defer></script>\n  <script>window.MARKS_TOOL = "{name}";</script>'


def years(r):
    ys = [y for y in (r.get("year"), r.get("year_end"), r.get("alt_year")) if y]
    a, b = min(ys), max(ys)
    return str(a) if a == b else f"{a}–{b}"


def caveat_list(cs):
    return "<ul>" + "".join(f"<li>{e(soften(c))}</li>" for c in cs) + "</ul>"


def not_used(t):
    """The lists left out, by name: citations, so the copy check skips them (a dealer is called Expert's Watches)."""
    n = [s for s in t["sources"] if s.get("key") == "not_used"][0]["name"].replace("Not used: ", "")
    return f'<!--copy-check:skip--><p class="note">Not used: {e(soften(n))}</p><!--/copy-check:skip-->'


def sources_of(t):
    """Sources as a list, with the ones not used named apart."""
    return sources_list(t)


# ── Omega ─────────────────────────────────────────────────────────────────────

def omega_page():
    t = OMEGA
    path = "/marks/omega-serial-numbers"
    title = "Omega Serial Number Lookup: Date an Omega Movement | Heirloom"
    desc = "Date an Omega watch by its movement serial number, 1894 to 1995: both published lists, dated auction examples, where the serial is, and why later numbers can't be dated."
    h1 = "Omega serial number lookup"
    trs = []
    for r in t["rows"]:
        span = f'{r["serial_start"]:,}–{r["serial_end"]:,}'
        yr = years(r) if r.get("year") else "Not dated"
        ex = "; ".join(f'{x["serial"]:,} {x["date"]}' for x in r.get("dated_examples", [])[:2])
        trs.append(f'<tr><th scope="row">{span}</th><td>{e(yr)}</td><td>{e(soften(ex))}</td></tr>')
    caveats = caveat_list(t["caveats"][2:])
    faqs = [
        ("Where is the serial number on an Omega watch?",
         "<p>On most Omega watches made before the 1990s it is engraved on the movement, the works inside, so the case back has to come off. Omega says current watches carry it on the back or on a lug, and vintage watches inside the case back and on the movement. Opening a water-resistant case is a job for a watchmaker.</p>"),
        ("How accurate is an Omega serial number date?",
         "<p>To a year or two for ordinary movements from about 1895 to the mid-1980s. Movements were numbered in blocks and sometimes used out of order, chronographs had blocks of their own, and a watch could be sold years after its movement was made. Watches with known dates show the late 1940s and early 1950s ran one to three years later than the lists.</p>"),
        ("Why can't my Omega's serial be dated?",
         "<p>From about 1995 Omega gave blocks of numbers to particular movements, so a higher number is not always a later watch. For those, and for any watch where the exact date matters, Omega's Extract from the Archives gives the production date from its own records.</p>"),
        ("What is the difference between the serial and the reference number?",
         "<p>The serial is unique to one movement or watch. The reference, such as 2915-1, 165.024 or ST 145.022, names the model and is stamped inside the case back; thousands of watches share it. A number stamped inside the case back can also be the case maker's own number, which these lists don't date.</p>"),
        ("Does the serial show my Omega is genuine?",
         "<p>No. A serial dates a movement. Numbers can be copied, and movements, dials and cases were replaced in service. Heirloom never decides whether a watch is genuine.</p>"),
    ]
    body = f"""      <p class="guide__lede">Enter the serial number engraved on your Omega's movement to see the year the published lists give it, with watches from the same block whose dates are known from Omega's archive extracts or auction records.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>An Omega's serial number is engraved on the movement, usually seven or eight digits, and gives the year the movement was made to within a year or two: 13,500,000 is about 1952, 25,000,000 about 1967. Omega publishes no table; two lists circulate, and watches with known dates check them. Numbers above 56 million, from about 1995, can't be dated this way.</p>
      </div>
      <h2 id="lookup">Look up a movement serial</h2>
      <div class="finder">
        <div class="finder__row"><label class="grow">Movement serial <input id="om-serial" inputmode="numeric" autocomplete="off" placeholder="e.g. 13977738"></label></div>
        <div id="om-results" class="finder__results" aria-live="polite"><p class="finder__hint">Use the number engraved on the movement, not the reference stamped inside the case back.</p></div>
      </div>
      <h2 id="where">Where the serial is, and how to read it safely</h2>
{marksdb.grid(["omega-movement-serial", "omega-case-back-serial"])}
      <p>On an Omega made before the 1990s the serial is engraved on the movement, usually on a plate or bridge, and the case back has to come off to see it. Screw-down and snap-on backs need the right tool; a slip scratches the case or the movement, and a water-resistant watch needs its seal checked after. If you aren't used to it, ask a watchmaker to open it and photograph the movement for you.</p>
      <p>From about 1991 Omega also engraved the serial on the outside of the case back or on a lug, so a modern Omega can be read without opening it. Omega's warranty card carries the serial too.</p>
      <h2 id="movement">The other marks on the movement</h2>
{marksdb.grid(["omega-name-on-movement", "omega-caliber-number"])}
      <p>Beside the serial, the movement carries the maker's name and the caliber number, often by the Omega sign. The caliber number names the movement's design and is shared by every movement of that type, so it narrows the years a watch can be from but does not date it.</p>
      <h2 id="reference">Serial or reference?</h2>
{marksdb.grid(["omega-case-reference", "omega-case-number", "omega-case-maker-hf"])}
      <p>The serial belongs to one movement. The reference names the model: on vintage watches it is stamped inside the case back, in forms such as 2915-1, 165.024 or ST 145.022-69, and later Omega used longer product codes with dots, such as 311.30.42.30.01.005. Inside the case back there may also be the case maker's own number, a separate series, and the case maker's sign: HF for Huguenin Frères, which made nearly all early Speedmaster cases. Only the movement serial is dated here.</p>
      <h2 id="read">Read these before you rely on a year</h2>
      {caveats}
      <h2 id="tables">Serials by year</h2>
      <p class="note">Where the two lists disagree the year is shown as a range. The last column gives watches in that block with a known date, from Omega's archive extracts or auction records, for comparison.</p>
      <div class="table-wrap"><table><thead><tr><th scope="col">Movement serials</th><th scope="col">About</th><th scope="col">Dated examples</th></tr></thead><tbody>{"".join(trs)}</tbody></table></div>
      <h2 id="sources">Sources</h2>
      <p>Each year here is given by both lists below, or shown as a range where they differ, and was checked against the dated lots:</p>
      {sources_of(t)}
      {not_used(t)}
{cta("Photograph the movement or the case back. The Advisor reads the serial and keeps it on the watch's record with the photo it was read from, so the number is there when you or a watchmaker need it.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Omega watch serial numbers"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Omega serial numbers", extra_head=CSS, extra_body=tool_script("omega"))


# ── Rolex ─────────────────────────────────────────────────────────────────────

SRC_NAME = {"A": "Bob's list", "DH": "Dowling and Hess", "CP": "Pergola", "S": "Interpolated chart", "W": "Month-dated lists"}


def by_source(bs):
    def one(v):
        return f"{v[0]}–{v[1]}" if isinstance(v, list) else str(v)
    return "; ".join(f"{SRC_NAME.get(k, k)} {one(v)}" for k, v in bs.items())


def rolex_page():
    t = ROLEX
    path = "/marks/rolex-serial-numbers"
    title = "Rolex Serial Number Lookup: Year by Serial, 1928–2010 | Heirloom"
    desc = "Date a Rolex by its case serial number: both numberings before and after the 1950s restart, the letter serials of 1987 to 2010, the random serials since, where to find the serial, and the sources for each year."
    h1 = "Rolex serial number lookup"

    def table(series):
        trs = []
        for r in t["rows"]:
            if r["series"] != series:
                continue
            yr = years(r) if r.get("year") else "Not dated"
            ex = "; ".join(f'{x["serial"]:,} {x["date"]}' for x in r.get("dated_examples", [])[:2])
            trs.append(f'<tr><th scope="row">{r["serial_start"]:,}–{r["serial_end"]:,}</th><td>{e(yr)}</td><td>{e(by_source(r["by_source"])) if r.get("by_source") else e(soften(r.get("note", "")))}</td><td>{e(ex)}</td></tr>')
        return f'<div class="table-wrap"><table><thead><tr><th scope="col">Case serials</th><th scope="col">About</th><th scope="col">Each source</th><th scope="col">Dated watches</th></tr></thead><tbody>{"".join(trs)}</tbody></table></div>'

    letters = "".join(
        f'<tr><th scope="row">{e(p["prefix"])}</th><td>{e(years(p))}</td><td>{e(" · ".join(p["by_source"].values()))}</td><td>{e("; ".join(x["serial"] + " " + x["date"] for x in p.get("dated_examples", [])[:2]))}</td></tr>'
        for p in t["prefixes"]
    )
    caveats = caveat_list(t["caveats"][2:])
    faqs = [
        ("Where is the serial number on a Rolex?",
         "<p>Until about 2008, engraved on the case between the lugs at 6 o'clock, under the bracelet or strap. From about 2005 it is also engraved on the inner ring between the dial and the crystal (the rehaut), at 6 o'clock, and from about 2008 only there. The warranty card carries it too.</p>"),
        ("Can I find the year of my Rolex from its serial number?",
         "<p>For serials up to about 2010, to within a year or two: enter it above. Numbers below 1,000,000 were used twice, before and after a restart in the 1950s, so the lookup shows both and the model decides. Since about 2010 Rolex has used random serials that carry no date; the warranty card shows when the watch was sold.</p>"),
        ("What is the difference between a Rolex serial number and the model number?",
         "<p>The serial is unique to one watch and sits at 6 o'clock. The model number, or reference, names the model, its bezel and its metal (a Datejust 16234, a Submariner 5513) and sits between the lugs at 12 o'clock; on older watches it is often stamped inside the case back too. Thousands of watches share a reference.</p>"),
        ("Why does my Rolex serial give two different years?",
         "<p>Either because the number was used in both numberings, before and after the 1950s restart, or because the sources put that block in different years. The lookup shows each source's answer rather than choosing one.</p>"),
        ("Does a Rolex serial number prove the watch is genuine?",
         "<p>No. A serial dates a case; numbers are copied, and cases, dials and movements were replaced in service. Heirloom never decides whether a watch is genuine. If that matters, Rolex or an independent watchmaker can examine it.</p>"),
        ("Can a serial number tell me my Rolex's value?",
         "<p>No. The year is one fact about the watch; the model, its condition, its parts and what comparable watches have actually sold for matter far more. A record is complete without a price.</p>"),
    ]
    body = f"""      <p class="guide__lede">Enter the serial from your Rolex's case to see the year the published lists give it, each source's answer where they differ, and watches from the same block whose dates are known.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A Rolex serial is engraved between the lugs at 6 o'clock, and on later watches on the inner ring at 6 o'clock. Numeric serials run from about 1926 to 1987 in two numberings (the count restarted in 1953–54), then a letter and six digits until about 2010: R is about 1987–88, P about 2000. Since about 2010 serials are random and carry no date.</p>
      </div>
      <h2 id="lookup">Look up a serial number</h2>
      <div class="finder">
        <div class="finder__row"><label class="grow">Case serial <input id="rx-serial" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. 5398992 or U171660"></label></div>
        <div id="rx-results" class="finder__results" aria-live="polite"><p class="finder__hint">Use the number at 6 o'clock, not the model number at 12. Spaces and commas don't matter.</p></div>
      </div>
      <h2 id="where">Where the serial is, and how to read it safely</h2>
{marksdb.grid(["rolex-case-serial-between-lugs", "rolex-rehaut-serial", "rolex-early-case-serial-inside-back"])}
      <p>On a Rolex made before about 2008 the serial is engraved on the case between the lugs at 6 o'clock, where the bracelet or strap hides it. Taking the bracelet off means pushing out its spring bars, and a slipped tool scratches the lugs, so a jeweler or watchmaker is the safer way; they can read the number and fit the bracelet back in a few minutes.</p>
      <p>On some 1920s Rolex cases the serial is stamped inside the case back instead, among the maker's and patent stamps. The published lists disagree this early, so a British hallmark in the same back is the better guide to the date.</p>
      <p>From about 2005 Rolex also engraved the serial on the rehaut, the ring between the dial and the crystal, at 6 o'clock, and from about 2008 only there. It can be read without opening the watch: tilt it under a bright light and use a magnifier. The warranty card, or the papers that came with the watch, carry the same serial.</p>
      <h2 id="reference">Serial or model number?</h2>
{marksdb.grid(["rolex-reference-between-lugs"])}
      <p>The serial belongs to one watch. The model number, or reference, names the model, the bezel and the metal; it is engraved between the lugs at 12 o'clock, and on older watches often stamped inside the case back as well. A Datejust 16234 and a Submariner 5513 are references, shared by thousands of watches. Only the serial is dated here.</p>
      <h2 id="name">The name, the crown and the engraved ring</h2>
{marksdb.grid(["rolex-name-on-dial", "rolex-coronet", "rolex-rehaut-engraving"])}
      <p>The name and the crown on the dial say who made the watch, and the ROLEX engraving round the inner ring marks a case of about 2004 or later. None of them dates a watch more closely or shows that it is genuine.</p>
      <h2 id="random">Random serials, from about 2010</h2>
      <p>From about late 2009 or 2010 Rolex replaced the letter series with random serials of eight letters and digits. They aren't issued in order, so no year can be read from one. The warranty card is dated when the watch is sold; for a watch without papers, the date can't be told from the serial.</p>
      <h2 id="read">Read these before you rely on a year</h2>
      {caveats}
      <h2 id="tables">Serials by year</h2>
      <p class="note">Each row gives the span the sources give together, then each source's own answer, and watches from that block dated by a case-back stamp, a hallmark or papers. A papers date is when the watch was sold, so it can be later than the watch.</p>
      <h3>The first numbering, about 1928 to 1954</h3>
      {table("first")}
      <h3>The second numbering, from 1954 to 1987</h3>
      {table("second")}
      <h3>Letter serials, about 1987 to 2010</h3>
      <div class="table-wrap"><table><thead><tr><th scope="col">Letter</th><th scope="col">About</th><th scope="col">The three list families</th><th scope="col">Dated papers</th></tr></thead><tbody>{letters}</tbody></table></div>
      <h2 id="sources">Sources</h2>
      <p>Each year here is given by at least two of these, shown as a range where they differ, and was checked against the dated watches:</p>
      {sources_of(t)}
      {not_used(t)}
{cta("Photograph the serial at 6 o'clock or the warranty card. The Advisor reads the number and keeps it on the watch's record with the photo it was read from, so it's there when you or a watchmaker need it.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Rolex watch serial numbers"}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Rolex serial numbers", extra_head=CSS, extra_body=tool_script("rolex"))


def build():
    return [rolex_page(), omega_page()]


CHILDREN = [
    ("/marks/rolex-serial-numbers", "Rolex serial numbers", "The year for a Rolex case serial, numeric and letter serials, 1928–2010."),
    ("/marks/omega-serial-numbers", "Omega serial numbers", "The year for an Omega movement serial, 1894–1995, with dated examples."),
]
