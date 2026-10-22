// ============================================
// HEIRLOOM — Grandpa's watch, on the counter
// ============================================
//
// The hero's watch and chain, in three dimensions. A turned silver case that
// reflects a small studio, an enamel dial painted onto a canvas, a domed
// crystal, blued hands, and a chain of real links lying on the counter.
//
// The chain moves the way a chain on a table does. Its links carry almost no
// momentum, so nothing swings or springs back: when the bow pulls, each taut
// link is drawn along its own line after the one ahead of it, and the slack
// stays exactly where it lies. Scrolling turns the watch a little on the
// counter, and that is all that moves it.
//
// The SVG drawing in index.html is the picture for anyone without WebGL or
// script; this module replaces it once its first frame is ready, and leaves
// it in place if anything goes wrong.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';

const host = document.querySelector('[data-hero-scene]');
const hero = document.querySelector('.hero');
const drawing = host && host.querySelector('.specimen__scene');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The drawing's units in centimetres: the case is 130 units in radius and
// 2.5 cm in life. The counter's x and z are the drawing's x and y, so the
// watch lies where the drawing put it.
const CM = 2.5 / 130;
const BOX_W = 600 * CM;
const BOX_D = 400 * CM;
const WATCH_AT = [160 * CM, 215 * CM];

const MAX_TURN = 0.36;   // radians the watch turns by the time it has scrolled away
const PITCH = 0.245;     // one link of the chain, joint to joint, in cm

if (host && hero && drawing) {
  start().catch((error) => {
    console.warn('Heirloom: showing the drawn watch instead of the 3D one.', error);
    const canvas = host.querySelector('.specimen__canvas');
    if (canvas) canvas.remove();
    host.classList.add('no-3d');
  });
}

