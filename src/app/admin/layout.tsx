import { AdminShell } from "@/components/layout/admin-shell";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { Toaster } from "sonner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "ops"]);
  const profile = await getCurrentProfile();
  const adminName = profile?.fullName ?? profile?.email?.split("@")[0] ?? "Admin";
  const adminRole = profile?.role === "ops" ? "Operations" : "Platform Admin";

  return (
    <>
      <AdminShell adminName={adminName} adminRole={adminRole}>
        {children}
      </AdminShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
