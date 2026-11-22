"""Silver-plate maker pages: 1847 Rogers Bros., Community (Oneida), Holmes &
Edwards, Wm. Rogers and International Silver Co.

Unlike the date-letter and pottery pages these don't come from the app's mark
tables: American plate makers didn't date their marks, so each page is a short
maker history, the marks and what each tells you, and how to date an item from
its pattern. Every fact on a page is from at least two of the sources it lists;
where they disagree the page says so. Mark photos are open-licence photographs
(credited under each); a mark with no open photograph is described in words.
"""
from shell import *
from p_marks import MID, cta, e

CSS = '<link rel="stylesheet" href="/marks/marks.css">'


def src_list(items):
    lis = "".join(
        f"<li>{n}" + (f' (<a href="{e(u)}" rel="nofollow">source</a>)' if u else "") + "</li>"
        for n, u in items
    )
    # Citations, not claims: the copy check skips them, as on the other marks pages.
    return f'<!--copy-check:skip--><ul class="sources">{lis}</ul><!--/copy-check:skip-->'


def photo(file, alt, caption, credit):
    return (f'<figure class="markphoto"><img src="/marks/img/{file}.webp" alt="{e(alt)}" loading="lazy" decoding="async">'
            f'<figcaption>{caption} <span class="stamps__credit">{credit}</span></figcaption></figure>')


def marks_table(rows, head=("The mark", "Who used it, and when", "What it tells you"), cls=""):
    trs = "".join(f'<tr><th scope="row">{r[0]}</th>' + "".join(f"<td>{c}</td>" for c in r[1:]) + "</tr>" for r in rows)
    ths = "".join('<th scope="col">' + h + "</th>" for h in head)
    return f'<div class="table-wrap"><table{cls}><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table></div>'


def maker_page(p):
    body = f"""      <p class="guide__lede">{p["lede"]}</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>{p["answer"]}</p>
      </div>
{p["body"]}
      <h2 id="sources">Sources</h2>
      <p>Each fact on this page is from at least two of these. Where they disagree, the page gives both.</p>
      {src_list(p["sources"])}
{cta(p["cta"])}
      <h2 id="faq">Questions</h2>
{faq_html(p["faqs"])}
"""
    graph = [article_ld(p["path"], p["h1"], p["desc"], extra={"about": {"@type": "Organization", "name": p["org"]}}), faq_ld(p["path"], p["faqs"])]
    return p["path"], page(p["path"], p["title"], p["desc"], p["h1"], body, graph, mid=MID, crumb_name=p["crumb"], extra_head=CSS)


# ── Sources the pages share ───────────────────────────────────────────────────

S = {
    "silverstd": ("<em>The Silver Standard</em>, Meriden Britannia Co. (International Silver Co., successor), 1906–07: the maker's own paper, used for what the company said of itself", "https://archive.org/details/silverstandardpe00meri"),
    "cbr1901": ("<em>Commemorative Biographical Record of Hartford County, Connecticut</em>, J. H. Beers &amp; Co., 1901, pp. 248 and 880", "https://archive.org/details/commemorativebio01beer/page/n677"),
    "meriden150": ("<em>150 Years of Meriden</em>, Meriden sesquicentennial committee, 1956", "https://archive.org/details/150yearsofmeride00meri/page/n121"),
    "curtis1906": ("Gillespie and Curtis, <em>A Century of Meriden</em>, 1906, part II, pp. 35–48", "https://archive.org/details/bub_gb_-zQWAAAAYAAJ/page/n1093"),
    "curtis1913": ("George Munson Curtis, <em>Early Silver of Connecticut and its Makers</em>, International Silver Co., 1913, p. 109", "https://archive.org/details/earlysilverofcon00curt/page/n151"),
    "jc1896": ("<em>Trade-Marks of the Jewelry and Kindred Trades</em>, Jewelers' Circular Publishing Co., 1896", "https://archive.org/details/TradeMarksJewelryAndKindredTrades/page/n85"),
    "busiest1889": ("<em>13th Annual Illustrated Catalog</em>, The Busiest House in America, 1889, pp. 115–135", "https://archive.org/details/13thannualillust00busi/page/n121"),
    "rb1892": ("<em>Price List of the Celebrated Rogers &amp; Bro. A-1 Electro Silver Plated Spoons, Forks, Knives</em>, Rogers &amp; Brother, 1892", "https://archive.org/details/pricelistofceleb00roge/page/n10"),
    "sears1897": ("<em>Sears, Roebuck &amp; Co. Catalogue No. 104</em>, spring 1897", "https://archive.org/details/sears-roebuck-catalog-104-spring-1897"),
    "case1882": ("<em>William Rogers Mfg. Co. v. Rogers &amp; Spurr Mfg. Co.</em>, 11 F. 495 (C.C.D. Mass. 1882)", "https://law.resource.org/pub/us/case/reporter/F/0011/0011.f.0495.pdf"),
    "case1887": ("<em>William Rogers Mfg. Co. v. Simpson, Hall, Miller &amp; Co.</em>, 54 Conn. 527 (1887)", ""),
    "case1895a": ("<em>William Rogers Mfg. Co. v. R. W. Rogers Co.</em>, 66 F. 56 (C.C.S.D.N.Y. 1895)", "https://law.resource.org/pub/us/case/reporter/F/0066/0066.f1.0056.pdf"),
    "case1895b": ("<em>R. W. Rogers Co. v. Wm. Rogers Mfg. Co.</em>, 70 F. 1017 (2d Cir. 1895)", "https://law.resource.org/pub/us/case/reporter/F/0070/0070.f1.1017.pdf"),
    "pat1904": ("US design patent D37,059, Samuel Stohr for International Silver Co., granted August 2, 1904 (the Vintage handle)", "https://patents.google.com/patent/USD37059S/en"),
    "rainwater": ("Point Ellice House collection, Simpson, Hall, Miller &amp; Co., citing Rainwater, <em>Encyclopedia of American Silver Manufacturers</em> (Library and Archives Canada web archive)", "https://epe.lac-bac.gc.ca/100/205/301/ic/cdc/peh/objects/manufacturers/pmanu29.html"),
    "ch_fish": ("Cooper Hewitt, Smithsonian Design Museum: Assyrian Head pattern fish server, Meriden Britannia Co., 1885–86, marks recorded by the museum", "https://collection.cooperhewitt.org/view/objects/asitem/id/202018"),
}