async function start() {
  const THREE = await import(THREE_URL);

  const canvas = document.createElement('canvas');
  canvas.className = 'specimen__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  drawing.after(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // The dial's numerals are set in the site's serif; paint them once it has loaded.
  try { await document.fonts.load('700 40px Newsreader'); } catch (e) { /* Georgia will do */ }

  const scene = new THREE.Scene();
  scene.environment = studio(THREE, renderer);

  // --- The camera: looking down across the counter, a little from the front.
  const camera = new THREE.PerspectiveCamera(16, BOX_W / BOX_D, 1, 120);
  const tilt = THREE.MathUtils.degToRad(22);
  const distance = BOX_W / 2 / (Math.tan(THREE.MathUtils.degToRad(8)) * (BOX_W / BOX_D));
  camera.position.set(BOX_W / 2, distance * Math.cos(tilt), BOX_D / 2 + distance * Math.sin(tilt));
  camera.lookAt(BOX_W / 2, 0, BOX_D / 2);

  // --- Light: the lamp up and to the left casts the shadows; the studio
  // environment gives the silver something to reflect.
  const lamp = new THREE.DirectionalLight(0xfff8f0, 2.3);
  lamp.position.set(BOX_W / 2 - 7, 16, BOX_D / 2 - 8);
  lamp.target.position.set(BOX_W / 2, 0, BOX_D / 2);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  Object.assign(lamp.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 4, far: 40 });
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.012;
  lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target, new THREE.HemisphereLight(0xfffdf9, 0xddd4c6, 0.45));

  // The counter itself is the page's own stone; this only catches shadows.
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x2b1d10, opacity: 0.24 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(BOX_W / 2, 0, BOX_D / 2);
  catcher.receiveShadow = true;
  scene.add(catcher);

  const silver = new THREE.MeshPhysicalMaterial({ color: 0xe1e4e8, metalness: 1, roughness: 0.17 });

  // --- The watch.
  const watch = new THREE.Group();
  watch.position.set(WATCH_AT[0], 0, WATCH_AT[1]);
  scene.add(watch);

  // A soft dark pool where the case meets the counter.
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 5.7), new THREE.MeshBasicMaterial({ map: contactShadow(THREE), transparent: true, depthWrite: false, opacity: 0.42 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(WATCH_AT[0] + 0.12, 0.002, WATCH_AT[1] + 0.16);
  scene.add(pool);

  // The case, turned on a lathe: a domed back resting on the counter, the band,
  // a groove, the reeded edge of the bezel, its lip, and down to the dial.
  const profile = [
    [0.001, 0.03], [0.9, 0.05], [1.6, 0.09], [2.05, 0.16], [2.32, 0.26], [2.45, 0.38],
    [2.5, 0.52], [2.505, 0.67], [2.5, 0.82], [2.46, 0.92], [2.4, 0.965], [2.43, 1.0],
    [2.445, 1.06], [2.41, 1.13], [2.31, 1.185], [2.2, 1.2], [2.15, 1.175], [2.13, 1.11], [2.13, 1.045],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const caseMaterial = silver.clone();
  caseMaterial.bumpMap = reeding(THREE, 11 / 18, 13 / 18);
  caseMaterial.bumpScale = 2.5;
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 220), caseMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  watch.add(body);

  // The dial.
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(2.13, 180),
    new THREE.MeshPhysicalMaterial({ map: dialFace(THREE, renderer), roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.14 }),
  );
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = 1.045;
  dial.receiveShadow = true;
  watch.add(dial);

  // The hands, blued steel, Breguet moons.
  const blued = new THREE.MeshPhysicalMaterial({ color: 0x1e3270, metalness: 0.88, roughness: 0.26, clearcoat: 0.5 });
  const hand = (geometry, y) => {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, blued);
    mesh.castShadow = true;
    pivot.position.y = y;
    pivot.add(mesh);
    watch.add(pivot);
    return pivot;
  };
  const hourHand = hand(breguet(THREE, { tail: 0.27, shaft: 0.69, moonY: 0.817, moonR: 0.131, moonW: 0.05, tip: [0.942, 1.231], w: [0.042, 0.027] }), 1.062);
  const minuteHand = hand(breguet(THREE, { tail: 0.31, shaft: 1.46, moonY: 1.558, moonR: 0.1, moonW: 0.042, tip: [1.654, 1.942], w: [0.035, 0.019] }), 1.078);
  const secondsHand = hand(needle(THREE), 1.056);
  secondsHand.position.z = 0.962;
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 32), blued);
  boss.position.y = 1.098;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 16), silver);
  pin.position.y = 1.118;
  const smallBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), blued);
  smallBoss.position.set(0, 1.07, 0.962);
  watch.add(boss, pin, smallBoss);

  // The crystal: a shallow dome of glass standing a millimetre proud of the
  // bezel. Glass this thin shows only what it reflects, so it is drawn as
  // reflection alone, added over the dial, which stays sharp beneath it.
  const domeRadius = 14.13;
  const crystal = new THREE.Mesh(
    new THREE.SphereGeometry(domeRadius, 180, 12, 0, Math.PI * 2, 0, Math.asin(2.13 / domeRadius)),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000, metalness: 0, roughness: 0.04, specularIntensity: 1, envMapIntensity: 1.6,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  crystal.position.y = 1.3 - domeRadius;
  watch.add(crystal);

  // Pendant, crown and bow at twelve (−z); the hinge at nine.
  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.5, 40), silver);
  pendant.rotation.x = Math.PI / 2;
  pendant.position.set(0, 0.67, -2.72);
  const crown = new THREE.Mesh(knurled(THREE, 0.37, 0.42, 36), silver);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(0, 0.67, -3.18);
  const crownCap = new THREE.Mesh(new THREE.SphereGeometry(0.37, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), silver);
  crownCap.scale.set(1, 0.32, 1);
  crownCap.rotation.x = -Math.PI / 2;
  crownCap.position.set(0, 0.67, -3.39);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 24), silver);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(-2.53, 0.67, 0);
  for (const part of [pendant, crown, crownCap, hinge]) {
    part.castShadow = true;
    watch.add(part);
  }
  for (const z of [-2.58, -2.86]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 8, 40), silver);
    ring.position.set(0, 0.67, z);
    watch.add(ring);
  }
  // The bow, hinged at the pendant and lying back on the counter.
  const bowHinge = new THREE.Group();
  bowHinge.position.set(0, 0.67, -2.55);
  bowHinge.rotation.x = -0.5;
  const bowGeometry = new THREE.TorusGeometry(0.66, 0.07, 16, 96, Math.PI * 1.6);
  bowGeometry.rotateZ(THREE.MathUtils.degToRad(306));
  bowGeometry.rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeometry, silver);
  bow.position.z = -0.5;
  bow.castShadow = true;
  bowHinge.add(bow);
  watch.add(bowHinge);

  // Where the chain is clipped to the bow, and where the leader to the loupe starts.
  const anchorLocal = new THREE.Vector3(0, 0.1, -3.66);
  const caseEdgeLocal = new THREE.Vector3(0, 0.55, 2.52);

  // --- The chain: oval links lying flat, alternating with links stood on
  // edge through them, the way a chain lies.
  const linkGeometry = new THREE.TorusGeometry(0.105, 0.03, 10, 24);
  linkGeometry.scale(1.45, 1, 1);
  linkGeometry.rotateX(-Math.PI / 2);
  const chainMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd6d9dd, metalness: 1, roughness: 0.24 });

  // Joints sampled a link apart from the curve the drawing lays the chain on.
  const rest = drawing.querySelector('.scene__chain-rest');
  const total = rest.getTotalLength() * CM;
  const count = Math.round(total / PITCH);
  const X = new Float64Array(count + 1), Z = new Float64Array(count + 1);
  const PX = new Float64Array(count + 1), PZ = new Float64Array(count + 1);
  for (let i = 0; i <= count; i++) {
    const p = rest.getPointAtLength((i * PITCH) / CM);
    X[i] = PX[i] = p.x * CM;
    Z[i] = PZ[i] = p.y * CM;
  }
  const links = new THREE.InstancedMesh(linkGeometry, chainMaterial, count);
  links.castShadow = true;
  links.receiveShadow = true;
  scene.add(links);

  // The T-bar on its jump ring, and the bolt ring on the bow.
  const tbar = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 24), chainMaterial);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0.07, 0);
  const jump = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 24), chainMaterial);
  jump.position.set(-0.12, 0.1, 0);
  jump.rotation.y = Math.PI / 2;
  tbar.add(bar, jump);
  for (const side of [-1, 1]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), chainMaterial);
    ball.position.set(side * 0.53, 0.07, 0);
    tbar.add(ball);
  }
  tbar.traverse((o) => { o.castShadow = true; });
  scene.add(tbar);
  const clasp = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.032, 10, 28), chainMaterial);
  clasp.castShadow = true;
  scene.add(clasp);

  // --- Time: the visitor's own, a minute fast, as the record says.
  const setHands = () => {
    const now = new Date(Date.now() + 60000);
    const s = now.getSeconds() + Math.floor(now.getMilliseconds() / 200) / 5;   // five beats a second
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    secondsHand.rotation.y = -(s / 60) * Math.PI * 2;
    minuteHand.rotation.y = -(m / 60) * Math.PI * 2;
    hourHand.rotation.y = -(h / 12) * Math.PI * 2;
  };

  // --- The counter: links with almost no momentum, dragged only when taut.
  const anchor = new THREE.Vector3();
  const stepChain = () => {
    watch.localToWorld(anchor.copy(anchorLocal));
    let moved = 0;
    for (let i = 1; i <= count; i++) {
      // What little speed a link has, the counter takes most of at once.
      const vx = (X[i] - PX[i]) * 0.25, vz = (Z[i] - PZ[i]) * 0.25;
      PX[i] = X[i];
      PZ[i] = Z[i];
      X[i] += vx;
      Z[i] += vz;
    }
    X[0] = anchor.x;
    Z[0] = anchor.z;
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i <= count; i++) {
        const dx = X[i] - X[i - 1], dz = Z[i] - Z[i - 1];
        const d = Math.hypot(dx, dz) || 1e-9;
        // Taut: drawn along its own line after the link ahead. Slack: left alone,
        // unless two joints would pass through each other.
        const want = d > PITCH ? PITCH : d < PITCH * 0.55 ? PITCH * 0.55 : d;
        if (want !== d) {
          X[i] = X[i - 1] + (dx / d) * want;
          Z[i] = Z[i - 1] + (dz / d) * want;
        }
      }
      // The case is in the way.
      for (let i = 1; i <= count; i++) {
        const dx = X[i] - watch.position.x, dz = Z[i] - watch.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 2.62) {
          X[i] = watch.position.x + (dx / d) * 2.62;
          Z[i] = watch.position.z + (dz / d) * 2.62;
        }
      }
    }
    for (let i = 1; i <= count; i++) moved = Math.max(moved, Math.abs(X[i] - PX[i]) + Math.abs(Z[i] - PZ[i]));
    return moved;
  };

  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';
  const placeChain = () => {
    for (let i = 0; i < count; i++) {
      const dx = X[i + 1] - X[i], dz = Z[i + 1] - Z[i];
      const standing = i % 2 === 1;
      dummy.position.set((X[i] + X[i + 1]) / 2, standing ? 0.138 : 0.03, (Z[i] + Z[i + 1]) / 2);
      dummy.rotation.set(standing ? THREE.MathUtils.degToRad(76) : 0, Math.atan2(-dz, dx), 0);
      dummy.updateMatrix();
      links.setMatrixAt(i, dummy.matrix);
    }
    links.instanceMatrix.needsUpdate = true;
    const n = count;
    const endYaw = Math.atan2(-(Z[n] - Z[n - 1]), X[n] - X[n - 1]);
    tbar.position.set(X[n] + Math.cos(endYaw) * 0.12, 0, Z[n] - Math.sin(endYaw) * 0.12);
    tbar.rotation.y = endYaw + Math.PI / 2;
    const startYaw = Math.atan2(-(Z[1] - Z[0]), X[1] - X[0]);
    clasp.position.set(X[0], 0.13, Z[0]);
    clasp.rotation.set(0, startYaw, 0);
  };

  // --- Scrolling turns the watch, eased out so the first flick shows.
  const turnFor = () => {
    if (calm) return 0;
    const p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.5 || 1), 0), 1);
    return MAX_TURN * (1 - (1 - p) * (1 - p));
  };
  let angle = turnFor();
  const placeWatch = () => {
    watch.rotation.y = angle;
    const slide = angle / MAX_TURN;
    watch.position.set(WATCH_AT[0] - 0.22 * slide, 0, WATCH_AT[1] + 0.14 * slide);
    pool.position.set(watch.position.x + 0.12, 0.002, watch.position.z + 0.16);
    watch.updateMatrixWorld(true);
  };

  // --- Where the leader to the loupe starts, in the page's coordinates.
  const edge = new THREE.Vector3();
  const leaderStart = () => {
    const box = canvas.getBoundingClientRect();
    watch.localToWorld(edge.copy(caseEdgeLocal)).project(camera);
    return { x: box.left + ((edge.x + 1) / 2) * box.width, y: box.top + ((1 - edge.y) / 2) * box.height };
  };
  window.heirloomWatch = { leaderStart };

  const draw = () => {
    renderer.render(scene, camera);
    window.dispatchEvent(new Event('heirloom:watch'));
  };

  // Run only while something moves: the watch turning, or links still sliding.
  let frame = 0;
  const tick = () => {
    frame = 0;
    const target = turnFor();
    angle += (target - angle) * 0.14;
    if (Math.abs(target - angle) < 1e-4) angle = target;
    placeWatch();
    const moved = stepChain();
    placeChain();
    draw();
    if (angle !== target || moved > 1e-5) frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const fit = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  };

  setHands();
  placeWatch();
  for (let i = 0; i < 8; i++) stepChain();   // let the chain take up the bow's slack before anyone sees it
  placeChain();
  fit();
  new ResizeObserver(fit).observe(canvas);
  host.classList.add('is-3d');

  // The loupe's photograph of the movement, made once the watch is showing.
  const lens = host.querySelector('.loupe__lens');
  if (lens) {
    setTimeout(() => {
      try {
        const photo = new Image();
        photo.className = 'loupe__photo';
        photo.alt = '';
        photo.onload = () => lens.classList.add('has-photo');
        photo.src = movementPhoto(THREE);
        lens.append(photo);
      } catch (error) {
        // The drawn movement stays.
      }
    }, 60);
  }

  if (!calm) {
    window.addEventListener('scroll', wake, { passive: true });
    let beat = 0;
    new IntersectionObserver(([entry]) => {
      clearInterval(beat);
      beat = entry.isIntersecting ? setInterval(() => { setHands(); draw(); }, 200) : 0;
    }).observe(hero);
  }
}

