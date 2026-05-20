import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth/session";
import { Toaster } from "sonner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "ops"]);
  return (
    <>
      <DashboardShell role="admin" title="Platform Control">
        {children}
      </DashboardShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
