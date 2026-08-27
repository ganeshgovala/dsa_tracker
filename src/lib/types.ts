export type Difficulty = "Easy" | "Medium" | "Hard";

export type ProblemStatus = "Solved" | "Attempting" | "Todo";

export type Platform = "LeetCode" | "NeetCode" | "Codeforces" | "HackerRank";

/** A company that is known to ask a given problem — shown as an avatar group. */
export interface Company {
  name: string;
  /** 1–2 letter monogram shown in the fallback avatar. */
  initial: string;
  /** tailwind-friendly hue used to tint the monogram avatar. */
  hue: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  /** Topic / pattern, e.g. "Sliding Window". */
  topic: string;
  platform: Platform;
  /** Human label for the schedule, e.g. "Due in 2h 16m" or "No due date". */
  dueLabel: string;
  /** Whether the due label is urgent (drives the amber accent on the clock). */
  urgent?: boolean;
  /** Personal notes attached to the problem. */
  notes: number;
  /** Saved solutions / attempts. */
  solutions: number;
  companies: Company[];
}

export interface Topic {
  id: string;
  name: string;
  solved: number;
  total: number;
  /** Any CSS color — used for the progress bar + dot. */
  color: string;
}

export interface Friend {
  id: string;
  name: string;
  /** Monogram fallback shown when there's no photo. */
  initial: string;
  /** Tint for the monogram avatar. */
  hue: string;
  photoURL?: string | null;
  /**
   * Current mutual streak: consecutive days on which you BOTH solved at least
   * one problem. It only advances on a day you both check in; a missed day by
   * either of you ends it.
   */
  streak: number;
  bestStreak: number;
  /** Whether this friend has already solved a problem today. */
  friendSolvedToday: boolean;
  /** Friend's last check-in, e.g. "20m ago". */
  lastActive: string;
}

export interface Stats {
  problemsSolved: number;
  solvedDeltaPct: number;
  /** Weekly solved counts for the mini bar chart (oldest → newest). */
  weeklySolved: number[];
  /** Distinct topics/patterns practiced at least once. */
  topicsCovered: number;
  /** Total topics in the curriculum. */
  topicsTotal: number;
  /** Solved problems split by difficulty. */
  solvedByDifficulty: { easy: number; medium: number; hard: number };
  /** Current consecutive-day check-in streak. */
  streakDays: number;
  /** Best streak ever, in days. */
  bestStreak: number;
  /** Total days checked in over the shown period. */
  totalCheckIns: number;
  /**
   * Daily check-in intensity, oldest → newest. 0 = no check-in, 1–4 = how many
   * problems were solved that day (bucketed). Drives the contribution graph.
   */
  contributions: number[];
}

export interface DashboardData {
  stats: Stats;
  problems: Problem[];
  topics: Topic[];
  friends: Friend[];
}