// The photograph in the loupe: the movement under the case back, laid out as
// the drawing lays it out (the drawing's 200 units across become 2 here),
// rendered once at the size the loupe needs and handed back as a picture, so
// no second WebGL context outlives it.
function movementPhoto(THREE) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9dcdf);
  scene.environment = studio(THREE, renderer, 0.8);
  const at = (x, y) => [(x - 100) / 100, (y - 100) / 100];   // drawing units to the plate's

  const camera = new THREE.PerspectiveCamera(18, 1, 0.1, 50);
  camera.position.set(0, 6.5, 0.55);
  camera.lookAt(0, 0, 0);
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(-3, 6, -3);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 1, far: 15 });
  light.shadow.bias = -0.0005;
  light.shadow.radius = 3;
  scene.add(light, new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 0.5));

  const nickel = { color: 0xe4e7ea, metalness: 1, roughness: 0.26 };
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xdcb46c, metalness: 1, roughness: 0.28 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0x9e0b22, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04 });
  const blued = new THREE.MeshPhysicalMaterial({ color: 0x22377a, metalness: 0.9, roughness: 0.24 });
  const add = (mesh, x, y, z) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };

  // The inside of the case back, turned, beyond the plate.
  const caseBack = new THREE.Mesh(new THREE.RingGeometry(0.84, 1.3, 160), new THREE.MeshPhysicalMaterial({ color: 0xe4e7ea, metalness: 1, roughness: 0.18, bumpMap: turned(THREE), bumpScale: 0.8 }));
  caseBack.rotation.x = -Math.PI / 2;
  add(caseBack, 0, 0, 0);

  // The plate: perlage, and the engraving the reading came from.
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 160), new THREE.MeshPhysicalMaterial(nickel)), 0, 0.03, 0);
  const face = plateFace(THREE);
  // Grained plate, matte; polished bridges, bright: the contrast a movement is finished for.
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.85, 160), new THREE.MeshPhysicalMaterial({ ...nickel, color: 0xc4c9ce, roughness: 0.5, map: face.map, bumpMap: face.bump, bumpScale: 0.8 }));
  plate.rotation.x = -Math.PI / 2;
  add(plate, 0, 0.0605, 0);

  // Bridges, raised and bevelled: the balance cock and the train bridge.
  const bridge = (points) => {
    const shape = new THREE.Shape();
    points.forEach(([cmd, ...p], i) => {
      const xy = (j) => { const [x, z] = at(p[j], p[j + 1]); return [x, -z]; };
      if (cmd === 'M') shape.moveTo(...xy(0));
      else if (cmd === 'L') shape.lineTo(...xy(0));
      else shape.bezierCurveTo(...xy(0), ...xy(2), ...xy(4));
    });
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 32 });
    geometry.rotateX(-Math.PI / 2);
    return add(new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ ...nickel, color: 0xeef0f2, roughness: 0.14 })), 0, 0.062, 0);
  };
  const cockY = 0.115;

  // The balance: rim, arms, timing screws, hairspring, under its cock.
  const balance = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 12, 120), gold);
  rim.rotation.x = -Math.PI / 2;
  balance.add(rim);
  for (const turn of [0, Math.PI / 2]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.014, 0.022), gold);
    arm.rotation.y = turn;
    balance.add(arm);
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const screw = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), gold);
    screw.position.set(Math.cos(a) * 0.294, 0, Math.sin(a) * 0.294);
    balance.add(screw);
  }
  const spiral = [];
  for (let t = 0; t <= 1; t += 1 / 600) {
    const a = t * Math.PI * 2 * 9, r = 0.03 + t * 0.12;
    spiral.push(new THREE.Vector3(Math.cos(a) * r, 0.012, Math.sin(a) * r));
  }
  balance.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 1200, 0.0024, 5, false), new THREE.MeshPhysicalMaterial({ color: 0x8f97a3, metalness: 1, roughness: 0.3 })));
  balance.traverse((o) => { o.castShadow = true; });
  const [bx, bz] = at(64, 72);
  add(balance, bx, 0.088, bz);

  bridge([['M', 18, 124], ['C', 30, 106, 46, 90, 58, 79], ['L', 68, 68], ['C', 74, 70, 76, 76, 72, 81], ['C', 58, 95, 44, 112, 34, 132]]);
  bridge([['M', 106, 22], ['C', 142, 20, 174, 44, 182, 84], ['L', 158, 94], ['C', 152, 68, 134, 52, 110, 48]]);

  // The centre wheel: forty teeth and four spokes.
  const wheel = new THREE.Shape();
  for (let i = 0; i <= 80; i++) {
    const a = (i / 80) * Math.PI * 2, r = i % 2 ? 0.192 : 0.212;
    const p = [Math.cos(a) * r, Math.sin(a) * r];
    if (i === 0) wheel.moveTo(...p); else wheel.lineTo(...p);
  }
  for (let k = 0; k < 4; k++) {
    const a0 = (k / 4) * Math.PI * 2 + 0.16, a1 = ((k + 1) / 4) * Math.PI * 2 - 0.16;
    const window_ = new THREE.Path();
    window_.absarc(0, 0, 0.152, a0, a1, false);
    window_.absarc(0, 0, 0.055, a1, a0, true);
    window_.closePath();
    wheel.holes.push(window_);
  }
  const wheelGeometry = new THREE.ExtrudeGeometry(wheel, { depth: 0.014, bevelEnabled: false, curveSegments: 24 });
  wheelGeometry.rotateX(-Math.PI / 2);
  const [wx, wz] = at(138, 128);
  add(new THREE.Mesh(wheelGeometry, gold), wx, 0.072, wz);

  // Jewels in gold settings, and blued screws.
  const jewel = ([x, y], h) => {
    const [jx, jz] = at(x, y);
    const chaton = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 24), gold);
    chaton.rotation.x = -Math.PI / 2;
    add(chaton, jx, h, jz);
    const stone = new THREE.Mesh(new THREE.SphereGeometry(0.021, 16, 12), ruby);
    stone.scale.y = 0.55;
    add(stone, jx, h + 0.004, jz);
  };
  [[64, 72], [132, 42], [164, 76]].forEach((p) => jewel(p, cockY + 0.004));
  jewel([98, 112], 0.066);
  jewel([138, 128], 0.09);
  const screw = ([x, y], h) => {
    const [sx, sz] = at(x, y);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.02, 24), blued), sx, h, sz);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.011), new THREE.MeshBasicMaterial({ color: 0x0d1530 }));
    slot.rotation.y = (x * 7) % Math.PI;
    add(slot, sx, h + 0.009, sz);
  };
  [[26, 124], [114, 34], [170, 84]].forEach((p) => screw(p, cockY + 0.008));
  screw([146, 164], 0.07);

  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  renderer.dispose();
  renderer.forceContextLoss();
  return url;
}

