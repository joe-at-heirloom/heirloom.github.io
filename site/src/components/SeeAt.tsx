/** @jsxImportSource preact */
// Where to see a mark Heirloom can't show. Its picture exists, but it isn't
// openly licensed, so it is linked, never copied. The links come with the record
// (attributes.see_at, made by the app's scripts/reference/collect.ts):
//   mark:   a page checked by hand to show this mark;
//   object: a museum's record of an object that a record with no picture cites
//           (not checked to show the mark itself, so the words don't promise it).
// Used in the record panels (Portal, MetalExplorer, PotteryExplorer) and the
// catalogue sheets (ref/RecordSheet.astro); the guide cards use seeAtHtml below.
import '../styles/seeat.css';
export type SeeAtLink = { kind: 'mark' | 'object'; url: string; holder: string; what: string };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
// "Backstamp charts…" reads on after a colon as "backstamp charts…".
const after = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
// A citation that already names its museum doesn't need the name again.
const names = (what: string, holder: string) => what.toLowerCase().includes(holder.replace(/^the /i, '').split(',')[0].toLowerCase());

export const seeAtLinks = (v: unknown): SeeAtLink[] => (Array.isArray(v) ? v.filter((x) => x && typeof x.url === 'string' && /^https?:\/\//.test(x.url)) : []);

/** The links for a record; `pictured` when the record shows a picture of its own. */
export function SeeAt({ links, pictured }: { links: unknown; pictured: boolean }) {
  const all = seeAtLinks(links);
  const marks = all.filter((l) => l.kind === 'mark');
  const objects = pictured ? [] : all.filter((l) => l.kind === 'object');
  if (!marks.length && !objects.length) return null;
  return (
    <aside class="seeat">
      {marks.length > 0 && (
        <p>
          {pictured ? 'Also shown at ' : 'No picture here: the ones we found aren’t free to copy. See it at '}
          {marks.map((l, i) => <>{i > 0 && '; '}<a href={l.url} rel="nofollow noopener">{l.holder}</a>{l.what && <span class="muted">: {clip(after(l.what), 140)}</span>}</>)}.
        </p>
      )}
      {objects.length > 0 && (
        <>
          <p>See the items in the museum records this entry draws on:</p>
          <ul>
            {objects.slice(0, 6).map((l) => <li><a href={l.url} rel="nofollow noopener">{clip(l.what || l.holder, 160)}</a>{!names(l.what, l.holder) && <span class="muted"> · {l.holder}</span>}</li>)}
          </ul>
        </>
      )}
    </aside>
  );
}

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The same, as a short line for a guide page's mark card (lib/makers.ts card()). */
export function seeAtHtml(links: unknown, pictured: boolean): string {
  const all = seeAtLinks(links);
  const marks = all.filter((l) => l.kind === 'mark');
  const objects = pictured ? [] : all.filter((l) => l.kind === 'object');
  const a = (l: SeeAtLink) => `<a href="${esc(l.url)}" rel="nofollow noopener">${esc(l.holder)}</a>`;
  if (marks.length) return ` ${pictured ? 'Also shown at' : 'See it at'} ${marks.map(a).join(', ')}.`;
  if (objects.length) return ` The museum ${objects.length === 1 ? 'record' : 'records'} it draws on: ${objects.slice(0, 2).map(a).join(', ')}.`;
  return '';
}
