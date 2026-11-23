"""Marks from beyond the British date letters: gold karat and fineness marks,
Mexican, French, Gorham and Christofle silver.

These pages are written by hand: each fact is taken from at least two published
sources, listed on its page. Every mark shown comes from its marks-database entry
(marksdb.py): one image of that mark alone, or its description in words.
"""
from shell import *
from p_marks import MID, cta, e
import marksdb

CSS = '<link rel="stylesheet" href="/marks/marks.css">'



def sources(items):
    """Citations, not claims: the copy check skips them."""
    lis = "".join(
        f"<li>{text}" + (f' (<a href="{e(url)}" rel="nofollow">source</a>)' if url else "") + "</li>"
        for text, url in items
    )
    return f'<!--copy-check:skip--><ul class="sources">{lis}</ul><!--/copy-check:skip-->'


def table(head, rows):
    th = "".join(f'<th scope="col">{h}</th>' for h in head)
    trs = "".join("<tr>" + f'<th scope="row">{r[0]}</th>' + "".join(f"<td>{c}</td>" for c in r[1:]) + "</tr>" for r in rows)
    return f'<div class="table-wrap"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>'


def build_page(path, title, desc, h1, crumb, lede, answer, sections, srcs, cavs, faqs, cta_text):
    body = f"""      <p class="guide__lede">{lede}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{answer}</p>
      </div>
{sections}
      <h2 id="caveats">Read these before you rely on a mark</h2>
      <ul>{"".join(f"<li>{c}</li>" for c in cavs)}</ul>
      <h2 id="sources">Sources</h2>
      <p>Each fact on this page is supported by at least two of these. Where they disagree, the page gives both readings.</p>
      {sources(srcs)}
{cta(cta_text)}
      <h2 id="faq">Questions</h2>
{faq_html(faqs)}
"""
    graph = [article_ld(path, h1, desc, extra={"about": {"@type": "Thing", "name": crumb}}), faq_ld(path, faqs)]
    return path, page(path, title, desc, h1, body, graph, mid=MID, crumb_name=crumb, extra_head=CSS)


# ── Gold ──────────────────────────────────────────────────────────────────────

GOLD_SRC = {
    "hma2": ("Hallmarking Act 1973, Schedule 2 (current text and as enacted), legislation.gov.uk", "https://www.legislation.gov.uk/ukpga/1973/43/schedule/2"),
    "hma1": ("Hallmarking Act 1973, Schedule 1, legislation.gov.uk", "https://www.legislation.gov.uk/ukpga/1973/43/schedule/1"),
    "si1998": ("The Hallmarking (Hallmarking Act Amendment) Regulations 1998, SI 1998/2978, in force January 1, 1999", "https://www.legislation.gov.uk/uksi/1998/2978/made"),
    "bhc": ("British Hallmarking Council, <cite>Guidance on Fineness Description</cite> (2014)", "https://assets.publishing.service.gov.uk/media/5a7f05baed915d74e6227f54/bhc-guidance-on-fineness-april-2014.pdf"),
    "gov": ("UK Government, <cite>Hallmarking is the law: guidance summary</cite>", "https://www.gov.uk/government/publications/hallmarking-guidance-notes/hallmarking-is-the-law-guidance-summary"),
    "aol": ("The Goldsmiths' Company Assay Office, London, <cite>History of hallmarking</cite>", "https://www.assayofficelondon.co.uk/about-us/history-of-hallmarking"),
    "bao": ("Birmingham Assay Office, timeline: 1932", "https://www.theassayoffice.co.uk/timeline-post/1932/"),
    "sao": ("Sheffield Assay Office, <cite>History</cite>", "https://www.assayoffice.co.uk/about-us/history"),
    "chaffers": ("W. Chaffers, <cite>Handbook to Hall Marks on Gold and Silver Plate</cite> (London, 1924), public domain", "https://archive.org/details/ChaffersHandbookToHallMarks"),
    "jackson": ("C. J. Jackson, <cite>English Goldsmiths and Their Marks</cite> (London: Macmillan, 1905), public domain", "https://archive.org/details/englishgoldsmith00jack"),
    "lbma": ("London Bullion Market Association, <cite>Purity of gold</cite>", "https://www.lbma.org.uk/wonders-of-gold/items/purity-of-gold"),
    "bis": ("Bureau of Indian Standards, <cite>Hallmarking FAQs</cite> (IS 1417 grades)", "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/hallmarking-faq/?lang=en"),
    "feingehg": ("Gesetz über den Feingehalt der Gold- und Silberwaren (Germany, 1884, as amended)", "https://www.gesetze-im-internet.de/feingehg/BJNR001200884.html"),
    "adin": ("Adin Antique Jewelry, <cite>Alloys and metal standards</cite>", "https://www.antiquejewel.com/jewellery-studies/006-alloys-and-metal-standards"),
    "usc": ("National Gold and Silver Stamping Act, 15 U.S.C. 291–300 (sections 294, 295, 297), Cornell Legal Information Institute and govinfo.gov", "https://www.law.cornell.edu/uscode/text/15/295"),
    "cfr": ("Federal Trade Commission, <cite>Guides for the Jewelry, Precious Metals, and Pewter Industries</cite>, 16 CFR 23.3 and 23.4 (current)", "https://www.law.cornell.edu/cfr/text/16/23.3"),
    "cfr2012": ("16 CFR 23.4, 2012 edition (the guides before the 2018 revision)", "https://www.govinfo.gov/content/pkg/CFR-2012-title16-vol1/xml/CFR-2012-title16-vol1-sec23-4.xml"),
    "ftc2018": ("Federal Trade Commission, final revision of the Jewelry Guides, Federal Register 83 (159), August 16, 2018", "https://www.govinfo.gov/content/pkg/FR-2018-08-16/html/2018-17454.htm"),
    "hmc": ("The Hallmarking Convention, <cite>The Common Control Mark</cite>", "https://www.hallmarkingconvention.org/en/about/the-common-control-mark"),
}


