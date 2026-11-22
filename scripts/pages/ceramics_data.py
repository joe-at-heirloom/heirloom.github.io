"""The words for the ceramics maker's-mark pages (p_ceramics.py builds them).

Each maker is a dict. In the copy, {src:a,b} becomes links to sources a and b
in that maker's numbered source list. Every fact carries at least two sources;
the research notes behind them are summarized in each source's citation.
"""

BARBER_1904 = {"cite": "Edwin AtLee Barber, <em>Marks of American Potters</em> (Philadelphia: Patterson &amp; White, 1904)", "url": "https://archive.org/details/marksamericanpo00barbgoog"}
RIES_1909 = {"cite": "Heinrich Ries and Henry Leighton, <em>History of the Clay-Working Industry in the United States</em> (New York: Wiley, 1909), pp. 190–192", "url": "https://archive.org/details/historyofclaywor00riesrich"}
SUTOR_1905 = {"cite": "J. Hope Sutor, <em>Past and Present of the City of Zanesville and Muskingum County, Ohio</em> (Chicago: S. J. Clarke, 1905), pp. 176–177", "url": "https://archive.org/details/pastpresentofcit00suto"}
ZMA = "Zanesville Museum of Art, permanent collection records (maker dates and the marks recorded on each item)"


def barber(pages):
    return {**BARBER_1904, "cite": BARBER_1904["cite"] + f", {pages}"}


# ── Weller ────────────────────────────────────────────────────────────────────

WELLER = dict(
    slug="weller-pottery-marks",
    title="Weller Pottery Marks: Dating Weller by Its Marks, 1872–1948 | Heirloom",
    desc="How to read Weller pottery marks: the impressed line names of the 1890s, the Sicard signature in the lustre, the later stamped and molded marks, and the look-alikes, with sources.",
    h1="Weller pottery marks",
    crumb="Weller pottery marks",
    card="The impressed line names, Sicard's lustre signature and the later Weller marks, 1872–1948.",
    lede="Weller made pottery in and near Zanesville, Ohio, for some 75 years, and marked it in several ways. Here is what each mark looks like and the years it points to.",
    answer="Samuel A. Weller's pottery ran from the early 1870s to 1948 {src:sutor,lewis,zma,met}. Its art ware of the late 1890s and early 1900s is often impressed with a line name over WELLER, such as Louwelsa or Dickens Ware {src:barber,zma}; Sicardo lustre ware of about 1901 to 1907 is signed Sicard and Weller in the glaze itself {src:barber,cma}.",
    maker_heading="Who made Weller pottery",
    history=[
        "Samuel A. Weller started with a small pottery at Fultonham, near Zanesville, Ohio, making flowerpots and plain earthenware {src:sutor,lewis,ries}. The year is given as 1872 by some sources {src:ries,zma} and as about 1873 by others {src:sutor,lewis}. He moved into Zanesville in the 1880s and built a brick factory there in 1890 {src:sutor,lewis}.",
        "The first art ware came in the mid-1890s. Weller made Lonhuda ware with William A. Long of Steubenville for about a year, then a similar brown, slip-painted ware of his own called Louwelsa {src:sutor,lewis,ries}. The name joins Louise, his daughter's name, with his own name and initials {src:barber,sutor}. Other lines followed, among them Eocean, Aurelian, Dickens Ware and Turada {src:barber,ries}.",
        "In 1901 Jacques Sicard, who had worked for the lustre potter Clément Massier at Golfe-Juan in France, came to Zanesville and made a metallic lustre ware for Weller called Sicardo {src:barber,sutor}. Museums date their Sicardo between about 1901 and 1907 {src:met,cma}.",
        "The pottery closed in 1948, according to the Zanesville Museum of Art and the Metropolitan Museum of Art {src:zma,met}; the RISD Museum gives 1949 {src:risd}.",
    ],
    marks_heading="Weller marks, in order",
    marks_intro="Weller used more than one kind of mark at a time, and many of its items carry no mark at all {src:zma,hford}. The line name, where there is one, is the most useful clue to the date.",
    marks=[
        dict(id="line-names", name="A line name over Weller, impressed", dates="About 1896 to 1905",
             body="The early art lines were stamped into the clay with the line's name, often in an arc, over WELLER in capitals: Louwelsa, Dickens Ware, Turada {src:barber,zma,hford}. Barber also printed Eosian and Aurelian marks with the line name in script over WELLER {src:barber}. A number impressed with the mark, such as 525, is a shape or size number, not a date {src:zma,hford}. Louwelsa dates from 1896 at the earliest {src:zma,ries}.",
             images=[dict(file="weller-barber-1904-line-marks", alt="Facsimiles of five Weller marks: Eosian, Aurelian, Louwelsa, Dickens Ware and Turada, each over WELLER",
                          caption="The Eosian, Aurelian, Louwelsa, Dickens Ware and Turada marks as Barber printed them in 1904.",
                          credit="Barber, Marks of American Potters (1904), p. 131", licence="public domain", page="https://archive.org/details/marksamericanpo00barbgoog")]),
        dict(id="script-lines", name="A line name written by hand", dates="About 1898 to 1910",
             body="Some early lines carry the line name and Weller written by hand into the base instead of a stamp, for example Eocean and Auroral {src:zma,barber}.",
             images=[]),
        dict(id="sicard", name="Sicard and Weller in the lustre", dates="About 1901 to 1907",
             body="Sicardo ware is usually signed in the lustre glaze itself, low on the side rather than on the base: Sicard, Weller, or both {src:cma,mia,barber}. The base may have only an impressed number, or a small Weller mark {src:cma,mia}. Barber also printed a stamped Sicardo over Weller mark in 1904 {src:barber}.",
             images=[dict(file="weller-sicardo-bowl-cma-1983-228", alt="Underside of an iridescent green Sicardo bowl with SICARD and WELLER written in the lustre around the foot and an impressed 28 on the base",
                          caption="A Sicardo bowl seen from below: “Sicard” at the right and “Weller” at the bottom are written in the lustre, and 28 is impressed in the base.",
                          credit="Cleveland Museum of Art, 1983.228", licence="CC0", page="https://clevelandart.org/art/1983.228"),
                     dict(file="weller-barber-1904-sicardo-mark", alt="Facsimile of the Sicardo over WELLER mark",
                          caption="The Sicardo mark as Barber printed it in 1904.",
                          credit="Barber, Marks of American Potters (1904), p. 131", licence="public domain", page="https://archive.org/details/marksamericanpo00barbgoog")]),
    ],
    careful_heading="Look-alike marks to be careful with",
    cautions=[
        "Lonhuda is not Weller. Lonhuda Faience of Steubenville had its own mark, a shield with LF and the name; Weller made Lonhuda ware for about a year and bought the Lonhuda works in 1896, and Louwelsa looks very like it {src:barber,ries,sutor}.",
        "French lustre. Sicard came from Clément Massier's pottery in France, and Massier's lustre ware can look like Sicardo; Massier marked his ware with his own name {src:barber,sutor,zma}.",
        "Zanesville look-alikes. Roseville's Rozane and J. B. Owens' Utopian were brown, slip-painted wares made in the same town at the same time as Louwelsa {src:barber,ries,sutor}. Read the mark rather than the look.",
        "We found no museum, government or news record of modern copies carrying a Weller mark. That is not proof that none exist.",
    ],
    disagree=[
        "When Weller started: 1872 {src:ries,zma} or about 1873 {src:sutor,lewis}. The Met dates the firm from 1888, the year it moved into its Zanesville plant {src:met}.",
        "When Weller closed: 1948 {src:zma,met} or 1949, the year the RISD Museum records {src:risd}.",
    ],
    sources=dict(
        barber=barber("pp. 130–132, with facsimiles of the Weller marks"),
        sutor=SUTOR_1905,
        lewis={"cite": "Thomas W. Lewis, <em>Zanesville and Muskingum County, Ohio</em>, vol. 1 (Chicago: S. J. Clarke, 1927), pp. 481–482", "url": "https://archive.org/details/zanesvillemuskin0001thom"},
        ries=RIES_1909,
        zma={"cite": ZMA + ": Weller Pottery Company, 1872–1948; Louwelsa, Dickens Ware, Eocean, Auroral and Sicardo items, accession numbers 1990.15602, 1979.12834, 1986.16398, 1964.11727, 1986.16385, 1964.11188, 1952.10388", "url": "https://zanesvilleart.pastperfectonline.com/webobject/F4FCA30C-D3A2-47CB-B762-030846635040"},
        hford={"cite": "The Henry Ford, collection record 00.4.3291, Weller vase, 1895–1905, impressed Louwelsa and Weller with shape numbers", "url": "https://www.thehenryford.org/collections/explore/artifact/254100"},
        cma={"cite": "Cleveland Museum of Art, collection records 1983.228 (Sicardo bowl, signed Sicard and Weller in the lustre) and 1983.227", "url": "https://clevelandart.org/art/1983.228"},
        mia={"cite": "Minneapolis Institute of Art, collection record 2001.42.2a,b (Sicardo covered box, about 1905: Sicard in the glaze near the foot, Weller on the bottom)", "url": "https://collections.artsmia.org/art/33704"},
        met={"cite": "The Metropolitan Museum of Art, collection records 19907 (S. A. Weller Pottery, 1888–1948) and 9388 (Sicardo vase, 1901–7)", "url": "https://www.metmuseum.org/art/collection/search/9388"},
        risd={"cite": "RISD Museum, collection record 2003.19 (Sicard and Weller vase, about 1902–1912; Weller Pottery, 1872–1949)", "url": "https://risdmuseum.org/art-design/collection/vase-200319"},
    ),
    cta="Photograph the base and any writing on the side. The Advisor reads the mark, names the line where it can, and says plainly when a Weller item is unmarked or the mark is too worn to read.",
    faqs=[
        ("How old is my Weller pottery?",
         "Weller made pottery from the early 1870s to 1948 {src:sutor,zma}. A line name such as Louwelsa or Dickens Ware impressed over WELLER points to about 1896 to 1905, and Sicard written in the lustre to about 1901 to 1907 {src:barber,zma,cma}."),
        ("What does Louwelsa mean?",
         "It is a made-up name: Louise, Weller's daughter, joined with Weller and his initials, S. A. {src:barber,sutor}"),
        ("Where is the mark on Sicardo?",
         "Usually in the lustre glaze low on the side, not on the base: Sicard, Weller or both, written into the decoration {src:cma,mia}."),
        ("My Weller item has no mark. Is that unusual?",
         "No. Museum collections include Weller items with no mark at all {src:zma,hford}, and a missing mark tells you nothing on its own."),
    ],
)


