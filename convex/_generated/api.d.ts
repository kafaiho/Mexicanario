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
import type * as albures from "../albures.js";
import type * as appConfig from "../appConfig.js";
import type * as auth from "../auth.js";
import type * as cleanWords from "../cleanWords.js";
import type * as cleanup from "../cleanup.js";
import type * as collectionCards from "../collectionCards.js";
import type * as collectionMigration from "../collectionMigration.js";
import type * as collections from "../collections.js";
import type * as collectionsQuery from "../collectionsQuery.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as curator from "../curator.js";
import type * as dailyMissions from "../dailyMissions.js";
import type * as dailyRewards from "../dailyRewards.js";
import type * as devTools from "../devTools.js";
import type * as failedWords from "../failedWords.js";
import type * as fixCategories from "../fixCategories.js";
import type * as fixProductionCategories from "../fixProductionCategories.js";
import type * as fixRewards from "../fixRewards.js";
import type * as friends from "../friends.js";
import type * as gameSessions from "../gameSessions.js";
import type * as league from "../league.js";
import type * as levelOrdering from "../levelOrdering.js";
import type * as levels from "../levels.js";
import type * as loteria from "../loteria.js";
import type * as migrateCollections from "../migrateCollections.js";
import type * as migrations from "../migrations.js";
import type * as milestones from "../milestones.js";
import type * as nahual from "../nahual.js";
import type * as patchAudit10Errors from "../patchAudit10Errors.js";
import type * as patchAudit2Errors from "../patchAudit2Errors.js";
import type * as patchAudit3Errors from "../patchAudit3Errors.js";
import type * as patchAudit4Errors from "../patchAudit4Errors.js";
import type * as patchAudit5Errors from "../patchAudit5Errors.js";
import type * as patchAudit6Errors from "../patchAudit6Errors.js";
import type * as patchAudit7Errors from "../patchAudit7Errors.js";
import type * as patchAudit8Errors from "../patchAudit8Errors.js";
import type * as patchAudit9Errors from "../patchAudit9Errors.js";
import type * as patchCategories from "../patchCategories.js";
import type * as patchCulturalErrors from "../patchCulturalErrors.js";
import type * as patchModismos from "../patchModismos.js";
import type * as pet from "../pet.js";
import type * as purgeObsceneWords from "../purgeObsceneWords.js";
import type * as pvp from "../pvp.js";
import type * as rankings from "../rankings.js";
import type * as reclassify from "../reclassify.js";
import type * as reclassifyModismos from "../reclassifyModismos.js";
import type * as referralConfig from "../referralConfig.js";
import type * as referrals from "../referrals.js";
import type * as restoreSlangWords from "../restoreSlangWords.js";
import type * as runSeed from "../runSeed.js";
import type * as seedCulturaDigital from "../seedCulturaDigital.js";
import type * as seedCulturaDigitalV2 from "../seedCulturaDigitalV2.js";
import type * as seedCuratedLevels from "../seedCuratedLevels.js";
import type * as seedWords1000 from "../seedWords1000.js";
import type * as shop from "../shop.js";
import type * as streaks from "../streaks.js";
import type * as syncWords from "../syncWords.js";
import type * as taquero from "../taquero.js";
import type * as testLevelState from "../testLevelState.js";
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
  albures: typeof albures;
  appConfig: typeof appConfig;
  auth: typeof auth;
  cleanWords: typeof cleanWords;
  cleanup: typeof cleanup;
  collectionCards: typeof collectionCards;
  collectionMigration: typeof collectionMigration;
  collections: typeof collections;
  collectionsQuery: typeof collectionsQuery;
  config: typeof config;
  crons: typeof crons;
  curator: typeof curator;
  dailyMissions: typeof dailyMissions;
  dailyRewards: typeof dailyRewards;
  devTools: typeof devTools;
  failedWords: typeof failedWords;
  fixCategories: typeof fixCategories;
  fixProductionCategories: typeof fixProductionCategories;
  fixRewards: typeof fixRewards;
  friends: typeof friends;
  gameSessions: typeof gameSessions;
  league: typeof league;
  levelOrdering: typeof levelOrdering;
  levels: typeof levels;
  loteria: typeof loteria;
  migrateCollections: typeof migrateCollections;
  migrations: typeof migrations;
  milestones: typeof milestones;
  nahual: typeof nahual;
  patchAudit10Errors: typeof patchAudit10Errors;
  patchAudit2Errors: typeof patchAudit2Errors;
  patchAudit3Errors: typeof patchAudit3Errors;
  patchAudit4Errors: typeof patchAudit4Errors;
  patchAudit5Errors: typeof patchAudit5Errors;
  patchAudit6Errors: typeof patchAudit6Errors;
  patchAudit7Errors: typeof patchAudit7Errors;
  patchAudit8Errors: typeof patchAudit8Errors;
  patchAudit9Errors: typeof patchAudit9Errors;
  patchCategories: typeof patchCategories;
  patchCulturalErrors: typeof patchCulturalErrors;
  patchModismos: typeof patchModismos;
  pet: typeof pet;
  purgeObsceneWords: typeof purgeObsceneWords;
  pvp: typeof pvp;
  rankings: typeof rankings;
  reclassify: typeof reclassify;
  reclassifyModismos: typeof reclassifyModismos;
  referralConfig: typeof referralConfig;
  referrals: typeof referrals;
  restoreSlangWords: typeof restoreSlangWords;
  runSeed: typeof runSeed;
  seedCulturaDigital: typeof seedCulturaDigital;
  seedCulturaDigitalV2: typeof seedCulturaDigitalV2;
  seedCuratedLevels: typeof seedCuratedLevels;
  seedWords1000: typeof seedWords1000;
  shop: typeof shop;
  streaks: typeof streaks;
  syncWords: typeof syncWords;
  taquero: typeof taquero;
  testLevelState: typeof testLevelState;
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
