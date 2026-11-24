"""Chinese reign marks: a hub with a finder, and a page for each reign whose
marks are commonly met.

Built from the app's table (backend/src/data/mark-tables/chinese.json,
`systems.reign_marks`), the same one Heirloom Advisor reads a reign mark with,
so the site and the app name the same reign for the same characters. Every
note on a page carries the numbers of the sources the table gives for it.

Marks are shown three ways, each labeled: the characters typeset in their
columns (an exact rendering of the text, not of any period's calligraphy),
public-domain book facsimiles, and open-license museum photographs, listed
in marks/img/chinese/index.json with their credits.
"""
import json
import re
import os
import urllib.parse

from shell import *
import tables
from p_marks import MID, cta, e
from sections import section_page, seal_chars, CSS as SEC_CSS, JS as SEC_JS

T = tables.load("chinese")["systems"]["reign_marks"]
ROWS = T["rows"]
SRC = {s["id"]: s for s in T["sources"]}
IMG_DIR = os.path.join(tables.SITE_ROOT, "marks", "img", "chinese")
IMAGES = []
for _f in sorted(os.listdir(IMG_DIR)) if os.path.isdir(IMG_DIR) else []:
    if _f.startswith("index") and _f.endswith(".json"):
        IMAGES += json.load(open(os.path.join(IMG_DIR, _f)))

HUB = "/marks/chinese-reign-marks"
# Reigns with a page of their own: the marks people actually meet. The rest
# (no marks, or a handful of pieces) are covered on the hub.
OWN_PAGE = [r["reign_pinyin"] for r in ROWS]
DYN_HAN = {"Ming": "明", "Qing": "清"}


def slug(r):
    return f"/marks/{r['reign_pinyin'].lower()}-mark"


def link(r):
    return slug(r) if r["reign_pinyin"] in OWN_PAGE else f"{HUB}#{r['reign_pinyin'].lower()}"


def years(r):
    s = f"{r['start']}–{r['end']}" if r["start"] != r["end"] else str(r["start"])
    alts = []
    if r.get("alt_start") and r["alt_start"] != r["start"]:
        alts.append(f"from {r['alt_start']}")
    if r.get("alt_end") and r["alt_end"] != r["end"]:
        alts.append(f"to {r['alt_end']}")
    return s, (f"some tables {' and '.join(alts)}" if alts else "")


def dynasty_name(r):
    return "Hongxian empire" if r["dynasty"] == "Hongxian" else f"{r['dynasty']} dynasty"


def wanted_chars(*texts):
    s = set()
    for t in texts:
        s |= {c for c in t if "㐀" <= c <= "鿿"}
    return "".join(sorted(s))


def font_head(chars):
    q = urllib.parse.quote(chars)
    return (f'<link href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&display=swap&text={q}" rel="stylesheet">\n'
            '  <link rel="stylesheet" href="/marks/marks.css">')


class Refs:
    """Numbered sources for one page, in order of first citation."""
    def __init__(self):
        self.order = []

    def __call__(self, ids):
        ids = [i for i in ids if i in SRC]
        if not ids:
            return ""
        for i in ids:
            if i not in self.order:
                self.order.append(i)
        nums = sorted(self.order.index(i) + 1 for i in set(ids))
        return '<sup class="refs">' + ", ".join(f'<a href="#src-{n}">{n}</a>' for n in nums) + "</sup>"

    def html(self):
        items = "".join(
            f'<li id="src-{n}">{e(SRC[i]["name"])}' + (f' (<a href="{e(SRC[i]["url"])}" rel="nofollow">link</a>)' if SRC[i].get("url") else "") + "</li>"
            for n, i in enumerate(self.order, 1))
        return f'<!--copy-check:skip--><ol class="sources sources--num">{items}</ol><!--/copy-check:skip-->'


def w(text):
    """The table's words in the site's voice: an "item", never a "piece" (D13, D44)."""
    import re
    text = re.sub(r"\bpieces\b", "items", text)
    text = re.sub(r"\bPieces\b", "Items", text)
    text = re.sub(r"\bpiece\b", "item", text)
    text = re.sub(r"\bthe object\b", "the item", text)
    text = text.replace("seal marks 'found favour' in Yongzheng", "seal marks were favored under Yongzheng")
    return text


