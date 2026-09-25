// ─────────────────────────────────────────────────────────────────────────────
// Mascotas 3D (Tecolote, Monarca, Ayotl) — 6 etapas cada una, del huevo a su
// forma mítica, más la llama del tonalli (la racha) sobre la cabeza.
//
// Módulo sin dependencias de plataforma: solo three.js. Lo usan Pet3DView (app,
// con expo-gl) y scripts/render-pet-sprites.html (genera los PNG estáticos).
//
//   const pet = createPetController({ petType: 'tecolote', stage: 3 });
//   pet.setSize(w, h);  pet.update(dt, t);  renderer.render(pet.scene, pet.camera);
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import * as TX from './petTextures.js';
import { buildOutfit } from './petOutfits.js';

export const PET3D_TYPES = ['tecolote', 'monarca', 'ayotl'];
export const supports3D = (petType) => PET3D_TYPES.includes(petType);

export const FLAME_TIERS = [
  { min: 0, name: 'Brasa', color: '#8C8290', outer: 0x6B6470, inner: 0xA38F86, size: 0.42, ember: true },
  { min: 1, name: 'Chispa', color: '#FFC23D', outer: 0xFFB21F, inner: 0xFFF1A8, size: 0.55 },
  { min: 3, name: 'Llama', color: '#FF7A1A', outer: 0xFF6A10, inner: 0xFFD04D, size: 0.72 },
  { min: 7, name: 'Fogata', color: '#F0441B', outer: 0xE8380F, inner: 0xFFA51F, core: 0xFFF1B8, size: 0.9 },
  { min: 30, name: 'Llama azul', color: '#2F7BFF', outer: 0x2466F0, inner: 0x78CFFF, core: 0xE8FBFF, size: 1.0 },
  { min: 100, name: 'Cempasúchil', color: '#FF9A00', outer: 0xFF7A00, inner: 0xFFC400, core: 0xFFF6C9, size: 1.1, petals: 0xFF8C00 },
  { min: 365, name: 'Obsidiana', color: '#7B3FE0', outer: 0x2E1650, inner: 0x9B4DFF, core: 0xFFD45A, size: 1.2, petals: 0xB77CFF },
];
export function flameTierFor(days) {
  let tier = FLAME_TIERS[0];
  for (const t of FLAME_TIERS) if ((days ?? 0) >= t.min) tier = t;
  return tier;
}

const RIM = { tecolote: 0x9DB4FF, monarca: 0xFFE3A3, ayotl: 0xC8FFF5 };
// Altura del modelo por etapa en modo 'stage' (crece al evolucionar)
const STAGE_H = [1.15, 1.3, 1.4, 1.65, 1.9, 2.1];
const FIT_H = 1.6;

