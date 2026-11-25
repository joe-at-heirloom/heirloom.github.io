"""Painters, calligraphers and collectors: an index and one page per person.

Data: scripts/pages/data/chinese_people.json, exported from the research folder
(hallmark-sources/chinese/people/). Each person carries two sources kept apart:
the seal book, 《中國書畫家印鑑款識》 (Shanghai Museum, 1987), for the biography
and the seals and signatures (each seal shown as a facsimile crop hosted at
media.heirloomapp.io, credited per image); Lao Jixiong's record of the national
survey of 1983–1990, 《中國古代書畫鑑定實錄》 (all nine volumes), for works examined
and the specialists' remarks; and the Qianlong-era imperial catalogs (石渠寶笈,
祕殿珠林, 1744–1816) for works under the person's name in the palace collection.
Dates are checked against Wikidata, and the page says what that check found.
"""
import json, os, re
from shell import *
import tables
from p_marks import MID, cta, e
from p_chinese import font_head, wanted_chars, CMID, side as china_side, HOME
from sections import section_page, seal_chars, CSS as SEC_CSS, JS as SEC_JS

PEOPLE = json.load(open(os.path.join(os.path.dirname(__file__), "data", "chinese_people.json")))
IDX = "/marks/chinese/painters/"
SEAL_BOOK = "《中國書畫家印鑑款識》 (Seals and Signatures of Chinese Painters and Calligraphers), compiled by the Shanghai Museum (Beijing: Wenwu chubanshe, 1987; reprinted 2005)"
SURVEY = "勞繼雄《中國古代書畫鑑定實錄》 (Lao Jixiong, A Complete Authentication and Documentation of Classical Chinese Calligraphy and Paintings), 9 vols. (Beijing: Dongfang chubanshe, 2011)"
MEDIA = "https://media.heirloomapp.io/"
SEAL_CREDIT = "Facsimile from Shanghai Museum, 《中國書畫家印鑑款識》 (Beijing, 1987)"
SHIQU_EN = {1744: "first series", 1745: "first series", 1793: "second series", 1816: "third series"}
HALL_EN = {"乾清宮": "Palace of Heavenly Purity", "養心殿": "Hall of Mental Cultivation", "重華宮": "Palace of Double Brilliance", "寧壽宮": "Palace of Tranquil Longevity",
           "延春閣": "Pavilion of Prolonged Spring", "御書房": "Imperial Study", "淳化軒": "Chunhua Gallery", "避暑山莊": "Chengde summer palace",
           "懋勤殿": "Hall of Diligence", "南薰殿": "Hall of the South Wind", "毓慶宮": "Palace of Abundant Blessing", "中正殿": "Hall of Rectitude", "三希堂": "Hall of Three Rarities"}
SKILL = {"山水": "landscape", "人物": "figures", "花卉": "flowers", "花鳥": "birds and flowers", "書法": "calligraphy", "篆刻": "seal carving",
         "墨竹": "ink bamboo", "竹": "bamboo", "梅": "plum blossom", "蘭": "orchids", "鞍馬": "horses", "仕女": "beauties", "佛像": "Buddhist figures",
         "界畫": "ruled-line painting", "走獸": "animals", "草蟲": "insects", "魚": "fish", "指畫": "finger painting", "隸書": "clerical script",
         "楷書": "regular script", "行書": "running script", "草書": "cursive script", "篆書": "seal script", "詩": "poetry", "鑑賞": "connoisseurship",
         "收藏": "collecting", "鑑藏": "collecting", "肖像": "portraits", "畫": "painting", "書": "calligraphy", "石": "rocks", "松": "pines",
         "雜畫": "miscellaneous subjects", "寫真": "portraits", "白描": "line drawing", "水墨": "ink painting", "工筆": "fine-line painting"}
VERDICT = {"genuine": ("真迹", "genuine"), "forgery": ("僞迹", "a forgery"), "reference": ("資料", "for reference only")}
DYN_ORDER = ["Tang", "Five Dynasties", "Song", "Northern Song", "Southern Song", "Jin", "Yuan", "Ming", "Qing", "Republic", "Modern", ""]


def url(p):
    return IDX + p["slug"]


