from shell import *

PATH = "/family-heirlooms"
TITLE = "Family Heirlooms: Document Them, Pass Them Down | Heirloom"
DESC = "How to document a family heirloom: the photos to take, the questions to ask while someone remembers, the paperwork to keep, and who each one is meant for."
H1 = "How to document family heirlooms and pass them down"

QUESTIONS = [
    "Who did it belong to first, and how did it come into the family?",
    "Where was it kept, and how was it used? On holidays, every day, never?",
    "Is there a moment you remember it in? Who was there?",
    "Was it bought, made, given or won? By whom, and for what occasion?",
    "Has it been repaired, altered or appraised? Is there paperwork?",
    "Who else in the family remembers it, and what would they add?",
    "Who would you like to have it, and why?",
]

FAQS = [
    ("What counts as a family heirloom?",
     "<p>Any item a family keeps and hands down because of who it belonged to: furniture, jewelry, silver, quilts, letters, recipes, tools, photographs. An heirloom does not need a market value. Many of the most important ones have none.</p>"),
    ("What is the best way to record an heirloom&rsquo;s story?",
     "<p>Ask the person who knows it, soon, and write down their answer in their own words, with the date and who told it. Add a photo of the item and, if possible, an old photo of it in use. Keep the story with the item&rsquo;s record rather than in a separate notebook.</p>"),
    ("How do families decide who gets which heirloom?",
     "<p>The smoothest way is for the owner to decide while they can, talk about it openly, and write it down. Ask each person what matters to them before assuming; the item one person loves most is often not the one with the highest price. Where wishes need legal force, an estate attorney can advise on a will or, in many states, a separate written list of personal property.</p>"),
    ("What is a personal property memorandum?",
     "<p>In many US states, a will can refer to a separate signed list that says who receives particular items of tangible personal property, such as jewelry or furniture. The list can usually be updated without rewriting the will. Rules differ by state, so ask an estate attorney whether it applies to you.</p>"),
    ("Should I insure family heirlooms?",
     "<p>If an heirloom would be expensive to replace, check your policy&rsquo;s limits for categories such as jewelry, silverware and art. Items above them can often be covered separately, and insurers usually ask for a written appraisal from an independent appraiser. An heirloom with no market value cannot be replaced by insurance at all, which is one more reason to document its story.</p>"),
    ("Can my family see the records in Heirloom?",
     "<p>Only the relatives you invite, in the role you choose. They can add their own accounts beside yours. Your list of who each item is meant for is private and grants no one access to your account.</p>"),
]

