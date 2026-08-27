"use client";

import Link from "next/link";
import { Check, CirclePlay, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemProgress } from "@/lib/progress";
import type { RoadmapDifficulty } from "@/lib/roadmap/types";

const difficultyDot: Record<RoadmapDifficulty, string> = {
  EASY: "bg-success",
  MEDIUM: "bg-warning",
  HARD: "bg-danger",
};

export interface ProblemRowProblem {
  id: string;
  name: string;
  topicName?: string;
  difficulty: RoadmapDifficulty;
  leetcodeUrl?: string | null;
  gfgUrl?: string | null;
  videoUrl?: string | null;
}

/**
 * Shared problem row with a solve checkbox. Used by the dashboard's
 * Today's practice list; solved state syncs via useProblemProgress.
 */
export function ProblemRow({
  problem,
  className,
}: {
  problem: ProblemRowProblem;
  className?: string;
}) {
  const { solvedIds, toggle } = useProblemProgress();
  const solved = solvedIds.has(problem.id);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-white/15",
        solved && "bg-card/50",
        className,
      )}
    >
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
          "size-1.5 shrink-0 rounded-full",
          difficultyDot[problem.difficulty],
        )}
      />

      <Link
        href="/playground"
        className={cn(
          "min-w-0 flex-1 truncate text-sm transition-colors hover:text-brand",
          solved ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {problem.name}
        {problem.topicName && (
          <span className="ml-2 text-xs text-muted-foreground">
            · {problem.topicName}
          </span>
        )}
      </Link>

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
        {problem.videoUrl ? (
          <a
            href={problem.videoUrl}
            target="_blank"
            rel="noreferrer"
            title="Video solution"
            className="grid size-6 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
          >
            <CirclePlay className="size-3.5" />
          </a>
        ) : (
          <ExternalLink
            className="size-3.5 text-transparent"
            aria-hidden
          />
        )}
      </span>
    </div>
  );
}
