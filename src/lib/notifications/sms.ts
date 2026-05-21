import "server-only";
import { SITE } from "@/lib/constants";
import { sendArkeselSms } from "@/lib/notifications/arkesel";

export async function smsOrderPaymentReceived(params: {
  phone: string;
  reference: string;
  bundleLabel: string;
}) {
  const message = `${SITE.name}: Payment received (${params.reference}). Your ${params.bundleLabel} bundle is being processed.`;
  return sendArkeselSms([params.phone], message);
}

export async function smsOrderFulfilled(params: {
  phone: string;
  reference: string;
  bundleLabel: string;
}) {
  const message = `${SITE.name}: ${params.bundleLabel} delivered to your line. Ref ${params.reference}. Thank you!`;
  return sendArkeselSms([params.phone], message);
}

export async function smsWalletTopup(params: {
  phone: string;
  amount: number;
  reference: string;
}) {
  const message = `${SITE.name}: Wallet topped up GHS ${params.amount.toFixed(2)}. Ref ${params.reference}.`;
  return sendArkeselSms([params.phone], message);
}
