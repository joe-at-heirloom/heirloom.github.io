/** @jsxImportSource preact */
// The marks portal: one search over Heirloom's whole reference collection (the
// records the Advisor reads), answers as you type, any record opened in place.
// Data: /marks/data/index.json (every record but the seals, loaded at once),
// /marks/data/seals.json (the seals and signatures, loaded when a search has
// Chinese characters or asks for them), /marks/data/f/<family>.json and
// /marks/data/r/<id>.json (a record in full, when it is opened).
// The address keeps the state: ?q= the search, ?f= the family, ?r= the record.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

type Row = [string, string, string, string, number | null, number | null, string | null, string, string, string];
type Seal = [string, string, string, string, string, string];
type Family = { family: string; label: string; count: number };
type Props = { families: Family[]; perRecord: string[]; sealCount: number };

type Hit = { id: string; name: string; kind: string; family: string; from: number | null; to: number | null; thumb: string | null; line: string; url: string; score: number; seal?: Seal };

const HAN = /[㐀-鿿豈-﫿]/;
const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const years = (a: number | null, b: number | null) => (a && b && a !== b ? `${a}–${b}` : a ? String(a) : b ? `to ${b}` : '');
const SEAL_LABEL = 'Seals and signatures';
// Kinds a name search is usually after: the mark that names the maker, the reign, the artist.
const PRIMARY = /maker's mark|trademark|maker history|artist$|reign mark|hall mark|town mark|standard mark|painter|collector$|lookup table/;

function readUrl() {
  const p = new URLSearchParams(location.search);
  return { q: p.get('q') ?? '', f: p.get('f') ?? '', r: p.get('r') ?? '' };
}
function writeUrl(q: string, f: string, r: string) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (f) p.set('f', f);
  if (r) p.set('r', r);
  const s = p.toString();
  history.replaceState(null, '', `${location.pathname}${s ? `?${s}` : ''}`);
}

