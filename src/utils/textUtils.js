/**
 * Text utility functions for flexible word matching
 */

/**
 * Strips accents and dieresis from a word for gameplay display.
 * Keeps Ñ (distinct Spanish letter). Used so tiles show "GUEY" not "GÜEY".
 */
export const normalizeWordForDisplay = (word) => {
  if (!word) return '';
  return word
    .toUpperCase()
    .replace(/Á/g, 'A')
    .replace(/É/g, 'E')
    .replace(/Í/g, 'I')
    .replace(/Ó/g, 'O')
    .replace(/Ú/g, 'U')
    .replace(/Ü/g, 'U');
};

/**
 * Normalizes text by removing accents and converting to uppercase
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text without accents
 * 
 * Examples:
 * - "México" → "MEXICO"
 * - "Español" → "ESPANOL" 
 * - "Niño" → "NINO"
 * - "Canción" → "CANCION"
 */
export const normalizeText = (text) => {
  if (!text) return '';

  let upperText = text.toUpperCase();

  try {
    if (typeof upperText.normalize === 'function') {
      return upperText
        .normalize('NFD') // Decompose characters with accents (é → e + ́)
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics (accents)
    }
  } catch (e) {
    // Fallback if normalize is not supported or throws an error
  }

  // Manual fallback for common Spanish characters
  return upperText
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N');
};

/**
 * Compares two words flexibly, ignoring accents and case
 * @param {string} word1 - First word to compare
 * @param {string} word2 - Second word to compare
 * @returns {boolean} - True if words match (ignoring accents and case)
 */
export const compareWordsFlexibly = (word1, word2) => {
  if (!word1 || !word2) return false;

  const normalized1 = normalizeText(word1);
  const normalized2 = normalizeText(word2);

  return normalized1 === normalized2;
};

/**
 * Checks if a word contains the target word flexibly (for partial matches)
 * @param {string} target - The target word to find
 * @param {string} word - The word to search in
 * @returns {boolean} - True if target is found in word
 */
export const containsWordFlexibly = (target, word) => {
  if (!target || !word) return false;

  const normalizedTarget = normalizeText(target);
  const normalizedWord = normalizeText(word);

  return normalizedWord.includes(normalizedTarget);
};

/**
 * Gets the original text with proper formatting for display
 * @param {string} text - The text to format
 * @returns {string} - Formatted text for display
 */
export const formatForDisplay = (text) => {
  if (!text) return '';

  // Keep original formatting but ensure first letter is uppercase
  return text.charAt(0).toUpperCase() + text.slice(1);
};
