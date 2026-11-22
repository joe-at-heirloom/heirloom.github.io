from shell import *

PATH = "/antique-identifier-app"
TITLE = "Antique Identifier App That Shows Its Evidence | Heirloom"
DESC = "Photograph an antique: Heirloom reads its marks and labels, dates some from published tables, and says plainly what it cannot tell. Free on iPhone and the web."
H1 = "An antique identifier that shows its evidence"

FAQS = [
    ("Is there a free app that identifies antiques from a photo?",
     "<p>Heirloom is free on iPhone and on the web. Photograph an antique and its Advisor reads the marks, labels, materials and construction it can see, and writes down maker, period and materials where the evidence shows them. When the photos cannot settle a question, it says so, and asks for the one photo that would help.</p>"),
    ("How accurate is an antique identifier app?",
     "<p>Only as accurate as the evidence in the photos. A clear maker&rsquo;s mark, a hallmark or a printed label can often be read and dated; a plain chair with no marks often cannot be pinned down from photos alone. Heirloom labels each detail with how it is known (read from your photo, said by you, from a source, or likely) so you can tell a reading from a guess.</p>"),
    ("Can the app tell me if my antique is real?",
     "<p>No. Heirloom never decides whether an item is genuine. Marks can be worn, copied or added later, and judging that takes a specialist with the item in hand. In the United States you can ask Heirloom for an introduction to an independent appraiser or dealer you choose.</p>"),
    ("Does Heirloom value antiques?",
     "<p>No. Heirloom&rsquo;s estimates are informational only and are not professional appraisals. An estimate appears only when there is evidence for one, such as a recorded sale of a comparable item, and it is labeled as an estimate. For insurance, an estate or a donation, you need a written appraisal from an independent appraiser.</p>"),
    ("How is this different from a reverse image search?",
     "<p>A reverse image search finds pictures that look similar. Heirloom does run a visual search for similar items, and reads the marks and labels in your photos as well, then keeps what it found on the item&rsquo;s record, with where each finding came from, beside your photos and the item&rsquo;s story.</p>"),
    ("What happens to my photos?",
     "<p>Nothing leaves Heirloom until you allow the Advisor. If you do, your photos, notes and record details go to OpenAI to be read, and a photo link and a few details go to a search service that looks for similar items and auction records. Choose &ldquo;Record everything myself&rdquo; and nothing is sent to them. The <a href=\"/support#advisor-data\">support page</a> lists exactly what goes where.</p>"),
    ("Is it only for antiques?",
     "<p>No. Heirloom is a home inventory first: furniture, art, silver, ceramics, jewelry, watches, books and everyday things, room by room. Many keepsakes have no market value, and a record is complete without one.</p>"),
]

BODY = f"""      <p class="guide__lede">Photograph the attic find, the inherited silver or the chair from your grandmother&rsquo;s house. Heirloom reads what the photos show, says what they cannot, and keeps the answer with the item&rsquo;s story.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>Heirloom is a free app for identifying antiques from photos, on iPhone and the web. Its Advisor reads the marks, labels, materials and condition it can see, dates some hallmarks, pottery marks and serial numbers from published tables, and says plainly what it cannot tell. It never decides whether an item is genuine, and an estimate appears only when there is evidence for one.</p>
      </div>

      <nav class="toc" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>
          <li><a href="#reads">What the Advisor reads in a photo</a></li>
          <li><a href="#photos">Photos that help, by kind of item</a></li>
          <li><a href="#unknown">When the answer is &ldquo;unknown&rdquo;</a></li>
          <li><a href="#value">Value, with one strict rule</a></li>
          <li><a href="#record">Then it is a record, not a search result</a></li>
          <li><a href="#faq">Questions</a></li>
        </ol>
      </nav>

      <h2 id="reads">What the Advisor reads in a photo</h2>
      <ul>
        <li><strong>Marks:</strong> silver hallmarks, pottery and porcelain backstamps, furniture makers&rsquo; stamps and labels, foundry marks on bronze.</li>
        <li><strong>Words:</strong> signatures, inscriptions, retailers&rsquo; labels, patent dates and serial numbers.</li>
        <li><strong>The item itself:</strong> its form, material, decoration, construction and condition.</li>
      </ul>
      <p>Some hallmarks, pottery marks and serial numbers can be dated from published tables, and a dated mark heads the record with the table it came from. Each detail says how it is known: read from your photo, said by you, from a source, or likely. The Advisor asks a question only when the answer would change something.</p>

      <h2 id="photos">Photos that help, by kind of item</h2>
      <p>Start with the whole item from the front, then the back or underside, then every mark close up and in focus. Daylight from the side shows stamped marks better than a flash.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Kind of item</th><th scope="col">Photograph</th></tr></thead>
          <tbody>
            <tr><th scope="row">Silver</th><td>Each hallmark in a row, close and sharp; the underside; any engraving. See <a href="/silver-hallmarks">how to read silver hallmarks</a>.</td></tr>
            <tr><th scope="row">Pottery and porcelain</th><td>The backstamp or impressed mark, the foot rim, and any chips or repairs.</td></tr>
            <tr><th scope="row">Furniture</th><td>Inside a drawer (the joints), the back, the underside, hardware, and any label or stamp.</td></tr>
            <tr><th scope="row">Paintings and prints</th><td>The signature, the whole back of the frame, and every label, stamp or inscription on it.</td></tr>
            <tr><th scope="row">Watches and clocks</th><td>The dial, the case back, and the movement with its serial number, if you can open it safely.</td></tr>
            <tr><th scope="row">Jewelry</th><td>Stamps inside a ring band or on a clasp, and the setting from the side.</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="unknown">When the answer is &ldquo;unknown&rdquo;</h2>
      <p>Many antiques carry no mark at all, and photos cannot show weight, smell, or the inside of a joint. When the evidence runs out, Heirloom writes &ldquo;unknown&rdquo; and, where one more photo would change that, says which. &ldquo;Unknown&rdquo; is a normal answer, not a failed record: the item still has its photos, its room and its story.</p>

      <h2 id="value">Value, with one strict rule</h2>
      <p>A figure is shown only with its source, and your own figure comes first. When the Advisor finds what comparable items sold for, it lists each sale with where it was found, its date and whether it sold or was only listed. An asking price or a look-alike never sets a figure on its own. Many items have no market value, and a record is complete without one.</p>
      <p class="note">Value estimates are informational only and are not professional appraisals. Sold prices, estimates and specialists are offered in the United States only for now.</p>

      <h2 id="record">Then it is a record, not a search result</h2>
      <p>Most identifier apps stop at an answer. Heirloom keeps it: the photos, what was read and where it came from, the story of who it came from in your own words, its room, and who it is meant for. Relatives you invite can add what they remember. When you need it, the same records become an <a href="/home-inventory-app">inventory for your insurer</a> or a family record.</p>
      <p>And if you are the collector who did the research years ago, write it down yourself. Your words and your estimates are never overwritten.</p>

{APP_BOX}

      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
"""

HTML = page(PATH, TITLE, DESC, H1, BODY, [
    {"@type": "WebPage", "@id": SITE + PATH, "url": SITE + PATH, "name": TITLE, "description": DESC, "about": APP, "isPartOf": {"@id": SITE + "/#website"}, "dateModified": TODAY, "primaryImageOfPage": SITE + "/og-image.jpg"},
    faq_ld(PATH, FAQS),
], og_type="website", crumb_name="Antique identifier app")