def uspto(reg, what):
    return (f"US trademark registration {reg}: {what}", f"https://tsdr.uspto.gov/#caseNumber={reg}&caseType=US_REGISTRATION_NO&searchType=statusSearch")


CH_CREDIT = 'Photograph: <a href="https://collection.cooperhewitt.org/view/objects/asitem/id/202018" rel="nofollow">Cooper Hewitt, Smithsonian Design Museum</a>, Open Access (CC0), cropped and toned by Heirloom.'

PLATE_OR_STERLING = """      <p>Read the whole stamp first. American sterling is marked STERLING. Plate is marked with the maker's name and often a grade word or number, such as A1, XII, XIV, TRIPLE or QUADRUPLE PLATE, and a grade mark appears only on plate.</p>
      <p>Then look at the places that wear. Plate is a thin coat of silver over a base metal, usually nickel silver, so on a well-used spoon the tip of the bowl, the back of the bowl and the ends of fork tines turn yellowish or gray where the silver has worn through to the metal underneath.</p>"""

DATING_RULE = """      <p>American plate makers didn't stamp a year. A number in the mark, such as 1847 or 1865, is the year a firm said it was founded and stayed on the ware for decades. To date an item, name its pattern (the design of the handle) and find when that pattern was introduced. A patent date stamped on a handle (PAT. followed by a date) is the earliest the design can be, not the year the item was made, and makers kept producing a popular pattern for decades.</p>"""


# ── 1847 Rogers Bros. ─────────────────────────────────────────────────────────

def rogers_1847():
    path = "/marks/1847-rogers-bros"
    marks = marks_table([
        ("1847 ROGERS BROS.", "Meriden Britannia Co., Meriden, Connecticut, from about 1862; International Silver Co. from 1898", "The flatware brand. 1847 is the year the business counted from, not the year the item was made."),
        ("ROGERS BROS. (no 1847)", "Meriden Britannia Co. and International Silver Co.", "The same company's mark on hollowware: tea sets, trays and dishes."),
        ("A1 after the name", "On 1847 Rogers Bros. flatware from at least the 1880s", "Standard first-quality plate, sold as &ldquo;extra plate&rdquo;."),
        ("XII", "1847 Rogers Bros. flatware in the 1880s and 1890s", "&ldquo;Sectional&rdquo; plate: extra silver laid on the parts that wear (the back of the bowl, the heel, the tips) before the whole item was plated."),
        ("TRIPLE", "Sold beside A1 in the period catalogs", "The heaviest regular grade of plate."),
        ("1847 ROGERS BROS. STERLING, or 1847 STERLING", "International Silver Co., from May 15, 1940", "Sterling silver, not plate. Only an item stamped STERLING is solid silver."),
    ])
    body = f"""      <h2 id="maker">Who made it</h2>
      <p>Asa H., Simeon S. and William Rogers were silversmiths in Hartford, Connecticut, who began making silver-plated spoons and forks there in the 1840s. The sources give different starting years: one 1901 county history gives 1844, 1846 and 1847 in three different family sketches, and a 1913 history says &ldquo;about 1847&rdquo;. The company that inherited their name settled on 1847 and put it in the mark.</p>
      <p>In 1862 the brothers closed their Hartford works and the Meriden Britannia Co. of Meriden, Connecticut, took over their tools and dies, with the brothers supervising the work on a royalty. Meriden Britannia made 1847 Rogers Bros. flatware from then on, and in 1898 it was one of the founding companies of the International Silver Co., which kept the brand going well into the 20th century (it registered the name for stainless steel flatware in 1953). The company's own paper said in 1906 that the brothers had discovered electroplating in 1847; that is the maker's advertising, and no independent history says the same.</p>
      <h2 id="marks">The marks, and what each tells you</h2>
      {photo("plate-1847-rogers-bros-a1", "1847 ROGERS BROS. A1 stamped on the back of a handle, with a small round mark after it", "The mark on the back of a fish server in the Assyrian Head pattern, made by Meriden Britannia Co. in 1885–86: 1847 ROGERS BROS. A1. The small round mark after it is Meriden Britannia's own, a circle around a balance scale.", CH_CREDIT)}
      {marks}
      <p class="note">The marks are stamped on the back of the handle, near where it meets the bowl or tines. The trademark registration claims the 1847 ROGERS BROS. mark was first used in 1862, fifteen years after the date it carries.</p>
      <h2 id="plate-or-sterling">Is it plate or sterling?</h2>
      <p>Almost always plate: the period catalogs and the 1896 trademark directory list 1847 Rogers Bros. as plated ware, silver over a nickel-silver base. From 1940 International Silver also sold sterling under the name, and those items say STERLING beside it.</p>
{PLATE_OR_STERLING}
      <h2 id="dating">How to date 1847 Rogers Bros.</h2>
{DATING_RULE}
      <ul>
        <li><strong>Vintage</strong>, the grape-and-vine handle, is US design patent D37,059 of August 2, 1904, granted to Samuel Stohr for International Silver. The maker advertised it as new and patented in 1906.</li>
        <li><strong>Charter Oak</strong> was introduced in 1907 according to the maker's own paper of that year, which calls it the pattern for the business's 60th anniversary. Collectors' lists give 1906.</li>
        <li><strong>Before 1890</strong>: a jeweler's catalog of 1889 already sold 1847 Rogers Bros. flatware in the Arcadian, Assyrian, Crown, Lorne, Newport, Laurel, Embossed, Florentine, Daisy and Fairie patterns, so an item in one of those was made in 1889 or earlier, or is a later reissue.</li>
      </ul>
      <p class="note">Introduction years for the later patterns (First Love, Adoration, Eternally Yours, Remembrance, Heritage and others) are given on collectors' sites, but we haven't found two independent published sources for any of them, so they aren't listed here.</p>
      <h2 id="other-rogers">Not every Rogers is 1847 Rogers Bros.</h2>
      <p>The brothers licensed their name, and other firms used the surname on their own: Rogers &amp; Bro. of Waterbury (a star before the name), C. Rogers &amp; Bros. of Meriden (a different family), Wm. Rogers and Wm. A. Rogers. Courts stopped several imitators in the 1880s and 1890s. <a href="/marks/wm-rogers">The Wm. Rogers page</a> sets out which firm used which Rogers mark.</p>"""
    faqs = [
        ("Does 1847 mean my spoon was made in 1847?",
         "<p>No. 1847 is the year the business counted as its founding, and it stayed in the mark for about a century. The mark itself was first used around 1862, and the maker said in 1906 that the number was a trademark, not a date. Date the item from its pattern instead.</p>"),
        ("Is 1847 Rogers Bros. real silver?",
         "<p>It is silver plate: a coat of pure silver over a nickel-silver base. Only items stamped STERLING beside the name, made by International Silver from 1940, are solid silver.</p>"),
        ("What do A1, XII and TRIPLE mean?",
         "<p>They are grades of plate. A1 is standard first-quality plate, XII is plate with extra silver on the parts that wear, and TRIPLE is the heaviest regular grade.</p>"),
        ("Who made 1847 Rogers Bros. silverware?",
         "<p>The Meriden Britannia Co. of Meriden, Connecticut, from 1862, and the International Silver Co. from 1898. The Rogers brothers of Hartford started the business and supervised the work in Meriden for some years after 1862.</p>"),
        ("Is 1847 Rogers Bros. the same as Wm. Rogers or Wm. A. Rogers?",
         "<p>No. Wm. Rogers marks come from William Rogers's later Hartford firm and from a Wallingford licensee; Wm. A. Rogers was an unrelated New York firm. See the <a href=\"/marks/wm-rogers\">Wm. Rogers page</a>.</p>"),
    ]
    return maker_page(dict(
        path=path, org="Meriden Britannia Co. (1847 Rogers Bros.)",
        title="1847 Rogers Bros. Marks: Is It Silver, and How Old Is It? | Heirloom",
        desc="What the 1847 Rogers Bros. mark means (1847 is not the date it was made), who made it, what A1, XII and TRIPLE mean, how to tell plate from sterling, and how to date it.",
        h1="1847 Rogers Bros. marks", crumb="1847 Rogers Bros.",
        lede="The most common name on old American silverware. Here is who made it, what each part of the mark means, and why 1847 isn't the year your spoon was made.",
        answer="1847 Rogers Bros. is silver-plated flatware made by the Meriden Britannia Co. of Meriden, Connecticut, from about 1862, and by the International Silver Co. from 1898. 1847 is the year the Rogers brothers' business counted from, not the date of manufacture. Unless the mark also says STERLING, the item is plate; date it from its pattern.",
        body=body, faqs=faqs,
        sources=[S["cbr1901"], S["curtis1913"], S["meriden150"], S["curtis1906"], S["silverstd"], S["jc1896"], S["busiest1889"], S["rb1892"], S["sears1897"], S["case1882"],
                 uspto(329758, "1847 ROGERS BROS, silver-plated flatware, first use claimed 1862"), uspto(385300, "1847 ROGERS BROS. STERLING, first use May 15, 1940"), uspto(734880, "1847 ROGERS BROS, stainless steel flatware, first use 1953"), S["pat1904"], S["ch_fish"]],
        cta="Photograph the back of the handle. The Advisor reads the mark and the pattern, keeps what it read on the item's record with the photo, and says plainly that 1847 is a brand date, not the year it was made.",
    ))


