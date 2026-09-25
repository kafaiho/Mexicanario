// ─────────────────────────────────────────────────────────────────────────────
// Texturas procedurales de las mascotas 3D.
//
// Se generan pixel por pixel en un Uint8Array (THREE.DataTexture) porque en
// React Native no existe <canvas>. Cada función recibe (u, v) con v hacia
// arriba (v = 0 abajo, v = 1 arriba) y devuelve [r, g, b, a] de 0 a 255.
// Se cachean: cada textura se calcula una sola vez por sesión.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

const cache = new Map();

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
const over = (base, top, alpha) => mix(base, top, Math.max(0, Math.min(1, alpha)));
const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (edge, width, d) => clamp01((edge - d) / width + 0.5); // 1 dentro, 0 fuera, borde suave

// Hash determinista 2D → [0, 1)
function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  const x = ax + dx * t - px, y = ay + dy * t - py;
  return Math.sqrt(x * x + y * y);
}

/** Crea (o reutiliza) una DataTexture de w×h a partir de fn(u, v, px, py). */
export function dataTexture(key, w, h, fn, { repeat = true } = {}) {
  if (cache.has(key)) return cache.get(key);
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = fn((x + 0.5) / w, (y + 0.5) / h, x + 0.5, y + 0.5);
      const i = (y * w + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = c.length > 3 ? c[3] : 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; }
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

export function disposeTextureCache() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}

// Estrellas sobre una cuadrícula con hash (barato: solo revisa celdas vecinas)
function starField(px, py, cell, density, seed, maxR) {
  const cx = Math.floor(px / cell), cy = Math.floor(py / cell);
  let best = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = cx + i, gy = cy + j;
    if (hash2(gx, gy, seed) > density) continue;
    const sx = (gx + hash2(gx, gy, seed + 1)) * cell, sy = (gy + hash2(gx, gy, seed + 2)) * cell;
    const r = 0.5 + hash2(gx, gy, seed + 3) * maxR;
    const d = Math.hypot(px - sx, py - sy);
    best = Math.max(best, smooth(r, 1, d) * (0.45 + hash2(gx, gy, seed + 4) * 0.55));
  }
  return best;
}

// Distancia al borde de una cuadrícula de hexágonos (punta arriba), dibujados al 92 %
function hexEdge(px, py, s) {
  const hw = s * Math.sqrt(3) / 2;
  const row = Math.round(py / (s * 1.5));
  let best = Infinity;
  for (let r = row - 1; r <= row + 1; r++) {
    const off = (r & 1) ? hw : 0;
    const col = Math.round((px - off) / (hw * 2));
    for (let c = col - 1; c <= col + 1; c++) {
      const cx = c * hw * 2 + off, cy = r * s * 1.5;
      const qx = px - cx, qy = py - cy;
      const d = Math.max(Math.abs(qx), Math.abs(qx * 0.5 + qy * 0.8660254), Math.abs(-qx * 0.5 + qy * 0.8660254));
      if (d < best) best = d;
    }
  }
  return Math.abs(best - s * 0.92 * 0.8660254);
}

// ── Texturas concretas ──────────────────────────────────────────────────────

export const starEggTex = () => dataTexture('starEgg', 256, 128, (u, v, px, py) => {
  let c = mix(hex(0x1B1447), hex(0x3A2F86), v);
  c = over(c, [255, 250, 225], starField(px, py, 9, 0.55, 3, 1.1));
  const gold = hex(0xE8B93A);
  if ((v > 0.456 && v < 0.48) || (v > 0.356 && v < 0.38)) c = gold;
  const tri = Math.abs(frac(u * 16) * 2 - 1);                      // zigzag entre las dos bandas
  const zz = 0.43 + (tri - 0.5) * 0.08;
  c = over(c, gold, smooth(0.011, 0.006, Math.abs(v - zz)));
  return c;
});

export const ribTex = () => dataTexture('rib', 256, 64, (u) => {
  const f = frac(u * 24);
  const k = 0.45 * (1 - Math.abs(f * 2 - 1));
  return over(hex(0xF4EBCF), [170, 140, 90], k);
});

// Bandas horizontales que se repiten 3 veces de polo a polo
export const bandTex = (key, colors, widths) => dataTexture('band:' + key, 16, 128, (u, v) => {
  const tot = widths.reduce((a, b) => a + b, 0);
  let t = frac(v * 3) * tot;
  for (let i = 0; i < colors.length; i++) { if (t < widths[i]) return hex(colors[i]); t -= widths[i]; }
  return hex(colors[colors.length - 1]);
});

export const chevronTex = (base, mark) => dataTexture('chev:' + base + mark, 128, 128, (u, v, px, py) => {
  const X = px * 2, Y = py * 2;                                     // coordenadas en un lienzo de 256
  const lx = ((X - 10) % 38 + 38) % 38, ly = ((Y - 22) % 34 + 34) % 34;
  const d = Math.min(segDist(lx, ly, 0, 8, 9, 0), segDist(lx, ly, 9, 0, 18, 8));
  return over(hex(base), hex(mark), smooth(2.5, 1.2, d));
});

