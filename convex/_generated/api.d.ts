/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as achievements from "../achievements.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as collectionCards from "../collectionCards.js";
import type * as collections from "../collections.js";
import type * as collectionsQuery from "../collectionsQuery.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as dailyMissions from "../dailyMissions.js";
import type * as dailyRewards from "../dailyRewards.js";
import type * as devTools from "../devTools.js";
import type * as failedWords from "../failedWords.js";
import type * as friends from "../friends.js";
import type * as gameSessions from "../gameSessions.js";
import type * as league from "../league.js";
import type * as levelOrdering from "../levelOrdering.js";
import type * as levels from "../levels.js";
import type * as migrations from "../migrations.js";
import type * as milestones from "../milestones.js";
import type * as nahual from "../nahual.js";
import type * as patchCategories from "../patchCategories.js";
import type * as pet from "../pet.js";
import type * as runSeed from "../runSeed.js";
import type * as seedAdultWords from "../seedAdultWords.js";
import type * as seedCuratedLevels from "../seedCuratedLevels.js";
import type * as seedWords1000 from "../seedWords1000.js";
import type * as shop from "../shop.js";
import type * as streaks from "../streaks.js";
import type * as userAchievements from "../userAchievements.js";
import type * as userCollectedCards from "../userCollectedCards.js";
import type * as users from "../users.js";
import type * as words from "../words.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  auth: typeof auth;
  cleanup: typeof cleanup;
  collectionCards: typeof collectionCards;
  collections: typeof collections;
  collectionsQuery: typeof collectionsQuery;
  config: typeof config;
  crons: typeof crons;
  dailyMissions: typeof dailyMissions;
  dailyRewards: typeof dailyRewards;
  devTools: typeof devTools;
  failedWords: typeof failedWords;
  friends: typeof friends;
  gameSessions: typeof gameSessions;
  league: typeof league;
  levelOrdering: typeof levelOrdering;
  levels: typeof levels;
  migrations: typeof migrations;
  milestones: typeof milestones;
  nahual: typeof nahual;
  patchCategories: typeof patchCategories;
  pet: typeof pet;
  runSeed: typeof runSeed;
  seedAdultWords: typeof seedAdultWords;
  seedCuratedLevels: typeof seedCuratedLevels;
  seedWords1000: typeof seedWords1000;
  shop: typeof shop;
  streaks: typeof streaks;
  userAchievements: typeof userAchievements;
  userCollectedCards: typeof userCollectedCards;
  users: typeof users;
  words: typeof words;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