def pf(r, key, fallback=True):
    ids = r.get("per_fact_sources", {}).get(key)
    if not ids and fallback:
        ids = r.get("sources", [])
    return ids or []


def cmark(chars, script="regular", cls=""):
    """The characters typeset in a mark's columns, the first column on the right. A rendering of the text
    only, never of any period's calligraphy."""
    n = len(chars)
    # Regular-script six-character marks are usually two columns of three;
    # seal-script ones three columns of two; four characters two by two.
    rows = 3 if (n == 6 and script == "regular") or n == 3 else 2
    size = "six" if n == 6 else "four"
    spans = "".join(f"<span>{c}</span>" for c in chars)
    return f'<span class="cmark cmark--{size} {cls}" style="--rows:{rows}" lang="zh-Hant" role="img" aria-label="{e(chars)}">{spans}</span>'


def img_tag(im, cls=""):
    from PIL import Image
    path = os.path.join(IMG_DIR, im["file"])
    if not os.path.exists(path):
        raise SystemExit(f"missing image {path}")
    w, h = Image.open(path).size
    c = f' class="{cls}"' if cls else ""
    return f'<img{c} src="/marks/img/chinese/{im["file"]}" alt="{e(im["alt"])}" width="{w}" height="{h}" loading="lazy" decoding="async">'


LICENCE_URL = {"CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
               "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/"}


def figure(im):
    lic = im["licence"]
    lic_html = f'<a href="{LICENCE_URL[lic]}" rel="nofollow">{e(lic)}</a>' if lic in LICENCE_URL else e(lic)
    credit = f'<a href="{e(im["page"])}" rel="nofollow">{e(im["credit"])}</a>, {lic_html}'
    cls = "cm-fig cm-fig--book" if im["kind"] == "book" else "cm-fig"
    return f'<figure class="{cls}">{img_tag(im)}<figcaption>{e(w(im["caption"]))} <span class="stamps__credit">{credit}</span></figcaption></figure>'


def images_for(reign, kind=None, period=None):
    return [im for im in IMAGES if im["reign"] == reign and (kind is None or im["kind"] == kind)
            and (period is None or im.get("period_or_later") == period)]


def written(r):
    """The mark as written: the recorded six-character form, else four, else
    the reign's name in the standard six-character pattern."""
    marks = [m for m in r["marks"] if "(" not in m["chars"]]
    return next((m["chars"] for m in marks if m["chars_count"] == 6 and m["script"] == "regular"), None) \
        or next((m["chars"] for m in marks if m["chars_count"] in (4, 6)), None) \
        or (f"大{DYN_HAN[r['dynasty']]}{r['reign_chars']}年製" if r["dynasty"] in DYN_HAN else f"{r['reign_chars']}年製")


def tile(r):
    p = r["reign_pinyin"]
    mus = images_for(p, "museum")
    photo = next(iter([i for i in mus if i.get("object_kind", "porcelain") == "porcelain" and i.get("period_or_later") == "period"]
                      + [i for i in mus if i.get("object_kind", "porcelain") == "porcelain"] + mus), None)
    book = next((im for im in images_for(p, "book") if im.get("form", "").startswith("seal")), None) or next(iter(images_for(p, "book")), None)
    six = written(r)
    inner = (img_tag(photo, "reign-tile__photo") if photo else "") + (img_tag(book) if book and not photo else "") + cmark(six)
    y, alt = years(r)
    keys = " ".join(sorted({r["reign_pinyin"].lower(), r["wade_giles"].lower().replace("'", "").replace("-", "").replace("’", "").replace(" ", ""),
                     r["reign_chars"], *[s.split(" (")[0].lower().replace("'", "").replace("-", "").replace(" ", "") for s in r.get("other_spellings", [])]}))
    keys = keys.replace("ü", "u")
    tag = "a" if r["reign_pinyin"] in OWN_PAGE or True else "div"
    return (f'<li data-reign="{e(r["reign_pinyin"])}" data-dyn="{e(r["dynasty"])}" data-keys="{e(keys)}">'
            f'<{tag} class="reign-tile" href="{link(r)}"><span class="reign-tile__marks">{inner}</span>'
            f'<span class="reign-tile__name">{e(r["reign_pinyin"])} <span lang="zh-Hant">{r["reign_chars"]}</span></span>'
            f'<span class="reign-tile__years">{y}{"<br>" + e(alt) if alt else ""}</span></{tag}></li>')


