import { CircleCheck, CircleDashed, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Difficulty, ProblemStatus } from "@/lib/types";

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-success/12 text-success",
  Medium: "bg-warning/12 text-warning",
  Hard: "bg-danger/12 text-danger",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge className={cn("gap-1.5 font-medium", difficultyStyles[difficulty], className)}>
      <span
        className="size-1.5 rounded-full bg-current"
        aria-hidden
      />
      {difficulty}
    </Badge>
  );
}

const statusConfig: Record<
  ProblemStatus,
  { label: string; className: string; Icon: typeof Circle }
> = {
  Solved: { label: "Solved", className: "bg-success/12 text-success", Icon: CircleCheck },
  Attempting: { label: "Attempting", className: "bg-warning/12 text-warning", Icon: CircleDashed },
  Todo: { label: "Todo", className: "bg-brand/12 text-brand", Icon: Circle },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProblemStatus;
  className?: string;
}) {
  const { label, className: styles, Icon } = statusConfig[status];
  return (
    <Badge className={cn("gap-1.5 font-medium", styles, className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
