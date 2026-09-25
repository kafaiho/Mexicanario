const assert = require('node:assert/strict');
const {
  getStreakCycleDay,
  getDailyStreakReward,
  getMilestoneForDay,
  getNextMilestoneProgress,
  getStreakPhrase,
} = require('./streakRewards.js');

// Weekly cycle mirrors convex/streaks.ts recordDailyPlay
assert.equal(getStreakCycleDay(0), 0);
assert.equal(getStreakCycleDay(1), 1);
assert.equal(getStreakCycleDay(7), 7);
assert.equal(getStreakCycleDay(8), 1);
assert.deepEqual(getDailyStreakReward(1), { coins: 10, isPinata: false });
assert.deepEqual(getDailyStreakReward(6), { coins: 35, isPinata: false });
assert.deepEqual(getDailyStreakReward(14), { coins: null, isPinata: true });

assert.equal(getMilestoneForDay(7).diamonds, 35);
assert.equal(getMilestoneForDay(8), null);

const p = getNextMilestoneProgress(10);
assert.equal(p.milestone.days, 14);
assert.equal(p.daysLeft, 4);
assert.equal(p.progress, 3 / 7);
assert.equal(p.progressBefore, 2 / 7);
assert.equal(getNextMilestoneProgress(0).milestone.days, 7);
assert.equal(getNextMilestoneProgress(400), null);

assert.match(getStreakPhrase(1), /arrancaste/);
assert.match(getStreakPhrase(51), /51 días/);

console.log('streakRewards tests passed');
