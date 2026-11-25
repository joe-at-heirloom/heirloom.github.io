/** @jsxImportSource preact */
// The woven-date reader: type or tap in the number as it is woven (۱۳۲۴,
// ١٣٠٥, 1885, ՌՊՁԵ), and it gives every calendar the number can be a year of,
// with the arithmetic: the lunar Hijri year, Iran's solar year (from 1925),
// the Ottoman Rumi year on a Turkish rug, the Western year, the Armenian
// church era. It reads the number back to front when asked (a date woven
// mirrored, or read from the back). The rules are lib/rug-dates.ts, the same
// as the Advisor's.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { readRugDates, yearsOf, type RugCalendar } from '../lib/rug-dates';
import { digitOf } from '../lib/indian-dates';

export type ReaderCalendar = { id: string; label: string; note: string | null; tells: string | null };
export type Pad = { name: string; lang: string; rtl?: boolean; keys: string[]; hint?: string };
type Props = { calendars: ReaderCalendar[]; pads: Pad[]; examples: string[] };

const CAL_ID: Record<RugCalendar, string> = { ah: 'ah', sh: 'sh', rumi: 'rumi', ad: 'gregorian', 'armenian-ad': 'armenian-letters-ad', 'armenian-era': 'armenian-era', imperial: 'imperial-iranian' };
const FALLBACK: Record<RugCalendar, string> = {
  ah: 'Lunar Hijri year (A.H.)', sh: 'Iranian solar year (S.H.)', rumi: 'Ottoman fiscal year (Rumi)',
  ad: 'Western year', 'armenian-ad': 'Western year in Armenian letters', 'armenian-era': 'Armenian church era', imperial: 'Iranian imperial year (1976–78)',
};
const western = (s: string) => [...s].map((c) => { const d = digitOf(c); return d ? String(d.value) : c; }).join('');
const isRtl = (s: string) => /[؀-ۿ]/.test(s);

export default function RugDateReader({ calendars, pads, examples }: Props) {
  const [q, setQ] = useState('');
  const [pad, setPad] = useState(pads[0]?.name ?? '');
  const [turkish, setTurkish] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const d = p.get('date');
    if (d) setQ(d);
    if (p.get('turkish') === '1') setTurkish(true);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    q.trim() ? p.set('date', q.trim()) : p.delete('date');
    turkish ? p.set('turkish', '1') : p.delete('turkish');
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [q, turkish]);

  const found = useMemo(() => readRugDates(q, { bare: true, turkish }), [q, turkish]);
  const cal = (c: RugCalendar) => calendars.find((x) => x.id === CAL_ID[c]);
  const kp = pads.find((p) => p.name === pad);
  const typed = q.trim();
  const hasNumber = /[0-9٠-٩۰-۹Ա-Քա-ք]/.test(typed);
  const mirror = () => setQ([...typed].reverse().join(''));

  return (
    <div class="dr rdr">
      <div class="rx__bar dr__bar" role="search">
        <label class="rx__q dr__q">
          <span class="visually-hidden">The number as it is woven</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} dir="auto" placeholder="Type or tap the number as woven: ۱۳۲۴, ١٣٠٥, 1885, ՌՊՁԵ" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <p class="dr__eg">Try {examples.map((x) => <button type="button" onClick={() => setQ(x)} dir="auto">{x}</button>)}</p>
      </div>

      <div class="rdr__pads">
        <div class="px__makers" role="group" aria-label="Digits">
          {pads.map((p) => <button type="button" aria-pressed={pad === p.name} onClick={() => setPad(p.name)}>{p.name}</button>)}
        </div>
        {kp && (
          <>
            <div class="rdr__keys" role="group" aria-label={`${kp.name} keys`} dir="ltr">
              {kp.keys.map((k) => <button type="button" lang={kp.lang} onClick={() => setQ(q + k)} title={western(k)}>{k}<small>{/[Ա-Ք]/.test(k) ? '' : western(k)}</small></button>)}
              <button type="button" class="rdr__del" onClick={() => setQ([...q].slice(0, -1).join(''))} aria-label="Delete the last character">⌫</button>
            </div>
            {kp.hint && <p class="faint rdr__hint">{kp.hint}</p>}
          </>
        )}
        <label class="rdr__opt"><input type="checkbox" checked={turkish} onChange={(e) => setTurkish((e.target as HTMLInputElement).checked)} /> The rug is Turkish (Anatolian): also read it as an Ottoman Rumi year</label>
      </div>

      <section class="dr__out" aria-live="polite">
        {!typed ? (
          <p class="muted">The years appear here. Persian and Arabic digits are written left to right, like ours, even inside right-to-left writing.</p>
        ) : !hasNumber ? (
          <p>No number yet. Type the digits, or tap them in above.</p>
        ) : !found.length ? (
          <div>
            <p><strong>That number is not a year of any calendar used on rugs.</strong> Check the digits against the table below (Persian ۲ and ۳, ۴ and ۶, ۷ and ۸ are easy to mix up), or read it the other way round.</p>
            {[...typed].length >= 3 && <p><button type="button" class="btn btn--quiet" onClick={mirror}>Read it back to front</button></p>}
          </div>
        ) : found.map((d) => (
          <div class="rdr__res">
            <p class="rdr__num">
              <span dir="ltr" class={isRtl(d.text) ? 'nastaliq' : ''} lang={d.numerals === 'Armenian' ? 'hy' : d.numerals === 'Western' ? undefined : 'fa'}>{d.text}</span>
              <span class="muted"> {d.numerals === 'Armenian' ? 'Armenian letters' : `${d.numerals} digits`}, read as <strong class="num">{d.value}</strong>{d.reversed ? ' (back to front)' : ''}{d.shortened ? ' (a figure left off)' : ''}</span>
            </p>
            <ul class="rdr__cals">
              {d.readings.map((x) => {
                const c = cal(x.calendar);
                return (
                  <li id={`r-${CAL_ID[x.calendar]}`}>
                    <strong>{c?.label ?? FALLBACK[x.calendar]}: <span class="num">{x.years.join(' or ')}</span></strong>
                    <br /><span class="muted">{x.how}.</span>
                    {c?.note && <><br /><span class="faint">{c.note}</span></>}
                  </li>
                );
              })}
            </ul>
            {d.readings.length > 1 && (
              <p class="rdr__which"><strong>Which one?</strong> The number alone cannot say; the rug’s origin, design and materials can. {[...new Set(d.readings.map((x) => cal(x.calendar)?.tells).filter(Boolean))].join(' ')}</p>
            )}
            <p class="faint">All the years it could be: {yearsOf(d).join(', ')}. A woven date is the year the weaver wove in. Weavers copied dates from the rugs they worked from, so a date does not by itself date the rug.</p>
          </div>
        ))}
      </section>
    </div>
  );
}
