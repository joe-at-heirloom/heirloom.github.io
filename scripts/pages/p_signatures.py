"""Artist signatures: how to find, read and look up the signature on a painting,
print or work of art glass, with real close-ups cut from open-access museum
photographs (scripts/pages/signatures.json; the originals and crop boxes are
kept in hallmark-sources/signatures/, outside the repo)."""
import json
import os

from shell import *
from p_marks import MID, cta, e

PATH = "/marks/artist-signatures"
HERE = os.path.dirname(__file__)
CSS = '<link rel="stylesheet" href="/marks/marks.css">'
CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"


def load():
    p = os.path.join(HERE, "signatures.json")
    if not os.path.exists(p):
        return []
    with open(p) as f:
        return json.load(f)["items"]


ITEMS = load()
KIND = {}
for it in ITEMS:
    KIND.setdefault(it["kind"], []).append(it)
PAINTERS = sorted([it for it in ITEMS if it["kind"] in ("painted", "signed_dated", "monogram") and it.get("gallery", True)],
                  key=lambda it: it["artist"].split()[-1])


def credit(it):
    return f'{e(it["museum"])}, <a href="{e(it["object_url"])}" rel="nofollow">{e(it["work"])}</a>' + (f' ({e(it["work_date"])})' if it.get("work_date") else "") + ", open access (CC0)"


def fig(it, cls="sig"):
    reads = f'<span class="sig__reads">Reads: &ldquo;{e(it["reads"])}&rdquo;' + (f', {e(it["position"])}' if it.get("position") else "") + "</span>"
    alt = f'{it["artist"]}\'s signature, reading "{it["reads"]}", on {it["work"]}'
    return (f'<figure class="{cls}"><div class="sig__img"><img src="{e(it["file"])}" alt="{e(alt)}" width="{it["w"]}" height="{it["h"]}" loading="lazy" decoding="async"></div>'
            f'<figcaption><span class="sig__who">{e(it["artist"])}' + (f' <span class="sig__life">{e(it["life"])}</span>' if it.get("life") else "") + f'</span>{reads}'
            f'<span class="sig__credit">{credit(it)}</span></figcaption></figure>')


def kind_fig(kind, caption):
    its = KIND.get(kind)
    if not its:
        return ""
    return f'<div class="sigs sigs--one">{fig(its[0])}</div><p class="note">{caption}</p>' if caption else f'<div class="sigs sigs--one">{fig(its[0])}</div>'


def by_slug(*slugs):
    its = [it for s in slugs for it in ITEMS if it["slug"] == s]
    if not its:
        return ""
    return f'<div class="sigs sigs--{"one" if len(its) == 1 else "two"}">' + "".join(fig(it) for it in its) + "</div>"


def pair(kind_a, kind_b):
    a, b = KIND.get(kind_a), KIND.get(kind_b)
    if not (a and b):
        return kind_fig(kind_a, "") or kind_fig(kind_b, "")
    return f'<div class="sigs sigs--two">{fig(a[0])}{fig(b[0])}</div>'


