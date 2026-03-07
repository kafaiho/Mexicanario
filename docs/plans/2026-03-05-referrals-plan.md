# Sistema "Invita y Gana" — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an asymmetric referral system where referrers earn more than referred users, with milestone bonuses, deep link capture, and a Mexicanómetro-style modal UI.

**Architecture:** Deep link `mexicanario://ref=<username>` is captured via `expo-linking` in `AppContent` and stored in `AsyncStorage`. When the user registers, `registerAccount` mutation reads the pending code, calls `claimReferral` internally, and awards coins to both parties. Milestone bonuses (5/10/25/50 referrals) are checked server-side on every new referral. The UI lives in `InviteModal.jsx` (replaced from stub), styled like Mexicanómetro.

**Tech Stack:** Convex (mutations/queries), expo-linking, AsyncStorage, React Native Share API, expo-sharing

---

## Task 1: Schema — Add `referrals` table + `users` fields

**Files:**
- Modify: `convex/schema.ts`

### Step 1: Add `referralCount` and `referredBy` to the `users` table

In `convex/schema.ts`, inside the `users` `defineTable({...})` block, add after `mexPlusExpiresAt`:

```ts
// ── Sistema de referidos ─────────────────────────────────────────────────────
referredBy:    v.optional(v.id("users")), // quién me invitó (solo 1 vez)
referralCount: v.optional(v.number()),    // total de cuates que han entrado por mi link
```

### Step 2: Add the `referrals` table at the end of `defineSchema`, after `failedWords`

```ts
// ── Referidos (Invita y Gana) ─────────────────────────────────────────────────
referrals: defineTable({
  referrerId:     v.id("users"),
  referredId:     v.id("users"),
  createdAt:      v.number(),
  coinsReferrer:  v.number(),
  coinsReferred:  v.number(),
  milestoneBonus: v.optional(v.boolean()),
})
  .index("by_referrer", ["referrerId"])
  .index("by_referred",  ["referredId"]),
```

### Step 3: Verify Convex accepts the schema

Run the Convex dev server (`npx convex dev`) and confirm no schema errors in the terminal.

### Step 4: Commit

```bash
git add convex/schema.ts
git commit -m "feat(referrals): add referrals table + referredBy/referralCount to users schema"
```

---

## Task 2: Backend — `convex/referrals.ts` (new file)

**Files:**
- Create: `convex/referrals.ts`

### Step 1: Create the file with constants and helpers

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Reward constants ──────────────────────────────────────────────────────────
const COINS_REFERRED  = 200;   // referido recibe
const COINS_REFERRER  = 300;   // referidor recibe por cuate

// Milestone bonuses (awarded when referralCount hits these numbers)
const MILESTONES: Array<{ count: number; coins: number; diamonds: number }> = [
  { count: 5,  coins: 500,   diamonds: 2  },
  { count: 10, coins: 1000,  diamonds: 5  },
  { count: 25, coins: 2000,  diamonds: 15 },
  { count: 50, coins: 3000,  diamonds: 30 },
];

