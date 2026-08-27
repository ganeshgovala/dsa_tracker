"use client";

import { useMemo } from "react";
import { CalendarDays, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useProblemProgress } from "@/lib/progress";
import {
  buildSchedule,
  collectPhaseProblems,
  type ScheduleProblem,
} from "@/lib/schedule";
import type { PhaseWithTopics, RoadmapDifficulty } from "@/lib/roadmap/types";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const difficultyDot: Record<RoadmapDifficulty, string> = {
  EASY: "bg-success",
  MEDIUM: "bg-warning",
  HARD: "bg-danger",
};

const PLAN_DAYS = 30;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ScheduleView({ phases }: { phases: PhaseWithTopics[] }) {
  const { user } = useAuth();
  const { solvedIds, toggle } = useProblemProgress();

  const start = useMemo(() => {
    if (user?.joinedAt) {
      const d = new Date(user.joinedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  }, [user]);

  const { phaseName, problems } = useMemo(
    () => collectPhaseProblems(phases),
    [phases],
  );
  const schedule = useMemo(
    () => (start ? buildSchedule(problems, start, PLAN_DAYS) : []),
    [problems, start],
  );

  // Align the first day to its weekday column, like a real calendar.
  const leadPad = start ? Array<null>(start.getDay()).fill(null) : [];
  const today = new Date();
  const end = schedule.at(-1)?.date;
  const maxPerDay = Math.max(...schedule.map((d) => d.problems.length), 1);

  return (
    <div className="mx-auto w-full px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Schedule
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {phaseName
              ? `${phaseName} · ${problems.length} problems over ${PLAN_DAYS} days`
              : "Your one-month practice plan"}
          </p>
        </div>
        {start && end && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            {" – "}
            {end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {!start || problems.length === 0 ? (
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-brand/12 text-brand">
            <Sparkles className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No schedule yet
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Your one-month plan appears here once roadmap problems are available.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[64rem]">
            {/* Weekday header */}
            <div className="mb-2 grid grid-cols-7 gap-3">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-3">
              {leadPad.map((_, i) => (
                <div key={`pad-${i}`} className="rounded-xl border border-dashed border-border/50 opacity-30" />
              ))}
              {schedule.map((day) => {
                const past = day.date < today && !isSameDay(day.date, today);
                const isToday = isSameDay(day.date, today);
                const newMonth =
                  day.dayNumber === 1 || day.date.getDate() === 1;
                return (
                  <div
                    key={day.dayNumber}
                    className={cn(
                      "flex min-h-[9rem] flex-col rounded-xl border p-3 transition-colors",
                      isToday
                        ? "border-brand/60 bg-brand/[0.07] ring-1 ring-brand/40"
                        : "border-border bg-card hover:border-white/15",
                      past && !isToday && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={cn(
                            "text-lg font-semibold tabular-nums",
                            isToday ? "text-brand" : "text-foreground",
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                        {(newMonth || day.dayNumber === 1) && (
                          <span className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                            {MONTHS[day.date.getMonth()]}
                          </span>
                        )}
                        <span className="text-[0.625rem] text-muted-foreground">
                          Day {day.dayNumber}
                        </span>
                      </div>
                      {day.problems.length > 0 && (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 px-1.5 text-[0.6875rem] font-semibold text-brand">
                          {day.problems.length}
                        </span>
                      )}
                    </div>

                    <ul className="mt-2 flex min-w-0 flex-col gap-1">
                      {day.problems.slice(0, Math.min(4, maxPerDay)).map((p) => {
                        const solved = solvedIds.has(p.id);
                        return (
                          <li key={p.id} className="min-w-0">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={solved}
                              aria-label={`Mark ${p.name} as ${solved ? "unsolved" : "solved"}`}
                              onClick={() => toggle(p.id)}
                              title={`${p.name} · ${p.topicName}`}
                              className="flex w-full min-w-0 items-center gap-1.5 rounded text-left transition-colors hover:bg-white/[0.06]"
                            >
                              {solved ? (
                                <Check
                                  className="size-3 shrink-0 text-success"
                                  strokeWidth={3}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    difficultyDot[p.difficulty],
                                  )}
                                  aria-hidden
                                />
                              )}
                              <span
                                className={cn(
                                  "truncate text-xs",
                                  solved
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground/90",
                                )}
                              >
                                {p.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {day.problems.length > 4 && (
                        <li className="pl-3 text-[0.625rem] text-muted-foreground">
                          +{day.problems.length - 4} more
                        </li>
                      )}
                      {day.problems.length === 0 && (
                        <li className="text-[0.625rem] text-muted-foreground">
                          Rest / revision
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {problems.length > 0 && (
        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" /> Easy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-warning" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-danger" /> Hard
          </span>
        </div>
      )}
    </div>
  );
}

export type { ScheduleProblem };