def gold():

    rows = [
        ("8 karat", "333.3", "333", "Germany allows it on jewelry; often seen on German gold"),
        ("9 karat", "375", "375", "A UK legal standard since 1854 (as 9 and .375 until 1975)"),
        ("10 karat", "416.7", "417 or 10K", "Common in the US, where marks are usually in karats"),
        ("14 karat", "583.3", "585 (sometimes 583)", "A UK legal standard since 1932; India's 14K585 grade"),
        ("18 karat", "750", "750", "A UK legal standard since 1798; India's 18K750 grade"),
        ("20 karat", "833.3", "833", "India's 20K833 grade"),
        ("22 karat", "916.7", "916 (UK law writes 916.6)", "A UK legal standard; India's 22K916 grade"),
        ("23 karat", "958.3", "958", "India's 23K958 grade"),
        ("24 karat", "1000", "999, 995 or 990", "Fine gold; no stamped item is quite pure, so 999 is the usual top"),
    ]
    plated = [
        ("Gold filled, GF, gold overlay", "A layer of gold alloy of at least 10 karat bonded to a base metal by heat and pressure, making up at least 1/20 of the weight of all the metal", "1/20 12K GF: the layer is 12 karat and is 1/20 of the metal's weight"),
        ("Rolled gold plate, RGP", "The same bonded layer, but thinner: at least 1/40 of the weight", "1/40 10K RGP; the old guides give 14K. R.G.P. as an example"),
        ("Gold electroplate", "A layer of at least 10 karat gold put on by electrolysis, at least 0.175 microns of fine gold thick (about 7 millionths of an inch)", "Often stamped GE or GEP; the abbreviation is trade usage, not in the guides"),
        ("Heavy gold electroplate", "The same, at least 2.5 microns of fine gold (about 100 millionths of an inch)", "Often stamped HGE"),
        ("Vermeil", "Sterling silver coated with gold of at least 10 karat, at least 2.5 microns thick", "925 with a gold surface"),
        ("Gold flashed, gold washed", "Thinner than electroplate. The FTC allowed these words for very thin plating until 2018, and no longer does", "A karat mark on a thin plated item says nothing about its body"),
    ]
    sections = f"""      <h2 id="numbers">What the numbers on gold mean</h2>
      <p>A karat counts parts of pure gold out of 24, by weight: 24 karat is pure gold, 18 karat is 18 parts gold in 24. A three-figure number counts the same thing in parts per thousand: 750 is 750 parts gold in 1,000, which is 18 karat. To turn karats into thousandths, divide by 24 and multiply by 1,000.</p>
      {table(["Karat", "Exact thousandths", "Usually stamped", "Where you see it"], rows)}
      <h3>Why 585 and not 583</h3>
      <p>14 divided by 24 is 0.5833, so the exact figure for 14 karat is 583. The usual stamp, and the legal 14 karat standard in the UK and India, is 585, slightly above it. Both are 14 karat. 583 appears on some older gold, including gold marked in the Soviet Union:</p>
{marksdb.grid(['soviet-gold-star-583'])}
      <h2 id="us">Karat marks in the US</h2>
      <p>American gold is usually marked in karats: 10K, 14K, 18K. Since 1906 the National Gold and Silver Stamping Act has made it an offense to ship gold marked finer than it is. Today a gold item may fall short of its mark by no more than 3 parts per thousand when tested without solder, or 7 parts per thousand tested whole with its solder (3 for watch cases and flatware). Before the law changed in 1976 (in force 1981), the allowance was half a karat, or one karat with solder, so older gold can test a little below its stamp.</p>
      <p>Since 1961, whoever stamps a quality mark such as 14K must also stamp their name or a registered trademark next to it, at least as large. A karat mark with no maker's mark beside it on American gold made after that is a reason to look more closely.</p>
      <p>The Federal Trade Commission's guides say the word gold alone means pure gold; an alloy must give its karat right beside the word, as in 14K or 14 karat gold. Until 2018 the guides also said gold under 10 karat should not be called gold at all. The 2018 revision dropped that floor, as long as the karat is shown, but kept a 10 karat minimum for the gold layer on filled, plated and vermeil items.</p>
      <h2 id="plated">Plated and filled gold marks</h2>
      <p>These marks mean a thin layer of gold over another metal, not gold through and through. The karat in them describes the layer only.</p>
      {table(["Mark", "What it means (FTC guides)", "How it is stamped"], plated)}
      <p>Reading <strong>1/20 12K GF</strong>: the item is gold filled, the gold layer is 12 karat, and the layer makes up one twentieth of the weight of the metal. Since 12 karat is half gold, pure gold is about 2.5% of the metal's weight.</p>
      <p>Under British law, gold below a legal standard may be called gold only with the word plated or rolled, in letters at least as large. In the UK a carat description is taken to mean gold of that fineness, unless it is the weight of a stone.</p>
      <h2 id="british">British gold hallmarks, in brief</h2>
      <p>British gold is hallmarked like silver, with a maker's mark, a fineness mark and an assay office mark, and usually a date letter. The fineness mark changed over time, which dates the gold roughly before you read the letter:</p>
      <ul class="rules">
        <li><strong>To 1798:</strong> gold was 22 carat and carried the lion passant, the same mark as sterling silver.</li>
        <li><strong>1798 on:</strong> 18 carat gold, marked with a crown and the figure 18.</li>
        <li><strong>1844 on:</strong> 22 carat gold, marked with a crown and 22; the lion was no longer used on gold.</li>
        <li><strong>1854 on:</strong> three lower standards, 15, 12 and 9 carat, marked with the carat and its decimal (15 and .625, 12 and .5, 9 and .375) and no crown.</li>
        <li><strong>1932:</strong> 15 and 12 carat ended and 14 carat began.</li>
        <li><strong>1975 on:</strong> the Hallmarking Act 1973 replaced carats with parts per thousand: a crown with 375, 585, 750 or 916 on gold made in the UK. Imported gold had the number without the crown.</li>
        <li><strong>1999 on:</strong> the crown and the date letter became optional. 990 and 999 were added. A UK hallmark now needs only the sponsor's (maker's) mark, the number and the assay office mark. Gold under 1 gram need not be hallmarked.</li>
      </ul>
{marksdb.grid(['british-gold-crown', 'british-gold-18-carat', 'british-gold-22-carat', 'british-gold-15-carat-decimal', 'british-gold-12-carat-decimal', 'british-gold-9-carat-decimal', 'british-gold-14-carat-1932'])}
      <p>The convention mark, a balance-scale outline around a number, comes from a treaty signed in Vienna in 1972. Countries that belong to it accept each other's convention-marked gold and silver without marking it again.</p>
      <p>For the date letter itself, see <a href="/marks/london-date-letters">London</a>, <a href="/marks/birmingham-date-letters">Birmingham</a>, <a href="/marks/sheffield-date-letters">Sheffield</a> and <a href="/marks/chester-date-letters">Chester</a>.</p>"""
    srcs = [GOLD_SRC[k] for k in ("hma2", "hma1", "si1998", "bhc", "gov", "aol", "bao", "sao", "chaffers", "jackson", "lbma", "bis", "feingehg", "adin", "usc", "cfr", "cfr2012", "ftc2018", "hmc")]
    cavs = [
        "A number stamped on gold says what the maker claims. Only a test says what the metal is; stamps are faked and worn, and plated items sometimes carry a bare karat mark they shouldn't.",
        "The karat in a plated or filled mark is the layer's, not the item's.",
        "Tolerances differ by country and period: older American gold could legally test half a karat under its stamp.",
    ]
    faqs = [
        ("What does 585 mean on gold?", "<p>585 means 585 parts of pure gold in every 1,000 parts of the metal: 58.5% gold, which is 14 karat. The exact figure for 14 karat is 583, and some gold is marked that way; both mean 14 karat.</p>"),
        ("What does 750 mean on gold?", "<p>750 means 75% pure gold by weight: 18 karat. It is a legal standard in Britain (since 1975 written 750; before that, 18 with a crown) and in many other countries.</p>"),
        ("Is 375 gold real gold?", "<p>Yes: 375 is 9 karat, 37.5% gold. It has been a legal standard in Britain since 1854.</p>"),
        ("What does 916 mean on gold?", "<p>916 is 22 karat: 91.6% gold. British law writes the standard as 916.6. It is common on gold from India and the Middle East.</p>"),
        ("Is 1/20 12K GF real gold?", "<p>It has real gold on it, but it is not solid gold. GF means gold filled: a 12 karat gold layer bonded over a base metal, making up a twentieth of the metal's weight, so about 2.5% of the metal is pure gold.</p>"),
        ("What does HGE mean on jewelry?", "<p>Heavy gold electroplate: a layer of at least 10 karat gold put on by electroplating, at least 2.5 microns thick, over another metal.</p>"),
    ]
    return build_page(
        "/marks/gold-karat-marks", "Gold Karat Marks: What 585, 750, 375 and 916 Mean | Heirloom",
        "What the numbers on gold mean: 375, 585, 750, 916 and 999 in karats, US 10K and 14K stamps, British crown marks, and the plated and filled marks GF, RGP and HGE.",
        "Gold karat marks: what 585, 750 and 375 mean", "Gold karat marks",
        "The numbers stamped on gold give its fineness, in karats or in parts per thousand. Here is how to read them, and the marks that mean plated or filled.",
        "585 on gold means 585 parts of pure gold per thousand: 14 karat. 750 is 18 karat, 375 is 9 karat, 916 is 22 karat and 999 is pure gold. A karat is one 24th; parts per thousand say the same thing in thousandths. GF, RGP, HGE and a fraction such as 1/20 mean a gold layer over another metal.",
        sections, srcs, cavs, faqs,
        "Photograph the stamp on your gold. The Advisor reads the karat or fineness mark and any hallmarks beside it, and keeps what they say on the item's record.",
    )


# ── Mexico ────────────────────────────────────────────────────────────────────

MX_SRC = [
    ("<cite>Diario Oficial de la Federación</cite>, August 16, 1947: Norma Oficial de Calidad para objetos de plata labrada, D.G.N. B-23-1947, pp. 6–8", "https://www.dof.gob.mx/index_111.php?year=1947&month=08&day=16"),
    ("<cite>Diario Oficial de la Federación</cite>, November 29, 1952: decree making marks compulsory on silver, silver-plated and alpaca articles, p. 2", "https://www.dof.gob.mx/index_111.php?year=1952&month=11&day=29"),
    ("<cite>Diario Oficial de la Federación</cite>, May 7, 1979, July 17, 1979 and December 17, 1980: the Acuerdos and Instructivo on marking gold, silver, platinum and palladium and registering producers", "https://www.dof.gob.mx/index_111.php?year=1980&month=12&day=17"),
    ("<cite>Diario Oficial de la Federación</cite>, September 17, 1991: decree repealing the compulsory-marks decrees", "https://www.dof.gob.mx/index_111.php?year=1991&month=09&day=17"),
    ("NOM-033-SCFI-1994 (July 12, 1994; reissued December 21, 1995), as summarized in the theses below", None),
    ("NOM-033/1-SE-2020, <cite>Artículos de oro, plata, platino y paladio</cite>, Diario Oficial de la Federación", "https://dof.gob.mx/nota_detalle_popup.php?codigo=5638887"),
    ("Secretaría de Economía, form SE-FO-04-013: application for a contraste registration number (2018)", "https://www.gob.mx/cms/uploads/attachment/file/425880/SE-FO-04-013_17102018_editable.pdf"),
    ("C. A. Ceballos de la Mora, <cite>Irregularidad jurídica en la comercialización de metales nobles</cite>, law thesis, Universidad La Salle, 1996, pp. 112–145", "https://ru.dgb.unam.mx/bitstream/20.500.14330/TES01000236559/3/0236559.pdf"),
    ("A. C. Hurtado Alcaraz, master's thesis on quality certification in Taxco silver, UNAM, 2018", "https://ru.dgb.unam.mx/bitstream/20.500.14330/TES01000769259/3/0769259.pdf"),
    ("S. A. Martínez Hernández, <cite>Caracterización geoeconómica de la actividad artesanal platera en Taxco de Alarcón</cite>, UNAM thesis, 2015, pp. 126–139", "https://ru.dgb.unam.mx/bitstream/20.500.14330/TES01000736198/3/0736198.pdf"),
    ("<cite>Revista 925 Artes y Diseño</cite> (UNAM, Taxco), no. 29, 2021, including P. C. Morrill on Margot de Taxco", "https://revista925taxco.fad.unam.mx/pdf/925artesydiseno_08_29.pdf"),
    ("Museum of Fine Arts, Boston: records for Margot de Taxco (2014.1785, 2018.4081), William Spratling (2000.793.1, 2016.182, 2016.545, 2016.177) and Héctor Aguilar (candelabra), marks fields", "https://collections.mfa.org/objects/605869"),
    ("Art Institute of Chicago: William Spratling (274261, 274262) and Héctor Aguilar (274263–274265), inscriptions fields", "https://www.artic.edu/artworks/274263"),
    ("Los Angeles County Museum of Art: Spratling, Los Castillo, Margot de Taxco and Aguilar records, curatorial notes; and <cite>Modern Mexican Silver</cite>, LACMA Unframed, 2013", "https://unframed.lacma.org/node/1130"),
    ("Newark Museum of Art: Antonio Pineda bracelet, 2017.67.25", "https://collections.newarkmuseumart.org/objects/222307/bracelet"),
    ("Real Academia Española, <cite>Diccionario de la lengua española</cite>, “alpaca”", "https://dle.rae.es/alpaca"),
    ("<cite>Encyclopaedia Britannica</cite>, “nickel silver”", "https://www.britannica.com/technology/nickel-silver"),
]