// ── Helpers de geometría ────────────────────────────────────────────────────
const SHARED = new Set();
const sphere = (() => { const g = new THREE.SphereGeometry(1, 36, 24); SHARED.add(g); return g; })();
const std = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0, ...(o || {}) });
function M(geo, mat, p, s, r) {
  const m = new THREE.Mesh(geo, mat);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (s) m.scale.set(s[0], s[1], s[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  return m;
}
const S = (r, mat, p, s, rot) => M(sphere, mat, p, s ? [s[0] * r, s[1] * r, s[2] * r] : [r, r, r], rot);

function eggGeo(w, h, k, t0 = 0, t1 = 1) {
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * (i / N);
    const y = -h * Math.cos(Math.PI * t);
    const r = Math.max(0.0005, w * Math.sin(Math.PI * t) * (1 + k * (0.5 - t)));
    pts.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(pts, 40);
}
const eggAt = (w, h, k, t) => ({ r: w * Math.sin(Math.PI * t) * (1 + k * (0.5 - t)), y: -h * Math.cos(Math.PI * t) });

const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
function makeEye(r, iris, glow) {
  const g = new THREE.Group();
  if (iris != null) {
    g.add(S(r, std(iris, { roughness: 0.2, emissive: glow ? iris : 0x000000, emissiveIntensity: glow ? 0.7 : 0 }), [0, 0, 0], [1, 1, 0.55]));
    g.add(S(r * 0.56, std(0x0C0812, { roughness: 0.12 }), [0, 0, r * 0.36], [1, 1, 0.5]));
  } else {
    g.add(S(r, std(0x120D18, { roughness: 0.12 }), [0, 0, 0], [1, 1, 0.55]));
  }
  g.add(S(r * 0.26, WHITE, [r * 0.3, r * 0.34, r * 0.66]));
  g.add(S(r * 0.12, WHITE, [-r * 0.28, -r * 0.3, r * 0.62]));
  return g;
}
function addEyes(parent, eyes, o) {
  [-1, 1].forEach((s) => {
    const e = makeEye(o.r, o.iris, o.glow);
    e.position.set(s * o.dx + (o.cx || 0), o.y, o.z);
    e.rotation.y = s * (o.tilt == null ? 0.28 : o.tilt);
    parent.add(e);
    eyes.push(e);
  });
}
function blush(parent, x, y, z, r, tilt, cx = 0) {
  const m = std(0xFF7FA8, { transparent: true, opacity: 0.55, roughness: 1 });
  [-1, 1].forEach((s) => parent.add(S(r, m, [cx + s * x, y, z], [1, 0.55, 0.3], [0, s * (tilt || 0.5), 0])));
}
// Punta del cascarón puesta como sombrero; pivota en su borde
function capOn(parent, w, h, k, mat, pos, rotZ) {
  const cap = M(eggGeo(w, h, k, 0.78, 1), mat);
  cap.position.y = h * Math.cos(Math.PI * 0.78);
  const holder = new THREE.Group();
  holder.position.set(pos[0], pos[1], pos[2]);
  holder.rotation.z = rotZ;
  holder.add(cap);
  const rr = eggAt(w, h, k, 0.78);
  const tooth = new THREE.ConeGeometry((0.045 * w) / 0.6, (0.09 * h) / 0.8, 4);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    cap.add(M(tooth, mat, [Math.cos(a) * rr.r * 0.97, rr.y - 0.02, Math.sin(a) * rr.r * 0.97], null, [Math.PI, 0, 0]));
  }
  parent.add(holder);
  return holder;
}
// Mitad inferior del cascarón con borde dentado
function crackedShell(parent, w, h, k, mat, baseY) {
  const g = new THREE.Group();
  const shell = M(eggGeo(w, h, k, 0, 0.55), mat);
  g.add(shell);
  const rr = eggAt(w, h, k, 0.55);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const hh = ((0.09 + ((i * 37) % 10) / 100) * h) / 0.8;
    shell.add(M(new THREE.ConeGeometry((0.055 * w) / 0.6, hh, 4), mat, [Math.cos(a) * rr.r * 0.98, rr.y + hh / 2 - 0.01, Math.sin(a) * rr.r * 0.98]));
  }
  g.position.y = baseY + h;
  parent.add(g);
  return { rimY: baseY + h + rr.y };
}
const tube = (a, b, c, r, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, b, c]), 12, r, 6), mat);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function nest(g) {
  const twig = std(0x7A5230, { roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    g.add(M(new THREE.TorusGeometry(0.62 - i * 0.015, 0.07, 8, 32), twig, [0, 0.12 + i * 0.035, 0], null, [Math.PI / 2 + (i % 2 ? 0.12 : -0.12), 0, i]));
  }
}

// ── Tecolote ────────────────────────────────────────────────────────────────
function buildTecolote(stage) {
  const g = new THREE.Group();
  const eyes = [];
  const anim = [];
  if (stage === 1) {
    nest(g);
    const egg = M(eggGeo(0.6, 0.8, 0.18), std(0xffffff, { map: TX.starEggTex(), roughness: 0.35, emissive: 0x3A2F86, emissiveIntensity: 0.15 }));
    egg.position.y = 0.95;
    g.add(egg);
    anim.push((t) => { egg.rotation.z = Math.sin(t * 2.2) * 0.05; egg.rotation.y = t * 0.3; });
    return { g, eyes, anim, head: { c: [0, 0.95, 0], r: 0.62, top: 1.29, shape: [1, 1.3, 1] } };
  }
  if (stage === 2) {
    nest(g);
    const shellMat = std(0xffffff, { map: TX.starEggTex(), roughness: 0.35, side: THREE.DoubleSide });
    const { rimY } = crackedShell(g, 0.6, 0.8, 0.18, shellMat, 0.15);
    g.add(S(0.46, std(0xCFC7BC, { roughness: 0.95 }), [0, rimY + 0.35, 0.02]));
    const disc = std(0xEFE9E0, { roughness: 0.95 });
    g.add(S(0.2, disc, [-0.17, rimY + 0.38, 0.38], [1, 1, 0.45]));
    g.add(S(0.2, disc, [0.17, rimY + 0.38, 0.38], [1, 1, 0.45]));
    addEyes(g, eyes, { r: 0.15, dx: 0.17, y: rimY + 0.39, z: 0.45, iris: 0xF6B81A });
    g.add(M(new THREE.ConeGeometry(0.05, 0.12, 12), std(0xB08A5A), [0, rimY + 0.25, 0.47], null, [Math.PI * 0.85, 0, 0]));
    blush(g, 0.3, rimY + 0.27, 0.38, 0.06);
    const cap = capOn(g, 0.6, 0.8, 0.18, shellMat, [0.06, rimY + 0.62, 0], -0.35);
    return { g, eyes, anim, head: { c: [0, rimY + 0.35, 0.02], r: 0.46, eyeY: 0.09, eyeDX: 0.37, eyeR: 0.33, faceZ: 0.93, hides: [cap] } };
  }
  const P = {
    3: { body: 0xCFC7BC, disc: 0xEFE9E0, eyeR: 0.27, tufts: 0, glasses: false, wings: 'fold', rough: 0.95, fluffTop: true },
    4: { body: 0x8B6446, belly: TX.chevronTex(0xEBD7B4, 0x8B6446), disc: 0xDDBE92, eyeR: 0.24, tufts: 0.3, glasses: true, wings: 'fold', rough: 0.8 },
    5: { body: 0x6E4A33, belly: TX.chevronTex(0xE6CFA6, 0x6E4A33), disc: 0xD6B27E, eyeR: 0.23, tufts: 0.42, glasses: true, wings: 'half', rough: 0.8, rebozo: true, book: true },
    6: { body: 0x2A2466, belly: TX.starBodyTex(), disc: 0xE8B93A, eyeR: 0.23, tufts: 0.52, wings: 'spread', rough: 0.55, glow: true, stars: true, crown: true, codex: true },
  }[stage];
  const by = P.book ? 0.22 : 0;
  const bodyMat = P.stars ? std(0xffffff, { map: TX.starBodyTex(), roughness: P.rough }) : std(P.body, { roughness: P.rough });
  g.add(S(1, bodyMat, [0, 1 + by, 0], [1, 1.04, 0.92]));
  g.add(P.belly
    ? S(0.74, std(0xffffff, { map: P.belly, roughness: 0.9 }), [0, 0.82 + by, 0.45], [1, 1.02, 0.72])
    : S(0.72, std(0xE7E0D6, { roughness: 0.95 }), [0, 0.8 + by, 0.45], [1, 1, 0.7]));
  const discMat = std(P.disc, { roughness: P.glow ? 0.35 : 0.9, metalness: P.glow ? 0.4 : 0, emissive: P.glow ? 0x8A6410 : 0x000000, emissiveIntensity: P.glow ? 0.25 : 0 });
  g.add(S(0.43, discMat, [-0.3, 1.3 + by, 0.72], [1, 1, 0.42]));
  g.add(S(0.43, discMat, [0.3, 1.3 + by, 0.72], [1, 1, 0.42]));
  addEyes(g, eyes, { r: P.eyeR, dx: 0.3, y: 1.31 + by, z: 0.88, iris: P.glow ? 0xFFD45A : 0xF6B81A, glow: P.glow, tilt: 0.18 });
  g.add(M(new THREE.ConeGeometry(0.075, 0.2, 14), std(P.glow ? 0xE8B93A : 0x9C7A52, { metalness: P.glow ? 0.6 : 0, roughness: 0.4 }), [0, 1.08 + by, 0.97], null, [Math.PI * 0.82, 0, 0]));
  blush(g, 0.55, 1.05 + by, 0.8, 0.09, 0.7);
  if (P.fluffTop) [[-0.14, 0.02], [0, 0.08], [0.14, 0.02]].forEach(([x, dy]) => g.add(S(0.13, bodyMat, [x, 2.0 + dy, 0.05], [1, 1.3, 1])));
  if (P.tufts) {
    const tm = std(P.glow ? 0x3B3490 : P.body, { roughness: P.rough });
    [-1, 1].forEach((s) => {
      g.add(M(new THREE.ConeGeometry(0.15, P.tufts, 16), tm, [s * 0.52, 1.82 + P.tufts * 0.35 + by, 0.08], null, [0, 0, -s * 0.45]));
      if (P.glow) g.add(S(0.05, std(0xFFD45A, { emissive: 0xFFC23D, emissiveIntensity: 0.9 }), [s * (0.52 + P.tufts * 0.2), 1.82 + P.tufts * 0.8 + by, 0.08]));
    });
  }
  if (P.glasses) {
    const gold = std(0xD9A441, { metalness: 0.8, roughness: 0.25 });
    [-1, 1].forEach((s) => g.add(M(new THREE.TorusGeometry(P.eyeR + 0.04, 0.022, 10, 36), gold, [s * 0.3, 1.31 + by, 1.0])));
    g.add(M(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), gold, [0, 1.36 + by, 1.02], null, [0, 0, Math.PI / 2]));
  }
  const foot = std(0xE39A3B, { roughness: 0.6 });
  [-1, 1].forEach((s) => { for (let i = -1; i <= 1; i++) g.add(S(0.075, foot, [s * 0.32 + i * 0.08, 0.06 + by, 0.62], [1, 0.7, 1.4])); });
  const wingMat = P.stars ? std(0xffffff, { map: TX.starBodyTex(), roughness: 0.55 }) : std(P.body, { roughness: P.rough });
  const shade = std(new THREE.Color(P.body).multiplyScalar(0.7).getHex(), { roughness: P.rough });
  const wings = [];
  [-1, 1].forEach((s) => {
    const pv = new THREE.Group();
    pv.position.set(s * 0.82, 1.25 + by, -0.02);
    g.add(pv);
    wings.push([pv, s]);
    if (P.wings === 'fold') pv.add(S(1, wingMat, [s * 0.1, -0.35, 0], [0.26, 0.58, 0.55], [0, 0, s * 0.18]));
    else if (P.wings === 'half') {
      pv.add(S(1, wingMat, [s * 0.35, -0.2, -0.05], [0.3, 0.72, 0.55], [0, 0, s * 0.75]));
      for (let i = 0; i < 3; i++) pv.add(M(new THREE.ConeGeometry(0.1, 0.35, 10), shade, [s * (0.72 + i * 0.03), -0.65 + i * 0.18, -0.05], null, [0, 0, s * (2.2 + i * 0.2)]));
    } else {
      pv.add(S(1, wingMat, [s * 0.85, 0.12, -0.12], [0.95, 0.32, 0.5], [0, 0, s * 0.35]));
      for (let i = 0; i < 5; i++) pv.add(M(new THREE.ConeGeometry(0.11, 0.46, 10), wingMat, [s * (1.5 + i * 0.02), -0.25 + i * 0.18, -0.14], null, [0, 0, s * (1.75 + i * 0.3)]));
    }
  });
  const flap = P.wings === 'fold' ? 0.03 : P.wings === 'half' ? 0.06 : 0.12;
  anim.push((t, fx) => wings.forEach(([pv, s]) => { pv.rotation.z = s * (Math.sin(t * (P.wings === 'spread' ? 2.2 : 1.6)) * flap + fx.flap * 0.5); }));
  if (P.rebozo) {
    const sc = std(0xffffff, { map: TX.scarfTex(), roughness: 0.85 });
    g.add(M(new THREE.TorusGeometry(0.97, 0.13, 12, 40), sc, [0, 0.98 + by, 0], [1, 1, 0.94], [Math.PI / 2, 0, 0]));
    g.add(M(new THREE.BoxGeometry(0.28, 0.6, 0.08), sc, [0.38, 0.66 + by, 0.95], null, [0.15, 0, 0.2]));
    const fringe = std(0xE4007C);
    for (let i = 0; i < 6; i++) g.add(M(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), fringe, [0.27 + i * 0.045, 0.3 + by + i * 0.018, 1.0], null, [0.15, 0, 0.2]));
  }
  if (P.book) {
    const cover = std(0xD6246E, { roughness: 0.6 });
    const page = std(0xFFF7E6, { roughness: 0.9 });
    g.add(M(new THREE.BoxGeometry(0.95, 0.08, 1.2), cover, [-0.5, 0.05, 0.1], null, [0, 0, 0.08]));
    g.add(M(new THREE.BoxGeometry(0.95, 0.08, 1.2), cover, [0.5, 0.05, 0.1], null, [0, 0, -0.08]));
    g.add(M(new THREE.BoxGeometry(0.9, 0.1, 1.12), page, [-0.48, 0.13, 0.1], null, [0, 0, 0.08]));
    g.add(M(new THREE.BoxGeometry(0.9, 0.1, 1.12), page, [0.48, 0.13, 0.1], null, [0, 0, -0.08]));
  }
  if (P.stars) {
    const sm = std(0xFFF1B0, { emissive: 0xFFD45A, emissiveIntensity: 1 });
    let seed = 21;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 26; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
      const v = V3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (v.z > 0.55 && v.y > -0.2) continue;
      g.add(S(0.025 + rnd() * 0.02, sm, [v.x * 1.01, 1 + v.y * 1.05, v.z * 0.93]));
    }
  }
  let moon = null;
  if (P.crown) {
    moon = M(new THREE.TorusGeometry(0.3, 0.075, 12, 36, Math.PI * 1.35), std(0xF2C14E, { emissive: 0xE8A10E, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }), [0, 2.32, 0.05], null, [0, 0, -Math.PI * 0.18]);
    g.add(moon);
    anim.push((t) => { moon.position.y = 2.32 + Math.sin(t * 1.5) * 0.04; });
  }
  if (P.codex) {
    const ring = new THREE.Group();
    ring.userData.noFit = true;
    ring.position.y = 1.2;
    const pageGeo = new THREE.PlaneGeometry(0.34, 0.44);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ring.add(M(pageGeo, std(0xffffff, { map: TX.codexTex(i + 3), side: THREE.DoubleSide, roughness: 0.9, emissive: 0xFFE8B0, emissiveIntensity: 0.15 }), [Math.cos(a) * 1.55, Math.sin(a * 2) * 0.25, Math.sin(a) * 1.55], null, [0, -a + Math.PI / 2, 0.1]));
    }
    g.add(ring);
    anim.push((t) => { ring.rotation.y = t * 0.35; });
  }
  const head = { c: [0, 1 + by, 0], r: 1, top: 1.04, hatLift: 0.68, shape: [1, 1.04, 0.92], eyeY: 0.31, eyeDX: 0.3, eyeR: P.eyeR, faceZ: 0.9, neck: [-0.22, 0.98], hides: moon ? [moon] : [] };
  return { g, eyes, anim, head };
}

