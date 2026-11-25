// A fragment of HTML as plain text, the way structured data wants it: tags
// out, entities read, spaces collapsed (as the old generator's FAQ data did).
const ENT: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  mdash: '—', ndash: '–', hellip: '…', nbsp: ' ', rarr: '→', copy: '©', eacute: 'é', middot: '·', times: '×',
};
export function plainText(html: string) {
  return html
    .replace(/<\/(p|li|div|h[1-6]|td|th)>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
