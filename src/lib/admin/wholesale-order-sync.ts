import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Reconcile parent wholesale_orders.status from line items after admin bulk edits. */
export async function syncWholesaleOrderFromItems(
  service: SupabaseClient,
  wholesaleOrderId: string,
): Promise<void> {
  const { data: items } = await service
    .from("wholesale_order_items")
    .select("status")
    .eq("wholesale_order_id", wholesaleOrderId);

  if (!items?.length) return;

  const statuses = items.map((i) => (i as { status: string }).status);
  const now = new Date().toISOString();
  let next: string | null = null;

  if (statuses.every((s) => s === "fulfilled")) {
    next = "fulfilled";
  } else if (statuses.some((s) => s === "failed")) {
    next = statuses.every((s) => s === "failed") ? "failed" : "processing";
  } else if (statuses.some((s) => s === "processing")) {
    next = "processing";
  } else if (statuses.every((s) => s === "queued")) {
    next = "queued";
  }

  if (!next) return;

  const updates: Record<string, unknown> = { status: next };
  if (next === "fulfilled") updates.fulfilled_at = now;

  await service.from("wholesale_orders").update(updates).eq("id", wholesaleOrderId);
}
