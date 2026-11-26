// The Turkmen gul explorer (/marks/rugs/turkmen-guls): every gul as a picture card. Pick a tribe
// or a kind of rug or bag and the cards narrow to the guls sources give for it; a card opens the
// gul's sheet in the catalogue below (#gul-<id>). Tribes are as sources attribute them, with how
// sure they are ("disputed" ones are marked).
import { useMemo, useState } from 'preact/hooks';

type Item = {
  anchor: string; name: string; native: string | null; img: { src: string; alt: string } | null; kind: string;
  tribes: { id: string; sure: string; label: string }[]; formats: string[];
};
type Opt = { id: string; name: string };
type Props = { items: Item[]; tribes: Opt[]; formats: Opt[]; kinds: Opt[] };

export default function GulExplorer({ items, tribes, formats, kinds }: Props) {
  const [tribe, setTribe] = useState('');
  const [format, setFormat] = useState('');
  const [kind, setKind] = useState('');
  const shown = useMemo(() => items.filter((g) =>
    (!tribe || g.tribes.some((t) => t.id === tribe)) && (!format || g.formats.includes(format)) && (!kind || g.kind === kind)), [items, tribe, format, kind]);
  const used = (key: 'tribes' | 'formats', id: string) => items.some((g) => (key === 'tribes' ? g.tribes.some((t) => t.id === id) : g.formats.includes(id)));
  const chips = (label: string, opts: Opt[], val: string, set: (v: string) => void) => (
    <div class="gx__row" role="group" aria-label={label}>
      <span class="gx__label">{label}</span>
      <button type="button" aria-pressed={!val} onClick={() => set('')}>Any</button>
      {opts.map((o) => <button type="button" aria-pressed={val === o.id} onClick={() => set(val === o.id ? '' : o.id)}>{o.name}</button>)}
    </div>
  );
  // The site's router handles same-page links without a hashchange, so open the gul's sheet here; the
  // catalogue fills it on toggle, and setting the hash scrolls to it and keeps the address shareable.
  const open = (e: MouseEvent, anchor: string) => {
    const el = document.getElementById(anchor) as HTMLDetailsElement | null;
    if (!el) return;
    e.preventDefault();
    el.open = true;
    if (location.hash !== `#${anchor}`) location.hash = anchor;
    else el.scrollIntoView({ block: 'start' });
  };
  const name = (id: string, label: string) => tribes.find((t) => t.id === id)?.name ?? label;
  return (
    <div class="gx">
      <div class="gx__bar">
        {chips('Tribe', tribes.filter((t) => used('tribes', t.id)), tribe, setTribe)}
        {formats.length > 0 && chips('Woven on', formats.filter((f) => used('formats', f.id)), format, setFormat)}
        {kinds.length > 1 && chips('Kind', kinds, kind, setKind)}
        <p class="gx__sum" aria-live="polite">{shown.length === items.length ? `${items.length} guls.` : `${shown.length} of ${items.length} guls.`}</p>
      </div>
      {shown.length === 0 ? (
        <p class="sread__empty">No gul in the reference has that combination. Clear a choice to see more.</p>
      ) : (
        <ul class="gx__grid">
          {shown.map((g) => (
            <li>
              <a class="rpick gx__card" href={`#${g.anchor}`} onClick={(e) => open(e, g.anchor)}>
                <span class="rpick__img">{g.img ? <img src={g.img.src} alt={g.img.alt} loading="lazy" decoding="async" /> : null}</span>
                <span class="rpick__label">
                  <strong>{g.name}</strong>
                  {g.native && <span class="gx__native" lang="tk">{g.native}</span>}
                  {g.tribes.length > 0 && <span class="gx__tribes">{g.tribes.map((t, i) => <>{i > 0 && ', '}{name(t.id, t.label)}{t.sure === 'disputed' ? ' (disputed)' : ''}</>)}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
