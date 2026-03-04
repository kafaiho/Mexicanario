# Mexicanario Testing Requirements

## 1. Economy Logic (Coins)
- Players should receive **0 coins** for completing a single word in `src/screens/GameplayScreen.jsx`.
- Players should receive **100 coins** as a "Bono de satisfacción" when completing an entire category/zone.
- The "Protector de Racha" (Streak Freeze) should cost **400 coins**.

## 2. Daily Rewards
- The daily reward system in `convex/streaks.ts` and `convex/dailyRewards.ts` should follow a 7-day cycle:
    - Day 1: 10 coins
    - Day 2: 15 coins
    - Day 3: 20 coins
    - Day 4: 25 coins
    - Day 5: 30 coins
    - Day 6: 35 coins
    - Day 7: **Variable reward between 50 and 200 coins** (Piñata).

## 3. Premium Content
- Categories marked as "+18" (e.g., "Insultos Finos") should be **locked** until purchased for **1,000 coins**.
- Backend should enforce this check in `convex/levels.ts`.

## 4. Mascot Skins
- Mascot `PetSprite` should display regional accessories (emojis) based on the `wordRegion` provided in `GameplayScreen.jsx`.
