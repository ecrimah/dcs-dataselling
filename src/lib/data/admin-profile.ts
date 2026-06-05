import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { fetchAdminOrderStats, fetchAdminOverview } from "@/lib/data/admin-queries";
import { splitDisplayName } from "@/lib/data/vendor-profile";
import type {
  AdminOrderSnapshot,
  AdminPlatformSnapshot,
  AdminProfileRecord,
  UserRole,
} from "@/types";

export type { AdminOrderSnapshot, AdminPlatformSnapshot, AdminProfileRecord };

function formatMemberDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAccountAge(iso: string) {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function roleLabel(role: UserRole) {
  if (role === "ops") return "Operations";
  if (role === "admin") return "Platform Admin";
  return role;
}

export async function fetchAdminProfileRecord(userId: string): Promise<AdminProfileRecord | null> {
  if (!hasSupabaseConfig()) return null;

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    created_at: string;
  };

  const fullName = row.full_name?.trim() || row.email.split("@")[0];
  const { firstName, lastName } = splitDisplayName(fullName);

  return {
    id: row.id,
    email: row.email,
    fullName,
    firstName,
    lastName,
    phone: row.phone,
    role: row.role,
    roleLabel: roleLabel(row.role),
    username: row.email.split("@")[0],
    memberSince: formatMemberDate(row.created_at),
    accountAge: formatAccountAge(row.created_at),
    createdAt: row.created_at,
  };
}

export async function fetchAdminPlatformSnapshot(): Promise<AdminPlatformSnapshot> {
  const overview = await fetchAdminOverview();
  return {
    gmv30d: overview?.gmv30d ?? 0,
    platformRevenue30d: overview?.platformRevenue30d ?? 0,
    ordersToday: overview?.ordersToday ?? 0,
    activeVendors: overview?.activeVendors ?? 0,
    successRate: overview?.successRate ?? 0,
  };
}

export async function fetchAdminOrderSnapshot(): Promise<AdminOrderSnapshot> {
  const stats = await fetchAdminOrderStats();
  const successRate =
    stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 1000) / 10 : 100;

  return {
    totalOrders: stats.total,
    completedOrders: stats.fulfilled,
    successRate,
    lifetimeRevenue: stats.revenue,
  };
}
