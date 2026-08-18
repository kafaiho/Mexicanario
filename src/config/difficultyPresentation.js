function getChallengePresentation(level) {
  const visible = level?.culturalOrderVersion === 2 && level?.isChallenge === true;
  return { visible, label: "Reto cultural", icon: "⭐" };
}

module.exports = { getChallengePresentation };