export const starBodyTex = () => dataTexture('starBody', 256, 128, (u, v, px, py) =>
  over(hex(0x2A2466), [255, 236, 170], starField(px, py, 11, 0.5, 11, 0.9)));

export const scarfTex = () => dataTexture('scarf', 128, 16, (u) => {
  const cols = [0xE4007C, 0xF6F1E8, 0x0FA3A3, 0xF6F1E8, 0xFFB000, 0xF6F1E8];
  return hex(cols[Math.floor(u * 24) % cols.length]);
});

export const codexTex = (seed) => dataTexture('codex' + seed, 64, 80, (u, v, px, py) => {
  const X = px * 2, Y = (80 - py) * 2;                             // lienzo 128×160, y hacia abajo
  let c = hex(0xF3E6C8);
  const inBorder = X > 6 && X < 122 && Y > 6 && Y < 154 && !(X > 10 && X < 118 && Y > 10 && Y < 150);
  if (inBorder) return hex(0xB5421E);
  const cols = [0xB5421E, 0x1E6E8C, 0x2B2466, 0xD9981A];
  for (let i = 0; i < 3; i++) {
    const gx = 22 + hash2(i, seed, 5) * 50, gy = 24 + i * 42;
    const d = Math.hypot(X - (gx + 14), Y - (gy + 14));
    if (d < 13 && d > 5) c = hex(cols[Math.floor(hash2(i, seed, 6) * 4)]);
    const bar = cols[Math.floor(hash2(i, seed, 7) * 4)];
    if (X > gx + 36 && X < gx + 58 && Y > gy + 4 && Y < gy + 10) c = hex(bar);
    if (X > gx + 36 && X < gx + 50 && Y > gy + 16 && Y < gy + 22) c = hex(bar);
  }
  return c;
}, { repeat: false });

export const sandTex = () => dataTexture('sand', 128, 128, (u, v, px, py) => {
  const r = hash2(Math.floor(px), Math.floor(py), 9);
  let c = hex(0xE7C98F);
  if (r < 0.12) c = over(c, [160, 120, 60], 0.35);
  else if (r > 0.9) c = over(c, [255, 245, 220], 0.5);
  return c;
});

export const dottedTex = () => dataTexture('dotted', 128, 64, (u, v, px, py) =>
  over(hex(0x231A24), [255, 255, 255], starField(px, py, 10, 0.55, 17, 2.2) > 0.3 ? 1 : 0));

export const kernelTex = () => dataTexture('kernel', 32, 64, (u, v, px, py) => {
  const row = Math.floor(py / 5), cx = ((px + (row & 1 ? 2.5 : 0)) % 5) - 2.5, cy = (py % 5) - 2.5;
  return over(hex(0xE7A400), hex(0xFFD34D), smooth(2, 0.8, Math.hypot(cx, cy)));
});

// Caparazones de tortuga. En la media esfera, v = 1 es la cima y v = 0 el borde.
export const shellTex = (kind) => dataTexture('shell:' + kind, 256, 128, (u, v, px, py) => {
  const X = px * 2, Y = (128 - py) * 2;                            // lienzo 512×256, y hacia abajo
  if (kind === 'hatch') {
    return over(hex(0x45433E), hex(0x6C685F), smooth(2.5, 1.2, hexEdge(X, Y, 44)));
  }
  if (kind === 'olive') {
    const base = mix(hex(0x56632A), hex(0x8A9A45), v);
    return over(over(base, hex(0x9CAF52), 0.2), hex(0x3F4A1C), smooth(3, 1.2, hexEdge(X, Y, 40)));
  }
  if (kind === 'jade') {
    if (v < 0.0625) return hex(0xE8C25A);
    const base = mix(hex(0x0E7F77), hex(0x3FE0C8), v);
    return over(base, hex(0xE8C25A), smooth(2.5, 1.2, hexEdge(X, Y, 46)));
  }
  // talavera poblana
  if (v < 0.047) return hex(0x1D3E9E);
  if (v < 0.086) return hex(0xF2B400);
  const blue = hex(0x1D3E9E);
  const s = 64, tx = X % s, ty = Y % s, cx = tx - s / 2, cy = ty - s / 2;
  let c = hex(0xF7F3EA);
  if (tx < 3.5 || ty < 3.5 || tx > s - 3.5 || ty > s - 3.5) c = over(c, blue, 0.9);
  for (let a = 0; a < 8; a++) {                                   // pétalos en roseta
    const ang = a * Math.PI / 4, ex = Math.cos(ang) * 12, ey = Math.sin(ang) * 12;
    const dx = cx - ex, dy = cy - ey;
    const rx = dx * Math.cos(ang) + dy * Math.sin(ang), ry = -dx * Math.sin(ang) + dy * Math.cos(ang);
    if ((rx * rx) / 81 + (ry * ry) / 20 < 1) c = blue;
  }
  if (Math.hypot(cx, cy) < 6) c = hex(0xF2B400);
  for (const [qx, qy] of [[0, 0], [s, 0], [0, s], [s, s]]) if (Math.hypot(tx - qx, ty - qy) < 7) c = blue;
  return c;
});