def mexico():
    rows = [
        ("1947", "The first official silver standard: 925 minimum for jewelry and hollowware (900 allowed for flatware). Silver made to be sold had to be assayed and stamped with its fineness and the producer's number or registered mark."),
        ("1952", "A decree made marks compulsory on silver, silver plate and alpaca: the maker's name, the fineness (or the word plateado or alpaca), the workshop's town, and Hecho en México on Mexican work."),
        ("1979–1980", "Each producer registered with the government's standards office and received a number. From 1980 each item had to show its fineness, that registration number, and Hecho en México or México."),
        ("1991", "The 1952 decree was repealed."),
        ("1994 on", "The official standard NOM-033 (reissued 1995; replaced by NOM-033/1-SE-2020): 925, Sterling or Ag with the number, the producer's registration number or logo, and the country of origin."),
    ]
    sections = f"""      <h2 id="law">Mexico's marking laws, in order</h2>
      <p>Mexican silver marks follow a string of laws published in the government's <cite>Diario Oficial</cite>. Each one added to what a maker had to stamp, which is why the marks help date an item:</p>
      {table(["Year", "What it required"], rows)}
      <h2 id="words">What the words mean</h2>
      <ul class="rules">
        <li><strong>925 or Sterling:</strong> at least 925 thousandths silver, the legal minimum for Mexican silver jewelry and hollowware since 1947. The two words mean the same.</li>
        <li><strong>A higher number, such as 940 or 980:</strong> some Taxco workshops worked above the minimum. Héctor Aguilar's marks read 940, and early Spratling silver 980.</li>
        <li><strong>Hecho en México, México, Made in Mexico:</strong> the country of origin, required on Mexican work from 1952 and again from 1979–1980.</li>
        <li><strong>Taxco:</strong> the town of the workshop. The 1952 decree asked for the workshop's location, and Taxco makers stamped it.</li>
        <li><strong>Alpaca:</strong> not silver. Alpaca is nickel silver, an alloy of copper, nickel and zinc that looks like silver and contains none. The 1952 decree treated it as a class of its own.</li>
      </ul>
      <h2 id="eagle">The eagle mark</h2>
      <p>On Mexican silver of the 1950s and 1960s you often find a small stamp of an eagle with a number in it. Museums call it the eagle assay mark, and date silver with it from about 1948 into the 1960s. It fits the 1947 standard, which asked for each item to be assayed and stamped with the producer's number.</p>
      <p><strong>What the number means is disputed.</strong> Museum records show a different number for each Taxco workshop: 9 on Héctor Aguilar's silver (Art Institute of Chicago), 16 on Margot de Taxco's (Museum of Fine Arts, Boston) and 30 on William Spratling's (Art Institute of Chicago). That points to a number for the maker. Some guides instead read low numbers as a city, such as 3 for Taxco; no official or museum source found for this page supports that reading.</p>
      <p>The years usually given for the eagle, 1948 to 1980, are not stated in any official text found for this page. What is certain is the frame around them: the duty to stamp a producer's number dates from 1947, and the registration numbers of 1979–1980 replaced the old system. No open-license photograph of these marks was found, so the cards below describe them in words.</p>
      {marksdb.grid(['mexico-eagle-assay-mark', 'mexico-hecho-en-mexico', 'mexico-registration-code', 'mexico-alpaca'])}
      <h2 id="codes">Letter-and-number codes, from 1980</h2>
      <p>From 1980 the law required the producer's government registration number on Mexican silver, and the current standard still does. On Taxco silver these appear as codes of two letters and a number, such as TS-24, often beside 925 and México. Collectors' guides read the first letter as the city (T for Taxco) and the second as the maker's surname; that reading is widely repeated, but no official or museum source found here explains how the codes were built. The code identifies a registered maker, not a year.</p>
      <h2 id="taxco">Taxco and its makers</h2>
      <p>Taxco's silver revival began with William Spratling (1900–1967), an American architect who settled there in 1929 and began making silver in 1931. Many of his craftsmen later opened their own workshops. A few makers' marks are recorded by more than one museum:</p>
      <ul class="rules">
        <li><strong>William Spratling:</strong> a conjoined WS monogram, often in a round mark reading SPRATLING and MADE IN MEXICO, with TAXCO and the fineness. Museums note that his marks changed slightly over time, which helps date his silver.</li>
        <li><strong>Héctor Aguilar (Taller Borda, from 1939):</strong> a conjoined HA, with TAXCO and 940.</li>
        <li><strong>Los Castillo:</strong> founded by the Castillo brothers, who trained with Spratling; LACMA dates it to 1939, the Museum of Fine Arts, Boston to 1942.</li>
        <li><strong>Margot de Taxco:</strong> the workshop of Margot van Voorhies Carr, from 1946, known for enamel; marked MARGOT DE TAXCO with a model number.</li>
      </ul>
      <p>These are artists' and studio marks: they are shown here only as photographs, never redrawn, and no open-license photograph of them has been found yet.</p>
      {marksdb.grid(['spratling-ws-mark', 'aguilar-ha-mark', 'margot-de-taxco-mark', 'los-castillo-mark', 'pineda-antonio-crown-mark'])}"""
    cavs = [
        "Mexican marks are widely copied, and Spratling's most of all. A mark gives what the item claims; a specialist can tell more.",
        "The eagle's dates and the meaning of its number, and how the letter codes were built, rest on collectors' guides rather than official sources; the page says so where it matters.",
        "925 and México stamped on an item say it was sold as Mexican sterling. Only a test says what the metal is.",
    ]
    faqs = [
        ("What does 925 Mexico mean on silver?", "<p>It means sterling silver, at least 925 thousandths, made in Mexico. Mexican law has required the fineness and the country on silver since the 1950s, and from 1980 a maker's registration number beside them.</p>"),
        ("What does the eagle mark on Mexican silver mean?", "<p>It is an assay mark used on Mexican silver from about 1948, with a number inside. Museum records show a different number for each Taxco workshop, so the number most likely identifies the maker. Many guides date it 1948 to 1980.</p>"),
        ("What does TM or TS with a number mean on Mexican silver?", "<p>A maker's government registration code, required on Mexican silver from 1980. The T is usually read as Taxco. It identifies the registered maker, not the year.</p>"),
        ("Is Mexican alpaca silver?", "<p>No. Alpaca is nickel silver: copper, nickel and zinc, with no silver in it. Mexican law has kept it separate from silver since 1952.</p>"),
    ]
    return build_page(
        "/marks/mexican-silver-marks", "Mexican Silver Marks: Taxco, 925 Mexico and the Eagle | Heirloom",
        "Read Mexican and Taxco silver marks: 925 and Sterling, Hecho en México, the eagle assay mark and its number, TS-24 style registration codes from 1980, and alpaca.",
        "Mexican silver marks: Taxco, 925 Mexico and the eagle", "Mexican silver marks",
        "Mexican silver marks follow a run of laws from 1947 to today. Here is what each word, number and code means, from the laws themselves and museum records.",
        "925 or Sterling with México means Mexican sterling silver, at least 925 thousandths. An eagle with a number is the assay mark of about 1948 into the 1960s; museum records tie its number to the maker. From 1980 Mexican silver carries a registration code such as TS-24, which names the maker, not the year. Alpaca is not silver.",
        sections, MX_SRC, cavs, faqs,
        "Photograph the marks on your Mexican silver. The Advisor reads the fineness, the eagle, any registration code and the maker's mark, and keeps what they say on the item's record.",
    )


