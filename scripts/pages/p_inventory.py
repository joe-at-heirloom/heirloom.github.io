from shell import *

PATH = "/home-inventory-app"
TITLE = "Home Inventory App for Insurance, Room by Room | Heirloom"
DESC = "Heirloom is a free home inventory app for iPhone and the web. Photograph each room, keep serial numbers and receipts, and make a PDF your insurer can read."
H1 = "A home inventory app that goes room by room"

FAQS = [
    ("Is Heirloom free?",
     "<p>Yes. Heirloom is free to download from the US App Store and free to use on the web at <a href=\"https://web.heirloomapp.io\">web.heirloomapp.io</a>.</p>"),
    ("Do I need a home inventory if I rent?",
     "<p>Yes. Renters insurance covers your belongings, and after a fire, theft or flood you are asked to list what you lost. An inventory made beforehand, with photos and receipts, is far easier to rely on than memory.</p>"),
    ("Do I need a photo of each item?",
     "<p>No. You can write an item down without a photo, and it is a full record. Photos help most for valuable items, items with a serial number, and items you would struggle to describe.</p>"),
    ("What does my insurer receive?",
     "<p>Only what you choose to send. Heirloom prepares a PDF from the items you pick, room by room, with each item&rsquo;s photos, serial number, measurements, condition and replacement value with where that figure comes from. Receipts and other documents you attached are numbered as exhibits at the back. Heirloom keeps a record of what you sent, version by version.</p>"),
    ("Does Heirloom tell me what my items are insured for, or value them?",
     "<p>No. The PDF is an inventory aid, not an appraisal: the replacement figures are the ones you recorded, and the document does not confirm coverage. For art, jewelry or silver that needs its own coverage, ask your insurer what they need; it is often a written appraisal from an independent appraiser.</p>"),
    ("Is my inventory private?",
     "<p>Yes. Records are scoped to your account, photos live in private storage, family sharing is by invitation with a named role, and you can export or delete everything from Settings.</p>"),
    ("Can I get my inventory out of Heirloom?",
     "<p>Yes. Settings has a spreadsheet (one row per item, as a CSV file), a ZIP archive of your items and every photo that works without Heirloom, and all your data as a .json file.</p>"),
    ("Where does Heirloom work?",
     "<p>The iPhone app is in the US App Store for now. Heirloom on the web works everywhere, at web.heirloomapp.io.</p>"),
]