def reign_table(rows, refs):
    body = "".join(
        f'<tr id="{r["reign_pinyin"].lower()}"><td><a href="{link(r)}">{e(r["reign_pinyin"])}</a></td><td lang="zh-Hant">{r["reign_chars"]}</td>'
        f'<td>{e(r["wade_giles"])}</td><td>{years(r)[0]}{(" <small>(" + e(years(r)[1]) + ")</small>") if years(r)[1] else ""}{refs(pf(r, "dates"))}</td>'
        f'<td>{e(marks_summary(r))}</td></tr>'
        for r in rows)
    return ('<div class="table-wrap"><table><thead><tr><th>Reign</th><th>Characters</th><th>Older spelling</th><th>Years</th><th>Marks on imperial wares</th></tr></thead>'
            f"<tbody>{body}</tbody></table></div>")


def marks_summary(r):
    if not r["marks"]:
        return "None recorded"
    kinds = []
    for m in r["marks"]:
        if "(" in m["chars"]:
            continue
        k = f"{m['chars_count']}-character {m['script']}"
        if k not in kinds:
            kinds.append(k)
    return ", ".join(kinds).replace("regular", "regular script").replace("seal", "seal script")


# ── The reign rail: every reign, in order, the current one marked ─────────────
HOME = "/marks/chinese/"
CMID = (HOME, "Chinese marks")


def rail(current=None):
    groups = []
    for dyn, label_zh, label in (("Ming", "明", "Ming"), ("Qing", "清", "Qing"), ("Hongxian", "洪憲", "1916")):
        rs = [r for r in ROWS if r["dynasty"] == dyn]
        chips = "".join(
            f'<a class="cn-rail__r" href="{link(r)}"{" aria-current=" + chr(34) + "page" + chr(34) if current and r["reign_pinyin"] == current else ""}>'
            f'<span class="cn-rail__han" lang="zh-Hant">{r["reign_chars"]}</span><span class="cn-rail__py">{e(r["reign_pinyin"])}</span>'
            f'<span class="cn-rail__yr">{r["start"]}</span></a>'
            for r in rs)
        groups.append(f'<div class="cn-rail__dyn"><span class="cn-rail__dynlabel"><span lang="zh-Hant">{label_zh}</span> {label}</span><div class="cn-rail__chips">{chips}</div></div>')
    return f"""    <nav class="cn-rail" aria-label="Reigns, 1368 to 1916">
      <button class="cn-rail__btn cn-rail__btn--prev" type="button" aria-label="Earlier reigns">‹</button>
      <div class="cn-rail__track">{"".join(groups)}</div>
      <button class="cn-rail__btn cn-rail__btn--next" type="button" aria-label="Later reigns">›</button>
    </nav>"""


SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'


