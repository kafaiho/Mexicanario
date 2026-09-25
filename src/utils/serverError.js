// Texto legible de un error de una mutación de Convex.
//
// Convex solo entrega al cliente el dato de un `ConvexError` (e.data). El texto
// de un `Error` normal llega envuelto en desarrollo
//   "[CONVEX M(shop:buyWithCoins)] [Request ID: …] Server Error
//    Uncaught Error: Monedas insuficientes …  Called by client"
// y en producción se oculta como "Server Error". Nunca mostramos ese texto crudo.
export function serverErrorText(e, fallback = 'Algo salió mal. Intenta de nuevo.') {
  if (typeof e?.data === 'string' && e.data.trim()) return e.data;
  if (typeof e?.data?.message === 'string') return e.data.message;
  const message = typeof e?.message === 'string' ? e.message : '';
  const uncaught = message.match(/Uncaught (?:Convex)?Error: ([^\n]+)/);
  if (uncaught) return uncaught[1].trim();
  if (!message || /\[CONVEX|Server Error|Called by client|Request ID/.test(message)) return fallback;
  return message;
}