# ── Wm. Rogers, and the other Rogers marks ────────────────────────────────────

ROGERS_TABLE = [
    ("1847 ROGERS BROS.", "Meriden Britannia Co., Meriden, Connecticut, from about 1862; International Silver Co. from 1898", '<a href="/marks/1847-rogers-bros">1847 Rogers Bros.</a>; the brothers\' own line'),
    ("WM. ROGERS &amp; SON, often with an anchor", "Wm. Rogers Mfg. Co., Hartford, from 1865 or 1866; International Silver Co. from 1898", "William Rogers's later firm, run by partners who used his name"),
    ("1865 WM. ROGERS MFG. CO.", "Wm. Rogers Mfg. Co., Hartford, from 1865", "The same firm; 1865 is its founding year, not a date of making"),
    ("ROGERS between two anchors", "Wm. Rogers Mfg. Co., from 1887", "The same firm"),
    ("WM. ROGERS between an eagle and a star (&#9733;Wm. Rogers&#9733;)", "Simpson, Hall, Miller &amp; Co., Wallingford, Connecticut, from 1878; International Silver Co. later", "Made under a contract with William Rogers Jr., who lent his name and oversaw the work"),
    ("&#9733;ROGERS &amp; BRO. A1 (a star before the name)", "Rogers &amp; Brother, Waterbury, Connecticut, from 1858; International Silver Co. from 1898", "A separate firm, not the 1847 brothers"),
    ("C. ROGERS &amp; BROS. A1", "Cephas, Gilbert and Wilbur Rogers, Meriden, from about 1866; International Silver Co. from 1903", "A different Rogers family"),
    ("ROGERS, SMITH &amp; CO.", "Hartford, then New Haven, later owned by Meriden Britannia Co.", "Linked to the Meriden Britannia group; the sources disagree on when it moved to Meriden"),
    ("WM. A. ROGERS, or WM. A. ROGERS A1R in a horseshoe", "Wm. A. Rogers Ltd., New York, from 1895–96; later Oneida", "Unrelated to the Hartford Rogers family"),
    ("R. W. ROGERS CO.", "New York, 1894–95", "A short-lived imitation that a court stopped in 1895"),
]


