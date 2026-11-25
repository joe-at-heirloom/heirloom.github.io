/** @jsxImportSource preact */
// The silver explorer: tap each mark you find on an item, and the marks are
// read together the way a specialist reads them: what the metal is (solid
// silver, plate, or no silver at all), who made it, and the years in which all
// of them were in use. Search by what a mark says or shows; any mark opens in
// place with its sources. Gorham's year marks are a palette of their own, and a
// British town mark points to its date-letter sheet.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { SMark, SGroup, Metal } from '../lib/silver';

type Props = { groups: SGroup[]; marks: SMark[] };
const NOW = new Date().getFullYear();
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\./g, '');
const years = (m: { from: number | null; to: number | null }) =>
  m.from && m.to ? (m.from === m.to ? `${m.from}` : `${m.from}–${m.to}`) : m.from ? `${m.from} on` : m.to ? `to ${m.to}` : '';
const STATUS: Record<string, string> = { photo: 'Photograph', facsimile: 'Book facsimile', rendering: 'Drawing' };
const METAL: Record<Metal, string> = { silver: 'Solid silver', plate: 'Plate', none: 'No silver' };

/** The marks read together. */
function reading(sel: SMark[]) {
  const metals = new Set(sel.map((m) => m.metal).filter(Boolean) as Metal[]);
  let metal: { tone: string; text: string } | null = null;
  if (metals.size > 1) metal = { tone: 'warn', text: `The marks disagree about the metal (${[...metals].map((x) => METAL[x].toLowerCase()).join(' and ')}). Look at each one again.` };
  else if (metals.has('silver')) metal = { tone: 'silver', text: 'Solid silver, by the standard mark.' };
  else if (metals.has('plate')) metal = { tone: 'plate', text: 'Silver plate: the silver is a coat on another metal.' };
  else if (metals.has('none')) metal = { tone: 'none', text: 'No silver in the metal: it is nickel silver.' };
  else if (sel.length) metal = { tone: 'muted', text: 'None of these marks says what the metal is. Look for a number, a word such as STERLING, or a plate grade.' };
  const makers = [...new Set(sel.map((m) => m.maker).filter(Boolean) as string[])];
  const dated = sel.filter((m) => m.from || m.to);
  const lo = dated.length ? Math.max(...dated.map((m) => m.from ?? -Infinity)) : null;
  const hi = dated.length ? Math.min(...dated.map((m) => m.to ?? Infinity)) : null;
  let when: { tone: string; text: string } | null = null;
  if (dated.length) {
    if (lo !== null && hi !== null && lo > hi) {
      when = { tone: 'warn', text: `These marks were not in use at the same time: ${dated.map((m) => `${m.name} ${years(m)}`).join('; ')}. Check that each one is read right.` };
    } else {
      const a = lo === -Infinity ? null : lo, b = hi === Infinity ? null : hi;
      when = { tone: 'ok', text: a && b ? (a === b ? `Made in ${a}, by the marks.` : `Made between ${a} and ${b}, by the marks.`) : a ? `Made in ${a} or later, by the marks.` : b ? `Made by ${b}, by the marks.` : '' };
    }
  }
  const sheets = [...new Set(sel.map((m) => m.sheet).filter(Boolean) as string[])];
  return { metal, makers, when, sheets };
}

