import "server-only";
import crypto from "crypto";
import { creditVendorWallet } from "@/lib/payments/wallet";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function redeemPromoCode(vendorId: string, rawCode: string) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error("Enter a promo code");

  const service = createServiceClient();

  const { data: promo } = await service
    .from("promo_codes")
    .select("id, code, amount, max_redemptions, redemption_count, active, expires_at")
    .eq("code", code)
    .maybeSingle();

  const p = promo as {
    id: string;
    amount: number;
    max_redemptions: number | null;
    redemption_count: number;
    active: boolean;
    expires_at: string | null;
  } | null;

  if (!p || !p.active) throw new Error("Invalid or inactive promo code");
  if (p.expires_at && new Date(p.expires_at) < new Date()) {
    throw new Error("This promo code has expired");
  }
  if (p.max_redemptions != null && p.redemption_count >= p.max_redemptions) {
    throw new Error("This promo code has reached its limit");
  }

  const { data: existing } = await service
    .from("promo_redemptions")
    .select("id")
    .eq("promo_code_id", p.id)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (existing) throw new Error("You have already claimed this promo");

  const amount = Number(p.amount);
  const ref = `PROMO-${code}`;

  await service.from("promo_redemptions").insert({
    promo_code_id: p.id,
    vendor_id: vendorId,
    amount,
  });

  await service
    .from("promo_codes")
    .update({ redemption_count: p.redemption_count + 1 })
    .eq("id", p.id);

  await creditVendorWallet(vendorId, amount, "adjustment", ref, `Promo: ${code}`);

  return { amount, code, reference: ref };
}

export async function fetchVendorRewards(vendorId: string) {
  if (!hasSupabaseConfig()) return { balance: 0, withdrawals: [] as RewardWithdrawalRow[] };

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select("reward_balance")
    .eq("id", vendorId)
    .single();

  const { data: withdrawals } = await service
    .from("reward_withdrawals")
    .select("id, amount, momo_number, status, created_at, processed_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    balance: Number((vendor as { reward_balance: number } | null)?.reward_balance ?? 0),
    withdrawals: (withdrawals ?? []) as RewardWithdrawalRow[],
  };
}

export interface RewardWithdrawalRow {
  id: string;
  amount: number;
  momo_number: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export async function requestRewardWithdrawal(
  vendorId: string,
  amount: number,
  momoNumber: string,
) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");
  if (amount < 50) throw new Error("Minimum withdrawal is ₵50");

  const normalized = momoNumber.replace(/\D/g, "");
  if (normalized.length < 10) throw new Error("Enter a valid MoMo number");

  const service = createServiceClient();
  const { data: vendor } = await service
    .from("vendors")
    .select("reward_balance")
    .eq("id", vendorId)
    .single();

  const balance = Number((vendor as { reward_balance: number }).reward_balance);
  if (balance < amount) throw new Error("Insufficient reward balance");

  const { data: row, error } = await service
    .from("reward_withdrawals")
    .insert({
      vendor_id: vendorId,
      amount,
      momo_number: normalized.startsWith("0") ? normalized : `0${normalized.slice(-9)}`,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !row) throw new Error("Could not submit withdrawal");

  await service
    .from("vendors")
    .update({ reward_balance: +(balance - amount).toFixed(2) })
    .eq("id", vendorId);

  return { id: (row as { id: string }).id };
}

export async function submitVendorComplaint(
  vendorId: string,
  message: string,
  subject?: string,
) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");
  const trimmed = message.trim();
  if (trimmed.length < 10) throw new Error("Please describe the issue in more detail");

  const service = createServiceClient();
  const { data, error } = await service
    .from("vendor_complaints")
    .insert({
      vendor_id: vendorId,
      subject: subject?.trim() || "General complaint",
      message: trimmed,
      status: "open",
    })
    .select("id, status, created_at")
    .single();

  if (error || !data) throw new Error("Could not submit complaint");
  return data as { id: string; status: string; created_at: string };
}

export async function fetchVendorComplaints(vendorId: string) {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_complaints")
    .select("id, subject, message, status, admin_reply, created_at, updated_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as Array<{
    id: string;
    subject: string | null;
    message: string;
    status: string;
    admin_reply: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function createVendorApiKey(
  vendorId: string,
  name: string,
  options: { expiresInDays?: number } = {},
) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");
  const plain = `dcs_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = plain.slice(0, 12);
  const service = createServiceClient();

  const expiresAt =
    options.expiresInDays && options.expiresInDays > 0
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data, error } = await service
    .from("vendor_api_keys")
    .insert({
      vendor_id: vendorId,
      name: name.trim() || "Default",
      key_hash: hashApiKey(plain),
      key_prefix: prefix,
      active: true,
      expires_at: expiresAt,
    })
    .select("id, name, key_prefix, created_at, expires_at")
    .single();

  if (error || !data) throw new Error("Could not create API key");
  return {
    ...(data as {
      id: string;
      name: string;
      key_prefix: string;
      created_at: string;
      expires_at: string | null;
    }),
    key: plain,
  };
}

export async function fetchVendorApiKeys(vendorId: string) {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_api_keys")
    .select("id, name, key_prefix, active, last_used_at, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    name: string;
    key_prefix: string;
    active: boolean;
    last_used_at: string | null;
    created_at: string;
  }>;
}

export async function revokeVendorApiKey(vendorId: string, keyId: string) {
  if (!hasSupabaseConfig()) return;
  const service = createServiceClient();
  await service
    .from("vendor_api_keys")
    .update({ active: false, revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("vendor_id", vendorId);
}

export async function submitMtnAfa(vendorId: string, agentId: string) {
  if (!hasSupabaseConfig()) throw new Error("Database not configured");
  const id = agentId.trim();
  if (id.length < 4) throw new Error("Enter a valid MTN agent ID");

  const service = createServiceClient();
  const { data: existing } = await service
    .from("vendor_mtn_afa")
    .select("id, status")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  const ex = existing as { id: string; status: string } | null;
  if (ex?.status === "verified") throw new Error("Your MTN AFA is already verified");
  if (ex?.status === "pending") throw new Error("Your application is pending review");

  if (ex) {
    await service
      .from("vendor_mtn_afa")
      .update({ agent_id: id, status: "pending", submitted_at: new Date().toISOString() })
      .eq("id", ex.id);
  } else {
    await service.from("vendor_mtn_afa").insert({
      vendor_id: vendorId,
      agent_id: id,
      status: "pending",
    });
  }

  return { status: "pending" };
}

export async function fetchMtnAfaStatus(vendorId: string) {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();
  const { data } = await service
    .from("vendor_mtn_afa")
    .select("agent_id, status, admin_note, submitted_at, verified_at")
    .eq("vendor_id", vendorId)
    .maybeSingle();
  return data as {
    agent_id: string;
    status: string;
    admin_note: string | null;
    submitted_at: string;
    verified_at: string | null;
  } | null;
}

/** Credit referral/markup rewards when customer orders fulfil — call from webhook later */
export async function creditVendorReward(vendorId: string, amount: number, reference: string) {
  if (!hasSupabaseConfig() || amount <= 0) return;
  const service = createServiceClient();
  const { data: v } = await service.from("vendors").select("reward_balance").eq("id", vendorId).single();
  const current = Number((v as { reward_balance: number }).reward_balance);
  await service
    .from("vendors")
    .update({ reward_balance: +(current + amount).toFixed(2) })
    .eq("id", vendorId);
  void reference;
}
