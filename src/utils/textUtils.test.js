/**
 * Test file to demonstrate accent flexibility functionality.
 * Spanish accents are optional, but Ñ remains a distinct letter.
 */

const { compareWordsFlexibly, normalizeText } = require('./textUtils.js');

// Test cases demonstrating accent flexibility
const testCases = [
  // Basic accent removal
  { input: "México", expected: "MEXICO" },
  { input: "Español", expected: "ESPAÑOL" },
  { input: "Niño", expected: "NIÑO" },
  { input: "Canción", expected: "CANCION" },
  { input: "Año", expected: "AÑO" },
  { input: "Mañana", expected: "MAÑANA" },
  
  // Mixed case handling
  { input: "MéXiCo", expected: "MEXICO" },
  { input: "español", expected: "ESPAÑOL" },
  
  // No accents
  { input: "HOLA", expected: "HOLA" },
  { input: "hello", expected: "HELLO" },
  
  // Special characters
  { input: "¡Hola!", expected: "¡HOLA!" },
  { input: "¿Qué?", expected: "¿QUE?" },
];

// Test word comparisons
const comparisonTests = [
  // Should match (flexible about accents)
  { word1: "Mexico", word2: "México", shouldMatch: true },
  { word1: "CANCION", word2: "Canción", shouldMatch: true },

  // Ñ is a distinct Spanish letter, not an accented N
  { word1: "ESPANOL", word2: "Español", shouldMatch: false },
  { word1: "nino", word2: "Niño", shouldMatch: false },
  
  // Should not match (different words)
  { word1: "Hola", word2: "Adios", shouldMatch: false },
  { word1: "Mexico", word2: "Canada", shouldMatch: false },
  
  // Edge cases
  { word1: "", word2: "Hola", shouldMatch: false },
  { word1: "Hola", word2: "", shouldMatch: false },
  { word1: null, word2: "Hola", shouldMatch: false },
];

console.log("=== Accent Flexibility Test Results ===\n");

let failureCount = 0;

// Test normalization
console.log("1. Text Normalization Tests:");
testCases.forEach((test, index) => {
  const result = normalizeText(test.input);
  const passed = result === test.expected;
  if (!passed) failureCount += 1;
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
});

console.log("\n2. Word Comparison Tests:");
comparisonTests.forEach((test, index) => {
  const result = compareWordsFlexibly(test.word1, test.word2);
  const passed = result === test.shouldMatch;
  if (!passed) failureCount += 1;
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: "${test.word1}" vs "${test.word2}" → ${result} (should be: ${test.shouldMatch})`);
});

console.log("\n=== Game Examples ===");
console.log("In the game, players can now type:");
console.log("• 'Mexico' instead of 'México'");
console.log("• 'Cancion' instead of 'Canción'");
console.log("\nThe game accepts missing accents, while preserving Ñ as its own letter. 🎉");

if (failureCount > 0) {
  console.error(`\n${failureCount} test(s) failed.`);
  process.exitCode = 1;
}
