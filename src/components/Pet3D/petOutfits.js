// ─────────────────────────────────────────────────────────────────────────────
// Trajes 3D de la tienda (skin_*): piezas que se le ponen a la mascota en la
// cabeza y el cuello. Se modelan para una cabeza de radio 1 con la cara hacia +z;
// petModels.js las coloca y escala con el "ancla" de cabeza de cada etapa:
//
//   head: { parent?, c: [x,y,z], r, top?, shape?, eyeY?, eyeDX?, eyeR?, faceZ?, neck?: [y,z], hides? }
//
//   c/r    centro y radio de la cabeza (coordenadas del modelo)
//   top    altura de la coronilla en radios (1 = esfera); hatLift = fracción donde asienta el sombrero
//   seatR  radio de la cabeza a esa altura (se calcula si es esfera)
//   shape  escala de la cabeza si no es esfera (para la máscara)
//   eye*   posición y tamaño de los ojos, en radios
//   neck   [y, z] del cuello en radios; sin cuello no hay moño ni collar
//   hides  piezas del modelo que el traje reemplaza (cascarón-sombrero, luna)
//
// Solo three.js: lo usan la app (Pet3DView) y scripts/pet3d-preview.html.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

export const OUTFIT_IDS = ['skin_mariachi', 'skin_charro', 'skin_lucha', 'skin_catrina', 'skin_azteca'];

const std = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...(o || {}) });
function M(geo, mat, p, s, r) {
  const m = new THREE.Mesh(geo, mat);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (s) m.scale.set(s[0], s[1], s[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  return m;
}
const ball = () => new THREE.SphereGeometry(1, 18, 12);
const S = (r, mat, p, s, rot) => M(ball(), mat, p, s ? [s[0] * r, s[1] * r, s[2] * r] : [r, r, r], rot);
const lathe = (pts, segs = 40) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(Math.max(x, 0.0005), y)), segs);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function anchorInfo(a) {
  const hatLift = a.hatLift ?? 0.8;
  const shape = a.shape ?? [1, 1, 1];
  return {
    top: a.top ?? 1,
    hatLift,
    // radio de la cabeza donde asienta el sombrero (corona de flores)
    seatR: a.seatR ?? Math.sqrt(1 - hatLift * hatLift) * shape[0],
    shape,
    hasEyes: a.eyeR != null,
    eyeY: a.eyeY ?? 0.15,
    eyeDX: a.eyeDX ?? 0.35,
    eyeR: a.eyeR ?? 0.22,
    faceZ: a.faceZ ?? 0.95,
    neck: a.neck ?? null,
  };
}

// ── Sombreros ───────────────────────────────────────────────────────────────
function sombrero({ brimR, crownR, crownH, peak, felt, band, trim, studs }) {
  const g = new THREE.Group();
  const feltMat = std(felt, { roughness: 0.78, side: THREE.DoubleSide });
  // Ala: plana junto a la copa y levantada en la orilla
  g.add(M(lathe([[crownR * 0.9, 0.03], [brimR * 0.55, -0.02], [brimR * 0.82, 0.03], [brimR * 0.97, 0.16], [brimR, 0.27]]), feltMat));
  const trimMat = std(trim, { metalness: 0.75, roughness: 0.3 });
  g.add(M(new THREE.TorusGeometry(brimR * 0.995, 0.045, 8, 48), trimMat, [0, 0.27, 0], null, [Math.PI / 2, 0, 0]));
  g.add(M(new THREE.TorusGeometry(brimR * 0.72, 0.022, 6, 48), trimMat, [0, 0.012, 0], null, [Math.PI / 2, 0, 0]));
  // Copa
  g.add(M(lathe([[crownR, 0], [crownR * 0.98, crownH * 0.45], [crownR * (peak ? 0.7 : 0.86), crownH * 0.82], [crownR * (peak ? 0.3 : 0.55), crownH], [0, crownH * (peak ? 1.04 : 1.01)]]), feltMat));
  g.add(M(new THREE.TorusGeometry(crownR * 1.0, 0.07, 10, 40), std(band, { roughness: 0.5 }), [0, 0.09, 0], [1, 1, 1.6], [Math.PI / 2, 0, 0]));
  // Botonadura / bordado sobre el ala
  if (studs) {
    const stud = std(studs, { metalness: 0.85, roughness: 0.25 });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.add(S(0.045, stud, [Math.cos(a) * brimR * 0.84, 0.05, Math.sin(a) * brimR * 0.84]));
    }
  }
  return g;
}

function wearHat(hat, a) {
  hat.position.y = a.top * a.hatLift;
  hat.rotation.set(-0.1, 0, -0.14);
  return hat;
}

// ── Cuello ──────────────────────────────────────────────────────────────────
function bowTie(color, a) {
  const g = new THREE.Group();
  const mat = std(color, { roughness: 0.5 });
  [-1, 1].forEach((s) => g.add(S(1, mat, [s * 0.2, 0, 0], [0.22, 0.15, 0.08], [0, 0, s * 0.25])));
  g.add(S(0.075, std(new THREE.Color(color).multiplyScalar(0.7).getHex()), [0, 0, 0.03]));
  g.position.set(0, a.neck[0], a.neck[1] + 0.04);
  return g;
}

