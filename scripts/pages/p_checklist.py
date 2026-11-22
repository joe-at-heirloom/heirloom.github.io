from shell import *

PATH = "/home-inventory-checklist"
TITLE = "Home Inventory Checklist (Free Template) | Heirloom"
DESC = "A room-by-room home inventory checklist for insurance: what to record for each item, the rooms people forget, and a free home inventory spreadsheet template."
H1 = "Home inventory checklist, room by room"

FAQS = [
    ("What should a home inventory include?",
     "<p>For each item: what it is, its maker or brand and model, serial number, when and where you bought it, what you paid, what it would cost to replace, its condition, and photos. Keep receipts, manuals and other documents with it.</p>"),
    ("How do I make a home inventory list for insurance?",
     "<p>Go room by room. Photograph or film each wall, then each item that matters, including serial numbers and labels. Record the details above, start with the rooms that hold the most value, and keep a copy somewhere other than your home. Update it once a year and after any large purchase.</p>"),
    ("Should I use photos or video?",
     "<p>Both help. A slow video of each room, opening closets and drawers, shows what was there. Still photos of individual items, their serial numbers and their marks are easier to attach to a claim.</p>"),
    ("Where should I keep my home inventory?",
     "<p>Somewhere a fire or flood at home cannot reach: a cloud service, an app that stores it off your phone, or a copy with a relative. Heirloom keeps it in your account, and you can download a spreadsheet, a ZIP with every photo, or a PDF at any time.</p>"),
    ("Do I need to know what everything is worth?",
     "<p>No. Record what you paid, if you know it, and what it would cost to replace. Many items have no market value, and a record is complete without one. For art, jewelry, silver and collectibles, ask your insurer what they need for separate coverage.</p>"),
]

ROOMS = [
    ("Living room", "Sofa and chairs, tables, rugs, lamps, television and speakers, art and mirrors, books, clocks, decorative items on shelves."),
    ("Kitchen", "Appliances (with model and serial numbers), cookware, knives, small appliances, dishes, glassware, pantry contents."),
    ("Dining room", "Table and chairs, sideboard, china, crystal, flatware and silver, table linens, art."),
    ("Bedrooms", "Beds and mattresses, dressers, bedding, clothing and shoes (by category), jewelry, watches, handbags."),
    ("Bathrooms", "Fixtures you added, towels and linens, appliances such as hair dryers."),
    ("Home office", "Computers, monitors, printers, phones and tablets (serial numbers), furniture, important documents."),
    ("Closets", "Coats, seasonal clothing, luggage, sports equipment, stored china or silver."),
    ("Basement, attic and storage", "Stored furniture, holiday decorations, boxed keepsakes, tools, appliances such as a freezer, and inherited things put away in boxes."),
    ("Garage and outdoors", "Tools and power tools, lawn equipment, bicycles, grills, patio furniture, ladders."),
    ("Valuables", "Jewelry, watches, silver, art, rugs, collections, musical instruments, firearms: each item on its own, with close photos of marks and serial numbers."),
]

FIELDS = [
    ("Room", "Where it is kept.", "Dining room"),
    ("Item", "What it is, in plain words.", "Silver teapot"),
    ("Maker or brand, model", "From a label, mark or receipt.", "Gorham, pattern name if known"),
    ("Serial number", "From the item or its paperwork.", "None"),
    ("Purchased", "When, where and for how much, if known.", "Inherited, 2009"),
    ("Replacement value and its source", "What it would cost to replace, and where that figure comes from.", "Written appraisal from an independent appraiser, 2019"),
    ("Condition", "Plain notes, including damage.", "Small dent on lid"),
    ("Photos and documents", "Front, back, marks, serial number; receipts and other documents.", "4 photos, 1 document"),
]


def rows():
    out = []
    for r, items in ROOMS:
        out.append(f"<li><strong>{r}:</strong> {items}</li>")
    return "\n          ".join(out)


def field_rows():
    return "\n            ".join(f"<tr><th scope=\"row\">{a}</th><td>{b}</td><td>{c}</td></tr>" for a, b, c in FIELDS)


