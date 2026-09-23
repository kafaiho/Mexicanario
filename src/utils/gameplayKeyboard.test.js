const assert = require('node:assert/strict');
const {
  getBackspaceTargetIndex,
  getCursorAfterHint,
} = require('./gameplayKeyboard');

assert.equal(
  getCursorAfterHint({
    word: 'TACO',
    fixedLetters: [],
    selectedIndex: 0,
    revealedIndex: 0,
  }),
  1,
  'a hint on the selected tile advances to the next editable tile',
);

assert.equal(
  getCursorAfterHint({
    word: 'MA IZ',
    fixedLetters: [0, 1, 3, 4],
    selectedIndex: 4,
    revealedIndex: 4,
  }),
  -1,
  'a completed answer has no remaining editable tile',
);

assert.equal(
  getCursorAfterHint({
    word: 'TACO',
    fixedLetters: [],
    selectedIndex: 0,
    revealedIndex: 2,
  }),
  0,
  'a hint elsewhere keeps the current editable tile selected',
);

assert.equal(
  getBackspaceTargetIndex({
    word: 'TACO',
    guess: ['T', '', '', ''],
    fixedLetters: [],
    selectedIndex: 1,
  }),
  0,
  'one backspace removes the previous letter when the cursor is on an empty tile',
);

assert.equal(
  getBackspaceTargetIndex({
    word: 'EL SOL',
    guess: ['E', 'L', ' ', 'S', '', ''],
    fixedLetters: [1],
    selectedIndex: 4,
  }),
  3,
  'backspace skips spaces and fixed hint letters',
);

assert.equal(
  getBackspaceTargetIndex({
    word: 'TACO',
    guess: ['T', 'A', '', ''],
    fixedLetters: [],
    selectedIndex: 1,
  }),
  1,
  'backspace clears the selected tile when it contains an editable letter',
);

console.log('gameplayKeyboard: hint cursor and backspace behavior passed');
