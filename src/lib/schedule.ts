import type {
  PhaseWithTopics,
  RoadmapDifficulty,
} from "./roadmap/types";

/** A single problem flattened for scheduling. */
export interface ScheduleProblem {
  id: string;
  name: string;
  topicName: string;
  difficulty: RoadmapDifficulty;
  leetcodeUrl: string | null;
  gfgUrl: string | null;
  videoUrl: string | null;
}

/** One day in the schedule with its assigned problems. */
export interface ScheduleDay {
  date: Date;
  /** 1-based day of the plan. */
  dayNumber: number;
  problems: ScheduleProblem[];
}

/**
 * Flattens the first (lowest-numbered) phase into an ordered problem list,
 * following topic order then per-topic problem order.
 */
export function collectPhaseProblems(
  phases: PhaseWithTopics[],
): { phaseName: string; problems: ScheduleProblem[] } {
  const phase = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber)[0];
  if (!phase) return { phaseName: "", problems: [] };
  const problems = [...phase.topics]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((topic) =>
      [...topic.problems]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => ({
          id: p.id,
          name: p.name,
          topicName: topic.name,
          difficulty: p.difficulty,
          leetcodeUrl: p.leetcodeUrl,
          gfgUrl: p.gfgUrl,
          videoUrl: p.videoUrl,
        })),
    );
  return { phaseName: phase.name, problems };
}

/**
 * Spreads the problems evenly across `days` starting at `start`.
 * Extra problems are given to the earliest days (65 problems / 30 days →
 * days get 3,3,...,2,2). Deterministic — derived, never stored.
 */
export function buildSchedule(
  problems: ScheduleProblem[],
  start: Date,
  days = 30,
): ScheduleDay[] {
  const base = Math.floor(problems.length / days);
  const remainder = problems.length % days;

  const schedule: ScheduleDay[] = [];
  let cursor = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    date.setDate(date.getDate() + i);
    const count = base + (i < remainder ? 1 : 0);
    schedule.push({
      date,
      dayNumber: i + 1,
      problems: problems.slice(cursor, cursor + count),
    });
    cursor += count;
  }
  return schedule;
}
