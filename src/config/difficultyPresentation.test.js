const assert = require("node:assert/strict");
const { getChallengePresentation } = require("./difficultyPresentation");

assert.deepEqual(getChallengePresentation({ culturalOrderVersion: 2, isChallenge: true }), {
  visible: true,
  label: "Reto cultural",
  icon: "⭐",
});
assert.equal(getChallengePresentation({ culturalOrderVersion: 1, isChallenge: true }).visible, false);
assert.equal(getChallengePresentation({ culturalOrderVersion: 2, isChallenge: false }).visible, false);

console.log("difficultyPresentation: retos visibles solo en v2");
