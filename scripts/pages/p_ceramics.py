"""Ceramics maker's-mark pages: Weller, Roseville, McCoy, Hull, Meissen, Hummel,
Limoges and Haviland, Royal Doulton, Royal Copenhagen, Nippon and Noritake.

Unlike p_pottery.py these are not built from the app's mark tables: each page
is a history of one maker's marks, written from published sources. Every fact
carries the numbers of at least two sources (listed on the page), and where the
sources disagree the page says so. Every mark is shown from its entry in the
marks database (marksdb.py): one image of that mark alone, credited on its card,
or its description in words when there is none.

The words for each maker are in ceramics_data.py.
"""
import os
import re

from shell import *
import tables
from p_marks import MID, cta, e

from ceramics_data import MAKERS, CARD_IDS, OTHERS_INTRO
import marksdb

CSS = '<link rel="stylesheet" href="/marks/marks.css">'


def refs(nums, srcs):
    """Superscript links to the numbered sources: [1, 3] -> 1, 3."""
    if not nums:
        return ""
    keys = [k for k, _ in srcs]
    out = [f'<a href="#src-{i}">{i}</a>' for i in sorted(keys.index(n) + 1 for n in nums)]
    return f'<sup class="refs">{", ".join(out)}</sup>'


ONE_SOURCE = []


def fill(text, srcs, attributed=False):
    """Replace {src:a,b} in the copy with source links. A claim with one source
    is reported (every fact here needs two); `{src:a}` alone is allowed only for
    a sentence that names its source, such as "the RISD Museum gives 1949"."""
    for m in ([] if attributed else re.finditer(r"\{src:([^},]+)\}", text)):
        if not re.search(r"(gives|says|printed|describes|described|records|calls|dates|shows|reported|reprints|told|lists|counted|notes|decodes|gave|swore|date|record|reported)\b[^{]*\{src:" + re.escape(m.group(1)) + r"\}", text):
            ONE_SOURCE.append(text[max(0, m.start() - 90):m.end()])
    return re.sub(r"\{src:([^}]+)\}", lambda m: refs([k.strip() for k in m.group(1).split(",")], srcs), text)


def mark_section(m, srcs, ids):
    """One mark in the history: its heading, years and text, then the database cards for it."""
    cards = marksdb.grid(ids) if ids else ""
    return f"""<section class="mkd" id="{m['id']}">
        <h3>{m['name']}</h3>
        <p><strong>{m['dates']}</strong></p>
        <p>{fill(m['body'], srcs)}</p>
        {cards}
      </section>"""


def sources_html(srcs):
    items = "".join(
        f'<li id="src-{i}">{s["cite"]}' + (f' (<a href="{e(s["url"])}" rel="nofollow">link</a>)' if s.get("url") else "") + "</li>"
        for i, (_, s) in enumerate(srcs, 1)
    )
    return f'<!--copy-check:skip--><ol class="sources sources--num">{items}</ol><!--/copy-check:skip-->'


def build_page(d):
    srcs = list(d["sources"].items())
    path = "/marks/" + d["slug"]
    paras = "\n".join(f"      <p>{fill(p, srcs)}</p>" for p in d["history"])
    ids = CARD_IDS[d["slug"]]
    for k in ids:
        if not k.startswith("_") and k not in {m["id"] for m in d["marks"]}:
            raise SystemExit(f"{d['slug']}: CARD_IDS names section {k!r}, which the page doesn't have")
    cards = "\n      ".join(mark_section(m, srcs, ids.get(m["id"], [])) for m in d["marks"])
    others = ""
    if ids.get("_others"):
        head, intro = OTHERS_INTRO[d["slug"]]
        others = f'      <h3 id="others">{head}</h3>\n      <p>{fill(intro, srcs)}</p>\n      {marksdb.grid(ids["_others"])}'
    careful_cards = marksdb.grid(ids["_careful"]) if ids.get("_careful") else ""
    cautions = "".join(f"<li>{fill(c, srcs)}</li>" for c in d["cautions"])
    disagree = ""
    if d.get("disagree"):
        disagree = '      <h2 id="disagree">Where the sources disagree</h2>\n      <ul>' + "".join(f"<li>{fill(x, srcs, True)}</li>" for x in d["disagree"]) + "</ul>"
    faqs = [(q, f"<p>{fill(a, srcs)}</p>") for q, a in d["faqs"]]
    faqs_plain = [(q, "<p>" + re.sub(r"\{src:[^}]+\}", "", a) + "</p>") for q, a in d["faqs"]]
    body = f"""      <p class="guide__lede">{d['lede']}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{fill(d['answer'], srcs)}</p>
      </div>
      <h2 id="maker">{d['maker_heading']}</h2>
{paras}
      <h2 id="marks">{d['marks_heading']}</h2>
      {d.get('marks_intro', '') and '<p>' + fill(d['marks_intro'], srcs) + '</p>'}
      {cards}
{others}
      <h2 id="careful">{d['careful_heading']}</h2>
      <ul>{cautions}</ul>
      {careful_cards}
      <p class="note">Heirloom never decides whether an item is genuine. A mark says what it claims; a specialist who can handle the item is the one to ask.</p>
{disagree}
      <h2 id="sources">Sources</h2>
      <p class="note">The small numbers beside each fact point to these sources. Every fact on this page is in at least two of them. Each mark's image is credited on its card.</p>
      {sources_html(srcs)}
{cta(d['cta'])}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, d["h1"], d["desc"], extra={"about": {"@type": "Thing", "name": d["crumb"]}}), faq_ld(path, faqs_plain)]
    return path, page(path, d["title"], d["desc"], d["h1"], body, graph, mid=MID, crumb_name=d["crumb"], extra_head=CSS)


def build():
    out = [build_page(d) for d in MAKERS]
    placed = {i for v in CARD_IDS.values() for ids in v.values() for i in ids}
    for e_ in marksdb.group("ceramics-makers"):
        if e_["id"] not in placed:
            print("not on a page:", e_["id"])
    for t in ONE_SOURCE:
        print("one source:", t)
    return out


CHILDREN = [("/marks/" + d["slug"], d["crumb"], d["card"]) for d in MAKERS]
