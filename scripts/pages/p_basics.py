"""Silver basics: informational marks pages.

Five pages under /marks/: silver or silver plate, what 925 and the other
numbers mean, German (nickel) silver, coin silver and Britannia silver.
Unlike the date-letter pages they don't read the app's tables; each
fact on them rests on at least two of the published sources listed on the
page, and where sources disagree the page says so.

Every mark shown comes from the marks database (marksdb): one image of that
mark alone, credited, or its description in words when there is none.
"""
from shell import *
from p_marks import MID, cta, e
import marksdb

CSS = '<link rel="stylesheet" href="/marks/marks.css">'


# ── Sources ───────────────────────────────────────────────────────────────────
# Each page lists the ones it uses, by key.

S = {
    "usc296": ("National Gold and Silver Stamping Act of 1906, 15 U.S.C. § 296 (standard of fineness of silver articles)", "https://www.govinfo.gov/content/pkg/USCODE-2023-title15/html/USCODE-2023-title15-chap8-sec296.htm"),
    "cfr235": ("Federal Trade Commission, Guides for the Jewelry, Precious Metals, and Pewter Industries, 16 CFR § 23.5 (misrepresentation as to silver content)", "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-23/section-23.5"),
    "ukact": ("Hallmarking Act 1973, Schedule 2 (approved hallmarks and standards of fineness), as amended", "https://www.legislation.gov.uk/ukpga/1973/43/schedule/2"),
    "ukguide": ("UK Assay Offices and the Office for Product Safety and Standards, Hallmarking: practical guidance (2022)", "https://www.gov.uk/government/publications/hallmarking-guidance-notes"),
    "jackson": ("Sir Charles James Jackson, English Goldsmiths and Their Marks, 2nd edition (London: Macmillan, 1921), public domain", "https://archive.org/details/englishgoldsmith00jack"),
    "chaffers": ("William Chaffers, Hall Marks on Gold and Silver Plate, edited by C. A. Markham (London: Reeves, 1922), public domain", "https://archive.org/details/hallmarksongolds00chafrich"),
    "de1884": ("Gesetz über den Feingehalt der Gold- und Silberwaaren, 16 July 1884, Reichsgesetzblatt 1884, pp. 120–122 (Germany's fineness law, in force 1 January 1888)", "https://de.wikisource.org/wiki/Gesetz_%C3%BCber_den_Feingehalt_der_Gold-_und_Silberwaaren"),
    "de1886": ("Bekanntmachung über die Form des Stempelzeichens, 7 January 1886, Reichsgesetzblatt 1886, p. 1 (the crown and crescent mark)", "https://de.wikisource.org/wiki/Bekanntmachung,_betreffend_die_Bestimmung_der_Form_des_Stempelzeichens_zur_Angabe_des_Feingehalts_auf_goldenen_und_silbernen_Ger%C3%A4then"),
    "vam_cup": ("Victoria and Albert Museum, cup, Germany, about 1900, museum no. O136991: \"A crescent moon and crown are stamped beneath the base\"", "https://collections.vam.ac.uk/item/O136991/"),
    "eb1911gs": ("Encyclopaedia Britannica, 11th edition (1911), \"German Silver\", public domain", "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/German_Silver"),
    "eb1911sb": ("Encyclopaedia Britannica, 11th edition (1911), \"Antimony\" (Britannia metal), public domain", "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Antimony"),
    "nbs100": ("US Bureau of Standards, Circular 100: Nickel (Washington, 1921), section 3, \"Copper-nickel-zinc alloys; nickel silver\"", "https://archive.org/details/circularofbureau100unse"),
    "meyers_ns": ("Meyers Großes Konversations-Lexikon, 6th edition, vol. 14 (Leipzig, 1908), \"Neusilber\", public domain", "http://www.zeno.org/Meyers-1905/A/Neusilber"),
    "meyers_bm": ("Meyers Großes Konversations-Lexikon, 6th edition (Leipzig, 1905–1909), \"Britanniametall\", public domain", "http://www.zeno.org/Meyers-1905/A/Britanniametall"),
    "coinage1792": ("Coinage Act of 1792, § 13 (silver coin: 1485 parts fine to 179 parts alloy)", "https://en.wikisource.org/wiki/Coinage_Act_of_1792"),
    "coinage1837": ("Act of January 18, 1837, § 8 (silver coin: 900 parts pure metal, 100 alloy), 5 Stat. 136", "https://en.wikisource.org/wiki/United_States_Statutes_at_Large/Volume_5/24th_Congress/2nd_Session/Chapter_3"),
    "french1917": ("Hollis French, A List of Early American Silversmiths and Their Marks (New York: Walpole Society, 1917), glossary, public domain", "https://archive.org/details/listofearlyameri00fren"),
    "yale_kossack": ("Yale University Art Gallery, American Silver in the Yale University Art Gallery: the Kossack checklist (1988)", "https://artgallery.yale.edu/sites/default/files/publication/pdfs/0-89467-049-2.pdf"),
    "currier1938": ("Ernest M. Currier, Marks of Early American Silversmiths (Portland, Maine: Southworth-Anthoensen Press, 1938)", "https://archive.org/details/marksofearlyamer00curr"),
    "bigelow1917": ("Francis Hill Bigelow, Historic Silver of the Colonies and Its Makers (New York: Macmillan, 1917), public domain", "https://archive.org/details/historicsilverof00bige"),
    "cw2008": ("Colonial Williamsburg Journal, \"Stuff and Nonsense\" (Winter 2008)", "https://research.colonialwilliamsburg.org/Foundation/journal/Winter08/stuff.cfm"),
}