// Perlage — the overlapping circles a finisher grains into a plate — and the
// serial number and jewel count engraved where the drawing puts them.
function plateFace(THREE) {
  const size = 1024;
  const paint = (forBump) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = forBump ? '#808080' : '#ffffff';
    g.fillRect(0, 0, size, size);
    // Overlapping, slightly irregular circles, each lighter at its heart, laid
    // row by row the way the graining tool steps across the plate.
    let seed = 3;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const step = 22;
    for (let y = -step; y < size + step; y += step * 0.72) {
      for (let x = -step; x < size + step; x += step * 0.72) {
        const cx = x + (random() - 0.5) * 3, cy = y + (random() - 0.5) * 3, r = step * (0.78 + random() * 0.08);
        const grad = g.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
        grad.addColorStop(0, forBump ? 'rgba(150,150,150,0.55)' : 'rgba(255,255,255,0.7)');
        grad.addColorStop(0.75, forBump ? 'rgba(118,118,118,0.4)' : 'rgba(238,240,242,0.35)');
        grad.addColorStop(1, forBump ? 'rgba(104,104,104,0.3)' : 'rgba(226,229,232,0.25)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    // The drawing's 170 units across the plate become the canvas.
    const to = (v) => ((v - 15) / 170) * size;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const engrave = (text, x, y, px, spacing) => {
      g.font = `600 ${px}px Newsreader, Georgia, serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${spacing}px`;
      if (!forBump) {
        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.fillText(text, to(x) + 1.5, to(y) + 2);
      }
      g.fillStyle = forBump ? '#2a2a2a' : '#5b6167';
      g.fillText(text, to(x), to(y));
    };
    engrave('No 41372', 80, 153, 78, 7);
    engrave('17 JEWELS', 88, 169, 50, 7);
    return c;
  };
  const map = new THREE.CanvasTexture(paint(false));
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump: new THREE.CanvasTexture(paint(true)) };
}

// Fine concentric rings, as a lathe leaves on the inside of a case back.
function turned(THREE) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, size, size);
  for (let r = 4; r < size * 0.72; r += 3) {
    g.strokeStyle = `rgba(${r % 2 ? 200 : 60}, ${r % 2 ? 200 : 60}, ${r % 2 ? 200 : 60}, 0.35)`;
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// A small photographic studio for the silver to reflect: a softbox up and to
// the left (the lamp), a window strip to the right, a low fill in front, dim
// walls, and the warm counter below.
function studio(THREE, renderer, overhead = 0) {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(
    new THREE.BoxGeometry(30, 20, 30),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.19, 0.18), side: THREE.BackSide }),
  ));
  const panel = (w, h, power, x, y, z, tint) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * power, tint[1] * power, tint[2] * power), side: THREE.DoubleSide }),
    );
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  };
  panel(11, 7, 7, -7, 8, -6, [1, 0.97, 0.92]);
  panel(3, 12, 3.2, 11, 3, 1, [0.95, 0.97, 1]);
  panel(8, 2, 1.6, -1, 1.2, 12, [1, 0.96, 0.9]);
  // A macro shot is lit from above, so flat plates facing up have something bright to reflect.
  if (overhead) panel(14, 14, overhead, 0, 9.5, 0, [1, 1, 1]);
  const counter = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.72, 0.68, 0.62) }));
  counter.rotation.x = -Math.PI / 2;
  counter.position.y = -6;
  room.add(counter);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.025).texture;
  pmrem.dispose();
  return env;
}

