"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { EMPTY_STATS } from "@/lib/dashboard";
import { useProblemProgress } from "@/lib/progress";
import { computeStreakStats } from "@/lib/streak";
import {
  buildSchedule,
  collectPhaseProblems,
} from "@/lib/schedule";
import type { PhaseWithTopics } from "@/lib/roadmap/types";
import type { Stats } from "@/lib/types";
import { StatCards } from "./stat-cards";
import { ProblemRow } from "@/components/problems/problem-row";
import { StreakCalendar } from "./streak-calendar";
import { FriendStreaks } from "./friend-streaks";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DashboardView({
  phases,
}: {
  phases: PhaseWithTopics[];
}) {
  const { user } = useAuth();
  const { solvedIds, solvedAt } = useProblemProgress();

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

  // Today's slice of the 30-day plan.
  const todayProblems = useMemo(() => {
    if (!start) return [];
    const today = new Date();
    const day = buildSchedule(problems, start, 30).find((d) =>
      isSameDay(d.date, today),
    );
    return day?.problems ?? [];
  }, [problems, start]);

  // Stats derived live from progress + the roadmap.
  const stats = useMemo<Stats>(() => {
    const solvedSet = solvedIds;
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    let covered = 0;
    for (const phase of phases) {
      for (const topic of phase.topics) {
        const anySolved = topic.problems.some((p) => solvedSet.has(p.id));
        if (anySolved) covered++;
        for (const p of topic.problems) {
          if (!solvedSet.has(p.id)) continue;
          const key = p.difficulty.toLowerCase() as keyof typeof byDifficulty;
          byDifficulty[key] += 1;
        }
      }
    }
    const streak = computeStreakStats(solvedAt.values());
    return {
      ...EMPTY_STATS,
      problemsSolved: solvedIds.size,
      topicsCovered: covered,
      topicsTotal: phases[0]?.topics.length ?? 0,
      solvedByDifficulty: byDifficulty,
      ...streak,
      weeklySolved: streak.contributions.slice(-7),
    };
  }, [phases, solvedIds, solvedAt]);

  const youSolvedToday = todayProblems.some((p) => solvedIds.has(p.id));

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 px-5 py-5 sm:px-8 sm:py-7">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
          Your practice at a glance — keep the streak alive.
        </p>
      </header>

      {/* Content */}
      <div className="px-5 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Center column */}
          <div className="flex min-w-0 flex-col gap-6">
            <StatCards stats={stats} />

            <section>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Today&rsquo;s practice
                </h2>
                <span className="text-sm text-muted-foreground">
                  {todayProblems.length}
                </span>
                {phaseName && (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    · {phaseName}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {todayProblems.length === 0 ? (
                  <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center">
                    <p className="text-sm font-medium text-foreground">
                      Nothing scheduled today
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      {start
                        ? "It's a rest / revision day — check the schedule for what's next."
                        : "Your daily practice set appears here once your schedule starts."}
                    </p>
                  </div>
                ) : (
                  todayProblems.map((problem) => (
                    <ProblemRow key={problem.id} problem={problem} />
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="flex flex-col gap-6">
            <StreakCalendar stats={stats} />
            <FriendStreaks youSolvedToday={youSolvedToday} />
          </aside>
        </div>
      </div>
    </div>
  );
}
