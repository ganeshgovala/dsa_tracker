import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stats } from "@/lib/types";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface CalendarCell {
  date: Date;
  count: number;
}

/**
 * Builds calendar weeks (Sunday-start) ending today, from the contribution
 * counts (oldest → newest). Leading cells are padded with null so every row
 * aligns to real weekdays.
 */
function buildWeeks(counts: number[]): (CalendarCell | null)[][] {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = counts.length - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  const leadPad = Array<null>(dates[0]?.getDay() ?? 0).fill(null);
  const cells: (CalendarCell | null)[] = [
    ...leadPad,
    ...dates.map((date, i) => ({ date, count: counts[i] })),
  ];

  const weeks: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** Month label per row — shown only on rows where the month changes. */
function monthLabelsFor(
  weeks: (CalendarCell | null)[][],
): string[] {
  let lastMonth = -1;
  return weeks.map((week) => {
    const first = week.find((c) => c !== null);
    const month = first ? first.date.getMonth() : -1;
    const show = month !== -1 && month !== lastMonth;
    if (month !== -1) lastMonth = month;
    return show ? MONTH_LABELS[month] : "";
  });
}

export function StreakCalendar({ stats }: { stats: Stats }) {
  const { contributions, streakDays, bestStreak, totalCheckIns } = stats;
  const weeks = buildWeeks(contributions);
  const monthLabels = monthLabelsFor(weeks);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Practice streak</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning">
          <Flame className="size-3" />
          {streakDays} days
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {totalCheckIns} check-ins · best streak {bestStreak} days
      </p>

      <div className="mt-4 flex gap-2">
        {/* Month gutter */}
        <div className="flex w-8 shrink-0 flex-col gap-1 pt-[1.125rem]">
          {monthLabels.map((label, wi) => (
            <div key={wi} className="flex flex-1 items-start">
              {label && (
                <span className="text-[0.625rem] leading-none text-muted-foreground">
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Weekday header */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((d, i) => (
              <span
                key={i}
                className="text-center text-[0.625rem] leading-none text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((cell, di) =>
                  cell ? (
                    <span
                      key={di}
                      title={`${cell.count} solved · ${cell.date.toLocaleDateString(
                        undefined,
                        { weekday: "short", month: "short", day: "numeric" },
                      )}`}
                      className={cn(
                        "aspect-square w-full rounded-[4px]",
                        cell.count > 0 ? "bg-brand" : "bg-white/[0.06]",
                      )}
                    />
                  ) : (
                    <span key={di} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
