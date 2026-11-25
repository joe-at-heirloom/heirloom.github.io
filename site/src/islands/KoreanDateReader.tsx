/** @jsxImportSource preact */
// The Korean date reader: type or paste the date as written (崇禎紀元後三甲子,
// 光武五年辛丑, 檀紀4281年, or a cyclical year alone, 庚午) and it gives the
// Western year, how it was worked out, and whether the cyclical year written
// beside it agrees. A cyclical year alone is one year in sixty: the reader
// lists them all and lights the ones in the period chosen.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { ganjiIndex, ganjiOfYear, readKoreanDates, yearsOfGanji, STEMS, BRANCHES, type CountRow, type EraRow } from '../lib/korean-dates';

export type ReaderEra = EraRow & { label: string; kind: string };
export type ReaderCount = CountRow & { label: string; explain: string };
export type Period = { id: string; name: string; from: number; to: number };
type Props = { eras: ReaderEra[]; counts: ReaderCount[]; periods: Period[]; examples: string[]; ganjiNames: Record<string, { hangul: string; rr: string }> };

const GZ = new RegExp(`[${STEMS}][${BRANCHES}]`, 'g');

export default function KoreanDateReader({ eras, counts, periods, examples, ganjiNames }: Props) {
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const d = p.get('date');
    if (d) setQ(d);
    const pe = p.get('period');
    if (pe) setPeriod(pe);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    q.trim() ? p.set('date', q.trim()) : p.delete('date');
    period ? p.set('period', period) : p.delete('period');
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [q, period]);

  const exact = useMemo(() => readKoreanDates(q, eras, counts), [q]);
  const label = (system: string) => { const l = eras.find((e) => e.id === system)?.label ?? counts.find((c) => c.id === system)?.label ?? system; return l.charAt(0).toUpperCase() + l.slice(1); };
  const explain = (system: string) => counts.find((c) => c.id === system)?.explain ?? '';
  // Cyclical years written without an era: every one is a candidate.
  const loose = useMemo(() => {
    const all = [...new Set(q.normalize('NFC').match(GZ) ?? [])].filter((g) => ganjiIndex(g) !== null);
    const used = new Set(exact.map((r) => r.ganji?.chars).filter(Boolean) as string[]);
    for (const r of exact) for (const g of r.text.match(GZ) ?? []) used.add(g);
    return all.filter((g) => !used.has(g));
  }, [q, exact]);
  const pe = periods.find((p) => p.id === period) ?? null;

  return (
    <div class="dr">
      <div class="rx__bar dr__bar" role="search">
        <label class="rx__q dr__q">
          <span class="visually-hidden">The date as it is written</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type the date as written: 崇禎紀元後三甲子, 光武五年, 檀紀4281, 庚午" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <p class="dr__eg">Try {examples.map((x) => <button type="button" onClick={() => setQ(x)} lang="ko">{x}</button>)}</p>
      </div>

      <div class="dr__out" aria-live="polite">
        {!q.trim() && <p class="muted">The reader knows Korea’s own era names, the Chongzhen count Joseon writers kept long after the Ming fell, Dangi years, and the Chinese and Japanese era names used in Korea. Lunar dates are read as their lunar year.</p>}
        {q.trim() && !exact.length && !loose.length && <p>No date found in this. Type the characters as written, for example 崇禎紀元後再丁卯 or 乾隆十年.</p>}
        {exact.map((r) => (
          <div class={`dr__card${r.exact ? ' is-exact' : ''}`}>
            <p class="panel__kind">{label(r.system)}{!r.exact && (r.confidence === 'low' ? ' · the year is not settled' : ' · two readings')}</p>
            {r.exact
              ? <p class="dr__year num">{r.years[0]}<small lang="ko">{r.text}</small></p>
              : r.years.length <= 3
                ? <p class="dr__year num">{r.years.join(' or ')}<small lang="ko">{r.text}</small></p>
                : <><p class="dr__year"><span lang="ko">{r.text}</span></p><div class="dr__cands num">{r.years.map((y) => <span class={pe && y >= pe.from && y <= pe.to ? 'is-likely' : ''}>{y}</span>)}</div></>}
            <p class="dr__how">Worked out as {r.how}.{r.exact && <> The cyclical year {r.years[0]} is <span class="han" lang="ko">{ganjiOfYear(r.years[0])}</span>.</>}</p>
            {explain(r.system) && <p class="dr__how muted">{explain(r.system)}</p>}
            {r.ganji && (r.ganji.agrees
              ? <p class="dr__how">The cyclical year written with it, <span class="han" lang="ko">{r.ganji.chars}</span>, agrees.</p>
              : <p class="panel__warn">The cyclical year written with it, <span class="han" lang="ko">{r.ganji.chars}</span>, does not agree with {r.years.join(' or ')}. One of the two is misread or miswritten; {r.ganji.chars} falls in {yearsOfGanji(ganjiIndex(r.ganji.chars)!, r.years[0] - 30, r.years[0] + 30).join(' or ')} nearby.</p>)}
            {r.late_month && <p class="dr__how">The date is in the 11th or 12th lunar month, so it most likely fell in January or February of the next Western year.</p>}
            <p class="dr__how faint">Before 1896 Korean dates are lunar. A date is when the writing says it was made, not proof of when the item was.</p>
          </div>
        ))}
        {loose.map((g) => {
          const i = ganjiIndex(g)!;
          const ys = yearsOfGanji(i, 904, 2043);
          const n = ganjiNames[g];
          return (
            <div class="dr__card">
              <p class="panel__kind">Cyclical year alone</p>
              <p class="dr__year"><span class="han" lang="ko">{g}</span><small>{n ? `${n.rr}, ${n.hangul}` : ''} · year {i + 1} of 60</small></p>
              <p class="dr__how">On its own a cyclical year comes round every sixty years. Which one is meant has to come from the item: its ware and style, the kiln it is known from, or an era written beside it.</p>
              <div class="rx__dyn kx__groups" role="group" aria-label="Period">
                <button type="button" aria-pressed={period === ''} onClick={() => setPeriod('')}>All</button>
                {periods.map((p) => <button type="button" aria-pressed={period === p.id} onClick={() => setPeriod(period === p.id ? '' : p.id)}>{p.name}</button>)}
              </div>
              <div class="dr__cands num">{ys.map((y) => <span class={pe && y >= pe.from && y <= pe.to ? 'is-likely' : ''}>{y}</span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