# ── Germany ───────────────────────────────────────────────────────────────────

DE_SRC = [
    ("Gesetz über den Feingehalt der Gold- und Silberwaaren, July 16, 1884, <cite>Reichsgesetzblatt</cite> 1884 no. 21, pp. 120–122, transcribed on German Wikisource", "https://de.wikisource.org/wiki/Gesetz_%C3%BCber_den_Feingehalt_der_Gold-_und_Silberwaaren"),
    ("The same law as now in force (FeinGehG), Federal Ministry of Justice, gesetze-im-internet.de", "https://www.gesetze-im-internet.de/feingehg/BJNR001200884.html"),
    ("Bekanntmachung on the form of the fineness stamp, January 7, 1886 (FeinGehStempG), gesetze-im-internet.de", "https://www.gesetze-im-internet.de/feingehstempg/BJNR000010886.html"),
    ("M. Rosenberg, <cite>Der Goldschmiede Merkzeichen</cite>, 3rd ed., vol. 1 (Frankfurt, 1922), pp. 3–5, public domain", "https://archive.org/details/dergoldschmiede00rosegoog"),
    ("<cite>Meyers Konversations-Lexikon</cite>, 4th ed., vol. 6 (1887), p. 104, “Feingehalt”", "https://de.wikisource.org/wiki/MKL1888:Feingehalt"),
    ("<cite>Brockhaus and Efron Encyclopedic Dictionary</cite>, vol. 25 (St Petersburg, 1898), “Proba”, its note on Germany", "https://ru.wikisource.org/wiki/%D0%AD%D0%A1%D0%91%D0%95/%D0%9F%D1%80%D0%BE%D0%B1%D0%B0_%D0%B8_%D0%BF%D1%80%D0%BE%D0%B1%D0%B8%D1%80%D0%BD%D0%BE%D0%B5_%D0%B4%D0%B5%D0%BB%D0%BE"),
    ("Victoria and Albert Museum, cup designed by Peter Behrens, about 1900, O136991 (crescent moon and crown under the base)", "https://collections.vam.ac.uk/item/O136991/"),
]


def germany():
    sections = f"""      <h2 id="mark">The crescent and crown</h2>
      <p>A German law of July 16, 1884, in force from January 1, 1888, set one stamp for the whole German Empire. A notice of January 7, 1886 fixed its form: the imperial crown beside a crescent moon for silver, or the crown inside a sun for gold, together with the fineness in thousandths and the name or registered trademark of the firm that had the item stamped.</p>
{marksdb.grid(['german-crescent-and-crown', 'germany-gold-crown-in-sun'])}
      <h2 id="read">What it tells you, and what it doesn't</h2>
      <ul class="rules">
        <li><strong>800 or more:</strong> if a fineness was stated on silver, it could not be under 800 thousandths (on gold, 585). The law allowed 8 thousandths short on silver. 800 is the commonest; 835 and 925 also occur.</li>
        <li><strong>Made in 1888 or later:</strong> the mark was not in use before January 1, 1888. Before that, German silver carried its town's mark and its maker's mark under each state's own rules.</li>
        <li><strong>Marked by the maker, not an assay office:</strong> the law named no office to test or stamp silver. The firm stamped it and answered for it, and firms made their own punches, so the crescent and crown vary a little in shape.</li>
        <li><strong>Optional:</strong> the law let silver be made at any fineness and sold unmarked. The stamp was required only on silver that stated its fineness. So German silver without the mark is common.</li>
        <li><strong>Not on jewelry:</strong> jewelry could be stamped with its fineness in thousandths, but not with the crescent and crown. The mark means a silver item for the table or home: tableware, a cup, a box, a watch case.</li>
        <li><strong>Still law:</strong> the 1884 law and the 1886 notice are still on Germany's statute book, last amended in 2015.</li>
      </ul>
      <p>“German silver” on its own, without a number, is a different thing: nickel silver, a copper, nickel and zinc alloy with no silver in it. It never carries the crescent and crown.</p>"""
    cavs = [
        "The mark was struck by the firm that sold the silver, not tested by an assay office, so the number is the maker's claim.",
        "Many common sources say the mark was compulsory from 1888. The law's text says it was required only on silver marked with its fineness.",
        "The sources found do not say when German firms stopped using the mark in practice.",
    ]
    faqs = [
        ("What does a crescent moon and crown mean on silver?", "<p>It is the German mark for silver of a stated fineness, used from 1888: the crescent and the imperial crown, beside a number such as 800 or 925 and the maker's mark. It means German silver of at least 800 thousandths, stamped by the maker.</p>"),
        ("Is 800 German silver real silver?", "<p>Yes. 800 means 80% silver. With the crescent and crown beside it, the maker was stating at least 800 thousandths. “German silver” with no number is nickel silver and has no silver in it.</p>"),
        ("How old is silver with the crescent and crown?", "<p>It was made on or after January 1, 1888, when the mark came into use. The mark alone doesn't narrow it further; the maker's mark and the style of the item do.</p>"),
    ]
    return build_page(
        "/marks/german-silver-marks", "German Silver Marks: The Crescent and Crown with 800 | Heirloom",
        "The German crescent moon and crown mark on silver from 1888: what the 800 or 925 beside it means, who struck it, and why much German silver has no such mark.",
        "German silver marks: the crescent and crown", "German silver marks",
        "From 1888, German silver that stated its fineness carried a crescent moon and a crown beside the number. Here is what the mark tells you, from the law that created it.",
        "A crescent moon beside a crown, with a number such as 800 or 925, is the German mark for silver, used from January 1, 1888 under a law of 1884. The number is the fineness in thousandths and was never under 800. The maker stamped it, not an assay office, and it was required only on silver that stated its fineness.",
        sections, DE_SRC, cavs, faqs,
        "Photograph the marks on your silver. The Advisor reads the crescent, the crown, the number and the maker's mark, and keeps what they say on the item's record.",
    )


# ── Russia ────────────────────────────────────────────────────────────────────

RU_SRC = [
    ("<cite>Brockhaus and Efron Encyclopedic Dictionary</cite>, vol. 25 (St Petersburg, 1898), pp. 306–310, “Proba i probirnoe delo”, public domain", "https://ru.wikisource.org/wiki/%D0%AD%D0%A1%D0%91%D0%95/%D0%9F%D1%80%D0%BE%D0%B1%D0%B0_%D0%B8_%D0%BF%D1%80%D0%BE%D0%B1%D0%B8%D1%80%D0%BD%D0%BE%D0%B5_%D0%B4%D0%B5%D0%BB%D0%BE"),
    ("<cite>Granat Encyclopedic Dictionary</cite>, vol. 33 (Moscow, 1916), cols. 497–498, “Proba”, public domain", "https://ru.wikisource.org/wiki/%D0%AD%D0%A1%D0%93/%D0%9F%D1%80%D0%BE%D0%B1%D0%B0"),
    ("Federal Assay Chamber of the Russian Federation, history of assay marks", "https://probpalata.gov.ru/about/history/"),
    ("A. Maskell, <cite>Russian Art and Art Objects in Russia</cite> (London: South Kensington Museum, 1884), pp. 145–146, public domain", "https://archive.org/details/gri_33125007742394"),
    ("M. F. Dubrovin, on the marks of Moscow assay masters in the late 19th century, <cite>Gramota</cite> 2018 no. 3, p. 129", "https://doi.org/10.30853/manuscript.2018-3.24"),
    ("A. O. Bekker and M. F. Dubrovin, on assay masters' marks of 1895–1896, <cite>Manuscript</cite> 2019 no. 11", "https://doi.org/10.30853/manuscript.2019.11.57"),
    ("Victoria and Albert Museum records: ladle, 1865 (O94664); box (O95094); cup, Moscow 1775 (O91386); brooch by August Hollming (O299139); Fabergé cigarette case (O152721)", "https://collections.vam.ac.uk/item/O94664/"),
    ("Hillwood Estate, Museum and Gardens records: Fabergé coffeepot, Moscow 1908–1917 (12.566.2); ashtray (12.163); vodka cup (12.141); pen holder (12.403)", "https://hillwoodmuseum.org/collection/item/12.566.2"),
    ("Fabergé Research Site, hallmarks notes after Lowes and McCanless, <cite>Fabergé Eggs: A Retrospective Encyclopedia</cite>", "https://fabergeresearch.com/workmasters/"),
    ("The Metropolitan Museum of Art: candlestick, Moscow, about 1780 (2004.80); standing cup by Basil Nikiforoff, Moscow, 1737 (25.15.32)", "https://www.metmuseum.org/art/collection/search/231012"),
]