// ── Monarca ─────────────────────────────────────────────────────────────────
function leaf(g, sx, y) {
  g.add(S(1, std(0x4FA34A, { roughness: 0.7, side: THREE.DoubleSide }), [0, y, 0], [sx, 0.06, sx * 0.62]));
  g.add(M(new THREE.BoxGeometry(sx * 1.8, 0.012, 0.03), std(0x8FD48A), [0, y + 0.06, 0]));
}
const caterpillarStripe = () => std(0xffffff, { map: TX.bandTex('cat', [0x15101A, 0xFFFFFF, 0xFFD21F, 0xFFFFFF], [4, 1.2, 3, 1.2]), roughness: 0.55 });

function wingShapes() {
  const fore = new THREE.Shape();
  fore.moveTo(0, 0.05); fore.bezierCurveTo(0.3, 0.95, 1.1, 1.3, 1.38, 1.05); fore.bezierCurveTo(1.5, 0.7, 1.1, 0.18, 0.04, -0.06);
  const hind = new THREE.Shape();
  hind.moveTo(0, -0.04); hind.bezierCurveTo(0.95, 0.08, 1.2, -0.5, 0.98, -0.88); hind.bezierCurveTo(0.72, -1.1, 0.24, -0.82, 0, -0.14);
  return { fore, hind };
}
function wingMesh(key, shape, kind) {
  const geo = new THREE.ShapeGeometry(shape, 20);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y;
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / W, (pos.getY(i) - bb.min.y) / H);
  const pts = shape.getPoints(20).map((p) => [(p.x - bb.min.x) / W, (p.y - bb.min.y) / H]);
  const root = [(0 - bb.min.x) / W, (0 - bb.min.y) / H];
  const map = TX.wingTex(key, kind, pts, root);
  const mat = new THREE.MeshStandardMaterial({ map, side: THREE.DoubleSide, transparent: true, alphaTest: 0.35, roughness: 0.6, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: kind === 'monarch' ? 0.18 : 0.35 });
  return new THREE.Mesh(geo, mat);
}

