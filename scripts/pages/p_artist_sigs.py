"""One page per artist: their signature across their working life, from real
close-ups cut from open-licence photographs (scripts/pages/signatures/<slug>.json;
originals and crop boxes in hallmark-sources/signatures/<slug>/, outside the repo)."""
import glob
import json
import os
from collections import OrderedDict

from shell import *
from p_marks import MID, cta, e

HERE = os.path.dirname(__file__)
CSS = '<link rel="stylesheet" href="/marks/marks.css">'
CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"
PD = "https://creativecommons.org/publicdomain/mark/1.0/"
MIN_ITEMS = 3  # fewer than this and the artist gets no page of their own


US = [("watercolours", "watercolors"), ("watercolour", "watercolor"), ("colours", "colors"), ("colour", "color"), ("grey", "gray"), ("Grey", "Gray"),
      ("centre", "center"), ("catalogued", "cataloged"), ("honour", "honor"), ("favourite", "favorite")]


def us(s):
    """American spelling for our own words (never for what a signature reads)."""
    for a, b in US:
        s = s.replace(a, b)
    return s


def load_all():
    out = []
    for p in sorted(glob.glob(os.path.join(HERE, "signatures", "*.json"))):
        with open(p) as f:
            d = json.load(f)
        for f in d.get("facts", []):
            f["text"] = us(f["text"])
        for it in d.get("items", []):
            for k in ("note", "medium", "form", "position"):
                if it.get(k):
                    it[k] = us(it[k])
        d["items"] = sorted(d.get("items", []), key=lambda it: (it["year"], it.get("work", "")))
        # A page shows a signature over time: at least MIN_ITEMS, from at least two years.
        if len(d["items"]) >= MIN_ITEMS and len({it["year"] for it in d["items"]}) >= 2:
            out.append(d)
    return out


ARTISTS = load_all()


def path_for(slug):
    return f"/marks/{slug}-signature"


def possessive(name):
    return name + "'s"  # Chicago style, also after s: Degas's


def licence_text(it):
    lic = it.get("licence", "")
    return "open access (CC0)" if "CC0" in lic else "public domain"


def fig(it):
    when = e(it.get("year_label") or it["year"])
    age = f' <span class="sig__life">aged about {it["age"]}</span>' if it.get("age") else ""
    reads = f'<span class="sig__reads">Reads: &ldquo;{e(it["reads"])}&rdquo;' + (f', {e(it["position"])}' if it.get("position") else "") + "</span>"
    form = f'<span class="sig__reads">{e(it["form"][:1].upper() + it["form"][1:])}' + (f' &middot; {e(it["medium"])}' if it.get("medium") else "") + "</span>" if it.get("form") else ""
    note = f'<span class="sig__reads">{e(it["note"])}</span>' if it.get("note") else ""
    # A citation (museum names keep their own spelling: Centre Pompidou), so the copy check skips it.
    credit = (f'<!--copy-check:skip--><span class="sig__credit"><a href="{e(it["object_url"])}" rel="nofollow">{e(it["work"])}</a>, {e(it["museum"])}, {licence_text(it)}</span><!--/copy-check:skip-->')
    alt = f'Signature reading "{it["reads"]}" on {it["work"]} ({it.get("year_label") or it["year"]})'
    return (f'<figure class="sig"><div class="sig__img"><img src="{e(it["file"])}" alt="{e(alt)}" width="{it["w"]}" height="{it["h"]}" loading="lazy" decoding="async"></div>'
            f'<figcaption><span class="sig__who">{when}{age}</span>{reads}{form}{note}{credit}</figcaption></figure>')


