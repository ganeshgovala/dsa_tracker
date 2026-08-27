import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Company } from "@/lib/types";

export function CompanyAvatars({
  companies,
  className,
}: {
  companies: Company[];
  className?: string;
}) {
  if (!companies.length) return null;
  return (
    <AvatarGroup className={cn("[&>*]:size-7", className)}>
      {companies.map((c) => (
        <Avatar key={c.name} size="sm" title={`Asked by ${c.name}`}>
          <AvatarFallback
            className="text-[0.625rem] font-semibold text-white/90"
            style={{ backgroundColor: c.hue }}
          >
            {c.initial}
          </AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