# ── Roseville ─────────────────────────────────────────────────────────────────

ROSEVILLE = dict(
    slug="roseville-pottery-marks",
    title="Roseville Pottery Marks: Rozane, Rv, Labels and Raised Script | Heirloom",
    desc="How to date Roseville pottery by its marks, 1890 to 1954: the Rozane Ware seal, the Rv ink stamp, foil labels, impressed and raised script, and the reproductions to know about.",
    h1="Roseville pottery marks",
    crumb="Roseville pottery marks",
    card="The Rozane seal, the Rv stamp, foil labels and raised script, 1890–1954.",
    lede="Roseville marked its pottery with a seal, then an ink stamp, then labels, then a script name in the mold. Each tells you roughly when an item was made.",
    answer="The Roseville Pottery Company began in Roseville, Ohio, in 1890, moved to Zanesville in 1898 and closed in 1954 {src:ohc,ries,met}. A round Rozane Ware seal points to about 1904 to 1907, an Rv ink stamp to about 1916 to 1925, and the raised script “Roseville U.S.A.” with a shape number to the mid-1930s through 1954 {src:barber,zma,hford}.",
    maker_heading="Who made Roseville pottery",
    history=[
        "The Roseville Pottery Company began in 1890 in Roseville, Ohio, and was incorporated in 1892 {src:ohc,ries,sutor}. It made flowerpots, stoneware and plain jardinieres from local clay {src:ohc,ries,sutor}.",
        "In 1898 it bought the Clark Stoneware plant on Linden Avenue in Zanesville and moved there {src:ohc,ries,sutor}. Its first art ware, Rozane, was developed there in 1900 and 1901: brown ware painted with colored slips under the glaze, like the Louwelsa of its neighbor Weller {src:sutor,barber}. The company's own 1905 catalog shows Rozane Royal and the lines that followed it, among them Mongol, Egypto, Mara and Woodland {src:rozane}.",
        "The company closed in 1954 {src:ohc,met,acers}. Since 2017 the Roseville names have been registered trademarks of a company in Indiana that sells new items under them {src:acers,uspto}; those are not products of the original pottery.",
    ],
    marks_heading="Roseville marks, in order",
    marks_intro="Roseville's marks overlap at their edges, and many of its items left the factory with only a paper or foil label, so a missing mark is common {src:zma,pbs}.",
    marks=[
        dict(id="rozane-seal", name="The Rozane seal", dates="About 1904 to 1907",
             body="A circle with a rose at the upper right and the words ROZANE WARE across it {src:barber,rozane}. Barber printed the seal in 1904 and the company's 1905 catalog carries it on its pages {src:barber,rozane}.",
             images=[dict(file="roseville-barber-1904-rozane-ware-mark", alt="Facsimile of the round Rozane Ware mark: a circle with a rose and the words ROZANE WARE",
                          caption="The Rozane Ware mark as Barber printed it in 1904.",
                          credit="Barber, Marks of American Potters (1904), p. 139", licence="public domain", page="https://archive.org/details/marksamericanpo00barbgoog"),
                     dict(file="roseville-rozane-ware-1905-catalog-seal", alt="The Rozane Ware seal printed on the title page of Roseville's 1905 catalog",
                          caption="The seal on the title page of Roseville's own 1905 Rozane Ware catalog.",
                          credit="Roseville Pottery Co., Rozane Ware (1905), Winterthur Library, via Internet Archive", licence="public domain", page="https://archive.org/details/rozaneware00rose")]),
        dict(id="rv", name="The Rv ink stamp", dates="About 1916 to 1925",
             body="A small monogram of a capital R with a small v, stamped in ink on the base, often in blue. Museums record it on items they date from 1916 to about 1924 {src:hford,zma}.",
             images=[]),
        dict(id="labels", name="Paper and foil labels", dates="Mostly the later 1920s and early 1930s",
             body="Many items of these years were marked only with a stuck-on label, the later ones silver foil reading Roseville Pottery {src:zma,pbs}. Once the label is gone, the item is unmarked {src:pbs,zma}.",
             images=[]),
        dict(id="impressed-script", name="Roseville in script, impressed", dates="The mid-1930s",
             body="The name in script sunk into the base from the mold, with a shape number. The Zanesville Museum of Art records it on lines of about 1935 to 1937 {src:zma}. The Henry Ford describes an impressed “U.S.A. / Roseville” mark on a vase it dates 1945 to 1950, so this form was not confined to the 1930s {src:hford}.",
             images=[]),
        dict(id="raised-script", name="Roseville U.S.A. in raised script", dates="The mid-1930s to 1954",
             body="The name in script raised from the base, with U.S.A. below it and a shape number with a size in inches, such as 201-7 {src:zma,hford}. Museums record it on lines from the mid-1930s to the last designs of the early 1950s {src:zma,hford}.",
             images=[]),
    ],
    careful_heading="Reproductions and later marks to be careful with",
    cautions=[
        "Copies of Roseville shapes made in China have been sold in the US since the 1980s, some with a raised Roseville mark molded in {src:kovel,pbs,spokesman}.",
        "On the museum examples, the raised script mark has U.S.A. under the name {src:zma,hford}. A newspaper column described a reproduction whose raised mark had no U.S.A., with weaker glaze and modeling than the old ware {src:spokesman}. A missing or faint U.S.A. is a reason to look closer, not a verdict.",
        "New items have been sold under the Roseville trademarks since 2017 {src:acers,uspto}. They are marked as new products, not as old ones.",
        "Other potteries in the town of Roseville, Ohio, such as Robinson-Ransbottom, put the town's name in their marks {src:kovel,zma}. A town name is not the Roseville Pottery Company's mark.",
    ],
    disagree=[
        "The start year is given as 1890 {src:ohc,zma} or 1892 {src:met,ries}: 1890 is when the company began and 1892 when it was incorporated {src:ohc,sutor}.",
        "Barber printed the round Rozane Ware mark in 1904 {src:barber}; the Zanesville Museum of Art dates the applied seal on the ware from 1905 or 1906 {src:zma}.",
    ],
    sources=dict(
        ohc={"cite": "Ohio Historical Marker 16-60, “Roseville Pottery Company 1890–1954, Linden Avenue Plant,” Zanesville (Ohio Historical Society and Iowa Art Pottery Association)", "url": "https://remarkableohio.org/marker/16-60-roseville-pottery-company-1890-1954-linden-avenue-plant-2/"},
        ries=RIES_1909,
        sutor={**SUTOR_1905, "cite": SUTOR_1905["cite"].replace("pp. 176–177", "p. 176")},
        barber=barber("p. 139, with a facsimile of the Rozane Ware mark"),
        rozane={"cite": "Roseville Pottery Company, <em>Rozane Ware</em> (trade catalog, Zanesville, 1905), Winterthur Library copy", "url": "https://archive.org/details/rozaneware00rose"},
        met={"cite": "The Metropolitan Museum of Art, collection record 19885 (Roseville Pottery vase, about 1904–8; Roseville Pottery Company, 1892–1954)", "url": "https://www.metmuseum.org/art/collection/search/19885"},
        zma={"cite": ZMA + ": Roseville Pottery Company, 1890–1954; Rozane, Rv-stamped, labeled and script-marked items, accession numbers 1979.12833, 193x.16018, 1954.10505, 1976.12653, 1954.10509, 1976.12681, 1976.12667, 1976.12665, 1976.12661, 2007.1.337", "url": "https://zanesvilleart.pastperfectonline.com/webobject/6CE81A74-80A8-4011-98FD-428581752729"},
        hford={"cite": "The Henry Ford, collection records 72.102.55 (vase, 1916–1920, stamped Rv monogram), 66.89.1 (vase, 1946–1950, Roseville U.S.A. 201-7) and 72.102.57 (vase, 1945–1950, impressed U.S.A. Roseville 117-6)", "url": "https://www.thehenryford.org/collections/explore/artifact/67946"},
        pbs={"cite": "PBS, <em>Antiques Roadshow</em>, “Roseville Experimental Line Production Vase, ca. 1925,” Orlando, season 21 (2016)", "url": "https://www.pbs.org/wgbh/roadshow/appraisals/roseville-experimental-line-production-vase-ca-1925/"},
        spokesman={"cite": "Glenn Erardi, “No place for this vase,” <em>The Spokesman-Review</em> (Spokane), January 30, 2007", "url": "https://www.spokesman.com/stories/2007/jan/30/no-place-for-this-vase"},
        kovel={"cite": "Terry and Kim Kovel, syndicated newspaper column, “Pottery company used white rose pattern,” <em>Weirton Daily Times</em>, November 13, 2021; and Terry Kovel, <em>Lawrence Journal-World</em>, January 10, 2013", "url": "https://www.weirtondailytimes.com/news/national-news-apwire/2021/11/pottery-company-used-white-rose-pattern/"},
        acers={"cite": "Lisa McDonald, “History and revival of Roseville pottery,” <em>Ceramic Tech Today</em>, The American Ceramic Society, November 27, 2024", "url": "https://ceramics.org/ceramic-tech-today/history-and-revival-of-roseville-pottery/"},
        uspto={"cite": "United States Patent and Trademark Office, registrations 5,168,438 (Roseville Pottery) and 5,168,439 (Roseville), 2017", "url": "https://tsdr.uspto.gov/#caseNumber=5168439&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch"},
    ),
    cta="Photograph the base, label and all. The Advisor reads the mark and the shape number, dates the mark from the periods on this page, and says plainly when an item is unmarked.",
    faqs=[
        ("How do I date Roseville pottery by the mark?",
         "The round Rozane Ware seal points to about 1904 to 1907; the Rv ink stamp to about 1916 to 1925; a foil or paper label alone to the later 1920s or early 1930s; and the raised script “Roseville U.S.A.” with a shape number to the mid-1930s through 1954 {src:barber,zma,hford,pbs}."),
        ("When did Roseville close?",
         "In 1954 {src:ohc,met}."),
        ("My Roseville has raised letters but no U.S.A. What does that mean?",
         "The raised marks in museum collections have U.S.A. under the name {src:zma,hford}, and reproductions have been reported without it {src:spokesman}. It is a reason to look closer; Heirloom never decides whether an item is genuine."),
        ("Why does my Roseville have no mark?",
         "Many items of the later 1920s and early 1930s carried only a paper or foil label, and most labels have long since come off {src:pbs,zma}."),
        ("What is Rozane?",
         "Roseville's first art ware, developed in 1900 and 1901, and the name of a family of lines that followed it {src:sutor,rozane}."),
    ],
)