function paliacate(a) {
  const g = new THREE.Group();
  const tri = new THREE.Shape();
  tri.moveTo(-0.46, 0.1); tri.lineTo(0.46, 0.1); tri.lineTo(0, -0.42); tri.lineTo(-0.46, 0.1);
  g.add(M(new THREE.ShapeGeometry(tri), std(0xC62828, { roughness: 0.8, side: THREE.DoubleSide })));
  const dot = std(0xFFFFFF, { roughness: 0.8 });
  [[-0.22, 0.02], [0.22, 0.02], [0, -0.05], [-0.1, -0.18], [0.1, -0.18], [0, -0.3]].forEach(([x, y]) => g.add(S(0.03, dot, [x, y, 0.01], [1, 1, 0.3])));
  // Nudo
  g.add(S(0.08, std(0xA31F1F), [0, 0.1, 0.02]));
  g.position.set(0, a.neck[0], a.neck[1] + 0.06);
  g.rotation.x = -0.25;
  return g;
}

function jadeCollar(a) {
  const g = new THREE.Group();
  const jade = std(0x2FBF9A, { roughness: 0.25, metalness: 0.2 });
  const gold = std(0xF2C14E, { metalness: 0.8, roughness: 0.3 });
  for (let i = -3; i <= 3; i++) {
    const t = i / 3;
    g.add(S(i === 0 ? 0.1 : 0.065, i % 2 ? gold : jade, [t * 0.42, -(1 - t * t) * 0.08, -Math.abs(t) * 0.18]));
  }
  g.position.set(0, a.neck[0], a.neck[1] + 0.03);
  return g;
}

// ── Máscara de luchador ─────────────────────────────────────────────────────
function luchaMask(a) {
  const g = new THREE.Group();
  const red = std(0xD62828, { roughness: 0.45, side: THREE.DoubleSide });
  const gold = std(0xF2C14E, { metalness: 0.7, roughness: 0.3 });
  const white = std(0xFFFFFF, { roughness: 0.5 });
  // Capucha: cubre la cabeza hasta arriba de los ojos
  const edge = clamp(a.eyeY + a.eyeR * 1.15, -0.4, 0.8);
  const hood = M(new THREE.SphereGeometry(1.06, 36, 18, 0, Math.PI * 2, 0, Math.acos(edge)), red);
  hood.scale.set(a.shape[0], a.shape[1], a.shape[2]);
  g.add(hood);
  // Franja dorada de la frente a la nuca
  const crest = new THREE.Group();
  crest.rotation.y = -Math.PI / 2;
  crest.scale.set(a.shape[2], a.shape[1], a.shape[0]);
  crest.add(M(new THREE.TorusGeometry(1.08, 0.075, 8, 36, Math.PI - Math.asin(edge)), gold, null, null, [0, 0, Math.asin(edge)]));
  g.add(crest);
  // Antifaz: aros blancos y dorados alrededor de los ojos, con flamas hacia atrás
  [-1, 1].forEach((s) => {
    const eye = new THREE.Group();
    eye.position.set(s * a.eyeDX, a.eyeY, a.faceZ + 0.02);
    eye.rotation.y = s * 0.28;
    eye.add(M(new THREE.TorusGeometry(a.eyeR * 1.22, 0.075, 8, 28), white));
    eye.add(M(new THREE.TorusGeometry(a.eyeR * 1.22 + 0.1, 0.045, 8, 28), gold, [0, 0, -0.02]));
    for (let i = 0; i < 3; i++) {
      eye.add(M(new THREE.ConeGeometry(0.07, 0.34 - i * 0.06, 8), gold, [s * (a.eyeR * 1.3 + 0.18), 0.12 - i * 0.12, -0.08], null, [0, 0, -s * (1.2 + i * 0.25)]));
    }
    g.add(eye);
  });
  return g;
}

