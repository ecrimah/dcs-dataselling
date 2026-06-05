import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfYearIso() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export interface VendorProfileWalletStats {
  balance: number;
  topupsThisMonth: number;
  topupsThisYear: number;
}

export async function fetchVendorProfilePhone(userId: string): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();
  return (data as { phone: string | null } | null)?.phone ?? null;
}

export async function fetchVendorWalletPeriodTopups(
  vendorId: string,
): Promise<VendorProfileWalletStats> {
  const wallet = await getOrCreateVendorWallet(vendorId);
  if (!hasSupabaseConfig()) {
    return { balance: wallet.balance, topupsThisMonth: 0, topupsThisYear: 0 };
  }

  const service = createServiceClient();
  const monthStart = startOfMonthIso();
  const yearStart = startOfYearIso();

  const [monthRes, yearRes] = await Promise.all([
    service
      .from("wallet_topups")
      .select("amount")
      .eq("vendor_id", vendorId)
      .eq("status", "paid")
      .gte("paid_at", monthStart),
    service
      .from("wallet_topups")
      .select("amount")
      .eq("vendor_id", vendorId)
      .eq("status", "paid")
      .gte("paid_at", yearStart),
  ]);

  const sum = (rows: { amount: number }[] | null | undefined) =>
    (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return {
    balance: wallet.balance,
    topupsThisMonth: +sum(monthRes.data as { amount: number }[]).toFixed(2),
    topupsThisYear: +sum(yearRes.data as { amount: number }[]).toFixed(2),
  };
}

export function splitDisplayName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "—", lastName: "—" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
