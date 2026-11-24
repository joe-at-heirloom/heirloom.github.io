"""Sections of the marks reference: each has a home, its own navigation bar
and a theme drawn from its own tradition.

A page joins a section by passing `**section_page("china", "/marks/chinese-hall-marks")`
to shell.page(): that adds the section bar above the article, the section's
stylesheet, and data-section on <main>, which the theme keys on.

The themes live in /marks/sections.css: shared structure first (bar, rail,
transitions), then one block per section ([data-section="china"] …).
"""
from html import escape as e

SECTIONS = {
    "china": {
        "name": "Chinese marks",
        "seal": "款識",           # the section's mark in the bar: kuanshi, "marks and inscriptions"
        "seal_lang": "zh-Hant",
        "home": "/marks/chinese/",
        "tabs": [
            ("/marks/chinese/", "Overview"),
            ("/marks/chinese-reign-marks", "Reign marks"),
            ("/marks/chinese-hall-marks", "Hall marks"),
            ("/marks/chinese/painters/", "Painters and collectors"),
        ],
        # Pages that belong to a tab without being its URL (the reign pages sit under Reign marks).
        "tab_of": lambda path: "/marks/chinese/painters/" if path.startswith("/marks/chinese/painters/") else "/marks/chinese-reign-marks" if path.endswith("-mark") else None,
    },
}

CSS = '<link rel="stylesheet" href="/marks/sections.css">'
JS = '<script src="/marks/sections.js" defer></script>'


def bar(key, path):
    s = SECTIONS[key]
    current = path if any(p == path for p, _ in s["tabs"]) else (s["tab_of"](path) if s.get("tab_of") else None)
    tabs = "".join(
        f'<li><a href="{p}"{" aria-current=" + chr(34) + "page" + chr(34) if p == current else ""}>{e(label)}</a></li>'
        for p, label in s["tabs"])
    seal = f'<span class="sec-seal" lang="{s["seal_lang"]}" aria-hidden="true">{s["seal"]}</span>' if s.get("seal") else ""
    return f"""    <nav class="sec-bar" aria-label="{e(s['name'])}">
      <div class="sec-bar__inner">
        <a class="sec-bar__home" href="{s['home']}">{seal}<span class="sec-bar__name">{e(s['name'])}</span></a>
        <ul class="sec-bar__tabs">{tabs}</ul>
        <a class="sec-bar__all" href="/marks/">All marks</a>
        <button class="sec-bar__menu btn btn--outline" type="button" aria-controls="ref-side" aria-expanded="false">Contents</button>
      </div>
    </nav>"""


def section_page(key, path, extra_top=""):
    """The keyword arguments shell.page() takes for a page in this section."""
    return {
        "top": bar(key, path) + ("\n" + extra_top if extra_top else ""),
        "main_attrs": f'data-section="{key}"',
    }


def seal_chars():
    """Characters every section bar uses, for the subset font request."""
    return "".join(s.get("seal", "") for s in SECTIONS.values())