# ── Nippon and Noritake (shared sources) ─────────────────────────────────────

def ia(ident):
    return "https://archive.org/details/" + ident


VP_NIPPON = {"cite": "Joan F. Van Patten, <em>The Collector's Encyclopedia of Nippon Porcelain</em> (Paducah: Collector Books, 1979), pp. 26–27, and its third and fourth series (1986, 1997); <em>Van Patten's ABC's of Collecting Nippon Porcelain</em> (2005)", "url": ia("collectorsencycl0000vanp")}
VP_NORITAKE = {"cite": "Joan F. Van Patten, <em>The Collector's Encyclopedia of Noritake</em> (Paducah: Collector Books, 1984), and <em>Van Patten's ABC's of Collecting Nippon Porcelain</em> (2005)", "url": ia("collectorsencycl0000vanp_u9g8")}
ALDEN = {"cite": "Aimee Neff Alden and Marian Kinney Richardson, <em>Early Noritake China</em> (Wallace-Homestead, 1987)", "url": ia("earlynoritakechi0000alde")}
SPAIN = {"cite": "David Spain, <em>Collecting Noritake, A to Z: Art Deco &amp; More</em> (Atglen: Schiffer, 1999), and <em>Art Deco Noritake &amp; More</em> (2004)", "url": ia("collectingnorita0000spai")}
MURPHY = {"cite": "Pat Murphy, <em>Noritake for Europe</em> (Atglen: Schiffer, 2001)", "url": ia("noritakeforeurop0000murp")}
CHERVENKA = {"cite": "Mark Chervenka, <em>Antique Trader Guide to Fakes &amp; Reproductions</em> (Antique Trader Books, 2001)", "url": ia("antiquetradergui00cher_0")}
STATUTE = {"cite": "Tariff Act of October 1, 1890 (the McKinley Tariff), ch. 1244, sec. 6, <em>United States Statutes at Large</em>, vol. 26, p. 613", "url": "https://tile.loc.gov/storage-services/service/ll/llsl/llsl-c51/llsl-c51.pdf"}
CGJ = {"cite": "<em>Crockery and Glass Journal</em>, vol. 93, April 28, 1921, “Service Information” (Noritake Nippon china controlled by Morimura Bros., New York)", "url": ia("crockeryglassjou9311unse")}