BODY = f"""      <p class="guide__lede">Name a room, photograph what is in it one item at a time, and keep walking. When you need it, Heirloom turns the rooms into a PDF inventory for an insurance conversation, and tells you first what is missing.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>Heirloom is a free home inventory app for iPhone and the web. You walk your home room by room and photograph each item, or write it down, and Heirloom keeps its photos, serial number, receipts and story with its room. It prepares a PDF inventory from the items you choose, room by room, with each replacement value shown beside where it came from.</p>
      </div>

      <nav class="toc" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>
          <li><a href="#why">Why keep a home inventory</a></li>
          <li><a href="#how">How Heirloom does it</a></li>
          <li><a href="#pdf">The PDF your insurer reads</a></li>
          <li><a href="#keepsakes">For the things a spreadsheet can&rsquo;t describe</a></li>
          <li><a href="#compare">Heirloom or a spreadsheet</a></li>
          <li><a href="#faq">Questions</a></li>
        </ol>
      </nav>

      <h2 id="why">Why keep a home inventory</h2>
      <p>After a fire, a burglary or a flood, your insurer asks for a list of what you lost: what each item was, when you bought it, and what it would cost to replace. Few people can rebuild that list from memory, standing in a damaged house. The <a href="https://content.naic.org/consumer/home-inventory">National Association of Insurance Commissioners</a> recommends keeping an inventory for exactly this reason, and keeping a copy somewhere other than your home.</p>
      <p>An inventory also answers quieter questions: whether your coverage limits match what you own, which items need their own coverage, and what is in the house when a parent moves or an estate is settled.</p>

      <h2 id="how">How Heirloom does it</h2>
      <ol>
        <li><strong>Walk a room.</strong> Name the room and photograph what is in it, one item at a time. Tap Done and each item is saved with its photos and its room, so you can keep walking.</li>
        <li><strong>Or write it down.</strong> An item you already know can be written down without a photo. Both are full records, and you can add the other later.</li>
        <li><strong>Add what matters.</strong> Serial numbers, measurements, condition, where and when you bought it, and receipts or other documents.</li>
        <li><strong>See what isn&rsquo;t documented yet.</strong> Home shows each room and how much of it is documented, and lists the items still missing details.</li>
        <li><strong>Prepare the inventory.</strong> Choose the items and say what it is for. Heirloom names what is missing for that purpose, lets you go ahead without it, and keeps a record of what you sent.</li>
      </ol>

      <div class="guide__shots">
        <figure>
          <img src="/screens/01-rooms-440.webp" srcset="/screens/01-rooms-440.webp 440w, /screens/01-rooms.webp 660w" sizes="220px" width="440" height="956" alt="Heirloom's Home screen on iPhone: five rooms, each showing how many of its items are documented." loading="lazy" decoding="async">
          <figcaption>Your home, room by room</figcaption>
        </figure>
        <figure>
          <img src="/screens/04-whats-missing-440.webp" srcset="/screens/04-whats-missing-440.webp 440w, /screens/04-whats-missing.webp 660w" sizes="220px" width="440" height="956" alt="Home on iPhone answering “What isn’t documented yet?”: three items still missing details, listed by name." loading="lazy" decoding="async">
          <figcaption>What isn&rsquo;t documented yet</figcaption>
        </figure>
      </div>

      <h2 id="pdf">The PDF your insurer reads</h2>
      <p>Choose the items, and Heirloom prepares a PDF, room by room: what each item is in plain words, its photos, serial number, measurements and condition, and its replacement value with where that figure comes from. Receipts and other documents you attached are numbered as exhibits at the back.</p>
      <p>It is an inventory aid, not an appraisal: the replacement figures are the ones you recorded, and the document does not confirm coverage. Many items have no market value, and a record is complete without one.</p>
      <div class="guide__shots">
        <figure>
          <img src="/screens/03-insurance-pdf-440.webp" srcset="/screens/03-insurance-pdf-440.webp 440w, /screens/03-insurance-pdf.webp 660w" sizes="220px" width="440" height="956" alt="The insurance inventory PDF Heirloom prepares, open on iPhone: a summary of the owner's items, a list by room, and each item with its photos." loading="lazy" decoding="async">
          <figcaption>A PDF your insurer can read</figcaption>
        </figure>
        <figure>
          <img src="/screens/06-value-440.webp" srcset="/screens/06-value-440.webp 440w, /screens/06-value.webp 660w" sizes="220px" width="440" height="956" alt="A silver cake basket's record on iPhone: no estimate yet, and an $8,200 insurance appraisal shown with who made it and when." loading="lazy" decoding="async">
          <figcaption>A value only with its source</figcaption>
        </figure>
      </div>

      <h2 id="keepsakes">For the things a spreadsheet can&rsquo;t describe</h2>
      <p>A television has a model number. A silver teapot, a painting from an estate or your grandfather&rsquo;s watch does not, and &ldquo;old teapot&rdquo; is no help to an adjuster. If you allow it, Heirloom Advisor reads each item&rsquo;s photos and marks and writes down what it can see: maker, period and materials where the evidence shows them. It says plainly what it cannot tell, and it never decides whether an item is genuine. Read more about <a href="/antique-identifier-app">what it reads in a photo of an antique</a>.</p>
      <p>The Advisor is optional, and Heirloom asks first. Choose &ldquo;Record everything myself&rdquo; and nothing is sent to an outside service.</p>

      <h2 id="compare">Heirloom or a spreadsheet</h2>
      <p>A spreadsheet works, and we publish a <a href="/home-inventory-checklist#template">free home inventory template</a> for anyone who prefers one. The difference is in what each keeps with the item.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col"></th><th scope="col">A spreadsheet</th><th scope="col">Heirloom</th></tr></thead>
          <tbody>
            <tr><th scope="row">Photos and receipts</th><td>In a separate folder, matched by hand</td><td>Saved on the item&rsquo;s record</td></tr>
            <tr><th scope="row">Rooms</th><td>A column you fill in</td><td>Each photo is saved to the room you are walking</td></tr>
            <tr><th scope="row">What is missing</th><td>You look for blank cells</td><td>Listed for you, room by room</td></tr>
            <tr><th scope="row">For the insurer</th><td>Export and format it yourself</td><td>A PDF with photos and numbered exhibits</td></tr>
            <tr><th scope="row">Marks and makers</th><td>What you can describe</td><td>Read from your photos, if you allow it</td></tr>
            <tr><th scope="row">Your data</th><td>Yours</td><td>Yours: CSV, ZIP with every photo, or .json</td></tr>
          </tbody>
        </table>
      </div>

      <p>Before you start, the <a href="/home-inventory-checklist">room-by-room checklist</a> lists what to record for each item and the rooms people forget.</p>

{APP_BOX}

      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
"""

APP_LD = {
    "@type": "MobileApplication",
    "@id": SITE + "/#app",
    "name": "Heirloom",
    "alternateName": "Heirloom: Know What You Own",
    "url": SITE + "/",
    "installUrl": APP_URL,
    "operatingSystem": "iOS, Web",
    "applicationCategory": "LifestyleApplication",
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    "publisher": {"@id": SITE + "/#org"},
}

HTML = page(PATH, TITLE, DESC, H1, BODY, [
    {"@type": "WebPage", "@id": SITE + PATH, "url": SITE + PATH, "name": TITLE, "description": DESC, "about": APP, "isPartOf": {"@id": SITE + "/#website"}, "dateModified": TODAY, "primaryImageOfPage": SITE + "/og-image.jpg"},
    APP_LD,
    faq_ld(PATH, FAQS),
], og_type="website", crumb_name="Home inventory app")
