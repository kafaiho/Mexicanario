import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Weekly: Process league week end — Monday 06:05 UTC (00:05 CST)
crons.weekly(
  "process league week end",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 5 },
  internal.league.processWeekEnd
);

// Daily: Reset/cleanup daily mini groups — 06:00 UTC (00:00 CST)
crons.daily(
  "reset daily mini groups",
  { hourUTC: 6, minuteUTC: 0 },
  internal.league.resetDailyMini
);

// Weekly: Curador Seed Queue — lunes 08:05 UTC (02:05 CST)
// Procesa 10 términos nuevos del SEED_QUEUE y los deja en staging para tu revisión.
crons.weekly(
  "curador semanal",
  { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 5 },
  api.curator.processSeedQueue,
  { batchSize: 10 },
);

// Weekly: Curador Tendencias MX — miércoles 08:05 UTC (02:05 CST)
// Scraping Google Trends MX → filtra → Gemini valida → staging.
crons.weekly(
  "curador tendencias",
  { dayOfWeek: "wednesday", hourUTC: 8, minuteUTC: 5 },
  api.curator.processTrends,
  {},
);

// Every 30 min: Recompute global/weekly/monthly ranking snapshots + user rank caches
crons.interval(
  "recompute rankings",
  { minutes: 30 },
  internal.rankings.recomputeAll
);

// Daily: Expire old friend challenges and refund coins — 06:10 UTC (00:10 CST)
crons.daily(
  "expire old challenges",
  { hourUTC: 6, minuteUTC: 10 },
  internal.friends.expireOldChallenges
);

// Every 5 min: Cleanup stale PvP queue entries
crons.interval(
  "cleanup pvp queue",
  { minutes: 5 },
  internal.pvp.cleanupQueue
);

// Every 30s: Auto-finish timed-out PvP matches
crons.interval(
  "finish timed out pvp matches",
  { seconds: 30 },
  internal.pvp.finishTimedOutMatches
);

// Quarterly: Process seasonal reset — 1st day of each quarter at 07:00 UTC (01:00 CST)
// Runs on: Jan 1, Apr 1, Jul 1, Oct 1
// Since Convex doesn't have quarterly cron, use monthly and check inside
crons.monthly(
  "process seasonal reset",
  { day: 1, hourUTC: 7, minuteUTC: 0 },
  internal.league.processSeasonEnd
);

export default crons;
