import "server-only";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getOrCreateVendorWallet } from "@/lib/payments/wallet";
import type { VendorStatus, VendorTier } from "@/types";

export interface AdminVendorDetail {
  id: string;
  userId: string;
  slug: string;
  businessName: string;
  status: VendorStatus;
  verified: boolean;
  featured: boolean;
  tier: VendorTier;
  tierManual: boolean;
  momoNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  walletBalance: number;
}

export async function fetchAdminVendorDetail(vendorId: string): Promise<AdminVendorDetail | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();

  const { data: vendor, error } = await service
    .from("vendors")
    .select(
      "id, user_id, slug, business_name, status, verified, featured, tier, tier_manual, momo_number, whatsapp_number",
    )
    .eq("id", vendorId)
    .maybeSingle();

  if (error || !vendor) return null;

  const v = vendor as {
    id: string;
    user_id: string;
    slug: string;
    business_name: string;
    status: VendorStatus;
    verified: boolean;
    featured: boolean;
    tier: VendorTier | null;
    tier_manual: boolean | null;
    momo_number: string | null;
    whatsapp_number: string | null;
  };

  const { data: profile } = await service
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", v.user_id)
    .maybeSingle();

  const p = profile as { full_name: string | null; phone: string | null; email: string | null } | null;
  const wallet = await getOrCreateVendorWallet(v.id);

  return {
    id: v.id,
    userId: v.user_id,
    slug: v.slug,
    businessName: v.business_name,
    status: v.status,
    verified: v.verified,
    featured: v.featured,
    tier: v.tier ?? "starter",
    tierManual: v.tier_manual ?? false,
    momoNumber: v.momo_number,
    whatsappNumber: v.whatsapp_number,
    email: p?.email ?? null,
    fullName: p?.full_name ?? null,
    phone: p?.phone ?? null,
    walletBalance: wallet.balance,
  };
}
