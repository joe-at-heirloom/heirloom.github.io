/** @jsxImportSource preact */
// The Japanese date reader: type or paste the date as written (明治十五年,
// 天保十三壬寅, 紀元二千六百年, 昭和30年, 大日本明治年製, or a cyclical year
// alone, 壬寅) and it gives the Western year, how it was worked out, and
// whether a cyclical year written beside it agrees. An era with no number is an
// era mark and names only the era. A cyclical year alone is one year in sixty:
// the reader lists them all and lights the ones in the period chosen.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { readJapaneseDates, readEraMarks, toShinjitai, LUNAR_UNTIL, type JapaneseEra } from '../lib/japanese-dates';
import { ganjiIndex, ganjiOfYear, yearsOfGanji, STEMS, BRANCHES } from '../lib/cjk-dates';

export type ReaderEra = JapaneseEra & { romaji: string; anchor: string };
export type Period = { id: string; name: string; from: number; to: number };
type Props = { eras: ReaderEra[]; periods: Period[]; examples: string[]; cycleNames: Record<string, { kana: string; romaji: string }> };

const GZ = new RegExp(`[${STEMS}][${BRANCHES}]`, 'g');

export default function JapaneseDateReader({ eras, periods, examples, cycleNames }: Props) {
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

  const dates = useMemo(() => readJapaneseDates(q, eras), [q]);
  const marks = useMemo(() => readEraMarks(q, eras), [q]);
  const eraOf = (id: string) => eras.find((e) => e.id === id);
  const loose = useMemo(() => {
    const all = [...new Set(toShinjitai(q.normalize('NFC')).match(GZ) ?? [])].filter((g) => ganjiIndex(g) !== null);
    const used = new Set(dates.map((r) => r.ganji?.chars).filter(Boolean) as string[]);
    return all.filter((g) => !used.has(g));
  }, [q, dates]);
  const pe = periods.find((p) => p.id === period) ?? null;

  return (
    <div class="dr">
      <div class="rx__bar dr__bar" role="search">
        <label class="rx__q dr__q">
          <span class="visually-hidden">The date as it is written</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type the date as written: 明治十五年, 天保十三壬寅, 紀元二千六百年, 壬寅" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <p class="dr__eg">Try {examples.map((x) => <button type="button" onClick={() => setQ(x)} lang="ja" class="ja">{x}</button>)}</p>
      </div>

      <div class="dr__out" aria-live="polite">
        {!q.trim() && <p class="muted">The reader knows every Japanese era name from 645 to today (both courts of 1331–1392), the imperial year count, and the sixty-year cycle. Old character forms (慶應, 寶暦) read like the new ones.</p>}
        {q.trim() && !dates.length && !marks.length && !loose.length && <p>No date found in this. Type the characters as written, for example 文久二年 or 昭和十六年.</p>}
        {dates.map((r) => {
          const e = eraOf(r.system);
          const y = r.years[0];
          return (
            <div class={`dr__card${r.exact ? ' is-exact' : ''}`}>
              <p class="panel__kind">{e ? <>The <a href={`#era-${e.anchor}`}>{e.romaji} era</a>{e.court && e.court !== 'both' ? `, ${e.court} court` : ''}</> : 'The imperial count (皇紀)'}{r.years.length > 1 ? ' · two readings' : r.ganji && !r.ganji.agrees ? ' · the cyclical year does not agree' : ''}</p>
              <p class="dr__year num">{r.years.join(' or ')}<small lang="ja" class="ja">{r.text}</small></p>
              <p class="dr__how">Worked out as {r.how}.{r.exact && <> The cyclical year {y} is <span class="han ja" lang="ja">{ganjiOfYear(y)}</span>.</>}</p>
              {r.ganji && (r.ganji.agrees
                ? <p class="dr__how">The cyclical year written with it, <span class="han ja" lang="ja">{r.ganji.chars}</span>, agrees.</p>
                : <p class="panel__warn">The cyclical year written with it, <span class="han ja" lang="ja">{r.ganji.chars}</span>, does not agree with {r.years.join(' or ')}. One of the two is misread or miswritten; {r.ganji.chars} falls in {yearsOfGanji(ganjiIndex(r.ganji.chars)!, y - 30, y + 30).join(' or ')} nearby.</p>)}
              {y <= LUNAR_UNTIL && (r.late_month
                ? <p class="dr__how">The date is in the 11th or 12th month of the old lunar calendar, so it most likely fell in January or February of {y + 1}.</p>
                : <p class="dr__how faint">Before 1873 Japan used a lunar calendar: the year began in late January or February.</p>)}
              <p class="dr__how faint">A date is when the writing says it was made, not proof of when the item was.</p>
            </div>
          );
        })}
        {marks.map((m) => (
          <div class="dr__card">
            <p class="panel__kind">An era mark</p>
            <p class="dr__year num">{m.era.start ?? m.era.year1}–{m.era.end ?? 'today'}<small lang="ja" class="ja">{m.text}</small></p>
            <p class="dr__how">“Made in the {(m.era as ReaderEra).romaji} era.” It gives no year, only the era it claims. Era marks were also put on later wares, so the mark alone does not date the item.</p>
          </div>
        ))}
        {loose.map((g) => {
          const i = ganjiIndex(g)!;
          const ys = yearsOfGanji(i, 1600, 2043);
          const n = cycleNames[g];
          return (
            <div class="dr__card">
              <p class="panel__kind">Cyclical year alone</p>
              <p class="dr__year"><span class="han ja" lang="ja">{g}</span><small>{n ? `${n.romaji}, ${n.kana}` : ''} · year {i + 1} of 60</small></p>
              <p class="dr__how">On its own a cyclical year comes round every sixty years. Which one is meant has to come from the item: an era written beside it, the maker, the style.</p>
              <div class="rx__dyn jx__groups" role="group" aria-label="Period">
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