function getMilestoneBonus(newCount: number) {
  return MILESTONES.find((m) => m.count === newCount) ?? null;
}
```

### Step 2: Add the `claimReferral` mutation

```ts
// ── claimReferral ─────────────────────────────────────────────────────────────
// Called from registerAccount when a pendingRef username is provided.
// Safe to call multiple times — idempotent via referredBy check.
export const claimReferral = mutation({
  args: {
    referredUserId:  v.id("users"),
    referrerUsername: v.string(),
  },
  handler: async (ctx, { referredUserId, referrerUsername }) => {
    // 1. Find referrer by username
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", referrerUsername.toLowerCase().trim()))
      .first();

    if (!referrer) return { success: false, reason: "referrer_not_found" };

    // 2. Anti-abuse guards
    if (referrer._id === referredUserId) return { success: false, reason: "self_referral" };

    const referred = await ctx.db.get(referredUserId);
    if (!referred) return { success: false, reason: "referred_not_found" };
    if (referred.referredBy) return { success: false, reason: "already_referred" };

    // 3. Calculate new referral count (BEFORE this one)
    const newCount = (referrer.referralCount ?? 0) + 1;
    const milestone = getMilestoneBonus(newCount);

    // 4. Award referido
    await ctx.db.patch(referredUserId, {
      coins:      (referred.coins      ?? 0) + COINS_REFERRED,
      referredBy: referrer._id,
    });

    // 5. Award referidor (base + milestone bonus if applicable)
    const referrerCoinsGain  = COINS_REFERRER + (milestone?.coins   ?? 0);
    const referrerDiamondGain = milestone?.diamonds ?? 0;
    await ctx.db.patch(referrer._id, {
      coins:         (referrer.coins    ?? 0) + referrerCoinsGain,
      diamonds:      (referrer.diamonds ?? 0) + referrerDiamondGain,
      referralCount: newCount,
    });

    // 6. Record in referrals table
    await ctx.db.insert("referrals", {
      referrerId:     referrer._id,
      referredId:     referredUserId,
      createdAt:      Date.now(),
      coinsReferrer:  referrerCoinsGain,
      coinsReferred:  COINS_REFERRED,
      milestoneBonus: milestone ? true : undefined,
    });

    return {
      success:          true,
      coinsReferred:    COINS_REFERRED,
      coinsReferrer:    referrerCoinsGain,
      diamondsReferrer: referrerDiamondGain,
      milestoneReached: milestone ? milestone.count : null,
    };
  },
});
```

### Step 3: Add the `getReferralStats` query

```ts
// ── getReferralStats ──────────────────────────────────────────────────────────
// Returns stats for the InviteModal: total count + recent referrals list
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const referralCount = user?.referralCount ?? 0;

    // Most recent 10 referrals
    const rows = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .order("desc")
      .take(10);

    const list = await Promise.all(
      rows.map(async (r) => {
        const u = await ctx.db.get(r.referredId);
        return {
          referredId:    r.referredId as string,
          username:      u?.username ?? null,
          name:          u?.name     ?? "Cuate",
          createdAt:     r.createdAt,
          coinsReferrer: r.coinsReferrer,
          milestone:     r.milestoneBonus ?? false,
        };
      })
    );

    // Next milestone info
    const MILESTONE_COUNTS = [5, 10, 25, 50];
    const nextMilestone = MILESTONE_COUNTS.find((n) => n > referralCount) ?? null;

    return {
      referralCount,
      nextMilestone,
      username: user?.username ?? null,
      list,
    };
  },
});
```

### Step 4: Verify Convex compiles

The Convex dev terminal should show no TypeScript errors.

### Step 5: Commit

```bash
git add convex/referrals.ts
git commit -m "feat(referrals): add claimReferral mutation + getReferralStats query"
```

---

## Task 3: Wire `claimReferral` into `registerAccount`

**Files:**
- Modify: `convex/friends.ts`

### Step 1: Add optional `referrerUsername` arg to `registerAccount`

Find the `args` block of `registerAccount` (line ~33) and add:

```ts
referrerUsername: v.optional(v.string()),  // username del cuate que invitó
```

So the full args becomes:
```ts
args: {
  userId:           v.id("users"),
  email:            v.string(),
  password:         v.string(),
  username:         v.string(),
  referrerUsername: v.optional(v.string()),
},
```

### Step 2: Add referral claim at the end of the handler, before `return`

After `await ctx.db.patch(userId, patch);` and before the `return` statement, add:

```ts
// ── Claim referral bonus if invited by another user ───────────────────────────
let referralResult = null;
if (isFirstTime && args.referrerUsername) {
  try {
    // Use internal mutation helper — call the logic inline to stay in same transaction context
    const referrerUsername = args.referrerUsername.toLowerCase().trim();
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", referrerUsername))
      .first();

    if (referrer && referrer._id !== userId) {
      const referred = await ctx.db.get(userId);
      if (!referred?.referredBy) {
        const COINS_REFERRED  = 200;
        const COINS_REFERRER  = 300;
        const MILESTONES = [
          { count: 5,  coins: 500,   diamonds: 2  },
          { count: 10, coins: 1000,  diamonds: 5  },
          { count: 25, coins: 2000,  diamonds: 15 },
          { count: 50, coins: 3000,  diamonds: 30 },
        ];
        const newCount = (referrer.referralCount ?? 0) + 1;
        const milestone = MILESTONES.find((m) => m.count === newCount) ?? null;

        const referrerCoinsGain   = COINS_REFERRER + (milestone?.coins   ?? 0);
        const referrerDiamondGain = milestone?.diamonds ?? 0;

        // Patch referred user (we already patched coins above, add referral bonus on top)
        const currentReferred = await ctx.db.get(userId);
        await ctx.db.patch(userId, {
          coins:      (currentReferred?.coins ?? 0) + COINS_REFERRED,
          referredBy: referrer._id,
        });

        // Patch referrer
        await ctx.db.patch(referrer._id, {
          coins:         (referrer.coins    ?? 0) + referrerCoinsGain,
          diamonds:      (referrer.diamonds ?? 0) + referrerDiamondGain,
          referralCount: newCount,
        });

        await ctx.db.insert("referrals", {
          referrerId:     referrer._id,
          referredId:     userId,
          createdAt:      Date.now(),
          coinsReferrer:  referrerCoinsGain,
          coinsReferred:  COINS_REFERRED,
          milestoneBonus: milestone ? true : undefined,
        });

        referralResult = {
          coinsReferred:    COINS_REFERRED,
          coinsReferrer:    referrerCoinsGain,
          milestoneReached: milestone?.count ?? null,
        };
      }
    }
  } catch (e) {
    // Referral is non-critical — never block registration
    if (typeof __DEV__ !== "undefined" && __DEV__) console.log("[referral] error:", e);
  }
}
```

### Step 3: Add `referralResult` to the return value

Change the `return` to:

```ts
return {
  success:       true,
  coinsAdded:    isFirstTime ? REGISTER_COINS : 0,
  diamondsAdded: isFirstTime ? REGISTER_DIAMONDS : 0,
  referral:      referralResult,
};
```

### Step 4: Verify Convex compiles — check dev terminal for errors

### Step 5: Commit

```bash
git add convex/friends.ts
git commit -m "feat(referrals): wire claimReferral into registerAccount mutation"
```

---

## Task 4: Capture deep link in App.jsx

**Files:**
- Modify: `App.jsx`

The app already imports `expo-linking` indirectly via the Navigation `linking` config. We need to also capture `mexicanario://ref=*` at app start and store it in AsyncStorage.

