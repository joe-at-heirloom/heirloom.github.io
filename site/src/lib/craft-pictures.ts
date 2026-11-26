// Pictures for the Indian crafts finder (islands/CraftFinder): an outline for
// each kind of item (drawn for Heirloom, 32×32, one stroke, currentColor), a
// swatch for each material, and plain words for each technique, with its
// close-up cut from the museum photographs already on the page (CC0 / public
// domain; the cut list is hallmark-sources/indian/images/technique_crops.json,
// made by technique_crops.py). The tokens are the table's own vocabulary
// (indian.json `crafts`), so links like ?materials=silver keep working.

export const FORM_ICONS: Record<string, string> = {
  box: '<rect x="5" y="14" width="22" height="11" rx="1"/><path d="M5 14c0-4.7 22-4.7 22 0"/><path d="M14.5 15.5h3v3.5h-3z"/><path d="M7.5 25v2.5M24.5 25v2.5"/>',
  jewelry: '<path d="M6 5c0 8.5 4.5 14 10 14s10-5.5 10-14"/><path d="M8.6 12.5l.01 0M11.2 16l.01 0M20.8 16l.01 0M23.4 12.5l.01 0"/><path d="M16 19v1.5"/><path d="M16 20.5c-2.2 2.6-2.2 5.3 0 6.8 2.2-1.5 2.2-4.2 0-6.8z"/>',
  tray: '<ellipse cx="16" cy="13" rx="13" ry="4.5"/><path d="M3 13v3c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5v-3"/><ellipse cx="16" cy="13" rx="8.5" ry="2.4"/>',
  figure: '<circle cx="16" cy="6.8" r="2.6"/><path d="M12.6 12.2c1.2-1.4 5.6-1.4 6.8 0l-.9 7.3h-5z"/><path d="M12.6 13l-2.8 4M19.4 13l2.6-3.6"/><path d="M13.6 19.5l-.8 4.5M18.4 19.5l.8 4.5"/><path d="M8.5 24h15c0 2.2-3.4 3.8-7.5 3.8S8.5 26.2 8.5 24z"/>',
  plate: '<circle cx="16" cy="16" r="12.5"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="2.2"/><path d="M16 9.8v1.8M16 20.4v1.8M9.8 16h1.8M20.4 16h1.8"/>',
  panel: '<rect x="6" y="4" width="20" height="24" rx="1"/><path d="M10 25V13.5c0-3.6 2.6-6 6-7.6 3.4 1.6 6 4 6 7.6V25z"/><path d="M16 10.5v11"/>',
  bowl: '<path d="M4 13h24c0 6.6-5.4 11-12 11S4 19.6 4 13z"/><path d="M12.5 23.6 11.5 27h9l-1-3.4"/><path d="M8 16.5c2 2.6 4.8 3.8 8 3.8s6-1.2 8-3.8"/>',
  vase: '<path d="M12 3.5h8"/><path d="M13 3.5c1 1.5 1.2 3.5 1 5.5C9 11 7.5 14 7.5 17c0 4 2.5 7 5.5 9h6c3-2 5.5-5 5.5-9 0-3-1.5-6-6.5-8-.2-2 0-4 1-5.5"/><path d="M13 26l-1.5 2.5h9L19 26"/><path d="M8.6 19.6c4.6 1.1 10.2 1.1 14.8 0"/>',
  weapon: '<path d="M10.5 21C17.5 17 23 11 26.5 3.5"/><path d="M12.8 23.2C19.5 19 24.5 12 26.5 3.5"/><path d="M8 18.8l6.8 6.8"/><path d="M11.4 22.6 6.6 27.4"/><circle cx="5.5" cy="28.5" r="1.5"/>',
  table: '<path d="M3.5 11h25v3h-25z"/><path d="M6.5 14v13M25.5 14v13"/><path d="M6.5 18c3 1.6 6 2.4 9.5 2.4s6.5-.8 9.5-2.4"/>',
  'mirror frame': '<ellipse cx="16" cy="12.5" rx="9" ry="10"/><ellipse cx="16" cy="12.5" rx="6" ry="7"/><path d="M13.5 9.5l2.2-2.2"/><path d="M16 22.5v5"/><path d="M13.5 28.5h5"/>',
  lamp: '<path d="M16 2.5c-1.6 2-1.6 3.6 0 4.8 1.6-1.2 1.6-2.8 0-4.8z"/><path d="M9.5 9h13c0 2.6-2.9 4.2-6.5 4.2S9.5 11.6 9.5 9z"/><path d="M16 13.2v10"/><path d="M14.2 17.5h3.6"/><path d="M9.5 28.5c0-3.2 2.9-5.3 6.5-5.3s6.5 2.1 6.5 5.3z"/>',
  ewer: '<path d="M13 10.5c-4 2.8-5.3 7.6-3.4 11.6C11 25 13.3 26.5 16.5 26.5s5.6-1.5 7-4.4c1.9-4-.6-8.8-4.5-11.6z"/><path d="M13 10.5h6M14 10.5V8h4v2.5M16 8V5.8"/><path d="M10 19.5C7 17.5 5 13.5 3.5 9M10.6 22.4C7 20.6 5 15 3.5 9"/><path d="M22.5 12.5c3.6.2 4.8 3 4.3 5.8-.4 2-1.6 3.2-3.3 3.7"/><path d="M13.6 26.4 13 28h7.2l-.6-1.6"/>',
  cabinet: '<rect x="7" y="4" width="18" height="22" rx="1"/><path d="M16 4v13M7 17h18M7 21.5h18"/><path d="M14 10.5v2M18 10.5v2M15 19.2h2M15 23.7h2"/><path d="M9 26v2.5M23 26v2.5"/>',
  toy: '<path d="M16 3.5V8"/><path d="M8 12c0-2.2 3.6-4 8-4s8 1.8 8 4c0 4-4 9-8 15.5C12 21 8 16 8 12z"/><path d="M8.4 13.6c4.9 1.7 10.3 1.7 15.2 0"/><path d="M10.2 17.6c3.8 1.2 7.8 1.2 11.6 0"/>',
  screen: '<path d="M4 7.5l8-2.5v22l-8 2.5z"/><path d="M12 5l8 2.5v22L12 27z"/><path d="M20 7.5 28 5v22l-8 2.5z"/><path d="M6.5 11l3-.9M14.5 8.4l3 .9M22.5 10.1l3-.9"/>',
  'hookah base': '<circle cx="16" cy="19.5" r="8"/><path d="M13.6 12v-2h4.8v2"/><path d="M16 10V5"/><path d="M13.2 5h5.6l-1-2.5h-3.6z"/><path d="M18.4 10.8c4.2-.2 8 1.8 9.6 6.2"/><path d="M11 28h10"/>',
  'pen case': '<rect x="3" y="13" width="26" height="8.5" rx="4.2"/><path d="M7.5 13v8.5M24.5 13v8.5"/><path d="M5 9.2l19-2.2"/><path d="M24 7l3.5-.4-3.2 1.6z"/>',
  chair: '<path d="M9 16V5c2.4-2 11.6-2 14 0v11"/><path d="M12 8h8"/><path d="M7 16h18v3H7z"/><path d="M8.5 19v9M23.5 19v9"/>',
  chest: '<path d="M4 11h24v15H4z"/><path d="M4 11V8.5c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2V11"/><path d="M4 15.5h24"/><path d="M14.5 14h3v4.2h-3z"/><path d="M8 6.5V26M24 6.5V26"/>',
};