NIPPON = dict(
    slug="nippon-marks",
    title="Nippon Marks: Japanese Porcelain Marked Nippon, 1891–1921 | Heirloom",
    desc="What “Nippon” on porcelain means, why it was used from 1891 to 1921, the maple leaf, M-in-wreath, RC and rising sun marks, and the fake Nippon marks made since the 1980s, with sources.",
    h1="Nippon marks",
    crumb="Nippon marks",
    card="Why Japanese export porcelain says Nippon, 1891–1921, and the marks to know.",
    lede="“Nippon” on the base of a vase or a plate is not a maker's name. It is the Japanese name for Japan, and it dates an item to a span of about thirty years.",
    answer="A US law of 1890 required imports, from March 1, 1891, to name their country of origin in English {src:statute,vp}, and Japanese exporters marked their wares “Nippon.” In 1921 the US Treasury ruled that Nippon was a Japanese word, not an English one, and required “Japan” instead {src:vp,alden,wojc}. So a Nippon backstamp used as the country name points to 1891 to 1921 {src:vp,spain}.",
    maker_heading="What Nippon means, and who used it",
    history=[
        "Section 6 of the Tariff Act of 1890, the McKinley Tariff, said that from March 1, 1891, imported goods of a kind usually marked had to be marked in legible English words with their country of origin, or they would not be admitted {src:statute,vp}. Japanese exporters met the rule with the word Nippon {src:vp,spain}.",
        "In 1921 the Treasury decided that Nippon was the Japanese name for Japan, that the English word was Japan, and that goods marked only Nippon no longer met the law {src:vp,alden,wojc}. After that, Japanese wares for the US were marked Japan or Made in Japan {src:vp,spain,stitt}.",
        "Nippon was not one factory. Many Japanese makers, decorators and exporters used it, often with a symbol or name of their own {src:vp,dtic}. The best known is the Morimura group: Morimura Bros. of New York and, from 1904, its factory company Nippon Toki, the maker now called Noritake {src:cgj,alden,vp}. The rule was a US one, so wares made for other markets often do not say Nippon {src:murphy,spain}.",
    ],
    marks_heading="Nippon marks, in order",
    marks_intro="No photograph of a Nippon backstamp under an open license was found, so each mark here is described in words. Most are printed under the glaze or over it on the base, in green, blue, magenta, red or gold {src:vp,wojc}.",
    marks=[
        dict(id="nippon", name="Nippon in the backstamp", dates="1891 to 1921",
             body="Nippon alone, or with Hand Painted and a maker's symbol. As the country name, it dates the item to between the McKinley Tariff and the 1921 ruling {src:statute,vp,spain}. It does not name the maker {src:vp,dtic}.", images=[]),
        dict(id="maple-leaf", name="The maple leaf", dates="From the 1890s or the 1900s to 1921",
             body="A small leaf above the word Nippon, linked to the Morimura group {src:vp,murphy}. Van Patten dates it from 1891; Murphy says it was registered in Japan in 1908, though items with it seem earlier {src:vp,murphy}. On the genuine mark the leaf is about a quarter of an inch across {src:vp,chervenka}.", images=[]),
        dict(id="m-wreath", name="The M in a wreath", dates="About 1911 to 1921 with Nippon",
             body="A capital M, for Morimura, inside a leafy wreath that is open at the top, with Hand Painted above and Nippon below {src:alden,vp}. Van Patten dates it from 1911; Alden and Richardson date their first Morimura backstamp to 1891, registered in Japan in 1911 {src:vp,alden}. The same wreath continued after 1921 with Noritake and Made in Japan {src:alden,vp}.", images=[]),
        dict(id="rc", name="The RC mark", dates="About 1906 or 1911 to 1921",
             body="The letters RC on a balancing-toy device, with Hand Painted and Nippon, used by Nippon Toki, usually on its better wares {src:vp,alden}. Van Patten gives 1906 for its first use and 1911 for its registration in Japan and the US {src:vp}. Alden and Richardson read RC as Royal Ceramic; others read Royal Crockery {src:alden,vp}.", images=[]),
        dict(id="komaru", name="The komaru", dates="About 1908 or 1912 to 1921",
             body="A round emblem with Hand Painted Nippon, a Nippon Toki mark; Murphy says it was first registered in 1908, Van Patten gives 1912 {src:murphy,vp,spain}.", images=[]),
        dict(id="rising-sun", name="The rising sun", dates="About 1911 to 1921",
             body="A half sun with rays, with Nippon or Hand Painted, printed in blue {src:vp,chervenka}. The sources seen do not name its maker.", images=[]),
        dict(id="japan", name="Japan in place of Nippon", dates="From 1921",
             body="Japan or Made in Japan where Nippon would have been means 1921 or later {src:vp,alden,spain,stitt}. During the occupation, from 1945 to 1952, some wares for the US were marked Occupied Japan, though Japan and Made in Japan were used then too {src:vp,florence}.", images=[]),
    ],
    careful_heading="Fake Nippon marks to be careful with",
    cautions=[
        "Since the 1980s new porcelain has been made with backstamps copied from or modeled on Nippon marks, mainly in East Asia {src:vp,chervenka}. The reference books show these fake marks beside the genuine ones.",
        "Fakes the books describe: a wreath turned upside down with an hourglass or a K inside; a wreath closed at the top; a maple leaf about half an inch wide; a rising sun drawn as a hollow outline or with a gap between the sun and its rays; an RC mark printed all in green {src:vp,chervenka}.",
        "These items can be imported legally: US law requires the real country of origin in English, and a decorative “Nippon” mark is allowed beside it. The real origin is often on a paper label that comes off, while the copied mark is fired on {src:vp,chervenka}.",
        "Some genuine Nippon-era items have no backstamp at all; in a set, a saucer may be marked when its cup is not {src:vp,wojc}.",
        "We found no US Customs notice, museum statement or newspaper report on fake Nippon marks; the reference books above are the record.",
    ],
    disagree=[
        "When the 1921 change took effect: Van Patten reprints the Treasury notice as dated March 1, 1921, taking effect six months later, about September 1 {src:vp}; Baker gives “after March 1, 1921” {src:baker}; most sources say only 1921.",
        "Start dates of the maple leaf, M-in-wreath, RC and komaru marks differ by source, as given under each mark above.",
    ],
    sources=dict(
        statute=STATUTE,
        vp=VP_NIPPON,
        wojc={"cite": "Kathy Wojciechowski, <em>The Wonderful World of Nippon Porcelain, 1891–1921</em> (West Chester: Schiffer, 1992)", "url": ia("wonderfulworldof0000wojc")},
        alden=ALDEN,
        spain=SPAIN,
        murphy=MURPHY,
        chervenka=CHERVENKA,
        stitt={"cite": "Irene Stitt, <em>Japanese Ceramics of the Last 100 Years</em> (1974), chapters on Nippon wares (1891–1921) and Made in Japan (1921–1940)", "url": ia("japaneseceramics0000stit")},
        dtic={"cite": "US Army Corps of Engineers, Pittsburgh District, <em>Analysis of Archaeological, Geological and Historical Artifacts … Midden Excavation at ‘Woodville’, Chartiers Creek, Pennsylvania</em> (1985), p. 373", "url": ia("DTIC_ADA153688")},
        cgj=CGJ,
        florence={"cite": "Gene Florence, <em>The Collector's Encyclopedia of Occupied Japan Collectibles</em>, fifth series (Paducah: Collector Books, 1992)", "url": ia("collectorsencycl0000flor")},
        baker={"cite": "Lillian Baker, <em>Hatpins &amp; Hatpin Holders</em> (Paducah: Collector Books, 1983)", "url": ia("hatpinshatpinhol0000bake")},
    ),
    cta="Photograph the backstamp in good light. The Advisor reads the wording and the symbol, dates the country name, and says plainly what a backstamp cannot tell about who made an item.",
    faqs=[
        ("What does Nippon on the bottom of porcelain mean?",
         "It is the Japanese name for Japan. US law from 1891 required imports to name their country of origin, and Japanese exporters wrote Nippon until 1921 {src:statute,vp,spain}. It tells you where and roughly when, not who."),
        ("Why did Nippon change to Japan in 1921?",
         "The US Treasury ruled that Nippon was a Japanese word and that the law required the English name, Japan {src:vp,alden,wojc}."),
        ("Was Nippon porcelain made by Noritake?",
         "Some was. The Morimura group, whose factory company became Noritake, used the maple leaf, the M in a wreath, RC and the komaru; many other firms used Nippon too {src:vp,alden,murphy}."),
        ("Can an item marked Nippon be new?",
         "Yes. Reference books have documented new porcelain with copied Nippon marks since the 1980s {src:vp,chervenka}. Heirloom never decides whether an item is genuine."),
    ],
)


