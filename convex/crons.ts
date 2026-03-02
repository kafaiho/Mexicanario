import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

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

export default crons;