def dates(p):
    if p["born"] or p["died"]:
        return f'{p["born"] or "?"}–{p["died"] or "?"}{" or after" if p.get("died_after") else ""}'
    if p.get("active"):
        return f'active {p["active"]}'
    return ""


def skills_en(t):
    parts = [s.strip() for s in re.split(r"[、，,]", t or "") if s.strip()]
    return ", ".join(f'<span lang="zh-Hant">{e(s)}</span> {e(SKILL[s])}' if s in SKILL else f'<span lang="zh-Hant">{e(s)}</span>' for s in parts)


def role(p):
    r = []
    if p["skills"] and any(k in p["skills"] for k in ("山水", "人物", "花", "竹", "梅", "畫", "蘭", "鞍馬", "仕女", "佛像")):
        r.append("painter")
    if p["skills"] and any(k in p["skills"] for k in ("書", "篆刻")):
        r.append("calligrapher" if "書" in p["skills"] else "seal carver")
    if p["collector"]:
        r.append("collector")
    return ", ".join(r) or ("painter or calligrapher")


def wd_line(p):
    w = p.get("wikidata") or {}
    q = w.get("qid")
    link = f'<a href="https://www.wikidata.org/wiki/{q}" rel="nofollow">Wikidata {q}</a>' if q else "Wikidata"
    st = w.get("status")
    if st == "confirmed":
        return f"Checked against {link}: the years agree."
    if st == "partly confirmed":
        return f"Checked against {link}: one year agrees; Wikidata does not give the other."
    if st == "differs":
        wb, wdd = ", ".join(map(str, w.get("born", []))) or "no year", ", ".join(map(str, w.get("died", []))) or "no year"
        return f"Checked against {link}, which gives {wb} to {wdd}: the sources differ, so both are given here."
    if st == "no book dates":
        return "The book gives a period, not years." + (f" See {link}." if q else "")
    return "No matching entry was found in Wikidata, so the dates rest on the book alone."