NORITAKE = dict(
    slug="noritake-marks",
    title="Noritake Marks: M in a Wreath, Rose China, N in a Wreath | Heirloom",
    desc="How to date Noritake china by its backstamp: the Nippon-era marks, the M in a wreath, Rose China after the war, the occupation-era stamp and the N in a wreath from 1953, with sources.",
    h1="Noritake marks",
    crumb="Noritake marks",
    card="The M in a wreath, Rose China, the occupation stamp and the N in a wreath.",
    lede="Noritake's backstamp changed with its history: Nippon before 1921, Made in Japan after, a different name just after the war, and a new letter in the wreath in the 1950s.",
    answer="Noritake's factory company, Nippon Toki, was founded in 1904 near Nagoya by the Morimura trading group {src:noritake,morimura,vp}. An M (for Morimura) in a wreath with Nippon points to before 1921, and with Made in Japan to 1921 or later {src:alden,vp,spain}; Rose China points to about 1946 to 1948 {src:vp,schiffer,spain}; an N in a wreath to 1953 or later {src:page,brewer,vp}.",
    maker_heading="Who made Noritake",
    history=[
        "In 1876 Ichizaemon Morimura and his brother Toyo founded the trading firm Morimura Gumi in Tokyo, and Toyo opened a store in New York that became Morimura Brothers, an importer of Japanese goods {src:noritake,morimura,page}. Porcelain became a growing part of its trade {src:noritake,morimura}.",
        "In 1904 the group founded Nippon Toki Gomei Kaisha, with its factory at Noritake, a village near Nagoya; the place name became the brand {src:noritake,morimura,vp}. In 1914 it finished Japan's first Western-style dinner set, the Sedan pattern, and sent it to the United States {src:noritake,morimura,vp}. The company was reorganized as Nippon Toki Kabushiki Kaisha in 1917 {src:noritake,morimura,vp}.",
        "Morimura Bros. closed its New York office in December 1941 {src:morimura,page}. Export trade reopened in August 1947 {src:vp,noritake}. In 1981 the company took the name Noritake Co., Limited {src:noritake,uspto}, which still makes tableware.",
    ],
    marks_heading="Noritake marks, in order",
    marks_intro="No photograph of a Noritake backstamp under an open license was found, so each mark here is described in words. Noritake used hundreds of backstamp variants; these are the main kinds and the dates they point to {src:vp,spain}.",
    marks=[
        dict(id="nippon-era", name="Nippon-era marks", dates="Before 1921",
             body="Before 1921 the Morimura group marked wares for the US with Nippon and one of its symbols: a maple leaf, an M in a wreath, the letters RC on a balancing-toy device, or a round komaru emblem {src:vp,alden,murphy,wojc}. Our <a href=\"/marks/nippon-marks\">Nippon marks</a> page covers them.", images=[]),
        dict(id="m-wreath", name="Noritake with the M in a wreath", dates="About 1912 or 1918 to about 1953",
             body="An M, for Morimura, in a leafy wreath open at the top, with Noritake above and Hand Painted, then Nippon or Made in Japan, below, printed usually in green, also red or blue {src:alden,vp,dtic}. With Nippon it is before 1921; with Japan or Made in Japan, 1921 or later {src:alden,vp,spain}. Alden and Richardson date its first use with Noritake to 1918; Van Patten records a version registered in Japan in 1912 {src:alden,vp}.", images=[]),
        dict(id="komaru", name="The komaru with Made in Japan", dates="After 1921",
             body="The round komaru emblem with Made in Japan or Nippon Toki Kaisha, used especially on wares for Britain and Europe {src:spain,murphy}.", images=[]),
        dict(id="rose-china", name="Rose China", dates="About 1946 to 1948",
             body="Just after the war, while its china was below the old standard, the company marked it Rose China rather than Noritake {src:vp,schiffer,spain}. Some versions have the initials RC with the komaru {src:klamkin,vp}.", images=[]),
        dict(id="occupied", name="Noritake with Made in Occupied Japan", dates="August 1947 to April 1952",
             body="Noritake's backstamp of the occupation years adds Made in Occupied Japan {src:vp,page}. Noritake told Van Patten it was not used before August 1947, when exports reopened {src:vp}. The occupation ended on April 28, 1952 {src:state,klamkin}. Wares of these years were also lawfully marked just Japan or Made in Japan, so the absence of Occupied does not rule them out {src:page,florence}.", images=[]),
        dict(id="noritake-china", name="Noritake China with the M in a wreath, again", dates="From 1948",
             body="From 1948 the Noritake name returned to the backstamp with the M in a wreath {src:vp,spain}.", images=[]),
        dict(id="n-wreath", name="The N in a wreath", dates="From 1953",
             body="An N, for Noritake, in a wreath, with Noritake above and often China or Japan below; later versions add a bow, Bone China or the registered sign {src:page,brewer,vp}. It replaced the M in 1953, by most accounts; Van Patten says it was registered in Japan in 1953 but used from 1952 {src:page,brewer,vp}.", images=[]),
        dict(id="overseas", name="Noritake with another country", dates="From 1972",
             body="Noritake's own history lists a plant in Sri Lanka from 1972 and later ones in Indonesia and Thailand {src:noritake}. A Noritake mark that names a country other than Japan points to one of these later plants.", images=[]),
    ],
    careful_heading="Copied marks and look-alikes to be careful with",
    cautions=[
        "Copies of the M in a wreath appear on new porcelain made in the Nippon style: a wreath upside down with an hourglass inside, a wreath with a K inside, or a wreath closed at the top {src:vp,chervenka}. The genuine wreath is open at the top.",
        "Noritake's own Australian company says its backstamps have been copied or put on items it did not make, and that an item's quality and style should match the era its mark claims {src:noritakeau,vp}.",
        "Made in Occupied Japan is not a Noritake mark. Many Japanese makers used it between 1945 and 1952 {src:florence,klamkin}.",
        "RC appears in two eras: on the Nippon-era Royal Crockery mark and on the postwar Rose China mark. The letters alone do not date an item {src:vp,klamkin,brewer}.",
    ],
    disagree=[
        "The New York store: Noritake's history has Toyo Morimura open Morimura Brothers in 1876 {src:noritake}; Morimura Bros.' own timeline has a store called Hinode Shokai in 1876, renamed Morimura Brothers in 1881 {src:morimura}.",
        "The first Noritake M in a wreath: 1918 according to Alden and Richardson {src:alden}, or registered in Japan in 1912 according to Van Patten {src:vp}.",
        "Rose China: 1946 to 1947 in some books {src:vp,schiffer,spain}, 1946 to 1948 in another {src:rinker}.",
        "The N in a wreath: from 1953 {src:page,brewer,noritakeau}, or from 1952 as Van Patten records {src:vp}.",
    ],
    sources=dict(
        noritake={"cite": "Noritake Co., Limited, “History of Noritake” and “Historical record” (the company's own published history)", "url": "https://www.noritake.co.jp/eng/company/about/historical_record/"},
        morimura={"cite": "Morimura Bros., Inc., “History” (the Morimura trading company's own published history, 2014)", "url": "https://web.archive.org/web/20140204031632/http://www.morimura.co.jp/english/history/"},
        noritakeau={"cite": "Noritake (Australia), “Identify your Noritake” (the company's guide to its backstamps)", "url": "https://www.noritake.com.au/pages/identify-your-noritake"},
        vp=VP_NORITAKE,
        alden=ALDEN,
        spain=SPAIN,
        murphy=MURPHY,
        wojc={"cite": "Kathy Wojciechowski, <em>The Wonderful World of Nippon Porcelain, 1891–1921</em> (West Chester: Schiffer, 1992)", "url": ia("wonderfulworldof0000wojc")},
        page={"cite": "Bob Page, Dale Frederiksen and Dean Six, <em>Noritake: Jewel of the Orient</em> (Greensboro: Page/Frederiksen, 2001)", "url": ia("noritakejewelofo0000page")},
        brewer={"cite": "Robin Brewer, <em>Noritake Dinnerware: Identification Made Easy</em> (Atglen: Schiffer, 1999)", "url": ia("noritakedinnerwa0000brew")},
        schiffer={"cite": "Nancy Schiffer, <em>Japanese Porcelain, 1800–1950</em> (West Chester: Schiffer, 1986)", "url": ia("japaneseporcelai0000schi")},
        klamkin={"cite": "Marian and Charles Klamkin, <em>Made in Occupied Japan: A Collector's Guide</em> (New York: Crown, 1976)", "url": ia("madeinoccupiedja00klam")},
        florence={"cite": "Gene Florence, <em>Occupied Japan Collectibles</em> (Paducah: Collector Books, 2001)", "url": ia("occupiedjapancol0000flor")},
        rinker={"cite": "Harry L. Rinker, <em>Stemware of the 20th Century</em> (New York: House of Collectibles, 1997)", "url": ia("stemwareof20thce0000rink")},
        chervenka=CHERVENKA,
        dtic={"cite": "US Army Corps of Engineers, Pittsburgh District, <em>Analysis of Archaeological, Geological and Historical Artifacts … Midden Excavation at ‘Woodville’, Chartiers Creek, Pennsylvania</em> (1985), p. 373 (Noritake Made in Japan marks found in the excavation)", "url": ia("DTIC_ADA153688")},
        state={"cite": "US Department of State, Office of the Historian, “Occupation and Reconstruction of Japan, 1945–52”", "url": "https://history.state.gov/milestones/1945-1952/japan-reconstruction"},
        uspto={"cite": "United States Patent and Trademark Office, <em>Official Gazette</em> (Trademarks), June 22 and August 3, 1982 (registrations moved from Nippon Toki Kabushiki Kaisha to Noritake Co. Limited)", "url": ia("sim_official-gazette-us-patent-trademark-office-trademarks_1982-06-22_1019_4")},
    ),
    cta="Photograph the backstamp. The Advisor reads the wreath, the wording and the country, dates the mark from the periods on this page, and keeps the pattern name with the item's record when the backstamp gives one.",
    faqs=[
        ("How old is my Noritake if it says Nippon?",
         "Before 1921. After the US ruling of 1921 the same marks read Japan or Made in Japan {src:alden,spain,vp}."),
        ("What do the M and the N in the wreath mean?",
         "M is for Morimura, the trading family behind the company, and was used until the early 1950s; N is for Noritake, from 1953 {src:alden,page,vp}."),
        ("What is Rose China?",
         "The name Noritake put on its first postwar china, about 1946 to 1948, while it kept its own name off ware below its old standard {src:vp,schiffer,spain}."),
        ("Does Made in Occupied Japan mean Noritake?",
         "No. Many makers used it between 1945 and 1952; Noritake's own backstamp of those years also carries the Noritake name {src:vp,florence,page}."),
        ("When was Noritake founded?",
         "Its factory company was founded in 1904 near Nagoya by the Morimura group, which dates from 1876 {src:noritake,morimura,vp}."),
    ],
)


