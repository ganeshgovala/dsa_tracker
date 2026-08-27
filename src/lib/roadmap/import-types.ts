/**
 * Shape of the problem-JSON payloads used to import roadmap content.
 * Mirrors the format supplied per phase, e.g.:
 *
 * {
 *   "phase":  { "number": 1, "name": "...", "is_optional": false },
 *   "topics": [ { "name": "Arrays", "order": 1, "problems": [ ... ] } ]
 * }
 */

export interface ImportedProblem {
  name: string;
  difficulty: string;
  leetcode_url?: string | null;
  gfg_url?: string | null;
  video_url?: string | null;
  is_core?: boolean;
  order?: number | null;
}

export interface ImportedTopic {
  name: string;
  order?: number | null;
  problems: ImportedProblem[];
}

export interface ImportedPhase {
  phase: {
    number: number;
    name?: string;
    goal?: string;
    is_optional?: boolean;
  };
  topics: ImportedTopic[];
}

export interface ImportResult {
  phaseId: string;
  topicsCreated: number;
  topicsUpdated: number;
  problemsCreated: number;
  problemsUpdated: number;
}