def by_decade(items):
    groups = OrderedDict()
    for it in items:
        groups.setdefault(it["year"] // 10 * 10, []).append(it)
    return groups


def artist_page(a):
    name, slug, items = a["artist"], a["slug"], a["items"]
    path = path_for(slug)
    y0, y1 = items[0]["year"], items[-1]["year"]
    span = f"{y0}–{y1}" if y0 != y1 else str(y0)
    life = f'{a["born"]}–{a["died"]}'
    forms = sorted({it["form"] for it in items if it.get("form")})
    title = f"{possessive(name)} Signature: {len(items)} Real Examples, {span} | Heirloom"
    desc = (f"{len(items)} close-ups of {possessive(name)} signature from works dated {span}, cut from museum photographs, "
            f"with how the signature changed and what each one reads.")
    h1 = f"{possessive(name)} signature, {y0} to {y1}" if y0 != y1 else f"{possessive(name)} signature"

    facts = a.get("facts", [])
    fact_html = "".join(f"<li>{e(f['text'])}</li>" for f in facts[1:])
    short = facts[0]["text"] if facts else f"{name} signed in more than one way over a working life."
    decades = "".join(
        f'<h3 id="d{d}">{d}s</h3><div class="sigs sigs--wide">' + "".join(fig(it) for it in its) + "</div>"
        for d, its in by_decade(items).items()
    )
    museums = sorted({it["museum"] for it in items})
    src = "".join(f'<li>{e(f.get("source_name") or f["source"])} (<a href="{e(f["source"])}" rel="nofollow">source</a>)</li>' for f in facts)
    src += "".join(f"<li>{e(m)}: photographs of the works, open access or public domain</li>" for m in museums)

    faqs = [
        (f"How did {name} sign paintings?", f"<p>{e(short)}</p>"),
        (f"Did {name} always sign the same way?",
         f"<p>No. The {len(items)} examples on this page, from {span}, show " + (e(", ".join(forms[:4])) if forms else "several forms") + ". Signatures change with age, medium and the size of the work.</p>"),
        (f"Does a matching signature mean a work is by {name}?",
         f"<p>No. A signature is the easiest part of a work to copy or add. Whether a work is by {e(name)} is a question for a specialist in the artist's work and, where one exists, the catalogue raisonn&eacute;.</p>"),
    ]

    body = f"""      <p class="guide__lede">{len(items)} close-ups of {e(possessive(name))} signature ({e(a.get("nationality", ""))}, {life}), from works dated {span}, in date order. Each is cut from a museum photograph of the work and links to the museum's record.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{e(short)}</p>
      </div>
      <h2 id="how">How {e(name)} signed</h2>
      <ul>{fact_html}</ul>
      <h2 id="timeline">The signature over the years</h2>
      <p class="note">Ages are approximate: the year of the work minus the year of birth.</p>
{decades}
      <h2 id="caution">What a signature can't tell you</h2>
      <p>Signatures were copied, added to unsigned works and printed onto reproductions. A signature that looks like these is a lead, not an answer, and Heirloom never decides whether a work is genuine. For how to read a signature and where to look one up, see <a href="/marks/artist-signatures">artist signatures</a>.</p>
{cta("Photograph the signature close up, and the back of the work. The Advisor writes down what it can read, letter by letter, marks the letters it can't, and keeps the reading on the item's record beside the photo it came from. It never says whether a signature is genuine.")}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
      <h2 id="sources">Sources</h2>
      <!--copy-check:skip--><ul class="sources">{src}</ul><!--/copy-check:skip-->
"""
    images = [{"@type": "ImageObject", "contentUrl": SITE + it["file"], "caption": f'{possessive(name)} signature, {it.get("year_label") or it["year"]}: "{it["reads"]}"',
               "creditText": it["museum"], "license": CC0 if "CC0" in it.get("licence", "") else PD, "acquireLicensePage": it["object_url"]} for it in items]
    person = {"@type": "Person", "name": name, "birthDate": str(a["born"]), "deathDate": str(a["died"])}
    graph = [article_ld(path, h1, desc, extra={"about": person, "image": images}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name=f"{name} signature", extra_head=CSS)


def build():
    return [artist_page(a) for a in ARTISTS]


def index_cards():
    """Cards for the artist-signatures page and the Marks hub."""
    return [(path_for(a["slug"]), f'{a["artist"]}', f'{len(a["items"])} signatures, {a["items"][0]["year"]}–{a["items"][-1]["year"]}') for a in ARTISTS]


def path_by_artist():
    return {a["artist"]: path_for(a["slug"]) for a in ARTISTS}
