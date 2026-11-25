// The home page's house: an architect's model of an ordinary house. A loupe
// magnifies it; under the glass the room stays pale wood and only the items
// worth a look show their color; rest the glass on one and it's found.
// Built from design/directions/house.js (the prototype Joe chose, Nov 24).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function rng(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = rng(11);
const PI = Math.PI;

// ---------------------------------------------------------------- colours
// The real colors: under the glass, and on an item once it's found.
const COL = {
  'wall-living': { c: '#8d9a80', r: 0.95 },
  'wall-dining': { c: '#7a4136', r: 0.95 },
  'wall-bed': { c: '#cbb1a6', r: 0.95 },
  'wall-study': { c: '#5c6e7f', r: 0.95 },
  'wall-attic': { c: '#a9895f', r: 0.9 },
  trim: { c: '#efe9de', r: 0.7 },
  floor: { c: '#76502f', r: 0.5 },
  'floor-attic': { c: '#9a7a52', r: 0.8 },
  slab: { c: '#ebe5d9', r: 0.92 },
  roof: { c: '#4d3f36', r: 0.85 },
  brick: { c: '#98543e', r: 0.92 },
  plinth: { c: '#2b221c', r: 0.55 },
  marble: { c: '#e6e1d8', r: 0.3 },
  firebox: { c: '#1a1613', r: 0.95 },
  'wood-dark': { c: '#472c1d', r: 0.45 },
  'wood-mid': { c: '#7d5536', r: 0.5 },
  'wood-light': { c: '#b28b5e', r: 0.6 },
  sofa: { c: '#3d4f66', r: 1 },
  armchair: { c: '#94653f', r: 0.95 },
  cushion: { c: '#c8b38a', r: 1 },
  rug: { c: '#873a2e', r: 1 },
  'rug-2': { c: '#2e4858', r: 1 },
  'rug-3': { c: '#b59a6a', r: 1 },
  bedding: { c: '#ece6da', r: 1 },
  blanket: { c: '#6d7d5b', r: 1 },
  shade: { c: '#eedfbf', r: 0.9, glow: '#ffb35a' },
  bulb: { c: '#fff1cf', r: 0.4, glow: '#ffd08a' },
  brass: { c: '#b68e3d', r: 0.3, m: 1 },
  iron: { c: '#252525', r: 0.55, m: 0.5 },
  glass: { c: '#cfe0e6', r: 0.05, glass: true },
  frame: { c: '#3a2a20', r: 0.5 },
  mat: { c: '#f1ebdd', r: 0.9 },
  'book-0': { c: '#6b2a24', r: 0.8 }, 'book-1': { c: '#2c3e50', r: 0.8 }, 'book-2': { c: '#8a6a3a', r: 0.8 },
  'book-3': { c: '#3e5641', r: 0.8 }, 'book-4': { c: '#d8cfb8', r: 0.8 }, 'book-5': { c: '#5a4a6a', r: 0.8 },
  carton: { c: '#b6956d', r: 1 },
  form: { c: '#d7c9b1', r: 1 },
  silver: { c: '#dedcd6', r: 0.16, m: 1 },
  rookwood: { c: '#5a3a1a', r: 0.12, coat: true },
  tiffany: { c: '#365a50', r: 0.22, m: 0.35, irid: true },
  agate: { c: '#c7a078', r: 0.25, coat: true },
  bronze: { c: '#5e4a2c', r: 0.42, m: 1 },
  print: { c: '#ffffff', r: 0.9, tex: 'print' },
  imari: { c: '#ffffff', r: 0.25, tex: 'imari' },
  porcelain: { c: '#f2f0e9', r: 0.2 },
  singer: { c: '#131313', r: 0.22, m: 0.25 },
  chrome: { c: '#d2d2cf', r: 0.2, m: 1 },
  leather: { c: '#1b1b1b', r: 0.7 },
  watch: { c: '#d8d4cb', r: 0.2, m: 1 },
  jbox: { c: '#3a2116', r: 0.35 },
  lining: { c: '#6b1f2b', r: 1 },
  trunk: { c: '#583922', r: 0.6 },
  letters: { c: '#ede3cb', r: 1 },
  ribbon: { c: '#8a2a2a', r: 0.8 },
};

const BASS = ['#dcc39c', '#d6bb93', '#dfc8a4', '#d2b78e'];

function luminance(hex) {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function grainTexture(seed) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 512);
  const r = rng(seed);
  for (let i = 0; i < 260; i++) {
    const y = r() * 512;
    g.strokeStyle = `rgba(110,80,45,${0.025 + r() * 0.06})`;
    g.lineWidth = 0.4 + r() * 1.4;
    g.beginPath();
    g.moveTo(0, y);
    const amp = r() * 3;
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * amp);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------------------------------------------------------------- the look
const LOOK = {
  tone: THREE.NeutralToneMapping, exposure: 1.0,
  hemi: [0xffffff, 0xd2cabd, 1.15], sun: [0xfff4e6, 2.7], env: 0.55, loupeEnv: 0.75,
  shadow: 0.22, loupeBg: '#efede8',
};

