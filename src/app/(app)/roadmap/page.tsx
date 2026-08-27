import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { getRoadmapView } from "@/lib/roadmap/view";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const phases = await getRoadmapView();
  return <RoadmapView phases={phases} />;
}
