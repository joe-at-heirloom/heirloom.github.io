"""Ceramics maker's-mark pages: Weller, Roseville, McCoy, Hull, Meissen, Hummel,
Limoges and Haviland, Royal Doulton, Royal Copenhagen, Nippon and Noritake.

Unlike p_pottery.py these are not built from the app's mark tables: each page
is a history of one maker's marks, written from published sources. Every fact
carries the numbers of at least two sources (listed on the page), and where the
sources disagree the page says so. Every mark shown is a photograph under an
open licence or a public-domain book facsimile, credited under it; a mark with
no open image is described in words.

The words for each maker are in ceramics_data.py.
"""
import os
import re

from shell import *
import tables
from p_marks import MID, cta, e

from ceramics_data import MAKERS

CSS = '<link rel="stylesheet" href="/marks/marks.css">'
IMG_DIR = os.path.join(tables.SITE_ROOT, "marks", "img", "ceramics")


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
        if not re.search(r"(gives|says|printed|describes|described|records|calls|dates|shows|reported|reprints|told|lists|counted|notes|decodes)\b[^{]*\{src:" + re.escape(m.group(1)) + r"\}", text):
            ONE_SOURCE.append(text[max(0, m.start() - 90):m.end()])
    return re.sub(r"\{src:([^}]+)\}", lambda m: refs([k.strip() for k in m.group(1).split(",")], srcs), text)


def photo(img, cls="mkp"):
    path = os.path.join(IMG_DIR, img["file"] + ".webp")
    if not os.path.exists(path):
        raise SystemExit(f"missing image {path}")
    from PIL import Image
    w, h = Image.open(path).size
    credit = f'<a href="{e(img["page"])}" rel="nofollow">{e(img["credit"])}</a>, {e(img["licence"])}'
    return (f'<figure class="{cls}"><img src="/marks/img/ceramics/{img["file"]}.webp" alt="{e(img["alt"])}" width="{w}" height="{h}" loading="lazy" decoding="async">'
            f'<figcaption>{img["caption"]} <span class="mkp__credit">{credit}</span></figcaption></figure>')


def mark_card(m, srcs, page_has_photos=True):
    pics = "".join(photo(i) for i in m.get("images", []))
    if not pics and not page_has_photos:
        return f"""<section class="mk mk--words" id="{m['id']}">
        <div class="mk__text">
          <h3>{m['name']}</h3>
          <p class="mk__dates">{m['dates']}</p>
          <p>{fill(m['body'], srcs)}</p>
        </div>
      </section>"""
    if not pics:
        pics = '<p class="mk__nophoto">No photograph of this mark under an open license was found, so it is described in words only.</p>'
    return f"""<section class="mk" id="{m['id']}">
        <div class="mk__text">
          <h3>{m['name']}</h3>
          <p class="mk__dates">{m['dates']}</p>
          <p>{fill(m['body'], srcs)}</p>
        </div>
        <div class="mk__pics">{pics}</div>
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
    has = any(m.get("images") for m in d["marks"])
    cards = "\n      ".join(mark_card(m, srcs, has) for m in d["marks"])
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
{('      ' + photo(d['hero'], 'mkp mkp--hero')) if d.get('hero') else ''}
      <h2 id="maker">{d['maker_heading']}</h2>
{paras}
      <h2 id="marks">{d['marks_heading']}</h2>
      {d.get('marks_intro', '') and '<p>' + fill(d['marks_intro'], srcs) + '</p>'}
      {cards}
      <h2 id="careful">{d['careful_heading']}</h2>
      <ul>{cautions}</ul>
      <p class="note">Heirloom never decides whether an item is genuine. A mark says what it claims; a specialist who can handle the item is the one to ask.</p>
{disagree}
      <h2 id="sources">Sources</h2>
      <p class="note">The small numbers beside each fact point to these sources. Every fact on this page is in at least two of them. Photographs are credited under each one.</p>
      {sources_html(srcs)}
{cta(d['cta'])}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, d["h1"], d["desc"], extra={"about": {"@type": "Thing", "name": d["crumb"]}}), faq_ld(path, faqs_plain)]
    return path, page(path, d["title"], d["desc"], d["h1"], body, graph, mid=MID, crumb_name=d["crumb"], extra_head=CSS)


def build():
    out = [build_page(d) for d in MAKERS]
    for t in ONE_SOURCE:
        print("one source:", t)
    return out


CHILDREN = [("/marks/" + d["slug"], d["crumb"], d["card"]) for d in MAKERS]