def wm_rogers():
    path = "/marks/wm-rogers"
    body = f"""      <h2 id="maker">Who made it</h2>
      <p>William Rogers (1801–1873) was a Hartford, Connecticut, silversmith and one of the three Rogers brothers behind <a href="/marks/1847-rogers-bros">1847 Rogers Bros.</a> After the brothers' Hartford works closed in 1862, his name went on to two more makers of plated flatware.</p>
      <ul>
        <li><strong>Wm. Rogers Mfg. Co.</strong>, Hartford: formed in 1865 by partners who agreed with William Rogers and his son to use their name, and incorporated in 1872. It used WM. ROGERS &amp; SON and 1865 WM. ROGERS MFG. CO. It joined the International Silver Co. in 1898 and its work was moved to Meriden after 1903.</li>
        <li><strong>Simpson, Hall, Miller &amp; Co.</strong>, Wallingford, Connecticut: from 1878 it stamped WM. ROGERS between an eagle and a star under a contract with William Rogers Jr. Wm. Rogers Mfg. Co. sued, and in 1887 the Connecticut Supreme Court let the Wallingford firm keep using the name. It joined International Silver, which a 1906 history dates to 1899 and a later reference book to 1898.</li>
      </ul>
      <p>International Silver went on using both marks, the eagle-and-star mark on hollowware from 1919. The trademark registrations later passed to Syratech, not to Oneida.</p>
      <h2 id="marks">Which Rogers is yours?</h2>
      <p>Rogers is the most crowded name in American plate. The brothers licensed it, other Rogers families used it in their own right, and the courts of the 1880s and 1890s stopped several firms from borrowing it. Read the whole mark, including stars, anchors, eagles and initials:</p>
      {marks_table(ROGERS_TABLE, head=("The mark", "Who used it, and when", "How it relates"))}
      <p class="note">The table is from court opinions of 1882, 1887 and 1895, the 1896 trademark directory, Meriden and Hartford histories, and the makers' own trademark registrations. The marks are stamped on the back of the handle.</p>
      {photo("plate-wm-rogers-and-son", "WM. ROGERS &amp; SON AA stamped along the back of a spoon handle", "WM. ROGERS &amp; SON AA on the back of a silver-plated spoon handle: the Hartford firm's mark.", 'Photograph: <a href="https://www.flickr.com/photos/51035581380@N01/4894854455/" rel="nofollow">wm rogers &amp; son silverplate</a> by Deidre Woollard, <a href="https://creativecommons.org/licenses/by/2.0/" rel="nofollow">CC BY 2.0</a>, cropped and toned by Heirloom.')}
      {photo("plate-wm-a-rogers", "WM. A. ROGERS A1 followed by a horseshoe mark, stamped on a ladle handle", "WM. A. ROGERS A1 and a horseshoe on a cream ladle of about 1900: the unrelated New York firm, easy to misread as Wm. Rogers.", 'Photograph: <a href="https://www.europeana.eu/item/1091/item_7EL3HFXD4G632JXSF7TQ4TKGPJLXA7OJ" rel="nofollow">Deutsches Klingenmuseum Solingen</a>, 1990.B.200, <a href="https://creativecommons.org/licenses/by/4.0/" rel="nofollow">CC BY 4.0</a>, cropped and toned by Heirloom.')}
      <h2 id="plate-or-sterling">Is it plate or sterling?</h2>
      <p>Plate. Every Wm. Rogers mark was registered and listed for silver-plated ware, and we found no sterling made under the name. Simpson, Hall, Miller did make sterling from 1895, but under its own marks.</p>
{PLATE_OR_STERLING}
      <h2 id="dating">How to date Wm. Rogers</h2>
{DATING_RULE}
      <ul>
        <li>An eagle and star around WM. ROGERS: 1878 or later.</li>
        <li>ROGERS between two anchors: 1887 or later.</li>
        <li>WM. A. ROGERS, in any form: 1895 or later, and a different firm.</li>
        <li>1865 in the mark is the firm's founding year, like 1847 on 1847 Rogers Bros.</li>
      </ul>"""
    faqs = [
        ("Is Wm. Rogers the same as Wm. A. Rogers?",
         "<p>No. Wm. Rogers marks come from William Rogers's Hartford firm and the Wallingford firm he and his son licensed, both later International Silver. Wm. A. Rogers was a separate New York business whose marks begin in 1895–96 and later belonged to Oneida.</p>"),
        ("Is Wm. Rogers the same as 1847 Rogers Bros.?",
         "<p>Related, not the same. William Rogers was one of the 1847 brothers, but Wm. Rogers marks are from firms formed after 1865 that used his name. Both lines ended up with International Silver.</p>"),
        ("Is Wm. Rogers silverware real silver?",
         "<p>It is silver plate, a coat of silver over a base metal. We found no sterling made under the Wm. Rogers name.</p>"),
        ("What do the star and eagle in the mark mean?",
         "<p>They are the brand of Simpson, Hall, Miller &amp; Co. of Wallingford, Connecticut, used from 1878 under a contract with William Rogers Jr. An item with them was made in 1878 or later.</p>"),
        ("Does 1865 in the mark mean it was made in 1865?",
         "<p>No. 1865 is the year Wm. Rogers Mfg. Co. was formed, and it stayed in the mark for years.</p>"),
    ]
    return maker_page(dict(
        path=path, org="Wm. Rogers Mfg. Co.",
        title="Wm. Rogers Silverware Marks: Which Rogers Is It? | Heirloom",
        desc="Wm. Rogers marks explained: Wm. Rogers & Son, the eagle-and-star mark, 1865 Wm. Rogers Mfg. Co., and how they differ from 1847 Rogers Bros., Rogers & Bro. and Wm. A. Rogers, with sources.",
        h1="Wm. Rogers marks, and the other Rogers names", crumb="Wm. Rogers",
        lede="Half a dozen firms stamped Rogers on silver plate. Here is which one made yours, and what the stars, anchors and eagles in the mark tell you.",
        answer="Wm. Rogers marks are on silver-plated flatware from two Connecticut makers that used William Rogers's name: Wm. Rogers Mfg. Co. of Hartford (Wm. Rogers &amp; Son, from 1865) and Simpson, Hall, Miller &amp; Co. of Wallingford (Wm. Rogers between an eagle and a star, from 1878). Both became part of International Silver. Wm. A. Rogers is a different, unrelated firm.",
        body=body, faqs=faqs,
        sources=[S["curtis1913"], S["cbr1901"], S["case1882"], S["case1887"], S["case1895a"], S["case1895b"], S["jc1896"], S["curtis1906"], S["meriden150"], S["rb1892"], S["rainwater"],
                 uspto(329754, "WM. ROGERS &amp; SON, first use claimed 1866"), uspto(329757, "1865 WM. ROGERS MFG. CO."), uspto(329755, "WM ROGERS with eagle and star, first use claimed 1878"),
                 uspto(503060, "WM ROGERS with eagle and star, hollowware, from 1919"), uspto(147780, "ROGERS &amp; BRO. with star, first use claimed 1858"), uspto(805168, "WM. A. ROGERS, first use claimed 1895, owner Oneida Ltd.")],
        cta="Photograph the back of the handle. The Advisor reads which Rogers mark it is and keeps it on the item's record, with the photo it read it from.",
    ))


