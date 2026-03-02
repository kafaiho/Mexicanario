/**
 * Test file to demonstrate accent flexibility functionality
 * This shows how the game will handle different accent variations
 */

const { compareWordsFlexibly, normalizeText } = require('./textUtils.js');

// Test cases demonstrating accent flexibility
const testCases = [
  // Basic accent removal
  { input: "México", expected: "MEXICO" },
  { input: "Español", expected: "ESPANOL" },
  { input: "Niño", expected: "NINO" },
  { input: "Canción", expected: "CANCION" },
  { input: "Año", expected: "ANO" },
  { input: "Mañana", expected: "MANANA" },
  
  // Mixed case handling
  { input: "MéXiCo", expected: "MEXICO" },
  { input: "español", expected: "ESPANOL" },
  
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
  { word1: "ESPANOL", word2: "Español", shouldMatch: true },
  { word1: "nino", word2: "Niño", shouldMatch: true },
  { word1: "CANCION", word2: "Canción", shouldMatch: true },
  
  // Should not match (different words)
  { word1: "Hola", word2: "Adios", shouldMatch: false },
  { word1: "Mexico", word2: "Canada", shouldMatch: false },
  
  // Edge cases
  { word1: "", word2: "Hola", shouldMatch: false },
  { word1: "Hola", word2: "", shouldMatch: false },
  { word1: null, word2: "Hola", shouldMatch: false },
];

console.log("=== Accent Flexibility Test Results ===\n");

// Test normalization
console.log("1. Text Normalization Tests:");
testCases.forEach((test, index) => {
  const result = normalizeText(test.input);
  const passed = result === test.expected;
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
});

console.log("\n2. Word Comparison Tests:");
comparisonTests.forEach((test, index) => {
  const result = compareWordsFlexibly(test.word1, test.word2);
  const passed = result === test.shouldMatch;
  console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: "${test.word1}" vs "${test.word2}" → ${result} (should be: ${test.shouldMatch})`);
});

console.log("\n=== Game Examples ===");
console.log("In the game, players can now type:");
console.log("• 'Mexico' instead of 'México'");
console.log("• 'Espanol' instead of 'Español'");
console.log("• 'Nino' instead of 'Niño'");
console.log("• 'Cancion' instead of 'Canción'");
console.log("\nThe game will accept both versions as correct! 🎉");
