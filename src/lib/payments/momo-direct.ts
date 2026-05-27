import "server-only";

import type { NetworkId } from "@/lib/constants";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * Parsed fields from a Mobile Money confirmation SMS.
 *
 * Fields are best-effort: if a regex doesn't match, the value stays `null`
 * and the SMS is stored as `parse_status='unparsed'` in `momo_sms` so an
 * admin can manually resolve it from /admin/momo-payments.
 */
export interface ParsedMomoSms {
  network: NetworkId | null;
  transactionId: string | null;
  amount: number | null;
  senderName: string | null;
  senderPhone: string | null;
  referenceHint: string | null;
  receivedAt: Date | null;
}

const MTN_SENDER_IDS = ["MobileMoney", "MOMO", "MTN MOMO", "MTN MobileMoney"];
const TELECEL_SENDER_IDS = ["TelecelCash", "Telecel", "VodafoneCash"];
const AT_SENDER_IDS = ["AirtelTigo", "ATMoney", "AT Money"];

export function detectNetworkFromSender(sender?: string | null): NetworkId | null {
  if (!sender) return null;
  const s = sender.trim().toLowerCase();
  if (MTN_SENDER_IDS.some((id) => s === id.toLowerCase() || s.includes(id.toLowerCase()))) return "mtn";
  if (TELECEL_SENDER_IDS.some((id) => s === id.toLowerCase() || s.includes(id.toLowerCase()))) return "telecel";
  if (AT_SENDER_IDS.some((id) => s === id.toLowerCase() || s.includes(id.toLowerCase()))) return "at";
  return null;
}

/**
 * Parse a MoMo SMS body into structured fields.
 *
 * Patterns are based on the known MTN MoMo "Payment received" format and
 * best-effort guesses for Telecel Cash + AT Money. When operators change
 * their wording the parser degrades gracefully — the raw body is always
 * stored so admins can recover.
 */
export function parseMomoSms(rawBody: string, senderId?: string | null): ParsedMomoSms {
  const text = rawBody.replace(/\s+/g, " ").trim();
  const network = detectNetworkFromSender(senderId);

  return {
    network,
    transactionId: extractTransactionId(text),
    amount: extractAmount(text),
    senderName: extractSenderName(text),
    senderPhone: extractSenderPhone(text),
    referenceHint: extractReferenceHint(text),
    receivedAt: null,
  };
}

// ----------------------------------------------------------------------------
// Field extractors
// ----------------------------------------------------------------------------

/** MTN/Telecel/AT confirmation SMS all include a transaction id. We try a few
 *  common labels: "Transaction ID: XXX", "TxnId XXX", "Ref. XXX", "id: XXX". */
function extractTransactionId(text: string): string | null {
  const patterns = [
    /\btransaction\s*id[:.\s]+([A-Z0-9]{6,20})/i,
    /\btxn\s*id[:.\s]+([A-Z0-9]{6,20})/i,
    /\bfinancial\s*transaction\s*id[:.\s]+([A-Z0-9]{6,20})/i,
    /\bref(?:erence)?(?:\s*no)?[:.\s]+([A-Z0-9]{6,20})/i,
    /\bid[:.\s]+([A-Z0-9]{10,20})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].toUpperCase();
  }
  return null;
}