### Step 1: Add `Linking` import at the top of App.jsx

Add to the existing React Native / Expo imports section:

```js
import * as Linking from "expo-linking";
```

### Step 2: Add deep link capture in `AppContent` useEffect

Inside `AppContent`, in the existing `useEffect` that runs on mount (the one with `initRevenueCat`, `autoFixDatabase`, etc.), add at the **very beginning** of the effect body:

```js
// ── Capture referral deep link at app open ─────────────────────────────────
(async () => {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      const parsed = Linking.parse(initialUrl);
      // e.g. mexicanario://ref?ref=kafai  OR  mexicanario://ref/kafai
      const refCode = parsed.queryParams?.ref ?? parsed.path?.replace(/^ref\/?/, "") ?? null;
      if (refCode && typeof refCode === "string" && refCode.trim()) {
        await AsyncStorage.setItem("@mexicanario:pendingRef", refCode.trim().toLowerCase());
      }
    }
  } catch (e) {
    if (__DEV__) console.log("[referral] getInitialURL error:", e);
  }
})();

// ── Also listen for links while app is already open ───────────────────────────
const linkingSub = Linking.addEventListener("url", ({ url }) => {
  try {
    const parsed = Linking.parse(url);
    const refCode = parsed.queryParams?.ref ?? parsed.path?.replace(/^ref\/?/, "") ?? null;
    if (refCode && typeof refCode === "string" && refCode.trim()) {
      AsyncStorage.setItem("@mexicanario:pendingRef", refCode.trim().toLowerCase()).catch(() => {});
    }
  } catch {}
});
```

### Step 3: Add cleanup for the listener in the same `useEffect` return

Add to the existing cleanup function (`return () => { ... }`):

```js
linkingSub.remove();
```

### Step 4: Verify the app still starts without errors in Expo Go / dev

### Step 5: Commit