function buildMonarca(stage) {
  const g = new THREE.Group();
  const eyes = [];
  const anim = [];
  if (stage === 1) {
    leaf(g, 1.25, 0.08);
    const egg = M(eggGeo(0.42, 0.62, 0.35), std(0xffffff, { map: TX.ribTex(), roughness: 0.45, emissive: 0x806020, emissiveIntensity: 0.06 }));
    egg.position.y = 0.76;
    g.add(egg);
    anim.push((t) => { egg.rotation.z = Math.sin(t * 2) * 0.04; });
    return { g, eyes, anim, head: { c: [0, 0.76, 0], r: 0.44, top: 1.41, shape: [1, 1.4, 1] } };
  }
  if (stage === 2) {
    leaf(g, 1.25, 0.08);
    const sm = std(0xffffff, { map: TX.ribTex(), roughness: 0.45, side: THREE.DoubleSide });
    const { rimY } = crackedShell(g, 0.42, 0.62, 0.35, sm, 0.14);
    const hy = rimY + 0.12;
    g.add(S(0.34, caterpillarStripe(), [0, hy, 0]));
    addEyes(g, eyes, { r: 0.12, dx: 0.13, y: hy + 0.03, z: 0.31, tilt: 0.3 });
    blush(g, 0.22, hy - 0.08, 0.25, 0.05);
    const ink = std(0x15101A);
    [-1, 1].forEach((s) => g.add(M(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8), ink, [s * 0.14, hy + 0.36, 0], null, [0, 0, -s * 0.35])));
    const cap = capOn(g, 0.42, 0.62, 0.35, sm, [-0.05, hy + 0.23, 0], 0.4);
    return { g, eyes, anim, head: { c: [0, hy, 0], r: 0.34, eyeY: 0.09, eyeDX: 0.38, eyeR: 0.35, faceZ: 0.92, hides: [cap] } };
  }
  if (stage === 3) {
    leaf(g, 1.7, 0.08);
    const cat = new THREE.Group();
    g.add(cat);
    const n = 7;
    const segs = [];
    const stripe = caterpillarStripe();
    const ink = std(0x15101A);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = -1.05 + t * 1.9;
      const s = S(0.3 + Math.sin(t * Math.PI) * 0.06, stripe, [x, 0.42 + Math.sin(t * Math.PI) * 0.22, 0], null, [0, 0, Math.PI / 2]);
      cat.add(s);
      segs.push(s);
      if (i < n - 1) [-1, 1].forEach((z) => cat.add(S(0.05, ink, [x, 0.18, z * 0.18])));
    }
    const hx = 1.05, hy = 0.95;
    cat.add(S(0.42, std(0x15101A, { roughness: 0.5 }), [hx, hy, 0.05]));
    cat.add(S(0.36, std(0xFFD21F, { roughness: 0.6 }), [hx, hy - 0.02, 0.2], [1, 1, 0.8]));
    cat.add(S(0.18, std(0xFFFFFF), [hx, hy + 0.18, 0.38], [1.2, 0.35, 0.7]));
    addEyes(cat, eyes, { r: 0.13, dx: 0.14, cx: hx, y: hy + 0.02, z: 0.5, tilt: 0.25 });
    blush(cat, 0.25, hy - 0.12, 0.44, 0.06, 0.5, hx);
    cat.add(M(new THREE.TorusGeometry(0.06, 0.014, 8, 16, Math.PI), ink, [hx, hy - 0.13, 0.52], null, [0, 0, Math.PI]));
    [-1, 1].forEach((s) => {
      cat.add(tube(V3(hx + s * 0.12, hy + 0.36, 0), V3(hx + s * 0.22, hy + 0.62, -0.02), V3(hx + s * 0.36, hy + 0.7, 0.05), 0.022, ink));
      cat.add(tube(V3(-1.05, 0.55, s * 0.1), V3(-1.2, 0.8, s * 0.14), V3(-1.35, 0.82, s * 0.2), 0.022, ink));
    });
    cat.rotation.y = -0.35;
    anim.push((t) => segs.forEach((s, i) => { s.position.y = 0.42 + Math.sin((i / (n - 1)) * Math.PI) * 0.22 + Math.sin(t * 3 - i * 0.7) * 0.035; }));
    return { g, eyes, anim, head: { parent: cat, c: [hx, hy, 0.05], r: 0.42, eyeY: 0.05, eyeDX: 0.33, eyeR: 0.31, faceZ: 1.07, neck: [-0.85, 0.72] } };
  }
  if (stage === 4) {
    const bark = std(0x6B4424, { roughness: 0.9 });
    g.add(M(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 10), bark, [0, 2.35, 0], null, [0, 0, Math.PI / 2]));
    g.add(S(0.18, std(0x4FA34A, { side: THREE.DoubleSide }), [0.75, 2.45, 0], [1.6, 0.25, 0.9], [0, 0, 0.3]));
    const hang = new THREE.Group();
    hang.position.y = 2.33;
    g.add(hang);
    hang.add(M(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), std(0x15101A), [0, -0.1, 0]));
    const w = 0.46, h = 0.72, k = -0.28;
    hang.add(M(eggGeo(w, h, k), std(0x7FD8A8, { roughness: 0.3, emissive: 0x2E9E6A, emissiveIntensity: 0.2 }), [0, -0.2 - h, 0], null, [Math.PI, 0, 0]));
    const gold = std(0xF2C14E, { metalness: 0.9, roughness: 0.25, emissive: 0x8A6410, emissiveIntensity: 0.3 });
    const band = eggAt(w, h, k, 0.28);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      hang.add(S(0.034, gold, [Math.cos(a) * band.r, -0.2 - h - band.y, Math.sin(a) * band.r]));
    }
    // Cara dormida: la crisálida es una espera
    const faceY = -0.2 - h - 0.05;
    const ink = std(0x1C3A2A);
    [-1, 1].forEach((s) => hang.add(M(new THREE.TorusGeometry(0.07, 0.016, 8, 16, Math.PI), ink, [s * 0.14, faceY, 0.44], null, [0, s * 0.2, Math.PI])));
    blush(hang, 0.26, faceY - 0.1, 0.4, 0.06);
    hang.add(M(new THREE.TorusGeometry(0.035, 0.012, 8, 12, Math.PI), ink, [0, faceY - 0.14, 0.455], null, [0, 0, Math.PI]));
    anim.push((t, fx) => { hang.rotation.z = Math.sin(t * 1.1) * 0.06 + fx.wobble; hang.rotation.x = Math.sin(t * 0.8) * 0.03; });
    // La crisálida cuelga: el sombrero va arriba, donde se angosta hacia la rama
    return { g, eyes, anim, noHop: true, head: { parent: hang, c: [0, faceY, 0], r: 0.46, top: 1.65, eyeY: 0, eyeDX: 0.3, eyeR: 0.16, faceZ: 0.96 } };
  }
  // Mariposa (5) y Papalotl (6)
  const mythic = stage === 6;
  const dark = std(0x231A24, { roughness: 0.5 });
  const dotted = std(0xffffff, { map: TX.dottedTex(), roughness: 0.5 });
  g.add(S(0.3, dotted, [0, 1.05, 0], [1, 1.35, 1]));
  g.add(S(0.24, dark, [0, 0.55, -0.02], [1, 2.1, 1]));
  const headY = 1.62;
  g.add(mythic ? S(0.44, std(0xFFF3E3, { roughness: 0.5 }), [0, headY, 0.05]) : S(0.44, dotted, [0, headY, 0.05]));
  if (mythic) {
    // Carita de calavera de Día de Muertos
    const deco = std(0xE4007C, { roughness: 0.5 });
    [-1, 1].forEach((s) => {
      g.add(S(0.15, std(0x2B1A3A), [s * 0.16, headY + 0.02, 0.45], [1, 1.1, 0.4]));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.add(S(0.03, deco, [s * 0.16 + Math.cos(a) * 0.18, headY + 0.02 + Math.sin(a) * 0.18, 0.42]));
      }
    });
    g.add(S(0.05, std(0xFF9F1C), [0, headY + 0.3, 0.4]));
  }
  addEyes(g, eyes, { r: mythic ? 0.12 : 0.15, dx: 0.16, y: headY + 0.02, z: 0.47, iris: mythic ? 0xFFB000 : 0xFF8A1F, glow: mythic, tilt: 0.22 });
  blush(g, 0.28, headY - 0.14, 0.36, 0.06);
  const tip = mythic ? std(0xFFD34D, { emissive: 0xFFB000, emissiveIntensity: 0.7 }) : dark;
  [-1, 1].forEach((s) => {
    g.add(tube(V3(s * 0.1, headY + 0.36, 0.05), V3(s * 0.22, headY + 0.75, 0.02), V3(s * 0.42, headY + 0.9, 0.08), 0.02, dark));
    g.add(S(0.055, tip, [s * 0.42, headY + 0.9, 0.08]));
  });
  const { fore, hind } = wingShapes();
  const kind = mythic ? 'picado' : 'monarch';
  const scale = mythic ? 1.25 : 1.0;
  const wings = [];
  [-1, 1].forEach((s) => {
    const pv = new THREE.Group();
    pv.position.set(s * 0.12, 1.02, -0.16);
    pv.scale.set(s * scale, scale, scale);
    pv.add(wingMesh('fore', fore, kind));
    pv.add(wingMesh('hind', hind, kind));
    g.add(pv);
    wings.push([pv, s]);
  });
  anim.push((t, fx) => {
    const f = 0.35 + Math.sin(t * (mythic ? 4 : 6) * fx.speed) * 0.55 + fx.flap;
    wings.forEach(([pv, s]) => { pv.rotation.y = s * f; });
  });
  if (mythic) {
    const ring = new THREE.Group();
    ring.userData.noFit = true;
    ring.position.y = 1.0;
    const pm = std(0xFF9A00, { emissive: 0xFF7A00, emissiveIntensity: 0.45 });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 1.75 + (i % 2) * 0.2;
      ring.add(S(0.09, pm, [Math.cos(a) * r, Math.sin(a * 3) * 0.35, Math.sin(a) * r], [1, 0.4, 0.7], [0, -a, 0]));
    }
    g.add(ring);
    anim.push((t) => { ring.rotation.y = -t * 0.4; });
  }
  const head = { c: [0, headY, 0.05], r: 0.44, eyeY: 0.05, eyeDX: 0.36, eyeR: (mythic ? 0.12 : 0.15) / 0.44, faceZ: 0.97, neck: [-1.0, 0.55] };
  return { g, eyes, anim, head };
}