def person_page(p):
    path = url(p)
    name_html = f'<span class="proper-name">{e(p["pinyin"])}</span> <span lang="zh-Hant">{p["name"]}</span>'
    title = f'{p["pinyin"]} {p["name"]}: Seals and Signatures' + (f' ({dates(p)})' if dates(p) else "") + " | Heirloom"
    n_items = len(p["items"])
    desc = f'{p["pinyin"]} ({p["name"]}{", " + dates(p) if dates(p) else ""}), Chinese {role(p)}: art names, native place, {n_items} recorded seals and signatures with their readings and the works they come from, with sources.'
    aliases = "、".join(p["aliases"])
    facts = [("Name", name_html), ("Dates", (e(dates(p)) + (f' <span class="muted" lang="zh-Hant">{e(p["dates_text"])}</span>' if p["dates_text"] else "")) or "Not recorded")]
    if aliases:
        facts.append(("Other names", f'<span lang="zh-Hant">{e(aliases)}</span>'))
    if p["place_zh"]:
        facts.append(("Native place", f'<span lang="zh-Hant">{e(p["place_zh"])}</span> {e(p["place_en"])}'))
    if p["ethnicity"]:
        facts.append(("Ethnicity", f'<span lang="zh-Hant">{e(p["ethnicity"])}</span>'))
    if p["skills"]:
        facts.append(("Known for", skills_en(p["skills"])))
    if p["writings"]:
        facts.append(("Writings", f'<span lang="zh-Hant">{e(p["writings"])}</span>'))
    facts.append(("Role", e(role(p))))
    head = '<header class="entry-head entry-head--person"><div class="entry-head__mark"><span class="cn-seal cn-seal--big" lang="zh-Hant" aria-hidden="true">' + p["name"][:4] + '</span></div><dl class="facts">' + "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in facts) + "</dl></header>"
    def seal_img(i):
        if not i.get("img"):
            return '<span class="muted">no image</span>'
        pg = i.get("img_page") or ""
        where = f'vol. {pg[1]}, PDF p. {int(pg[3:])}' if re.match(r"v\d-\d+", pg) else ""
        credit = f'{SEAL_CREDIT}, {where + ", " if where else ""}entry {p["book"]["no"]}, seal {i["n"]}'
        return (f'<img class="seal-img" src="{MEDIA}{e(i["img"])}" loading="lazy" decoding="async" '
                f'alt="Seal or signature {i["n"]} of {e(p["pinyin"])}{(", reading " + e(i["reading"])) if i["reading"] else ""}" title="{e(credit)}">')
    rows = "".join(
        f'<tr><td class="num">{i["n"]}</td><td class="seal-cell">{seal_img(i)}</td><td><span class="seal-read" lang="zh-Hant">{e(i["reading"]) or "<span class=muted>unread</span>"}</span>'
        + (' <span class="tag">collector’s seal</span>' if i["collector_seal"] else "") + (' <span class="tag tag--soft">from a book</span>' if i["rephotographed"] else "")
        + f'</td><td lang="zh-Hant">{e(i["source"])}</td><td class="num">{e(i["date_text"])}</td></tr>'
        for i in sorted(p["items"], key=lambda i: i["n"]))     # the book prints captions in two columns; show them in number order
    seals = (f'<div class="table-wrap"><table class="seal-table"><thead><tr><th>No.</th><th>Image</th><th>Reads</th><th>On the work</th><th>Date</th></tr></thead><tbody>{rows}</tbody></table></div>'
             if rows else "<p>No seals or signatures could be read from this entry yet.</p>")
    surv = ""
    if p["survey"]:
        items = []
        for r in p["survey"]:
            zh, en = VERDICT.get(r["verdict"], ("", ""))
            ops = "".join(f'<li><strong>{e(o["expert"])}</strong>: <span lang="zh-Hant">{e(o["text"])}</span></li>' for o in r["opinions"])
            items.append(f'<li class="survey-rec"><div class="survey-rec__head"><span lang="zh-Hant" class="survey-rec__title">{e(r["title"])}</span>'
                         f'<span class="verdict verdict--{r["verdict"]}"><span lang="zh-Hant">{zh}</span> {en}</span></div>'
                         f'<p class="survey-rec__meta">{" · ".join(x for x in [e(r["museum"] or ""), e(r["medium"] or ""), ("inscribed " + e(r["inscription"])) if r["inscription"] else ""] if x)}</p>'
                         + (f'<p class="survey-rec__note" lang="zh-Hant">按：{e(r["note"])}</p>' if r["note"] else "")
                         + (f'<ul class="survey-rec__ops">{ops}</ul>' if ops else "") + "</li>")
        surv = f"""      <h2 id="survey">In the national survey, 1983 to 1990</h2>
      <p>From 1983 to 1990 a group of China’s leading connoisseurs examined the painting and calligraphy in the country’s public collections; their secretary, Lao Jixiong, recorded each work and what was said about it. These are the works by {e(p["pinyin"])} in Lao’s record, with the collection that held each, the group’s verdict and the remarks of named members. The verdicts are theirs; Heirloom repeats them and does not judge any item.</p>
      <ul class="survey-list">{"".join(items)}</ul>"""
    shiqu = ""
    if p.get("shiqu"):
        def cite(c):
            if c.get("juan"):
                return f'{e(c["juan"])}, f. {e(c["folio"] or "")}'
            link = c.get("archive_org")
            t = f'contents vol. {c["volume"]}, p. {c["page"]}'
            return f'<a href="{e(link)}" rel="nofollow">{t}</a>' if link else t
        rows_s = "".join(
            f'<tr><td><span lang="zh-Hant">{e(x["edition"])}</span> {SHIQU_EN.get(x["year"], "")}, {x["year"]}</td>'
            f'<td><span lang="zh-Hant">{e(x["title"])}</span> <span class="muted" lang="zh-Hant">{e((x["count"] or "") + (x["format"] or ""))}</span></td>'
            f'<td>{("<span lang=zh-Hant>" + e(x["hall"]) + "</span> " + e(HALL_EN.get(re.sub(r"[一二三四五六七八九十]+$", "", x["hall"]).replace("宫", "宮"), ""))) if x["hall"] else "<span class=muted>not stated</span>"}</td>'
            f'<td>{("<span lang=zh-Hant>" + e(x["grade"]) + "</span> " + ("upper" if x["grade"] == "上等" else "lower")) if x.get("grade") else ""}</td>'
            f'<td>{cite(x["cite"])}</td></tr>'
            for x in sorted(p["shiqu"], key=lambda x: (x["year"], x["title"])))
        shiqu = f"""      <h2 id="imperial">In the Qing imperial catalogs</h2>
      <p>The Qianlong emperor had his court catalog the painting and calligraphy in the palaces: 石渠寶笈 (secular works) and 祕殿珠林 (Buddhist and Daoist works), in 1744–45, with further series in 1793 and 1816. These {len(p["shiqu"])} entries are recorded under {e(p["pinyin"])}’s name, with the hall where each was kept and, in the first series, the court’s grade. A listing means the emperor owned an item with that title; it does not show that any particular scroll is that item.</p>
      <div class="table-wrap"><table class="seal-table"><thead><tr><th>Catalog</th><th>Title</th><th>Kept in</th><th>Grade</th><th>Source</th></tr></thead><tbody>{rows_s}</tbody></table></div>"""
    body = f"""{head}
      <p class="note">{wd_line(p)}</p>
      <h2 id="seals">Seals and signatures</h2>
      <p>The {n_items} seals and signatures the Shanghai Museum’s book records for {e(p["pinyin"])}, numbered as in the book (entry {p["book"]["no"]}, from p. {p["book"]["page"]}), each with its reading, the work it is on, and that work’s date where known. Seals come first and signatures after. A seal a person stamped on someone else’s work, as an owner, is marked as a collector’s seal.</p>
      {seals}
      <p class="note">The readings were transcribed from the book and checked against its index; a character the book could not read is shown as it prints it. A seal or signature names the person it claims to; it does not make a work theirs.</p>
{surv}
{shiqu}
{cta("Photograph the seals and the signature. The Advisor reads them and names the people they claim, with the record each comes from; it never says whether a work is genuine.")}
      <h2 id="sources">Sources</h2>
      <!--copy-check:skip--><ol class="sources sources--num">
        <li>{e(SEAL_BOOK)}, entry {p["book"]["no"]}, p. {p["book"]["page"]}.</li>
        {"<li>" + e(SURVEY) + ", " + e("; ".join(f"vol. {v}, pp. " + ", ".join(str(x) for x in sorted({int(r["page"][3:]) for r in p["survey"] if r["page"][1] == v})) for v in sorted({r["page"][1] for r in p["survey"]}))) + " (PDF pages).</li>" if p["survey"] else ""}
        {"<li>Seal and signature images: facsimiles from the book above, each credited with its volume, page and seal number; reproduced as reference by Heirloom, which holds no licence from the publisher.</li>" if any(i.get("img") for i in p["items"]) else ""}
        {"<li>Qing imperial catalogs: 石渠寶笈 and 祕殿珠林, first series (1744–45) from the Siku quanshu text (Kanripo), second (1793) and third (1816) series from the contents volumes of the Peking University manuscript copies (Internet Archive); each entry above gives its place in the source.</li>" if p.get("shiqu") else ""}
        {f'<li>Wikidata, <a href="https://www.wikidata.org/wiki/{p["wikidata"]["qid"]}" rel="nofollow">{p["wikidata"]["qid"]}</a>.</li>' if (p.get("wikidata") or {}).get("qid") else ""}
      </ol><!--/copy-check:skip-->
"""
    kw = section_page("china", path)
    kw["side"] = china_side(path)
    chars = wanted_chars(body + kw["top"] + seal_chars() + p["name"])
    graph = [{"@type": "Person", "@id": SITE + path + "#person", "name": p["pinyin"], "alternateName": [p["name"], *p["aliases"]][:12],
              **({"birthDate": str(p["born"])} if p["born"] else {}), **({"deathDate": str(p["died"])} if p["died"] else {}),
              **({"sameAs": f'https://www.wikidata.org/wiki/{p["wikidata"]["qid"]}'} if (p.get("wikidata") or {}).get("status") == "confirmed" else {})},
             article_ld(path, f'{p["pinyin"]}: seals and signatures', desc)]
    return path, page(path, title, desc, name_html, body, graph, mid=(IDX, "Painters and collectors"), crumb_name=p["pinyin"],
                      extra_head=font_head(chars) + "\n  " + SEC_CSS, extra_body=SEC_JS, **kw)


