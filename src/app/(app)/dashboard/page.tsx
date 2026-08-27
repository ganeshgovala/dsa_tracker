import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getRoadmapView } from "@/lib/roadmap/view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const phases = await getRoadmapView();
  return <DashboardView phases={phases} />;
}
