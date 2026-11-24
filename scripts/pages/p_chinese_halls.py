"""Chinese hall and studio marks (堂名款): one page, with a finder, and a page
of its own for each hall that has enough to say.

Built from the app's table (chinese.json, `systems.hall_marks`), the one
Heirloom Advisor names a hall mark with. Every note carries its sources'
numbers. Images: public-domain book facsimiles and open-license museum
photographs listed in marks/img/chinese-halls/index*.json.
"""
import json
import os
import re

from shell import *
import tables
from p_marks import MID, cta, e
from p_chinese import Refs, w as _w, font_head, wanted_chars, HUB as REIGN_HUB
from sections import section_page, seal_chars, CSS as SEC_CSS, JS as SEC_JS

T = tables.load("chinese")["systems"].get("hall_marks", {"rows": [], "sources": [], "caveats": []})
ROWS = T["rows"]
SRC = {s["id"]: s for s in T.get("sources", [])}
IMG_DIR = os.path.join(tables.SITE_ROOT, "marks", "img", "chinese-halls")
IMAGES = []
for _f in sorted(os.listdir(IMG_DIR)) if os.path.isdir(IMG_DIR) else []:
    if _f.startswith("index") and _f.endswith(".json"):
        IMAGES += json.load(open(os.path.join(IMG_DIR, _f)))

HUB = "/marks/chinese-hall-marks"


def w(text):
    return us(_w(text or ""))
KIND = {"imperial": "Emperors, empresses and palace buildings", "private": "Princes, officials, scholars and private studios",
        "dealer": "Dealers and makers", "republic": "Republic-period halls", "painter": "Jingdezhen painters’ studios, Republic period",
        "placement": "Palace placement inscriptions (not maker’s marks)"}
ORDER = ["imperial", "private", "dealer", "republic", "painter", "placement"]


def us(text):
    """American spelling for the research text."""
    for a, b in (("colours", "colors"), ("Colours", "Colors"), ("colour", "color"), ("Colour", "Color"), ("favour", "favor"), ("honour", "honor"), ("Honour", "Honor"), ("centre", "center")):
        text = text.replace(a, b)
    return re.sub(r"not every item with this mark need be", "items with this mark need not all be", text)


def clean(text):
    """Drop research notes in parentheses that name a source rather than say something."""
    return re.sub(r"\s*\((?:[^()]*\b(?:translation|per |Sotheby|Christie|Peng|saved source|catalogue|Davison|reported)\b[^()]*)\)", "", text or "").strip()


class HallRefs(Refs):
    """Refs over this table's sources."""
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


def pf(r, key):
    return r.get("per_fact_sources", {}).get(key) or r.get("sources", [])


def anchor(r):
    import unicodedata
    flat = unicodedata.normalize("NFKD", r["pinyin"]).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", flat.split(";")[0]).strip("-")


def images_for(r):
    names = {r["chars"], *r.get("variants", [])}
    return [im for im in IMAGES if im.get("chars") in names]


def img_html(im):
    from PIL import Image
    path = os.path.join(IMG_DIR, im["file"])
    wd, ht = Image.open(path).size
    credit = f'<a href="{e(im["page"])}" rel="nofollow">{e(im["credit"])}</a>, {e(im["licence"])}'
    cls = "cm-fig cm-fig--book" if im["kind"] == "book" else "cm-fig"
    return (f'<figure class="{cls}"><img src="/marks/img/chinese-halls/{im["file"]}" alt="{e(im["alt"])}" width="{wd}" height="{ht}" loading="lazy" decoding="async">'
            f'<figcaption>{e(w(im["caption"]))} <span class="stamps__credit">{credit}</span></figcaption></figure>')


def periods(r):
    return "; ".join(e(p["period"]) + (f" ({p['start']}" + (f"–{p['end']}" if p.get("end") and p["end"] != p["start"] else "") + ")" if p.get("start") else "") for p in r.get("periods", []))


def one(r, key):
    return " <span class=\"one-src\">(one source)</span>" if key in (r.get("single_source_fields") or []) else ""


def has(r, key):
    return bool(r.get(key)) and key not in (r.get("unsourced_fields") or [])


