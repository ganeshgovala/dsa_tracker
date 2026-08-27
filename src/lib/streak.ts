import type { Stats } from "./types";

/**
 * Practice-streak stats derived from the timestamps of solved problems.
 *
 * Everything is computed in the user's LOCAL timezone (a "day" is a local
 * calendar day), so the streak matches what the user sees on their calendar.
 */

/** Days since the Unix epoch in local time (stable integer per calendar day). */
function localDayNumber(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

export type StreakStats = Pick<
  Stats,
  "streakDays" | "bestStreak" | "totalCheckIns" | "contributions"
>;

/**
 * @param solvedAtValues ISO timestamps, one per currently-solved problem.
 * @param windowDays     length of the contribution grid (oldest → today).
 */
export function computeStreakStats(
  solvedAtValues: Iterable<string>,
  windowDays = 35,
): StreakStats {
  // How many problems were solved on each local day.
  const countByDay = new Map<number, number>();
  for (const iso of solvedAtValues) {
    if (!iso) continue;
    const when = new Date(iso);
    if (Number.isNaN(when.getTime())) continue;
    const day = localDayNumber(when);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }

  const today = localDayNumber(new Date());

  // Contribution grid: oldest → newest, the last cell is today.
  const contributions: number[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    contributions.push(countByDay.get(today - i) ?? 0);
  }

  const days = [...countByDay.keys()].sort((a, b) => a - b);
  const totalCheckIns = days.length;

  // Longest run of consecutive active days across all history.
  let bestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of days) {
    run = prev !== null && day === prev + 1 ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = day;
  }

  // Current streak: consecutive active days ending today — or yesterday, so a
  // day where you haven't solved anything *yet* doesn't zero out the streak.
  let streakDays = 0;
  let cursor: number | null = countByDay.has(today)
    ? today
    : countByDay.has(today - 1)
      ? today - 1
      : null;
  while (cursor !== null && countByDay.has(cursor)) {
    streakDays++;
    cursor--;
  }

  return { streakDays, bestStreak, totalCheckIns, contributions };
}