def side(path):
    """The section's contents: every reign and every hall, with a search."""
    import p_chinese_halls as ph
    on_reign = path == HUB or path.endswith("-mark")
    on_hall = path == ph.HUB

    def reign_li(r):
        cur = ' aria-current="page"' if link(r) == path else ""
        keys = " ".join([r["reign_pinyin"], r["wade_giles"], r["reign_chars"], *r.get("other_spellings", [])])
        return (f'<li data-keys="{e(keys)}"><a href="{link(r)}"{cur}><span class="han" lang="zh-Hant">{r["reign_chars"]}</span>'
                f'{e(r["reign_pinyin"])}<span class="yr">{r["start"]}</span></a></li>')
    reigns = ""
    for dyn, label in (("Ming", "Ming, 1368–1644"), ("Qing", "Qing, 1644–1912"), ("Hongxian", "After the Qing")):
        reigns += f'<div class="side-sub">{label}</div><ul class="side-list">' + "".join(reign_li(r) for r in ROWS if r["dynasty"] == dyn) + "</ul>"
    halls = ""
    for k in ph.ORDER:
        rs = [r for r in ph.ROWS if r.get("kind") == k]
        if not rs:
            continue
        halls += f'<div class="side-sub">{e(ph.KIND[k])}</div><ul class="side-list">' + "".join(
            f'<li data-keys="{e(r["chars"] + " " + r["pinyin"] + " " + " ".join(r.get("variants", [])))}"><a href="{ph.HUB}#{ph.anchor(r)}">'
            f'<span class="han" lang="zh-Hant">{r["chars"]}</span><span class="py">{e(re.sub(r"[;/].*", "", r["pinyin"]).strip())}</span></a></li>' for r in rs) + "</ul>"
    top_cur = ' aria-current="page"' if path == HOME else ""
    hub_cur = ' aria-current="page"' if path == HUB else ""
    hall_cur = ' aria-current="page"' if path == ph.HUB else ""
    return f"""        <div class="side-search">{SEARCH_ICON}<input type="search" placeholder="Search reigns, halls and people" aria-label="Search reigns, halls and people" autocomplete="off"></div>
        <div class="side-tree">
          <ul class="side-list"><li><a class="side-link--top" href="{HOME}"{top_cur}>Overview</a></li></ul>
          <details class="side-group"{" open" if on_reign or path == HOME else ""}><summary>Reign marks</summary>
            <ul class="side-list"><li><a href="{HUB}"{hub_cur}>All reign marks, with a finder</a></li></ul>
            {reigns}
          </details>
          <details class="side-group"{" open" if on_hall else ""}><summary>Hall marks</summary>
            <ul class="side-list"><li><a href="{ph.HUB}"{hall_cur}>All hall marks, with a finder</a></li></ul>
            {halls}
          </details>
          <details class="side-group"{" open" if path.startswith("/marks/chinese/painters/") else ""}><summary>Painters and collectors</summary>
            <ul class="side-list"><li><a href="/marks/chinese/painters/"{' aria-current="page"' if path == "/marks/chinese/painters/" else ""}>All 1,220, with a finder</a></li></ul>
            <ul class="side-list side-people" data-search-url="/marks/chinese/painters/search.json"></ul>
          </details>
          <p class="side-empty">Nothing matches. Try the pinyin, an older spelling, or the characters.</p>
        </div>"""


def section_kw(path, current=None, with_rail=False):
    kw = section_page("china", path, rail(current) if with_rail else "")
    kw["side"] = side(path)
    return kw


