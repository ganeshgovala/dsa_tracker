import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AuthGate } from "@/components/auth/auth-gate";
import { getTopics } from "@/lib/dashboard";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const topics = await getTopics();
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full">
        <AppSidebar topics={topics} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AuthGate>
  );
}
