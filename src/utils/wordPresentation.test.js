const assert = require('node:assert/strict');
const { normalizeWordForDisplay, normalizeText } = require('./textUtils.js');
const { buildTileRows, censorWordInText, isWordPlayable } = require('./wordPresentation.js');
const { MEXICO_VIVIDO_WORDS } = require('../../shared/mexicoVividoCatalogSource.js');

// Apostrophes and other untypable characters never become tiles.
assert.equal(normalizeWordForDisplay('yokot’an'), 'YOKOTAN');
assert.equal(normalizeWordForDisplay("me'phaa"), 'MEPHAA');
assert.equal(normalizeWordForDisplay('Pátzcuaro'), 'PATZCUARO');
assert.equal(normalizeWordForDisplay('piñata'), 'PIÑATA');

// Long phrases pack into at most three rows instead of being skipped.
assert.deepEqual(
  buildTileRows('JUEGO DE PELOTA MESOAMERICANO').map((row) => row.map((seg) => seg.letters).join(' ')),
  ['JUEGO DE', 'PELOTA', 'MESOAMERICANO'],
);
assert.deepEqual(
  buildTileRows('ECHAR LA MANO').map((row) => row.length),
  [1, 1, 1],
  'phrases of up to three words keep the historic one-word-per-row layout',
);

// Accent-insensitive, inflection-tolerant censoring.
assert.equal(censorWordInText('Jugamos lotería el domingo.', 'LOTERIA'), 'Jugamos ★★★★★★ el domingo.');
assert.equal(censorWordInText('Una artesana tapatía presentó.', 'TAPATIO'), 'Una artesana ★★★★★★ presentó.');
assert.equal(censorWordInText('Los vecinos nos echaron la mano.', 'ECHAR LA MANO'), 'Los vecinos nos ★★★★★★ la ★★★★.');
assert.equal(censorWordInText('Compramos mandarinas.', 'MANO'), 'Compramos mandarinas.', 'longer unrelated words stay visible');

const hasToken = (text, word) => {
  const normText = ` ${normalizeText(text).replace(/[^A-ZÑ]+/g, ' ')} `;
  return normalizeText(word).replace(/[^A-ZÑ ]/g, '').split(/\s+/)
    .filter((t) => t.length >= 4)
    .some((t) => normText.includes(` ${t} `));
};

for (const entry of MEXICO_VIVIDO_WORDS) {
  const display = normalizeWordForDisplay(entry.word);
  assert.ok(/^[A-ZÑ ]+$/.test(display), `${entry.word} only produces typable tiles`);
  assert.ok(isWordPlayable(display), `${entry.word} fits the tile layout`);
  assert.equal(hasToken(censorWordInText(entry.example, display), display), false, `example hint hides ${entry.word}`);
  assert.equal(hasToken(censorWordInText(entry.meaning, display), display), false, `meaning clue hides ${entry.word}`);
}

console.log(`wordPresentation: ${MEXICO_VIVIDO_WORDS.length} palabras jugables y pistas sin respuesta`);