# ── The section home ─────────────────────────────────────────────────────────
def home():
    path = HOME
    title = "Chinese Marks: Reign Marks, Hall Marks and Seals | Heirloom"
    desc = "A sourced reference to the marks on Chinese porcelain and works of art: every Ming and Qing reign mark, 126 hall and studio marks, and how to read them, with sources in English and Chinese."
    h1 = "Chinese marks"
    import p_chinese_halls
    n_halls = len(p_chinese_halls.ROWS)
    doors = f"""<ul class="sec-doors">
        <li><a class="sec-door" href="{HUB}"><span class="sec-door__han" lang="zh-Hant">年款</span><span class="sec-door__title">Reign marks</span><span class="sec-door__desc">Every reign from 1368 to 1916, with a finder, the seal-script forms and the marks most often copied.</span><span class="sec-door__count">28 reigns</span></a></li>
        <li><a class="sec-door" href="/marks/chinese/painters/"><span class="sec-door__han" lang="zh-Hant">印鑑款識</span><span class="sec-door__title">Painters and collectors</span><span class="sec-door__desc">1,220 painters, calligraphers and collectors, with their art names, dates and 21,000 recorded seals and signatures.</span><span class="sec-door__count">1,220 people</span></a></li>
        <li><a class="sec-door" href="/marks/chinese-hall-marks"><span class="sec-door__han" lang="zh-Hant">堂名款</span><span class="sec-door__title">Hall marks</span><span class="sec-door__desc">Marks naming a hall, studio or palace building instead of a reign, from the Ming to the Republic.</span><span class="sec-door__count">{n_halls} marks</span></a></li>
      </ul>"""
    body = f"""      <p class="guide__lede">The characters on the base of Chinese porcelain usually name a reign, sometimes a hall or a studio. This reference reads them: every Ming and Qing reign mark and {n_halls} hall marks, each fact with its sources in English and Chinese, and real marks photographed in museums.</p>
      {META}
      {doors}
      <h2 id="reigns">The reigns, 1368 to 1916</h2>
      <p>Pick a reign to see its mark, how it was written on imperial wares, and how often it was copied.</p>
{rail().replace('class="cn-rail"', 'class="cn-rail cn-rail--inline"')}
      <h2 id="rule">One rule throughout</h2>
      <p>A mark names the reign or the hall it claims. Marks of admired reigns were copied for centuries, so a mark never dates an item by itself, and Heirloom never says whether an item is genuine.</p>
{cta("Photograph the base. The Advisor reads the characters, names the reign or hall the mark claims, and keeps the reading with the photo it came from.")}
"""
    chars = wanted_chars(body + seal_chars())
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Chinese porcelain marks"}})]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name="Chinese marks",
                      extra_head=font_head(chars) + "\n  " + SEC_CSS, extra_body=SEC_JS, **section_kw(path))