BODY = f"""      <p class="guide__lede">The watch in the drawer and the china in the cabinet carry stories that live in one or two people&rsquo;s memories. Here is how to write them down, keep the evidence with them, and make clear who each one is meant for.</p>
      {META}
      <div class="answer">
        <p class="answer__label">In short</p>
        <p>To document a family heirloom, photograph it from the front, the back and every mark; note its measurements and condition; keep any receipts, letters or earlier valuations; and write down its story while someone remembers it: who owned it, where it came from, and what it meant. Then record who it is meant for, and tell them.</p>
      </div>

      <nav class="toc" aria-label="On this page">
        <p class="toc__title">On this page</p>
        <ol>
          <li><a href="#story">Record the story first</a></li>
          <li><a href="#photograph">Photograph and describe it</a></li>
          <li><a href="#paper">Keep the paperwork with it</a></li>
          <li><a href="#who">Decide who it is meant for</a></li>
          <li><a href="#insure">Insure what can be replaced</a></li>
          <li><a href="#care">Look after it</a></li>
          <li><a href="#faq">Questions</a></li>
        </ol>
      </nav>

      <h2 id="story">Record the story first</h2>
      <p>The item will outlast the memory of it, so the story is the urgent part. Sit down with the person who knows it, with the item in front of you, and ask:</p>
      <ul>
        {"".join(f"<li>{q}</li>" for q in QUESTIONS)}
      </ul>
      <p>Write the answers in their words, not a summary, and note who told you and when. Two relatives often remember the same item differently; keep both accounts.</p>

      <h2 id="photograph">Photograph and describe it</h2>
      <ul>
        <li>The whole item from the front, the back and the underside, in daylight.</li>
        <li>Every mark, signature, label or inscription, close and in focus. Marks are how a maker and a date are found later; see <a href="/silver-hallmarks">how to read silver hallmarks</a>.</li>
        <li>Damage and repairs, which matter for insurance and for anyone who handles it later.</li>
        <li>Its measurements, materials and where it is kept in the house.</li>
      </ul>
      <p>If you don&rsquo;t know what an heirloom is, photograph the marks anyway. <a href="/antique-identifier-app">Heirloom Advisor reads what the photos show</a> and says plainly what it cannot tell.</p>

      <h2 id="paper">Keep the paperwork with it</h2>
      <p>Receipts, letters that mention it, old photos of it in use, wills or inventories that list it, and any written valuation. Photograph each document and keep it with the item&rsquo;s record, so it is not lost in a separate box.</p>

      <h2 id="who">Decide who it is meant for</h2>
      <p>Disagreements over heirlooms are rarely about money. They are about memories, and they are easiest to prevent while the owner can still explain their wishes.</p>
      <ul>
        <li><strong>Ask before you assign.</strong> Ask each person which items matter to them and why. The answers are often surprising.</li>
        <li><strong>Write it down</strong> and share it, so nobody hears it for the first time after a death.</li>
        <li><strong>Give some things now.</strong> Many families find it easier to hand over an heirloom in person, with its story told aloud.</li>
        <li><strong>Make it legal where it needs to be.</strong> In many US states a will can refer to a separate written list of who receives particular items (a personal property memorandum). Rules differ by state, so ask an estate attorney. This page is general information, not legal advice.</li>
      </ul>
      <p>Sorting a home this way, gently and while you are able, is what the Swedes call <em>d&ouml;st&auml;dning</em>, or &ldquo;Swedish death cleaning&rdquo;: deciding what to keep, what to give, and recording why.</p>

      <h2 id="insure">Insure what can be replaced</h2>
      <p>Jewelry, silver and art often exceed a homeowners policy&rsquo;s limits for those categories. Your <a href="/home-inventory-checklist">home inventory</a> shows which items do, and your insurer can tell you what they need to cover them separately, often a written appraisal from an independent appraiser. Insurance can pay for what is lost, but it cannot replace an heirloom&rsquo;s story; only a record can keep that.</p>

      <h2 id="care">Look after it</h2>
      <ul>
        <li>Keep textiles, paper and photographs out of direct sunlight and away from attics and basements, where heat and damp do the most harm.</li>
        <li>Handle silver with clean, dry hands, and store it wrapped against tarnish.</li>
        <li>Before cleaning or repairing something old, ask a conservator or specialist; a well-meant repair can lower its value or erase evidence of its age.</li>
      </ul>

      <h2 id="heirloom">Keeping heirlooms in Heirloom</h2>
      <p>Heirloom keeps each item&rsquo;s photos, what is known about it and its story in your own words, room by room. Relatives you invite can add their accounts beside yours. You can note who each item is meant for and who should receive your records; that list is private and grants no one access to your account. When you need it, Heirloom prepares a family record from the items you choose, and keeps a record of what you sent.</p>

{APP_BOX}

      <h2 id="faq">Questions</h2>
{faq_html(FAQS)}
"""

HTML = page(PATH, TITLE, DESC, H1, BODY, [
    article_ld(PATH, H1, DESC, extra={"about": {"@type": "Thing", "name": "Family heirlooms"}}),
    faq_ld(PATH, FAQS),
], mid=("/guides", "Guides"), crumb_name="Family heirlooms")
