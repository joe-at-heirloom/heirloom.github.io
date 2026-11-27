/** @jsxImportSource preact */
// The siyaq key, and a reader on it: tap the signs written on the paper and it
// adds them up. Each sign is a value of its own (units, tens, hundreds,
// thousands, ten thousands), so an amount is the sum of its signs. Lakhs and
// karors are written as the words with the signs for how many (Shakeb): tap
// how many first, then lakh or karor; the units and tens just before it count
// them. Signs from indian.json dates.siyaq (Unicode Indic Siyaq
// Numbers, set in Noto Sans Indic Siyaq Numbers).
import { useMemo, useState } from 'preact/hooks';

export type SiyaqCell = { value: number; char: string; word: string | null };
export type SiyaqRow = { order: string; cells: SiyaqCell[] };
export type SiyaqLarge = { value: number | null; label: string; char: string };
type Props = { rows: SiyaqRow[]; large: SiyaqLarge[]; labels: Record<string, string> };
type Tap = { char: string; value: number; label: string; times: boolean };

const fmt = (n: number) => n.toLocaleString('en-US');

export default function SiyaqReader({ rows, large, labels }: Props) {
  const [taps, setTaps] = useState<Tap[]>([]);
  const add = (t: Tap) => setTaps((s) => [...s, t]);

  // The amount, part by part: plain signs add; a lakh or karor multiplies the signs tapped since the last one.
  const parts = useMemo(() => {
    const out: { text: string; value: number }[] = [];
    let run: Tap[] = [];
    for (const t of taps) {
      if (!t.times) { run.push(t); continue; }
      // How many: the units and tens tapped just before (1 to 99); anything larger stays a plain amount.
      let k = run.length;
      while (k > 0 && run[k - 1].value < 100) k--;
      for (const x of run.slice(0, k)) out.push({ text: fmt(x.value), value: x.value });
      const n = run.slice(k).reduce((s, x) => s + x.value, 0) || 1;
      out.push({ text: `${fmt(n)} ${t.label}`, value: n * t.value });
      run = [];
    }
    for (const x of run) out.push({ text: fmt(x.value), value: x.value });
    return out;
  }, [taps]);
  const total = parts.reduce((s, p) => s + p.value, 0);

  return (
    <div class="sq">
      <div class="sq__sum" aria-live="polite">
        {taps.length === 0 ? (
          <p class="sq__hint">Tap the signs you see, in any order, and they are added up. For lakhs and karors, tap how many first, then lakh or karor.</p>
        ) : (
          <>
            <p class="sq__written"><span class="siyaq" lang="fa" dir="rtl">{taps.map((t) => t.char).join('')}</span></p>
            <p class="sq__total"><strong class="num">{fmt(total)}</strong>{parts.length > 1 && <span class="muted"> = {parts.map((p) => p.text).join(' + ')}</span>}</p>
          </>
        )}
        <div class="sq__actions">
          <button type="button" class="sq__btn" disabled={!taps.length} onClick={() => setTaps((s) => s.slice(0, -1))}>Undo</button>
          <button type="button" class="sq__btn" disabled={!taps.length} onClick={() => setTaps([])}>Start again</button>
        </div>
      </div>

      <div class="isiyaq" role="table" aria-label="Siyaq figures: tap one to add it">
        {rows.map((r) => (
          <div class="isiyaq__row" role="row">
            <span role="rowheader">{labels[r.order] ?? r.order}</span>
            {r.cells.map((c) => (
              <span role="cell" class="isiyaq__slot">
                <button type="button" class="isiyaq__cell" onClick={() => add({ char: c.char, value: c.value, label: fmt(c.value), times: false })}
                  title={c.word ? `${fmt(c.value)}, from ${c.word}` : fmt(c.value)} aria-label={`Add ${fmt(c.value)}`}>
                  <span class="siyaq" lang="fa" dir="rtl" aria-hidden="true">{c.char}</span>
                  <small>{fmt(c.value)}</small>
                </button>
              </span>
            ))}
          </div>
        ))}
        {large.length > 0 && (
          <div class="isiyaq__row isiyaq__row--large" role="row">
            <span role="rowheader">Larger</span>
            {large.map((x) => (
              <span role="cell" class="isiyaq__slot">
                {x.value ? (
                  <button type="button" class="isiyaq__cell isiyaq__cell--wide" onClick={() => add({ char: x.char, value: x.value!, label: x.label, times: true })}
                    aria-label={`Times a ${x.label}`}>
                    <span class="siyaq" lang="fa" dir="rtl" aria-hidden="true">{x.char}</span>
                    <small>{x.label} ({fmt(x.value)})</small>
                  </button>
                ) : (
                  <span class="isiyaq__cell isiyaq__cell--wide isiyaq__cell--still">
                    <span class="siyaq" lang="fa" dir="rtl">{x.char}</span>
                    <small>{x.label}</small>
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