# ── The hub ──────────────────────────────────────────────────────────────────
def hub():
    refs = Refs()
    ming = [r for r in ROWS if r["dynasty"] == "Ming"]
    qing = [r for r in ROWS if r["dynasty"] == "Qing"]
    hx = [r for r in ROWS if r["dynasty"] == "Hongxian"]
    reading = "".join(f"<li>{e(w(x['text']))}{refs(x['sources'])}</li>" for x in T["reading"])
    cav = "".join(f"<li>{e(w(c['text'] if isinstance(c, dict) else c))}{refs(c['sources']) if isinstance(c, dict) else ''}</li>" for c in T["caveats"])
    unmarked = [r for r in ROWS if r["reign_pinyin"] not in OWN_PAGE]
    few = "".join(
        f'<h3 id="{r["reign_pinyin"].lower()}">{e(r["reign_pinyin"])} <span lang="zh-Hant">{r["reign_chars"]}</span>, {years(r)[0]}</h3>'
        f'<p>{e(w(r["imperial_marks_note"]))}{refs(pf(r, "imperial_marks_note"))} {e(w(r["later_copies_note"])) if not r["later_copies_note"].startswith("None") else ""}'
        f'{refs(pf(r, "later_copies_note")) if not r["later_copies_note"].startswith("None") else ""}</p>'
        for r in unmarked)
    rep = T["republic_note"]
    example = cmark("大清乾隆年製", cls="cmark--big")
    path = HUB
    title = "Chinese Reign Marks: Ming and Qing Marks, With a Finder | Heirloom"
    desc = "Every Ming and Qing reign mark, 1368–1916: the characters, how to read them, which reigns used seal script, the marks most often copied, and a finder, with sources in English and Chinese."
    h1 = "Chinese reign marks"
    body = f"""      <p class="guide__lede">The six characters on the base of a Chinese porcelain bowl usually name a dynasty and a reign: 大清乾隆年製, “made in the Qianlong reign of the Great Qing.” Here is every reign mark from 1368 to 1916, how to read one, and why a mark is where dating starts, not where it ends.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A reign mark is read in columns from the right, top to bottom{refs(T['reading'][0]['sources'])}. The first two characters name the dynasty, 大明 Ming or 大清 Qing; the next two the reign; the last two, 年製, mean “made in the period”{refs(T['reading'][2]['sources'])}. Marks of admired earlier reigns were put on later wares for centuries, so a mark names the reign it claims and does not by itself date the item{refs(T['caveats'][0]['sources'])}.</p>
      </div>
      <h2 id="finder">Find a reign mark</h2>
      <div class="finder" id="cr-finder">
        <p class="finder__hint" style="margin-top:0">Look at the first column on the right. Pick the dynasty it names, or type a reign’s name.</p>
        <div class="finder__row">
          <div class="cr-dyn" role="group" aria-label="First column of the mark">
            <button type="button" data-cr-dyn="Ming" aria-pressed="false"><span class="han" lang="zh-Hant">大明</span> Ming, 1368–1644</button>
            <button type="button" data-cr-dyn="Qing" aria-pressed="false"><span class="han" lang="zh-Hant">大清</span> Qing, 1644–1912</button>
          </div>
          <label class="grow">Reign name or characters<input id="cr-q" type="search" placeholder="Qianlong, Ch'ien-lung or 乾隆" autocomplete="off"></label>
        </div>
        <div class="finder__results" id="cr-results" aria-live="polite"><p class="finder__hint">Every reign is below. The characters in each tile are typeset, in the columns a mark uses; beside them, where there is one, is the seal-script form as the marks books of 1906 to 1915 print it.</p></div>
        <ul class="reigns">{"".join(tile(r) for r in ming + qing + hx)}</ul>
      </div>
      <h2 id="read">How to read a reign mark</h2>
      <div class="cm-figs"><figure class="cm-fig">{example}<figcaption>大清乾隆年製, typeset. Read the right column first: 大清 Da Qing, 乾隆 Qianlong, 年製 nian zhi.</figcaption></figure>{"".join(figure(im) for im in IMAGES if im.get("hub") == "read")}</div>
      <ul>{reading}</ul>
      <h2 id="ming">Ming reign marks, 1368–1644</h2>
      {reign_table(ming, refs)}
      <h2 id="qing">Qing reign marks, 1644–1912</h2>
      {reign_table(qing, refs)}
      <h2 id="hongxian">After the Qing: Hongxian and the Republic</h2>
      {reign_table(hx, refs)}
      <p>{e(w(rep['text']))}{refs(rep['sources'])}</p>
      <h2 id="careful">A mark is not a date</h2>
      <div class="cm-figs">{"".join(figure(im) for im in IMAGES if im.get("hub") == "careful")}</div>
      <ul>{cav}</ul>
      <p class="note">Heirloom never decides whether an item is genuine or of the period its mark names. A specialist who can handle it is the one to ask.</p>
      <h2 id="sources">Sources</h2>
      <p class="note">The small numbers point to these sources: books of marks from 1899 to 1919 (public domain), Christie’s and Gotheborg, Baidu Baike and Chinese museum and archaeology reporting, and reign tables from universities. Each statement has at least two, except where the table says otherwise.</p>
      {refs.html()}
{cta("Photograph the base. The Advisor reads the characters, names the reign the mark claims, and keeps the reading on the item’s record, with the reminder that a mark alone does not date an item.")}
      <h2 id="faq">Questions</h2>
{faq_html(HUB_FAQ)}
"""
    kw = section_kw(path)
    chars = wanted_chars(body + kw["top"] + seal_chars())
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Chinese reign marks"}}), faq_ld(path, HUB_FAQ)]
    return path, page(path, title, desc, h1, body, graph, mid=CMID, crumb_name="Reign marks",
                      extra_head=font_head(chars) + "\n  " + SEC_CSS, extra_body='<script src="/marks/marks.js" defer></script>\n  <script>window.MARKS_TOOL = "chinese";</script>\n  ' + SEC_JS, **kw)


