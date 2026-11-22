"""Pottery date-code pages, from the app's pottery.json (the same table the
Advisor dates Wedgwood, Minton, Royal Worcester, Rookwood and Sèvres with)."""
import json

from shell import *
import tables
from p_marks import MID, cta, sources_list, soften, tool_script, e

POT = tables.load("pottery")
SYS = POT["systems"]
CSS = '<link rel="stylesheet" href="/marks/marks.css">'


# ── Pictures of the marks ─────────────────────────────────────────────────────
# Every picture is a real photograph under an open licence or a crop from a
# public-domain book, credited where it appears. Sources and the checks against
# the table: scripts/pages/pottery-sources.md.

COMMONS = "https://commons.wikimedia.org/wiki/File:"
LIC = {
    "met": '<a href="https://www.metmuseum.org/about-the-met/policies-and-documents/open-access" rel="nofollow">The Metropolitan Museum of Art, Open Access</a> (public domain)',
    "cc0": '<a href="https://creativecommons.org/publicdomain/zero/1.0/" rel="nofollow">CC0</a>',
}
BOOK = {
    "litchfield": ('Frederick Litchfield, <cite>Pottery and Porcelain: A Guide to Collectors</cite> (1912), p. 289', "https://archive.org/details/potteryporcelain00litc/page/289"),
    "burton": ('William Burton and R. L. Hobson, <cite>Handbook of Marks on Pottery and Porcelain</cite> (1909), p. 77', "https://archive.org/details/handbookofmarkso00burt/page/77"),
    "barber": ('Edwin AtLee Barber, <cite>Marks of American Potters</cite> (1904), p. 120', "https://archive.org/details/marksamericanpo00barbgoog/page/n128"),
}


def commons(file, text):
    return f'<a href="{COMMONS}{e(file.replace(" ", "_"))}" rel="nofollow">{text}</a>'


def met_credit(*files):
    links = ", ".join(commons(f, n) for n, f in files)
    return f"Photograph{'s' if len(files) > 1 else ''}: {LIC['met']}, via Wikimedia Commons ({links}), cropped by Heirloom."


def book_credit(key, what="Printed marks"):
    title, url = BOOK[key]
    return f'{what}: {title}, public domain; <a href="{url}" rel="nofollow">scan at the Internet Archive</a>, cropped by Heirloom.'


def mark_photos(items, caption, credit, book=False):
    """A row of mark pictures. items: (file stem, alt text, label under it[, "wide"])."""
    figs = "".join(
        f'<figure class="stamp{" stamp--wide" if it[3:] else ""}"><img src="/marks/img/{it[0]}.webp" alt="{e(it[1])}" loading="lazy" decoding="async"><figcaption>{it[2]}</figcaption></figure>'
        for it in items
    )
    kind = "stamps--book" if book else "stamps--photo"
    return f'<div class="stamps {kind}"><div class="stamps__row">{figs}</div><p class="stamps__caption">{caption} <span class="stamps__credit">{credit}</span></p></div>'


def cypher_img(stem, alt):
    return f'<img class="cypher" src="/marks/img/{stem}.webp" alt="{e(alt)}" loading="lazy" decoding="async">'


def caveat_list(cavs):
    return "<ul>" + "".join(f"<li>{e(soften(c))}</li>" for c in cavs) + "</ul>"


def inline(name, rows):
    return f"<script>window.{name} = {json.dumps(rows, separators=(',', ':'), ensure_ascii=False)};</script>"