// ---------------------------------------------------------------- the house
export function createHouse(container, opts = {}) {
  const listeners = {};
  const emit = (n, ...a) => (listeners[n] || []).forEach((f) => f(...a));
  const api = { on: (n, f) => ((listeners[n] ||= []).push(f), api) };

  const coarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dprCap = coarse ? 1.6 : 1.75;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'pan-y';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const texLoader = new THREE.TextureLoader();
  const TEX = {};
  const loadTex = (k, url) => {
    TEX[k] = texLoader.load(url, () => markDirty());
    TEX[k].colorSpace = THREE.SRGBColorSpace;
    TEX[k].anisotropy = 8;
  };
  loadTex('print', opts.printUrl || '/home/PP-02-front.jpg');
  loadTex('imari', opts.imariUrl || '/home/CD-08-front.jpg');
  TEX.imari.repeat.set(0.84, 0.9); TEX.imari.offset.set(0.08, 0.05);
  const GRAIN = grainTexture(5);

  // ------------------------------------------------ materials
  const cache = new Map();
  function colourMat(kind, glow) {
    const d = COL[kind] || COL['wood-mid'];
    const o = { color: d.c, roughness: d.r ?? 0.7, metalness: d.m ?? 0 };
    if (d.tex) o.map = TEX[d.tex];
    let m;
    if (d.irid) m = new THREE.MeshPhysicalMaterial({ ...o, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [200, 900], clearcoat: 0.7, clearcoatRoughness: 0.15 });
    else if (d.coat) m = new THREE.MeshPhysicalMaterial({ ...o, clearcoat: 1, clearcoatRoughness: 0.08 });
    else if (d.glass) m = new THREE.MeshPhysicalMaterial({ ...o, transparent: true, opacity: 0.16, depthWrite: false });
    else m = new THREE.MeshStandardMaterial(o);
    if (glow && d.glow) { m.emissive = new THREE.Color(d.glow); m.emissiveIntensity = 2.4; }
    return m;
  }
  function maquetteMat(kind, tint, isItem) {
    if (kind === 'plinth') return new THREE.MeshStandardMaterial({ color: '#3a2b21', roughness: 0.55 });
    if (kind === 'glass') return new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false });
    if (kind.startsWith('wall') || ['slab', 'trim', 'roof', 'brick', 'mat', 'marble', 'firebox'].includes(kind)) {
      return new THREE.MeshStandardMaterial({ color: kind === 'firebox' ? '#d9d5cc' : '#f2efe9', roughness: 0.95 });
    }
    if (kind.startsWith('floor')) return new THREE.MeshStandardMaterial({ color: '#cdb088', roughness: 0.85, map: GRAIN });
    return new THREE.MeshStandardMaterial({ color: isItem ? '#e7d6b6' : BASS[tint % BASS.length], roughness: 0.82, map: GRAIN });
  }
  function matFor(set, mesh, stencil = false) {
    const { kind, tint = 0, item, double } = mesh.userData;
    const key = `${set}|${kind}|${tint}|${item ? 1 : 0}|${stencil ? 1 : 0}|${double ? 1 : 0}`;
    let m = cache.get(key);
    if (!m) {
      if (set === 'maquette') m = maquetteMat(kind, tint, !!item);
      else m = colourMat(kind, false);
      if (double) m.side = THREE.DoubleSide;
      if (stencil) {
        m.stencilWrite = true; m.stencilRef = 1; m.stencilFunc = THREE.EqualStencilFunc;
        m.stencilFail = m.stencilZFail = m.stencilZPass = THREE.KeepStencilOp;
      }
      cache.set(key, m);
    }
    return m;
  }

  // ------------------------------------------------ geometry helpers
  const root = new THREE.Group();
  scene.add(root);
  const meshes = [];
  const occluders = [];
  function add(parent, geo, kind, x, y, z, o = {}) {
    const m = new THREE.Mesh(geo);
    m.userData.kind = kind;
    m.userData.tint = o.tint ?? Math.floor(rnd() * 4);
    if (o.double) m.userData.double = true;
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    if (o.sx) m.scale.x = o.sx;
    if (o.sz) m.scale.z = o.sz;
    m.castShadow = o.cast ?? true;
    m.receiveShadow = true;
    parent.add(m);
    meshes.push(m);
    if (o.occ) occluders.push(m);
    return m;
  }
  const grp = (parent, x = 0, y = 0, z = 0, ry = 0, s = 1) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g); return g;
  };
  const B = (p, w, h, d, kind, x, y, z, o) => add(p, new THREE.BoxGeometry(w, h, d), kind, x, y + h / 2, z, o);
  const RB = (p, w, h, d, r, kind, x, y, z, o) => add(p, new RoundedBoxGeometry(w, h, d, 3, r), kind, x, y + h / 2, z, o);
  const C = (p, rt, rb, h, kind, x, y, z, o, seg = 28) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), kind, x, y + h / 2, z, o);
  const L = (p, prof, kind, x, y, z, o = {}, seg = 44) =>
    add(p, new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg), kind, x, y, z, { double: true, ...o });
  const S = (p, r, kind, x, y, z, o) => add(p, new THREE.SphereGeometry(r, 20, 14), kind, x, y, z, o);
  const T = 0.2;
  function wallShape(x0, x1, y0, y1, holes = []) {
    const s = new THREE.Shape();
    s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath();
    for (const [a, b, c, d] of holes) {
      const h = new THREE.Path(); h.moveTo(a, b); h.lineTo(a, d); h.lineTo(c, d); h.lineTo(c, b); h.closePath(); s.holes.push(h);
    }
    return s;
  }
  function doorShape(u0, u1, y0, y1, d0, d1, dh) {
    const s = new THREE.Shape();
    s.moveTo(u0, y0); s.lineTo(d0, y0); s.lineTo(d0, y0 + dh); s.lineTo(d1, y0 + dh); s.lineTo(d1, y0); s.lineTo(u1, y0);
    s.lineTo(u1, y1); s.lineTo(u0, y1); s.closePath();
    return s;
  }
  const ext = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });

  // ------------------------------------------------ items registry
  const ITEMS = [];
  function item(id, group, o = {}) {
    const it = { id, group, pickable: !o.hidden, hidden: !!o.hidden, container: !!o.container, inner: o.inner, lid: o.lid, lidAxis: o.lidAxis, lidOpen: o.lidOpen, found: false, opened: false, pad: o.pad ?? 0.1 };
    ITEMS.push(it);
    group.traverse((m) => { if (m.isMesh) { m.userData.item = id; m.userData.itemRef = it; } });
    return it;
  }

  // ------------------------------------------------ build
  // A shallow doll's house: back wall at z = -D, open front at z = +D, open right side at x = 5.
  const D = 2.3, U = 3.2, A = 6.4, RH = 2.3;
  B(root, 12.2, 0.42, 2 * D + 2.4, 'plinth', -0.1, -0.66, -0.1, { occ: true });
  const slab = (y, floorKind) => {
    B(root, 10.2, 0.18, 2 * D + 0.2, 'slab', -0.1, y, -0.1, { occ: true });
    B(root, 10.2, 0.04, 2 * D + 0.2, floorKind, -0.1, y + 0.18, -0.1, { occ: true, cast: false });
  };
  slab(-0.22, 'floor');
  slab(U - 0.2, 'floor');
  slab(A - 0.2, 'floor-attic');

  // back wall (inner face z = -D)
  const back = (x0, x1, y0, y1, holes, kind) => add(root, ext(wallShape(x0, x1, y0, y1, holes), T), kind, 0, 0, -D - T, { occ: true });
  back(-5.2, 0.6, 0, U, [[-2.6, 0.95, -1.4, 2.45]], 'wall-living');
  back(0.6, 5.0, 0, U, [[3.9, 0.95, 4.7, 2.45]], 'wall-dining');
  back(-5.2, 0.6, U, A, [[-1.7, U + 0.95, -0.7, U + 2.35]], 'wall-bed');
  back(0.6, 5.0, U, A, [[2.6, U + 0.95, 3.8, U + 2.35]], 'wall-study');
  // left wall (inner face x = -5)
  const left = (shape, kind) => add(root, ext(shape, T), kind, -5, 0, 0, { ry: -PI / 2, occ: true });
  left(wallShape(-D - T, D, 0, U), 'wall-living');
  left(wallShape(-D - T, D, U, A, [[1.3, U + 0.95, 2.0, U + 2.35]]), 'wall-bed');
  const gable = new THREE.Shape();
  gable.moveTo(-D - T, A); gable.lineTo(D, A); gable.lineTo(-0.1, A + RH); gable.closePath();
  left(gable, 'wall-attic');
  // partition (x = 0.6), door near the back
  const part = (shape, kind) => add(root, ext(shape, 0.12), kind, 0.66, 0, 0, { ry: -PI / 2, occ: true });
  part(doorShape(-D, D, 0, U - 0.2, -1.95, -1.05, 2.2), 'wall-dining');
  part(doorShape(-D, D, U, A - 0.2, -1.95, -1.05, 2.2), 'wall-study');
  // roof: the back slope only
  {
    const z0 = -D - T - 0.3, y0 = A - 0.25, z1 = -0.1, y1 = A + RH;
    const dz = z1 - z0, dy = y1 - y0, len = Math.hypot(dz, dy), ang = Math.atan2(dy, dz);
    const nz = -Math.sin(ang), ny = Math.cos(ang);
    B(root, 10.5, 0.2, len, 'roof', -0.25, (y0 + y1) / 2 + ny * 0.1 - 0.1, (z0 + z1) / 2 + nz * 0.1, { rx: -ang, occ: true });
    B(root, 10.3, 0.16, 0.16, 'wood-dark', -0.1, A + RH - 0.12, -0.1);
  }
  B(root, 0.6, RH + 1.3, 0.75, 'brick', -4.7, A, -1.2);

  // windows: glass + a cross bar + sill
  const pane = (x0, x1, y0, y1) => {
    const cx = (x0 + x1) / 2, w = x1 - x0, h = y1 - y0;
    B(root, w, h, 0.02, 'glass', cx, y0, -D - 0.1, { cast: false });
    B(root, 0.05, h, 0.06, 'trim', cx, y0, -D - 0.08);
    B(root, w, 0.05, 0.06, 'trim', cx, y0 + h / 2, -D - 0.08);
    B(root, w + 0.16, 0.06, 0.2, 'trim', cx, y0 - 0.06, -D + 0.05);
  };
  pane(-2.6, -1.4, 0.95, 2.45);
  pane(3.9, 4.7, 0.95, 2.45);
  pane(-1.7, -0.7, U + 0.95, U + 2.35);
  pane(2.6, 3.8, U + 0.95, U + 2.35);
  {
    const g = grp(root, -5, 0, 0, PI / 2);
    B(g, 0.7, 1.4, 0.02, 'glass', -1.65, U + 0.95, 0.1, { cast: false });
    B(g, 0.7, 0.05, 0.06, 'trim', -1.65, U + 1.65, 0.12);
  }

  // ---- furniture builders (built facing +z, rotated into place)
  function legs(g, w, d, h, kind, inset = 0.05, r = 0.025) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) C(g, r, r * 0.8, h, kind, sx * (w / 2 - inset), 0, sz * (d / 2 - inset));
  }
  function table(p, x, z, w, d, h, kind, y0 = 0, ry = 0) {
    const g = grp(p, x, y0, z, ry);
    B(g, w, 0.05, d, kind, 0, h - 0.05, 0);
    legs(g, w, d, h - 0.05, kind, 0.08, 0.03);
    return g;
  }
  function chair(p, x, z, ry, y0 = 0, seat = 'armchair', wood = 'wood-mid') {
    const g = grp(p, x, y0, z, ry);
    legs(g, 0.44, 0.44, 0.44, wood, 0.03, 0.018);
    RB(g, 0.46, 0.07, 0.46, 0.02, seat, 0, 0.42, 0);
    B(g, 0.44, 0.55, 0.04, wood, 0, 0.48, -0.21);
    return g;
  }
  function sofa(p, x, z, w, ry = 0, y0 = 0, kind = 'sofa') {
    const g = grp(p, x, y0, z, ry);
    legs(g, w - 0.1, 0.75, 0.1, 'wood-dark', 0.05, 0.025);
    RB(g, w, 0.24, 0.86, 0.04, kind, 0, 0.1, 0);
    const n = w > 1.4 ? 2 : 1;
    for (let i = 0; i < n; i++) RB(g, (w - 0.4) / n - 0.02, 0.14, 0.62, 0.05, kind, -((w - 0.4) / 2) + ((w - 0.4) / n) * (i + 0.5), 0.33, 0.08);
    RB(g, w, 0.5, 0.22, 0.06, kind, 0, 0.33, -0.33);
    for (const s of [-1, 1]) RB(g, 0.2, 0.32, 0.86, 0.06, kind, s * (w / 2 - 0.1), 0.33, 0);
    if (n === 2) for (const s of [-1, 1]) RB(g, 0.34, 0.3, 0.1, 0.04, 'cushion', s * (w / 2 - 0.42), 0.5, -0.18, { ry: s * 0.15 });
    return g;
  }
  function cabinet(p, x, z, w, h, d, ry, y0, kind, drawers = 3) {
    const g = grp(p, x, y0, z, ry);
    B(g, w, h - 0.1, d, kind, 0, 0.1, 0);
    B(g, w + 0.04, 0.04, d + 0.04, kind, 0, h - 0.02, 0);
    legs(g, w - 0.04, d - 0.04, 0.1, kind, 0.04, 0.025);
    const dh = (h - 0.16) / drawers;
    for (let i = 0; i < drawers; i++) {
      B(g, w - 0.08, dh - 0.04, 0.02, 'wood-mid', 0, 0.13 + i * dh, d / 2 + 0.01);
      S(g, 0.018, 'brass', -w / 4, 0.13 + i * dh + dh / 2, d / 2 + 0.03);
      S(g, 0.018, 'brass', w / 4, 0.13 + i * dh + dh / 2, d / 2 + 0.03);
    }
    return g;
  }
  function books(g, x0, x1, y, depth, z, seedRnd) {
    let x = x0;
    while (x < x1 - 0.05) {
      const w = 0.035 + seedRnd() * 0.05;
      const h = 0.22 + seedRnd() * 0.12;
      if (seedRnd() < 0.08) { x += w * 1.5; continue; }
      B(g, w, h, depth * (0.75 + seedRnd() * 0.2), 'book-' + Math.floor(seedRnd() * 6), x + w / 2, y, z, { cast: false });
      x += w + 0.004;
    }
  }
  function bookcase(p, x, z, w, h, d, ry, y0, shelves, kind = 'wood-dark', half = []) {
    const g = grp(p, x, y0, z, ry);
    const r = rng(Math.floor(Math.abs(x * 100 + z * 10)) + 3);
    for (const s of [-1, 1]) B(g, 0.04, h, d, kind, s * (w / 2 - 0.02), 0, 0);
    B(g, w, 0.04, d, kind, 0, h - 0.04, 0);
    B(g, w - 0.08, h, 0.02, kind, 0, 0, -d / 2 + 0.01);
    const step = h / shelves;
    for (let i = 0; i < shelves; i++) {
      const y = 0.06 + i * step;
      B(g, w - 0.08, 0.03, d - 0.02, kind, 0, y - 0.03, 0);
      books(g, -w / 2 + 0.05, half.includes(i) ? -0.02 : w / 2 - 0.05, y, d - 0.06, 0.0, r);
    }
    return g;
  }
  const lampSpots = [];
  function lamp(p, x, y, z, h, shadeR = 0.2, kind = 'brass') {
    const g = grp(p, x, y, z);
    C(g, 0.13, 0.15, 0.03, kind, 0, 0, 0);
    C(g, 0.014, 0.014, h, kind, 0, 0.03, 0);
    L(g, [[shadeR, 0], [shadeR * 0.66, shadeR * 1.3]], 'shade', 0, h - shadeR * 0.6, 0);
    lampSpots.push(new THREE.Vector3(x, y + h - shadeR * 0.3, z));
    return g;
  }

  // ================= GROUND FLOOR: living room (x -5..0.54)
  B(root, 2.8, 0.02, 2.0, 'rug', -2.5, 0, -0.2, { cast: false });
  const FZ = -0.65; // fireplace centre on the left wall
  {
    const g = grp(root, -5, 0, FZ);
    B(g, 0.5, 1.0, 0.42, 'marble', 0.25, 0, -0.79);
    B(g, 0.5, 1.0, 0.42, 'marble', 0.25, 0, 0.79);
    B(g, 0.5, 0.5, 2.0, 'marble', 0.25, 1.0, 0);
    B(g, 0.2, 1.0, 1.2, 'firebox', 0.1, 0, 0);
    B(g, 0.78, 0.07, 2.25, 'marble', 0.39, 1.5, 0);
    B(g, 0.42, 1.43, 1.8, 'wall-living', 0.21, 1.57, 0);
    B(g, 0.95, 0.04, 1.6, 'marble', 0.475, 0, 0, { cast: false });
    C(g, 0.012, 0.012, 0.7, 'iron', 0.58, 0.04, 1.15);
    B(g, 0.3, 0.12, 0.2, 'iron', 0.62, 0.04, -1.05);
  }
  sofa(root, -2.4, -1.85, 2.0);
  table(root, -2.4, -0.55, 1.1, 0.55, 0.42, 'wood-dark');
  sofa(root, -3.95, 1.35, 0.95, -PI / 2 + 0.55, 0, 'armchair');
  lamp(root, -0.45, 0, -1.95, 1.55, 0.22);
  bookcase(root, -4.15, -D + 0.18, 1.3, 2.0, 0.36, 0, 0, 4, 'wood-dark', [1]);
  // the print on the left wall
  {
    const g = grp(root, -5, 1.25, 1.5, PI / 2);
    B(g, 0.98, 0.8, 0.04, 'frame', 0, 0, 0.02);
    add(g, new THREE.PlaneGeometry(0.86, 0.66), 'print', 0, 0.4, 0.045, { cast: false });
    item('print', g, { pad: 0.08 });
  }
  // mantel: clock, candlesticks, Rookwood vase
  {
    const y = 1.57;
    const clock = grp(root, -4.45, y, FZ + 0.45);
    B(clock, 0.16, 0.3, 0.3, 'wood-dark', 0, 0, 0);
    C(clock, 0.1, 0.1, 0.02, 'porcelain', 0.08, 0.15, 0, { rz: PI / 2 });
    for (const dz of [-1.0, 0.95]) L(root, [[0.05, 0], [0.02, 0.02], [0.015, 0.2], [0.03, 0.22], [0.012, 0.22], [0.012, 0.28]], 'brass', -4.4, y, FZ + dz, {}, 20);
    const v = grp(root, -4.42, y, FZ - 0.42, 0, 1.35);
    L(v, [[0, 0], [0.05, 0], [0.075, 0.015], [0.088, 0.045], [0.085, 0.075], [0.06, 0.105], [0.03, 0.135], [0.02, 0.18], [0.021, 0.22], [0.03, 0.25], [0.048, 0.275], [0.044, 0.275], [0.028, 0.25]], 'rookwood', 0, 0, 0);
    item('rookwood', v);
  }
  // Tiffany vase on the coffee table
  {
    const v = grp(root, -2.25, 0.42, -0.55, 0, 1.4);
    L(v, [[0, 0], [0.045, 0], [0.085, 0.04], [0.105, 0.11], [0.098, 0.18], [0.062, 0.235], [0.042, 0.255], [0.048, 0.268], [0.04, 0.268]], 'tiffany', 0, 0, 0);
    item('tiffany', v);
  }
  // bronze on the bookcase's second shelf, in the gap beside the books
  {
    const g = grp(root, -3.82, 0.56, -D + 0.18, 0, 1.5);
    B(g, 0.12, 0.025, 0.09, 'bronze', 0, 0, 0);
    L(g, [[0, 0], [0.045, 0], [0.05, 0.05], [0.046, 0.12], [0.04, 0.17], [0.03, 0.2], [0, 0.2]], 'bronze', 0, 0.025, 0, {}, 18);
    S(g, 0.024, 'bronze', 0, 0.25, 0.005);
    item('bronze', g, { pad: 0.08 });
  }

  // ================= GROUND FLOOR: dining room (x 0.66..5)
  B(root, 2.6, 0.02, 1.7, 'rug-2', 2.95, 0, 0.35, { cast: false });
  table(root, 2.95, 0.35, 1.9, 1.0, 0.76, 'wood-mid');
  for (const [x, z, ry] of [[2.45, -0.45, 0], [3.45, -0.45, 0], [2.45, 1.15, PI], [3.45, 1.15, PI]]) chair(root, x, z, ry);
  cabinet(root, 2.7, -D + 0.26, 2.2, 0.9, 0.5, 0, 0, 'wood-dark', 2);
  // china cabinet on the partition, facing +x
  {
    const g = grp(root, 0.66 + 0.23, 0, 1.05, PI / 2);
    const w = 1.4, h = 2.15, d = 0.44;
    for (const s of [-1, 1]) B(g, 0.05, h, d, 'wood-dark', s * (w / 2 - 0.025), 0, 0);
    B(g, w, 0.06, d, 'wood-dark', 0, h - 0.06, 0);
    B(g, w, 0.7, d, 'wood-dark', 0, 0, 0);
    B(g, w - 0.1, h - 0.1, 0.02, 'wood-dark', 0, 0, -d / 2 + 0.01);
    B(g, w - 0.1, 0.03, d - 0.04, 'wood-dark', 0, 1.42, 0);
    B(g, w - 0.1, h - 0.76, 0.015, 'glass', 0, 0.7, d / 2 - 0.01, { cast: false });
    for (const x of [-0.35, 0.35]) L(g, [[0, 0], [0.07, 0], [0.13, 0.015], [0.14, 0.02]], 'porcelain', x, 1.45, -0.1, { rx: -1.25 }, 32);
    const dish = grp(g, 0, 0.72, -0.08);
    C(dish, 0.01, 0.01, 0.12, 'brass', 0, 0, -0.03, { rx: 0.35 });
    const plate = grp(dish, 0, 0.17, 0.0);
    plate.rotation.x = -1.25;
    L(plate, [[0, 0], [0.09, 0], [0.15, 0.018], [0.165, 0.026]], 'porcelain', 0, 0, 0, {}, 40);
    add(plate, new THREE.CircleGeometry(0.15, 48), 'imari', 0, 0.022, 0, { rx: -PI / 2, cast: false });
    plate.scale.setScalar(1.25);
    item('imari', dish, { pad: 0.08 });
  }
  {
    const g = grp(root, 2.95, 0, 0.35);
    C(g, 0.006, 0.006, 0.62, 'iron', 0, 2.38, 0, { cast: false });
    L(g, [[0.04, 0.14], [0.2, 0.0], [0.22, -0.01]], 'shade', 0, 2.24, 0, {}, 36);
    S(g, 0.04, 'bulb', 0, 2.25, 0, { cast: false });
    lampSpots.push(new THREE.Vector3(2.95, 2.15, 0.35));
  }
  {
    const g = grp(root, 2.1, 0.92, -D + 0.28, 0, 1.3);
    L(g, [[0, 0], [0.085, 0], [0.09, 0.018], [0.1, 0.035], [0.13, 0.065], [0.155, 0.085], [0.165, 0.088]], 'silver', 0, 0, 0, { sx: 1.35 });
    add(g, new THREE.TorusGeometry(0.15, 0.006, 6, 32, PI), 'silver', 0, 0.085, 0, { sx: 1.25 });
    item('basket', g);
  }
  {
    const g = grp(root, 3.3, 0.92, -D + 0.3, -0.5, 1.3);
    L(g, [[0, 0], [0.05, 0], [0.085, 0.025], [0.1, 0.07], [0.095, 0.115], [0.065, 0.145], [0.045, 0.155], [0.05, 0.16], [0, 0.17]], 'agate', 0, 0, 0);
    add(g, new THREE.CylinderGeometry(0.008, 0.016, 0.12, 10), 'agate', 0.12, 0.1, 0, { rz: -0.9 });
    add(g, new THREE.TorusGeometry(0.045, 0.008, 6, 20, PI * 1.3), 'agate', -0.1, 0.085, 0, { rz: 1.2 });
    S(g, 0.015, 'agate', 0, 0.18, 0);
    item('teapot', g);
  }

  // ================= UPPER FLOOR: bedroom (x -5..0.54)
  B(root, 2.0, 0.02, 1.5, 'rug-3', -2.6, U, 0.6, { cast: false });
  {
    const g = grp(root, -3.0, U, -D + 1.08);
    B(g, 1.62, 0.28, 2.1, 'wood-dark', 0, 0.1, 0);
    legs(g, 1.62, 2.1, 0.1, 'wood-dark', 0.05, 0.03);
    RB(g, 1.52, 0.22, 2.0, 0.06, 'bedding', 0, 0.36, 0.02);
    RB(g, 1.56, 0.07, 1.3, 0.03, 'blanket', 0, 0.56, 0.38);
    for (const s of [-1, 1]) RB(g, 0.62, 0.13, 0.36, 0.06, 'bedding', s * 0.38, 0.57, -0.72);
    B(g, 1.72, 1.05, 0.08, 'wood-dark', 0, 0, -1.04);
    B(g, 1.72, 0.55, 0.06, 'wood-dark', 0, 0, 1.03);
  }
  cabinet(root, -1.85, -D + 0.22, 0.46, 0.56, 0.4, 0, U, 'wood-mid', 2);
  lamp(root, -1.85, U + 0.58, -D + 0.22, 0.38, 0.13);
  B(root, 0.42, A - U - 0.2, 1.6, 'wall-bed', -4.79, U, FZ);
  cabinet(root, -5 + 0.23, 1.25, 1.3, 0.92, 0.45, PI / 2, U, 'wood-mid', 3);
  chair(root, -0.75, 1.5, -PI / 2 - 0.4, U);
  {
    const g = grp(root, -4.78, U + 0.94, 0.95, 0, 1.35);
    B(g, 0.18, 0.014, 0.26, 'jbox', 0, 0, 0);
    for (const s of [-1, 1]) { B(g, 0.18, 0.09, 0.012, 'jbox', 0, 0, s * 0.124); B(g, 0.012, 0.09, 0.26, 'jbox', s * 0.084, 0, 0); }
    B(g, 0.156, 0.004, 0.236, 'lining', 0, 0.014, 0, { cast: false });
    const pivot = grp(g, -0.09, 0.09, 0);
    B(pivot, 0.18, 0.035, 0.26, 'jbox', 0.09, 0, 0);
    const box = item('jbox', g, { container: true, inner: 'watch', lid: pivot, lidAxis: 'z', lidOpen: 1.95 });
    const w = grp(g, 0.01, 0.019, 0.0);
    C(w, 0.045, 0.045, 0.014, 'watch', 0, 0, 0);
    C(w, 0.037, 0.037, 0.016, 'porcelain', 0, 0.001, 0, { cast: false });
    add(w, new THREE.TorusGeometry(0.01, 0.003, 6, 12), 'watch', 0, 0.007, 0.055, { rx: PI / 2 });
    C(w, 0.006, 0.006, 0.008, 'watch', 0, 0.004, 0.047, { rx: PI / 2 });
    const watch = item('watch', w, { hidden: true, pad: 0.05 });
    box.innerItem = watch;
  }

  // ================= UPPER FLOOR: study (x 0.66..5)
  B(root, 2.2, 0.02, 1.5, 'rug', 3.0, U, 0.5, { cast: false });
  bookcase(root, 4.45, -D + 0.18, 0.9, 2.35, 0.36, 0, U, 5, 'wood-mid');
  {
    const g = table(root, 0.66 + 0.36, 1.0, 1.5, 0.7, 0.76, 'wood-dark', U, PI / 2);
    B(g, 0.4, 0.5, 0.62, 'wood-dark', 0.5, 0.2, 0);
  }
  chair(root, 1.7, 1.0, -PI / 2, U);
  {
    const g = grp(root, 0.86, U + 0.76, 0.42);
    C(g, 0.07, 0.08, 0.02, 'brass', 0, 0, 0);
    C(g, 0.008, 0.008, 0.36, 'brass', 0, 0.02, 0, { rz: 0.25 });
    L(g, [[0.03, 0.05], [0.09, -0.04]], 'shade', -0.08, 0.36, 0, { rz: 0.4 }, 24);
    lampSpots.push(new THREE.Vector3(0.82, U + 1.05, 0.42));
  }
  {
    const g = grp(root, 3.2, U, -D + 0.24);
    B(g, 1.02, 0.05, 0.46, 'wood-mid', 0, 0.74, 0);
    for (const s of [-1, 1]) {
      B(g, 0.3, 0.32, 0.42, 'wood-mid', s * 0.34, 0.42, 0);
      for (let i = 0; i < 2; i++) S(g, 0.012, 'brass', s * 0.34, 0.5 + i * 0.15, 0.22);
      B(g, 0.04, 0.42, 0.04, 'iron', s * 0.34, 0, -0.17);
      B(g, 0.04, 0.42, 0.04, 'iron', s * 0.34, 0, 0.17);
      B(g, 0.04, 0.04, 0.38, 'iron', s * 0.34, 0.02, 0);
    }
    B(g, 0.46, 0.025, 0.24, 'iron', 0, 0.09, 0.05, { rx: -0.12 });
    add(g, new THREE.TorusGeometry(0.15, 0.015, 6, 28), 'iron', 0.36, 0.3, 0.0, { ry: PI / 2 });
    const head = grp(g, 0.0, 0.79, 0.02);
    B(head, 0.4, 0.035, 0.18, 'singer', 0, 0, 0);
    B(head, 0.08, 0.2, 0.08, 'singer', 0.13, 0.035, 0);
    B(head, 0.34, 0.075, 0.085, 'singer', -0.01, 0.2, 0);
    B(head, 0.075, 0.16, 0.085, 'singer', -0.15, 0.11, 0);
    C(head, 0.004, 0.004, 0.06, 'chrome', -0.15, 0.06, 0.02);
    add(head, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 24), 'chrome', 0.19, 0.24, 0, { rx: PI / 2 });
    item('singer', g, { pad: 0.06 });
  }
  {
    const g = grp(root, 1.1, U + 0.76, 1.3, PI / 2 - 0.3, 1.7);
    B(g, 0.14, 0.055, 0.034, 'leather', 0, 0, 0);
    B(g, 0.14, 0.016, 0.034, 'chrome', 0, 0.055, 0);
    C(g, 0.012, 0.012, 0.01, 'chrome', -0.04, 0.071, 0);
    C(g, 0.012, 0.012, 0.01, 'chrome', 0.045, 0.071, 0);
    add(g, new THREE.CylinderGeometry(0.019, 0.019, 0.03, 20), 'chrome', 0, 0.03, 0.03, { rx: PI / 2 });
    item('leica', g, { pad: 0.07 });
  }

  // ================= ATTIC
  {
    const g = grp(root, -1.3, A, 0.95);
    B(g, 1.0, 0.03, 0.55, 'trunk', 0, 0, 0);
    for (const s of [-1, 1]) { B(g, 1.0, 0.48, 0.03, 'trunk', 0, 0, s * 0.26); B(g, 0.03, 0.48, 0.55, 'trunk', s * 0.485, 0, 0); }
    for (const x of [-0.3, 0.3]) for (const s of [-1, 1]) B(g, 0.05, 0.49, 0.01, 'brass', x, 0, s * 0.28, { cast: false });
    B(g, 0.08, 0.08, 0.02, 'brass', 0, 0.36, 0.285);
    const pivot = grp(g, 0, 0.48, -0.275);
    add(pivot, new THREE.CylinderGeometry(0.275, 0.275, 1.0, 28, 1, false, 0, PI), 'trunk', 0, 0, 0.275, { rz: PI / 2 });
    const trunk = item('trunk', g, { container: true, inner: 'letters', lid: pivot, lidAxis: 'x', lidOpen: -1.85 });
    const l = grp(g, -0.1, 0.03, 0.02);
    for (let i = 0; i < 5; i++) B(l, 0.24 - i * 0.004, 0.022, 0.16, 'letters', (rnd() - 0.5) * 0.02, i * 0.022, (rnd() - 0.5) * 0.02, { ry: (rnd() - 0.5) * 0.12 });
    B(l, 0.02, 0.115, 0.165, 'ribbon', 0.0, 0, 0);
    B(l, 0.245, 0.115, 0.02, 'ribbon', 0.0, 0, 0);
    const letters = item('letters', l, { hidden: true, pad: 0.06 });
    trunk.innerItem = letters;
  }
  {
    const g = grp(root, -3.4, A, 0.6, 0.2);
    B(g, 0.7, 0.45, 0.55, 'carton', 0, 0, 0);
    B(g, 0.55, 0.38, 0.45, 'carton', 0.05, 0.45, 0.02, { ry: 0.2 });
    B(g, 0.5, 0.35, 0.4, 'carton', 0.7, 0, 0.1, { ry: -0.15 });
  }
  {
    const g = grp(root, 1.2, A, 0.25);
    for (let i = 0; i < 3; i++) B(g, 0.03, 0.03, 0.34, 'wood-dark', Math.sin((i * 2 * PI) / 3) * 0.12, 0, Math.cos((i * 2 * PI) / 3) * 0.12, { ry: (i * 2 * PI) / 3 });
    C(g, 0.012, 0.012, 0.95, 'wood-dark', 0, 0, 0);
    L(g, [[0.04, 0], [0.17, 0.02], [0.15, 0.2], [0.17, 0.38], [0.11, 0.5], [0.05, 0.56], [0.03, 0.6], [0, 0.62]], 'form', 0, 0.82, 0, { sz: 0.75 });
  }
  {
    const g = grp(root, 3.0, A, 0.9, -0.7);
    chair(g, 0, 0, 0, 0.04, 'cushion', 'wood-light');
    for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.7, 0.015, 6, 24, 0.9), 'wood-light', s * 0.19, 0.72, 0.0, { ry: PI / 2, rz: -PI / 2 - 0.45 });
  }
  {
    const g = grp(root, 0.4, 0, -0.1);
    C(g, 0.004, 0.004, 0.5, 'iron', 0, A + RH - 0.7, 0, { cast: false });
    S(g, 0.045, 'bulb', 0, A + RH - 0.72, 0, { cast: false });
    lampSpots.push(new THREE.Vector3(0.4, A + RH - 0.85, -0.1));
  }
  B(root, 1.1, 0.02, 0.8, 'rug-3', 2.7, A, -1.0, { cast: false, ry: 0.3 });

  // ------------------------------------------------ proxies for picking
  root.updateMatrixWorld(true);
  const tmpB = new THREE.Box3(), tmpV = new THREE.Vector3(), tmpC = new THREE.Vector3();
  for (const it of ITEMS) {
    tmpB.setFromObject(it.group);
    tmpB.expandByScalar(it.pad);
    tmpB.getSize(tmpV); tmpB.getCenter(tmpC);
    const px = new THREE.Mesh(new THREE.BoxGeometry(tmpV.x, tmpV.y, tmpV.z));
    px.position.copy(tmpC);
    px.visible = false;
    px.userData.proxy = it;
    root.add(px);
    it.proxy = px;
    it.anchor = new THREE.Vector3(tmpC.x, tmpB.max.y, tmpC.z);
  }

  // ------------------------------------------------ ground, lights
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.2 }));
  ground.rotation.x = -PI / 2;
  ground.position.y = -0.66;
  ground.receiveShadow = true;
  scene.add(ground);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(-7, 14, 12);
  sun.target.position.set(0, 3, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 2, far: 45 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);
  const lamps = lampSpots.map((p) => {
    const l = new THREE.PointLight(0xffb469, 0, 6.5, 1.6);
    l.position.copy(p);
    scene.add(l);
    return l;
  });

  // ------------------------------------------------ cameras, post
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const viewDir = new THREE.Vector3(0.504, 0.309, 0.807).normalize();
  const target = new THREE.Vector3(0, 4.2, 0);
  cam.position.copy(target).addScaledVector(viewDir, 60);
  cam.lookAt(target);
  cam.updateMatrixWorld(true);
  const loupeCam = cam.clone();

  // house bounds in camera space
  const hb = new THREE.Box3().setFromObject(root);
  const corners = [];
  for (const x of [hb.min.x, hb.max.x]) for (const y of [hb.min.y, hb.max.y]) for (const z of [hb.min.z, hb.max.z]) corners.push(new THREE.Vector3(x, y, z));
  const camInv = cam.matrixWorldInverse.clone();
  let cminX = Infinity, cmaxX = -Infinity, cminY = Infinity, cmaxY = -Infinity;
  for (const c of corners) { c.applyMatrix4(camInv); cminX = Math.min(cminX, c.x); cmaxX = Math.max(cmaxX, c.x); cminY = Math.min(cminY, c.y); cmaxY = Math.max(cmaxY, c.y); }
  const hw = cmaxX - cminX, hh = cmaxY - cminY, hcx = (cminX + cmaxX) / 2, hcy = (cminY + cmaxY) / 2;

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 }));
  composer.renderToScreen = false;
  const blit = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { t: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }',
    depthTest: false, depthWrite: false, blending: THREE.NoBlending,
  }));
  const renderPass = new RenderPass(scene, cam);
  const gtao = new GTAOPass(scene, cam, 2, 2);
  gtao.blendIntensity = 1.0;
  const output = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(gtao);
  composer.addPass(output);
  try {
    gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.0, scale: 1.0, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 8 });
  } catch (e) { /* older GTAOPass */ }

  // stencil circle for the loupe
  const stencilScene = new THREE.Scene();
  const stencilCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  const stencilMat = new THREE.MeshBasicMaterial({
    color: '#ffffff', depthTest: false, depthWrite: false, toneMapped: false,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), stencilMat);
  disc.position.z = -1;
  stencilScene.add(disc);

  // ------------------------------------------------ state
  const dir = 'maquette';
  let W = 1, H = 1;
  let layout = { x0: 0.38, x1: 0.98, y0: 0.12, y1: 0.98, zoom: 1 };
  let pan = new THREE.Vector2(0, 0), panTarget = new THREE.Vector2(0, 0);
  const loupe = { x: 0, y: 0, r: 92, zoom: 2.6, visible: true, fixed: coarse, tx: 0, ty: 0 };
  let parallax = 0, parallaxTarget = 0;
  let dirty = true, loupeDirty = true;
  let hover = null, progress = 0;
  const DWELL = 0.55;
  const anims = [];
  function markDirty() { dirty = true; }

  function applyMaterials() {
    const d = LOOK;
    restoreMats();
    scene.background = null;
    renderer.toneMapping = d.tone;
    renderer.toneMappingExposure = d.exposure;
    hemi.color.setHex(d.hemi[0]); hemi.groundColor.setHex(d.hemi[1]); hemi.intensity = d.hemi[2];
    sun.color.setHex(d.sun[0]); sun.intensity = d.sun[1];
    scene.environmentIntensity = d.env;
    lamps.forEach((l) => (l.intensity = 0));
    ground.material.opacity = d.shadow;
    gtao.enabled = true;
    stencilMat.color.set(d.loupeBg);
    renderer.shadowMap.needsUpdate = true;
    markDirty();
  }

  function setLayout(l) { layout = { ...layout, ...l }; fit(); }
  function fit() {
    const rw = (layout.x1 - layout.x0) * W, rh = (layout.y1 - layout.y0) * H;
    let s = Math.max(hw / rw, hh / rh) / layout.zoom; // world units per pixel
    const pcx = ((layout.x0 + layout.x1) / 2) * W, pcy = ((layout.y0 + layout.y1) / 2) * H;
    const left = hcx - pcx * s + pan.x, top = hcy + pcy * s + pan.y;
    cam.left = left; cam.right = left + W * s; cam.top = top; cam.bottom = top - H * s;
    cam.updateProjectionMatrix();
    api.unitsPerPx = s;
    markDirty();
  }
  function clampPan() {
    if (!coarse) return;
    const s = api.unitsPerPx || 0.01;
    const maxX = hw / 2 + 0.5, maxY = hh / 2 + 0.5;
    panTarget.x = Math.max(-maxX, Math.min(maxX, panTarget.x));
    panTarget.y = Math.max(-maxY, Math.min(maxY, panTarget.y));
  }

  function resize() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = W + 'px';
    renderer.domElement.style.height = H + 'px';
    composer.setSize(W, H);
    loupe.r = W < 640 ? 74 : 92;
    if (loupe.fixed) { loupe.x = W / 2; loupe.y = H * 0.34; }
    fit();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ------------------------------------------------ picking
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(x, y) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const targets = ITEMS.filter((i) => i.pickable).map((i) => i.proxy).concat(occluders);
    const hits = ray.intersectObjects(targets, false);
    for (const h of hits) {
      if (h.object.userData.proxy) return h.object.userData.proxy;
      return null;
    }
    return null;
  }

  // ------------------------------------------------ input
  const el = renderer.domElement;
  let drag = null;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) > 6) drag.moved = true;
        panTarget.x = drag.px - dx * api.unitsPerPx;
        clampPan();
      }
      return;
    }
    const r = el.getBoundingClientRect();
    loupe.x = e.clientX - r.left; loupe.y = e.clientY - r.top; loupe.visible = true;
    loupeDirty = true;
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') drag = { x: e.clientX, y: e.clientY, px: panTarget.x, moved: false };
  });
  const endDrag = (e) => {
    if (e.pointerType !== 'touch' || !drag) return;
    if (!drag.moved) {
      const r = el.getBoundingClientRect();
      const it = pickAt(e.clientX - r.left, e.clientY - r.top);
      if (it) glideTo(it);
    }
    drag = null;
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', () => (drag = null));

  const proj = new THREE.Vector3();
  function project(v) {
    proj.copy(v).applyMatrix4(root.matrixWorld).project(cam);
    return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H };
  }
  function glideTo(it) {
    const p = project(it.proxy.position);
    if (loupe.fixed) {
      panTarget.x += (p.x - loupe.x) * api.unitsPerPx;
      panTarget.y -= (p.y - loupe.y) * api.unitsPerPx;
      clampPan();
    } else {
      loupe.tx = p.x; loupe.ty = p.y; loupe.gliding = true;
    }
    markDirty();
  }

  // ------------------------------------------------ finding
  function find(it) {
    if (it.container) {
      if (it.opened) return;
      it.opened = true;
      it.pickable = false;
      anims.push({ t: 0, dur: 0.8, f: (k) => { const e = 1 - Math.pow(1 - k, 3); it.lid.rotation[it.lidAxis] = e * it.lidOpen; renderer.shadowMap.needsUpdate = true; } });
      it.innerItem.pickable = true;
      it.innerItem.hidden = false;
      emit('open', it.id, it.innerItem.id);
      return;
    }
    if (it.found) return;
    it.found = true;
    if (dir === 'maquette') applyMaterials();
    emit('found', it.id);
  }

  // ------------------------------------------------ render
  const clock = new THREE.Clock();
  function renderLoupe() {
    if (!loupe.visible) return;
    const R = loupe.r, Z = loupe.zoom;
    loupeCam.copy(cam);
    loupeCam.setViewOffset(W * Z, H * Z, loupe.x * Z - R, loupe.y * Z - R, 2 * R, 2 * R);
    const vx = loupe.x - R, vy = H - loupe.y - R;
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setViewport(vx, vy, 2 * R, 2 * R);
    renderer.setScissor(vx, vy, 2 * R, 2 * R);
    renderer.clear(false, true, true);
    renderer.render(stencilScene, stencilCam);
    const bg = scene.background;
    scene.background = null;
    const envI = scene.environmentIntensity;
    scene.environmentIntensity = LOOK.loupeEnv;
    // Maquette: under the glass the room stays pale and only the things worth a look show their colour.
    for (const m of meshes) {
      const set = m.userData.itemRef ? 'colour' : 'maquette';
      m.material = matFor(set, m, true);
    }
    ground.visible = false;
    renderer.render(scene, loupeCam);
    ground.visible = true;
    scene.environmentIntensity = envI;
    scene.background = bg;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.autoClear = true;
  }
  function restoreMats() {
    for (const m of meshes) {
      const it = m.userData.itemRef;
      const set = dir === 'maquette' && it && it.found && !it.container ? 'colour' : dir;
      m.material = matFor(set, m);
    }
  }

  let running = true;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, clock.getDelta());
    let busy = false;
    // anims
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i];
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.f(k);
      busy = true;
      if (k >= 1) anims.splice(i, 1);
    }
    // pan + parallax easing
    if (pan.distanceTo(panTarget) > 0.001) { pan.lerp(panTarget, 1 - Math.pow(0.0005, dt)); fit(); }
    if (loupe.gliding) {
      loupe.x += (loupe.tx - loupe.x) * (1 - Math.pow(0.0008, dt));
      loupe.y += (loupe.ty - loupe.y) * (1 - Math.pow(0.0008, dt));
      if (Math.hypot(loupe.tx - loupe.x, loupe.ty - loupe.y) < 0.5) loupe.gliding = false;
      loupeDirty = true;
    }
    // hover + dwell
    const it = pickAt(loupe.x, loupe.y);
    if (it !== hover) {
      hover = it; progress = 0;
      emit('hover', it ? it.id : null, it ? (it.found || it.opened) : false);
    }
    if (hover && !hover.found && !(hover.container && hover.opened)) {
      progress = Math.min(1, progress + dt / (hover.container ? DWELL * 1.4 : DWELL));
      emit('progress', hover.id, progress);
      if (progress >= 1) { const h = hover; find(h); hover = null; progress = 0; emit('progress', h.id, 0); }
    }
    if (busy) dirty = true;
    if (dirty) {
      dirty = false;
      composer.render(dt);
      renderer.shadowMap.needsUpdate = false;
      loupeDirty = true;
      emit('render');
    }
    if (loupeDirty) {
      loupeDirty = false;
      renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, W, H);
      blit.material.uniforms.t.value = composer.readBuffer.texture;
      blit.render(renderer);
      renderLoupe();
      restoreMats();
      emit('loupe', loupe.x, loupe.y, loupe.r, loupe.visible);
    }
  }

  // ------------------------------------------------ public api
  api.start = () => applyMaterials();
  api.setLayout = setLayout;
  api.items = () => ITEMS.map((i) => ({ id: i.id, found: i.found, hidden: i.hidden, container: i.container }));
  api.targets = () => ITEMS.filter((i) => i.pickable && !i.found && !(i.container && i.opened)).map((i) => ({ id: i.id, container: i.container, ...project(i.anchor) }));
  api.project = (id) => { const it = ITEMS.find((i) => i.id === id); return it ? project(it.anchor) : null; };
  api.focus = (id) => {
    const it = ITEMS.find((i) => i.id === id);
    if (!it) return;
    if (it.hidden) { const c = ITEMS.find((i) => i.innerItem === it); if (c && !c.opened) find(c); }
    glideTo(it);
  };
  api.parkAt = (id) => { const it = ITEMS.find((i) => i.id === id); if (!it) return; const p = project(it.proxy.position); if (!loupe.fixed) { loupe.x = p.x; loupe.y = p.y; } markDirty(); };
  api.setFloor = (f) => {
    const y = { attic: 7.4, upstairs: 4.3, downstairs: 1.1 }[f] ?? 4;
    const p = project(new THREE.Vector3(0, y, 0));
    panTarget.y -= (p.y - loupe.y) * api.unitsPerPx;
    clampPan();
    markDirty();
  };
  api.reset = () => {
    for (const it of ITEMS) {
      it.found = false;
      if (it.container) { it.opened = false; it.pickable = true; it.lid.rotation[it.lidAxis] = 0; }
      if (it.hidden !== undefined && ITEMS.some((c) => c.innerItem === it)) { it.hidden = true; it.pickable = false; }
    }
    applyMaterials();
  };
  api.coarse = coarse;
  api.loupe = loupe;
  api.destroy = () => { running = false; ro.disconnect(); renderer.dispose(); };

  resize();
  api.start();
  frame();
  emit('ready');
  return api;
}