// A soft, dark pool to sit the case in.
function contactShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 40, 128, 128, 128);
  grad.addColorStop(0, 'rgba(38, 26, 14, 0.62)');
  grad.addColorStop(0.62, 'rgba(38, 26, 14, 0.3)');
  grad.addColorStop(1, 'rgba(38, 26, 14, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// The bezel's coin edge, as a bump map on the lathe's own UVs: fine ridges all
// the way round, only in the band of the profile between v0 and v1.
function reeding(THREE, v0, v1) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, c.width, c.height);
  const top = Math.round((1 - v1) * c.height), bottom = Math.round((1 - v0) * c.height);
  const row = g.createImageData(c.width, 1);
  for (let x = 0; x < c.width; x++) {
    const v = 128 + 110 * Math.cos((2 * Math.PI * 240 * x) / c.width);
    row.data.set([v, v, v, 255], x * 4);
  }
  for (let y = top; y < bottom; y++) g.putImageData(row, 0, y);
  return new THREE.CanvasTexture(c);
}

// A Breguet hand lying flat, twelve towards −z: a tapered shaft, the hollow
// moon, a short tip. Units are centimetres.
function breguet(THREE, { tail, shaft, moonY, moonR, moonW, tip, w }) {
  const body = new THREE.Shape();
  body.moveTo(-w[0], -tail);
  body.lineTo(-w[1], shaft);
  body.lineTo(w[1], shaft);
  body.lineTo(w[0], -tail);
  body.closePath();
  const moon = new THREE.Shape();
  moon.absarc(0, moonY, moonR + moonW / 2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, moonY, moonR - moonW / 2, 0, Math.PI * 2, true);
  moon.holes.push(hole);
  const point = new THREE.Shape();
  point.moveTo(-w[1] * 1.15, tip[0]);
  point.lineTo(0, tip[1]);
  point.lineTo(w[1] * 1.15, tip[0]);
  point.closePath();
  const geometry = new THREE.ExtrudeGeometry([body, moon, point], { depth: 0.014, bevelEnabled: false, curveSegments: 28 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// The small seconds hand: a needle with a round tail.
function needle(THREE) {
  const s = new THREE.Shape();
  s.moveTo(-0.011, -0.12);
  s.lineTo(-0.004, 0.37);
  s.lineTo(0.004, 0.37);
  s.lineTo(0.011, -0.12);
  s.closePath();
  const tail = new THREE.Shape();
  tail.absarc(0, -0.1, 0.034, 0, Math.PI * 2, false);
  const geometry = new THREE.ExtrudeGeometry([s, tail], { depth: 0.01, bevelEnabled: false, curveSegments: 16 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// A crown with fine ridges round its edge.
function knurled(THREE, radius, height, ridges) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, ridges * 4, 1, false);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > radius * 0.98) {
      const a = Math.atan2(z, x);
      const k = (radius + 0.018 * Math.cos(a * ridges)) / r;
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

// The enamel dial, painted at 2048px in the drawing's own units (the dial is
// 111 of them in radius): railway track, Roman numerals set radially with IIII
// and a red XII, a sunken small-seconds dial, a hairline, and the faint warmth
// of old enamel.
function dialFace(THREE, renderer) {
  const size = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const k = size / 2 / 111;
  g.translate(size / 2, size / 2);
  g.scale(k, k);

  const enamel = g.createRadialGradient(-18, -22, 4, 0, 0, 111);
  enamel.addColorStop(0, '#FFFFFE');
  enamel.addColorStop(0.72, '#FBF9F4');
  enamel.addColorStop(1, '#F2EDE5');
  g.fillStyle = enamel;
  g.beginPath();
  g.arc(0, 0, 111, 0, Math.PI * 2);
  g.fill();

  // The faint mottling of a century-old dial.
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const a = random() * Math.PI * 2, r = Math.sqrt(random()) * 110;
    g.fillStyle = `rgba(150, 125, 90, ${0.008 + random() * 0.02})`;
    g.beginPath();
    g.arc(Math.cos(a) * r, Math.sin(a) * r, 0.2 + random() * 1.4, 0, Math.PI * 2);
    g.fill();
  }

  g.strokeStyle = '#26221E';
  g.lineWidth = 1.1;
  for (const r of [104.5, 97]) {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    g.lineWidth = i % 5 === 0 ? 2.6 : 1.05;
    g.beginPath();
    g.moveTo(Math.sin(a) * 97.4, -Math.cos(a) * 97.4);
    g.lineTo(Math.sin(a) * 104.1, -Math.cos(a) * 104.1);
    g.stroke();
  }

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 18px Newsreader, Georgia, serif';
  const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', '', 'VII', 'VIII', 'IX', 'X', 'XI'];
  numerals.forEach((n, i) => {
    if (!n) return;
    g.save();
    g.rotate((i / 12) * Math.PI * 2);
    g.translate(0, -82);
    g.fillStyle = i === 0 ? '#9E2A1D' : '#1D1916';
    if ('letterSpacing' in g) g.letterSpacing = '-0.4px';
    g.fillText(n, 0, 1);
    g.restore();
  });

  // Small seconds, sunk into the dial: shadowed at the top of its wall.
  g.save();
  g.translate(0, 50);
  const sunk = g.createRadialGradient(0, -6, 4, 0, 0, 25);
  sunk.addColorStop(0, '#F7F4EE');
  sunk.addColorStop(0.86, '#EEEAE2');
  sunk.addColorStop(1, '#DAD3C7');
  g.fillStyle = sunk;
  g.beginPath();
  g.arc(0, 0, 25, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#26221E';
  g.lineWidth = 0.6;
  g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, major = i % 5 === 0;
    g.lineWidth = major ? 0.9 : 0.4;
    g.beginPath();
    g.moveTo(Math.sin(a) * (major ? 18.5 : 19.6), -Math.cos(a) * (major ? 18.5 : 19.6));
    g.lineTo(Math.sin(a) * 22.6, -Math.cos(a) * 22.6);
    g.stroke();
  }
  g.restore();

  // A hairline by III.
  g.strokeStyle = 'rgba(120, 104, 88, 0.55)';
  g.lineWidth = 0.35;
  g.beginPath();
  g.moveTo(107.2, 28.7);
  [[102.6, 26.6], [99.4, 28.1], [95.2, 25.2], [91.6, 26.1], [88.4, 24.6]].forEach(([x, y]) => g.lineTo(x, y));
  g.stroke();

  // The bezel's shadow falling on the dial's edge.
  const rim = g.createRadialGradient(0, 0, 100, 0, 0, 111);
  rim.addColorStop(0, 'rgba(60, 44, 30, 0)');
  rim.addColorStop(1, 'rgba(60, 44, 30, 0.22)');
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, 111, 0, Math.PI * 2);
  g.fill();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}