# ── Sources for Holmes & Edwards, Oneida and International ────────────────────

S.update({
    "waldo1897": ("George C. Waldo, <em>The Standard's History of Bridgeport</em>, 1897, p. 189", "https://archive.org/details/standardshistory00wald"),
    "warner1884": ("US patent 309,013, W. A. Warner, &ldquo;Plated Ware&rdquo;, December 9, 1884", "https://patents.google.com/patent/US309013"),
    "warner1886": ("US patent 337,099, W. A. Warner, &ldquo;Manufacture of Spoons&rdquo;, March 2, 1886", "https://patents.google.com/patent/US337099"),
    "warner1904": ("US patent 755,727, W. A. Warner, assigned to The Holmes and Edwards Silver Company, March 29, 1904", "https://patents.google.com/patent/US755727A/en"),
    "hagan_sp": ("Tere Hagan, <em>Silverplated Flatware: An Identification &amp; Value Guide</em>, revised 4th ed., Collector Books, 1990", "https://archive.org/details/silverplatedflat00haga"),
    "snell": ("Doris Jean Snell, <em>American Silverplated Flatware Patterns</em>, Wallace-Homestead, 1980", "https://archive.org/details/americansilverpl0000snel"),
    "hagan_st": ("Tere Hagan, <em>Sterling Flatware: An Identification and Value Guide</em>, Collector Books, 1991", "https://archive.org/details/sterlingflatware0000haga"),
    "dolan": ("Maryanne Dolan, <em>1830's–1990's American Sterling Silver Flatware</em>, Books Americana, 1993", "https://archive.org/details/1830s1990sameric0000dola"),
    "he1957": ("International Silver Co., &ldquo;New Rhythmic … in Holmes &amp; Edwards Deep Silver&rdquo;, March 1, 1957", "https://archive.org/details/holmes-edwards-rhythmic-silverware-1957"),
    "oc1901": ("<em>Oneida Community: 1848–1901</em>, company booklet, 1901", "https://archive.org/details/oneidacommunity100onei"),
    "oc1903": ("<em>Oneida Community Quality Silverware, Catalog No. 25</em>, Oneida Community Ltd., 1903 (Winterthur Library copy)", "https://archive.org/details/oneidacommunityq00onei"),
    "edmonds": ("Walter D. Edmonds, <em>The First Hundred Years, 1848–1948</em>, Oneida Ltd., 1948 (Syracuse University Libraries digital edition)", "https://library.syracuse.edu/digital/collections/f/FirstHundredYears,1848-1948/"),
    "su_oneida": ("Syracuse University Special Collections, <em>Oneida Community Collection, 1811–1997</em>, biographical history", "https://findingaids.syr.edu/catalog/oneida_comm"),
    "cthistory": ("Edward T. Howe, &ldquo;The Wallingford Oneida Community&rdquo;, ConnecticutHistory.org, 2020", "https://connecticuthistory.org/the-wallingford-oneida-community/"),
    "oneida_hs": ("Oneida Ltd., &ldquo;Oneida Heirloom Sterling&rdquo; brochures, 1965 and 1967", "https://archive.org/details/oneida-heirloom-sterling-1965"),
    "commons_spoon": ("House of Commons Heritage Collection (Canada), O-7647.9, soup spoon marked INTERNATIONAL S. CO. XII, electroplated nickel silver", "https://ourcommons.ca/heritage/en/collection/2244"),
    "insilco": ("&ldquo;Insilco Corporation History&rdquo;, <em>International Directory of Company Histories</em>, St. James Press", "https://www.fundinguniverse.com/company-histories/insilco-corporation-history/"),
    "lifetime2006": ("Lifetime Brands, &ldquo;Lifetime Brands Completes Syratech Acquisition&rdquo;, April 28, 2006, and its 10-Q for the first quarter of 2007", "https://www.sec.gov/Archives/edgar/data/874396/000091068007000366/f10q03312007.htm"),
    "iastate": ("Iowa State University Museums, International Silver Co. biography", "https://emuseum.its.iastate.edu/people/3148/international-silver-co/objects"),
})


def year_table(rows, head=("Pattern", "Introduced")):
    return marks_table(rows, head=head, cls=' class="table--two"')


# ── Holmes & Edwards ──────────────────────────────────────────────────────────

