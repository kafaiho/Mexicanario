/**
 * Analytics service — lightweight event tracking abstraction.
 *
 * Logs events to console in __DEV__. Swap the `send()` implementation
 * with Mixpanel, Amplitude, or PostHog when ready for production.
 *
 * Usage:
 *   import { track } from '../services/analytics';
 *   track('level_completed', { level: 42, attempts: 2, combo: 5 });
 */

// ── Event queue (batches events and flushes periodically) ────────────────────
const queue = [];
const FLUSH_INTERVAL = 30_000; // 30s
let flushTimer = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL);
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  // TODO: Replace with your analytics provider's batch send
  // e.g. mixpanel.track(batch) or amplitude.logEvents(batch)
  if (__DEV__) {
    console.log(`[Analytics] flush ${batch.length} events`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Track an event with optional properties.
 * Events are queued and flushed in batches every 30s.
 */
export function track(event, properties = {}) {
  const entry = {
    event,
    properties,
    timestamp: Date.now(),
  };

  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties);
  }

  queue.push(entry);
  startFlushTimer();
}

/**
 * Identify a user (call after auth).
 */
export function identify(userId, traits = {}) {
  if (__DEV__) {
    console.log(`[Analytics] identify`, userId, traits);
  }
  // TODO: mixpanel.identify(userId) / amplitude.setUserId(userId)
}

/**
 * Set user properties (level, subscription status, etc.)
 */
export function setUserProperties(properties) {
  if (__DEV__) {
    console.log(`[Analytics] setUserProperties`, properties);
  }
  // TODO: mixpanel.people.set(properties) / amplitude.setUserProperties(properties)
}

// ── Pre-defined event names (prevents typos) ────────────────────────────────
export const EVENTS = {
  // Core gameplay
  LEVEL_COMPLETED: 'level_completed',
  LEVEL_FAILED: 'level_failed',
  WORD_GUESSED: 'word_guessed',
  HINT_USED: 'hint_used',

  // Progression
  RANK_UP: 'rank_up',
  ZONE_COMPLETED: 'zone_completed',
  STREAK_MILESTONE: 'streak_milestone',
  STREAK_BROKEN: 'streak_broken',

  // Monetization
  AD_WATCHED: 'ad_watched',
  AD_SKIPPED: 'ad_skipped',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PAYWALL_SHOWN: 'paywall_shown',
  SUBSCRIPTION_STARTED: 'subscription_started',

  // Engagement
  MINIGAME_PLAYED: 'minigame_played',
  PVP_MATCH: 'pvp_match',
  DAILY_REWARD_CLAIMED: 'daily_reward_claimed',
  WHEEL_SPUN: 'wheel_spun',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  FRIEND_ADDED: 'friend_added',
  CHALLENGE_SENT: 'challenge_sent',

  // Retention
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',

  // Funnel
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  FIRST_LEVEL_COMPLETED: 'first_level_completed',
};
