/** @jsxImportSource preact */
// The Chinese date reader: type or paste a date as written (乾隆十年,
// 康熙辛亥, 嘉靖丙午, 民國二十年, or a cyclical year alone, 甲午) and it
// gives the Western year, how it was worked out, and whether a cyclical year
// written with it agrees. An era with a cyclical year and no number
// (乾隆丙申, common in inscriptions) is read as the year of the era that has
// that cyclical year. A cyclical year alone comes round every sixty years:
// the reader lists them and lights the ones in a period picked.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { ganjiIndex, ganjiOfYear, yearsOfGanji, readEraDates, normalizeDateText, fold, STEMS, BRANCHES, type EraRow } from '../lib/cjk-dates';

export type ReaderEra = EraRow & { label: string };
export type Period = { id: string; name: string; from: number; to: number };
type Props = { eras: ReaderEra[]; periods: Period[]; examples: string[]; ganjiNames: Record<string, string> };

const GZ = new RegExp(`[${STEMS}][${BRANCHES}]`, 'g');
type Read = { text: string; label: string; years: number[]; exact: boolean; how: string; ganji: { chars: string; agrees: boolean } | null };

export default function ChineseDateReader({ eras, periods, examples, ganjiNames }: Props) {
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState('');
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const d = p.get('date');
    if (d) setQ(d);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    q.trim() ? p.set('date', q.trim()) : p.delete('date');
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [q]);

  const reads = useMemo((): Read[] => {
    const t = normalizeDateText(q);
    if (!t) return [];
    const label = (id: string) => eras.find((e) => e.id === id)?.label ?? id;
    const out: Read[] = readEraDates(t, eras).map((r) => ({ text: r.text, label: label(r.system), years: r.years, exact: r.exact, how: r.how, ganji: r.ganji }));
    // An era with a cyclical year and no number: 乾隆丙申.
    for (const e of eras) {
      if (e.end == null) continue;
      for (const word of new Set([e.chars, ...(e.variants ?? [])].map(fold))) {
        const re = new RegExp(`${word}(?:年|歲次|歲在)?([${STEMS}][${BRANCHES}])`, 'g');
        for (let m = re.exec(t); m; m = re.exec(t)) {
          const ys: number[] = [];
          for (let y = e.year1; y <= e.end; y++) if (ganjiOfYear(y) === m[1]) ys.push(y);
          if (!ys.length) continue;
          out.push({ text: m[0], label: e.label, years: ys, exact: ys.length === 1, how: `the year of ${e.chars} (${e.year1}–${e.end}) that is ${m[1]}`, ganji: null });
        }
      }
    }
    return out;
  }, [q]);

  const loose = useMemo(() => {
    const all = [...new Set(q.normalize('NFC').match(GZ) ?? [])].filter((g) => ganjiIndex(g) !== null);
    const used = new Set<string>();
    for (const r of reads) for (const g of r.text.match(GZ) ?? []) used.add(g);
    for (const r of reads) if (r.ganji) used.add(r.ganji.chars);
    return all.filter((g) => !used.has(g));
  }, [q, reads]);
  const pe = periods.find((p) => p.id === period) ?? null;

  return (
    <div class="dr">
      <div class="rx__bar dr__bar" role="search">
        <label class="rx__q dr__q">
          <span class="visually-hidden">The date as it is written</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" autoComplete="off" spellcheck={false} placeholder="Type the date as written: 乾隆十年, 康熙辛亥, 民國二十年, 甲午" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        </label>
        <p class="dr__eg">Try {examples.map((x) => <button type="button" onClick={() => setQ(x)} lang="zh-Hant">{x}</button>)}</p>
      </div>

      <div class="dr__out" aria-live="polite">
        {!q.trim() && <p class="muted">The reader knows the era names of the Song, Liao, Jin and Yuan, the reigns of the Ming and Qing, the Republic’s count from 1912, and the sixty-year cycle. Dates are lunar: a date late in the year may fall early in the next Western year.</p>}
        {q.trim() && !reads.length && !loose.length && <p>No date found in this. Type the characters as written, for example 乾隆十年 or 康熙辛亥.</p>}
        {reads.map((r) => (
          <div class={`dr__card${r.exact ? ' is-exact' : ''}`}>
            <p class="panel__kind">{r.label}{!r.exact && ' · more than one year fits'}</p>
            {r.years.length <= 3
              ? <p class="dr__year num">{r.years.join(' or ')}<small lang="zh-Hant">{r.text}</small></p>
              : <><p class="dr__year"><span lang="zh-Hant">{r.text}</span></p><div class="dr__cands num">{r.years.map((y) => <span>{y}</span>)}</div></>}
            <p class="dr__how">Worked out as {r.how}.{r.exact && <> The cyclical year {r.years[0]} is <span class="han" lang="zh-Hant">{ganjiOfYear(r.years[0])}</span>.</>}</p>
            {r.ganji && (r.ganji.agrees
              ? <p class="dr__how">The cyclical year written with it, <span class="han" lang="zh-Hant">{r.ganji.chars}</span>, agrees.</p>
              : <p class="panel__warn">The cyclical year written with it, <span class="han" lang="zh-Hant">{r.ganji.chars}</span>, does not agree with {r.years.join(' or ')}. One of the two is misread or miswritten.</p>)}
            <p class="dr__how faint">A date is when the writing says it was made. On porcelain a reign mark names the reign it claims, and marks were copied: the date does not show when the item was made.</p>
          </div>
        ))}
        {loose.map((g) => {
          const i = ganjiIndex(g)!;
          const ys = yearsOfGanji(i, 904, 2043);
          return (
            <div class="dr__card">
              <p class="panel__kind">Cyclical year alone</p>
              <p class="dr__year"><span class="han" lang="zh-Hant">{g}</span><small>{ganjiNames[g] ?? ''} · year {i + 1} of 60</small></p>
              <p class="dr__how">On its own a cyclical year comes round every sixty years. Which one is meant has to come from the item, or from an era written beside it.</p>
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
