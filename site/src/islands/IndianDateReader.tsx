/** @jsxImportSource preact */
// The Indian date reader: type or paste the date as written (सं० १९५५,
// سنه ۱۲۵۰ ھ, સંવત ૧૯૨૦, Samvat 1955), tap it in from the digits and era words of
// its script, or pick the era and type the year in Western digits. It gives
// the Western year or years, and how they were worked out. A number with no
// era word is not read: the reader says so rather than guess.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { readIndianDates, type IndianEra, type IndianRuler } from '../lib/indian-dates';

export type ReaderEra = IndianEra & { note?: string | null };
export type Keypad = { script: string; lang: string; rtl?: boolean; digits: string[]; words: string[] };
type Props = { eras: ReaderEra[]; rulers: IndianRuler[]; keypads: Keypad[]; examples: string[] };

const isRtl = (s: string) => /[؀-ۿ]/.test(s);

export default function IndianDateReader({ eras, rulers, keypads, examples }: Props) {
  const [q, setQ] = useState('');
  const [pad, setPad] = useState(keypads[0]?.script ?? '');
  const [era, setEra] = useState(eras[0]?.id ?? '');
  const [year, setYear] = useState('');
  const [ruler, setRuler] = useState(rulers[0]?.id ?? '');
  useEffect(() => {
    const d = new URLSearchParams(location.search).get('date');
    if (d) setQ(d);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    q.trim() ? p.set('date', q.trim()) : p.delete('date');
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [q]);

  const found = useMemo(() => readIndianDates(q, eras, rulers), [q]);
  const label = (system: string) => system.split('|').map((id) => eras.find((e) => e.id === id)?.label ?? id).join(' or ');
  const note = (system: string) => (system.includes('|') ? '' : eras.find((e) => e.id === system)?.note ?? '');
  const hasNumber = /[0-9٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௲౦-౯೦-೯൦-൲෦-෯၀-၉]/.test(q);
  const kp = keypads.find((k) => k.script === pad);
  const chosen = eras.find((e) => e.id === era);

  // The era picked and the year typed, written the way the reader reads it.
  const byHand = () => {
    if (!chosen || !/^\d{1,4}$/.test(year.trim())) return;
    const n = year.trim();
    if (chosen.rule === 'regnal') {
      const r = rulers.find((x) => x.id === ruler);
      if (r) setQ(`${r.names[0]} ${chosen.words[0] ?? chosen.after_words?.[0] ?? ''} ${n}`);
      return;
    }
    setQ(chosen.words.length ? `${chosen.words[0]} ${n}` : `${n} ${chosen.after_words?.[0] ?? ''}`);
  };

  return (
    <div class="dr">
      <div class="rx__bar dr__bar" role="search">
        <label class="rx__q dr__q">
          <span class="visually-hidden">The date as it is written</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} dir="auto" placeholder="Type the date as written: सं० १९५५, ۱۲۵۰ ھ, Samvat 1955" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <p class="dr__eg">Try {examples.map((x) => <button type="button" onClick={() => setQ(x)} dir="auto">{x}</button>)}</p>
      </div>

      <details class="dr__pad">
        <summary>Tap it in from the digits you see</summary>
        <div class="rx__dyn" role="group" aria-label="Script">
          {keypads.map((k) => <button type="button" aria-pressed={pad === k.script} onClick={() => setPad(k.script)}>{k.script}</button>)}
        </div>
        {kp && (
          <div class="dr__keys" dir={kp.rtl ? 'rtl' : 'ltr'}>
            <div class="dr__row" aria-label={`${kp.script} digits`}>
              {kp.digits.map((d, i) => <button type="button" class={kp.rtl ? 'nastaliq' : 'indic'} lang={kp.lang} onClick={() => setQ(q + d)} title={`${i}`}>{d}<small>{i}</small></button>)}
            </div>
            {kp.words.length > 0 && (
              <div class="dr__row" aria-label="Era words">
                {kp.words.map((w) => <button type="button" class={isRtl(w) ? 'nastaliq' : 'indic'} lang={kp.lang} onClick={() => setQ(`${q}${q && !q.endsWith(' ') ? ' ' : ''}${w} `)}>{w}</button>)}
              </div>
            )}
            <div class="dr__row">
              <button type="button" onClick={() => setQ(q + ' ')}>space</button>
              <button type="button" onClick={() => setQ([...q].slice(0, -1).join(''))}>⌫</button>
              <button type="button" onClick={() => setQ('')}>clear</button>
            </div>
          </div>
        )}
      </details>

      <details class="dr__pad">
        <summary>Or pick the era and type the year in Western digits</summary>
        <div class="dr__hand">
          <label>Era <select value={era} onChange={(e) => setEra((e.target as HTMLSelectElement).value)}>{eras.map((e) => <option value={e.id}>{e.label}</option>)}</select></label>
          {chosen?.rule === 'regnal' && (
            <label>Ruler <select value={ruler} onChange={(e) => setRuler((e.target as HTMLSelectElement).value)}>{rulers.map((r) => <option value={r.id}>{r.name}</option>)}</select></label>
          )}
          <label>Year <input class="num" inputMode="numeric" pattern="[0-9]*" size={6} value={year} onInput={(e) => setYear((e.target as HTMLInputElement).value)} onKeyDown={(e) => e.key === 'Enter' && byHand()} /></label>
          <button type="button" onClick={byHand}>Read it</button>
        </div>
      </details>

      <div class="dr__out" aria-live="polite">
        {!q.trim() && <p class="muted">The reader knows the Vikram Samvat and Shaka eras, the Hijri year, the Bengali, Faslī and Kollam eras, the Burmese and Buddhist eras, the Western year written the Indian way, and the regnal years of the Mughal emperors, in the digits of every Indian script.</p>}
        {q.trim() && !found.length && (hasNumber
          ? <p>A number, but no word beside it that names an era. A year alone is not read: it could be a Samvat, a Hijri or a Western year, or not a year at all. Look for a word before or after it (संवत्, सन्, शके, ھ) and type that too.</p>
          : <p>No date found in this. Type the digits and the word beside them as written, for example सं० १९५५ or ۱۲۵۰ ھ.</p>)}
        {found.map((r) => (
          <div class={`dr__card${r.exact ? ' is-exact' : ''}`}>
            <p class="panel__kind">{label(r.system)}{r.ruler ? `, ${r.ruler}` : ''}{!r.exact && (r.confidence === 'low' ? ' · the era is not settled' : ' · two Western years')}</p>
            {r.years.length <= 2
              ? <p class="dr__year num">{r.years.join(' or ')}<small dir="auto">{r.text}</small></p>
              : <><p class="dr__year"><span dir="auto">{r.text}</span></p><div class="dr__cands num">{r.years.map((y) => <span>{y}</span>)}</div></>}
            <p class="dr__how">The number is {r.number.toLocaleString('en-US', { useGrouping: false })}, written in {r.numerals} digits. Worked out as {r.how}.</p>
            {note(r.system) && <p class="dr__how muted">{note(r.system)}</p>}
            <p class="dr__how faint">A date is when the writing says it was made, not proof of when the item was.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