def holmes_edwards():
    path = "/marks/holmes-and-edwards"
    marks = marks_table([
        ("HOLMES &amp; EDWARDS", "The Holmes &amp; Edwards Silver Co., Bridgeport, Connecticut; International Silver Co. from 1898", "The maker's name. On its own it says nothing about the grade."),
        ("STERLING INLAID", "Holmes &amp; Edwards, listed in the 1896 trademark directory under plated ware", "Silver plate with small blocks of solid silver set in at the points that wear. It is not sterling."),
        ("XIV", "Holmes &amp; Edwards, described in an 1897 Bridgeport history", "The firm's &ldquo;extra sectional&rdquo; grade: an extra coat of plate on the back of the bowl and the handle. Still plate, and not inlaid."),
        ("DEEP SILVER", "International Silver Co., on Holmes &amp; Edwards patterns in the 1950s", "International's later name for the inlaid line; still plate."),
    ])
    years = year_table([
        ("Carolina", "1914"), ("Jamestown", "1916"), ("Hostess", "1921"), ("Romance", "1925"), ("Pageant", "1927"),
        ("Napoleon", "1929"), ("Masterpiece", "1932"), ("Guest of Honor", "1935"), ("Lovely Lady", "1937"),
        ("Danish Princess", "1938 or 1939 (the two books differ)"), ("Youth", "1940"), ("Spring Garden", "1949"),
        ("May Queen", "1951"), ("Bright Future", "1954"), ("Silver Fashion", "1957"), ("Rhythmic", "1957"), ("Woodsong", "1958"),
    ])
    body = f"""      <h2 id="maker">Who made it</h2>
      <p>The Holmes &amp; Edwards Silver Co. made plated flatware in Bridgeport, Connecticut. An 1897 history of the city traces its works back to 1882 and names George C. Edwards as president; the sources don't agree on which Holmes was his partner, so we don't name him. The company joined the International Silver Co. when it was formed in 1898, and International kept Holmes &amp; Edwards as a brand: its patterns run to at least 1958.</p>
      <p>Holmes &amp; Edwards was known for one process. Under patents granted to W. A. Warner in 1884 and 1886, small blocks of solid silver were set into the back of spoon bowls and fork tines, where flatware rubs on the table, before the whole item was plated. Warner later worked for the company, and a 1904 patent improving the method was assigned to it.</p>
      <h2 id="marks">The marks, and what each tells you</h2>
      {marks}
      <p class="note">We haven't yet found an openly licensed photograph of a Holmes &amp; Edwards mark; it is stamped on the back of the handle. The meaning of other marks seen on this ware, such as INLAID alone, H&amp;E or IS, isn't in the sources we could read, so they aren't explained here.</p>
      <h2 id="plate-or-sterling">Is it plate or sterling?</h2>
      <p>Plate, even when the mark says STERLING INLAID. The sterling is only the small inlay at the wear points; the rest of the item is a base metal under a coat of silver. The company itself sold the line as giving the wear of sterling for less than half its cost. The firm did also make sterling, listed separately in the 1896 directory; an item is sterling only when the mark says STERLING on its own.</p>
{PLATE_OR_STERLING}
      <h2 id="dating">How to date Holmes &amp; Edwards</h2>
{DATING_RULE}
      <p>These introduction years are the ones two published pattern guides agree on (Hagan, 1990, and Snell, 1980):</p>
      {years}
      <p class="note">An item made in 1898 or later may also carry International Silver's name. Rhythmic's 1957 date is also given by International's own brochure of that year."""
    body += "</p>"
    faqs = [
        ("Is Holmes &amp; Edwards Sterling Inlaid real sterling?",
         "<p>No. It is silver plate with small blocks of solid silver set into the backs of the bowls and tines, where they wear, before plating. The rest is base metal under a coat of silver.</p>"),
        ("What does XIV mean on Holmes &amp; Edwards?",
         "<p>It marked the firm's extra-sectional grade: an extra coat of silver plate on the back of the bowl and the handle. It is still plate.</p>"),
        ("When was Holmes &amp; Edwards made?",
         "<p>The Bridgeport firm dates from 1882 or a little earlier. It joined International Silver in 1898, and International used the name into at least the late 1950s. Date an item from its pattern.</p>"),
        ("How old is my Lovely Lady or May Queen silverware?",
         "<p>Lovely Lady was introduced in 1937 and May Queen in 1951. Patterns stayed in production for years, so the item may be later than that.</p>"),
    ]
    return maker_page(dict(
        path=path, org="The Holmes & Edwards Silver Co.",
        title="Holmes & Edwards Silverware Marks: Sterling Inlaid, XIV and Pattern Dates | Heirloom",
        desc="Holmes & Edwards marks explained: what Sterling Inlaid and XIV mean (it is silver plate, not sterling), who made it, and introduction years for its patterns, with sources.",
        h1="Holmes &amp; Edwards marks", crumb="Holmes &amp; Edwards",
        lede="Holmes &amp; Edwards flatware often says STERLING INLAID, which leads many people to think it is solid silver. Here is what the marks mean, and how to date it from the pattern.",
        answer="Holmes &amp; Edwards is silver-plated flatware made in Bridgeport, Connecticut, from 1882 and by the International Silver Co. from 1898. STERLING INLAID means small blocks of solid silver were set into the wear points before plating; the item is plate, not sterling. Date it from its pattern: Lovely Lady is 1937, May Queen 1951.",
        body=body, faqs=faqs,
        sources=[S["waldo1897"], S["jc1896"], S["curtis1906"], S["warner1884"], S["warner1886"], S["warner1904"], S["hagan_sp"], S["snell"], S["he1957"]],
        cta="Photograph the back of the handle. The Advisor reads the mark and the pattern, notes that Sterling Inlaid is plate, and keeps both on the item's record.",
    ))


# ── Community / Oneida ────────────────────────────────────────────────────────