export default function SilverExplorer({ groups, marks }: Props) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState('');
  const [yearsOpen, setYearsOpen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ(p.get('q') ?? '');
    const g = p.get('group');
    if (g && groups.some((x) => x.key === g)) setGroup(g);
    setPicked((p.get('m') ?? '').split(',').filter((id) => marks.some((m) => m.id === id)));
    const o = p.get('open');
    if (o && marks.some((m) => m.id === o)) setOpen(o);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (group) p.set('group', group);
    if (picked.length) p.set('m', picked.join(','));
    if (open) p.set('open', open);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }, [q, group, picked, open]);

  const prepared = useMemo(() => marks.map((m) => ({ m, w: m.words.split(/[^a-z0-9&]+/).filter(Boolean) })), [marks]);
  const tokens = norm(q).split(/[^a-z0-9&]+/).filter(Boolean);
  const hits = useMemo(() => {
    if (!tokens.length) return null;
    // A number or a short word matches whole (925, not 9250; bee, not been); a longer word as the start of one.
    const ok = (t: string, x: string) => (/^\d+$/.test(t) || t.length <= 3 ? x === t || x === `${t}s` : x.startsWith(t));
    // Marks whose own name has the words come first, then the rest in their order.
    const score = (m: SMark) => { const nw = norm(m.name).split(/[^a-z0-9&]+/); return tokens.filter((t) => nw.some((x) => ok(t, x))).length * 2 + (nw[0] && ok(tokens[0], nw[0]) ? 1 : 0); };
    return prepared.filter(({ w }) => tokens.every((t) => w.some((x) => ok(t, x)))).map(({ m }) => m)
      .map((m, i) => ({ m, i, s: score(m) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.m);
  }, [prepared, q]);
  const sel = picked.map((id) => marks.find((m) => m.id === id)!).filter(Boolean);
  const r = reading(sel);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const shownGroups = group ? groups.filter((g) => g.key === group) : groups;

  return (
    <div class="sx">
      <div class="sx__bar" role="search">
        <label class="px__q">
          <span class="visually-hidden">What a mark says or shows</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="What a mark says or shows: 925, STERLING, 1847 Rogers, lion, Minerva, 84, EPNS" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
          {q && <button type="button" class="px__clear" aria-label="Clear the search" onClick={() => setQ('')}>×</button>}
        </label>
        <div class="px__makers" role="group" aria-label="Where the marks come from">
          <button type="button" aria-pressed={!group} onClick={() => setGroup('')}>Everywhere</button>
          {groups.map((g) => <button type="button" aria-pressed={group === g.key} onClick={() => setGroup(group === g.key ? '' : g.key)}>{g.label} <span class="num">{g.count}</span></button>)}
        </div>
      </div>

      <section class={`sread${sel.length ? ' has-marks' : ''}`} aria-live="polite" aria-label="Your marks, read together">
        {!sel.length ? (
          <p class="sread__empty"><strong>Tap each mark you find on the item.</strong> Read together, they say what the metal is, who made it and when.</p>
        ) : (
          <>
            <ul class="sread__chips">
              {sel.map((m) => (
                <li><button type="button" class="schip" onClick={() => toggle(m.id)} aria-label={`Remove ${m.name}`}>
                  {m.img && <img src={`/${m.img.file}`} alt="" />}<span>{m.name}</span><span aria-hidden="true">×</span>
                </button></li>
              ))}
              <li><button type="button" class="link" onClick={() => setPicked([])}>Start again</button></li>
            </ul>
            <dl class="sread__lines">
              {r.metal && <div class={`sread__line is-${r.metal.tone}`}><dt>Metal</dt><dd>{r.metal.text}</dd></div>}
              {r.makers.length > 0 && <div class="sread__line"><dt>Maker</dt><dd>{r.makers.join('; ')}</dd></div>}
              {r.when?.text && <div class={`sread__line is-${r.when.tone}`}><dt>When</dt><dd>{r.when.text}</dd></div>}
              {r.sheets.length > 0 && <div class="sread__line"><dt>Date letter</dt><dd>{r.sheets.map((s, i) => <>{i > 0 && ' · '}<a href={s}>Find the letter on the {s.replace(/^\/marks\//, '').replace(/-date-letters$/, '').replace(/^./, (c) => c.toUpperCase())} sheet</a></>)}</dd></div>}
            </dl>
          </>
        )}
      </section>

      {hits ? (
        <section class="sx__group" aria-label="Marks that match">
          <h2 class="px__groupname">{hits.length === 0 ? 'Nothing matches. Try fewer words.' : `${hits.length} ${hits.length === 1 ? 'mark matches' : 'marks match'}`}</h2>
          <ol class="sx__grid">{hits.filter((m) => !group || m.group === group).map((m) => <li><Card m={m} on={picked.includes(m.id)} onToggle={toggle} onOpen={setOpen} groups={groups} /></li>)}</ol>
        </section>
      ) : shownGroups.map((g) => {
        const list = marks.filter((m) => m.group === g.key && !m.year);
        const yrs = marks.filter((m) => m.group === g.key && m.year);
        return (
          <section class="sx__group" aria-label={g.label}>
            <h2 class="px__groupname">{g.label} {g.page && <a class="sx__page" href={g.page}>The full page</a>}</h2>
            <ol class="sx__grid">{list.map((m) => <li><Card m={m} on={picked.includes(m.id)} onToggle={toggle} onOpen={setOpen} groups={groups} /></li>)}</ol>
            {yrs.length > 0 && (
              <details class="sx__years" open={yearsOpen || group === g.key} onToggle={(e) => setYearsOpen((e.target as HTMLDetailsElement).open)}>
                <summary>{g.label === 'Gorham' ? 'Gorham’s year marks' : 'Year marks'} <span class="num muted">{yrs.length}, {Math.min(...yrs.map((m) => m.from ?? NOW))}–{Math.max(...yrs.map((m) => m.to ?? m.from ?? NOW))}</span></summary>
                <ol class="cx__grid">
                  {yrs.map((m) => (
                    <li><button type="button" class={`ctile${picked.includes(m.id) ? ' is-lit' : ''}`} aria-pressed={picked.includes(m.id)} onClick={() => toggle(m.id)} title={m.name}>
                      <span class="plate plate--print ctile__img">{m.img ? <img src={`/${m.img.file}`} alt={m.looks || m.name} loading="lazy" decoding="async" /> : null}</span>
                      <span class="ctile__cap num">{years(m)}</span>
                    </button></li>
                  ))}
                </ol>
              </details>
            )}
          </section>
        );
      })}

      <SilverPanel marks={marks} id={open} picked={picked} onToggle={toggle} onOpen={setOpen} onClose={() => setOpen('')} groups={groups} />
    </div>
  );
}

function Card({ m, on, onToggle, onOpen, groups }: { m: SMark; on: boolean; onToggle: (id: string) => void; onOpen: (id: string) => void; groups: SGroup[] }) {
  return (
    <div class={`scard${on ? ' is-on' : ''}`}>
      <button type="button" class="scard__pick" aria-pressed={on} onClick={() => onToggle(m.id)}>
        <span class="plate plate--print scard__img">{m.img ? <img src={`/${m.img.file}`} alt={m.looks || m.name} loading="lazy" decoding="async" /> : <span class="pcard__none">No image yet</span>}{on && <span class="scard__tick" aria-hidden="true">✓</span>}</span>
        <span class="scard__name">{m.name}</span>
        <span class="scard__meta">
          {m.metal && <span class={`metal metal--${m.metal}`}>{METAL[m.metal]}</span>}
          {years(m) && <span class="num">{years(m)}</span>}
          {m.year && <span>{groups.find((g) => g.key === m.group)?.label}</span>}
        </span>
      </button>
      <button type="button" class="scard__about" onClick={() => onOpen(m.id)}>About this mark</button>
    </div>
  );
}

function SilverPanel({ marks, id, picked, onToggle, onOpen, onClose, groups }: {
  marks: SMark[]; id: string; picked: string[]; onToggle: (id: string) => void; onOpen: (id: string) => void; onClose: () => void; groups: SGroup[];
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const m = marks.find((x) => x.id === id) ?? null;
  const same = m ? marks.filter((x) => x.group === m.group && x.year === m.year) : [];
  const i = m ? same.findIndex((x) => x.id === m.id) : -1;
  const prev = i > 0 ? same[i - 1] : null;
  const next = i >= 0 && i < same.length - 1 ? same[i + 1] : null;
  const g = m ? groups.find((x) => x.key === m.group) : null;
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (m && !d.open) d.showModal();
    if (!m && d.open) d.close();
    d.querySelector('.rpanel__in')?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!m) return;
      if (e.key === 'ArrowLeft' && prev) onOpen(prev.id);
      if (e.key === 'ArrowRight' && next) onOpen(next.id);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [id]);
  const on = m ? picked.includes(m.id) : false;
  return (
    <dialog ref={dlg} class="panel rpanel" aria-label={m ? m.name : 'Mark'} onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose(); }}>
      {m && (
        <div class="rpanel__in">
          <div class="rpanel__nav">
            <button type="button" class="btn" disabled={!prev} onClick={() => prev && onOpen(prev.id)}>← Previous</button>
            <button type="button" class="btn" disabled={!next} onClick={() => next && onOpen(next.id)}>Next →</button>
            <button type="button" class="panel__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p class="panel__kind">{m.kind} · {g?.label}</p>
          <h2 class="panel__name">{m.name}</h2>
          {(years(m) || m.metal) && <p class="panel__years num">{m.metal && <span class={`metal metal--${m.metal}`}>{METAL[m.metal]}</span>} {years(m)}{m.note && <span class="muted"> · {m.note}</span>}</p>}
          <p><button type="button" class={`btn${on ? '' : ' btn--primary'}`} onClick={() => onToggle(m.id)}>{on ? 'Remove from my marks' : 'I see this mark'}</button></p>
          {m.img ? (
            <figure class="panel__fig">
              <div class="plate plate--print panel__plate"><img src={`/${m.img.file}`} alt={m.looks || m.name} /></div>
              <figcaption>{STATUS[m.img.status] ?? ''}{m.img.credit ? `. ${m.img.credit}` : ''}{m.img.url && <> <a href={m.img.url} rel="noopener">Source</a></>}</figcaption>
            </figure>
          ) : <p class="muted">No image of this mark yet.</p>}
          <dl class="rfacts">
            {m.looks && <div><dt>Looks like</dt><dd>{m.looks}</dd></div>}
            {m.means && <div><dt>What it means</dt><dd>{m.means}</dd></div>}
            {m.applied && <div><dt>How it is put on</dt><dd>{m.applied}</dd></div>}
            {m.maker && <div><dt>Maker</dt><dd>{m.maker}</dd></div>}
          </dl>
          {m.disagree.length > 0 && (
            <section class="pmark__disagree">
              <h3>Where the sources disagree</h3>
              <ul>{m.disagree.map((d) => <li>{d.who && <strong>{d.who}: </strong>}{d.says}</li>)}</ul>
            </section>
          )}
          {m.single && <p class="panel__warn">Part of this record rests on one source only.</p>}
          {m.sources.length > 0 && (
            <details class="rsources" open>
              <summary>Sources <span class="muted num">{m.sources.length}</span></summary>
              <ol>{m.sources.map((x) => <li>{x.url ? <a href={x.url} rel="nofollow noopener">{x.citation}</a> : x.citation}{x.where ? `, ${x.where}` : ''}</li>)}</ol>
            </details>
          )}
          <p class="panel__actions">
            {m.sheet && <a class="btn" href={m.sheet}>Its date-letter sheet</a>}
            {g?.page && <a class="btn" href={g.page}>The full page</a>}
            <button type="button" class="btn" onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}?open=${m.id}`)}>Copy link</button>
          </p>
        </div>
      )}
    </dialog>
  );
}
