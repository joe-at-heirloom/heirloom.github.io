"""The marks database (backend/src/data/mark-tables/marks/ in the app repo), for the marks pages.

Every mark on a page is shown from its database entry: one image of that mark alone (a photo,
a public-domain facsimile, or a drawing built from two sources), or, when there is none, its
description in words. Pages never place an image the database doesn't name.

    MARKS_DB     a folder of the database's JSON files instead of git
    MARKS_REF    the app branch or commit to read (default: the branch data/marks-db while it is
                 unmerged, else APP_REF)
"""
import html as H
import json
import os
import subprocess

import tables

PREFIX = "backend/src/data/mark-tables/marks"
_db = None

KIND_LABEL = {"photo": "Photo", "facsimile": "Book facsimile", "rendering": "Drawing"}


def _ref():
    ref = os.environ.get("MARKS_REF")
    if ref:
        return ref
    ok = subprocess.run(["git", "-C", tables.APP_REPO, "rev-parse", "--verify", "-q", "data/marks-db"], capture_output=True).returncode == 0
    return "data/marks-db" if ok else tables.APP_REF


def load():
    """{id: entry} across every group file."""
    global _db
    if _db is not None:
        return _db
    folder = os.environ.get("MARKS_DB")
    if folder:
        names = [n for n in os.listdir(folder) if n.endswith(".json")]
        read = lambda n: open(os.path.join(folder, n)).read()
    else:
        ref = _ref()
        names = [p.rsplit("/", 1)[-1] for p in tables._git("ls-tree", "--name-only", f"{ref}:{PREFIX}").split() if p.endswith(".json")]
        read = lambda n: tables._git("show", f"{ref}:{PREFIX}/{n}")
    _db = {}
    for n in sorted(names):
        if n in ("sources.json", "coverage.json"):
            continue
        for e in json.loads(read(n)).get("entries", []):
            _db[e["id"]] = e
    return _db


def entry(id_):
    e = load().get(id_)
    if e is None:
        raise KeyError(f"marks database has no entry {id_!r}")
    return e


def group(name):
    return [e for e in load().values() if e.get("group") == name]


def image(id_):
    """(src, alt, kind label, credit) for an entry with an image, else None."""
    e = entry(id_)
    v = e.get("visual", {})
    if v.get("status") not in KIND_LABEL or not v.get("file"):
        return None
    return "/" + v["file"], e.get("looks_like") or e["name"], KIND_LABEL[v["status"]], v.get("credit", "")


def years(e):
    a, b = e.get("date_from"), e.get("date_to")
    if a and b and a != b:
        return f"{a}–{b}"
    if a and not b:
        return f"from {a}"
    return str(a or "")


def card(id_, caption=None, show_years=True):
    """One mark: its image, name, years and credit; or, with no image, its description in words."""
    e = entry(id_)
    v = e.get("visual", {})
    name = H.escape(caption or e["name"])
    yr = f'<span class="mk__years">{H.escape(years(e))}</span>' if show_years and years(e) else ""
    img = image(id_)
    if img:
        src, alt, kind, credit = img
        return (f'<figure class="mk mk--{v["status"]}"><div class="mk__img"><img src="{src}" alt="{H.escape(alt)}" loading="lazy" decoding="async"></div>'
                f'<figcaption><b>{name}</b>{yr}<span class="mk__kind">{kind}</span><span class="mk__credit">{H.escape(credit)}</span></figcaption></figure>')
    why = "Shown only as a photograph, which we don't have yet." if v.get("photo_only") else "No image yet."
    return (f'<figure class="mk mk--none"><div class="mk__img mk__img--none"><p>{H.escape(e.get("looks_like") or "")}</p></div>'
            f'<figcaption><b>{name}</b>{yr}<span class="mk__kind">{why}</span></figcaption></figure>')


def grid(ids, captions=None):
    captions = captions or {}
    return '<div class="mks">' + "".join(card(i, captions.get(i)) for i in ids) + "</div>"


def letter(office, year, letter_):
    """The database image for a British date letter, or None."""
    id_ = f"{office.lower()}-{year}-{letter_.lower()}"
    if id_ not in load():
        return None
    return image(id_)
