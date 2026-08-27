"use client";

import {
  Check,
  ChevronDown,
  CirclePlay,
  ExternalLink,
  Hourglass,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemProgress } from "@/lib/progress";
import type {
  PhaseWithTopics,
  RoadmapDifficulty,
  RoadmapProblem,
} from "@/lib/roadmap/types";

const difficultyStyles: Record<RoadmapDifficulty, string> = {
  EASY: "bg-success/12 text-success",
  MEDIUM: "bg-warning/12 text-warning",
  HARD: "bg-danger/12 text-danger",
};

const difficultyLabels: Record<RoadmapDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

function DifficultyBadge({ difficulty }: { difficulty: RoadmapDifficulty }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
        difficultyStyles[difficulty],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {difficultyLabels[difficulty]}
    </span>
  );
}

function ProblemRow({ problem }: { problem: RoadmapProblem }) {
  const { solvedIds, toggle } = useProblemProgress();
  const solved = solvedIds.has(problem.id);

  return (
    <li className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]">
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {problem.orderIndex}
      </span>
      <button
        type="button"
        role="checkbox"
        aria-checked={solved}
        aria-label={`Mark ${problem.name} as ${solved ? "unsolved" : "solved"}`}
        onClick={() => toggle(problem.id)}
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          solved
            ? "border-success bg-success text-white"
            : "border-white/20 hover:border-brand",
        )}
      >
        {solved && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          solved ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {problem.name}
        {!problem.isCore && (
          <span className="ml-2 align-middle text-[0.6875rem] text-muted-foreground">
            (extra)
          </span>
        )}
      </span>
      {!solved && problem.isCore && (
        <Star
          className="size-3.5 shrink-0 fill-brand/30 text-brand"
          aria-label="Core problem"
        />
      )}
      <DifficultyBadge difficulty={problem.difficulty} />
      <span className="flex shrink-0 items-center gap-1">
        {problem.leetcodeUrl && (
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            title="LeetCode"
            className="inline-flex h-6 items-center rounded-md border border-border px-1.5 text-[0.625rem] font-semibold text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
          >
            LC
          </a>
        )}
        {problem.gfgUrl && (
          <a
            href={problem.gfgUrl}
            target="_blank"
            rel="noreferrer"
            title="GeeksForGeeks"
            className="inline-flex h-6 items-center rounded-md border border-border px-1.5 text-[0.625rem] font-semibold text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
          >
            GFG
          </a>
        )}
        {problem.videoUrl && (
          <a
            href={problem.videoUrl}
            target="_blank"
            rel="noreferrer"
            title="Video solution"
            className="grid size-6 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
          >
            <CirclePlay className="size-3.5" />
          </a>
        )}
        {!problem.leetcodeUrl && !problem.gfgUrl && !problem.videoUrl && (
          <ExternalLink className="size-3.5 text-transparent" aria-hidden />
        )}
      </span>
    </li>
  );
}

export function RoadmapView({ phases }: { phases: PhaseWithTopics[] }) {
  const totalTopics = phases.reduce((n, p) => n + p.topics.length, 0);
  const totalProblems = phases.reduce(
    (n, p) => n + p.topics.reduce((m, t) => m + t.problems.length, 0),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          DSA Roadmap
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {phases.length} phases · {totalTopics} topics · {totalProblems}{" "}
          problems
        </p>
      </div>

      {/* Phases */}
      <div className="flex flex-col gap-4">
        {phases.map((phase) => {
          const problemCount = phase.topics.reduce(
            (n, t) => n + t.problems.length,
            0,
          );
          const topicCount = phase.topics.length;
          const hasContent = topicCount > 0 && problemCount > 0;

          if (!hasContent) {
            return (
              <div
                key={phase.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 opacity-75 sm:p-5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-sm font-semibold text-brand">
                  {phase.phaseNumber}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.95rem] font-medium text-foreground">
                      {phase.name}
                    </span>
                    {phase.isOptional && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {phase.goal}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                  <Hourglass className="size-3" />
                  Coming soon
                </span>
              </div>
            );
          }

          return (
            <details
              key={phase.id}
              open={phase.phaseNumber === 1}
              className="group rounded-2xl border border-border bg-card open:bg-card/80"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-sm font-semibold text-brand">
                  {phase.phaseNumber}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.95rem] font-medium text-foreground">
                      {phase.name}
                    </span>
                    {phase.isOptional && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {phase.goal}
                  </span>
                </span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {topicCount} topics · {problemCount} problems
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>

              <div className="border-t border-border p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                    {phase.topics.map((topic) => (
                      <details
                        key={topic.id}
                        open={topic.problems.length > 0 && topic.orderIndex === 1}
                        className="group/topic rounded-xl border border-border bg-background/40"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open/topic:rotate-180" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {topic.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {topic.problems.length}
                          </span>
                        </summary>
                        {topic.problems.length > 0 && (
                          <ul className="flex flex-col gap-0.5 border-t border-border p-1.5">
                            {topic.problems.map((problem) => (
                              <ProblemRow key={problem.id} problem={problem} />
                            ))}
                          </ul>
                        )}
                      </details>
                    ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