```bash
git add App.jsx
git commit -m "feat(referrals): capture mexicanario://ref deep link into AsyncStorage"
```

---

## Task 5: Pass `pendingRef` from client to `registerAccount`

**Files:**
- Modify: `src/components/ProfileModal.jsx` (or wherever registerAccount is called from)

### Step 1: Find where `registerAccount` is called

```bash
grep -r "registerAccount" src/
```

Note the file(s) found. It is likely `src/components/ProfileModal.jsx`.

### Step 2: Read `pendingRef` from AsyncStorage before calling `registerAccount`

In the register handler function, before calling `registerAccount`, add:

```js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Inside the submit/register handler:
let pendingRef = null;
try {
  pendingRef = await AsyncStorage.getItem("@mexicanario:pendingRef");
} catch {}

const result = await registerAccount({
  userId,
  email,
  password,
  username,
  referrerUsername: pendingRef ?? undefined,
});

// Clear the pending ref after use (consumed, successful or not)
AsyncStorage.removeItem("@mexicanario:pendingRef").catch(() => {});
```

### Step 3: If `result.referral` is truthy, show a toast or info to the user

After `registerAccount` resolves, add:

```js
if (result.referral?.coinsReferred) {
  // Optional: show a toast — e.g. "¡Tu cuate te invitó! +200 monedas 🎉"
  // Use whatever toast/alert pattern the app uses (Alert.alert is fine)
  Alert.alert(
    "¡Bienvenido! 🎉",
    `Un cuate te invitó. ¡Ganaste ${result.referral.coinsReferred} monedas extra!`
  );
}
```

### Step 4: Verify registration still works without a pending ref (no regression)

### Step 5: Commit

```bash
git add src/components/ProfileModal.jsx
git commit -m "feat(referrals): pass pendingRef to registerAccount on client, clear after use"
```

---

## Task 6: Replace `InviteModal` stub with full Mexicanómetro-style UI

**Files:**
- Modify: `src/components/InviteModal.jsx`

This is the largest UI task. Replace the entire file.

### Step 1: Write the new InviteModal

```jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const BROWN  = "#8B4513";
const ORANGE = "#FF6B35";
const AMBER  = "#D2691E";
const GOLD   = "#F8BE17";
const GREEN  = "#2ECC71";

// Milestones shown in the vertical bar (must match backend MILESTONES)
const MILESTONES = [
  { count: 5,  emoji: "🌮", title: "Corredor de Voz",      reward: "+500 🪙 +2 💎" },
  { count: 10, emoji: "🎺", title: "Embajador del Barrio",  reward: "+1,000 🪙 +5 💎" },
  { count: 25, emoji: "🦅", title: "El Mero Influencer",    reward: "+2,000 🪙 +15 💎" },
  { count: 50, emoji: "🏆", title: "Leyenda del Barrio",    reward: "+3,000 🪙 +30 💎" },
];

function getNextMilestone(count) {
  return MILESTONES.find((m) => m.count > count) ?? null;
}

function barPositionForCount(count) {
  const max = MILESTONES[MILESTONES.length - 1].count;
  return Math.min(count / max, 1);
}

export default function InviteModal({ visible, onClose }) {
  const { userId } = useAuth();
  const stats = useQuery(
    api.referrals.getReferralStats,
    userId ? { userId } : "skip"
  );

  const fillAnim = useRef(new Animated.Value(0)).current;
  const count = stats?.referralCount ?? 0;
  const username = stats?.username ?? null;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fillAnim, {
      toValue: barPositionForCount(count),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [visible, count]);

  const BAR_HEIGHT = height * 0.42;

  const handleShare = async () => {
    if (!username) {
      // User has no username yet — prompt them to set one
      onClose();
      return;
    }
    const refLink = `mexicanario://ref?ref=${username}`;
    const message =
      `¡Juega Mexicanario conmigo! 🇲🇽🌮\n` +
      `Aprende el slang mexicano más chido.\n` +
      `Descárgalo y usa mi link para que ambos ganemos monedas:\n${refLink}`;
    try {
      await Share.share({ message, url: refLink });
    } catch {}
  };

  const nextM = getNextMilestone(count);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.title}>Invita y Gana 📣</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* ── Banner cuates actuales ── */}
          <View style={s.rankBanner}>
            <Text style={s.rankEmoji}>
              {count === 0 ? "🤝" : count < 5 ? "🌮" : count < 10 ? "🎺" : count < 25 ? "🦅" : "🏆"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rankTitle}>
                {count === 1 ? "1 cuate invitado" : `${count} cuates invitados`}
              </Text>
              <Text style={s.rankDesc}>
                {nextM
                  ? `Faltan ${nextM.count - count} para «${nextM.title}»`
                  : "¡Leyenda máxima alcanzada! 👑"}
              </Text>
            </View>
          </View>

          {/* ── Recompensa info ── */}
          <View style={s.rewardRow}>
            <View style={s.rewardPill}>
              <Text style={s.rewardPillText}>Tú ganas: +300 🪙 por cuate</Text>
            </View>
            <View style={[s.rewardPill, { backgroundColor: "#E8F5E9" }]}>
              <Text style={[s.rewardPillText, { color: "#2E7D32" }]}>Tu cuate: +200 🪙</Text>
            </View>
          </View>

          {/* ── Compartir button ── */}
          {username ? (
            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnText}>📲 Compartir mi link</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.noUsernameBanner}>
              <Text style={s.noUsernameText}>
                ⚠️ Elige un nombre de usuario en tu Perfil para poder invitar cuates
              </Text>
            </View>
          )}

          {/* ── Milestone bar (Mexicanómetro style) ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            <View style={[s.meterRow, { minHeight: BAR_HEIGHT }]}>

              {/* Vertical fill bar */}
              <View style={s.barTrack}>
                <Animated.View
                  style={[
                    s.barFill,
                    {
                      height: fillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
                {/* Current position indicator */}
                <View
                  style={[
                    s.posIndicator,
                    { bottom: `${Math.min(barPositionForCount(count) * 100, 96)}%` },
                  ]}
                >
                  <View style={s.posCircle}>
                    <Text style={s.posText}>{count}</Text>
                  </View>
                </View>
              </View>

              {/* Milestone cards */}
              <View style={s.milestoneList}>
                {[...MILESTONES].reverse().map((m) => {
                  const unlocked = count >= m.count;
                  return (
                    <View key={m.count} style={s.milestoneRow}>
                      <Text style={[s.mLevel, unlocked && s.mLevelUnlocked]}>
                        {m.count}
                      </Text>
                      <View style={[s.dot, unlocked && s.dotUnlocked]} />
                      <View style={[s.card, !unlocked && s.cardLocked]}>
                        {unlocked ? (
                          <>
                            <Text style={s.cardEmoji}>{m.emoji}</Text>
                            <View style={s.cardText}>
                              <Text style={s.cardTitle}>{m.title}</Text>
                              <Text style={s.cardDesc}>{m.reward}</Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text style={s.lockIcon}>🔒</Text>
                            <View style={s.cardText}>
                              <Text style={[s.cardTitle, { color: "#B09070" }]}>{m.title}</Text>
                              <Text style={[s.cardDesc, { color: "#C4A882" }]}>{m.reward}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#FFE4B5",
    borderRadius: width * 0.05,
    width: width * 0.88,
    maxHeight: height * 0.85,
    paddingBottom: height * 0.02,
    overflow: "hidden",
    borderWidth: width * 0.01,
    borderColor: BROWN,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.022,
    paddingBottom: height * 0.012,
    borderBottomWidth: 2,
    borderBottomColor: "#D2691E55",
  },
  title: { color: BROWN, fontWeight: "bold", fontSize: width * 0.053 },
  closeBtn: {
    width: width * 0.085,
    height: width * 0.085,
    borderRadius: width * 0.0425,
    backgroundColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontSize: width * 0.058, fontWeight: "bold", lineHeight: width * 0.068 },
  rankBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
    backgroundColor: "#F5DEB3",
    marginHorizontal: width * 0.04,
    marginTop: height * 0.015,
    borderRadius: width * 0.04,
    padding: width * 0.035,
    borderWidth: 2,
    borderColor: AMBER,
  },
  rankEmoji: { fontSize: width * 0.09 },
  rankTitle: { color: BROWN, fontWeight: "bold", fontSize: width * 0.042 },
  rankDesc:  { color: "#7A4020", fontSize: width * 0.029, marginTop: height * 0.003 },
  rewardRow: {
    flexDirection: "row",
    gap: width * 0.02,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.012,
  },
  rewardPill: {
    flex: 1,
    backgroundColor: "#FFF3CD",
    borderRadius: width * 0.03,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.02,
    borderWidth: 1.5,
    borderColor: AMBER,
    alignItems: "center",
  },
  rewardPillText: { color: BROWN, fontWeight: "bold", fontSize: width * 0.029 },
  shareBtn: {
    backgroundColor: GREEN,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.014,
    borderRadius: width * 0.04,
    paddingVertical: height * 0.016,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#27AE60",
  },
  shareBtnText: { color: "#fff", fontWeight: "bold", fontSize: width * 0.042 },
  noUsernameBanner: {
    backgroundColor: "#FFF8E1",
    marginHorizontal: width * 0.04,
    marginTop: height * 0.014,
    borderRadius: width * 0.04,
    padding: width * 0.04,
    borderWidth: 1.5,
    borderColor: AMBER,
  },
  noUsernameText: { color: BROWN, fontSize: width * 0.031, textAlign: "center" },
  scroll: { paddingHorizontal: width * 0.04, paddingBottom: height * 0.01, paddingTop: height * 0.014 },
  meterRow: { flexDirection: "row", gap: width * 0.02 },
  barTrack: {
    width: width * 0.025,
    backgroundColor: "#DEB887",
    borderRadius: width * 0.02,
    marginTop: height * 0.012,
    position: "relative",
    overflow: "visible",
  },
  barFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AMBER,
    borderRadius: width * 0.02,
  },
  posIndicator: {
    position: "absolute",
    left: width * -0.058,
    alignItems: "center",
  },
  posCircle: {
    backgroundColor: BROWN,
    borderRadius: width * 0.042,
    minWidth: width * 0.085,
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.005,
    alignItems: "center",
  },
  posText: { color: "#fff", fontWeight: "bold", fontSize: width * 0.029 },
  milestoneList: { flex: 1, gap: 0 },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.015,
    marginBottom: height * 0.017,
  },
  mLevel: { color: "#C4A882", fontWeight: "bold", fontSize: width * 0.034, width: width * 0.075, textAlign: "right" },
  mLevelUnlocked: { color: BROWN },
  dot: {
    width: width * 0.037,
    height: width * 0.037,
    borderRadius: width * 0.0185,
    backgroundColor: "#D2A679",
    borderWidth: 2,
    borderColor: "#B8926A",
  },
  dotUnlocked: { backgroundColor: GOLD, borderColor: "#C8950A" },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.025,
    backgroundColor: "#F5DEB3",
    borderRadius: width * 0.037,
    padding: width * 0.025,
    minHeight: height * 0.065,
    borderWidth: 1.5,
    borderColor: "#D2A679",
  },
  cardLocked: { backgroundColor: "#E8C99A", borderColor: "#C4A882" },
  cardEmoji: { fontSize: width * 0.074 },
  cardText:  { flex: 1 },
  cardTitle: { color: BROWN, fontWeight: "bold", fontSize: width * 0.037 },
  cardDesc:  { color: "#7A4020", fontSize: width * 0.029, marginTop: height * 0.001 },
  lockIcon:  { fontSize: width * 0.063 },
});
```

### Step 2: Verify the modal renders correctly in dev — open ProfileScreen → tap "Invitar"

### Step 3: Commit

```bash
git add src/components/InviteModal.jsx
git commit -m "feat(referrals): replace InviteModal stub with full Mexicanómetro-style referral UI"
```

---

## Task 7: Pass `userId` to `InviteModal` from `ProfileScreen`

**Files:**
- Modify: `src/screens/ProfileScreen.jsx`

### Step 1: Verify ProfileScreen passes nothing extra to InviteModal currently

Current line (~167):
```jsx
<InviteModal  visible={showInvite}  onClose={() => setShowInvite(false)}  />
```

The new `InviteModal` reads `userId` from `useAuth()` internally — **no props change needed**. The InviteModal already calls `useAuth()` itself.

This task is a **verification step only** — confirm the modal works end-to-end without prop changes.

### Step 2: Smoke test flow

1. Open the app in dev
2. Go to Profile tab
3. Tap "Invitar" button
4. Confirm modal opens with correct data (0 cuates if new user)
5. Confirm "Compartir" button shows (if user has username) or warning (if no username)
6. Confirm milestone bar renders with 4 rows

### Step 3: Commit note

No code change needed. If any adjustment was needed, commit it:

```bash
git add src/screens/ProfileScreen.jsx
git commit -m "feat(referrals): verify InviteModal integration in ProfileScreen"
```

---

## Task 8: Add `ref` path to React Navigation `linking` config (optional deep link route)

**Files:**
- Modify: `App.jsx`

Currently the `linking` config in `AppContent` only has `Main` and `Gameplay` screens. The `mexicanario://ref?ref=username` URL doesn't need to navigate anywhere — it's just data capture. But we should make sure React Navigation doesn't try to navigate to a missing screen when the URL is parsed.

### Step 1: Add a catch-all or ensure `ref` doesn't navigate

The simplest fix: our Linking capture happens in `useEffect` *before* NavigationContainer sees the URL. The `getInitialURL` approach consumes the URL before React Navigation does.

However, to be safe, verify by testing a deep link:

```bash
# iOS simulator
xcrun simctl openurl booted "mexicanario://ref?ref=testuser"

# Android emulator
adb shell am start -W -a android.intent.action.VIEW -d "mexicanario://ref?ref=testuser" com.mexicanario
```

Confirm:
1. App opens (or foregrounds)
2. `AsyncStorage.getItem("@mexicanario:pendingRef")` returns `"testuser"` (check with a temp log)
3. No React Navigation warning about unknown screen

### Step 2: If React Navigation warns, add `ref` to the linking config as a dummy screen

```js
const linking = {
  prefixes: ["mexicanario://"],
  config: {
    screens: {
      Main: "main",
      Gameplay: { path: "challenge", parse: { ... }, stringify: { ... } },
      // Referral deep link — no actual screen, just data capture
      // ref: "ref",  ← only add this if Navigation throws a warning
    },
  },
};
```

### Step 3: Commit if any changes were made

```bash
git add App.jsx
git commit -m "fix(referrals): ensure deep link ref URL doesn't confuse React Navigation"
```

---

## Task 9: End-to-end manual test

### Test 1: Share flow
1. Log in as User A (with a username set)
2. Open InviteModal → tap "Compartir mi link"
3. Confirm Share sheet opens with URL `mexicanario://ref?ref=<usernameA>`

### Test 2: Referral claim flow
1. On a second device/emulator, deep-link to `mexicanario://ref?ref=<usernameA>`
2. Confirm `pendingRef` is stored (add temp log if needed)
3. Register a new account on that device
4. Confirm both users received coins (check Convex dashboard → users table)
5. Confirm a row exists in `referrals` table

### Test 3: Anti-abuse
1. Try registering again with a pendingRef on an already-registered user → should be no-op
2. Try self-referral (same username as your own) → should be silently ignored

### Test 4: No-username guard
1. Open InviteModal as a user WITHOUT a username
2. Confirm the warning message appears instead of the share button

### Step 1: Fix any bugs found during testing

### Step 2: Final commit

```bash
git add -A
git commit -m "feat(referrals): sistema Invita y Gana completo — deep link + milestones + UI Mexicanómetro"
```

---

## Summary of all files changed

| File | Change |
|------|--------|
| `convex/schema.ts` | + `referrals` table, + `referredBy`/`referralCount` in users |
| `convex/referrals.ts` | NEW — `claimReferral` mutation + `getReferralStats` query |
| `convex/friends.ts` | + `referrerUsername` arg in `registerAccount`, inline referral logic |
| `App.jsx` | + `expo-linking` capture of `mexicanario://ref` → AsyncStorage |
| `src/components/InviteModal.jsx` | Full replacement — Mexicanómetro-style referral modal |
| `src/components/ProfileModal.jsx` | Pass `pendingRef` to `registerAccount`, clear after use |
