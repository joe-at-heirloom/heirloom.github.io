/** @jsxImportSource preact */
// The print-seal reader: which censor and date seals are on a Japanese
// woodblock print, and what year and month they give. Pick the seals you see
// (each kind was used in its own years), then the zodiac animal and the month
// in the date seal; or pick the censors' names in the 1842–1853 seals and the
// years they served together narrow the date. The seals were cut on the block,
// so a later printing from the same blocks carries the same seals: they date
// the design's approval, not the sheet in your hand.
import { useEffect, useMemo, useState } from 'preact/hooks';

export type SealType = {
  id: string; period: string; form: string; reads: string; howToRead: string; ambiguity: string;
  years: Record<string, number | number[] | null>; intercalary: Record<string, number>; animalAndMonth: boolean; nanushi: boolean;
};
export type Nanushi = { id: string; chars: string; name: string; from: number | null; to: number | null };
type Props = { types: SealType[]; nanushi: Nanushi[] };

const ANIMALS: [string, string, string][] = [
  ['子', 'rat', 'ne'], ['丑', 'ox', 'ushi'], ['寅', 'tiger', 'tora'], ['卯', 'hare', 'u'], ['辰', 'dragon', 'tatsu'], ['巳', 'snake', 'mi'],
  ['午', 'horse', 'uma'], ['未', 'sheep', 'hitsuji'], ['申', 'monkey', 'saru'], ['酉', 'rooster', 'tori'], ['戌', 'dog', 'inu'], ['亥', 'boar', 'i'],
];
const MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const yearsFor = (t: SealType, animal: string): number[] => {
  const v = t.years[animal];
  return v == null ? [] : Array.isArray(v) ? v : [v];
};

