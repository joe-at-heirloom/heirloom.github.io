"""Build the guide and marks pages: python3 scripts/pages/build.py [--check] [OUT]

Writes the static HTML for the guides (/home-inventory-app, /guides, …) and the
marks reference (/marks/…) into the site root, or OUT. The pages are plain HTML
once written; this script is how they are kept consistent and in step with the
app's mark tables (tables.py).

--check builds into a temporary folder and fails if any page differs from the
one in the site, which is how to tell that a hand edit or a table change is
waiting to be built.
"""
import sys, os, tempfile, filecmp
sys.path.insert(0, os.path.dirname(__file__))
from shell import *
import tables
import p_inventory, p_antique, p_checklist, p_silver, p_family, p_marks, p_pottery, p_ceramics

args = [a for a in sys.argv[1:] if not a.startswith("--")]
CHECK = "--check" in sys.argv
SITE_DIR = tables.SITE_ROOT
OUT = tempfile.mkdtemp(prefix="heirloom-pages-") if CHECK else (args[0] if args else SITE_DIR)

PATH = "/guides"
TITLE = "Guides: Home Inventory, Antiques & Heirlooms | Heirloom"
DESC = "Plain guides from Heirloom: making a home inventory for insurance, reading silver hallmarks, identifying antiques from photos, and documenting family heirlooms."
H1 = "Guides"
cards = "".join(
    f'<li><a class="card" href="{p}"><span class="card__title">{n}</span><span class="card__desc">{d}</span></a></li>'
    for p, n, d in GUIDES
)
BODY = f"""      <p class="guide__lede">How to know what you own: making a home inventory, reading the marks on old things, and keeping the stories that go with them.</p>
      <ul class="cards">{cards}</ul>
{APP_BOX}
"""
hub = page(PATH, TITLE, DESC, H1, BODY, [
    {"@type": "CollectionPage", "@id": SITE + PATH, "url": SITE + PATH, "name": TITLE, "description": DESC, "isPartOf": {"@id": SITE + "/#website"},
     "hasPart": [{"@type": "WebPage", "url": SITE + p, "name": n} for p, n, _ in GUIDES]},
], og_type="website", show_related=False)

pages = {
    "home-inventory-app.html": p_inventory.HTML,
    "antique-identifier-app.html": p_antique.HTML,
    "home-inventory-checklist.html": p_checklist.HTML,
    "silver-hallmarks.html": p_silver.HTML,
    "family-heirlooms.html": p_family.HTML,
    "guides.html": hub,
}
for name, html_ in pages.items():
    with open(os.path.join(OUT, name), "w") as f:
        f.write(html_)
with open(os.path.join(OUT, "home-inventory-template.csv"), "w", newline="") as f:
    f.write(p_checklist.CSV)
written = []
os.makedirs(os.path.join(OUT, "marks"), exist_ok=True)
for path, html_ in p_marks.build(p_pottery.CHILDREN + p_ceramics.CHILDREN) + p_pottery.build() + p_ceramics.build():
    rel = "marks/index.html" if path == "/marks/" else path.lstrip("/") + ".html"
    with open(os.path.join(OUT, rel), "w") as f:
        f.write(html_)
    written.append(rel)
written += list(pages) + ["home-inventory-template.csv"]
print(tables.describe())
if CHECK:
    stale = [w for w in written if not os.path.exists(os.path.join(SITE_DIR, w)) or not filecmp.cmp(os.path.join(OUT, w), os.path.join(SITE_DIR, w), shallow=False)]
    if stale:
        print("Out of date (run python3 scripts/pages/build.py):", ", ".join(stale))
        sys.exit(1)
    print(f"pages up to date: {len(written)} files match")
else:
    print(f"wrote {len(written)} files")
