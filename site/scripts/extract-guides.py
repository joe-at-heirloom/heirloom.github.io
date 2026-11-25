"""One-time move of the editorial mark pages (p_plate.py, p_world.py,
p_basics.py, p_silver.py) onto the guide template.

For each page it keeps what was written for it, word for word, in
site/src/content/guides/<slug>.json: the page's own blocks of HTML, and in
between them each grid of mark cards as the list of reference-collection
records it shows (with the caption a card had when it wasn't the record's
name), so the template draws the cards from the collection. Also kept: the
page's title, description, its own structured data (the layout adds the
site's), and the "More from Heirloom" cards after the article.

Run once from the website repo:  python3 site/scripts/extract-guides.py
"""
import html
import json
import re

PAGES = ['1847-rogers-bros', 'wm-rogers', 'holmes-and-edwards', 'community-plate-oneida', 'international-silver-co', 'russian-silver-marks',
         'french-silver-marks', 'christofle-marks', 'gorham-silver-marks', 'mexican-silver-marks', 'german-silver-marks', 'silver-purity-marks',
         'is-it-real-silver', 'coin-silver', 'german-silver', 'britannia-silver', 'gold-karat-marks', '/silver-hallmarks']
coll = json.load(open('site/src/data/generated/collection.json'))
recs = {r['id']: r for r in coll['records']}
by_file = {i['file']: i['id'] for i in coll['images']}
by_name = {}
for r in coll['records']:
    by_name.setdefault(html.unescape(r['name']), []).append(r)


def balanced_div(s, start):
    """End index (exclusive) of the <div> that opens at start."""
    depth, i = 0, start
    while True:
        o, c = s.find('<div', i), s.find('</div>', i)
        if o != -1 and o < c:
            depth, i = depth + 1, o + 4
        else:
            depth, i = depth - 1, c + 6
            if depth == 0:
                return i


def card_ref(fig):
    name = html.unescape(re.search(r'<b>(.*?)</b>', fig, re.S).group(1))
    src = re.search(r'<img[^>]+src="([^"]+)"', fig)
    rid = None
    if src:
        f = src.group(1).lstrip('/')
        rid = by_file.get(f) or (re.sub(r'\.webp$', '', f.split('/')[-1]) if re.sub(r'\.webp$', '', f.split('/')[-1]) in recs else None)
    else:
        c = by_name.get(name, [])
        rid = c[0]['id'] if len(c) == 1 else None
    if not rid:
        raise SystemExit(f'no record for the card {name!r}')
    ref = {'id': rid}
    if html.unescape(recs[rid]['name']) != name:
        ref['caption'] = name
    return ref


for s in PAGES:
    path = s if s.startswith('/') else f'/marks/{s}'
    f = path.lstrip('/') + '.html'
    t = open(f, encoding='utf8').read()
    main = re.search(r'<main class="guide">(.*?)</main>', t, re.S).group(1)
    art = re.search(r'<article>(.*?)</article>', main, re.S)
    body, after = art.group(1), main[art.end():]
    blocks, i = [], 0
    while True:
        j = body.find('<div class="mks">', i)
        if j < 0:
            break
        k = balanced_div(body, j)
        if body[i:j].strip():
            blocks.append({'html': body[i:j]})
        blocks.append({'cards': [card_ref(fig) for fig in re.findall(r'<figure class="mk[^"]*">.*?</figure>', body[j:k], re.S)]})
        i = k
    if body[i:].strip():
        blocks.append({'html': body[i:]})
    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', t, re.S).group(1))
    graph = [n for n in ld.get('@graph', []) if n.get('@type') not in ('Organization', 'WebSite')]
    out = {
        'path': path,
        'title': html.unescape(re.search(r'<title>(.*?)</title>', t, re.S).group(1)),
        'description': html.unescape(re.search(r'<meta name="description" content="([^"]*)"', t).group(1)),
        'jsonld': graph, 'blocks': blocks, 'after': after.strip(),
    }
    slug = path.rsplit('/', 1)[-1]
    json.dump(out, open(f'site/src/content/guides/{slug}.json', 'w'), ensure_ascii=False, indent=1)
    print(f"{path:34} blocks {len(blocks):3}  card grids {sum(1 for b in blocks if 'cards' in b)}  cards {sum(len(b['cards']) for b in blocks if 'cards' in b)}  graph {[n.get('@type') for n in graph]}")
