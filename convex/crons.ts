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

export default crons;