export default function Portal({ families, perRecord, sealCount }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [seals, setSeals] = useState<Seal[] | null>(null);
  const [q, setQ] = useState('');
  const [fam, setFam] = useState('');
  const [open, setOpen] = useState('');
  const [more, setMore] = useState(60);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = readUrl();
    setQ(u.q); setFam(u.f); setOpen(u.r);
    fetch('/marks/data/index.json').then((r) => r.json()).then(setRows).catch(() => setRows([]));
    if (!u.q && !u.r) input.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => { writeUrl(q, fam, open); }, [q, fam, open]);
  useEffect(() => { setMore(60); }, [q, fam]);

  const qn = q.trim().normalize('NFKC');
  const han = HAN.test(qn);
  const wantSeals = han || fam === 'seals';
  useEffect(() => {
    if (wantSeals && !seals) fetch('/marks/data/seals.json').then((r) => r.json()).then(setSeals).catch(() => setSeals([]));
  }, [wantSeals]);

  // Each row's words, folded once.
  const prepared = useMemo(() => (rows ?? []).map((r) => ({ r, name: fold(r[1]), words: r[9].split('|').filter(Boolean).map(fold), line: fold(r[7]) })), [rows]);

  const { hits, counts } = useMemo(() => {
    const out: Hit[] = [];
    const counts = new Map<string, number>();
    const add = (h: Hit) => { out.push(h); counts.set(h.seal ? 'seals' : h.family, (counts.get(h.seal ? 'seals' : h.family) ?? 0) + 1); };
    const ql = fold(qn);
    if (!ql && fam && fam !== 'seals') {
      for (const p of prepared) if (p.r[3] === fam) add(toHit(p.r, 1));
      out.sort((a, b) => (a.from ?? 99999) - (b.from ?? 99999) || a.name.localeCompare(b.name));
      return { hits: out, counts };
    }
    if (!ql) return { hits: out, counts };
    const tokens = ql.split(/[\s,·]+/).filter(Boolean);
    const year = /^\d{4}$/.test(ql) ? Number(ql) : null;
    for (const p of prepared) {
      let s = 0;
      if (p.words.includes(ql) || p.name === ql) s = 100;
      else if (han) {
        for (const w of p.words) {
          if (!HAN.test(w)) continue;
          if (w.length >= 2 && ql.includes(w)) s = Math.max(s, 70 + w.length);
          else if (w.includes(ql)) s = Math.max(s, 60);
        }
      } else {
        const hay = [...p.name.split(/[\s,:;()'".–-]+/), ...p.words.flatMap((w) => w.split(/[\s,:;()'".–-]+/))].filter(Boolean);
        const matched = tokens.filter((t) => hay.some((h) => h.startsWith(t)));
        if (matched.length === tokens.length) s = 40 + (p.name.startsWith(ql) ? 25 : 0) + (tokens.length > 1 ? 10 : 0);
        else if (tokens.length > 2 && matched.length >= tokens.length - 1 && matched.every((t) => t.length >= 3)) s = 20;
        // A number or a word in what the record says ("925" in a standard's meaning).
        if (!s && (ql.length >= 4 || /^\d{3,}$/.test(ql))) {
          // A number matches as a whole number: 925, not the 925 inside 1925.
          const re = /^\d+$/.test(ql) ? new RegExp(`(^|\\D)${ql}(\\D|$)`) : null;
          const has = (t: string) => (re ? re.test(t) : t.includes(ql));
          if (has(p.line) || p.words.some(has)) s = 12;
        }
      }
      // The marks people mean by a name come before the long runs of a maker's date letters and codes.
      if (s && !year && ql.length > 1) {
        if (PRIMARY.test(p.r[2])) s += 25;
        else if (/date letter|date code/.test(p.r[2])) s -= 15;
      }
      if (year !== null && p.r[4] !== null && p.r[4] <= year && (p.r[5] ?? p.r[4]) >= year) s = Math.max(s, /date letter|date code/.test(p.r[2]) ? 60 : 15);
      if (s) add(toHit(p.r, s));
    }
    if (han && seals) {
      for (const sl of seals) {
        const rd = sl[1];
        let s = 0;
        if (rd === qn) s = 90;
        else if (rd.length >= 2 && (rd.includes(qn) || qn.includes(rd))) s = 65;
        if (s) add({ id: sl[0], name: rd, kind: 'seal', family: 'chinese-people', from: null, to: null, thumb: null, line: [sl[3], sl[4], sl[5]].filter(Boolean).join(' · '), url: '', score: s, seal: sl });
      }
    }
    out.sort((a, b) => b.score - a.score || (a.from ?? 99999) - (b.from ?? 99999) || a.name.localeCompare(b.name));
    return { hits: out, counts };
  }, [prepared, seals, qn, fam]);

  const shown = fam ? hits.filter((h) => (fam === 'seals' ? !!h.seal : !h.seal && h.family === fam)) : hits;
  const searching = !!qn;
  const labelOf = (f: string) => (f === 'seals' ? SEAL_LABEL : families.find((x) => x.family === f)?.label ?? f);

  return (
    <div class="portal">
      <div class="portal__bar" role="search">
        <label class="portal__q">
          <span class="visually-hidden">Search every mark, maker, reign, artist and seal</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={input}
            type="search"
            autoComplete="off"
            autoCapitalize="off"
            spellcheck={false}
            placeholder="A letter, a year, 925, 大明成化年製, Gorham, Monet…"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          />
          {q && <button type="button" class="portal__clear" aria-label="Clear the search" onClick={() => { setQ(''); input.current?.focus(); }}>×</button>}
        </label>
        {(searching || fam) && (
          <div class="portal__chips" role="group" aria-label="Narrow by family">
            <button type="button" aria-pressed={!fam} onClick={() => setFam('')}>All{searching ? ` ${hits.length}` : ''}</button>
            {[...families.map((f) => f.family), ...(han || fam === 'seals' ? ['seals'] : [])]
              .filter((f) => !searching || counts.get(f) || f === fam)
              .map((f) => (
                <button type="button" aria-pressed={fam === f} onClick={() => setFam(fam === f ? '' : f)}>
                  {labelOf(f)}{searching ? ` ${counts.get(f) ?? 0}` : ''}
                </button>
              ))}
          </div>
        )}
        <p class="portal__sum" aria-live="polite">
          {!rows ? 'Loading the reference…'
            : searching ? (shown.length ? `${shown.length} ${shown.length === 1 ? 'record' : 'records'}${fam ? ` in ${labelOf(fam)}` : ''}` : (han && !seals ? 'Looking in the seals too…' : 'Nothing matches. Try fewer words, or the characters alone.'))
            : fam ? `${shown.length} records in ${labelOf(fam)}` : `${rows.length.toLocaleString('en-US')} records, ${sealCount.toLocaleString('en-US')} seals and signatures`}
        </p>
      </div>

      {(searching || fam) && (
        <ol class="results">
          {shown.slice(0, more).map((h) => (
            <li key={h.id}>
              <button type="button" class="result" onClick={() => setOpen(h.id)}>
                <span class="result__img plate plate--print">{h.thumb ? <img src={`/${h.thumb}`} alt="" loading="lazy" decoding="async" /> : <span class="result__glyph">{h.seal ? '印' : h.name.slice(0, 1)}</span>}</span>
                <span class="result__text">
                  <span class="result__name">{h.name}</span>
                  <span class="result__meta">{h.seal ? 'Seal or signature' : h.kind}{years(h.from, h.to) && <> · <span class="num">{years(h.from, h.to)}</span></>}{!fam && <> · {h.seal ? SEAL_LABEL : labelOf(h.family)}</>}</span>
                  {h.line && <span class="result__line">{h.line}</span>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {shown.length > more && <button type="button" class="btn portal__more" onClick={() => setMore(more + 120)}>Show {Math.min(120, shown.length - more)} more</button>}

      <RecordPanel id={open} rows={rows} seals={seals} perRecord={perRecord} onOpen={setOpen} onClose={() => setOpen('')} labelOf={labelOf} needSeals={() => { if (!seals) fetch('/marks/data/seals.json').then((r) => r.json()).then(setSeals); }} />
    </div>
  );
}

function toHit(r: Row, score: number): Hit {
  return { id: r[0], name: r[1], kind: r[2], family: r[3], from: r[4], to: r[5], thumb: r[6], line: r[7], url: r[8], score };
}

// ── A record, in full ─────────────────────────────────────────────────────────
type Full = {
  id: string; family: string; kind: string; name: string; summary?: string | null; looks_like?: string | null; maker?: string | null;
  place?: string | null; country?: string | null; date_from?: number | null; date_to?: number | null; date_note?: string | null;
  single_source: boolean; attributes: Record<string, any>; url: string; image: { file: string; status: string; credit: string | null; source_url: string | null } | null;
  sources: { citation: string; url: string | null; where: string | null }[]; parent: { id: string; name: string } | null; children: string[];
};
const cache = new Map<string, Promise<Full[]>>();
function loadFamily(family: string): Promise<Full[]> {
  if (!cache.has(family)) cache.set(family, fetch(`/marks/data/f/${family}.json`).then((r) => r.json()));
  return cache.get(family)!;
}
async function loadRecord(id: string, family: string, perRecord: string[]): Promise<Full | null> {
  if (perRecord.includes(family)) return fetch(`/marks/data/r/${id}.json`).then((r) => (r.ok ? r.json() : null));
  return (await loadFamily(family)).find((x) => x.id === id) ?? null;
}

const STATUS: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };
const FACTS: [string, string][] = [
  ['letter', 'Letter'], ['case', 'Case'], ['style', 'Style'], ['year_label', 'Assay year'], ['alt_year', 'Another source gives'], ['confidence', 'Confidence'],
  ['dynasty', 'Dynasty'], ['emperor_name', 'Emperor'], ['hall_kind', 'Kind'], ['owner', 'Owner'], ['owner_dates', 'Owner’s dates'], ['script', 'Script'],
  ['placement_colour', 'Where and in what colour'], ['wares', 'Wares'], ['reign', 'Reign'], ['topic', 'Topic'], ['place_zh', 'Native place'],
  ['skills', 'Skills'], ['seal_count', 'Seals and signatures recorded'], ['nationality', 'Nationality'], ['reads', 'Reads'], ['position', 'Where'],
  ['form', 'Form'], ['medium', 'Medium'], ['age', 'Age'], ['work', 'Work'], ['date_text', 'Date'], ['dates', 'Dates'], ['applied', 'Applied'],
  ['series', 'Series'], ['rows', 'Rows'], ['note', 'Note'], ['later_copies_note', 'Later copies'], ['caution', 'Caution'], ['quote_zh', 'Source text'],
];
const show = (v: unknown): string | null => {
  if (v === null || v === undefined || v === '' || v === false) return null;
  if (typeof v === 'string' || typeof v === 'number') return String(v).replace(/_/g, ' ');
  if (v === true) return 'yes';
  return null;
};

function RecordPanel({ id, rows, seals, perRecord, onOpen, onClose, labelOf, needSeals }: {
  id: string; rows: Row[] | null; seals: Seal[] | null; perRecord: string[]; onOpen: (id: string) => void; onClose: () => void; labelOf: (f: string) => string; needSeals: () => void;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [rec, setRec] = useState<Full | null>(null);
  const [kids, setKids] = useState<Full[]>([]);
  const [failed, setFailed] = useState(false);
  const seal = id && seals ? seals.find((s) => s[0] === id) ?? null : null;
  const isSealId = /^cn-person-yj\d+-\d+/.test(id);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (id && !d.open) d.showModal();
    if (!id && d.open) d.close();
  }, [id]);

  useEffect(() => {
    setRec(null); setKids([]); setFailed(false);
    if (!id || !rows) return;
    if (isSealId) { needSeals(); return; }
    const row = rows.find((r) => r[0] === id);
    if (!row) { setFailed(true); return; }
    let live = true;
    loadRecord(id, row[3], perRecord).then(async (r) => {
      if (!live) return;
      if (!r) { setFailed(true); return; }
      setRec(r);
      if (r.children.length && !perRecord.includes(r.family)) {
        const fam = await loadFamily(r.family);
        if (live) setKids(r.children.map((c) => fam.find((x) => x.id === c)).filter(Boolean) as Full[]);
      }
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [id, rows]);

  const personSeals = rec && rec.family === 'chinese-people' && seals ? seals.filter((s) => s[2] === rec.id) : null;
  useEffect(() => { if (rec?.family === 'chinese-people') needSeals(); }, [rec]);

  return (
    <dialog ref={dlg} class="panel" aria-label="Record" onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      <div class="panel__in">
        <div class="panel__top">
          <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        {failed && <p class="muted">No record has this address, or it could not be loaded. Search for it instead.</p>}
        {isSealId && seal && (
          <article>
            <p class="panel__kind">Seal or signature · {SEAL_LABEL}</p>
            <h2 class="panel__name han">{seal[1]}</h2>
            <dl class="rfacts">
              {seal[4] && <div><dt>On</dt><dd class="han">{seal[4]}</dd></div>}
              {seal[5] && <div><dt>Date</dt><dd class="han">{seal[5]}</dd></div>}
            </dl>
            <p>Recorded for <button type="button" class="link" onClick={() => onOpen(seal[2])}>{seal[3]}</button> in the Shanghai Museum’s seal book. A seal names the person it claims to; it does not make a work theirs.</p>
          </article>
        )}
        {rec && (
          <article>
            {rec.image && (
              <figure class="panel__fig">
                <div class="plate plate--print panel__plate"><img src={`/${rec.image.file}`} alt={rec.looks_like ?? rec.name} /></div>
                <figcaption>{STATUS[rec.image.status] ?? ''}{rec.image.credit ? `. ${rec.image.credit}` : ''}{rec.image.source_url && <> <a href={rec.image.source_url} rel="noopener">Source</a></>}</figcaption>
              </figure>
            )}
            <p class="panel__kind">{rec.kind} · {labelOf(rec.family)}</p>
            <h2 class="panel__name">{rec.name}</h2>
            {(rec.date_from || rec.date_to) && <p class="panel__years num">{years(rec.date_from ?? null, rec.date_to ?? null)}{rec.date_note && <span class="muted"> · {rec.date_note}</span>}</p>}
            {rec.summary && <p class="panel__summary">{rec.summary}</p>}
            {rec.looks_like && rec.looks_like !== rec.summary && <p><strong>Looks like:</strong> {rec.looks_like}</p>}
            {rec.single_source && <p class="panel__warn">Only one source supports part of this record.</p>}
            <dl class="rfacts">
              {rec.maker && <div><dt>Maker</dt><dd>{rec.maker}</dd></div>}
              {rec.place && <div><dt>Place</dt><dd>{rec.place}</dd></div>}
              {FACTS.map(([k, label]) => { const v = show(rec.attributes?.[k]); return v ? <div><dt>{label}</dt><dd class={HAN.test(v) ? 'han' : ''}>{v}</dd></div> : null; })}
              {Array.isArray(rec.attributes?.marks) && <div><dt>Marks</dt><dd>{rec.attributes.marks.map((m: any) => <span class="mk"><span class="han">{m.chars}</span> <span class="muted">{m.script}</span></span>)}</dd></div>}
            </dl>
            {Array.isArray(rec.attributes?.history) && rec.attributes.history.length > 0 && <div class="panel__prose">{rec.attributes.history.map((p: string) => <p>{p}</p>)}</div>}
            {Array.isArray(rec.attributes?.facts) && rec.attributes.facts.length > 0 && <ul class="panel__list">{rec.attributes.facts.map((f: any) => <li>{f.text}</li>)}</ul>}
            {rec.parent && <p class="panel__parent">Part of <button type="button" class="link" onClick={() => onOpen(rec.parent!.id)}>{rec.parent.name}</button></p>}
            {kids.length > 0 && (
              <section class="panel__kids">
                <h3>{kids.length} related {kids.length === 1 ? 'record' : 'records'}</h3>
                <ul>
                  {kids.slice(0, 60).map((k) => (
                    <li><button type="button" class="kid" onClick={() => onOpen(k.id)}>
                      {k.image ? <span class="plate plate--print kid__img"><img src={`/${k.image.file}`} alt="" loading="lazy" /></span> : null}
                      <span><span class="kid__name">{k.name}</span><span class="muted">{k.kind}{(k.date_from || k.date_to) ? ` · ${years(k.date_from ?? null, k.date_to ?? null)}` : ''}</span>{!k.image && k.summary && <span class="kid__line">{k.summary.slice(0, 160)}{k.summary.length > 160 ? '…' : ''}</span>}</span>
                    </button></li>
                  ))}
                </ul>
              </section>
            )}
            {personSeals && personSeals.length > 0 && (
              <section class="panel__kids">
                <h3>{personSeals.length} seals and signatures</h3>
                <ul class="seals">{personSeals.slice(0, 200).map((s) => <li><span class="han seals__r">{s[1]}</span><span class="muted han">{[s[4], s[5]].filter(Boolean).join(' · ')}</span></li>)}</ul>
              </section>
            )}
            {rec.sources.length > 0 && (
              <section class="panel__sources">
                <h3>Sources</h3>
                <ol>{rec.sources.map((s) => <li>{s.url ? <a href={s.url} rel="nofollow noopener">{s.citation}</a> : s.citation}{s.where ? `, ${s.where}` : ''}</li>)}</ol>
              </section>
            )}
            <p class="panel__actions">
              <a class="btn" href={rec.url}>Open its page</a>
              <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}/marks/?r=${rec.id}`)}>Copy link</button>
            </p>
          </article>
        )}
        {!rec && !failed && !(isSealId && seal) && id && <p class="muted">Opening…</p>}
      </div>
    </dialog>
  );
}