BODY = f"""      <p class="guide__lede">What to record for each item, the rooms people forget, and a free spreadsheet template, so the list is ready before an insurer ever asks for it.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>A home inventory is a list of what you own, room by room, with photos, descriptions, serial numbers, purchase details and replacement values, kept somewhere other than your home. Start with the rooms that hold the most value, film or photograph each wall, then record items one at a time. Update it once a year and after large purchases.</p>
      </div>

      <nav class="toc" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>
          <li><a href="#record">What to record for each item</a></li>
          <li><a href="#rooms">The checklist, room by room</a></li>
          <li><a href="#steps">How to do it in an afternoon at a time</a></li>
          <li><a href="#insurance">Insurance notes</a></li>
          <li><a href="#template">Free home inventory template</a></li>
          <li><a href="#faq">Questions</a></li>
        </ol>
      </nav>

      <h2 id="record">What to record for each item</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Field</th><th scope="col">What to write</th><th scope="col">Example</th></tr></thead>
          <tbody>
            {field_rows()}
          </tbody>
        </table>
      </div>
      <p>Everyday things can be grouped (&ldquo;men&rsquo;s clothing, about 40 items&rdquo;). Valuable items, items with a serial number and items you could not easily describe each deserve their own line and their own photos.</p>

      <h2 id="rooms">The checklist, room by room</h2>
      <ul>
          {rows()}
      </ul>
      <p class="note">The rooms people forget: the attic, the basement, the garage, under the beds, and the boxes of things inherited and put away. They are often where the hardest items to replace are kept.</p>

      <h2 id="steps">How to do it in an afternoon at a time</h2>
      <ol>
        <li><strong>Pick one room.</strong> The one that holds the most value, or the one you use most. Finishing one room is worth more than starting five.</li>
        <li><strong>Film the room.</strong> Walk slowly, open closets and drawers, and say what you are looking at.</li>
        <li><strong>Photograph items one by one.</strong> The front, the back or underside, labels and serial numbers, and any maker&rsquo;s mark.</li>
        <li><strong>Gather the paper.</strong> Receipts, manuals, warranties, and any written appraisal from an independent appraiser. Photograph them if the originals live in a drawer.</li>
        <li><strong>Write down what you know.</strong> Especially the stories: who an item came from, and when.</li>
        <li><strong>Keep a copy away from home.</strong> And update it once a year, after a large purchase, and before your policy renews.</li>
      </ol>

      <h2 id="insurance">Insurance notes</h2>
      <ul>
        <li><strong>Replacement cost or actual cash value.</strong> Ask your insurer which your policy pays. Replacement cost pays to buy a new equivalent; actual cash value subtracts depreciation.</li>
        <li><strong>Limits on valuables.</strong> Many homeowners and renters policies have lower limits for categories such as jewelry, watches, silverware, firearms and collectibles. Your inventory shows whether you own more than those limits cover.</li>
        <li><strong>Separate coverage.</strong> Items above those limits can often be listed on their own (sometimes called scheduled personal property, a rider or a floater). Insurers usually ask for a written appraisal from an independent appraiser, or a receipt, for each one.</li>
      </ul>
      <p>This is general information, not insurance advice: your policy and your insurer have the final word.</p>

      <h2 id="template">Free home inventory template</h2>
      <p>Prefer a spreadsheet? Download the template: one row per item, with the columns above, ready for Excel, Numbers or Google Sheets.</p>
      <p><a class="btn btn--primary" href="/home-inventory-template.csv" download>Download the template (CSV)</a></p>
      <p>Or skip the spreadsheet. In <a href="/home-inventory-app">Heirloom&rsquo;s home inventory app</a>, you name a room and photograph what is in it; each item is saved with its photos and its room, Home lists what still needs details, and Heirloom prepares a PDF, room by room, when you need one.</p>

{APP_BOX}

      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
"""

HTML = page(PATH, TITLE, DESC, H1, BODY, [
    article_ld(PATH, H1, DESC),
    faq_ld(PATH, FAQS),
], mid=("/guides", "Guides"), crumb_name="Home inventory checklist")

CSV = "\r\n".join([
    "Room,Item,Description,Maker or brand,Model,Serial number,Quantity,Purchase date,Purchased from,Purchase price,Replacement value,Source of replacement value,Condition,Photos taken (yes/no),Receipt or appraisal kept (yes/no),Story or notes",
    "Living room,,,,,,,,,,,,,,,",
    "Kitchen,,,,,,,,,,,,,,,",
    "Dining room,,,,,,,,,,,,,,,",
    "Bedroom,,,,,,,,,,,,,,,",
    "Bathroom,,,,,,,,,,,,,,,",
    "Home office,,,,,,,,,,,,,,,",
    "Closets,,,,,,,,,,,,,,,",
    "Basement / attic / storage,,,,,,,,,,,,,,,",
    "Garage / outdoors,,,,,,,,,,,,,,,",
    "Valuables,,,,,,,,,,,,,,,",
]) + "\r\n"