// ── Catrina: corona de flores ───────────────────────────────────────────────
const FLOWER_COLORS = [0xFF8C00, 0xE4007C, 0xFFC400, 0x8E3FC7];
function flower(color, scale) {
  const f = new THREE.Group();
  const petal = std(color, { roughness: 0.55 });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    f.add(S(1, petal, [Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0], [0.1, 0.06, 0.035], [0, 0, a]));
  }
  f.add(S(0.06, std(color === 0xFFC400 ? 0xB5541A : 0xFFE27A, { roughness: 0.5 }), [0, 0, 0.03]));
  f.scale.setScalar(scale);
  return f;
}
function flowerCrown(a) {
  const g = new THREE.Group();
  const h = a.top * a.hatLift - 0.05;
  const rr = a.seatR * 1.08;
  const leaf = std(0x3E9A45, { roughness: 0.6 });
  const n = 9;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const front = Math.cos(ang) > 0.9;
    const f = flower(FLOWER_COLORS[i % FLOWER_COLORS.length], front ? 1.8 : 1.3);
    f.position.set(Math.sin(ang) * rr, h, Math.cos(ang) * rr);
    f.rotation.order = 'YXZ';
    f.rotation.set(-0.55, ang, 0);
    g.add(f);
    const la = ang + Math.PI / n;
    g.add(S(1, leaf, [Math.sin(la) * rr * 0.98, h - 0.02, Math.cos(la) * rr * 0.98], [0.1, 0.035, 0.05], [0, la + Math.PI / 2, 0.4]));
  }
  g.rotation.x = -0.12;
  return g;
}
function catrinaFace(a) {
  const g = new THREE.Group();
  const deco = [std(0xE4007C, { roughness: 0.4 }), std(0x2FB8C9, { roughness: 0.4 })];
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 7; i++) {
      const t = (i / 7) * Math.PI * 2;
      g.add(S(0.035, deco[i % 2], [s * a.eyeDX + Math.cos(t) * a.eyeR * 1.55, a.eyeY + Math.sin(t) * a.eyeR * 1.55, a.faceZ - 0.02]));
    }
  });
  return g;
}

// ── Penacho azteca ──────────────────────────────────────────────────────────
function penacho(a) {
  const g = new THREE.Group();
  const h = Math.min(a.top * 0.5, 0.6);
  const rr = Math.sqrt(Math.max(0.25, 1 - h * h)) * 1.05;
  const gold = std(0xF2C14E, { metalness: 0.8, roughness: 0.28, emissive: 0x8A6410, emissiveIntensity: 0.2 });
  g.add(M(new THREE.TorusGeometry(rr, 0.08, 10, 44), gold, [0, h, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
  // Medallón de turquesa en la frente
  g.add(M(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 24), std(0x1FB5B0, { roughness: 0.25, metalness: 0.2 }), [0, h + 0.06, rr + 0.04], null, [Math.PI / 2, 0, 0]));
  g.add(M(new THREE.TorusGeometry(0.18, 0.035, 8, 24), gold, [0, h + 0.06, rr + 0.06]));
  // Abanico de plumas de quetzal detrás de la cabeza
  const fan = new THREE.Group();
  fan.position.set(0, h + 0.05, -0.35);
  fan.rotation.x = -0.32;
  const green = std(0x0E9F6E, { roughness: 0.55, side: THREE.DoubleSide });
  const blue = std(0x1B5FD6, { roughness: 0.45 });
  const red = std(0xD62828, { roughness: 0.55 });
  const n = 11;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5;
    const len = 1 - Math.abs(t) * 0.55;
    const pv = new THREE.Group();
    pv.rotation.z = t * 2.5;
    pv.add(S(1, red, [0, 0.28, 0], [0.09, 0.22, 0.035]));
    pv.add(S(1, green, [0, 0.35 + len * 0.62, -0.01], [0.13, len * 0.62, 0.03]));
    pv.add(S(1, blue, [0, 0.35 + len * 1.22, 0.01], [0.1, 0.15, 0.035]));
    pv.add(S(0.045, gold, [0, 0.35 + len * 1.22, 0.05]));
    fan.add(pv);
  }
  g.add(fan);
  return g;
}

// ── Catálogo ────────────────────────────────────────────────────────────────
const BUILD = {
  skin_mariachi: (a) => {
    const g = new THREE.Group();
    g.add(wearHat(sombrero({ brimR: 1.4, crownR: 0.55, crownH: 0.62, felt: 0x1A1416, band: 0xB0892F, trim: 0xD9D9E0, studs: 0xD9D9E0 }), a));
    if (a.neck) g.add(bowTie(0xB3122E, a));
    return g;
  },
  skin_charro: (a) => {
    const g = new THREE.Group();
    g.add(wearHat(sombrero({ brimR: 1.5, crownR: 0.5, crownH: 0.95, peak: true, felt: 0xD9B77A, band: 0x6B3010, trim: 0x8A5A2B, studs: 0xE8E8EE }), a));
    if (a.neck) g.add(paliacate(a));
    return g;
  },
  skin_lucha: (a) => luchaMask(a),
  skin_catrina: (a) => {
    const g = new THREE.Group();
    g.add(flowerCrown(a));
    if (a.hasEyes) g.add(catrinaFace(a));
    return g;
  },
  skin_azteca: (a) => {
    const g = new THREE.Group();
    g.add(penacho(a));
    if (a.neck) g.add(jadeCollar(a));
    return g;
  },
};

export const hasOutfit3D = (skinId) => !!BUILD[skinId];

/** Construye el traje para una cabeza de radio 1 (o null si no existe). */
export function buildOutfit(skinId, head) {
  const build = BUILD[skinId];
  if (!build || !head) return null;
  const g = build(anchorInfo(head));
  g.userData.outfit = skinId;
  return g;
}