export const zTex = () => dataTexture('z', 32, 32, (u, v, px, py) => {
  const x = px, y = 32 - py;                                       // y hacia abajo
  const d = Math.min(segDist(x, y, 9, 9, 23, 9), segDist(x, y, 23, 9, 9, 23), segDist(x, y, 9, 23, 23, 23));
  return [255, 255, 255, Math.round(smooth(2.2, 1, d) * 255)];
}, { repeat: false });

export const blobShadowTex = () => dataTexture('blob', 64, 64, (u, v) => {
  const d = Math.hypot(u - 0.5, v - 0.5) * 2;
  return [20, 8, 30, Math.round(Math.pow(clamp01(1 - d), 1.6) * 150)];
}, { repeat: false });

/**
 * Textura de ala. `pts` es el contorno en coordenadas UV (0-1) y `root` la raíz del ala.
 * kind: 'monarch' (naranja con venas) | 'picado' (papel picado de cempasúchil).
 */
export function wingTex(key, kind, pts, root) {
  // Centros de los puntos blancos del borde: cada 2 puntos del contorno, metidos hacia el centro
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const dots = [];
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    if (Math.hypot(p[0] - root[0], p[1] - root[1]) < 0.22) continue;
    const dx = cx - p[0], dy = cy - p[1], L = Math.hypot(dx, dy) || 1;
    dots.push([p[0] + (dx / L) * 0.033, p[1] + (dy / L) * 0.033]);
  }
  return dataTexture('wing:' + kind + key, 160, 160, (u, v) => {
    // punto dentro del polígono
    let inside = false, edge = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
      edge = Math.min(edge, segDist(u, v, xi, yi, xj, yj));
    }
    if (!inside) return [0, 0, 0, 0];
    const dRoot = Math.hypot(u - root[0], v - root[1]);
    if (kind === 'monarch') {
      let c = dRoot < 0.5 ? mix(hex(0xC9500A), hex(0xF28C1B), dRoot / 0.5) : mix(hex(0xF28C1B), hex(0xFFB347), (dRoot - 0.5) / 0.6);
      // venas: rectas de la raíz hacia puntos del contorno
      let vein = Infinity;
      for (let i = 4; i < pts.length - 2; i += 5) vein = Math.min(vein, segDist(u, v, root[0], root[1], pts[i][0], pts[i][1]));
      c = over(c, hex(0x15101A), smooth(0.009, 0.004, vein));
      if (edge < 0.062) {
        c = hex(0x15101A);
        for (const [dx, dy] of dots) {
          if (Math.hypot(u - dx, v - dy) < 0.0135) { c = [255, 255, 255]; break; }
        }
      }
      return [c[0], c[1], c[2], 255];
    }
    // papel picado: recortes en rombo y flor, borde dorado
    if (edge < 0.034) return [255, 211, 77, 255];
    let c = dRoot < 0.55 ? mix(hex(0xFF2E8A), hex(0xFF5CA8), dRoot / 0.55) : mix(hex(0xFF5CA8), hex(0xFFA41C), (dRoot - 0.55) / 0.55);
    const X = u * 512, Y = (1 - v) * 512;
    const row = Math.round((Y - 40) / 58);
    const off = (row & 1) ? 29 : 0;
    const col = Math.round((X - 40 - off) / 58);
    const cx = 40 + col * 58 + off, cy = 40 + row * 58;
    const far = Math.hypot(cx / 512 - root[0], (1 - cy / 512) - root[1]) > 0.14;
    if (far && edge > 0.05) {
      const dx = X - cx, dy = Y - cy;
      const flower = (((cx + cy) / 58) | 0) % 3 === 0;
      if (flower) {
        for (let a = 0; a < 5; a++) {
          const an = a * Math.PI * 2 / 5;
          if (Math.hypot(dx - Math.cos(an) * 9, dy - Math.sin(an) * 9) < 7) return [0, 0, 0, 0];
        }
      } else if (Math.abs(dx) / 9 + Math.abs(dy) / 13 < 1) return [0, 0, 0, 0];
    }
    for (let i = 6; i < pts.length - 3; i += 8) {
      if (segDist(u, v, root[0], root[1], pts[i][0], pts[i][1]) < 0.004) c = over(c, [255, 255, 255], 0.55);
    }
    return [c[0], c[1], c[2], 255];
  }, { repeat: false });
}