# ── Limoges and Haviland ──────────────────────────────────────────────────────

JERVIS = {"cite": "W. P. Jervis, <em>A Book of Pottery Marks</em> (Newark, 1897), pp. 38–40, with facsimiles of the Limoges marks; and his <em>Encyclopedia of Ceramics</em> (New York, 1902), pp. 17, 231, 277–280, 456–457", "url": ia("bookpotterymark00jervgoog")}
CHAFFERS_1912 = "William Chaffers, <em>Marks and Monograms on European and Oriental Pottery and Porcelain</em>, 13th ed. (London: Reeves &amp; Turner, 1912)"
CUSHION = "J. P. Cushion and W. B. Honey, <em>Handbook of Pottery and Porcelain Marks</em> (London: Faber &amp; Faber, 1956)"
MET_OA = "The Metropolitan Museum of Art, Open Access"

LIMOGES = dict(
    slug="limoges-haviland-marks",
    title="Limoges and Haviland Marks: Blank Marks, Decorator Marks and Dates | Heirloom",
    desc="How to read Limoges porcelain marks: why there are often two, the green blank mark and the overglaze decorator's mark, what France in the mark means, and the Haviland & Co. and Theodore Haviland marks.",
    h1="Limoges and Haviland marks",
    crumb="Limoges and Haviland marks",
    card="Blank marks, decorator marks, the 1891 France rule and the two Haviland companies.",
    lede="Limoges is a town in France, not a single maker. A Limoges plate often carries two marks from two different firms, and knowing which is which is most of the work.",
    answer="Dozens of factories made porcelain at Limoges {src:chaffers,jervis,cushion}. A mark printed in green under the glaze usually names the factory that made the white porcelain; a mark in red, brown, gold or another color over the glaze names whoever decorated it, which can be another firm or an American studio {src:jervis,ch}. France in the mark usually means 1891 or later, when the US began requiring the country of origin {src:statute,jervis}.",
    maker_heading="Who made Limoges porcelain",
    history=[
        "Limoges, in the Haute-Vienne, became a porcelain town after kaolin was found nearby at Saint-Yrieix in 1768 {src:jervis,chaffers}. By the late 1800s it had many factories, among them Alluaud, Pouyat, Tressemanes &amp; Vogt, Délinières, Guérin, Lanternier, Bernardaud, Gérard Dufraisseix and the Havilands {src:chaffers,jervis,cushion}. A US customs decision of 1907 counted some thirty-six makers in and around the town and forty or more firms that decorated china {src:customs}.",
        "Much of it was sold white, as blanks, to decorators: in Paris, and later in America, where decorating studios and amateur china painters added their own decoration and marks {src:jervis,ch}.",
        "Haviland &amp; Co. was founded by David Haviland, a New York china importer, who settled in Limoges in the early 1840s to make porcelain for the American market {src:dalbis,jervis}. In the 1870s and 1880s the firm also ran an art-pottery studio at Auteuil, near Paris, making painted earthenware and stoneware {src:jervis,met}.",
        "His son Theodore Haviland left the family firm and set up his own company and factory in Limoges around 1890 to 1893; the sources give different years {src:jervis,dalbis}. From then on there were two separate Haviland firms with separate marks {src:jervis,cushion}. A third, Charles Field Haviland, ran a different Limoges factory whose marks read CFH {src:jervis,cushion}.",
    ],
    marks_heading="Limoges and Haviland marks, in order",
    marks=[
        dict(id="blank", name="Blank marks, under the glaze", dates="The 1800s on",
             body="The maker's initials or name, often with Limoges and later France, printed under the glaze, usually in green, when the white porcelain was fired. It names who made the porcelain, not who painted it {src:jervis,ch}. Jervis printed separate white-ware and decorated-ware marks for several Limoges firms in 1897 {src:jervis}.",
             images=[dict(file="limoges-tv-blank-pickard-decorator-mark", alt="A green T&V Limoges France blank mark with Century and a 1901 patent date, above a brown round Pickard decorator's mark",
                          caption="Two firms on one plate: the green blank mark of Tressemanes &amp; Vogt of Limoges, and below it the brown mark of the Pickard studio of Chicago, which decorated it.",
                          credit="Rabbi Mendl, via Wikimedia Commons", licence="CC BY-SA 4.0", page="https://commons.wikimedia.org/wiki/File:Tressemann_%26_Vogt_LIMOGES_patent_mark_26_February_1901_Pickard_Studio_mark.jpg")]),
        dict(id="decorator", name="Decorating marks, over the glaze", dates="The 1800s on",
             body="A name or initials, often in a circle or in script, fired on over the glaze with the decoration, in red, brown, gold or another color {src:jervis,met}. It names who decorated or sold the item: the factory itself, another firm, an American studio, or an amateur. A painted name and date, such as the “Lottie 2-13-1893” on a Haviland dish at the Cooper Hewitt, are the painter's, not the factory's {src:ch,jervis}.",
             images=[]),
        dict(id="france", name="France in the mark", dates="Usually 1891 or later",
             body="The McKinley Tariff required imports to the US to be marked with their country of origin in English from March 1, 1891 {src:statute,jervis}. Jervis notes that one Limoges firm added France to its mark in 1891 {src:jervis}. So France usually means 1891 or later; a mark without it can be earlier, or made for a market outside the US {src:statute,jervis}. It is a rule of thumb, not proof.",
             images=[]),
        dict(id="hco-impressed", name="H &amp; Co impressed, on Haviland stoneware", dates="About 1873 to 1885",
             body="H &amp; Co impressed in the clay, sometimes in a beaded circle, is found on the earthenware and stoneware of Haviland's Auteuil studio, which the Met dates about 1880 to 1885 {src:met,jervis}. It is Haviland art pottery, not Limoges porcelain.",
             images=[dict(file="haviland-tankard-met-impressed-hco", alt="The base of a brown stoneware tankard with H & Co impressed in a beaded circle and incised numbers",
                          caption="H &amp; Co impressed in a beaded circle on a Haviland stoneware tankard made with Ernest Chaplet, about 1885.",
                          credit=MET_OA, licence="CC0", page="https://commons.wikimedia.org/wiki/File:Tankard_with_man_drinking_from_jug_MET_SF2013_475_marks.jpg")]),
        dict(id="hco-l", name="H &amp; Co over L, in green", dates="Before about 1891",
             body="H &amp; Co over a line with L below, under the glaze in green: Haviland &amp; Co.'s mark on its own white porcelain {src:jervis,met}. Without France it most likely predates the 1891 rule; museums date such items from about 1876 to 1890 {src:met,phila}.",
             images=[dict(file="haviland-dish-met-1993-353-5-marks", alt="Two marks on a porcelain dish: a round HAVILAND & Co LIMOGES mark in green above, and H & Co over a line with L below",
                          caption="Both Haviland marks on one dish of about 1880: the round Haviland &amp; Co. Limoges decorating mark above, and the H &amp; Co over L blank mark below, without France.",
                          credit=MET_OA + ", 1993.353.5", licence="CC0", page="https://commons.wikimedia.org/wiki/File:Dish_MET_SF1993_353_5_marks.jpg")]),
        dict(id="hco-l-france", name="H &amp; Co, L and France", dates="From 1891",
             body="The same blank mark with France added, from 1891 {src:jervis,statute}. The Cooper Hewitt records a dish with this mark that was decorated in America and signed and dated 1893 by its painter {src:ch}. Jervis printed this mark as Haviland's white-china mark in 1897 {src:jervis}.",
             images=[dict(file="haviland-hco-l-france-blank-mark", alt="Green H & Co, L, France mark on the back of a white plate",
                          caption="H &amp; Co, L and France in green under the glaze on the back of a plate.",
                          credit="Rabbi Mendl, via Wikimedia Commons", licence="CC BY-SA 4.0", page="https://commons.wikimedia.org/wiki/File:2021.03.30_LIMOGES_HAVILAND_Porcelain_Plate_1888_%E2%80%93_1896_Hand_Painted_with_Berries_05.jpg")]),
        dict(id="haviland-limoges", name="Haviland &amp; Co. Limoges, the decorating mark", dates="From about the 1870s",
             body="The firm's full name over or around the word Limoges, fired on over the glaze, means Haviland decorated the item itself {src:jervis,met}. The colors and extra wording of these marks changed over the years; the sources used here do not date each version.",
             images=[]),
        dict(id="theo", name="Theo Haviland, Limoges, France", dates="From about 1892",
             body="Theodore Haviland's own firm marked its ware with his name, often written Theo Haviland, over Limoges and France {src:jervis,cushion}. It is a separate company from Haviland &amp; Co. {src:jervis,cushion}",
             images=[dict(file="limoges-jervis-1897-marks", alt="Facsimiles of eleven Limoges marks from 1897, including Theo Haviland Limoges France, CFH GDM France and H & Co L France",
                          caption="Limoges marks as Jervis printed them in 1897: Theo Haviland (56, top row), CFH over GDM and the round Ch. Field Haviland mark (62, bottom row), and H &amp; Co, L, France (63, bottom right).",
                          credit="Jervis, A Book of Pottery Marks (1897), p. 39", licence="public domain", page="https://archive.org/details/bookpotterymark00jervgoog")]),
        dict(id="cfh", name="CFH and GDM", dates="1868 to the 1890s",
             body="CFH is Charles Field Haviland's factory, the old Alluaud works; GDM was added under its successors Gérard, Dufraisseix and Morel from about 1881, and France from 1891 {src:jervis,cushion}. These marks are not Haviland &amp; Co.'s {src:jervis,cushion}.",
             images=[]),
    ],
    careful_heading="Look-alike and later marks to be careful with",
    cautions=[
        "Two marks, two firms. Most of the questions about Limoges come from reading the decorator's mark as the maker's, or the reverse {src:jervis,ch}.",
        "Three Havilands. Haviland &amp; Co. (H &amp; Co), Theodore Haviland (Theo Haviland) and Charles Field Haviland (CFH) were separate businesses with separate marks {src:jervis,cushion}.",
        "Haviland made in America. The Lawrence County Historical Society in Pennsylvania records that Shenango China of New Castle made dinnerware for Theodore Haviland from 1936, marked Theodore Haviland New York and Made in America {src:lchs}. That ware is American, not from Limoges.",
        "Limoges made in Ohio. The Sebring Ohio Historical Society records that the Limoges China Company of Sebring, Ohio, put Limoges in its marks, later changing to American Limoges {src:sebring}.",
        "Since 2017 the name Porcelaine de Limoges has been protected in France for porcelain made entirely in the Haute-Vienne, partly against copies, Euronews reported {src:euronews}.",
    ],
    disagree=[
        "When Theodore Haviland set up on his own: after a partnership ended on January 1, 1890, in Jervis's 1897 book, but on January 1, 1892, in his 1902 encyclopedia {src:jervis}; the late 1880s in Laurens d'Albis's account {src:dalbis}.",
        "The usual collectors' dates for each Haviland mark (for example H &amp; Co over L from 1876) come from specialist Haviland books that could not be checked for this page, so they are not given here.",
    ],
    sources=dict(
        jervis=JERVIS,
        chaffers={"cite": CHAFFERS_1912 + ", pp. 620–621 (Limoges)", "url": ia("marksmonogra00chaf")},
        cushion={"cite": CUSHION + ", pp. 72–74 (Limoges)", "url": ia("in.ernet.dli.2015.281011")},
        statute=STATUTE,
        customs={"cite": "<em>Custom House Justice and Haviland China</em> (New York: Haviland &amp; Co., 1907), p. 4, reprinting decisions of the US Board of General Appraisers", "url": ia("cu31924013921840")},
        dalbis={"cite": "Laurens d'Albis, “The Havilands, a family of china manufacturers,” Musée protestant", "url": "https://museeprotestant.org/en/notice/the-havilands-were-a-family-of-china-manufacturers/"},
        met={"cite": MET_OA + ", collection records 1993.353.5 (dish, about 1880, with Haviland's blank and decorating marks), 1993.353.4 (vase, about 1880) and SF2013.475 (stoneware tankard, about 1885)", "url": "https://www.metmuseum.org/art/collection/search/208157"},
        ch={"cite": "Cooper Hewitt, Smithsonian Design Museum, collection record 1970-8-2-a,b (covered dish, Haviland &amp; Co. blank, decorated in the US and signed “Lottie 2-13-1893”)", "url": "https://collection.cooperhewitt.org/objects/18472647"},
        phila={"cite": "Philadelphia Museum of Art, collection record 296335 (plate, Haviland &amp; Co., 1876–1890)", "url": "https://www.philamuseum.org/objects/296335"},
        lchs={"cite": "Lawrence County Historical Society (Pennsylvania), “Shenango China Collection”", "url": "https://www.lawrencechs.org/museum/shenango-china-collection/"},
        sebring={"cite": "Sebring Ohio Historical Society, “Limoges / American Limoges of Sebring”", "url": "https://sebringohiohistoricalsociety.org/Limoges.html"},
        euronews={"cite": "“Limoges porcelain earns recognition of geographical name,” Euronews, December 1, 2017", "url": "https://www.euronews.com/2017/12/01/limoges-porcelain-earns-recognition-of-geographical-name"},
    ),
    cta="Photograph every mark on the base, green and colored. The Advisor reads each one, says which names the porcelain maker and which the decorator, and dates them where the mark allows.",
    faqs=[
        ("Why does my Limoges have two marks?",
         "One is usually the factory's mark, printed under the glaze in green when the white porcelain was made; the other is the decorator's, fired on over the glaze with the painting {src:jervis,ch}. They can be two different firms."),
        ("Is Limoges a brand?",
         "No. It is a town in France with many porcelain factories, and Limoges in a mark tells you where, not who {src:chaffers,jervis,cushion}."),
        ("What does France on a Limoges mark tell me?",
         "That it was most likely marked in 1891 or later, when the US began requiring imports to name their country of origin {src:statute,jervis}."),
        ("Are Haviland and Theodore Haviland the same company?",
         "No. Theodore Haviland left Haviland &amp; Co. and founded his own firm around 1890 to 1893, with his own marks {src:jervis,dalbis,cushion}."),
        ("My plate has a name and a date painted on the back. Is that the factory?",
         "Usually not. Painted names and dates are often the painter's, for example an amateur who decorated a Limoges blank {src:ch,jervis}."),
    ],
)

MAKERS = [WELLER, ROSEVILLE, NIPPON, NORITAKE, LIMOGES]