def russia():
    rows = [
        ("84", "875", "The commonest Russian silver standard"),
        ("88", "916 (917 rounded)", "A higher standard, often on Fabergé silver"),
        ("91", "947", "The highest of the three"),
    ]
    sections = f"""      <h2 id="zolotnik">The numbers: zolotniks, not thousandths</h2>
      <p>Before 1927, Russian fineness was counted in zolotniks: the parts of pure metal in a pound of 96 zolotniks. 96 would be pure. A law of 1847 fixed silver at three standards, kept by the assay charter of 1896:</p>
      {table(["Mark", "Thousandths", "Notes"], rows)}
      <p>Gold used other numbers: 56 zolotniks is about 14 carat, 72 about 18 carat. Read 72 on a gold item as gold; it was a silver standard only in the 18th century.</p>
      <h2 id="before">Before the kokoshnik: town, year and assay master</h2>
      <p>Russian marking of gold and silver goes back to a decree of Peter the Great in 1700. Through the 18th and 19th centuries an item usually carried the arms of its town (Moscow: Saint George and the dragon; St Petersburg: crossed anchors with a scepter), the initials of the assay master with the year, the standard in zolotniks, and the maker's mark. From the 1770s to 1896 the year on the assay master's mark was compulsory, which makes these marks unusually easy to date.</p>
{marksdb.grid(['russia-assay-master-year-mark', 'russia-moscow-town-mark', 'russia-st-petersburg-town-mark', 'russia-84-zolotnik', 'russia-88-zolotnik', 'russia-91-zolotnik'])}
      <h2 id="towns">Town marks before 1896</h2>
      <p>Moscow and St Petersburg assayed most Russian silver, but provincial towns struck their own arms as a town mark. These are the marks Marc Rosenberg printed in 1928, with the years he gives for each. His book is the only published source found for them, so read the years as his.</p>
      {marksdb.grid(['russia-astrakhan-town-mark', 'russia-irkutsk-tobolsk-town-mark', 'russia-kaluga-town-mark', 'russia-kamianets-podilskyi-town-mark', 'russia-kazan-town-mark', 'russia-kiev-town-mark-1794', 'russia-kiev-town-mark-19th-century-oval', 'russia-kiev-town-mark-19th-century-t', 'russia-kostroma-town-mark', 'russia-pskov-town-mark', 'russia-tula-town-mark', 'russia-tver-town-mark', 'russia-veliky-ustyug-town-mark', 'russia-vitebsk-town-mark', 'russia-vladimir-town-mark', 'russia-vologda-town-mark', 'russia-yaroslavl-town-mark'])}
      <h2 id="kokoshnik">The kokoshnik, 1896 to 1927</h2>
      <p>A new assay charter of March 11, 1896 brought one state mark for the whole empire: a woman's head in a kokoshnik, the tall traditional headdress, with the standard number beside it. Assay masters' marks no longer carry a year. Sources date the new mark from 1896 (the charter) or from 1899 (when it came into general use); read it as 1896 to 1899 onward.</p>
      <ul class="rules">
        <li><strong>Head facing left:</strong> the first type, with the Cyrillic initials of the district's assay chief. Up to 1908.</li>
        <li><strong>Head facing right:</strong> from 1908, with a Greek letter for the assay district in place of the initials: delta (Δ) for Moscow. Museums date this type 1908 to 1917; Russia's assay chamber shows it in use to 1926, until the Soviet change of 1927.</li>
      </ul>
      <p>The direction is a guide, not a rule: one Hillwood record notes a left-facing head on an item dated after 1908. No open-license photograph of a legible kokoshnik was found, so the cards below describe it in words.</p>
{marksdb.grid(['russia-kokoshnik-left', 'russia-kokoshnik-right', 'russia-district-letter-delta', 'faberge-cyrillic-name-mark'])}
      <h2 id="soviet">Soviet marks, from 1927</h2>
      <p>In 1927 fineness moved to thousandths (875, 916, 925 on silver), and the state mark became a worker's head with a hammer. From 1958 it was a hammer and sickle inside a five-pointed star, with the fineness and a letter for the assay office, until 1994, when the kokoshnik returned with metric numbers. These dates come from Russia's Federal Assay Chamber; no second published source was found for them. The star with hammer and sickle appears on the <a href="/marks/gold-karat-marks">gold marks page</a>, beside 583.</p>
      {marksdb.grid(['soviet-worker-hammer', 'soviet-star-silver'])}"""
    cavs = [
        "The kokoshnik's start date (1896 or 1899) and the end of the right-facing type (1917 or 1926–27) differ between sources; both readings are given above.",
        "Alpha for St Petersburg is given by one source only, so it is left out above; delta for Moscow is confirmed by two.",
        "Russian marks, Fabergé's above all, are among the most copied in silver. A mark gives the date and standard it claims; whether the item is what it says is a question for a specialist.",
    ]
    faqs = [
        ("What does 84 mean on Russian silver?", "<p>84 zolotniks out of 96: 875 thousandths, or 87.5% silver. It was the commonest Russian silver standard from 1847 to 1927. 88 is 916 and 91 is 947.</p>"),
        ("What is the kokoshnik mark?", "<p>The Russian state mark from 1896 to 1927: a woman's head in a kokoshnik headdress, with the standard in zolotniks. Facing left it is usually before 1908; facing right, 1908 or later, with a Greek letter for the assay district.</p>"),
        ("How do I date Russian silver before 1896?", "<p>Look for the assay master's mark: until 1896 it carried the year in figures, often with the master's initials, beside the town arms and the standard number.</p>"),
    ]
    return build_page(
        "/marks/russian-silver-marks", "Russian Silver Marks: 84, 88 and the Kokoshnik | Heirloom",
        "Read Russian silver marks: the zolotnik numbers 84, 88 and 91, the town and year marks before 1896, the kokoshnik from 1896, and Soviet marks from 1927.",
        "Russian silver marks: 84, 88 and the kokoshnik", "Russian silver marks",
        "Russian silver gives its fineness in zolotniks and, before 1896, its year. Here is how to read the numbers and marks, with the sources for each.",
        "84 on Russian silver means 84 zolotniks out of 96: 875 thousandths. 88 is 916 and 91 is 947. Before 1896 the assay master's mark carries the year; from 1896 to 1927 the state mark is a woman's head in a kokoshnik, facing left until 1908 and right after, with a Greek letter for the district. Soviet marks from 1927 are in thousandths.",
        sections, RU_SRC, cavs, faqs,
        "Photograph the marks on your silver. The Advisor reads the standard, the town and year marks and the maker's mark, and keeps what they say on the item's record.",
    )


# ── Gorham ────────────────────────────────────────────────────────────────────

GORHAM_SRC = [
    ("D. T. Rainwater, <cite>American Silver Manufacturers</cite> (1966), p. 60, Gorham entry and date-letter table (read in excerpt)", "https://archive.org/details/americansilverma0000unse"),
    ("D. T. Rainwater, <cite>Encyclopedia of American Silver Manufacturers</cite> (1975; 4th ed. 1998)", "https://archive.org/details/encyclopediaofam0000rain"),
    ("C. H. Carpenter Jr., <cite>Gorham Silver 1831–1981</cite> (New York: Dodd, Mead, 1982), the standard history, with the full date-mark chart", "https://archive.org/details/gorhamsilver18310000carp"),
    ("D. S. Cinamon, <cite>All About Antique Silver with International Hallmarks</cite> (2005), Gorham section (read in excerpt)", "https://archive.org/details/allaboutantiques0000cina"),
    ("N. D. Turner, <cite>American Silver Flatware, 1837–1910</cite> (1972), on Gorham's adoption of sterling in 1868 (read in excerpt)", "https://archive.org/details/americansilverfl0000unse"),
    ("Gorham Company, <cite>Gorham Hand Book of Sterling Silver Spoons and Forks</cite> (1909), public domain, Winterthur Library copy", "https://archive.org/details/gorhamhandbookst00gorh"),
    ("J. D. Hall, ed., <cite>Biographical History of the Manufacturers and Business Men of Rhode Island</cite> (Providence, 1901), “The Gorham Manufacturing Company”, public domain", "https://archive.org/details/biographicalhist00hall"),
    ("H. P. Okie, <cite>Old Silver and Old Sheffield Plate</cite> (1928), American silversmiths and their marks", "https://archive.org/details/oldsilveroldshef00okie"),
    ("E. Woodhead, <cite>Trademarks on Base-Metal Tableware</cite> (Parks Canada, 1991), p. 87", "https://archive.org/details/micro_IA40242804_0029"),
    ("M. E. Appleby, <cite>The Gorham Company's Martelé Line of Silver</cite>, MA thesis, University of Delaware, 1998", "https://udspace.udel.edu/server/api/core/bitstreams/d7499c2b-6471-458d-b6cd-a2175286a89e/content"),
    ("The Metropolitan Museum of Art: vase, 1880 (2008.68); coffeepot, 1881 (2014.200.1.1); pitcher, 1882 (2013.26)", "https://www.metmuseum.org/art/collection/search/639665"),
    ("The Cleveland Museum of Art: Martelé coffee service (2008.164); salt and pepper shakers (2009.368)", "https://www.clevelandart.org/art/2008.164"),
    ("Art Institute of Chicago records: castor, 1870 (121364); bowl, 1886 (105799); coffee pot, 1897 (272493); Martelé (57575, 45480)", "https://www.artic.edu/artworks/272493"),
    ("RISD Museum records: mug, 1874 (1992.087); cruet stand and toast rack, 1875; chatelaine, 1897; Martelé creamer", "https://risdmuseum.org/art-design/collection/mug-1992087"),
    ("Cooper Hewitt, Smithsonian Design Museum records: pepper mill, 1874; matchsafes of 1884–1894", "https://collection.cooperhewitt.org/"),
    ("Minneapolis Institute of Art records: tea service, 1883 (24492); coffee pot, 1884 (12989); vegetable dish (31394); Martelé, 1912", "https://collections.artsmia.org/art/12989"),
    ("High Museum of Art, <cite>Martelé wine pitcher</cite>, 1900", "https://high.org/collection/martele-wine-pitcher/"),
]