// ── Ayotl ───────────────────────────────────────────────────────────────────
function buildTurtle(o) {
  const g = new THREE.Group();
  const eyes = [];
  const anim = [];
  const R = o.R;
  const jade = o.shell === 'jade';
  g.add(M(new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), std(0xffffff, { map: TX.shellTex(o.shell), roughness: jade ? 0.3 : 0.55, metalness: jade ? 0.15 : 0 }), [0, o.y, 0], [1, o.dome, 1.12]));
  const rimC = jade ? 0xE8C25A : o.shell === 'talavera' ? 0x1D3E9E : new THREE.Color(o.skin).multiplyScalar(0.8).getHex();
  g.add(S(R * 1.04, std(rimC, { roughness: 0.5, metalness: jade ? 0.6 : 0 }), [0, o.y, 0], [1, 0.1, 1.12]));
  g.add(S(R * 0.95, std(0xE9DDB8, { roughness: 0.8 }), [0, o.y - 0.02, 0], [1, 0.12, 1.08]));
  const skin = std(o.skin, { roughness: 0.7 });
  const hz = R * 1.15, hy = o.y + R * 0.28;
  const head = new THREE.Group();
  head.position.set(0, hy, hz);
  g.add(head);
  head.add(S(o.headR, skin, [0, 0, 0]));
  g.add(M(new THREE.CylinderGeometry(o.headR * 0.6, o.headR * 0.7, R * 0.5, 14), skin, [0, o.y + R * 0.12, R * 0.88], null, [1.2, 0, 0]));
  addEyes(head, eyes, { r: o.eyeR, dx: o.headR * 0.46, y: o.headR * 0.18, z: o.headR * 0.8, iris: o.glow ? 0x3FE0C8 : null, glow: o.glow, tilt: 0.35 });
  blush(head, o.headR * 0.62, -o.headR * 0.2, o.headR * 0.7, o.headR * 0.18, 0.6);
  head.add(M(new THREE.TorusGeometry(o.headR * 0.22, o.headR * 0.045, 8, 16, Math.PI), std(0x2A2220), [0, -o.headR * 0.36, o.headR * 0.92], null, [0, 0, Math.PI]));
  const flippers = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
    const front = sz > 0;
    const pv = new THREE.Group();
    pv.position.set(sx * R * 0.72, o.y + 0.02, sz * R * 0.55);
    g.add(pv);
    pv.add(S(1, skin, [sx * R * (front ? 0.3 : 0.16), 0, sz * R * 0.08], [R * (front ? o.flip * 0.62 : o.flip * 0.4), R * 0.09, R * (front ? 0.26 : 0.2)], [0, sx * sz * -0.6, 0]));
    flippers.push([pv, sx, front]);
  });
  g.add(M(new THREE.ConeGeometry(R * 0.08, R * 0.3, 8), skin, [0, o.y, -R * 1.15], null, [-Math.PI / 2, 0, 0]));
  const speed = o.swim ? 2.4 : 3.4;
  anim.push((t, fx) => {
    flippers.forEach(([pv, sx, front]) => {
      const w = Math.sin(t * speed * fx.speed + (front ? 0 : 1.4));
      pv.rotation.z = sx * w * (front ? 0.22 : 0.12);
      pv.rotation.y = w * 0.15 * sx;
    });
    head.position.y = hy + Math.sin(t * 1.7) * 0.015 - fx.droop * 0.08;
  });
  const anchor = { parent: head, c: [0, 0, 0], r: o.headR, eyeY: 0.18, eyeDX: 0.46, eyeR: o.eyeR / o.headR, faceZ: 0.86, neck: [-0.82, 0.42] };
  return { g, eyes, anim, head: anchor };
}
const sandMound = (g, r) => { const m = S(r, std(0xffffff, { map: TX.sandTex(), roughness: 1 }), [0, 0, 0], [1, 0.28, 1]); g.add(m); return m; };

function buildAyotl(stage) {
  if (stage === 1) {
    const g = new THREE.Group();
    const anim = [];
    sandMound(g, 1.2);
    const em = std(0xF7F4EC, { roughness: 0.55 });
    g.add(S(0.42, em, [0, 0.42, 0.25]));
    g.add(S(0.36, em, [-0.55, 0.25, -0.2]));
    g.add(S(0.34, em, [0.55, 0.22, -0.28]));
    const glow = S(0.43, std(0xFFFFFF, { transparent: true, opacity: 0.18, emissive: 0xFFF1C9, emissiveIntensity: 0.8 }), [0, 0.42, 0.25]);
    g.add(glow);
    anim.push((t) => glow.scale.setScalar(0.43 * (1 + Math.sin(t * 2) * 0.04)));
    return { g, eyes: [], anim, head: { c: [0, 0.42, 0.25], r: 0.42 } };
  }
  if (stage === 2) {
    const g = new THREE.Group();
    const eyes = [];
    const anim = [];
    sandMound(g, 1.2);
    const em = std(0xF7F4EC, { roughness: 0.55, side: THREE.DoubleSide });
    const { rimY } = crackedShell(g, 0.5, 0.5, 0, em, 0);
    g.add(S(0.36, em, [-0.72, 0.22, -0.3]));
    const hy = rimY + 0.15;
    g.add(S(0.36, std(0x55534C, { roughness: 0.7 }), [0, hy, 0.05]));
    addEyes(g, eyes, { r: 0.13, dx: 0.16, y: hy + 0.06, z: 0.33, tilt: 0.3 });
    blush(g, 0.24, hy - 0.08, 0.28, 0.06);
    g.add(M(new THREE.TorusGeometry(0.07, 0.016, 8, 16, Math.PI), std(0x2A2220), [0, hy - 0.13, 0.36], null, [0, 0, Math.PI]));
    const cap = capOn(g, 0.5, 0.5, 0, em, [0.05, hy + 0.17, 0], -0.3);
    anim.push((t) => { cap.rotation.z = -0.3 + Math.sin(t * 2.5) * 0.05; });
    return { g, eyes, anim, head: { c: [0, hy, 0.05], r: 0.36, eyeY: 0.17, eyeDX: 0.44, eyeR: 0.36, faceZ: 0.86, hides: [cap] } };
  }
  if (stage === 3) {
    const out = buildTurtle({ R: 0.72, y: 0.26, dome: 0.62, shell: 'hatch', skin: 0x55534C, headR: 0.42, eyeR: 0.15, flip: 0.85 });
    sandMound(out.g, 1.35).position.y = -0.05;
    return out;
  }
  if (stage === 4) {
    const out = buildTurtle({ R: 0.85, y: 0.55, dome: 0.6, shell: 'olive', skin: 0x8C9A63, headR: 0.4, eyeR: 0.14, flip: 1.0, swim: true });
    const bm = std(0xE6FBFF, { transparent: true, opacity: 0.35, roughness: 0.05, emissive: 0xBFF6FF, emissiveIntensity: 0.25 });
    const bubbles = [];
    for (let i = 0; i < 9; i++) {
      const b = S(0.05 + ((i * 7) % 9) / 100, bm, [0, 0, 0]);
      b.userData.noFit = true;
      b.userData.o = [((i * 0.37) % 1 - 0.5) * 2.4, ((i * 0.61) % 1) * 2, ((i * 0.23) % 1 - 0.5) * 1.2, (i * 0.13) % 1];
      out.g.add(b);
      bubbles.push(b);
    }
    out.anim.push((t) => bubbles.forEach((b) => {
      const [x, y0, z, ph] = b.userData.o;
      b.position.set(x + Math.sin(t + ph * 6) * 0.05, (y0 + t * 0.35) % 2.2, z);
    }));
    return out;
  }
  if (stage === 5) return buildTurtle({ R: 1.0, y: 0.12, dome: 0.62, shell: 'talavera', skin: 0x9DB08A, headR: 0.42, eyeR: 0.14, flip: 1.05 });
  // Ayotl, la tortuga del mundo: milpa y pirámide en la espalda, anillo de agua
  const out = buildTurtle({ R: 1.05, y: 0.35, dome: 0.64, shell: 'jade', skin: 0x7FB59A, headR: 0.42, eyeR: 0.13, flip: 1.1, glow: true });
  const g = out.g;
  const stone = std(0xCDBB9C, { roughness: 0.9 });
  const top = 0.35 + 1.05 * 0.64;
  [[0.62, 0.14], [0.46, 0.14], [0.3, 0.14]].forEach(([w, h], i) => g.add(M(new THREE.BoxGeometry(w, h, w), stone, [-0.2, top - 0.06 + i * 0.14 + h / 2, -0.15])));
  g.add(M(new THREE.BoxGeometry(0.18, 0.16, 0.18), std(0xD6246E, { roughness: 0.6 }), [-0.2, top - 0.06 + 0.42 + 0.08, -0.15]));
  const maize = new THREE.Group();
  maize.position.set(0.42, top - 0.1, 0.05);
  g.add(maize);
  const green = std(0x4FA34A, { roughness: 0.6, side: THREE.DoubleSide });
  maize.add(M(new THREE.CylinderGeometry(0.035, 0.05, 0.95, 8), green, [0, 0.47, 0]));
  [[0.3, 0.5, 0.9], [0.45, -0.6, -0.9], [0.62, 0.7, 0.5]].forEach(([y, rz, ry]) => maize.add(S(1, green, [Math.sin(rz) * 0.2, y, 0], [0.26, 0.04, 0.08], [0, ry, rz])));
  maize.add(S(1, std(0xffffff, { map: TX.kernelTex(), roughness: 0.5 }), [0.08, 0.7, 0.06], [0.07, 0.16, 0.07]));
  const jadeM = std(0x2FBF9A, { roughness: 0.25, metalness: 0.2 });
  [-1, 1].forEach((s) => g.add(M(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), jadeM, [s * 0.4, 0.35 + 1.05 * 0.28 + 0.02, 1.05 * 1.15 - 0.02], null, [0, 0, Math.PI / 2])));
  const ringM = std(0x7DF3FF, { transparent: true, opacity: 0.55, emissive: 0x3FE0E8, emissiveIntensity: 0.8, roughness: 0.1 });
  const ring = M(new THREE.TorusGeometry(1.65, 0.05, 10, 64), ringM, [0, 0.45, 0], null, [Math.PI / 2, 0, 0]);
  const ring2 = M(new THREE.TorusGeometry(1.45, 0.025, 8, 64), ringM, [0, 0.3, 0], null, [Math.PI / 2, 0, 0]);
  ring.userData.noFit = ring2.userData.noFit = true;
  g.add(ring, ring2);
  out.anim.push((t) => { ring.rotation.z = t * 0.4; ring.position.y = 0.45 + Math.sin(t * 1.3) * 0.05; ring2.rotation.z = -t * 0.5; });
  return out;
}

