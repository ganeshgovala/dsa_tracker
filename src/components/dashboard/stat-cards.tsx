import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stats } from "@/lib/types";
import { BarSpark, RingSpark } from "./mini-charts";

function DeltaBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        up ? "bg-success/12 text-success" : "bg-danger/12 text-danger",
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function StatShell({
  label,
  accessory,
  children,
}: {
  label: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[8.5rem] flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {accessory}
      </div>
      {children}
    </div>
  );
}

const difficultyMeta = [
  { key: "easy", label: "Easy", color: "var(--success)" },
  { key: "medium", label: "Medium", color: "var(--warning)" },
  { key: "hard", label: "Hard", color: "var(--danger)" },
] as const;

export function StatCards({ stats }: { stats: Stats }) {
  const { easy, medium, hard } = stats.solvedByDifficulty;
  const totalByDiff = easy + medium + hard || 1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Problems solved */}
      <StatShell
        label="Problems solved"
        accessory={<DeltaBadge value={stats.solvedDeltaPct} />}
      >
        <div className="flex items-end justify-between gap-3">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {stats.problemsSolved}
          </span>
          <BarSpark data={stats.weeklySolved} className="mb-1" />
        </div>
      </StatShell>

      {/* Topics covered */}
      <StatShell label="Topics covered">
        <div className="flex items-end justify-between gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {stats.topicsCovered}
            </span>
            <span className="text-sm text-muted-foreground">
              / {stats.topicsTotal}
            </span>
          </span>
          <RingSpark
            value={stats.topicsCovered}
            max={stats.topicsTotal}
            className="mb-0.5"
          />
        </div>
      </StatShell>

      {/* By difficulty */}
      <StatShell label="Solved by difficulty">
        <div className="flex flex-col gap-3">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            {difficultyMeta.map(({ key, color }) => (
              <div
                key={key}
                style={{
                  width: `${(stats.solvedByDifficulty[key] / totalByDiff) * 100}%`,
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
          <div className="flex items-end justify-between">
            {difficultyMeta.map(({ key, label, color }) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-xl font-semibold tabular-nums">
                  {stats.solvedByDifficulty[key]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </StatShell>
    </div>
  );
}