def gorham():
    letters = "ABCDEFGHIJKLMNOPQ"
    confirmed = {"C": "Art Institute of Chicago", "G": "Cooper Hewitt; RISD Museum", "H": "RISD Museum", "M": "The Met", "N": "The Met", "O": "The Met", "P": "Minneapolis Institute of Art", "Q": "Cooper Hewitt; Minneapolis Institute of Art"}
    cells = "".join(
        f'<li class="dlc" title="{e(("Dated example: " + confirmed[l]) if l in confirmed else "By the sequence")}"><span class="dl">{l}</span><span class="dlc__year">{1868 + n}</span></li>'
        for n, l in enumerate(letters)
    )
    sym = [
        ("1886", "A cross in a small square with a double border", "Art Institute of Chicago; Cooper Hewitt (as possible)"),
        ("1888", "A star in a circle", "Cooper Hewitt only"),
        ("1891", "A lion's head", "Cooper Hewitt only"),
        ("1894", "A circle with an arrow at the upper right", "The year: Cooper Hewitt and the Museum of the City of New York; the shape: Cooper Hewitt only"),
        ("1897", "A trident", "Art Institute of Chicago; RISD Museum"),
        ("1900", "A bell-like shape", "Cooper Hewitt only"),
        ("1906", "A key", "RISD Museum only"),
        ("1910", "A knot", "RISD Museum only"),
    ]
    sections = f"""      <h2 id="history">Gorham, in brief</h2>
      <p>Jabez Gorham, a Providence jeweler, began making silver spoons in 1831, first as Gorham &amp; Webster. The firm became the Gorham Manufacturing Company in the 1860s, and later the largest silver maker in the US. Before 1868 it worked in coin silver and marked its wares with the firm's name in a rectangle: Gorham &amp; Webster, Gorham &amp; Thurber, Gorham &amp; Co. In 1868 it adopted the sterling standard, 925 thousandths, and the mark it has used since.</p>
      <h2 id="trademark">The lion, anchor and G</h2>
      <p>Gorham sterling carries three small marks in a row: a walking lion, an anchor and a Gothic capital G, usually with STERLING and a model number below. They look like British hallmarks, and are often taken for them, but they are Gorham's trademark: the US had no official assay marks, and the lion and anchor (Birmingham's town mark) were borrowed for the look. The G is for Gorham.</p>
{marksdb.grid(['gorham-lion-passant', 'gorham-anchor', 'gorham-gothic-g', 'gorham-electroplate-anchor'])}
      <p>Gorham also made electroplate. Museum records of its plated ware show an anchor alone with GORHAM CO., or GORHAM with E.P., rather than the lion, anchor and G with STERLING. Read the lion and G with the word STERLING as sterling, and an anchor with the name but no STERLING as a reason to check for plate.</p>
      <h2 id="dates">Gorham date marks</h2>
      <p>From 1868 Gorham struck a yearly date mark on hollowware and some small wares, on its own line below STERLING and the model number. Most flatware has none. Two systems were used:</p>
      <ul class="rules">
        <li><strong>1868 to 1884: a capital letter,</strong> A for 1868 through Q for 1884.</li>
        <li><strong>From 1885: a small picture symbol</strong> for each year, such as a trident or a key.</li>
      </ul>
      <h3>The letters, 1868 to 1884</h3>
      <ul class="dlg">{cells}</ul>
      <p class="note">The sequence is from Rainwater's table. Museum records date dated examples of C, G, H, M, N, O, P and Q to these same years. One disagrees: the Minneapolis Institute of Art dates a dish marked K to 1879, where the sequence gives 1878.</p>
      <p>Three of the letters, struck on silver the Met dates to those years:</p>
      {marksdb.grid(['gorham-date-letter-m-1880', 'gorham-date-letter-n-1881', 'gorham-date-letter-o-1882'])}
      <h3>The symbols, from 1885</h3>
      <p>Each year from 1885 had its own small symbol. The full chart is printed in Carpenter's <cite>Gorham Silver</cite> and Rainwater's <cite>Encyclopedia</cite>; it could not be checked against a second source year by year, so it is not reproduced here. These are the years museum records tie to a symbol:</p>
      {table(["Year", "The symbol", "Dated by"], sym)}
      <p class="note">Rows dated by one museum only are shown as that museum describes them; check them against a full chart before you rely on them. Later Gorham silver, from 1941, has been said to carry a shape whose number of sides gives the decade; only one museum example (a hexagon on a pitcher of 1960) was found for it.</p>
      <h2 id="martele">Martelé</h2>
      <p>Martelé (French for hammered) was Gorham's hand-raised, hand-hammered Art Nouveau line, designed under William C. Codman and shown at the Paris Exposition of 1900. It was made in silver finer than sterling, and marked differently: the word Martelé in script, a spread eagle, the lion, anchor and G, then <strong>950-1000 FINE</strong> or <strong>.9584</strong>, with a model number and often a letter code. Some carry a retailer's name, such as Spaulding &amp; Co. of Chicago.</p>
{marksdb.grid(['gorham-martele-script', 'gorham-martele-eagle', 'gorham-martele-950-1000-fine', 'gorham-martele-9584'])}
      <p>A thesis on the line gives 950 from 1898 and .9584 (the old British Britannia standard) from 1905; both marks are confirmed on museum silver, but those years rest on that one study. No source found here explains the letter codes, so they are not decoded here.</p>"""
    cavs = [
        "The lion, anchor and G is a company mark, not a government hallmark: it says Gorham made and sold the item as sterling.",
        "A date mark dates the making of the item, not its engraving or later repair.",
        "Many Gorham symbols after 1885 are small and alike. Where this page gives only one museum for a year, check a full chart before you rely on it.",
    ]
    faqs = [
        ("What is the Gorham silver mark?", "<p>A walking lion, an anchor and a Gothic G in a row, usually with STERLING and a model number. Gorham has used it on sterling since 1868. It imitates British hallmarks but is Gorham's own trademark.</p>"),
        ("How do I read Gorham date marks?", "<p>Look below STERLING and the model number for a single letter or a small symbol. A capital letter from A to Q is a year from 1868 (A) to 1884 (Q). From 1885 each year has a picture symbol, such as a trident for 1897.</p>"),
        ("Is all Gorham silver sterling?", "<p>No. Gorham made electroplate too, marked with an anchor and the name, or with E.P., and no STERLING. Before 1868 it made coin silver, marked with the firm's name.</p>"),
        ("What does 950-1000 FINE mean on Gorham?", "<p>It marks Gorham's Martelé line, made in silver of 950 thousandths, finer than sterling. Later Martelé is marked .9584.</p>"),
    ]
    return build_page(
        "/marks/gorham-silver-marks", "Gorham Silver Marks and Date Symbols, from 1868 | Heirloom",
        "Read Gorham silver marks: the lion, anchor and G, the date letters A to Q for 1868 to 1884, the yearly symbols from 1885, Martelé's 950 and .9584 marks, and plate.",
        "Gorham silver marks and date symbols", "Gorham silver marks",
        "Gorham's lion, anchor and G marks its sterling from 1868, and a letter or symbol below it gives the year. Here is how to read both, with real marks from museum silver.",
        "Gorham sterling is marked with a lion, an anchor and a Gothic G, usually with STERLING and a model number. Below them, a capital letter gives the year from 1868 (A) to 1884 (Q); from 1885 a small picture symbol does, such as a trident for 1897. Martelé, Gorham's hand-hammered line, is marked 950-1000 FINE or .9584.",
        sections, GORHAM_SRC, cavs, faqs,
        "Photograph the marks on your Gorham silver. The Advisor reads the trademark, the model number and the date mark, and keeps what they say on the item's record.",
    )


# ── France ────────────────────────────────────────────────────────────────────