def sources(*keys):
    items = "".join(f'<li>{e(S[k][0])} (<a href="{e(S[k][1])}" rel="nofollow">source</a>)</li>' for k in keys)
    return f'<!--copy-check:skip--><ul class="sources">{items}</ul><!--/copy-check:skip-->'


def table(head, rows):
    th = "".join(f'<th scope="col">{h}</th>' for h in head)
    body = "".join("<tr>" + f'<th scope="row">{r[0]}</th>' + "".join(f"<td>{c}</td>" for c in r[1:]) + "</tr>" for r in rows)
    return f'<div class="table-wrap"><table><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table></div>'


SRC_NOTE = "Each fact on this page is supported by at least two of these. Where they disagree, the page gives both."


def build_page(path, title, desc, h1, crumb, lede, answer, body, faqs, cta_text, src_keys, about=None, src_note=SRC_NOTE):
    html_body = f"""      <p class="guide__lede">{lede}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{answer}</p>
      </div>
{body}
      <h2 id="sources">Sources</h2>
      <p>{src_note}</p>
      {sources(*src_keys)}
{cta(cta_text)}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": about or crumb}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, html_body, graph, mid=MID, crumb_name=crumb, extra_head=CSS)


MORE = '<p>More to read: <a href="/silver-hallmarks">how to read silver hallmarks</a>, and the <a href="/marks/london-date-letters">London date letters</a>.</p>'


# ── 1. Silver or silver plate? ────────────────────────────────────────────────

def real_silver():
    rows = [
        ("STERLING, STER. or 925", "Silver of at least 925 parts in 1000", "Solid silver. In the US the word may be used only at 925 or better, and never on plate."),
        ("COIN or COIN SILVER", "At least 900 in 1000", "Solid silver, the American coin standard. See <a href=\"/marks/coin-silver\">coin silver</a>."),
        ("A number: 800, 900, 925, 958, 999", "That many parts of silver in 1000", "Solid silver at that standard. See <a href=\"/marks/silver-purity-marks\">what the numbers mean</a>."),
        ("A British hallmark with a lion passant", "Sterling, 925", "Solid silver, tested and marked by an assay office. A figure of Britannia instead means the higher Britannia standard, 958."),
        ("A crescent moon and a crown, with a number", "German silver wares from 1888 at the fineness shown", "Solid silver, 800 or better."),
    ]
    plate = [
        ("EP, EPNS, silver plate, silver plated", "A coat of silver over another metal", "Plate. US law forbids STERLING or COIN on plated wares."),
        ("NICKEL SILVER, GERMAN SILVER, ALPACCA, ARGENTAN", "An alloy of copper, nickel and zinc", "No silver in the metal itself. See <a href=\"/marks/german-silver\">German silver</a>."),
        ("Britannia metal (not Britannia silver)", "A tin alloy", "No silver: a pewter-like metal, often plated."),
        ("A maker's name and a pattern name only", "Nothing about the metal", "Either. Read the other marks, and see below."),
    ]
    body = f"""      <p>Heirloom doesn't decide whether an item is genuine. What a mark can do is say which kind of metal the maker or an assay office put on record, and that's usually the first question about a spoon, a tray or a candlestick that looks like silver: is it solid silver, or silver plate?</p>
      <h2 id="solid">Marks that say solid silver</h2>
      <p>These marks state a standard: how many parts in 1000 of the metal are silver.</p>
      {marksdb.grid(["sterling-word-us", "silver-fineness-925", "coin-word-us", "lion-passant", "german-crescent-and-crown"], captions={"lion-passant": "Lion passant: British sterling"})}
      {table(["The mark", "What it states", "What it means"], rows)}
      <p>In Britain those marks are struck by an assay office after it has tested the metal. In the United States the maker stamps them, and the law holds the maker to the standard the mark states: 925 for sterling and 900 for coin, within four parts in 1000.</p>
      <h2 id="plate">Marks that say plate, or no silver at all</h2>
      {table(["The mark", "What it is", "What it means"], plate)}
      {marksdb.grid(["epns-mark", "nickel-silver-word", "german-silver-word"])}
      <p>Plated wares often carry a row of small marks that look like a hallmark at a glance: the maker's initials in shields, a pattern number, a registration mark. Look for a standard: a lion passant, Britannia, a crescent and crown, or a number such as 925. Without one, read it as plate until something else shows otherwise.</p>
      <h2 id="limits">What marks can't tell you</h2>
      <ul>
        <li><strong>No mark is not the same as no silver.</strong> Much early American silver carries only a maker's name, light items are exempt from hallmarking in Britain, and Germany's law of 1884 made a fineness mark optional.</li>
        <li><strong>A mark is a claim.</strong> Marks can be struck lightly, worn away, faked or set into a later item; Jackson and Chaffers both record frauds of this kind. A strong set of marks is good evidence, not proof.</li>
        <li><strong>Only a test of the metal settles it.</strong> An assay office, or a specialist with the right equipment, can test the metal. Heirloom reads marks; it doesn't test metal.</li>
      </ul>
      {MORE}"""
    faqs = [
        ("How can I tell if silver is real from the marks?",
         "<p>Look for a mark that states a standard: STERLING, 925, COIN, a number such as 800, or a British lion passant. Those mean solid silver at that standard. EP, EPNS, plate, nickel silver and German silver mean plate or no silver. A maker's name alone says nothing about the metal.</p>"),
        ("Does 925 mean real silver?",
         "<p>925 means the metal is stated to be 925 parts silver in 1000: sterling. In Britain an assay office strikes it after testing; in the United States the maker stamps it, and the law holds the maker to it. A stamp is still a claim, and only a test of the metal settles it.</p>"),
        ("Is silver plate worth keeping a record of?",
         "<p>Yes. A record is about what an item is and where it came from, not its price. Plated tableware often carries a maker's mark, a pattern and a family story worth writing down.</p>"),
        ("My silver has no marks. Is it plate?",
         "<p>Not necessarily. Much early American silver carries only the maker's name, and light items are exempt from hallmarking in Britain. Without a standard mark the metal is simply unknown until it is tested.</p>"),
    ]
    return build_page(
        "/marks/is-it-real-silver",
        "How to Tell if Silver Is Real: Sterling, Coin or Plate Marks | Heirloom",
        "Silver or silver plate? What sterling, 925, coin, EPNS, nickel silver and British hallmarks say about the metal, and what no mark can tell you.",
        "Silver or silver plate? What the marks say", "Silver or silver plate",
        "Most of the answer is in the small stamps. Here is which marks say solid silver, which say plate, and what no mark can tell you.",
        "A mark that states a standard means solid silver at that standard: STERLING or 925, COIN or 900, a number such as 800, or a British hallmark with a lion passant. EP, EPNS, silver plate, nickel silver and German silver mean plate or no silver at all. A maker's name on its own says nothing about the metal, and no mark is proof: only a test of the metal settles it.",
        body, faqs,
        "Photograph the marks on your silver. The Advisor reads what each one says, sterling, plate or a maker's name, and keeps it on the item's record with the photo it came from. It never decides whether an item is genuine.",
        ["usc296", "cfr235", "ukact", "ukguide", "jackson", "chaffers", "de1884", "de1886", "bigelow1917", "french1917", "nbs100", "eb1911gs", "meyers_ns", "eb1911sb", "meyers_bm"],
        about="Silver and silver plate marks",
    )


# ── 2. What 925, 800 and the other numbers mean ───────────────────────────────

def purity():
    rows = [
        ("999", "99.9%", "Fine silver, one of the four UK standards for silver."),
        ("958", "95.84%", "Britannia silver, England's compulsory standard from 1697 to 1720 and optional since. See <a href=\"/marks/britannia-silver\">Britannia silver</a>."),
        ("925", "92.5%", "Sterling: the British standard, marked with the lion passant, and the US standard for STERLING."),
        ("900", "90%", "Coin silver: in the US, the least an item marked COIN may contain."),
        ("800", "80%", "The lowest UK standard, and the lowest fineness German law let a maker state on silver wares from 1888."),
    ]
    body = f"""      <p>A number on silver is its fineness: the parts of pure silver in 1000 parts of the metal. The rest is other metal, which makes it harder: pure silver, and even the Britannia standard, is soft. The same reading works wherever the number comes from.</p>
      <h2 id="table">Common standards</h2>
      {table(["The number", "Silver", "Where you'll see it"], rows)}
      {marksdb.grid(["silver-fineness-925", "silver-fineness-800", "silver-fineness-900"])}
      <p class="note">This table lists the standards the sources on this page set down in law or record. Other numbers occur on silver from elsewhere; read them the same way, as parts in 1000, alongside the country's other marks.</p>
      <h2 id="old">Before the numbers: ounces and pennyweights</h2>
      <p>Older English law didn't write 925. It set the standard as 11 ounces 2 pennyweights of silver in every pound troy of 12 ounces, which works out to 925 in 1000. The Britannia standard of 1697 was 11 ounces 10 pennyweights, which is 958.3 in 1000; the Hallmarking Act of 1973 states it as 958.4.</p>
      <h2 id="country">How each country marks the number</h2>
      {marksdb.grid(["lion-passant", "britannia-figure", "sterling-word-us", "german-crescent-and-crown"], captions={"lion-passant": "Lion passant: UK sterling", "britannia-figure": "Britannia: UK 958"})}
      <ul>
        <li><strong>United Kingdom.</strong> Today the compulsory hallmark is the sponsor's (maker's) mark, the fineness as a number in a shield, and the assay office's mark. The lion passant and Britannia are optional symbols beside the number, and the date letter has been optional since 1999. On older British silver the symbols alone carry the standard: a lion passant for sterling, Britannia for the higher standard.</li>
        <li><strong>United States.</strong> STERLING, or a number, stamped by the maker. Federal law requires 925 for STERLING and 900 for COIN, and a stated number must be met within four parts in 1000.</li>
        <li><strong>Germany, from 1888.</strong> The law of 1884 let makers state a fineness on silver wares only at 800 or more, with a crown and a crescent moon beside the number and the firm's mark. It allowed eight parts in 1000 below the stated number.</li>
      </ul>
      {MORE}"""
    faqs = [
        ("What does 925 mean on silver?",
         "<p>925 means 925 parts in 1000 of the metal are silver: 92.5%. That is sterling, the standard of the British lion passant and of STERLING on American silver.</p>"),
        ("What does 800 mean on silver?",
         "<p>800 means 80% silver. It is the lowest standard the UK hallmarks, and the lowest fineness German law let a maker state on silver wares from 1888, beside a crescent moon and a crown.</p>"),
        ("Is 800 silver real silver?",
         "<p>Yes: it is solid silver at a lower standard than sterling, 800 parts in 1000 rather than 925. It is not plate.</p>"),
        ("What is the difference between 925 and 999 silver?",
         "<p>999 is fine silver, 99.9% pure; 925 is sterling, 92.5% silver. Pure silver is soft, so most tableware and jewelry is made at a lower standard such as 925.</p>"),
        ("Does a 925 stamp prove an item is silver?",
         "<p>No. It is a statement of the standard, made by an assay office in Britain and by the maker in the United States. A test of the metal is the only proof.</p>"),
    ]
    return build_page(
        "/marks/silver-purity-marks",
        "What 925 Means on Silver: 925, 800, 900 and Other Purity Marks | Heirloom",
        "What 925, 800, 900, 958 and 999 mean on silver, with a table of the standards by country, the old English ounce standards, and how the UK, US and Germany mark them.",
        "What 925, 800 and other numbers on silver mean", "Silver purity marks",
        "925, 800, 900, 958, 999: the number on silver is how much of it is silver. Here is each common standard and where it comes from.",
        "A number on silver is its fineness in parts per 1000. 925 is sterling (92.5% silver), 800 is 80%, 900 is American coin silver, 958 is Britannia silver and 999 is fine silver. In Britain an assay office strikes the number after testing; in the United States the maker stamps it, and the law holds the maker to it.",
        body, faqs,
        "Photograph the marks. The Advisor reads the number and the marks around it, says which standard they state and keeps it on the item's record.",
        ["ukact", "ukguide", "usc296", "cfr235", "jackson", "chaffers", "de1884", "de1886", "vam_cup"],
        about="Silver fineness marks",
    )


# ── 3. German silver and nickel silver ────────────────────────────────────────

def german_silver():
    body = f"""      <p>German silver has no silver in it. It is an alloy of copper, nickel and zinc, chosen because its color is close to silver's and it takes a fine polish. It was used on its own and, more often, as the base metal under silver plate.</p>
      {marksdb.grid(["nickel-silver-word", "german-silver-word", "alp-nickel-silver", "epns-mark"])}
      <h2 id="what">What it is made of</h2>
      <p>The sources agree on the three metals but give different proportions, because makers used many recipes:</p>
      <ul>
        <li>The US Bureau of Standards (1921): copper 52 to 80%, zinc 10 to 35%, nickel 5 to 30%, with high grades at about 20% nickel and low grades under 10%.</li>
        <li>Meyers (1908): in effect brass with 16 to 33% nickel added, usually 25%.</li>
        <li>The Britannica of 1911: for imitation silver knives and forks, about half copper and the rest zinc and nickel in about equal parts.</li>
      </ul>
      <p>All three name a Chinese alloy, paktong (packfong), as the same kind of metal, known long before the European names.</p>
      <h2 id="names">Its names</h2>
      <p>The same alloy is sold under many names. German silver and nickel silver are the usual English ones; the Bureau of Standards noted in 1921 that the American trade had moved to "nickel silver" after the war. Neusilber and Argentan are German names, maillechort the French one, and both lists add others such as China silver and new silver. Alpacca (Alpaka) is a name both for the alloy and, in Meyers, for silver-plated nickel silver: the sources differ, so read ALP or ALPACCA as nickel silver that may or may not be plated.</p>
      <h2 id="marks">How it's marked</h2>
      <ul>
        <li><strong>Named outright,</strong> as in the marks above: NICKEL SILVER, GERMAN SILVER, or a trade name such as ALP, often beside the maker's name.</li>
        <li><strong>When plated:</strong> EPNS, electroplated nickel silver, sometimes with a grade or a pattern name. The silver is the thin coat; the body is nickel silver.</li>
        <li><strong>Never sterling or coin.</strong> US law forbids those words on plated wares, and a fineness number on silver states silver content; on nickel silver there is none to state.</li>
      </ul>
      <p>German silver is not the same as silver made in Germany. Solid silver wares made in Germany are marked with a number such as 800 and, from 1888, a crescent moon and a crown: see <a href="/marks/silver-purity-marks">what 800 means</a>.</p>
      {MORE}"""
    faqs = [
        ("Does German silver have any silver in it?",
         "<p>No. German silver, also called nickel silver, is an alloy of copper, nickel and zinc. The name describes its color, not its metal.</p>"),
        ("Is German silver the same as nickel silver?",
         "<p>Yes. They are two names for the same family of copper, nickel and zinc alloys; nickel silver became the usual trade name in the US after the First World War.</p>"),
        ("What does EPNS mean?",
         "<p>Electroplated nickel silver: a nickel silver body with a thin coat of silver laid on by electroplating. The silver is only on the surface.</p>"),
        ("How do I tell German silver from sterling?",
         "<p>Read the marks first: sterling is marked STERLING, 925 or with a lion passant, and German silver is often marked with one of its names, such as NICKEL SILVER, or EPNS when plated. An unmarked item needs a test of the metal.</p>"),
    ]
    return build_page(
        "/marks/german-silver",
        "German Silver and Nickel Silver: No Silver, and How It's Marked | Heirloom",
        "German silver and nickel silver contain no silver: an alloy of copper, nickel and zinc. What it is made of, its other names (alpacca, Argentan, EPNS) and how it is marked.",
        "German silver and nickel silver", "German silver",
        "German silver looks like silver and has none in it. Here is what it is, its other names, and the marks that tell you.",
        "German silver, also called nickel silver, is an alloy of copper, nickel and zinc with no silver in it. It is marked with one of its names, such as NICKEL SILVER or ALP, or EPNS when it has been electroplated with a thin coat of silver. It is not the same as solid silver made in Germany, which carries a number such as 800.",
        body, faqs,
        "Photograph the marks. The Advisor reads NICKEL SILVER, EPNS and the maker's name, records the item as plate or base metal, and says so plainly.",
        ["nbs100", "eb1911gs", "meyers_ns", "usc296", "cfr235", "de1884", "de1886"],
        about="German silver (nickel silver)",
    )


# ── 4. Coin silver ────────────────────────────────────────────────────────────

def coin_silver():
    body = f"""      <p>Coin silver is American silver made to the standard of the country's silver coin, about 900 parts in 1000. It is solid silver, a little lower than sterling's 925, and it was the usual American standard until the 1850s and 1860s, when makers moved to sterling.</p>
      {marksdb.grid(["coin-word-us", "pure-coin-word-us", "standard-word-us", "silver-fineness-900"])}
      <h2 id="standard">The coin standard</h2>
      <ul>
        <li><strong>1792 to 1837:</strong> the Coinage Act of 1792 set silver coin at 1485 parts fine to 179 parts alloy, which is 892.4 in 1000.</li>
        <li><strong>From 1837:</strong> an Act of that year changed it to 900 in 1000.</li>
      </ul>
      <p>Coin silver followed the coin of its day, so silver marked COIN before 1837 may be at the lower standard. The name is about the standard: it doesn't mean the item was made from melted coins.</p>
      <h2 id="marks">How coin silver is marked</h2>
      <ul>
        <li><strong>COIN,</strong> stamped beside the maker's mark, saying the metal was of the same fineness as silver money.</li>
        <li><strong>PURE COIN,</strong> or PURE SILVER COIN, seen on New England silver.</li>
        <li><strong>STANDARD,</strong> found on silver made around Philadelphia.</li>
        <li><strong>Only a maker's name or initials.</strong> A separate mark for the metal was not the custom, and a maker's mark says nothing about the metal on its own.</li>
      </ul>
      <p>These words were the maker's own choice, and makers used different terms for their alloys. Since the Stamping Act of 1906 the law has set a standard for the word: an item marked COIN or COIN SILVER must be at least 900 in 1000, within four parts.</p>
      <h2 id="sterling">From coin to sterling</h2>
      <p>American makers began stamping STERLING in the late 1850s, and by the 1860s most had moved to the sterling standard of 925. See <a href="/marks/silver-purity-marks">what 925 and 900 mean</a>.</p>
      <h2 id="limits">What the marks can't tell you</h2>
      <ul>
        <li><strong>A maker's name doesn't make silver coin silver,</strong> and plenty of American silver of the period carries no word about the metal. Only a test of the metal settles the standard.</li>
        <li><strong>A mark is a claim,</strong> about the maker and the metal alike. Heirloom never decides whether an item is genuine.</li>
      </ul>
      {MORE}"""
    faqs = [
        ("What is coin silver?",
         "<p>American silver made to the standard of US silver coin: 892.4 parts in 1000 before 1837 and 900 after. It is solid silver, slightly below sterling, and was usual until the 1850s and 1860s.</p>"),
        ("Is coin silver real silver?",
         "<p>Yes. It is solid silver at about 90%, a little less than sterling's 92.5%. It is not plate.</p>"),
        ("Was coin silver made from melted coins?",
         "<p>The name refers to the standard: the metal was of the same fineness as silver money. It does not mean an item was made from coins.</p>"),
        ("What is the difference between coin silver and sterling?",
         "<p>Sterling is 925 parts silver in 1000; coin silver is 900, or 892.4 before 1837. American makers moved from coin to sterling in the 1850s and 1860s.</p>"),
    ]
    return build_page(
        "/marks/coin-silver",
        "Coin Silver: What It Is and How It's Marked | Heirloom",
        "American coin silver: the 892 and 900 coin standards of 1792 and 1837, the COIN, PURE COIN and STANDARD marks, and the move to sterling in the 1850s and 1860s.",
        "Coin silver: what it is and how it's marked", "Coin silver",
        "Before sterling, most American silver was made to the standard of the coin in people's pockets. Here is what that means and how to read the marks.",
        "Coin silver is American silver made to the standard of US silver coin: 892.4 parts in 1000 under the Coinage Act of 1792, and 900 from 1837. It is marked COIN, PURE COIN or STANDARD beside the maker's mark, or often with the maker's name alone. American makers moved to sterling (925) in the 1850s and 1860s.",
        body, faqs,
        "Photograph the marks. The Advisor reads the maker's name and any word such as COIN, keeps them on the item's record with the photo, and says when a mark tells nothing about the metal.",
        ["coinage1792", "coinage1837", "french1917", "yale_kossack", "currier1938", "bigelow1917", "cw2008", "usc296", "cfr235"],
        about="Coin silver",
    )


# ── 5. Britannia silver ───────────────────────────────────────────────────────

def britannia():
    body = f"""      <p>Britannia silver is a higher standard than sterling: 958 parts of silver in 1000 against sterling's 925. From 1697 to 1720 it was the only standard English silversmiths could use, and it has been allowed alongside sterling ever since.</p>
      <h2 id="why">Why it began</h2>
      <p>By the 1690s so much coin was being melted down for plate that silver coin had grown scarce. An Act of 1696 raised the standard for wrought plate above the coinage, so that coin could no longer be turned straight into plate. The new standard was 11 ounces 10 pennyweights of silver in the pound troy, against the sterling coin standard of 11 ounces 2 pennyweights.</p>
      <h2 id="marks">The marks</h2>
      <ul>
        <li><strong>The figure of Britannia</strong> in place of the lion passant.</li>
        <li><strong>A lion's head erased</strong> in place of London's leopard's head.</li>
        <li><strong>The maker's mark</strong> as the first two letters of the maker's surname.</li>
        <li><strong>A date letter,</strong> as before. See the <a href="/marks/london-date-letters">London date letters</a>.</li>
      </ul>
      {marksdb.grid(["britannia-figure", "lions-head-erased", "lion-passant-guardant", "leopards-head-crowned"], captions={"britannia-figure": "Britannia, in place of the lion", "lions-head-erased": "Lion's head erased, in place of the leopard's head", "lion-passant-guardant": "Lion passant guardant: the sterling mark Britannia replaced", "leopards-head-crowned": "Leopard's head crowned: the London mark it replaced"})}
      <h2 id="dates">When it was used</h2>
      <ul>
        <li><strong>1697 to 1720, compulsory.</strong> Jackson gives the new marks as in use from 27 March 1697 until 1 June 1720. The Act restoring sterling was passed in 1719, which is the year Chaffers gives; it took effect in 1720.</li>
        <li><strong>1720 on, optional.</strong> Sterling came back because the higher standard was too soft for hard wear, but makers kept the choice of Britannia, and still have it.</li>
        <li><strong>Today.</strong> The UK standard is written 958 (958.4 in the Act), and the figure of Britannia is an optional mark beside the number.</li>
      </ul>
      <h2 id="metal">Britannia silver is not Britannia metal</h2>
      <p>Britannia metal is an alloy of tin with antimony and a little copper, close to pewter, with no silver in it. It was used for spoons, forks and other tableware. The shared name causes confusion: Britannia silver is marked with the figure of Britannia or 958, and Britannia metal carries neither.</p>
      {MORE}"""
    faqs = [
        ("What is Britannia silver?",
         "<p>Silver of at least 958 parts in 1000, a higher standard than sterling (925). It was compulsory in England from 1697 to 1720 and has been an optional standard since.</p>"),
        ("What does the Britannia mark on silver mean?",
         "<p>The figure of Britannia means the silver is of the Britannia standard, 958. Between 1697 and 1720 it appears with a lion's head erased in place of the leopard's head.</p>"),
        ("Is Britannia silver better than sterling?",
         "<p>It has more silver in it, which also makes it softer. That softness is why sterling was restored as the usual standard in 1720.</p>"),
        ("Is Britannia metal silver?",
         "<p>No. Britannia metal is a tin alloy, close to pewter, with no silver in it.</p>"),
    ]
    return build_page(
        "/marks/britannia-silver",
        "Britannia Silver: The 958 Standard and Its Marks, 1697 to Today | Heirloom",
        "Britannia silver is 958 silver, a higher standard than sterling: why it began in 1697, its marks (Britannia and the lion's head erased), and how it differs from Britannia metal.",
        "Britannia silver: the 958 standard and its marks", "Britannia silver",
        "Britannia silver has more silver in it than sterling. Here is why it began, how it is marked, and how to tell it from Britannia metal.",
        "Britannia silver is 958 parts silver in 1000, against sterling's 925. It was the compulsory standard for English silver from 1697 to 1720, marked with a seated figure of Britannia and a lion's head erased, and has been an optional standard since. Britannia metal is something else: a tin alloy with no silver.",
        body, faqs,
        "Photograph the marks. The Advisor reads the Britannia figure, the town mark and the date letter, dates them from the same tables as these pages, and keeps the date on the item's record.",
        ["jackson", "chaffers", "ukact", "ukguide", "eb1911sb", "meyers_bm"],
        about="Britannia silver",
    )


def build():
    return [real_silver(), purity(), german_silver(), coin_silver(), britannia()]


CHILDREN = [
    ("/marks/is-it-real-silver", "Silver or silver plate?", "Which marks say sterling or coin silver, which say plate, and what no mark can tell you."),
    ("/marks/silver-purity-marks", "What 925, 800 and 900 mean", "The numbers on silver, and the common standards by country."),
    ("/marks/german-silver", "German silver and nickel silver", "No silver in it: what it is, its names and how it is marked."),
    ("/marks/coin-silver", "Coin silver", "American silver at the coin standard, and its marks."),
    ("/marks/britannia-silver", "Britannia silver", "The 958 standard of 1697, its marks, and Britannia metal."),
]