def index_page():
    path = IDX
    title = "Chinese Painters and Collectors: Seals and Signatures | Heirloom"
    n = len(PEOPLE)
    n_items = sum(len(p["items"]) for p in PEOPLE)
    desc = f"{n} Chinese painters, calligraphers and collectors from the Tang to the 20th century, with their art names, dates, native places and {n_items:,} recorded seals and signatures, with sources."
    h1 = "Painters, calligraphers and collectors"
    dyns = [d for d in DYN_ORDER if any(p["dynasty"] == d for p in PEOPLE) and d]
    buttons = "".join(f'<button type="button" data-pp-dyn="{e(d)}" aria-pressed="false">{e(d)}</button>' for d in dyns) + '<button type="button" data-pp-col="1" aria-pressed="false">Collectors</button>'
    people = sorted(PEOPLE, key=lambda p: (p["pinyin"].lower(), p["name"]))
    rows = "".join(
        f'<li data-dyn="{e(p["dynasty"])}" data-col="{1 if p["collector"] else 0}" data-keys="{e(" ".join([p["pinyin"], p["name"], *p["aliases"]]))}">'
        f'<a href="{url(p)}"><span class="pp-han" lang="zh-Hant">{p["name"]}</span><span class="pp-name">{e(p["pinyin"])}</span>'
        f'<span class="pp-dates">{e(dates(p))}</span><span class="pp-dyn">{e(p["dynasty"])}</span><span class="pp-n">{len(p["items"])} seals</span></a></li>'
        for p in people)
    body = f"""      <p class="guide__lede">{n:,} painters, calligraphers and collectors, from the Tang to the 20th century, with {n_items:,} of their seals and signatures read and tied to the works they come from. Find a person by pinyin, by their Chinese name, or by any of their art names.</p>
      {META}
      <div class="finder" id="pp-finder">
        <div class="finder__row"><label class="grow">Name, art name or characters<input id="pp-q" type="search" placeholder="Dong Qichang, 董其昌 or 香光居士" autocomplete="off"></label></div>
        <div class="cr-dyn" role="group" aria-label="Period" style="margin-top:12px">{buttons}</div>
        <p class="finder__hint" id="pp-count">{n:,} people</p>
      </div>
      <ul class="pp-list">{rows}</ul>
      <h2 id="about">Where this comes from</h2>
      <p>The people, their names and their seals come from the Shanghai Museum’s 《中國書畫家印鑑款識》 (1987), the standard Chinese reference, which photographed most of its seals and signatures directly from the original works. Dates are checked against Wikidata, and where the two differ each page says so. Works examined in China’s national survey of 1983 to 1990, with the specialists’ verdicts and remarks, come from Lao Jixiong’s record of it.</p>
      <p class="note">A seal or a signature names the person it claims to. Seals and signatures were copied as readily as reign marks, and Heirloom never says whether a work is genuine.</p>
{cta("Photograph the seals and the signature. The Advisor reads them and names the people they claim, with the record each comes from; it never says whether a work is genuine.")}
"""
    kw = section_page("china", path)
    kw["side"] = china_side(path)
    chars = wanted_chars(body + kw["top"] + seal_chars())
    graph = [{"@type": "CollectionPage", "@id": SITE + path, "url": SITE + path, "name": title, "description": desc, "isPartOf": {"@id": SITE + "/#website"}}]
    return path, page(path, title, desc, h1, body, graph, mid=CMID, crumb_name="Painters and collectors",
                      extra_head=font_head(chars) + "\n  " + SEC_CSS, extra_body='<script src="/marks/marks.js" defer></script>\n  <script>window.MARKS_TOOL = "people";</script>\n  ' + SEC_JS, **kw)


def search_json():
    data = [{"n": p["name"], "p": p["pinyin"], "a": p["aliases"][:8], "u": url(p), "d": dates(p)} for p in PEOPLE]
    return IDX + "search.json", json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def build():
    return [index_page(), search_json()] + [person_page(p) for p in PEOPLE]