const BUILDERS = { tecolote: buildTecolote, monarca: buildMonarca, ayotl: buildAyotl };

// ── Llama del tonalli ───────────────────────────────────────────────────────
function teardrop(w, h) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = w * Math.pow(Math.sin(Math.PI * Math.min(t, 0.999)), 0.8) * Math.pow(1 - t, 0.6) * 1.6;
    pts.push(new THREE.Vector2(Math.max(r, 0.0005), t * h));
  }
  return new THREE.LatheGeometry(pts, 20);
}
function buildFlame(tier) {
  const g = new THREE.Group();
  const parts = [];
  if (tier.ember) {
    g.add(S(0.13, std(0x4A4250, { emissive: 0xFF5A1F, emissiveIntensity: 0.25, roughness: 0.9 }), [0, 0.08, 0], [1.2, 0.7, 1.2]));
    for (let i = 0; i < 3; i++) {
      const s = S(0.03, std(0xFF7A3A, { emissive: 0xFF5A1F, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }), [0, 0.2, 0]);
      s.userData.spark = i;
      g.add(s);
      parts.push(s);
    }
  } else {
    const s = tier.size;
    const outer = M(teardrop(0.18 * s, 0.62 * s), std(tier.outer, { emissive: tier.outer, emissiveIntensity: 0.7, transparent: true, opacity: 0.95, roughness: 1 }));
    const inner = M(teardrop(0.11 * s, 0.42 * s), std(tier.inner, { emissive: tier.inner, emissiveIntensity: 1, transparent: true, opacity: 0.95, roughness: 1 }), [0, 0.02, 0.03 * s]);
    g.add(outer, inner);
    parts.push(outer, inner);
    if (tier.core) {
      const c = M(teardrop(0.055 * s, 0.22 * s), std(tier.core, { emissive: tier.core, emissiveIntensity: 1.1, roughness: 1 }), [0, 0.03, 0.06 * s]);
      g.add(c);
      parts.push(c);
    }
    if (tier.petals) {
      const ring = new THREE.Group();
      ring.userData.ring = true;
      const pm = std(tier.petals, { emissive: tier.petals, emissiveIntensity: 0.5 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ring.add(S(0.05 * s, pm, [Math.cos(a) * 0.34 * s, 0.2 * s, Math.sin(a) * 0.34 * s], [1, 0.35, 0.7], [0, -a, 0]));
      }
      g.add(ring);
      parts.push(ring);
    }
  }
  g.userData.parts = parts;
  g.userData.tier = tier;
  return g;
}
function buildHourglass() {
  const g = new THREE.Group();
  const wood = std(0x7A4A24, { roughness: 0.7 });
  const glass = std(0xDFF3FF, { transparent: true, opacity: 0.35, roughness: 0.1 });
  const sand = std(0xF2C14E, { emissive: 0xF2A01E, emissiveIntensity: 0.25 });
  const disc = new THREE.CylinderGeometry(0.13, 0.13, 0.035, 16);
  g.add(M(disc, wood, [0, 0.2, 0]), M(disc, wood, [0, -0.2, 0]));
  const bulb = new THREE.ConeGeometry(0.1, 0.18, 16);
  g.add(M(bulb, glass, [0, 0.09, 0], null, [Math.PI, 0, 0]), M(bulb, glass, [0, -0.09, 0]));
  g.add(M(new THREE.ConeGeometry(0.06, 0.07, 12), sand, [0, 0.05, 0], null, [Math.PI, 0, 0]));
  g.add(M(new THREE.ConeGeometry(0.085, 0.1, 12), sand, [0, -0.13, 0]));
  const post = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6);
  g.add(M(post, wood, [0.11, 0, 0]), M(post, wood, [-0.11, 0, 0]));
  return g;
}

function disposeTree(o) {
  o.traverse((n) => {
    if (n.geometry && !SHARED.has(n.geometry)) n.geometry.dispose();
    if (n.material) {
      const ms = Array.isArray(n.material) ? n.material : [n.material];
      ms.forEach((m) => { if (m !== WHITE) m.dispose(); });   // las texturas viven en el caché
    }
  });
}

const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);

/**
 * Crea la escena de una mascota con su cámara, luces, animación y reacciones.
 *
 * opts.framing: 'stage' → el modelo crece con la etapa dentro del mismo encuadre
 *               'fit'   → el modelo llena el encuadre en cualquier etapa
 * opts.outfit:  traje de la tienda ('skin_mariachi'…) o null (ver petOutfits.js)
 */
