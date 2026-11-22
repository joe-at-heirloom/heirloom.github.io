from shell import *

PATH = "/silver-hallmarks"
TITLE = "Silver Hallmarks: How to Read and Identify Them | Heirloom"
DESC = "How to read silver hallmarks: British maker’s, sterling, town and date marks; American sterling and coin silver; continental 800 and 925; and silver plate marks."
H1 = "How to read silver hallmarks"

FAQS = [
    ("What does 925 mean on silver?",
     "<p>925 means the metal is 92.5% silver by weight: sterling. You will also see 800, 830 and 835 on continental silver, 900 on some coin silver and Mexican silver, and 950 or 958 for higher standards such as France&rsquo;s first standard and Britain&rsquo;s Britannia silver.</p>"),
    ("What does the lion mark on silver mean?",
     "<p>A walking lion facing left with one paw raised (the lion passant) is the English mark for sterling silver, used since 1544. A lion standing on its hind legs (rampant) is the sterling mark of Glasgow, and of Edinburgh since 1975. American makers sometimes stamped lion marks of their own to look British, so a lion alone does not prove English silver.</p>"),
    ("How do I find the date of British silver?",
     "<p>Find the date letter, then read it against the table for the assay office whose mark is beside it. Each office used its own alphabet cycles, with a different letter style and shield shape in each cycle, so the same letter can mean different years in London and Birmingham. The shape of the shield around the letter matters as much as the letter.</p>"),
    ("Does silver marked EPNS have any value?",
     "<p>EPNS means electroplated nickel silver: a thin coat of silver over a base metal, with very little silver in it. Plated items are valued for their maker, design and condition rather than their metal, and many have little resale value. Their story is another matter, and a record of them is complete without a price.</p>"),
    ("Can I read hallmarks from a phone photo?",
     "<p>Often, if the photo is sharp. Rest the item on a dark cloth, light it from the side so the stamps cast shadows, and photograph the marks straight on and close. Heirloom Advisor reads the marks it can see in your photos, dates some of them from published tables, and says what it cannot tell.</p>"),
]

BRITISH = [
    ("Maker&rsquo;s (sponsor&rsquo;s) mark", "The initials of the maker or the firm that sent the item for testing, in a shaped shield."),
    ("Standard mark", "The purity. In England, a lion passant for sterling (92.5%); Britannia, a seated figure, for the higher Britannia standard (95.8%). Since 1999 the purity may be shown as a number in a shield, such as 925."),
    ("Assay office (town) mark", "Where the silver was tested. See the table below."),
    ("Date letter", "The year of testing, one letter per year in cycles that differ by office. Optional since 1999, though many makers still use it."),
    ("Duty mark", "The sovereign&rsquo;s head in profile, showing tax was paid. Used from 1784 to 1890, so its presence dates the item to those years."),
]

OFFICES = [
    ("London", "A leopard&rsquo;s head (crowned until 1821)", "Open"),
    ("Birmingham", "An anchor", "Open"),
    ("Sheffield", "A crown until 1974; a rose since 1975", "Open"),
    ("Edinburgh", "A castle", "Open"),
    ("Glasgow", "A tree, bird, bell and fish", "Closed 1964"),
    ("Chester", "Three wheatsheaves and a sword", "Closed 1962"),
    ("Exeter", "A castle with three towers", "Closed 1883"),
    ("Newcastle", "Three castles", "Closed 1884"),
    ("Dublin", "A crowned harp", "Open"),
]

CONTINENTAL = [
    ("800, 830, 835", "Common continental standards. Germany marked 800 with a crescent moon and a crown from 1888; 830 is typical of Scandinavian silver."),
    ("Minerva head", "France, since 1838: a helmeted head in an octagon, with a 1 for the first standard (95%) or a 2 for the second (80%)."),
    ("84, 88, 91", "Russia, in zolotniki out of 96: 84 is 87.5% silver, 88 is 91.6% and 91 is 94.8%."),
    ("925 with an eagle", "Mexico: the eagle assay mark of 1948 to 1980, often beside a maker&rsquo;s mark and the word Mexico."),
]

PLATE = [
    ("EPNS, EP, EPBM", "Electroplated nickel silver; electroplate; electroplated Britannia metal. A thin silver coat over base metal."),
    ("Silver plate, quadruple plate, A1", "American and British plate. &ldquo;Quadruple&rdquo; describes the thickness of the coat, not the silver content."),
    ("Nickel silver, German silver, alpaca", "An alloy of copper, nickel and zinc with no silver in it at all. See <a href=\"/marks/german-silver\">German silver</a>."),
    ("1847 Rogers Bros.", "A brand name. 1847 is the year the firm says it began, not the year the item was made."),
    ("Sheffield plate", "Silver fused to copper sheet, made from about the 1740s to the 1840s, before electroplating. Rarely marked with town marks, and collected in its own right."),
]


def table(head, rows, three=False):
    th = "".join(f'<th scope="col">{h}</th>' for h in head)
    body = []
    for r in rows:
        cells = f'<th scope="row">{r[0]}</th>' + "".join(f"<td>{c}</td>" for c in r[1:])
        body.append(f"<tr>{cells}</tr>")
    return f'<div class="table-wrap"><table><thead><tr>{th}</tr></thead><tbody>' + "".join(body) + "</tbody></table></div>"