FR_SRC = {
    "chaffers96": ("W. Chaffers, <cite>Hall Marks on Gold and Silver Plate</cite>, with a history of French goldsmiths' work (London: Reeves and Turner, 1896), pp. 270–274 and plate 10, public domain", "https://archive.org/details/hallmarksongolds00chaf_1"),
    "chaffers99": ("W. Chaffers, <cite>Hand Book to French Hall Marks on Gold and Silver Plate</cite> (1899), pp. 16–18, public domain", "https://archive.org/details/handbooktofrenc00chafgoog"),
    "carre": ("L. Carré, <cite>De la réglementation des ouvrages en métaux précieux</cite>, thesis, Rennes, 1922, pp. 184–190", "https://archive.org/details/IA41543513_0002"),
    "touzet": ("A. Touzet, <cite>Emplois industriels des métaux précieux</cite>, thesis, Bordeaux, 1910", "https://archive.org/details/IA41523714_0058"),
    "capdevielle": ("G. Capdevielle, <cite>Le régime de l'industrie des métaux précieux en France</cite>, thesis, Paris, 1928", "https://archive.org/details/IA41547905_0048"),
    "universalis": ("C. Arminjon, “Titres et garanties, métaux précieux”, <cite>Encyclopædia Universalis</cite>", "https://www.universalis.fr/encyclopedie/titres-et-garanties-metaux-precieux/"),
    "douane09": ("French customs (DGDDI) and Monnaie de Paris, <cite>Garantie des métaux précieux</cite>, table of current marks, October 2009", "https://www.douane.gouv.fr/sites/default/files/uploads/files/2019-09/garantie-metaux-france.pdf"),
    "douanehist": ("French customs, <cite>Garantie des métaux précieux à travers l'histoire</cite>", "https://www.douane.gouv.fr/fiche/garantie-des-metaux-precieux-travers-lhistoire-de-1260-nos-jours"),
    "douanerules": ("French customs, <cite>Règles de marque pour la garantie des métaux précieux</cite>", "https://www.douane.gouv.fr/fiche/regles-de-marque-pour-la-garantie-des-metaux-precieux"),
    "senat83": ("French Senate, report no. 348 (1982–1983) by André Fosset on the guarantee of gold, silver and platinum", "https://www.senat.fr/rap/1982-1983/i1982_1983_0348.pdf"),
    "senat94": ("French Senate, 1993–1994 bill texts rewriting articles 521–522 of the Code général des impôts", "https://www.senat.fr/leg/1993-1994/ta1993_1994_0064.pdf"),
    "parismusees": ("Paris Musées collection records (open access): <cite>La Moissonneuse</cite>, Petit Palais ODUT1827; <cite>Testimonial</cite>, OGAL583; <cite>Coffret</cite> by Falize, OGAL103; message case, Musée Cognacq-Jay J581", "https://www.parismuseescollections.paris.fr/fr/petit-palais/oeuvres/la-moissonneuse"),
    "jury1851": ("<cite>Exposition universelle de 1851, travaux de la Commission française</cite>, 23rd jury, “Industrie des métaux précieux” (Paris, 1854), pp. 123–128, public domain", "https://archive.org/details/industriedesmta00albegoog"),
    "bouilhet": ("H. Bouilhet, <cite>L'orfèvrerie française aux XVIIIe et XIXe siècles</cite>, vols. 2–3 (Paris: Laurens, 1908–1912), public domain; Bouilhet was a Christofle partner", "https://archive.org/details/lorfevreriefranc02boui"),
    "mad": ("Musée des Arts Décoratifs, press kit for <cite>Christofle, une brillante histoire</cite> (2024)", "https://madparis.fr/IMG/pdf/dp-christofle-fr_10.pdf"),
    "christofle": ("Christofle, <cite>Charles Christofle, a visionary</cite> (company history)", "https://www.christofle.com/us_en/our-maison/charles-christofle-a-visionary"),
    "christofle_auth": ("Christofle, <cite>Authentification vintage</cite> guide (2023), the company's own account of its marks", "https://www.christofle.com/media/wysiwyg/PDF/CHRISTOFLE_AUTENTIFICATION_VINTAGE_EN.pdf"),
}

def france():
    rows = [
        ("Minerva head, figure 1", "Silver, first standard: 950 at first; 925 today", "An 8-sided frame (a rectangle with cut corners). The 1 is in front of the forehead."),
        ("Minerva head, figure 2", "Silver, second standard: 800", "A barrel-shaped frame. The 2 is under the chin."),
        ("Boar's head", "Small silver items, Paris: at least 800", "For items too small for the Minerva. Struck alone."),
        ("Crab", "Small silver items, outside Paris: at least 800", "The office's sign between the claws."),
        ("Swan in an oval", "Silver from abroad or of unknown origin, from 1893", "Struck on silver from countries without a treaty, and on unmarked silver sold at public auction or by the pawn office."),
        ("Weevil", "Imported gold and silver, from 1838", "Put in an oval in 1864; the silver one in a rectangle from 1893."),
        ("Head of a Greek physician", "Gold, 1838 to 1919", "Figures 1, 2 and 3 for 920, 840 and 750."),
        ("Eagle's head", "Gold: small Paris items 1838 to 1919; all French gold from 1919", "18 karat (750) is the eagle's head with a 3, in a six-sided frame."),
        ("Horse's head", "Small gold items outside Paris, 1838 to 1919", ""),
        ("ET in a rectangle", "Old or inherited items below the legal standard", "Says only that the item is gold or silver; it promises no standard."),
    ]
    sections = f"""      <h2 id="system">The system of 1838</h2>
      <p>French marks rest on a law of 1797, and the set still in use was introduced on May 10, 1838. From then on one punch showed both the standard and the assay office: the head of Minerva for silver. All gold and silver already on sale was re-marked for free, so French silver with only older marks was, by law, unmarked after 1838.</p>
      <p>A full set of French marks on silver is two: the state's Minerva head (or a small-item mark), and the maker's lozenge. There is no date letter, so French marks date an item only to a period.</p>
      <h2 id="minerva">The Minerva head</h2>
      <p>The goddess Minerva in a helmet, in profile, in a small frame with a figure: 1 for the first standard, 2 for the second. The figure does not tell Paris from the rest of France. Paris punches carry no office sign; punches from the provincial offices add a small sign, under the chin on the first standard and before the forehead on the second.</p>
{marksdb.grid(['france-minerva-first-standard', 'france-minerva-second-standard'])}
      <p>The first standard was 950 thousandths. Today's official table gives 925 for the Minerva with a 1, and French law has listed 925 and 800 as the silver standards since 1994. The year of the change from 950 to 925 is often given as 1973, but no law or museum record found here confirms it, so a first-standard Minerva means 950 or 925 depending on its date.</p>
      <h2 id="all">French marks at a glance</h2>
      {table(["Mark", "What it means", "How to tell it"], rows)}
      <p>When an item is part gold and part silver, and the second metal is more than 3% of its weight, the Paris eagle's head and boar's head are struck together in one oval.</p>
      {marksdb.grid(['france-swan', 'france-weevil', 'france-et-mark', 'france-mixed-boar-eagle'])}
      <h2 id="small">The boar's head and the crab</h2>
      <p>Small silver items, too small to take the Minerva head, were marked with a single small punch: a boar's head in Paris and a crab in the provincial offices. These marks promise only the second standard, 800. The sources agree on their start in 1838, but not on when they stopped: the often-quoted 1961 could not be confirmed, a Senate report of 1983 still names the crab, and today's table shows a Minerva without a frame for small silver. Chaffers printed both in 1896, engraved from the punches of 1838:</p>
      {marksdb.grid(['france-boar-head', 'france-crab'])}
      <h2 id="lozenge">The maker's lozenge</h2>
      <p>The maker's mark has been a lozenge, a diamond standing on its point, since 1798. It holds the maker's initials and a sign of the maker's own choosing, such as a star, a key or a caduceus, which no other maker in the same district may use. The punch is registered by striking it on a copper plate at the assay office. An importer uses an oval instead.</p>
      {marksdb.grid(['france-makers-lozenge', 'france-plate-square-mark'])}
      <p>A perfectly square maker's mark means plated ware, not silver: the law required it of makers of plated goods, and a decree of 1860 extended it to electroplaters. Christofle's marks on silver plate are of this kind; see <a href="/marks/christofle-marks">Christofle marks</a>.</p>
      <h2 id="gold">French gold, in brief</h2>
      <p>From 1838 to 1919 French gold carried the head of a Greek physician with a figure for its standard, and small items an eagle's head (Paris) or a horse's head (elsewhere). A decree of June 1919 made the eagle's head the mark for all French gold. An eagle's head with a 3 is 18 karat; with a 1, 22 karat. For what the numbers mean, see <a href="/marks/gold-karat-marks">gold karat marks</a>.</p>
      {marksdb.grid(['france-gold-greek-physician', 'france-gold-eagle-head', 'france-gold-horse-head', 'france-gold-owl'])}"""
    srcs = [FR_SRC[k] for k in ("chaffers96", "chaffers99", "carre", "touzet", "capdevielle", "universalis", "douane09", "douanehist", "douanerules", "senat83", "senat94", "parismusees")]
    cavs = [
        "Minerva heads are small and often worn: the figure 1 or 2 and the frame's shape matter more than the face.",
        "The end of the boar's head and crab, and the year the first standard moved from 950 to 925, are not settled by the sources found here.",
        "A mark says what the item claims. Old French marks have been copied; a specialist can tell a struck mark from a cast or added one.",
    ]
    faqs = [
        ("What does the Minerva head mean on French silver?", "<p>It is the French state mark for solid silver, used since 1838. With a 1 it is the first standard (950, now 925); with a 2, the second standard (800). Silver plate never carries it.</p>"),
        ("What does a boar's head mean on silver?", "<p>It is the Paris mark for small silver items, used from 1838 on things too small for the Minerva head. It means silver of at least 800 thousandths. Outside Paris the same job was done by a crab.</p>"),
        ("Is French silver with a square mark solid silver?", "<p>No. A square maker's mark is the French mark for plated goods, including electroplate from 1860. Solid silver has a diamond-shaped lozenge and a Minerva head or a small-item mark.</p>"),
        ("How do I date French silver?", "<p>Only roughly. French marks have no date letter. A Minerva head means 1838 or later; marks before it are older. The maker's lozenge can narrow the date once the maker is known, since makers' working years are recorded.</p>"),
    ]
    return build_page(
        "/marks/french-silver-marks", "French Silver Marks: The Minerva Head, Boar and Crab | Heirloom",
        "Read French silver marks from 1838: the Minerva head with 1 or 2, the boar's head and crab on small items, the maker's lozenge, the swan, and the square mark of plate.",
        "French silver marks: the Minerva head and the maker's lozenge", "French silver marks",
        "Since 1838 French silver has carried two marks: the state's Minerva head and the maker's lozenge. Here is how to read them, and the small marks that stand in for them.",
        "A helmeted head of Minerva is the French mark for solid silver, used since 1838: with a 1 it is the first standard (950, today 925), with a 2 the second (800). Small items carry a boar's head (Paris) or a crab (elsewhere) instead. Beside it is the maker's lozenge, a diamond with initials and a sign. A square maker's mark means silver plate.",
        sections, srcs, cavs, faqs,
        "Photograph the marks on your silver. The Advisor reads the Minerva head, the small marks and the maker's lozenge, and keeps what they say on the item's record.",
    )


