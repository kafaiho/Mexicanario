import assert from 'node:assert/strict';
import { createGestureTracker } from './petGestures.js';

// Toque corto
{
  const g = createGestureTracker();
  g.begin(100, 100, 0);
  assert.equal(g.end(103, 101, 120), 'tap');
}
// Arrastre largo o dedo sostenido: no es toque
{
  const g = createGestureTracker();
  g.begin(100, 100, 0);
  g.move(160, 100, 100);
  assert.equal(g.end(160, 100, 200), null);
  g.begin(100, 100, 1000);
  assert.equal(g.end(100, 100, 1600), null);
}
// Cuatro toques rápidos = cosquillas; luego empieza de nuevo
{
  const g = createGestureTracker();
  const results = [0, 200, 400, 600].map((t) => { g.begin(50, 50, t); return g.end(50, 50, t + 60); });
  assert.deepEqual(results, ['tap', 'tap', 'tap', 'tickle']);
  g.begin(50, 50, 900);
  assert.equal(g.end(50, 50, 960), 'tap');
}
// Toques espaciados no son cosquillas
{
  const g = createGestureTracker();
  const results = [0, 700, 1400, 2100].map((t) => { g.begin(50, 50, t); return g.end(50, 50, t + 60); });
  assert.ok(!results.includes('tickle'));
}
// Frotar de lado a lado
{
  const g = createGestureTracker();
  g.begin(100, 100, 0);
  const events: (string | null)[] = [];
  const path = [120, 140, 120, 100, 80, 100, 120, 140];
  path.forEach((x, i) => events.push(g.move(x, 100, (i + 1) * 60)));
  assert.ok(events.includes('rub'), 'dos cambios de dirección seguidos = frotar');
  assert.ok(g.rubbing);
  assert.equal(g.end(140, 100, 600), null, 'frotar no cuenta además como toque');
}
// Temblor pequeño no es frotar
{
  const g = createGestureTracker();
  g.begin(100, 100, 0);
  const events = [103, 99, 104, 98, 103].map((x, i) => g.move(x, 100, (i + 1) * 50));
  assert.ok(!events.includes('rub'));
}
// Arrastrar en una sola dirección (girar la mascota) no es frotar
{
  const g = createGestureTracker();
  g.begin(0, 100, 0);
  const events = [20, 40, 60, 80, 100, 120].map((x, i) => g.move(x, 100, (i + 1) * 50));
  assert.ok(!events.includes('rub'));
}

console.log('petGestures: toque, cosquillas y frotar se reconocen sin confundirse con girar');