export function createPetController({ petType = 'monarca', stage = 1, framing = 'fit', showFlame = false, showShadow = true, baseRotation = -0.35, outfit = null } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xFFF4E6, 0x5B3F66, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(3, 6, 5);
  const rim = new THREE.DirectionalLight(0x9DB4FF, 2.4);
  rim.position.set(-4, 3, -5);
  const fill = new THREE.DirectionalLight(0xFFE6F0, 1.0);
  fill.position.set(-4, 1, 4);
  scene.add(key, rim, fill);

  const root = new THREE.Group();          // giro (arrastre y balanceo)
  const body = new THREE.Group();          // reacciones (brinco, aplastar, sacudir)
  root.add(body);
  scene.add(root);
  const flameHolder = new THREE.Group();
  scene.add(flameHolder);
  let shadow = null;
  if (showShadow) {
    shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.blobShadowTex(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    scene.add(shadow);
  }

  const st = {
    petType, stage, framing, showFlame, outfit, aspect: 1,
    model: null, height: 1, width: 1, extraTop: 0, fullWidth: 1,
    flame: null, hourglass: null, zs: [],
    streakDays: 0, streakStatus: 'activa', mood: 'happy',
    rotY: baseRotation, rotVel: 0, dragging: false, lastDrag: -1e9,
    reaction: null, reactionT0: 0, popT0: -10, time: 0, reduceMotion: false,
    // Mirada: sigue el dedo (x, y de -1 a 1) y vuelve al frente al soltar
    look: { tx: 0, ty: 0, x: 0, y: 0, until: -1 },
    caress: null, caressT0: 0,               // 'rub' | 'headpat' | 'tickle'
    hearts: [],
  };

  function frame() {
    const flameH = st.showFlame ? 0.85 : 0;
    // El traje (sombrero, penacho) agranda el encuadre en vez de encoger a la mascota
    const contentH = (st.framing === 'stage' ? STAGE_H[5] : st.height) + st.extraTop + flameH;
    const contentW = Math.max(st.framing === 'stage' ? 2.6 : st.width, st.fullWidth, 1.2);
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const margin = 1.12;
    const dist = Math.max((contentH * margin) / 2 / half, (contentW * margin) / 2 / (half * st.aspect));
    const cy = contentH / 2 - 0.05;
    camera.position.set(0, cy + dist * 0.14, dist);
    camera.lookAt(0, cy, 0);
    camera.aspect = st.aspect;
    camera.updateProjectionMatrix();
  }

  function rebuild() {
    if (st.model) { body.remove(st.model.wrap); disposeTree(st.model.wrap); }
    const builder = BUILDERS[st.petType] || BUILDERS.monarca;
    const m = builder(Math.max(1, Math.min(6, st.stage)));
    const inner = m.g;
    // Los adornos que orbitan (páginas, pétalos, anillos, burbujas) no cuentan para el encuadre
    const loose = [];
    inner.traverse((n) => { if (n.userData.noFit) loose.push([n, n.parent]); });
    loose.forEach(([n, p]) => p.remove(n));
    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const targetH = st.framing === 'stage' ? STAGE_H[st.stage - 1] : FIT_H;
    const s = Math.min(targetH / size.y, (st.framing === 'stage' ? 2.9 : 2.5) / Math.max(size.x, size.z * 1.1));
    inner.scale.setScalar(s);
    const b2 = new THREE.Box3().setFromObject(inner);
    const c = b2.getCenter(new THREE.Vector3());
    inner.position.set(-c.x, -b2.min.y, -c.z);
    st.height = b2.max.y - b2.min.y;
    st.width = Math.max(b2.max.x - b2.min.x, b2.max.z - b2.min.z);
    // Traje: se pone después de medir, así la mascota conserva su tamaño
    st.extraTop = 0;
    st.fullWidth = st.width;
    if (wearOutfit(m, inner)) {
      const b3 = new THREE.Box3().setFromObject(inner);
      st.extraTop = Math.max(0, b3.max.y - st.height);
      st.fullWidth = Math.max(b3.max.x - b3.min.x, b3.max.z - b3.min.z);
    }
    loose.forEach(([n, p]) => p.add(n));
    const wrap = new THREE.Group();
    wrap.add(inner);
    body.add(wrap);
    st.model = { ...m, wrap, inner, baseScale: s };
    if (shadow) shadow.scale.set(Math.min(st.width, 2.2) * 0.9, Math.min(st.width, 2.2) * 0.9, 1);
    rim.color.setHex(RIM[st.petType] || RIM.monarca);
    st.popT0 = st.time;
    frame();
    syncFlame();
  }

  // Coloca el traje en el ancla de cabeza; quita lo que reemplaza (cascarón-sombrero, luna)
  function wearOutfit(m, inner) {
    if (!st.outfit || !m.head) return false;
    const a = m.head;
    const piece = buildOutfit(st.outfit, a);
    if (!piece) return false;
    (a.hides || []).forEach((h) => h.parent?.remove(h));
    const holder = new THREE.Group();
    holder.position.set(a.c[0], a.c[1], a.c[2]);
    holder.scale.setScalar(a.r);
    holder.add(piece);
    (a.parent || inner).add(holder);
    return true;
  }

  function syncFlame() {
    const wantFlame = st.showFlame;
    const tier = st.streakStatus === 'apagada' ? FLAME_TIERS[0] : flameTierFor(st.streakDays);
    if (!wantFlame || !st.flame || st.flame.userData.tier !== tier) {
      if (st.flame) { flameHolder.remove(st.flame); disposeTree(st.flame); st.flame = null; }
      if (wantFlame) { st.flame = buildFlame(tier); flameHolder.add(st.flame); }
    }
    const risk = wantFlame && st.streakStatus === 'riesgo';
    if (risk && !st.hourglass) { st.hourglass = buildHourglass(); st.hourglass.scale.setScalar(0.9); st.hourglass.position.set(0.55, 0.3, 0); flameHolder.add(st.hourglass); }
    if (!risk && st.hourglass) { flameHolder.remove(st.hourglass); disposeTree(st.hourglass); st.hourglass = null; }
    flameHolder.position.set(0, st.height + st.extraTop + 0.1, 0);
    flameHolder.scale.setScalar(0.85);
  }

  function syncZs() {
    const sleeping = st.mood === 'sleepy';
    if (sleeping && !st.zs.length) {
      for (let i = 0; i < 3; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.zTex(), transparent: true, depthWrite: false, color: 0xffffff }));
        sp.userData.ph = i / 3;
        scene.add(sp);
        st.zs.push(sp);
      }
    }
    if (!sleeping && st.zs.length) { st.zs.forEach((z) => { scene.remove(z); z.material.dispose(); }); st.zs = []; }
  }

  // Corazones que salen de la cabeza al acariciarla
  function spawnHearts(n) {
    for (let i = 0; i < n; i++) {
      let h = st.hearts.find((x) => x.userData.t0 == null);
      if (!h) {
        if (st.hearts.length >= 6) return;
        h = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.heartTex(), transparent: true, depthWrite: false }));
        h.visible = false;
        scene.add(h);
        st.hearts.push(h);
      }
      h.userData.t0 = st.time + i * 0.18;
      h.userData.dx = (Math.random() - 0.5) * 0.7;
    }
  }

  // ¿El dedo cae en la cabeza, en el cuerpo o fuera de la mascota?
  const raycaster = new THREE.Raycaster();
  function zoneAt(nx, ny) {
    const m = st.model;
    if (!m) return null;
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const hit = raycaster.intersectObject(m.wrap, true)[0];
    if (!hit) return null;
    const a = m.head;
    if (!a) return 'body';
    const owner = a.parent || m.inner;
    const center = owner.localToWorld(new THREE.Vector3(a.c[0], a.c[1], a.c[2]));
    const r = a.r * new THREE.Vector3().setFromMatrixScale(owner.matrixWorld).x;
    // En el tecolote cabeza y cuerpo son la misma bola: cuenta la mitad de arriba
    return hit.point.distanceTo(center) <= r * 1.25 && hit.point.y >= center.y - r * 0.2 ? 'head' : 'body';
  }

  rebuild();

  const fx = { flap: 0, wobble: 0, speed: 1, droop: 0 };

  return {
    scene,
    camera,
    setSize(w, h) { st.aspect = Math.max(0.1, w / Math.max(1, h)); frame(); },
    setPet(nextType, nextStage) {
      if (nextType === st.petType && nextStage === st.stage) return;
      st.petType = nextType; st.stage = nextStage;
      rebuild();
    },
    setStreak(days, status = 'activa') {
      st.streakDays = days || 0; st.streakStatus = status;
      syncFlame();
    },
    setShowFlame(v) { st.showFlame = !!v; frame(); syncFlame(); },
    /** Ponerle o quitarle (null) un traje; la mascota hace un pequeño "pop" al cambiar. */
    setOutfit(id) {
      const next = id || null;
      if (next === st.outfit) return;
      st.outfit = next;
      rebuild();
    },
    setMood(mood) { st.mood = mood || 'happy'; syncZs(); },
    setReduceMotion(v) { st.reduceMotion = !!v; },
    /** kind: 'tap' | 'correct' | 'combo' | 'wrong' | 'hint' (voltea al teclado) */
    react(kind) {
      st.reaction = kind; st.reactionT0 = st.time;
      if (kind === 'hint') { st.look.tx = 0.15; st.look.ty = -0.95; st.look.until = st.time + 2.6; }
    },
    /** La mirada sigue un punto de la vista (x, y de -1 a 1); null la suelta. */
    lookAt(nx, ny) {
      if (nx == null) { st.look.until = Math.min(st.look.until, st.time + 0.5); return; }
      st.look.tx = Math.max(-1, Math.min(1, nx));
      st.look.ty = Math.max(-1, Math.min(1, ny));
      st.look.until = st.time + 1.5;
    },
    /** Caricias: 'rub' (frotar), 'headpat' (palmadita en la cabeza), 'tickle' (cosquillas). */
    pet(kind) {
      st.caress = kind; st.caressT0 = st.time;
      if (!st.reduceMotion) spawnHearts(kind === 'tickle' ? 3 : kind === 'rub' ? 2 : 1);
    },
    zoneAt,
    dragBy(dxPixels) { st.rotY += dxPixels * 0.012; st.rotVel = dxPixels * 0.012; st.dragging = true; st.lastDrag = st.time; },
    release() { st.dragging = false; st.lastDrag = st.time; },

    update(dt) {
      st.time += Math.min(dt, 0.1);
      const t = st.time;
      const m = st.model;
      const still = st.reduceMotion;

      // ánimo
      const mood = st.mood;
      const sleeping = mood === 'sleepy';
      const low = mood === 'sad' || mood === 'hungry';
      fx.speed = sleeping ? 0.35 : low ? 0.6 : 1;
      fx.droop = low ? 1 : sleeping ? 0.6 : 0;

      // reacciones
      let hop = 0, sq = 0, shake = 0, spin = 0, wob = 0;
      fx.flap = 0;
      if (st.reaction && !still) {
        const p = t - st.reactionT0;
        const r = st.reaction;
        const egg = st.stage === 1 || m.noHop;
        if (egg || r === 'wrong') {
          wob = (r === 'wrong' ? 0.16 : 0.25) * Math.sin(p * 25) * Math.exp(-4 * p);
          if (r === 'wrong') { shake = wob; sq = -0.04 * Math.exp(-3 * p); }
        } else {
          const hops = r === 'combo' ? 2 : 1;
          const dur = 0.42;
          if (r !== 'tap' && p < dur * hops) hop = Math.abs(Math.sin((p / dur) * Math.PI)) * (r === 'combo' ? 0.32 : r === 'hint' ? 0.08 : 0.24);
          if (r === 'tap' && p < 0.3) hop = Math.sin((p / 0.3) * Math.PI) * 0.1;
          sq = -0.18 * Math.exp(-5 * p) * Math.cos(14 * p);
          if (r === 'combo' && p < 0.85) spin = Math.PI * 2 * (0.5 - 0.5 * Math.cos((p / 0.85) * Math.PI));
          fx.flap = p < 0.6 ? Math.sin(p * 20) * 0.3 * (1 - p / 0.6) : 0;
        }
        if (p > 1.6) st.reaction = null;
      }
      // alegría: brinquito cada 3 s
      if (mood === 'joyful' && !still && !st.reaction && st.stage > 1 && !m.noHop) {
        const q = t % 3;
        if (q < 0.35) hop = Math.sin((q / 0.35) * Math.PI) * 0.12;
      }

      // caricias
      let squint = 1;
      let puff = 0;
      if (st.caress) {
        const p = t - st.caressT0;
        const dur = st.caress === 'rub' ? 1.4 : st.caress === 'tickle' ? 1.1 : 0.9;
        if (p > dur) st.caress = null;
        else if (!still) {
          const fade = 1 - p / dur;
          squint = 0.3;                                      // ojitos felices ^^
          const egg = st.stage === 1 || m.noHop;
          if (st.caress === 'rub') {
            wob += Math.sin(p * 9) * 0.07 * fade;              // se mece contenta
            puff = 0.05 * fade;                                // se esponja
            fx.flap += Math.sin(p * 14) * 0.25 * fade;
          } else if (st.caress === 'headpat') {
            sq += -0.12 * Math.exp(-6 * p) * Math.cos(12 * p); // aplastadito
          } else {
            wob += Math.sin(p * 32) * 0.13 * fade;             // se retuerce de risa
            if (!egg) hop = Math.max(hop, Math.abs(Math.sin(p * 9)) * 0.1 * fade);
            fx.flap += Math.sin(p * 24) * 0.45 * fade;
          }
        }
      }
      fx.wobble = wob;

      // mirada: hacia el dedo mientras toca, luego regresa al frente
      const lk = st.look;
      const following = !still && t < lk.until;
      lk.x += ((following ? lk.tx : 0) - lk.x) * 0.15;
      lk.y += ((following ? lk.ty : 0) - lk.y) * 0.15;

      // giro: arrastre con inercia, luego balanceo suave hacia la vista 3/4
      if (!st.dragging) {
        if (t - st.lastDrag > 2.5 && !still) st.rotY += (baseRotation + Math.sin(t * 0.35) * 0.45 - st.rotY) * 0.02;
        else { st.rotY += st.rotVel; st.rotVel *= 0.9; }
      }
      root.rotation.y = st.rotY + spin + lk.x * 0.35;
      body.rotation.x = -lk.y * 0.08;

      // aparición al cambiar de etapa
      const pp = Math.min(1, (t - st.popT0) / 0.48);
      const pop = still ? 1 : 0.7 + 0.3 * easeOutBack(pp);
      const breath = still ? 0 : Math.sin(t * (sleeping ? 1.2 : 2.4)) * (sleeping ? 0.02 : 0.012);
      const bob = still || sleeping ? 0 : Math.abs(Math.sin(t * 2.1)) * 0.03;
      body.position.y = hop + bob - fx.droop * 0.02;
      body.rotation.z = shake || wob;
      body.scale.set(pop * (1 - sq * 0.6 + puff) * (low ? 0.98 : 1), pop * (1 + sq + breath + puff * 0.5) * (low ? 0.96 : 1), pop * (1 - sq * 0.6 + puff));
      if (!still) m.anim.forEach((f) => f(t, fx));

      // ojos: parpadeo, sueño y tristeza
      const blink = !still && t % 3.6 > 3.45 ? 0.12 : 1;
      const eyeY = sleeping ? 0.08 : Math.min(low ? Math.min(blink, 0.6) : blink, squint);
      m.eyes.forEach((e) => {
        if (e.userData.baseRY == null) e.userData.baseRY = e.rotation.y;
        e.scale.y = eyeY;
        e.rotation.y = e.userData.baseRY + lk.x * 0.45;         // las pupilas siguen el dedo
        e.rotation.x = -lk.y * 0.35;
      });

      // corazones de las caricias
      st.hearts.forEach((h) => {
        const t0 = h.userData.t0;
        if (t0 == null) return;
        const p = (t - t0) / 1.1;
        if (p < 0) { h.visible = false; return; }
        if (p >= 1) { h.visible = false; h.userData.t0 = null; return; }
        const base = V3(h.userData.dx, st.height * 0.9 + p * 0.7, 0.35).applyAxisAngle(V3(0, 1, 0), root.rotation.y);
        h.visible = true;
        h.position.set(base.x, base.y + body.position.y, base.z);
        const sc = 0.16 + Math.sin(Math.min(1, p * 3) * Math.PI / 2) * 0.08;
        h.scale.set(sc, sc, sc);
        h.material.opacity = 1 - p * p;
      });

      if (shadow) {
        const k = 1 - Math.min(0.5, hop * 1.5);
        shadow.scale.x = shadow.scale.y = Math.min(st.width, 2.2) * 0.9 * k;
        shadow.material.opacity = 0.9 * k;
      }

      // llama
      if (st.flame) {
        flameHolder.rotation.y = root.rotation.y;
        flameHolder.position.y = st.height + st.extraTop + 0.1 + hop + (still ? 0 : Math.sin(t * 2) * 0.04);
        const risk = st.streakStatus === 'riesgo';
        const tier = st.flame.userData.tier;
        st.flame.userData.parts.forEach((p, i) => {
          if (p.userData.ring) { if (!still) p.rotation.y = t * 1.4; return; }
          if (p.userData.spark != null) {
            if (!still) {
              const ph = (t * 0.6 + p.userData.spark / 3) % 1;
              p.position.set(Math.sin(ph * 9 + p.userData.spark) * 0.06, 0.15 + ph * 0.45, 0);
              p.material.opacity = 1 - ph;
            }
            return;
          }
          if (!still) {
            const f = 1 + Math.sin(t * (9 + i * 3)) * 0.05 + Math.sin(t * (14 + i)) * 0.03;
            const k = risk ? 0.85 : 1;
            p.scale.set(k / f, f * (risk ? 0.75 + Math.abs(Math.sin(t * 5)) * 0.35 : 1), k / f);
          }
          if (!tier.ember) p.material.opacity = risk ? 0.45 + Math.abs(Math.sin(t * 3.2)) * 0.4 : 0.95;
        });
        if (st.hourglass && !still) { st.hourglass.rotation.y = t * 0.8; st.hourglass.rotation.z = Math.sin(t * 1.5) * 0.15; }
      }

      // Zzz al dormir
      if (st.zs.length) {
        const base = V3(0.45, st.height * 0.8, 0.2).applyAxisAngle(V3(0, 1, 0), root.rotation.y);
        st.zs.forEach((z) => {
          const ph = still ? z.userData.ph : (t * 0.35 + z.userData.ph) % 1;
          const s = 0.18 + ph * 0.25;
          z.position.set(base.x + ph * 0.35, base.y + ph * 0.8, base.z);
          z.scale.set(s, s, s);
          z.material.opacity = still ? 0.9 : Math.sin(ph * Math.PI);
        });
      }
    },

    dispose() {
      disposeTree(scene);
      st.zs = [];
      st.hearts = [];
    },
  };
}