def christofle():
    sections = f"""      <h2 id="history">The firm</h2>
      <p>Christofle dates itself to 1830. Charles Christofle (1805–1863) had become a partner in his brother-in-law's Paris jewelry firm in 1825 and ran it alone from 1831. From 1842 he bought the French patents for electroplating with silver and gold, first Henri de Ruolz's and then Elkington's, which came earlier, and built the business on silver plate: a thin coat of silver laid by electrolysis on a base metal. The firm also made solid silver, and its large works were at Saint-Denis, north of Paris.</p>
      <h2 id="plate">Christofle silver plate</h2>
      <p>Most Christofle is silver plate. Under French law, makers of plated goods had to strike a <strong>square</strong> maker's mark, not the diamond-shaped lozenge of solid silver; a decree of 1860 extended this to electroplate. So Christofle plate has a square maker's mark, the name, and no Minerva head.</p>
      <p>Christofle also promised the weight of silver it put on. In his note to the jury of the 1849 exhibition, Charles Christofle wrote that the firm stood behind the amount of silver deposited, with its mark and name struck on all its wares, and the 1851 jury reported that his punch gave in figures the grams of silver on each item, or on each dozen spoons and forks. By 1910, a legal writer noted, electroplaters in general no longer stated the weight, so a number on later Christofle should not be read as grams.</p>
      <h3>What Christofle says its marks show</h3>
      <p>The details below come from Christofle's own guide and history. No independent source confirming them was found, so take them as the company's account:</p>
      <ul class="rules">
        <li><strong>The maker's mark:</strong> a balance (a pair of scales), a bee, stars, laurel branches and two letters: CC for Charles Christofle, then OC for Orfèvrerie Christofle from 1935.</li>
        <li><strong>The quality mark, from 1935:</strong> a chess knight with OC, for the thickness of the silver or gold plate; from 1983 with a Roman numeral, I or II, for first or second quality of plate.</li>
        <li><strong>Name stamps:</strong> CHRISTOFLE in a rectangle, plain or in script, CHRISTOFLE FRANCE, or GALLIA.</li>
        <li><strong>Gallia:</strong> a line of plate Christofle created at the end of the 19th century, marked with a cockerel over the word GALLIA.</li>
      </ul>
      <p>No open-license photograph of these marks was found, so the cards below describe them in words. Being pictorial trademarks, they will be shown only as photographs:</p>
      {marksdb.grid(['christofle-cc-bee-maker-mark', 'christofle-oc-maker-mark', 'christofle-knight-quality-mark', 'gallia-cockerel'])}
      <h2 id="silver">Christofle solid silver</h2>
      <p>Solid silver by Christofle carries the French state mark, the <a href="/marks/french-silver-marks">Minerva head</a>, with the maker's mark: on the statuette whose name stamp is shown below, Paris Musées records a Minerva and a maker's mark of CC with a bee. Silver of this kind is marked like any French silver, so the Minerva head is what tells it from plate.</p>
{marksdb.grid(['christofle-name-stamp'])}"""
    srcs = [FR_SRC[k] for k in ("christofle", "christofle_auth", "mad", "bouilhet", "jury1851", "touzet", "chaffers99", "parismusees")]
    cavs = [
        "The meaning of the balance, the CC to OC change in 1935, the knight quality mark and the Gallia cockerel rest on Christofle's own account; museums and older books found here confirm only the CC with a bee and the name stamps.",
        "A number on Christofle plate was a weight of silver in the firm's early years; on later plate it may not be.",
        "Christofle is widely copied and its name is often used loosely. The marks tell you what the item claims; for more, ask the company or a specialist.",
    ]
    faqs = [
        ("Is Christofle real silver?", "<p>Most Christofle is silver plate: silver laid by electrolysis on a base metal, marked with a square maker's mark and the name. Christofle solid silver also carries the French Minerva head. If there is no Minerva head, it is plate.</p>"),
        ("What do the letters CC and OC mean on Christofle?", "<p>According to Christofle, CC (Charles Christofle) appears in its maker's mark until 1935, and OC (Orfèvrerie Christofle) from then on. That gives a rough date: OC means 1935 or later.</p>"),
        ("What is Gallia?", "<p>A line of silver plate made by Christofle from the end of the 19th century, marked GALLIA, with a cockerel in later marks, according to the company.</p>"),
        ("What does the number on old Christofle mean?", "<p>On early Christofle plate, the punch gave in figures the grams of silver deposited, on each item or on each dozen spoons and forks, as the 1851 exhibition jury reported. On later plate the number may be something else, such as a model number.</p>"),
    ]
    return build_page(
        "/marks/christofle-marks", "Christofle Marks: Silver Plate, Sterling and Dates | Heirloom",
        "How to read Christofle marks: the square maker's mark of silver plate, CC and OC, the name stamps and Gallia, and the Minerva head on Christofle solid silver.",
        "Christofle marks", "Christofle marks",
        "Christofle made silver plate from 1842 and solid silver beside it. Its marks tell the two apart, and roughly date them.",
        "Most Christofle is silver plate, marked with a square maker's mark and the name CHRISTOFLE; solid silver also carries the French Minerva head. Christofle says its maker's mark shows a balance with CC until 1935 and OC after, and that a knight with OC marks the quality of plate from 1935.",
        sections, srcs, cavs, faqs,
        "Photograph the marks on your Christofle. The Advisor reads the name, the maker's mark and any Minerva head, and keeps what they say on the item's record.",
    )


# ── Registry ──────────────────────────────────────────────────────────────────

def build():
    return [gold(), mexico(), france(), gorham(), christofle(), germany(), russia()]


CHILDREN = [
    ("/marks/gold-karat-marks", "Gold karat marks", "What 375, 585, 750, 916 and 999 mean, and the plated and filled marks GF, RGP and HGE."),
    ("/marks/mexican-silver-marks", "Mexican silver marks", "Taxco, 925 Mexico, the eagle assay mark and the letter codes from 1980."),
    ("/marks/french-silver-marks", "French silver marks", "The Minerva head, the boar's head and crab, and the maker's lozenge, from 1838."),
    ("/marks/gorham-silver-marks", "Gorham silver marks", "The lion, anchor and G, and Gorham's date letters and symbols from 1868."),
    ("/marks/christofle-marks", "Christofle marks", "Silver plate or solid silver: the square mark, CC and OC, and the Minerva head."),
    ("/marks/german-silver-marks", "German silver marks", "The crescent moon and crown with 800 or 925, from 1888."),
    ("/marks/russian-silver-marks", "Russian silver marks", "The zolotnik numbers 84 and 88, year marks before 1896, and the kokoshnik."),
]
