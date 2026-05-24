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
        <div className="admin-page-content mx-auto max-w-6xl px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
          {children}
        </div>
      </AdminShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
