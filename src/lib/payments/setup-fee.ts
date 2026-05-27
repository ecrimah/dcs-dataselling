import "server-only";
import { getVendorSetupFee } from "@/lib/data/platform-config";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Read the current vendor setup fee from `platform_settings` (admin-controlled).
 * Falls back to env / hard default if the row is missing.
 */
export async function getVendorStoreSetupFeeGhs(): Promise<number> {
  return getVendorSetupFee();
}

export function generateSetupFeeReference() {
  return `DCS-SETUP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

type SetupPaymentRow = {
  id: string;
  user_id: string;
  slug: string;
  status: string;
  reference: string;
  amount: number;
  paid_at: string | null;
};

export async function markSetupPaymentPaid(reference: string, paymentReference?: string) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("vendor_setup_payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference ?? reference,
    })
    .eq("reference", reference)
    .eq("status", "pending")
    .select("id, user_id, slug, status, reference, amount, paid_at")
    .maybeSingle();

  if (error) {
    console.error("[setup-fee mark paid]", error);
    return null;
  }
  return data as SetupPaymentRow | null;
}

export async function verifySetupPaymentWithPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = (await res.json()) as {
    status?: boolean;
    data?: { status?: string; reference?: string };
  };

  if (!payload.status || payload.data?.status !== "success") {
    return false;
  }

  await markSetupPaymentPaid(reference, payload.data?.reference ?? reference);
  return true;
}

export async function getPaidSetupPaymentForUser(reference: string, userId: string, slug: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_setup_payments")
    .select("id, user_id, slug, status, reference, amount, paid_at")
    .eq("reference", reference)
    .eq("user_id", userId)
    .eq("slug", slug)
    .eq("status", "paid")
    .maybeSingle();

  return data as SetupPaymentRow | null;
}

export async function linkSetupPaymentToVendor(paymentId: string, vendorId: string, reference: string) {
  const service = createServiceClient();
  const paidAt = new Date().toISOString();

  await service.from("vendor_setup_payments").update({ vendor_id: vendorId }).eq("id", paymentId);

  await service
    .from("vendors")
    .update({
      setup_fee_paid_at: paidAt,
      setup_fee_reference: reference,
    })
    .eq("id", vendorId);
}