HUB_FAQ = [
    ("How do I read the characters on the bottom of a Chinese vase?",
     "<p>Start at the top of the right-hand column and read down, then move one column to the left. A six-character reign mark reads dynasty, reign, then 年製 “made in the period”: 大明宣德年製 is “made in the Xuande reign of the Great Ming.” A four-character mark leaves out the dynasty.</p>"),
    ("Does a Qianlong mark mean my item is from the Qianlong period?",
     "<p>No. Qianlong marks were put on a great many later items, especially in the Republic period (1912–1949) and since. A mark tells you the reign it claims; the body, glaze, painting and form decide the date, and only someone who can handle the item can judge those.</p>"),
    ("What is seal script?",
     "<p>An older, squarer style of the characters, used on seals. Seal-script reign marks are rare before the Yongzheng reign (1723–1735) and usual under Qianlong, Jiaqing and Daoguang; from Xianfeng (1851) the regular script returns.</p>"),
    ("Why does some Chinese porcelain have no mark, or an empty double ring?",
     "<p>Most porcelain made for everyday use was never marked. Under Kangxi a local ban on writing the reign name led potters to paint an empty double ring or a small symbol instead; such rings were also used later, so they do not date an item either.</p>"),
]


# ── A reign's page ──────────────────────────────────────────────────────────
def reign_page(r, prev, nxt):
    refs = Refs()
    p = r["reign_pinyin"]
    y, alt = years(r)
    path = slug(r)
    dyn = dynasty_name(r)
    marks = [m for m in r["marks"] if "(" not in m["chars"]]
    title = f"{p} Mark: {r['reign_chars']} Reign Marks, {y} | Heirloom"
    desc = f"How to recognize a {p} reign mark ({r['reign_chars']}, {r['wade_giles']}, {y}): the characters, the scripts used on imperial wares, the later copies, and photographs from museum collections, with sources."
    h1 = f"{p} mark <span lang=\"zh-Hant\">{r['reign_chars']}</span>"
    six = written(r)
    mark_items = "".join(
        f'<li><span class="mark-chars" lang="zh-Hant">{m["chars"]}</span> · {m["chars_count"]} characters, {m["script"]} script. {e(w(m["note"]))}</li>' for m in r["marks"] if "(" not in m["chars"])
    other = [m for m in r["marks"] if "(" in m["chars"]]
    if other:
        mark_items += "".join(f'<li>{e(w(m["note"]))}</li>' for m in other)
    typeset = "".join(f'<figure class="cm-fig">{cmark(m["chars"])}<figcaption><span lang="zh-Hant">{m["chars"]}</span>, typeset</figcaption></figure>'
                      for m in {m["chars"]: m for m in marks if m["script"] == "regular"}.values()) or \
        f'<figure class="cm-fig">{cmark(six)}<figcaption><span lang="zh-Hant">{six}</span>, typeset: the reign’s name in the usual six-character form</figcaption></figure>'
    if not marks:
        mark_items = "<li>No mark of this reign is recorded on imperial porcelain; the photographs below show where its name does appear.</li>"
    books = "".join(figure(im) for im in images_for(p, "book"))
    period = "".join(figure(im) for im in images_for(p, "museum", "period") if im.get("object_kind", "porcelain") == "porcelain")
    named = "".join(figure(im) for im in images_for(p, "museum") if im.get("object_kind", "porcelain") != "porcelain")
    later = "".join(figure(im) for im in images_for(p, "museum", "later") if im.get("object_kind", "porcelain") == "porcelain") + "".join(
        figure(im) for im in IMAGES if im.get("claims") == p and im["reign"] != p)
    spellings = ", ".join([r["wade_giles"], *[s for s in r.get("other_spellings", [])]])
    nav = '<p class="reign-nav">' + (f'<a href="{link(prev)}">← {e(prev["reign_pinyin"])}</a>' if prev else "") + \
          f' · <a href="{HUB}">All reign marks</a> · ' + (f'<a href="{link(nxt)}">{e(nxt["reign_pinyin"])} →</a>' if nxt else "") + "</p>"
    hx = r["dynasty"] == "Hongxian"
    first_copy = re.split(r"(?<=[.;])\s", w(r["later_copies_note"]).strip())[0] if r.get("later_copies_note") else ""
    at_a_glance = f"""      <header class="entry-head">
        <div class="entry-head__mark">{cmark(six, cls="cmark--big")}</div>
        <dl class="facts">
          <dt>Reign</dt><dd>{e(p)} <span lang="zh-Hant">{r['reign_chars']}</span>, {e(dyn)}</dd>
          <dt>Years</dt><dd>{y}{(" (" + e(alt) + ")") if alt else ""}</dd>
          <dt>Older spellings</dt><dd>{e(spellings)}</dd>
          {('<dt>Emperor</dt><dd>' + e(r['emperor_name']) + '</dd>') if r.get('emperor_name') else ''}
          <dt>Marks recorded</dt><dd>{e(marks_summary(r))}</dd>
          <dt>Later copies</dt><dd>{e(first_copy) if first_copy and not first_copy.startswith("None") else "None documented as common"}</dd>
        </dl>
      </header>
"""
    body = at_a_glance + f"""      <p class="guide__lede">The {p} reign of the {dyn} ran {y}{" (" + e(alt) + ")" if alt else ""}. {("Its mark reads <span lang=" + chr(34) + "zh-Hant" + chr(34) + ">" + six + "</span>. Here is how it was written on imperial wares, and how often it was copied.") if marks else "No reign mark of it is recorded on imperial porcelain. Here is what is known, and where its name does appear."}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{e(w(r["imperial_marks_note"]))}{refs(pf(r, "imperial_marks_note"))} {e(w(r["later_copies_note"])) if not r["later_copies_note"].startswith("None") else "No common later copies are recorded in the sources."}{refs(pf(r, "later_copies_note"))}</p>
      </div>
      <h2 id="mark">The {p} mark</h2>
      <div class="cm-figs">{typeset}{books}</div>
      <ul>{mark_items}</ul>{refs(pf(r, "marks"))}
      <p>Years: {y}{" (" + e(alt) + ")" if alt else ""}. {e(w(r.get("year_note", "")))}{refs(pf(r, "dates"))}</p>
{('      <h2 id="photos">On imperial wares</h2>' + chr(10) + '      <div class="cm-figs">' + period + '</div>') if period else ''}
{('      <h2 id="named">Where the reign’s name appears</h2>' + chr(10) + '      <p>' + ("Besides its marks, the reign’s name is written on other dated things: coins, inscriptions and dedications." if marks else "With no reign mark to show, here is the reign’s name on dated things of the period: coins, inscriptions and dedications.") + '</p>' + chr(10) + '      <div class="cm-figs">' + named + '</div>') if named else ''}
      <h2 id="copies">{"Later items with this mark" if not hx else "Hongxian marks are almost always later"}</h2>
      <p>{e(w(r["later_copies_note"]))}{refs(pf(r, "later_copies_note"))}</p>
{('      <div class="cm-figs">' + later + '</div>') if later else ''}
      <p class="note">A reign mark names the reign it claims. Heirloom never decides whether an item is of that period or genuine; a specialist who can handle it is the one to ask.</p>
      {nav}
      <h2 id="sources">Sources</h2>
      {refs.html()}
{cta(f"Photograph the base. The Advisor reads the characters, names the reign the mark claims ({p}, {y}), and keeps the reading with the photo it came from.")}
"""
    kw = section_kw(path, p, with_rail=True)
    chars = wanted_chars(body + kw["top"] + seal_chars())
    graph = [article_ld(path, f"{p} mark ({r['reign_chars']})", desc, extra={"about": {"@type": "Thing", "name": f"{p} reign mark"}})]
    return path, page(path, title, desc, h1, body, graph, mid=(HUB, "Reign marks"), crumb_name=f"{p} mark",
                      extra_head=font_head(chars) + "\n  " + SEC_CSS, extra_body=SEC_JS, **kw)


def build():
    out = [home(), hub()]
    own = [r for r in ROWS if r["reign_pinyin"] in OWN_PAGE]
    for i, r in enumerate(own):
        out.append(reign_page(r, own[i - 1] if i else None, own[i + 1] if i + 1 < len(own) else None))
    return out


CHILDREN = [(HOME, "Chinese marks", "Every Ming and Qing reign mark, 1368–1916, and the hall and studio marks, with finders and sources in English and Chinese.")]