BODY = f"""      <p class="guide__lede">A row of tiny stamps on the underside of a spoon can tell you who made it, how pure the silver is, where it was tested and, for British silver, the year. Here is how to read them.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A silver hallmark is a set of small stamps recording who made an item, the purity of its silver, where it was tested and, in Britain, the year. On British silver, read them in a row: the maker&rsquo;s initials, a standard mark such as the lion passant for sterling, a town mark such as London&rsquo;s leopard&rsquo;s head, and a date letter. American silver is usually marked STERLING or 925; continental silver shows its purity as a number such as 800.</p>
      </div>

      <nav class="toc" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>
          <li><a href="#first">Before you start</a></li>
          <li><a href="#british">British hallmarks</a></li>
          <li><a href="#offices">Assay office marks</a></li>
          <li><a href="#american">American silver marks</a></li>
          <li><a href="#continental">Continental silver marks</a></li>
          <li><a href="#plate">Marks that mean silver plate</a></li>
          <li><a href="#limits">What hallmarks cannot tell you</a></li>
          <li><a href="#faq">Questions</a></li>
        </ol>
      </nav>

      <h2 id="first">Before you start</h2>
      <ul>
        <li><strong>Look in the usual places:</strong> the back of a spoon or fork handle, the underside of a bowl or teapot, the rim of a foot, near the hinge of a lid. Lids and detachable parts were often marked separately.</li>
        <li><strong>Use a loupe or your phone.</strong> A 10x loupe, or a phone photo you can zoom into, with light from the side so the stamps cast shadows.</li>
        <li><strong>Don&rsquo;t polish the marks.</strong> Polishing wears them; read them as they are.</li>
        <li><strong>Write down every mark in order,</strong> including the shape of each shield. Shapes matter for dating.</li>
      </ul>

      <h2 id="british">British hallmarks</h2>
      <p>British silver has been marked under law for centuries, which makes it the easiest to read and to date. A full set of marks usually includes:</p>
      {table(["Mark", "What it tells you"], BRITISH)}
      <p>You may also find occasional commemorative marks, such as those for the 1953 coronation and the 1977 Silver Jubilee, and import marks on silver made abroad and tested in Britain.</p>

      <h2 id="offices">Assay office marks</h2>
      <p>The town mark tells you which assay office tested the silver, and which date-letter table to use.</p>
      {table(["Office", "Town mark", "Status"], OFFICES)}
      <p>Scottish silver also carries its own standard marks: a thistle at Edinburgh from 1759 to 1975, and a lion rampant at Glasgow (and at Edinburgh since 1975).</p>

      <h2 id="american">American silver marks</h2>
      <p>The United States had no national assay system, so American marks are makers&rsquo; and retailers&rsquo; marks rather than hallmarks.</p>
      <ul>
        <li><strong>Coin silver</strong> (roughly 90% silver), common before the Civil War, is often marked with the maker&rsquo;s name and a word such as COIN, PURE COIN or STANDARD, or with the maker&rsquo;s name alone. See <a href="/marks/coin-silver">coin silver</a>.</li>
        <li><strong>STERLING or 925</strong> became the usual mark as American makers adopted the sterling standard in the second half of the 1800s.</li>
        <li><strong>Pseudo-hallmarks:</strong> some American makers stamped marks that imitate British ones. Gorham&rsquo;s mark, for example, is a lion, an anchor and a G. Gorham also used yearly date symbols from 1868.</li>
        <li><strong>Pattern and model numbers</strong> stamped beside the maker&rsquo;s name can identify the design and narrow the date, from the maker&rsquo;s catalogs.</li>
      </ul>

      <h2 id="continental">Continental silver marks</h2>
      <p>Most of Europe used purity numbers in thousandths, often beside a national or town mark. See <a href="/marks/silver-purity-marks">what 925, 800 and the other numbers mean</a>.</p>
      {table(["Mark", "What it tells you"], CONTINENTAL)}

      <h2 id="plate">Marks that mean silver plate</h2>
      <p>Plated wares were often stamped to look like sterling. These marks mean plate, or no silver at all (more in <a href="/marks/is-it-real-silver">silver or silver plate?</a>):</p>
      {table(["Mark", "What it means"], PLATE)}

      <h2 id="limits">What hallmarks cannot tell you</h2>
      <p>Marks can be worn away, struck lightly, or, rarely, faked or cut from one item and set into another. A full set of good marks is strong evidence, but it is not the whole answer: specialists also look at weight, construction, decoration and later alterations. Heirloom never decides whether an item is genuine, and neither should a photo.</p>

      <h2 id="heirloom">Reading marks with Heirloom</h2>
      <p>Photograph the marks close and in focus, and Heirloom Advisor reads what it can see. Some hallmarks can be dated from published tables, and a dated mark heads the record with the table it came from; when a mark cannot be read, it says so. Each detail says how it is known, so you can tell what was read from your photo from what is likely. See <a href="/antique-identifier-app">how the Advisor reads antiques</a>.</p>

{APP_BOX}

      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
"""

HTML = page(PATH, TITLE, DESC, H1, BODY, [
    article_ld(PATH, H1, DESC, extra={"about": {"@type": "Thing", "name": "Silver hallmarks"}}),
    faq_ld(PATH, FAQS),
], mid=("/guides", "Guides"), crumb_name="Silver hallmarks")
