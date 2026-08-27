/**
 * The initial 8-phase roadmap. Only PHASE records — no topics or problems.
 * Topics/problems arrive later via the problem JSON import.
 */
export interface PhaseSeed {
  phaseNumber: number;
  name: string;
  goal: string;
  isOptional: boolean;
}

export const PHASE_SEED: PhaseSeed[] = [
  {
    phaseNumber: 1,
    name: "Foundation + Pattern Setup",
    goal: "Become comfortable with coding constructs, patterns, and brute → optimal thinking.",
    isOptional: false,
  },
  {
    phaseNumber: 2,
    name: "Sorting, Searching, Recursion, Backtracking",
    goal: "Learn problem reduction and systematic search.",
    isOptional: false,
  },
  {
    phaseNumber: 3,
    name: "Linked Lists + Stacks + Queues + Monotonic Structures",
    goal: "Core data-structure mastery and interview classics.",
    isOptional: false,
  },
  {
    phaseNumber: 4,
    name: "Trees + BST + Tries",
    goal: "Build confidence for recursion-heavy tree problems.",
    isOptional: false,
  },
  {
    phaseNumber: 5,
    name: "Graphs + Advanced Graphs",
    goal: "Handle difficult graph-related DSA problems.",
    isOptional: false,
  },
  {
    phaseNumber: 6,
    name: "Dynamic Programming",
    goal: "Become capable of solving DP problems at interview speed.",
    isOptional: false,
  },
  {
    phaseNumber: 7,
    name: "Mock Interviews + System Design + Revision",
    goal: "Become interview-ready.",
    isOptional: false,
  },
  {
    phaseNumber: 8,
    name: "Final Polish",
    goal: "Final interview preparation and 30–40 LPA confidence.",
    // Recommended rather than mandatory.
    isOptional: true,
  },
];
