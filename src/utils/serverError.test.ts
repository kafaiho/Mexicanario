import assert from 'node:assert/strict';
import { serverErrorText } from './serverError.js';

// ConvexError: el dato llega igual en desarrollo y producción
assert.equal(serverErrorText({ data: 'Monedas insuficientes', message: '[CONVEX M(shop:buyWithCoins)] Server Error' }), 'Monedas insuficientes');
// Error normal en desarrollo: se extrae el texto de "Uncaught Error"
const dev = '[CONVEX M(shop:buyWithCoins)] [Request ID: abc] Server Error\nUncaught Error: Monedas insuficientes\n    at handler (../convex/shop.ts:204:40)\n\n  Called by client';
assert.equal(serverErrorText({ message: dev }), 'Monedas insuficientes');
// Error normal en producción: nunca se muestra el texto crudo
assert.equal(serverErrorText({ message: '[CONVEX M(shop:buyWithCoins)] [Request ID: abc] Server Error\n  Called by client' }, 'fallback'), 'fallback');
// Errores lanzados por la propia app se muestran tal cual
assert.equal(serverErrorText(new Error('Diamantes insuficientes')), 'Diamantes insuficientes');
assert.equal(serverErrorText(undefined, 'x'), 'x');

console.log('serverError: los errores del servidor se muestran legibles, sin texto crudo');
