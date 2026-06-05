import { redirect } from "next/navigation";
import { AdminProfileView } from "@/components/admin/admin-profile-view";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  fetchAdminOrderSnapshot,
  fetchAdminPlatformSnapshot,
  fetchAdminProfileRecord,
} from "@/lib/data/admin-profile";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await getCurrentProfile();
  if (!session) redirect("/auth/login");
  if (!["admin", "ops"].includes(session.role)) redirect("/auth/login");

  const [profile, platform, orders] = await Promise.all([
    fetchAdminProfileRecord(session.id),
    fetchAdminPlatformSnapshot(),
    fetchAdminOrderSnapshot(),
  ]);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Could not load your admin profile.
      </div>
    );
  }

  return <AdminProfileView profile={profile} platform={platform} orders={orders} />;
}
