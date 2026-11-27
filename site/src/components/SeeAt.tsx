/** @jsxImportSource preact */
// Where to see an item Heirloom has no picture of: linked, never copied. The
// links come with the record (attributes.see_at, made by the app's
// scripts/reference/collect.ts; every item with no picture should have one):
//   mark:   a page checked by hand to show this mark (its pictures aren't free to copy);
//   item:   a page showing this design (the Tiffany lamps' list);
//   object: an item's own page at a museum, a painting database or an auction
//           house: the record's own item, an example it names, or the item a
//           source it cites is the record of (not checked to show the mark
//           itself, so the words don't promise it);
//   entry:  the page of the record's own source that records it, in a book or
//           list anyone can read online; it may give the item in words only.
//           Shown only when there is nothing above; `account` when the page
//           needs a free account (said beside the link).
// Used in the record panels (Portal, MetalExplorer, PotteryExplorer) and the
// catalogue sheets (ref/RecordSheet.astro); the guide cards use seeAtHtml below.
import '../styles/seeat.css';
export type SeeAtLink = { kind: 'mark' | 'item' | 'object' | 'entry'; url: string; holder: string; what: string; account?: boolean };
// A page that asks for a free account: a book the Internet Archive lends, the Edinburgh register archive.
const account = (l: SeeAtLink) => (l.account ? (/archive\.org\//.test(l.url) ? ' (borrow it free with an account)' : ' (free account needed)') : '');

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
// "Backstamp charts…" reads on after a colon as "backstamp charts…".
const after = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
// A citation that already names its holder doesn't need the name again.
const names = (what: string, holder: string) => what.toLowerCase().includes(holder.replace(/^the /i, '').split(',')[0].toLowerCase());

export const seeAtLinks = (v: unknown): SeeAtLink[] => (Array.isArray(v) ? v.filter((x) => x && typeof x.url === 'string' && /^https?:\/\//.test(x.url)) : []);

/** Which links to show: a picture of its own hides all but the checked pages; a book's entry only when nothing else is there. */
function pick(links: unknown, pictured: boolean) {
  const all = seeAtLinks(links);
  const marks = all.filter((l) => l.kind === 'mark');
  const items = pictured ? [] : all.filter((l) => l.kind === 'item');
  const objects = pictured ? [] : all.filter((l) => l.kind === 'object');
  const entries = pictured || marks.length || items.length || objects.length ? [] : all.filter((l) => l.kind === 'entry');
  return { marks, items, objects, entries };
}

/** The links for a record; `pictured` when the record shows a picture of its own; `one` when the record is a kind (a rug type), so each checked page shows one of them. */
export function SeeAt({ links, pictured, one = false }: { links: unknown; pictured: boolean; one?: boolean }) {
  const { marks, items, objects, entries } = pick(links, pictured);
  if (!marks.length && !items.length && !objects.length && !entries.length) return null;
  const list = (ls: SeeAtLink[]) => <>{ls.map((l, i) => <>{i > 0 && '; '}<a href={l.url} rel="nofollow noopener">{l.holder}</a>{l.what && <span class="muted">: {clip(after(l.what), 140)}</span>}</>)}</>;
  return (
    <aside class="seeat">
      {marks.length > 0 && <p>{pictured ? 'Also shown at ' : one ? 'No photo here: the ones we found aren’t free to copy. See one at ' : 'No picture here: the ones we found aren’t free to copy. See it at '}{list(marks)}.</p>}
      {items.length > 0 && <p>{marks.length ? 'Of this design: ' : 'No picture here. See one of this design at '}{list(items)}.</p>}
      {objects.length > 0 && (
        <>
          <p>{marks.length || items.length ? 'Also in these records:' : 'No picture here. Where to see one:'}</p>
          <ul>
            {objects.slice(0, 6).map((l) => <li><a href={l.url} rel="nofollow noopener">{clip(l.what || l.holder, 160)}</a>{!names(l.what, l.holder) && <span class="muted"> · {l.holder}</span>}</li>)}
          </ul>
        </>
      )}
      {entries.length > 0 && (
        <p>
          No picture here yet. Read the entry that records it:{' '}
          {entries.slice(0, 3).map((l, i) => <>{i > 0 && '; '}<a href={l.url} rel="nofollow noopener">{clip(l.what || l.holder, 160)}</a>{(!names(l.what, l.holder) || l.account) && <span class="muted">{!names(l.what, l.holder) && ` · ${l.holder}`}{account(l)}</span>}</>)}.
        </p>
      )}
    </aside>
  );
}

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The same, as a short line for a guide page's mark card (lib/makers.ts card()). */
export function seeAtHtml(links: unknown, pictured: boolean): string {
  const { marks, items, objects, entries } = pick(links, pictured);
  const a = (l: SeeAtLink) => `<a href="${esc(l.url)}" rel="nofollow noopener">${esc(l.holder)}</a>`;
  if (marks.length) return ` ${pictured ? 'Also shown at' : 'See it at'} ${marks.map(a).join(', ')}.`;
  if (items.length) return ` See one of this design at ${items.map(a).join(', ')}.`;
  if (objects.length) return ` See one at ${objects.slice(0, 2).map(a).join(', ')}.`;
  if (entries.length) return ` The entry that records it: ${entries.slice(0, 1).map((l) => `<a href="${esc(l.url)}" rel="nofollow noopener">${esc(clip(l.what || l.holder, 90))}</a>${esc(account(l))}`).join('')}.`;
  return '';
}