def card(r, refs):
    pics = "".join(img_html(im) for im in images_for(r))
    import unicodedata
    flat = lambda t: unicodedata.normalize("NFKD", t or "").encode("ascii", "ignore").decode().lower()
    keys = " ".join(sorted({re.sub(r"[^a-z]", "", flat(r["pinyin"])), r["chars"], *r.get("variants", []),
                            re.sub(r"[^a-z]", "", flat(r.get("wade_giles"))), *[x for x in re.findall(r"[a-z]+", flat(clean(r.get("meaning")))) if len(x) > 3]} - {""}))
    facts = []
    if has(r, "owner"):
        facts.append(f'<p><strong>Whose:</strong> {e(w(clean(r["owner"])))}{(", " + e(w(r["owner_dates"]))) if has(r, "owner_dates") else ""}{refs(pf(r, "owner"))}{one(r, "owner")}</p>')
    if has(r, "periods"):
        facts.append(f'<p><strong>On wares of:</strong> {periods(r)}{refs(pf(r, "periods"))}{one(r, "periods")}</p>')
    how = [r[k] for k in ("script", "placement_colour") if has(r, k)]
    if how:
        ids = [i for k in ("script", "placement_colour") if has(r, k) for i in pf(r, k)]
        facts.append(f'<p><strong>How it is written:</strong> {e(w(" ".join(how)))}{refs(ids)}{one(r, "script") if has(r, "script") else one(r, "placement_colour")}</p>')
    if has(r, "wares"):
        facts.append(f'<p><strong>Found on:</strong> {e(w(r["wares"]))}{refs(pf(r, "wares"))}{one(r, "wares")}</p>')
    if has(r, "later_copies_note") and not re.match(r"(none|no source)", r["later_copies_note"].lower()):
        facts.append(f'<p><strong>Later copies:</strong> {e(w(r["later_copies_note"]))}{refs(pf(r, "later_copies_note"))}{one(r, "later_copies_note")}</p>')
    return (f'<section class="mk hall" id="{anchor(r)}" data-hall data-kind="{e(r.get("kind", ""))}" data-keys="{e(keys)}">'
            f'<div class="mk__text"><h3><span lang="zh-Hant" class="hall__chars">{r["chars"]}</span></h3><p class="hall__pinyin">{e(r["pinyin"])}</p>'
            f'<p class="mk__dates">{e(w(clean(r.get("meaning"))))}</p>{"".join(facts)}</div>'
            f'{("<div class=" + chr(34) + "mk__pics" + chr(34) + ">" + pics + "</div>") if pics else ""}</section>')


def hub():
    refs = HallRefs()
    groups = []
    strong = [r for r in ROWS if len(r.get("sources", [])) >= 2]
    weak = [r for r in ROWS if len(r.get("sources", [])) < 2]
    # A fact with no source recorded is not shown (has()); the meaning is a translation of the characters.
    for k in ORDER:
        rows = [r for r in strong if r.get("kind") == k]
        if rows:
            groups.append(f'<h2 id="{k}">{KIND[k]}</h2>\n' + "\n".join(card(r, refs) for r in rows))
    if weak:
        groups.append('<h2 id="one-source">Recorded in one source only</h2>\n<p>These marks are recorded, but only one of the sources read gives them, so what is said here rests on that source alone.</p>\n' + "\n".join(card(r, refs) for r in weak))
    cav = "".join(f"<li>{e(w(c['text']))}{refs(c.get('sources', []))}</li>" for c in T.get("caveats", []))
    path = HUB
    title = "Chinese Hall Marks: Palace, Studio and Hall Marks on Porcelain | Heirloom"
    desc = f"{len(ROWS)} Chinese hall and studio marks (堂名款), from the Ming to the Republic: whose hall each was, the reigns it appears on, and the later copies, with sources in English and Chinese."
    h1 = "Chinese hall marks"
    buttons = "".join(f'<button type="button" data-hall-kind="{k}" aria-pressed="false">{KIND[k]}</button>' for k in ORDER if any(r.get("kind") == k for r in ROWS))
    body = f"""      <p class="guide__lede">Instead of a reign, some Chinese porcelain is marked with the name of a hall, a studio or a palace building: 慎德堂製, “made for the Hall of Cautious Virtue.” Here are {len(ROWS)} of them, whose each was, and the wares they appear on.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A hall mark names the hall or studio an item was made for, or claims to be. Emperors, empresses, princes, officials and scholars all had them, and so did Republic-period presidents and Jingdezhen painters. Like reign marks, they were copied, so a hall mark names what it claims and does not by itself date the item. Most hall marks end in 堂 (hall), 齋 (studio), 宮 or 殿 (palace hall), 書屋 or 山房 (study); the last character, 製, means “made.”</p>
      </div>
      <h2 id="finder">Find a hall mark</h2>
      <div class="finder" id="hall-finder">
        <div class="finder__row">
          <label class="grow">Characters, pinyin or meaning<input id="hall-q" type="search" placeholder="慎德堂, Shende tang or virtue" autocomplete="off"></label>
        </div>
        <div class="cr-dyn" role="group" aria-label="Whose hall" style="margin-top:12px">{buttons}</div>
        <div class="finder__results" id="hall-results" aria-live="polite"><p class="finder__hint">Every mark is listed below. Type any part of it, or pick a group.</p></div>
      </div>
{chr(10).join(groups)}
      <h2 id="careful">Before you rely on a hall mark</h2>
      <ul>{cav}</ul>
      <p class="note">Heirloom never decides whether an item is genuine or made for the hall its mark names. A specialist who can handle it is the one to ask. For reign marks, see <a href="{REIGN_HUB}">Chinese reign marks</a>.</p>
      <h2 id="sources">Sources</h2>
      {refs.html()}
{cta("Photograph the base. The Advisor reads the characters, names the hall the mark claims, and keeps the reading with the photo it came from.")}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": "Chinese hall marks"}})]
    kw = section_page("china", path)
    import p_chinese
    kw["side"] = p_chinese.side(path)
    return path, page(path, title, desc, h1, body, graph, mid=("/marks/chinese/", "Chinese marks"), crumb_name="Hall marks",
                      extra_head=font_head(wanted_chars(body + kw["top"] + seal_chars())) + "\n  " + SEC_CSS,
                      extra_body='<script src="/marks/marks.js" defer></script>\n  <script>window.MARKS_TOOL = "halls";</script>\n  ' + SEC_JS, **kw)


def build():
    return [hub()] if ROWS else []


CHILDREN = []  # reached through the Chinese marks section home
