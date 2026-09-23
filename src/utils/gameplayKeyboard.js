function isEditableIndex(index, word, fixedLetters) {
  return index >= 0
    && index < word.length
    && word[index] !== ' '
    && !fixedLetters.has(index);
}

function getCursorAfterHint({ word, fixedLetters = [], selectedIndex, revealedIndex }) {
  if (!word) return -1;

  const locked = new Set(fixedLetters);
  locked.add(revealedIndex);

  if (isEditableIndex(selectedIndex, word, locked)) return selectedIndex;

  for (let offset = 1; offset <= word.length; offset += 1) {
    const candidate = (revealedIndex + offset) % word.length;
    if (isEditableIndex(candidate, word, locked)) return candidate;
  }

  return -1;
}

function getBackspaceTargetIndex({ word, guess = [], fixedLetters = [], selectedIndex }) {
  if (!word) return -1;

  const locked = new Set(fixedLetters);
  const hasEditableLetter = (index) =>
    isEditableIndex(index, word, locked)
    && Boolean(guess[index])
    && guess[index] !== ' ';

  if (hasEditableLetter(selectedIndex)) return selectedIndex;

  for (let index = selectedIndex - 1; index >= 0; index -= 1) {
    if (hasEditableLetter(index)) return index;
  }

  return -1;
}

module.exports = {
  getBackspaceTargetIndex,
  getCursorAfterHint,
};