/** Pulls the GHS amount. Handles "GHS 100.00", "GHC 100.00", "GH¢100", and "100.00 GHS". */
function extractAmount(text: string): number | null {
  const patterns = [
    /GH[SC¢]\s*([0-9]+(?:[,.\s][0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:[,.\s][0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*GH[SC¢]/i,
    /received\s+for\s+GH[SC¢]\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const n = Number(m[1].replace(/[,\s]/g, ""));
      if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
    }
  }
  return null;
}

/** "from JOSEPH ANUGA AWEDAM ..." style. Captures up to a sentence terminator. */
function extractSenderName(text: string): string | null {
  const m = text.match(/\bfrom\s+([A-Z][A-Z .'\-]{2,80}?)(?=\s+(?:on|at|\.|,|GH|[0-9]{10})|\s+\d{2,}|$)/);
  if (m && m[1]) return m[1].trim().slice(0, 80);
  return null;
}

/** Phone numbers embedded in the SMS body (Ghana format). */
function extractSenderPhone(text: string): string | null {
  const m = text.match(/\b(?:0|233)([2-9][0-9]{8})\b/);
  if (m && m[1]) return `0${m[1]}`;
  return null;
}

/** Customer-supplied reference / memo if the telco included it ("Reason: ..."). */
function extractReferenceHint(text: string): string | null {
  const m = text.match(/\b(?:reason|note|message|memo|details)[:.\s]+([A-Z0-9\-_ ]{3,40})/i);
  if (m && m[1]) return m[1].trim().slice(0, 40);
  return null;
}

// ----------------------------------------------------------------------------
// DB writes + matching
// ----------------------------------------------------------------------------

export interface RecordMomoSmsParams {
  rawBody: string;
  senderId: string | null;
  parsed: ParsedMomoSms;
}

export async function recordMomoSms(params: RecordMomoSmsParams): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();

  const { data, error } = await service
    .from("momo_sms")
    .insert({
      raw_body: params.rawBody.slice(0, 4000),
      sender_id: params.senderId,
      network: params.parsed.network,
      transaction_id: params.parsed.transactionId,
      amount: params.parsed.amount,
      sender_name: params.parsed.senderName,
      sender_phone: params.parsed.senderPhone,
      reference_hint: params.parsed.referenceHint,
      received_at: params.parsed.receivedAt?.toISOString() ?? new Date().toISOString(),
      parse_status: params.parsed.transactionId && params.parsed.amount ? "parsed" : "unparsed",
    })
    .select("id")
    .single();

  if (error) {
    // Unique violation on transaction_id means the same SMS was forwarded twice
    // — that's fine, just return null and let the caller move on.
    if (error.code !== "23505") {
      console.error("[recordMomoSms]", error);
    }
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Find a pending MoMo-direct order that matches this SMS. Match precedence:
 *   1. Reference hint matches an order.reference (the unique short code we
 *      tell the customer to type as the memo).
 *   2. Customer has already submitted this transaction_id on their order
 *      (payment_reference column).
 *   3. Same amount + same network on a recent awaiting_momo order — admin
 *      can still manually resolve from the queue if multiple compete.
 */
export async function autoMatchOrderForSms(smsId: string): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();

  const { data: sms } = await service
    .from("momo_sms")
    .select("id, transaction_id, amount, reference_hint, network, matched_order_id")
    .eq("id", smsId)
    .maybeSingle();

  const row = sms as {
    id: string;
    transaction_id: string | null;
    amount: number | string | null;
    reference_hint: string | null;
    network: NetworkId | null;
    matched_order_id: string | null;
  } | null;

  if (!row || row.matched_order_id) return row?.matched_order_id ?? null;

  const amount = row.amount != null ? Number(row.amount) : null;

  // 1. Match by reference hint (the unique order code the customer typed in
  //    the MoMo memo field, if they did).
  if (row.reference_hint) {
    const { data } = await service
      .from("orders")
      .select("id, amount")
      .eq("reference", row.reference_hint.trim().toUpperCase())
      .eq("status", "awaiting_momo")
      .eq("payment_provider", "momo_direct")
      .maybeSingle();
    const o = data as { id: string; amount: number | string } | null;
    if (o && (amount == null || withinAmountTolerance(Number(o.amount), amount))) {
      await linkSmsToOrder(row.id, o.id);
      return o.id;
    }
  }

  // 2. Match by transaction_id pre-submitted on the order's payment_reference.
  if (row.transaction_id) {
    const { data } = await service
      .from("orders")
      .select("id, amount")
      .eq("payment_reference", row.transaction_id)
      .eq("status", "awaiting_momo")
      .eq("payment_provider", "momo_direct")
      .maybeSingle();
    const o = data as { id: string; amount: number | string } | null;
    if (o && (amount == null || withinAmountTolerance(Number(o.amount), amount))) {
      await linkSmsToOrder(row.id, o.id);
      return o.id;
    }
  }

  // 3. Amount-only fallback intentionally NOT auto-matched (collision risk).
  //    Admin can manually match from /admin/momo-payments.

  return null;
}

/**
 * Match a customer-submitted transaction id to a forwarded SMS.
 * Called from the order page when the customer pastes their txn ID.
 */
export async function findSmsByTransactionId(
  transactionId: string,
): Promise<{
  id: string;
  amount: number | null;
  network: NetworkId | null;
  matched_order_id: string | null;
} | null> {
  if (!hasSupabaseConfig()) return null;
  const service = createServiceClient();

  const txnUpper = transactionId.trim().toUpperCase();
  const { data } = await service
    .from("momo_sms")
    .select("id, amount, network, matched_order_id")
    .eq("transaction_id", txnUpper)
    .maybeSingle();

  return (
    (data as {
      id: string;
      amount: number | null;
      network: NetworkId | null;
      matched_order_id: string | null;
    } | null) ?? null
  );
}

export async function linkSmsToOrder(smsId: string, orderId: string): Promise<void> {
  if (!hasSupabaseConfig()) return;
  const service = createServiceClient();
  await service
    .from("momo_sms")
    .update({ matched_order_id: orderId, matched_at: new Date().toISOString() })
    .eq("id", smsId)
    .is("matched_order_id", null);
}

function withinAmountTolerance(orderAmount: number, smsAmount: number): boolean {
  // Allow ±GHS 0.01 to absorb rounding. We do NOT accept undercharges.
  return smsAmount + 0.01 >= orderAmount;
}

export function generateMomoOrderReference(): string {
  // Short, all-uppercase, easy to type in the MoMo memo field. 8 chars after DCS-.
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `DCS-${rand}`;
}
