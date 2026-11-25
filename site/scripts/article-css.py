"""Build site/src/styles/article.css: the generated pages' article look (their
guide.css, marks/marks.css and styles.css), scoped to .guide, for the templates
that replace those pages. A rule the old pages had without .guide is scoped
with :where(.guide), so its specificity, and the old cascade, hold.

Run from the website repo:  python3 site/scripts/article-css.py
"""
import re

MARKS_CLASSES = ['.sigs', '.sig', '.sigs--wide', '.sigs--one', '.sigs--two', '.sig__img', '.sig__who', '.sig__life', '.sig__reads', '.sig__credit',
                 '.sources', '.sources--num', '.pro-note', '.mks', '.mk', '.mk__img', '.mk__img--none', '.mk__years', '.mk__kind', '.mk__credit',
                 '.mk--photo', '.mk--facsimile', '.mk--rendering', '.mk--none', '.mkd', '.refs', '.rules', '.table--two',
                 # The lookups on the date-code and serial-number pages (marks/marks.js) and what they write.
                 '.finder', '.finder__row', '.finder__hint', '.finder__results', '.grow', '.check', '.hits', '.big', '.alike',
                 '.dl', '.dl--block', '.dl--court_hand', '.dl--gothic', '.dl--italic', '.dl--script', '.dli', '.dli--drawing',
                 '.dlg', '.dlc', '.dlc--flag', '.dlc__year', '.dlc__note', '.cycle', '.cycle__kind', '.cycle__photo',
                 '.cyphers', '.cypher', '.cypher-cell', '.cypher-none', '.cypher-note', '.stamps', '.stamps--book', '.stamps--photo',
                 '.stamps__row', '.stamps__caption', '.stamps__credit', '.stamp', '.stamp--wide', '.photos', '.photo', '.one-src']
STYLES_CLASSES = ['.btn', '.btn--outline', '.store-badge', '.store-badge__art']


def rules(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        pre, depth, k = css[i:j].strip(), 1, j + 1
        while k < n and depth:
            depth += {'{': 1, '}': -1}.get(css[k], 0)
            k += 1
        body = css[j + 1:k - 1]
        out.append((pre, None, rules(body)) if pre.startswith('@media') else (pre, body.strip(), None))
        i = k
    return out


def want(sel, keys):
    # A class anywhere in the selector, also joined to an element (table.table--two).
    return any(re.search(re.escape(k) + r'(?![\w-])', sel) for k in keys)


def scope(sel):
    return ', '.join(s.strip() if s.strip().startswith('.guide') else ':where(.guide) ' + s.strip() for s in sel.split(','))


def emit(rs, keys, everything=False):
    out = []
    for pre, body, inner in rs:
        if inner is not None:
            sub = emit(inner, keys, everything)
            if sub:
                out.append(f'{pre} {{\n' + '\n'.join('  ' + l for l in sub) + '\n}')
        elif everything or want(pre, keys):
            out.append(f'{scope(pre)} {{ {" ".join(body.split())} }}')
    return out


HEAD = """/* The generated pages' article look, carried onto the templates that replace
   them. Built by site/scripts/article-css.py from the old guide.css,
   marks/marks.css and styles.css (their rules for an article, every one
   scoped to .guide; a rule they had without .guide is scoped with
   :where(.guide), so it keeps its specificity and the old cascade holds),
   with the bridge the redesign gives the old pages (site/src/styles/shell.css):
   the old variables pointed at the new fonts and colors. Rebuild it rather
   than editing it. */
.guide {
  --color-primary: var(--accent); --color-primary-dark: var(--accent-ink); --color-primary-light: var(--accent);
  --color-bg: var(--paper); --color-surface: var(--paper); --color-surface-alt: var(--paper-2);
  --color-text: var(--ink); --color-text-secondary: var(--ink-2); --color-text-muted: var(--ink-3); --color-border: var(--rule);
  --font-sans: var(--text); --font-serif: var(--display);
  --radius-sm: 4px; --radius-md: 6px; --radius-lg: 10px; --radius-xl: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06); --shadow-md: 0 4px 16px rgba(0,0,0,0.08); --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --color-dark: #0f0f0f;
  /* The old pages' fixed text and link colors, which the dark theme they never had needs to change. */
  --guide-text: #2b2b2b; --guide-link: #C23610;
  font-family: var(--font-sans); font-size: 16px; line-height: 1.6; color: var(--color-text);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) .guide { --guide-text: var(--ink); --guide-link: var(--accent-ink); --color-dark: #26272b; } }
:root[data-theme='dark'] .guide { --guide-text: var(--ink); --guide-link: var(--accent-ink); --color-dark: #26272b; }
/* styles.css begins with a reset every generated page relies on. */
:where(.guide) *, :where(.guide) *::before, :where(.guide) *::after { margin: 0; padding: 0; box-sizing: border-box; }
/* What the site's global.css would otherwise add to these headings and links. */
.guide h1, .guide h2, .guide h3 { font-stretch: 100%; text-wrap: wrap; letter-spacing: normal; }
.guide h3 { font-family: var(--font-sans); font-weight: 700; letter-spacing: normal; line-height: 1.6; }
.guide a { text-decoration: none; }
/* global.css's .btn sets a minimum height and a line height of 1; the old .btn set neither. */
:where(.guide) .btn { min-height: 0; line-height: inherit; }
"""
TAIL = """
/* The redesign's header sits in the flow, not fixed (shell.css: html.legacy .guide). */
.guide { padding-top: 52px; }
@media (max-width: 600px) { .guide { padding-top: 36px; } }
"""
G, M, S = (open(f, encoding='utf8').read() for f in ('guide.css', 'marks/marks.css', 'styles.css'))
parts = ['/* guide.css */', *emit(rules(G), [], everything=True), '/* marks/marks.css */', *emit(rules(M), MARKS_CLASSES), '/* styles.css */', *emit(rules(S), STYLES_CLASSES)]
css = HEAD + '\n'.join(parts) + '\n' + TAIL
css = css.replace('color: #2b2b2b;', 'color: var(--guide-text);').replace('color: #C23610;', 'color: var(--guide-link);')
open('site/src/styles/article.css', 'w').write(css)
print(len(parts), 'rules')