def build_page(path, title, desc, h1, crumb, lede, answer, tool_html, sections, system, faqs, cta_text, tool, data_script=""):
    t = SYS[system]
    body = f"""      <p class="guide__lede">{lede}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{answer}</p>
      </div>
{tool_html}
{sections}
      <h2 id="caveats">Read these before you rely on a year</h2>
      {caveat_list(POT["caveats"][:2] + t.get("caveats", []))}
      <h2 id="sources">Sources</h2>
      {sources_list(t)}
{cta(cta_text)}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
{data_script}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": crumb}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name=crumb, extra_head=CSS, extra_body=tool_script(tool))


# ── Wedgwood ──────────────────────────────────────────────────────────────────

def wedgwood():
    t = SYS["wedgwood_three_letter"]
    rows = t["rows"]
    cyc = {1: [], 2: [], 3: []}
    for r in rows:
        cyc[r["cycle"]].append(r)
    names = {1: "Cycle 1, 1860–1885 (first character a month letter)", 2: "Cycle 2, 1886–1906 (first character a month letter)", 3: "Cycle 3, 1907–1930 (first character 3, then 4 from 1924)"}
    tables = "".join(
        f'<section class="cycle"><h3>{names[c].split(" (")[0]}</h3><p class="cycle__kind">{e(names[c].split(" (")[1].rstrip(")"))}</p><ul class="dlg">'
        + "".join(f'<li class="dlc"><span class="dl">{e(r["letter"])}</span><span class="dlc__year">{r["year"]}</span></li>' for r in rs)
        + "</ul></section>"
        for c, rs in cyc.items()
    )
    months = "".join(f'<tr><th scope="row">{e(m["first_char"])}</th><td>{["January","February","March","April","May","June","July","August","September","October","November","December"][m["month"]-1]}</td><td>{e(m["years"])}</td></tr>' for m in t["first_char_month_codes"])
    tool = """      <h2 id="lookup">Decode a Wedgwood date code</h2>
      <div class="finder">
        <div class="finder__row">
          <label>The three characters <input id="wg-code" maxlength="5" autocomplete="off" placeholder="e.g. TOT or 3KC"></label>
          <label class="check"><input type="checkbox" id="wg-england"> ENGLAND is in the mark</label>
        </div>
        <div id="wg-results" class="finder__results" aria-live="polite"><p class="finder__hint">Type the three impressed characters next to WEDGWOOD, in order.</p></div>
      </div>"""
    photo = mark_photos(
        [("p-wedgwood-impressed", "The word WEDGWOOD impressed in cream-colored earthenware", "The impressed WEDGWOOD mark", "wide")],
        "The impressed WEDGWOOD mark on a cream-colored platter that the Met dates to about 1780, before the date codes began. On wares from 1860 to 1930 the three-letter code is impressed in the same way, in a row beside or below this word. No openly licensed photograph of a dated code has been found yet, so the letters below are set in type.",
        met_credit(("platter, SF2014.712.9", "Platter MET SF2014 712 9 mark.jpg")),
    )
    sections = f"""      <h2 id="read">How the code works</h2>
      {photo}
      <p>The code is three impressed characters in a row beside the impressed WEDGWOOD mark. The first is the month (from 1907, the figure 3; from 1924, 4), the second identifies the potter, and only the last is the year.</p>
      <h3>Month letters, 1860 to 1906</h3>
      <div class="table-wrap"><table><thead><tr><th scope="col">First character</th><th scope="col">Month</th><th scope="col">Used</th></tr></thead><tbody>{months}</tbody></table></div>
      <h2 id="tables">Year letters</h2>
      {tables}"""
    faqs = [
        ("How do I date Wedgwood by its marks?",
         "<p>Look for the impressed WEDGWOOD mark and a group of three impressed characters beside it. The last character is the year letter; the first gives the month or, from 1907, the period. ENGLAND in the mark means 1891 or later.</p>"),
        ("Why does my code give two years?",
         "<p>The year letters were reused: O to Z ran in 1860–1871 and again in 1886–1897. ENGLAND on the base (from 1891) usually decides it, though small items and wares not made for export sometimes lack it.</p>"),
        ("What about a code like 1A32?",
         "<p>That is the later system: month number, potter's letter, then the last two digits of the year (January 1932). The letter table does not apply.</p>"),
    ]
    return build_page("/marks/wedgwood-date-codes", "Wedgwood Date Codes: Three-Letter Marks, 1860–1930 | Heirloom",
                      "Decode a Wedgwood impressed three-letter date code: the year letter, the month letter and the ENGLAND rule, 1860 to 1930, with sources.",
                      "Wedgwood date codes, 1860 to 1930", "Wedgwood date codes",
                      "Wedgwood earthenware from 1860 to 1930 carries three impressed characters beside the WEDGWOOD mark. Type them to get the year and month.",
                      "A Wedgwood date code is three impressed characters next to the impressed WEDGWOOD mark. Only the last character is the year: in TOT, the final T is 1865 or 1891. ENGLAND in the mark (from 1891) usually decides between the two cycles.",
                      tool, sections, "wedgwood_three_letter", faqs,
                      "Photograph the base of your Wedgwood. The Advisor reads the impressed code and the WEDGWOOD mark, dates them from this table, and gives both years when the cycle can't be told.",
                      "wedgwood", inline("WG", {"rows": [{k: r[k] for k in ("letter", "cycle", "year")} for r in rows], "months": t["first_char_month_codes"]}))


# ── Minton ────────────────────────────────────────────────────────────────────

def minton():
    t = SYS["minton_year_cypher"]
    rows = t["rows"]
    # Table year -> the year Litchfield's 1912 chart prints that cypher under.
    # They agree from 1842 to 1894 and 1901 to 1907. For the swans the chart
    # runs a year later than the table (its swan with 2 is 1897, the table's
    # 1896), so each swan is shown on the table's year with the book's noted.
    book_year = {y: y for y in list(range(1842, 1895)) + list(range(1901, 1908))}
    book_year.update({1896: 1897, 1897: 1898, 1898: 1899, 1899: 1900})
    book_note = {
        1845: "Litchfield draws this X with knobbed ends and a ring where the arms cross.",
        1870: "Litchfield prints the M without the circle.",
        1891: "Litchfield prints the shield without the 1.",
        1896: "Litchfield prints this swan under 1897.",
        1897: "Litchfield prints this swan under 1898.",
        1898: "Litchfield prints this swan under 1899.",
        1899: "Litchfield prints this swan under 1900.",
    }

    def pic(r):
        y = r["year"]
        if y not in book_year:
            return '<span class="cypher-none">No chart</span>'
        note = f'<span class="cypher-note">{e(book_note[y])}</span>' if y in book_note else ""
        return cypher_img(f"f-minton-{book_year[y]}", f"Minton year cypher for {y}, as printed in 1912") + note

    trs = "".join(
        f'<tr id="y{r["year"]}"><th scope="row">{r["year"]}</th><td class="cypher-cell">{pic(r)}</td><td>{e(soften(r["cypher_description"]))}</td><td>{e(", ".join(str(y) for y in r.get("confusable_with", [])))}</td></tr>'
        for r in rows
    )
    photo = mark_photos(
        [("p-minton-1867", "Impressed MINTON with the 1867 year cypher below it, on a black vase", "MINTON, and the 1867 cypher below it")],
        "An impressed Minton mark on a black-bodied vase that the Met dates to about 1867. The symbol at lower left, an A whose legs cross, is the cypher for 1867. The other small impressed marks beside it are not year marks.",
        met_credit(("vase, LC-2016.178.1", "Vase MET LC-2016 178 1-marks.jpg")),
    )
    tool = """      <h2 id="lookup">Find a Minton year cypher</h2>
      <div class="finder">
        <div class="finder__row"><label class="grow">Describe the symbol <input id="mn-q" autocomplete="off" placeholder="e.g. triangle, square, star, cross"></label></div>
        <div id="mn-results" class="finder__results" aria-live="polite"><p class="finder__hint">Type a word for the small impressed symbol near MINTON or MINTONS. Every year whose cypher matches appears here, with the years it's easily confused with.</p></div>
      </div>"""
    sections = f"""      <h2 id="example">What the mark looks like</h2>
      {photo}
      <h2 id="tables">Every Minton year cypher, 1842 to 1942</h2>
      <p class="note">The descriptions are written from three published charts that agree on every year. The pictures are cropped from the chart Frederick Litchfield printed in 1912, which stops at 1907; where it differs from the table, the note under the picture says how. The symbols are small and often blurred by glaze, so match the overall shape and check the years in the last column.</p>
      <div class="table-wrap"><table class="cyphers"><thead><tr><th scope="col">Year</th><th scope="col">Printed in 1912</th><th scope="col">The cypher</th><th scope="col">Easily confused with</th></tr></thead><tbody>{trs}</tbody></table></div>
      <p class="stamps__credit">{book_credit("litchfield", "Cyphers")}</p>"""
    faqs = [
        ("How do I read a Minton date mark?",
         "<p>Find the impressed MINTON or MINTONS mark, then the small impressed symbol beside it. Each year from 1842 to 1942 has its own symbol. Match its shape in the table, and check the similar symbols before you settle on a year.</p>"),
        ("Does the cypher date the decoration?",
         "<p>No. It is impressed into the body and dates when the item was potted. Decoration can be later.</p>"),
        ("Are there other letters near the cypher?",
         "<p>Often: an impressed month letter and a potter's mark. Neither is a year mark.</p>"),
    ]
    return build_page("/marks/minton-date-marks", "Minton Date Marks: Year Cyphers, 1842–1942 | Heirloom",
                      "Every Minton impressed year cypher from 1842 to 1942, described and pictured from a 1912 chart, with a finder and the years each symbol is easily confused with.",
                      "Minton date marks, 1842 to 1942", "Minton date marks",
                      "Minton impressed a small symbol beside its name each year from 1842 to 1942. Describe the symbol to find the year.",
                      "A Minton year cypher is a small impressed symbol next to the impressed MINTON or MINTONS mark, a different one for each year from 1842 to 1942: an open triangle is 1843, an open square 1844. Many symbols look alike, so check the near matches before you settle on a year.",
                      tool, sections, "minton_year_cypher", faqs,
                      "Photograph the base, with the impressed marks in focus. The Advisor reads what it can see and says plainly when a symbol is too blurred to match.",
                      "minton", inline("MN", [{"year": r["year"], "cypher_description": soften(r["cypher_description"]), "confusable_with": r.get("confusable_with")} for r in rows]))


# ── Royal Worcester ───────────────────────────────────────────────────────────

def worcester():
    t = SYS["royal_worcester_dots"]
    rows = t["rows"]
    trs = "".join(
        f'<tr><th scope="row">{r["year_start"]}{"–" + str(r["year_end"]) if r["year_end"] != r["year_start"] else ""}</th><td>{e(soften(r["rule"]))}</td></tr>'
        for r in rows
    )
    tool = """      <h2 id="lookup">Decode a Royal Worcester date mark</h2>
      <div class="finder">
        <div class="finder__row">
          <label>Below or around the mark <select id="rw-type">
            <option value="letter">A letter</option>
            <option value="dots">Dots only</option>
            <option value="star">A star (with or without dots)</option>
            <option value="shape">A shape</option>
            <option value="circles">Three linked circles and dots</option>
            <option value="w">W or R in a circle, with dots</option>
            <option value="digits">Two digits</option>
          </select></label>
          <label id="rw-letter-l">Letter <input id="rw-letter" maxlength="1" autocomplete="off" placeholder="e.g. a"></label>
          <label id="rw-dots-l" hidden>Dots, counted <input id="rw-dots" type="number" min="0" max="30" inputmode="numeric" placeholder="0"></label>
          <label id="rw-shape-l" hidden>Shape <select id="rw-shape"><option value="1928">Open square</option><option value="1929">Open diamond</option><option value="1930">Division sign (÷)</option><option value="1931">Two linked circles</option><option value="1932">Three linked circles, no dots</option></select></label>
          <label id="rw-digits-l" hidden>Digits <input id="rw-digits" maxlength="2" inputmode="numeric" placeholder="e.g. 63"></label>
        </div>
        <div id="rw-results" class="finder__results" aria-live="polite"><p class="finder__hint">Choose what you see under the crowned circle, then type the letter or count the dots. Count every dot, on both sides of the crown and below it.</p></div>
      </div>"""
    photos = mark_photos(
        [
            ("p-worcester-n", "Royal Worcester crowned circle mark in red with the letter N below", "N below the circle: 1878"),
            ("p-worcester-p", "Royal Worcester crowned circle mark in green with a faint letter P below", "A faint P: 1879"),
            ("p-worcester-x", "Royal Worcester crowned circle mark in dark green with a small X below", "X below the circle: 1886"),
        ],
        "The standard printed mark, a crowned circle with the factory's cypher and 51 in the middle, with the year letter underneath. All three items are in the Met, which dates them 1878, 1879 and about 1886, the years the table gives for N, P and X. On the third, a registered design number printed just below (not shown) is from 1885, which fits.",
        met_credit(("moon flask, LC-2018.62.72", "Moon flask MET LC-2018 62 72-marks.jpg"), ("vase, LC-2018.62.103", "Orb bottom vase with white and gold crane motif MET LC-2018 62 103-marks.jpg"), ("vase, LC-2018.62.108", "Vase MET LC-2018 62 108-marks.jpg")),
    )
    sections = f"""      <h2 id="example">What the mark looks like</h2>
      {photos}
      <p class="note">No openly licensed photograph of a dated mark from after 1890 (dots, star, shapes or W) has been found yet, so those years have no picture here.</p>
      <h2 id="tables">Every Royal Worcester date mark, 1862 to 1963</h2>
      <div class="table-wrap"><table><thead><tr><th scope="col">Years</th><th scope="col">What the mark shows</th></tr></thead><tbody>{trs}</tbody></table></div>"""
    faqs = [
        ("How do I date Royal Worcester by the dots?",
         "<p>From 1892 one dot was added each year, first beside the crown, then below the circle: the year is 1891 plus the total number of dots, up to 1915. From 1916 a star appears, and the year is 1916 plus any dots beside it.</p>"),
        ("Why does a letter give two years?",
         "<p>V and W were used twice: V for 1884 and 1949, W for 1885 and 1950. The crown's position, the wording around the mark and the style of the ware tell them apart.</p>"),
        ("What about a date in the pattern stamp on later tableware?",
         "<p>From the mid-1960s, tableware stamps give the year the pattern was introduced, not the year the item was made.</p>"),
    ]
    return build_page("/marks/royal-worcester-date-marks", "Royal Worcester Date Marks: Letters and Dots, 1862–1963 | Heirloom",
                      "Decode a Royal Worcester date mark: letters 1867–1890, dots from 1892, the star, the shapes and the W or R with dots to 1963, from the factory museum's own table and four others.",
                      "Royal Worcester date marks, 1862 to 1963", "Royal Worcester date marks",
                      "The standard Royal Worcester mark carries a year code: a letter, a count of dots, a star or a shape. Choose what yours shows and count.",
                      "Royal Worcester dated its standard printed mark (the crowned circle) from 1862 to 1963: a letter until 1890, then dots added one a year, a star from 1916, shapes from 1928, three linked circles with dots from 1933, and W (or R in a circle) with dots from 1950. A mark with 12 dots beside the crown is 1903.",
                      tool, sections, "royal_worcester_dots", faqs,
                      "Photograph the mark under good light. The Advisor reads the crowned circle and the code under it and dates it from this table, giving every year it could be when the dots can't be counted surely.",
                      "worcester")


# ── Rookwood ──────────────────────────────────────────────────────────────────

def rookwood():
    t = SYS["rookwood_flames"]
    rows = t["rows"]
    trs = "".join(
        f'<tr><th scope="row">{r["year_start"]}{"–" + str(r["year_end"]) if r.get("year_end") and r["year_end"] != r["year_start"] else ("–" if not r.get("year_end") else "")}</th><td>{e(r["mark"])}</td><td>{e(r["rule"])}</td></tr>'
        for r in rows
    )
    tool = """      <h2 id="lookup">Date a Rookwood mark</h2>
      <div class="finder">
        <div class="finder__row">
          <label>Flames around the RP <input id="rk-flames" type="number" min="0" max="14" inputmode="numeric" placeholder="0 to 14"></label>
          <label>Roman numeral below (if any) <input id="rk-numeral" maxlength="9" autocomplete="off" placeholder="e.g. XIV"></label>
        </div>
        <div id="rk-results" class="finder__results" aria-live="polite"><p class="finder__hint">Count only the short flames around the RP monogram, not the tail of the R. Leave the numeral empty if there is none.</p></div>
      </div>"""
    book = mark_photos(
        [
            ("f-rookwood-1882", "ROOKWOOD 1882 in block capitals", "ROOKWOOD and the year: 1882 to 1886"),
            ("f-rp-1886", "The RP monogram with no flames", "No flames: 1886"),
            ("f-rp-1887", "The RP monogram with one flame above it", "One flame: 1887"),
            ("f-rp-1900", "The RP monogram ringed by fourteen flames", "Fourteen flames: 1900"),
            ("f-rp-1901", "The RP monogram with fourteen flames and the numeral I below", "Fourteen flames and I: 1901"),
        ],
        "The marks as Edwin AtLee Barber printed them in 1904, with the years he gave, which match the table.",
        book_credit("barber"),
        book=True,
    )
    photo = mark_photos(
        [("p-rookwood-xxx", "The impressed RP flame mark with XXX and 80C below, on a vase base", "XXX below the flames: 1930")],
        "The base of a Rookwood vase decorated by Lorinda Epply: the RP monogram with its fourteen flames, the numeral XXX (1900 plus 30, so 1930), and 80C, the shape number and size letter, which is not a date. The blue painted initials are the decorator's.",
        f'Photograph: {commons("Rookwood Pottery vase, Lorinda Epply, 1930, Markings.jpg", "Y.paulsen, via Wikimedia Commons")}, {LIC["cc0"]}, cropped by Heirloom.',
    )
    sections = f"""      <h2 id="example">What the mark looks like</h2>
      {photo}
      {book}
      <h2 id="tables">How Rookwood dated its marks</h2>
      <div class="table-wrap"><table><thead><tr><th scope="col">Years</th><th scope="col">The mark</th><th scope="col">How to read it</th></tr></thead><tbody>{trs}</tbody></table></div>"""
    faqs = [
        ("How do I date Rookwood pottery?",
         "<p>Find the RP monogram impressed in the base and count the flames around it: no flames is 1886, and each flame adds a year to 14 flames in 1900. After that, a Roman numeral below the 14 flames counts the years from 1900, so XIV is 1914.</p>"),
        ("What are the other numbers and letters on the base?",
         "<p>The Arabic number below the numeral is a shape number, often with a size letter (907C). Letters such as V or Z after it name a glaze line. Neither is a date.</p>"),
        ("My numeral begins with MM. Is that a Rookwood date?",
         "<p>Yes, but a modern one: the revived company writes the full year in Roman numerals, so MMXII is 2012, not 1912.</p>"),
    ]
    return build_page("/marks/rookwood-pottery-marks", "Rookwood Pottery Marks: Flames and Numerals, 1886–1967 | Heirloom",
                      "Date Rookwood pottery from its RP flame mark and Roman numeral, 1886 to 1967, with the shape numbers, glaze letters and modern marks that aren't dates.",
                      "Rookwood pottery marks and dates", "Rookwood pottery marks",
                      "Rookwood's RP monogram counts the years in flames, then in Roman numerals. Count yours to get the year.",
                      "Rookwood dated its pottery with the flames around the RP monogram in the base: no flames is 1886, one flame was added each year to 14 in 1900, and after that a Roman numeral below the flames counts from 1900 (XXII is 1922). Historic production ended in 1967.",
                      tool, sections, "rookwood_flames", faqs,
                      "Photograph the base. The Advisor counts the flames, reads the numeral and dates the mark, and tells you to count again when the flames are blurred.",
                      "rookwood")


# ── Sèvres ────────────────────────────────────────────────────────────────────

def sevres():
    t = SYS["sevres_date_letters"]
    rows = t["rows"]
    # Burton and Hobson (1909) print four marks with letters. They follow the
    # traditional count without J, so from K on they run a year early: their
    # AA is 1777 and their U 1772, where both tables here give 1778 and 1773.
    book = mark_photos(
        [
            ("f-sevres-a", "Printed interlaced Ls with A inside", "A, printed with 1753"),
            ("f-sevres-d", "Printed interlaced Ls with D inside", "D, printed with 1756"),
            ("f-sevres-u-crown", "Printed crowned interlaced Ls with U inside", "Crowned U, printed with 1772"),
            ("f-sevres-aa", "Printed interlaced Ls with AA inside", "AA, printed with 1777"),
        ],
        "The same mark as a 1909 handbook printed it, with the year it gave each letter. A and D agree with the traditional table. For U and AA the handbook is a year earlier than either table here (1773 and 1778), because it counts the letters without J. The crown over the Ls marks hard paste.",
        book_credit("burton"),
        book=True,
    )
    trs = "".join(
        f'<tr><th scope="row">{e(r["letter"])}</th><td>{e(r["year"]) if r.get("year") else "Never used"}</td><td>{e(r.get("alt_year") or "")}</td></tr>'
        for r in rows
    )
    photos = mark_photos(
        [
            ("p-vincennes-dot", "Blue interlaced Ls with a dot in the middle and no letter", "A dot, no letter: before the letters began"),
            ("p-sevres-h", "Blue interlaced Ls with H inside and a cross below", "H: 1761, or 1760 in the traditional table"),
            ("p-sevres-s", "Blue interlaced Ls with S inside and the initials LB below", "S: 1771"),
            ("p-sevres-t", "Blue interlaced Ls with T inside and a small k below", "T: 1772"),
            ("p-sevres-z", "Blue interlaced Ls with Z inside, the word Dodin and the year 1777 along one stroke", "Z: 1777"),
        ],
        "Painted marks on five Vincennes and Sèvres items in the Met. The first, on a wine cooler of about 1751, has a dot and no letter, as marks did before the letters began. The others read H, S, T and Z, and the Met dates the items 1761, 1771, 1772 and 1777, the years in the revised table. The painter Charles-Nicolas Dodin wrote 1777 in full beside his Z. The marks below the Ls (a cross, LB, k) are painters' and gilders' marks, not dates.",
        met_credit(("wine cooler, LC-1989.351.1", "Wine cooler (seau à demi-bouteille) (one of a pair) MET LC-1989 351 1-marks.jpg"), ("vase, SF2007.90.8a, b", "Vase (Vase hollandois) MET SF2007 90 8a, b mark.jpg"), ("cup, SF64.174.59a", "Cup with cover (pot à jus) MET SF64 174 59a mark.jpg"), ("vase, SF58.75.73ab", "Vase with cover (vase à flacon) (one of a pair) MET SF58 75 73ab marks.jpg"), ("plaque, SF1988.179", "Themire Crowned by Graces MET SF1988 179 mark.jpg")),
    )
    tool = """      <h2 id="lookup">Find a Sèvres date letter</h2>
      <div class="finder">
        <div class="finder__row"><label>Letter or letters inside the Ls <input id="sv-letter" maxlength="2" autocomplete="off" placeholder="e.g. S or DD"></label></div>
        <div id="sv-results" class="finder__results" aria-live="polite"><p class="finder__hint">Type the painted letter inside the interlaced Ls: one letter, or a doubled letter from 1778.</p></div>
      </div>"""
    sections = f"""      <h2 id="example">What the mark looks like</h2>
      {photos}
      {book}
      <h2 id="tables">Every Sèvres date letter, 1753 to 1793</h2>
      <p class="note">Two tables are published. The revised one (the French Porcelain Society, after David Peters, 2014) is used by museums today; the traditional one is a year earlier for A to I and a year later for KK to PP. Both are shown.</p>
      <div class="table-wrap"><table><thead><tr><th scope="col">Letter</th><th scope="col">Revised table</th><th scope="col">Traditional table</th></tr></thead><tbody>{trs}</tbody></table></div>"""
    faqs = [
        ("How do I date Sèvres porcelain?",
         "<p>Find the painted interlaced Ls and the letter inside or beside them. Single letters run from A (1753 or 1754) to Z (1777), then doubled letters from AA (1778) to the early 1790s. The letter dates the painting of the mark, which is usually the decoration.</p>"),
        ("Does a Sèvres mark mean my porcelain is Sèvres?",
         "<p>No. The interlaced Ls are among the most copied marks in porcelain. The letter tells you the date the mark claims; whether the item is factory work is a question for a specialist.</p>"),
        ("What if the two letters are different?",
         "<p>The two letters of a double are always the same. Different letters, such as CL, are not a date code.</p>"),
    ]
    return build_page("/marks/sevres-date-letters", "Sèvres Date Letters: Interlaced L Marks, 1753–1793 | Heirloom",
                      "Look up a Vincennes or Sèvres date letter inside the interlaced Ls, A to QQ, in both the revised (2014) and traditional tables, with the cautions about copied marks.",
                      "Sèvres date letters, 1753 to 1793", "Sèvres date letters",
                      "The letter inside Sèvres' interlaced Ls dates the painting of the mark. Type it to see the year in both published tables.",
                      "Vincennes and Sèvres porcelain carries a painted date letter inside or beside the interlaced Ls: A for 1753 or 1754, through Z for 1777, then doubled letters from AA in 1778 to the early 1790s. K to Z and AA to II mean the same year in both published tables; the others differ by one year.",
                      tool, sections, "sevres_date_letters", faqs,
                      "Photograph the mark. The Advisor reads the letter inside the Ls, gives both tables' years where they differ, and says plainly that a date letter doesn't make an item genuine.",
                      "sevres", inline("SV", [{k: r.get(k) for k in ("letter", "year", "alt_year", "note")} for r in rows]))


def build():
    return [wedgwood(), minton(), worcester(), rookwood(), sevres()]


CHILDREN = [
    ("/marks/wedgwood-date-codes", "Wedgwood date codes", "Decode the three impressed letters on Wedgwood earthenware, 1860–1930."),
    ("/marks/minton-date-marks", "Minton date marks", "Find the year from Minton's small impressed cypher, 1842–1942."),
    ("/marks/royal-worcester-date-marks", "Royal Worcester date marks", "Letters, dots, stars and shapes under the Royal Worcester mark, 1862–1963."),
    ("/marks/rookwood-pottery-marks", "Rookwood pottery marks", "Count the flames and read the numeral on Rookwood's RP mark."),
    ("/marks/sevres-date-letters", "Sèvres date letters", "The letter inside the interlaced Ls, in both published tables."),
]
