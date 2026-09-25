// ─────────────────────────────────────────────────────────────────────────────
// Pista de la mascota — ayuda suave y gratis, una vez por palabra.
//
// Si llevas un rato sin avanzar (o fallaste dos veces), la mascota voltea al
// teclado y hace brillar la tecla de la letra que sigue. No escribe la letra por
// ti: eso sigue siendo el power-up "Revelar letra" de la tienda.
// ─────────────────────────────────────────────────────────────────────────────

export const PET_HINT_IDLE_MS = 20000;   // sin teclear durante 20 s
export const PET_HINT_WRONG_TRIES = 2;   // o dos intentos fallidos
export const PET_HINT_GLOW_MS = 7000;    // cuánto brilla la tecla

export const PET_HINT_PHRASES = [
  'Psst… mira el teclado 👀',
  '¿Te echo la mano? Fíjate en la tecla que brilla ✨',
  'Yo que tú, probaba esa letrita 😉',
  'Ándale, ahí te va una ayudadita 💡',
];

// Letra del teclado para una letra de la palabra: sin acentos, pero la Ñ se queda
export function keyForLetter(letter) {
  if (!letter) return null;
  const up = letter.toUpperCase();
  if (up === 'Ñ') return 'Ñ';
  return up.normalize('NFD').replace(/[̀-ͯ]/g, '') || null;
}

/**
 * La casilla que conviene destrabar: la seleccionada si le falta su letra; si
 * no, la primera casilla escribible vacía o equivocada.
 */
export function nextHintTarget({ word, guess = [], fixedLetters = [], selectedIndex = -1 }) {
  if (!word) return null;
  const needs = (i) =>
    i >= 0 && i < word.length && word[i] !== ' ' && !fixedLetters.includes(i)
    && keyForLetter(guess[i]) !== keyForLetter(word[i]);
  const index = needs(selectedIndex) ? selectedIndex : [...word].findIndex((_, i) => needs(i));
  if (index < 0) return null;
  return { index, key: keyForLetter(word[index]) };
}

/** ¿Toca ofrecer la pista ahora? */
export function shouldOfferPetHint({ now, lastInputAt, wrongTries = 0, used = false, solved = false }) {
  if (used || solved) return false;
  return wrongTries >= PET_HINT_WRONG_TRIES || now - lastInputAt >= PET_HINT_IDLE_MS;
}
