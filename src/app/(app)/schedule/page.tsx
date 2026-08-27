import { ScheduleView } from "@/components/schedule/schedule-view";
import { getRoadmapView } from "@/lib/roadmap/view";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const phases = await getRoadmapView();
  return <ScheduleView phases={phases} />;
}
