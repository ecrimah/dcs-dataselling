import "server-only";
import { getPlatformConfig } from "@/lib/data/platform-config";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const WHOLESALE_ITEM_ACTIVE = ["pending", "queued", "processing"] as const;
const STOREFRONT_ACTIVE = ["pending", "awaiting_momo", "paid", "queued", "processing"] as const;

export interface RecipientCooldownHit {
  phone: string;
  reference: string;
  status: string;
  source: "wholesale" | "storefront";
  createdAt: string;
}

export function normalizeRecipientPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return null;
}

export async function getRecipientOrderCooldownMinutes(): Promise<number> {
  const config = await getPlatformConfig();
  return config.recipientOrderCooldownMinutes;
}

export function recipientCooldownMessage(
  phone: string,
  cooldownMinutes: number,
  hit?: Pick<RecipientCooldownHit, "reference" | "status">,
): string {
  const base = `A similar order for ${phone} is still processing. Please wait up to ${cooldownMinutes} minute${cooldownMinutes === 1 ? "" : "s"} before ordering for this number again.`;
  if (hit?.reference) {
    return `${base} (ref ${hit.reference})`;
  }
  return base;
}

/** Returns phones that have an active order inside the cooldown window. */
export async function findRecipientCooldownHits(
  phones: string[],
): Promise<Map<string, RecipientCooldownHit>> {
  const hits = new Map<string, RecipientCooldownHit>();
  if (!hasSupabaseConfig()) return hits;

  const normalized = [
    ...new Set(
      phones.map((p) => normalizeRecipientPhone(p)).filter((p): p is string => Boolean(p)),
    ),
  ];
  if (normalized.length === 0) return hits;

  const cooldownMinutes = await getRecipientOrderCooldownMinutes();
  const since = new Date(Date.now() - cooldownMinutes * 60_000).toISOString();
  const service = createServiceClient();

  const { data: wholesaleRows } = await service
    .from("wholesale_order_items")
    .select(
      "recipient_phone, status, created_at, wholesale_orders!inner ( reference )",
    )
    .in("recipient_phone", normalized)
    .gte("created_at", since)
    .in("status", [...WHOLESALE_ITEM_ACTIVE])
    .order("created_at", { ascending: false });

  for (const raw of wholesaleRows ?? []) {
    const row = raw as {
      recipient_phone: string;
      status: string;
      created_at: string;
      wholesale_orders: { reference: string } | { reference: string }[];
    };
    const phone = normalizeRecipientPhone(row.recipient_phone);
    if (!phone || hits.has(phone)) continue;
    const order = Array.isArray(row.wholesale_orders)
      ? row.wholesale_orders[0]
      : row.wholesale_orders;
    hits.set(phone, {
      phone,
      reference: order?.reference ?? "—",
      status: row.status,
      source: "wholesale",
      createdAt: row.created_at,
    });
  }

  const { data: storefrontRows } = await service
    .from("orders")
    .select("recipient_phone, status, reference, created_at")
    .in("recipient_phone", normalized)
    .gte("created_at", since)
    .in("status", [...STOREFRONT_ACTIVE])
    .order("created_at", { ascending: false });

  for (const raw of storefrontRows ?? []) {
    const row = raw as {
      recipient_phone: string;
      status: string;
      reference: string;
      created_at: string;
    };
    const phone = normalizeRecipientPhone(row.recipient_phone);
    if (!phone || hits.has(phone)) continue;
    hits.set(phone, {
      phone,
      reference: row.reference,
      status: row.status,
      source: "storefront",
      createdAt: row.created_at,
    });
  }

  return hits;
}

export async function assertRecipientsNotOnCooldown(
  phones: string[],
): Promise<{ ok: true } | { ok: false; phone: string; message: string; hit: RecipientCooldownHit }> {
  const cooldownMinutes = await getRecipientOrderCooldownMinutes();
  const hits = await findRecipientCooldownHits(phones);
  const first = hits.values().next().value as RecipientCooldownHit | undefined;
  if (!first) return { ok: true };
  return {
    ok: false,
    phone: first.phone,
    message: recipientCooldownMessage(first.phone, cooldownMinutes, first),
    hit: first,
  };
}

/** Attach cooldown errors to parsed bulk rows (preview + checkout). */
export async function applyRecipientCooldownErrors<
  T extends { phone: string; error?: string },
>(rows: T[]): Promise<T[]> {
  const candidates = rows.filter((r) => !r.error).map((r) => r.phone);
  if (candidates.length === 0) return rows;

  const cooldownMinutes = await getRecipientOrderCooldownMinutes();
  const hits = await findRecipientCooldownHits(candidates);

  return rows.map((row) => {
    if (row.error) return row;
    const phone = normalizeRecipientPhone(row.phone);
    if (!phone) return row;
    const hit = hits.get(phone);
    if (!hit) return row;
    return {
      ...row,
      error: recipientCooldownMessage(phone, cooldownMinutes, hit),
    };
  });
}