def build():
    title = "Artist Signatures: How to Find, Read and Identify One | Heirloom"
    desc = "Where artists sign, how to read a signature you can't make out, and where to look it up: real close-ups of painters' signatures, monograms, estate stamps, print signatures and seals."
    h1 = "Artist signatures: how to find, read and identify one"

    gallery = "".join(fig(it) for it in PAINTERS)
    gallery_html = f"""      <h2 id="examples">Signatures of well-known painters</h2>
      <p>Close-ups cut from museum photographs of the paintings, so you see the paint, the brush and the size of the letters, not a tracing. Each one links to the museum's own record of the work.</p>
      <div class="sigs">{gallery}</div>""" if PAINTERS else ""

    body = f"""      <p class="guide__lede">A signature is usually the first clue to who made a painting, print or work of art glass. Here is where to find one, how to read it when the letters run together, and where to look the name up, with close-ups of real signatures from museum collections.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>Most painters sign in a lower corner of the front, often with a year. Look also on the back, the stretcher and the frame. Write down only the letters you are sure of, then search signature databases and auction records with them. A signature tells you whose name is on a work; it does not prove who made it.</p>
      </div>

      <h2 id="where">Where to look</h2>
      <ul class="rules">
        <li><strong>The lower right corner of the front.</strong><em>The most common place by far, then the lower left. Signatures are often painted in a color close to the background, so tilt the work under a strong light from one side.</em></li>
        <li><strong>Along the edges and in dark areas.</strong><em>Some painters signed in a shadow, along a tree trunk, or on something in the picture. A frame's rebate (the lip over the edge) can hide a signature that runs to the edge.</em></li>
        <li><strong>The back of the canvas, board or stretcher.</strong><em>Titles, addresses, inscriptions, exhibition labels and gallery stamps are often here, and sometimes a second signature.</em></li>
        <li><strong>The margin of a print.</strong><em>A hand signature on an etching, lithograph or screenprint is usually in pencil just below the image, with an edition number on the left.</em></li>
        <li><strong>The base or side of glass and pottery.</strong><em>Art glass is often signed in the glass itself (cameo, etched or engraved); studio pottery carries an incised or painted name or monogram on the base.</em></li>
      </ul>

      <h2 id="kinds">The kinds of signature you will see</h2>
      <h3>Signed, and signed and dated</h3>
      <p>Most signatures are a surname or a full name. Many add the year, often as two digits (&ldquo;84&rdquo; for 1884). The date is the year the artist wrote, which is usually, but not always, the year the work was finished.</p>
      {kind_fig("signed_dated", "")}
      <h3>Monograms</h3>
      <p>Some artists signed with initials worked into a single design, or with a symbol. They are hard to search by name, so monogram dictionaries list them by shape.</p>
      {by_slug("durer-monogram", "whistler-butterfly")}
      <h3>Estate and studio stamps</h3>
      <p>Works left in an artist's studio at death were often stamped with the name before they were sold, sometimes in red. A stamped name is not a signature: it says the work came from the studio.</p>
      {kind_fig("estate_stamp", "")}
      <h3>Prints: signed in pencil, or signed in the plate</h3>
      <p>A pencil signature in the margin was written by hand on that sheet. A signature inside the image was drawn on the plate, stone or block and printed with everything else, so every impression has it. Under a magnifier, a signature made of tiny dots in a grid is printed, and the sheet is a photomechanical reproduction.</p>
      {pair("pencil_print", "plate_signature")}
      <h3>Japanese prints: signature and seals</h3>
      <p>On Japanese woodblock prints the artist's name is written in a cartouche or beside the image, often ending in <em>ga</em> (&ldquo;drawn by&rdquo;), with the publisher's and censors' seals nearby. The seals help date the print.</p>
      {kind_fig("seal", "")}
      <h3>Glass and pottery</h3>
      <p>Art glass makers such as Gallé and Daum signed in the glass. On art pottery the factory mark and the decorator's initials or monogram are usually separate marks on the base.</p>
      {pair("glass", "pottery")}

{gallery_html}

      <h2 id="read">How to read a signature you can't make out</h2>
      <ol>
        <li><strong>Photograph it close and straight on,</strong> in daylight or with one strong light from the side. Take a second photo with the light from the other side.</li>
        <li><strong>Write down only the letters you are sure of,</strong> and mark the doubtful ones: <code>J. [R or B]ail[e]y</code>. Capitals are easier than lower-case letters, so start with them.</li>
        <li><strong>Note everything around it:</strong> a date, a place name, &ldquo;fecit&rdquo; or &ldquo;pinxit&rdquo; (made it, painted it), or &ldquo;after&rdquo; or &ldquo;d'après&rdquo;, which means a copy after another artist's work.</li>
        <li><strong>Look at the back</strong> for a typed or written name, a gallery or framer's label, or an exhibition number. Framers' labels often give a town, which narrows a search.</li>
        <li><strong>Search with the letters you have.</strong> Searchable signature collections let you browse by first letter, by monogram and by illegible signatures. Auction-record sites index tens of thousands of signed works with photos.</li>
      </ol>

      <h2 id="lookup">Where to look a signature up</h2>
      <!--copy-check:skip--><ul class="sources">
        <li>Artists' Signatures (artistssignatures.com): a large browsable collection, with sections for monograms and illegible signatures.</li>
        <li>FindArtInfo's signatures and monograms index (findartinfo.com/signatures).</li>
        <li>B&eacute;n&eacute;zit Dictionary of Artists: the standard biographical dictionary, with reproduced signatures for many entries. Most public and university libraries give access.</li>
        <li>Who Was Who in American Art (Falk) and Mallett's Index of Artists, for American and regional painters.</li>
        <li>Auction-record databases (AskART, the Blouin Art Sales Index, and the past-sale archives of the major auction houses), which show signed works with photos.</li>
        <li>University library art-identification guides, such as the University of North Texas guide to identifying fine and decorative art.</li>
      </ul><!--/copy-check:skip-->
      <p>Most signed paintings in homes are by regional, amateur or student painters whose names never reached a dictionary. If a search finds nothing, that is normal; a local historical society, an art school's records or a regional auction house may know the name.</p>

      <h2 id="caution">What a signature can't tell you</h2>
      <p>A signature is the easiest part of a work to copy or add. Signatures were added to unsigned works, copied onto reproductions and printed onto posters; decorators signed for studios; and students signed in their teachers' manner. A signature that matches a reference photo is a lead, not an answer. Whether a work is by the artist whose name it carries is a question for a specialist in that artist, and for the catalogue raisonn&eacute; where one exists. Heirloom never decides whether a work is genuine.</p>

{cta("Photograph the signature close up, and the back of the work. The Advisor writes down what it can read, letter by letter, marks the letters it can't, and keeps the reading on the item's record beside the photo it came from. It never says whether a signature is genuine.")}
      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
      <p class="note">Photographs: cut from the open-access (CC0) images of the museums named under each close-up, without retouching.</p>
"""
    images = [{"@type": "ImageObject", "contentUrl": SITE + it["file"], "caption": f'{it["artist"]}: signature reading "{it["reads"]}"',
               "creditText": it["museum"], "license": CC0, "acquireLicensePage": it["object_url"]} for it in ITEMS]
    graph = [article_ld(PATH, h1, desc, extra={"about": {"@type": "Thing", "name": "Artist signatures"}, **({"image": images} if images else {})}),
             faq_ld(PATH, FAQS)]
    return PATH, page(PATH, title, desc, h1, body, graph, mid=MID, crumb_name="Artist signatures", extra_head=CSS)