export const formIcon = (token: string) =>
  FORM_ICONS[token]
    ? `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${FORM_ICONS[token]}</svg>`
    : '';

// What each material looks like, as a CSS background for a round swatch. The
// colors are the material's, so they stay the same in dark mode (the swatch
// keeps a rule-colored ring).
export const MATERIAL_SWATCH: Record<string, string> = {
  silver: 'linear-gradient(135deg,#fbfbfc 0%,#c3c8ce 45%,#eef0f2 70%,#a9afb6 100%)',
  gold: 'linear-gradient(135deg,#fbe7a1 0%,#d7a63c 45%,#f3d27a 70%,#a87a1f 100%)',
  brass: 'linear-gradient(135deg,#efe08f 0%,#bfa03a 50%,#e2cc6a 75%,#8d7424 100%)',
  copper: 'linear-gradient(135deg,#f4b48e 0%,#b8603a 50%,#e39a72 75%,#874020 100%)',
  bronze: 'linear-gradient(135deg,#c99d6b 0%,#7d5632 55%,#a97b4c 80%,#5a3c22 100%)',
  'zinc alloy': 'repeating-linear-gradient(135deg,#1d1d1f 0 5px,#d9dde1 5px 6.5px,#1d1d1f 6.5px 11px)',
  'iron or steel': 'linear-gradient(135deg,#a7adb3 0%,#5a6168 55%,#8a9197 80%,#3d4349 100%)',
  enamel: 'conic-gradient(from 30deg,#1f5fa8 0 25%,#2f8f5b 0 50%,#c0392b 0 75%,#e8b42f 0)',
  wood: 'repeating-linear-gradient(100deg,#a8754a 0 3px,#8b5a34 3px 5px,#b9875a 5px 9px)',
  ivory: 'radial-gradient(circle at 35% 30%,#fffaf0 0%,#efe3c6 60%,#dccb9f 100%)',
  bone: 'radial-gradient(circle at 30% 30%,#7d7464 0 1px,transparent 1.5px) 0 0/7px 7px,radial-gradient(circle at 35% 30%,#fbf6ea,#e2d8c2)',
  horn: 'linear-gradient(135deg,#d8b98a 0%,#8a5f37 40%,#3b281b 100%)',
  tortoiseshell: 'radial-gradient(circle at 30% 35%,#d39a4a 0 18%,transparent 19%),radial-gradient(circle at 70% 65%,#c8893d 0 15%,transparent 16%),radial-gradient(circle at 65% 25%,#e0ad5c 0 9%,transparent 10%),#4a2412',
  'mother-of-pearl': 'conic-gradient(from 90deg,#f3eefb,#d9f0ee,#f7e6ef,#e5ecfa,#f3eefb)',
  marble: 'linear-gradient(120deg,transparent 0 42%,#b9b9b9 43% 45%,transparent 46%),linear-gradient(60deg,transparent 0 62%,#cfcfcf 63% 64%,transparent 65%),#f7f6f3',
  soapstone: 'radial-gradient(circle at 35% 30%,#e2ddc8,#b7b29a)',
  'stone inlay': 'radial-gradient(circle at 32% 38%,#b22a2a 0 13%,transparent 14%),radial-gradient(circle at 66% 40%,#2c6e49 0 12%,transparent 13%),radial-gradient(circle at 50% 70%,#1e4f8a 0 12%,transparent 13%),#f7f6f3',
  lacquer: 'radial-gradient(circle at 32% 28%,#e8635b 0%,#a3231f 55%,#6d1210 100%)',
  'mirror glass': 'radial-gradient(circle at 30% 30%,#fff 0 8%,transparent 9%),radial-gradient(circle at 70% 60%,#fff 0 6%,transparent 7%),linear-gradient(135deg,#e9edf1,#9aa4ae 55%,#dfe4e9)',
  beads: 'radial-gradient(circle,#c0392b 0 30%,transparent 32%) 0 0/9px 9px,radial-gradient(circle,#e8b42f 0 30%,transparent 32%) 4.5px 4.5px/9px 9px,#f4efe3',
  gemstones: 'conic-gradient(from 0deg,#b3122e 0 33%,#127a4a 0 66%,#1c3f9a 0)',
  glass: 'linear-gradient(135deg,rgba(214,236,244,.95),rgba(140,190,210,.9) 60%,rgba(230,244,248,.95))',
  shell: 'repeating-radial-gradient(circle at 50% 110%,#f6e8da 0 3px,#e6c6aa 3px 4.5px)',
};

// Plain words first, the term second: owners rarely know "repoussé".
export const TECHNIQUE_WORDS: Record<string, [string, string]> = {
  carving: ['Carved', 'cut away to leave a design'],
  inlay: ['Inlaid', 'one material set into another'],
  chasing: ['Chased', 'design punched in from the front'],
  'setting stones': ['Stones set', 'stones or glass held in metal'],
  engraving: ['Engraved', 'lines cut into the surface'],
  piercing: ['Pierced', 'holes cut right through'],
  casting: ['Cast', 'poured into a mold'],
  'repoussé': ['Raised from behind', 'repoussé'],
  enamel: ['Enameled', 'colored glass fused onto metal'],
  turning: ['Turned', 'shaped on a lathe'],
  damascening: ['Gold or silver beaten into steel', 'damascening, koftgari'],
  gilding: ['Gilded', 'a thin coat of gold'],
  painting: ['Painted', ''],
  lacquering: ['Lacquered', 'colored lac, often on wood'],
  filigree: ['Filigree', 'fine twisted wire'],
};
