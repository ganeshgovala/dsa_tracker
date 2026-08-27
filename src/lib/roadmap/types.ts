/**
 * Core roadmap domain: Phase → Topic → Problem.
 *
 * Firestore layout (see `firestore.ts`):
 *   roadmap_phases/{id}    docs matching `Phase`
 *   roadmap_topics/{id}    docs matching `RoadmapTopic`
 *   roadmap_problems/{id}  docs matching `RoadmapProblem`
 *
 * Deliberately NO user-specific fields here (solved, attempts, notes, ...).
 * Those belong to a future user-progress system that references problem ids,
 * so the curriculum data stays shared and immutable per user.
 *
 * Many-to-many pattern tagging can later be added as a separate collection
 * (e.g. `patterns/{id}` + `pattern_tags/{problemId_patternId}`) without
 * changing any of these shapes.
 */

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type RoadmapDifficulty = (typeof DIFFICULTIES)[number];

export interface Phase {
  id: string;
  /** Unique 1-based number, e.g. 1 for "Foundation + Pattern Setup". */
  phaseNumber: number;
  name: string;
  goal: string;
  description: string | null;
  /** Display order; independent of phaseNumber so phases can be reordered. */
  orderIndex: number;
  /** Optional/recommended phases (e.g. Phase 8) rather than mandatory ones. */
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapTopic {
  id: string;
  phaseId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapProblem {
  id: string;
  phaseId: string;
  topicId: string;
  name: string;
  difficulty: RoadmapDifficulty;
  leetcodeUrl: string | null;
  gfgUrl: string | null;
  videoUrl: string | null;
  orderIndex: number;
  /** true = core / must-solve, false = optional additional practice. */
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapTopicWithProblems extends RoadmapTopic {
  problems: RoadmapProblem[];
}

export interface PhaseWithTopics extends Phase {
  topics: RoadmapTopicWithProblems[];
}

/** Query filters accepted by `listProblems`. */
export interface ProblemFilters {
  phaseId?: string;
  topicId?: string;
  difficulty?: RoadmapDifficulty;
}