def community():
    path = "/marks/community-plate-oneida"
    marks = marks_table([
        ("ONEIDA COMMUNITY", "Oneida Community Ltd., from the 1890s", "In 1896 it appears on nickel-silver flatware; by 1901 the company says it stamped the name only on its triple-plate grade. Read the rest of the mark."),
        ("COMMUNITY, or COMMUNITY PLATE", "Oneida Community Ltd. and Oneida Ltd., from 1901–02", "The company's top grade of silver plate, sold at first as heavier than triple plate."),
        ("RELIANCE, TUDOR PLATE, PAR PLATE", "Lines sold under the Oneida Community name", "Cheaper grades of silver plate than Community."),
        ("ONEIDA COMMUNITY STERLING, or HEIRLOOM STERLING", "Oneida's sterling lines", "Sterling silver. Heirloom was a brand Oneida bought in 1929; it has no connection with Heirloom, the app."),
        ("ONEIDA LTD.", "From March 1, 1935", "The company's name from that date, so the item was made in 1935 or later."),
    ])
    years = year_table([
        ("Avalon", "Shown 1901, on sale 1902 (one guide says about 1903)"),
        ("Classic", "1911"), ("Paul Revere", "1927"), ("Morning Star", "1948"), ("Evening Star", "1950"),
    ])
    body = f"""      <h2 id="maker">Who made it</h2>
      <p>The Oneida Community was a religious commune founded by John Humphrey Noyes at Oneida, New York, in 1848. Its branch at Wallingford, Connecticut, began making spoons in 1877; the company's 1901 booklet calls them silver plate, while its 1948 history and a Connecticut history say they were tinned iron.</p>
      <p>In 1880 the commune became a company, Oneida Community Ltd. (some accounts date the change from January 1, 1881), and the spoon works moved to Niagara Falls. Its first Community Plate pattern, Avalon, was shown at the end of 1901 and went on sale in 1902, in a single heavy grade of plate. The company bought Wm. A. Rogers Ltd. in 1929, took the name Oneida Ltd. on March 1, 1935, and stopped making flatware in the United States in 2005.</p>
      <h2 id="marks">The marks, and what each tells you</h2>
      {marks}
      <p class="note">We haven't yet found an openly licensed photograph of a Community mark; it is stamped on the back of the handle.</p>
      <h2 id="plate-or-sterling">Is it plate or sterling?</h2>
      <p>Community and Community Plate are silver plate: a coat of silver over a base metal. Oneida also made sterling, and those items say STERLING in the mark.</p>
{PLATE_OR_STERLING}
      <h2 id="dating">How to date Community Plate</h2>
{DATING_RULE}
      <p>The Community line runs from 1901–02, so no Community Plate is older than that, and ONEIDA LTD. in the mark means 1935 or later. These introduction years are the ones two published sources agree on:</p>
      {years}
      <p class="note">Years for many other Community patterns (Patrician, Adam, Bird of Paradise, Coronation, White Orchid and more) are in one published guide and on collectors' sites, but we haven't found a second independent source, so they aren't listed. For South Seas the sources disagree: 1955 in one guide, 1953 on collectors' sites.</p>"""
    faqs = [
        ("Is Community Plate real silver?",
         "<p>It is silver plate: a coat of real silver over a base-metal blank. It is not sterling. Oneida sold it as heavier than ordinary triple plate.</p>"),
        ("How old is my Oneida Community silverware?",
         "<p>Community Plate began with the Avalon pattern in 1901–02, so it is no older than that. Find the pattern and its introduction year; ONEIDA LTD. in the mark means 1935 or later.</p>"),
        ("What is the difference between Community, Tudor Plate, Reliance and Par Plate?",
         "<p>All are Oneida silver plate. Community was the top grade; Reliance, Tudor Plate and Par Plate were cheaper lines.</p>"),
        ("Did Oneida make sterling?",
         "<p>Yes, marked Oneida Community Sterling and later Heirloom Sterling. An item is sterling only if the mark says STERLING.</p>"),
        ("Is Heirloom Sterling connected with the Heirloom app?",
         "<p>No. Heirloom Sterling is Oneida's sterling flatware line, a brand Oneida acquired in 1929. Heirloom, the app, has no connection with it.</p>"),
    ]
    return maker_page(dict(
        path=path, org="Oneida Community Ltd.",
        title="Oneida Community Plate Marks: Is It Silver, and How Old Is It? | Heirloom",
        desc="Oneida Community Plate marks explained: Community, Tudor Plate, Reliance and Oneida's sterling, when Community Plate began, and how to date it from its pattern, with sources.",
        h1="Community Plate and Oneida marks", crumb="Community Plate (Oneida)",
        lede="Community Plate was Oneida's best silver plate from 1901–02. Here is what each Oneida mark tells you, and how to date yours.",
        answer="Community and Community Plate are silver-plated flatware made by Oneida Community Ltd. (Oneida Ltd. from 1935), starting with the Avalon pattern in 1901–02. It is plate, not sterling; Oneida's sterling says STERLING. Date it from its pattern: Morning Star is 1948, Evening Star 1950.",
        body=body, faqs=faqs,
        sources=[S["oc1901"], S["oc1903"], S["edmonds"], S["su_oneida"], S["cthistory"], S["jc1896"], S["hagan_sp"], S["snell"], S["dolan"], S["oneida_hs"]],
        cta="Photograph the back of the handle. The Advisor reads the mark and the pattern and keeps both on the item's record, with the photo it read them from.",
    ))


# ── International Silver Co. ──────────────────────────────────────────────────

WILCOX_CREDIT = 'Photograph: <a href="https://commons.wikimedia.org/wiki/File:Wilcox_IS_International_Silver_co.jpg" rel="nofollow">Wilcox IS International Silver co.</a> by Manuelarosi, Wikimedia Commons, CC0, cropped and toned by Heirloom.'


