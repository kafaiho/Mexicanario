/**
 * Pure helpers for presenting a level word: tile rows and answer-safe clues.
 */
import { normalizeText } from './textUtils.js';

// Tiles per row before a multi-word phrase wraps to another row.
const PACKED_ROW_LETTERS = 12;
const MAX_ROWS = 3;
const MAX_ROW_LETTERS = 14;
// GameplayScreen allocates 40 tile animations; spaces count as indices too.
const MAX_WORD_CHARS = 40;

const CONNECTORS = new Set(['A', 'DE', 'DEL', 'EL', 'EN', 'LA', 'LAS', 'LO', 'LOS', 'Y']);

/** Splits a display word ("JUEGO DE PELOTA") into segments with their start index. */
export function splitWordSegments(word) {
  const segs = [];
  let cur = { startIdx: 0, letters: '' };
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ' ') {
      segs.push(cur);
      cur = { startIdx: i + 1, letters: '' };
    } else {
      cur.letters += word[i];
    }
  }
  segs.push(cur);
  return segs;
}

/**
 * Groups segments into tile rows. Up to 3 words keep one row each (historic
 * layout); longer phrases pack short words together so they fit in 3 rows.
 */
export function buildTileRows(word) {
  const segs = splitWordSegments(word);
  if (segs.length <= MAX_ROWS) return segs.map((seg) => [seg]);
  const rows = [];
  let row = [];
  let rowLetters = 0;
  for (const seg of segs) {
    if (row.length > 0 && rowLetters + seg.letters.length > PACKED_ROW_LETTERS) {
      rows.push(row);
      row = [];
      rowLetters = 0;
    }
    row.push(seg);
    rowLetters += seg.letters.length;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

export function rowLetterCount(row) {
  return row.reduce((sum, seg) => sum + seg.letters.length, 0);
}

/** True when the display word fits the tile layout. */
export function isWordPlayable(word) {
  if (!word || word.length > MAX_WORD_CHARS) return false;
  const rows = buildTileRows(word);
  if (rows.length > MAX_ROWS) return false;
  return rows.every((row) => rowLetterCount(row) <= MAX_ROW_LETTERS);
}

/** Normalizes text char by char, remembering each normalized char's source index. */
function normalizeWithIndexMap(text) {
  let norm = '';
  const map = [];
  for (let i = 0; i < text.length; i++) {
    const n = normalizeText(text[i]);
    for (let k = 0; k < n.length; k++) {
      norm += n[k];
      map.push(i);
    }
  }
  return { norm, map };
}

const isLetter = (ch) => !!ch && /[A-ZÑ]/.test(ch);

/**
 * Replaces the answer inside a clue text with stars — accent-insensitive and
 * tolerant to inflections ("tapatío" also hides "tapatía", "echar" hides "echaron").
 */
export function censorWordInText(text, word) {
  if (!text || !word) return text || '';
  const tokens = normalizeText(word).replace(/[^A-ZÑ ]/g, '').split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => t.length >= 3 && !CONNECTORS.has(t));
  const targets = meaningful.length > 0 ? meaningful : tokens;
  if (targets.length === 0) return text;

  const { norm, map } = normalizeWithIndexMap(text);
  const spans = [];
  for (const token of targets) {
    const stem = token.length >= 6 ? token.slice(0, -2) : token;
    let from = 0;
    while (from < norm.length) {
      const at = norm.indexOf(stem, from);
      if (at === -1) break;
      from = at + 1;
      if (isLetter(norm[at - 1])) continue; // must start a word
      let end = at + stem.length;
      while (isLetter(norm[end])) end++;
      if (end - at > token.length + 3) continue; // a different, longer word
      spans.push([map[at], map[end - 1] + 1]);
    }
  }
  if (spans.length === 0) return text;

  spans.sort((a, b) => b[0] - a[0]);
  let out = text;
  let lastStart = Infinity;
  for (const [start, end] of spans) {
    if (end > lastStart) continue; // overlapping span already censored
    out = out.slice(0, start) + '★'.repeat(Math.min(end - start, 6)) + out.slice(end);
    lastStart = start;
  }
  return out;
}