export default function PrintSealReader({ types, nanushi }: Props) {
  const [type, setType] = useState('');
  const [animal, setAnimal] = useState('');
  const [month, setMonth] = useState(0);
  const [leap, setLeap] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const t = p.get('seal');
    if (t && types.some((x) => x.id === t)) setType(t);
    const a = p.get('animal');
    if (a && ANIMALS.some(([c]) => c === a)) setAnimal(a);
    const m = Number(p.get('month'));
    if (m >= 1 && m <= 12) setMonth(m);
    if (p.get('leap') === '1') setLeap(true);
    const n = p.get('censors');
    if (n) setNames(n.split(',').filter((id) => nanushi.some((x) => x.id === id)));
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (type) p.set('seal', type);
    if (animal) p.set('animal', animal);
    if (month) p.set('month', String(month));
    if (leap) p.set('leap', '1');
    if (names.length) p.set('censors', names.join(','));
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`);
  }, [type, animal, month, leap, names]);

  const t = types.find((x) => x.id === type) ?? null;
  const cands = t && animal ? yearsFor(t, animal) : [];
  // An intercalary month (閏) happened in one year only: it picks between candidates.
  const byLeap = leap && month ? cands.filter((y) => t!.intercalary[String(y)] === month) : cands;
  const years = leap && month ? byLeap : cands;
  const picked = nanushi.filter((n) => names.includes(n.id));
  const span = picked.length
    ? [Math.max(...picked.map((n) => n.from ?? 0)), Math.min(...picked.map((n) => n.to ?? 9999))]
    : null;
  const toggle = (id: string) => setNames((ns) => (ns.includes(id) ? ns.filter((x) => x !== id) : [...ns, id]));
  const animalsHere = useMemo(() => (t ? new Set(ANIMALS.map(([c]) => c).filter((c) => yearsFor(t, c).length)) : new Set<string>()), [type]);

  return (
    <div class="ps">
      <section class="ps__step" aria-labelledby="ps-1">
        <h2 id="ps-1"><span class="ps__n num">1</span> Which seals are on the print?</h2>
        <p class="muted">Look in the margins and beside the title or signature for small round or oval seals.</p>
        <ul class="ps__types">
          {types.map((x) => (
            <li>
              <button type="button" class="ps__type" aria-pressed={type === x.id} onClick={() => { setType(type === x.id ? '' : x.id); setAnimal(''); setMonth(0); setLeap(false); }}>
                <span class="ps__period num">{x.period}</span>
                <span class="ps__form">{x.form}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {t && t.animalAndMonth && (
        <section class="ps__step" aria-labelledby="ps-2">
          <h2 id="ps-2"><span class="ps__n num">2</span> The animal and the month in the date seal</h2>
          <div class="ps__animals" role="group" aria-label="Zodiac animal">
            {ANIMALS.map(([c, en, ro]) => (
              <button type="button" class="glyph ps__animal" aria-pressed={animal === c} disabled={!animalsHere.has(c)} onClick={() => setAnimal(animal === c ? '' : c)} aria-label={`${c}, ${en}`}>
                <span class="han ja" lang="ja">{c}</span><span class="ps__en">{en}<br /><span class="faint">{ro}</span></span>
              </button>
            ))}
          </div>
          <div class="ps__months" role="group" aria-label="Month">
            {MONTHS.map((m, i) => (
              <button type="button" class="glyph" aria-pressed={month === i + 1} onClick={() => setMonth(month === i + 1 ? 0 : i + 1)} aria-label={`month ${i + 1}`}>
                <span class="han ja" lang="ja">{m}</span>
              </button>
            ))}
            <label class="ps__leap"><input type="checkbox" checked={leap} onChange={(e) => setLeap((e.target as HTMLInputElement).checked)} /> The month has <span class="han ja" lang="ja">閏</span> (an extra, intercalary month)</label>
          </div>
        </section>
      )}

      {t && (
        <div class="dr__out" aria-live="polite">
          <div class={`dr__card${years.length === 1 ? ' is-exact' : ''}`}>
            <p class="panel__kind">{t.form}</p>
            {!t.animalAndMonth
              ? <p class="dr__year num">{t.period}</p>
              : !animal
                ? <p class="dr__year num">{t.period}<small>pick the animal for the year</small></p>
                : years.length === 0
                  ? <p class="dr__year">{leap ? 'No year of this seal had that extra month' : 'This seal was not used in a year of that animal'}</p>
                  : <p class="dr__year num">{years.join(' or ')}{month ? <small>{leap ? 'intercalary ' : ''}month {month}</small> : null}</p>}
            {t.reads && <p class="dr__how">What it gives: {t.reads}.</p>}
            {t.howToRead && <p class="dr__how">{t.howToRead}</p>}
            {years.length > 1 && t.ambiguity && <p class="panel__warn">{t.ambiguity}</p>}
            {years.length === 1 && month > 0 && years[0] <= 1872 && <p class="dr__how faint">Months before 1873 are lunar: month {month} began some weeks after the Western month of the same number.</p>}
            <p class="dr__how faint">The seals were cut on the block: a later printing from the same blocks has the same seals, so they date the design's approval, not the sheet.</p>
          </div>
        </div>
      )}

      <section class="ps__step" aria-labelledby="ps-3">
        <h2 id="ps-3"><span class="ps__n num">3</span> Censors' names, 1842–1853</h2>
        <p class="muted">From 1842 to 1853 the seals give the names of the ward officials (nanushi) who checked the design: one seal to 1846–47, two side by side after. Pick the names you see; the years they served together narrow the date.</p>
        <div class="ps__names" role="group" aria-label="Censors">
          {nanushi.map((n) => (
            <button type="button" class="ps__name" aria-pressed={names.includes(n.id)} onClick={() => toggle(n.id)}>
              <span class="han ja" lang="ja">{n.chars}</span><span>{n.name}</span><span class="faint num">{n.from}–{n.to}</span>
            </button>
          ))}
        </div>
        {span && (
          <div class={`dr__card${span[0] <= span[1] ? ' is-exact' : ''}`} aria-live="polite">
            {span[0] <= span[1]
              ? <p class="dr__year num">{span[0] === span[1] ? span[0] : `${span[0]}–${span[1]}`}<small>{picked.map((n) => n.chars).join(' + ')}</small></p>
              : <p class="dr__year">These censors did not serve in the same years: check the seals again.</p>}
            <p class="dr__how faint">Each censor's years are as the sources give them (open the seal in the marks explorer for its sources); a pair can only date from years both served.</p>
          </div>
        )}
      </section>
    </div>
  );
}