def international():
    path = "/marks/international-silver-co"
    members = ("Barbour Silver Co., Holmes &amp; Edwards Silver Co., Manhattan Silver Plate Co., Meriden Britannia Co., Meriden Silver Plate Co., "
               "Norwich Cutlery Co., Wm. Rogers Mfg. Co., Rogers Cutlery Co., Rogers &amp; Bro., Rogers &amp; Hamilton Co., Wilcox Silver Plate Co., "
               "Watrous Mfg. Co. and Standard Silver Co. of Toronto")
    marks = marks_table([
        ("INTERNATIONAL SILVER CO., or INTERNATIONAL S. CO.", "International Silver Co., from 1898", "The company's name. Read the next word: a grade mark such as XII means plate."),
        ("INTERNATIONAL STERLING", "International Silver Co.", "Sterling silver."),
        ("A founding firm's name: 1847 ROGERS BROS., HOLMES &amp; EDWARDS, WM. ROGERS, WILCOX and others", "Used by International for decades after 1898", "Made by International, under the old firm's brand."),
    ])
    years = year_table([
        ("Trianon", "1921"), ("Fontaine", "1924"), ("Minuet", "1925"), ("Enchantress", "1937"), ("Joan of Arc", "1940"),
        ("Wild Rose", "1948"), ("Brocade", "1950"), ("Angelique", "1959"), ("Swan Lake", "1960"), ("Valencia", "1965"),
    ], head=("Sterling pattern", "Introduced"))
    body = f"""      <h2 id="maker">Who made it</h2>
      <p>The International Silver Co. was organized on November 19, 1898, under New Jersey law, with its head office in Meriden, Connecticut. It began by buying a dozen New England silver firms: {members}. Simpson, Hall, Miller &amp; Co., the Derby Silver Co. and two others followed in 1899, and C. Rogers &amp; Bros. in 1903.</p>
      <p>It became one of the largest American makers of silverware, in both sterling and plate. The parent company renamed itself Insilco in 1969, the silverware business was sold to Katy Industries in 1983 or 1984 (the sources differ), and the International Silver name reached Lifetime Brands with its purchase of Syratech in 2006.</p>
      <h2 id="marks">The marks, and what each tells you</h2>
      {photo("plate-international-silver-wilcox", "WILCOX above the letters I and S in two squares, above INTERNATIONAL SILVER CO., stamped into a plated base", "WILCOX, I S and INTERNATIONAL SILVER CO. on a plated condiment holder, dated by the photographer to the 1950s. Wilcox Silver Plate Co. of Meriden was one of International's founding firms, and its name went on being used.", WILCOX_CREDIT)}
      {marks}
      <p class="note">International kept many of its founding firms' names as brands, so much International ware doesn't say International at all: see <a href="/marks/1847-rogers-bros">1847 Rogers Bros.</a>, <a href="/marks/holmes-and-edwards">Holmes &amp; Edwards</a> and <a href="/marks/wm-rogers">Wm. Rogers</a>.</p>
      <h2 id="plate-or-sterling">Is it plate or sterling?</h2>
      <p>It can be either, which is why the whole mark matters. International made sterling under its own name and some of its brands, and a great deal of plate. A spoon in a Canadian parliamentary collection, for example, is marked INTERNATIONAL S. CO. XII and is electroplated nickel silver. If the mark says STERLING, it is sterling; if not, treat it as plate.</p>
      {photo("plate-international-sterling", "INTERNATIONAL, a small shield mark, and STERLING stamped along a spoon handle", "INTERNATIONAL and STERLING on a grapefruit spoon, with a small shield mark between them. The rest of this mark reads PAT. 1929.", 'Photograph: <a href="https://www.europeana.eu/item/1091/item_BL6WPXKXYT5XPBQBSR4XHPMDION2CDJC" rel="nofollow">Deutsches Klingenmuseum Solingen</a>, 1995.NRW.005, <a href="https://creativecommons.org/licenses/by/4.0/" rel="nofollow">CC BY 4.0</a>, cropped and toned by Heirloom.')}
{PLATE_OR_STERLING}
      <h2 id="dating">How to date International Silver</h2>
{DATING_RULE}
      <p>We found no published year-code system for International's hollowware, so don't read a number on the base of a tray or teapot as a date; it is usually a catalog or pattern number. For flatware, these sterling patterns have introduction years that two published guides agree on (Hagan, 1991, and Dolan, 1993):</p>
      {years}
      <p class="note">Royal Danish is usually given as 1939 and Prelude as 1939, but we couldn't confirm either in two sources, so they aren't listed. International's plated patterns are on the pages for its brands.</p>"""
    faqs = [
        ("Is International Silver sterling?",
         "<p>Sometimes. International made both sterling and silver plate. An item marked STERLING, such as INTERNATIONAL STERLING, is sterling; one with a grade mark, or with no STERLING in the mark, is plate.</p>"),
        ("When was International Silver founded?",
         "<p>On November 19, 1898, in Meriden, Connecticut, by buying a dozen New England silver companies, with more added in 1899 and 1903.</p>"),
        ("Is 1847 Rogers Bros. International Silver?",
         "<p>From 1898, yes. Meriden Britannia, which made 1847 Rogers Bros., was one of International's founding firms, and International kept the brand. Holmes &amp; Edwards and Wm. Rogers came in the same way.</p>"),
        ("Does a number on International hollowware date it?",
         "<p>We found no published year code for International hollowware. A number on the base is most often a catalog or pattern number.</p>"),
        ("Who owns International Silver now?",
         "<p>The name passed through Katy Industries, Wallace International and Syratech to Lifetime Brands, which bought Syratech in 2006.</p>"),
    ]
    return maker_page(dict(
        path=path, org="International Silver Co.",
        title="International Silver Co. Marks: Sterling or Plate, and How Old? | Heirloom",
        desc="International Silver Co. marks explained: the 1898 merger, the brands it kept (1847 Rogers Bros., Holmes & Edwards, Wm. Rogers), how to tell its sterling from plate, and sterling pattern dates.",
        h1="International Silver Co. marks", crumb="International Silver Co.",
        lede="International Silver made both sterling and plate, under its own name and a dozen older ones. Here is how to tell which you have, and how to date it.",
        answer="The International Silver Co. was formed in Meriden, Connecticut, on November 19, 1898, from a dozen silver firms, and kept many of their names, including 1847 Rogers Bros., Holmes &amp; Edwards and Wm. Rogers. It made both sterling and plate: only a mark that says STERLING is sterling. Date flatware from its pattern; we found no year code on its hollowware.",
        body=body, faqs=faqs,
        sources=[S["curtis1906"], S["iastate"], S["meriden150"], S["hagan_sp"], S["hagan_st"], S["dolan"], S["commons_spoon"], S["insilco"], S["lifetime2006"], S["silverstd"]],
        cta="Photograph the mark. The Advisor reads the name and the grade or STERLING beside it, and keeps what it read on the item's record with the photo.",
    ))


# ── Build ─────────────────────────────────────────────────────────────────────

def build():
    return [rogers_1847(), community(), holmes_edwards(), wm_rogers(), international()]


CHILDREN = [
    ("/marks/1847-rogers-bros", "1847 Rogers Bros.", "What the 1847 mark means, the A1 and XII grades, and how to date the plate."),
    ("/marks/community-plate-oneida", "Community Plate (Oneida)", "Oneida's Community, Tudor and Reliance plate, its sterling, and pattern dates."),
    ("/marks/holmes-and-edwards", "Holmes & Edwards", "What Sterling Inlaid and XIV mean, and when its patterns came out."),
    ("/marks/wm-rogers", "Wm. Rogers and the other Rogers marks", "Which of the many Rogers firms made your silver plate."),
    ("/marks/international-silver-co", "International Silver Co.", "Sterling or plate, the brands it kept, and its sterling pattern dates."),
]