FAQS = [
    ("How do I identify an artist's signature?",
     "<p>Photograph it close up in raking light, write down the letters you are sure of, and note any date or place beside it. Then search signature collections and auction records with those letters, and check the back of the work for labels that name the artist or a town.</p>"),
    ("Can I identify an artist signature from a photo?",
     "<p>Often, if the photo is sharp and close. Reading the letters is the hard part; once you have most of a name, signature collections and auction records can usually match it. A photo can't show whether the signature is genuine.</p>"),
    ("Where do artists usually sign a painting?",
     "<p>In a lower corner of the front, most often the lower right, sometimes with a year. Some sign on the back or the stretcher instead, or as well.</p>"),
    ("Does a signature make a painting more valuable?",
     "<p>A signature by a known artist matters, but only if the work is by that artist. An unsigned work by a known artist can be worth more than a signed one by an unknown painter, and many good paintings were never signed.</p>"),
    ("What does a pencil signature on a print mean?",
     "<p>That the artist signed that sheet by hand, usually with an edition number such as 12/50. A signature inside the image was printed with it, and a signature made of tiny dots is a photomechanical reproduction.</p>"),
    ("What does &ldquo;after&rdquo; mean next to a signature?",
     "<p>That the work is a copy after another artist's picture. The name that follows is the artist of the original, not of the copy.</p>"),
]

CHILD = (PATH, "Artist signatures", "Where artists sign, how to read a signature, and where to look it up, with real close-ups.")
