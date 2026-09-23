import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userMutation } from "./sessionAuth";
import { buildDueReviewWord } from "./failedWordPresentation";

const TWO_DAYS_MS = 172_800_000;

/**
 * recordFail — called when user answers a word incorrectly.
 * - If an unresolved record already exists for this word, increments failCount
 *   and extends scheduledAt by another 2 days from now.
 * - If no record exists, creates a new one scheduled 2 days from now.
 */
export const recordFail = userMutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("words"),
    wordText: v.string(),
  },
  handler: async (ctx, { userId, wordId, wordText }) => {
    const now = Date.now();

    // Check for existing unresolved record
    const existing = await ctx.db
      .query("failedWords")
      .withIndex("by_user_word", (q) => q.eq("userId", userId).eq("wordId", wordId))
      .filter((q) => q.eq(q.field("resolved"), false))
      .first();

    if (existing) {
      // Extend the review date and increment fail count
      await ctx.db.patch(existing._id, {
        scheduledAt: now + TWO_DAYS_MS,
        failCount: existing.failCount + 1,
      });
    } else {
      // Create new failed word record
      await ctx.db.insert("failedWords", {
        userId,
        wordId,
        wordText,
        failedAt: now,
        scheduledAt: now + TWO_DAYS_MS,
        resolved: false,
        failCount: 1,
      });
    }
  },
});

/**
 * resolveWord — called when user correctly answers a word that was in review.
 * Marks the most recent unresolved record for this word as resolved.
 */
export const resolveWord = userMutation({
  args: {
    userId: v.id("users"),
    wordId: v.id("words"),
  },
  handler: async (ctx, { userId, wordId }) => {
    const record = await ctx.db
      .query("failedWords")
      .withIndex("by_user_word", (q) => q.eq("userId", userId).eq("wordId", wordId))
      .filter((q) => q.eq(q.field("resolved"), false))
      .first();

    if (record) {
      await ctx.db.patch(record._id, { resolved: true });
    }
  },
});

/**
 * getDueWord — returns the most urgent unresolved failed word that is due for review.
 * Returns null if no words are due.
 */
export const getDueWord = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Get all unresolved failed words for this user ordered by scheduledAt
    const records = await ctx.db
      .query("failedWords")
      .withIndex("by_user_scheduled", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("resolved"), false),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .order("asc")
      .take(1);

    if (records.length === 0) return null;

    const record = records[0];
    // Fetch full word data for the review
    const wordData = await ctx.db.get(record.wordId);
    if (!wordData) return null;

    return buildDueReviewWord(record, wordData);
  },
});

/**
 * getPendingCount — returns how many failed words are pending review (due or upcoming).
 * Useful for showing a badge in the UI.
 */
export const getPendingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const due = await ctx.db
      .query("failedWords")
      .withIndex("by_user_scheduled", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("resolved"), false),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .collect();
    return due.length;
  },
});
