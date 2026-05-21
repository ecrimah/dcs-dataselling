import "server-only";
import { SITE } from "@/lib/constants";
import { sendArkeselSms, type SmsLogContext, type SmsResult } from "@/lib/notifications/arkesel";

export async function smsOrderPaymentReceived(params: {
  phone: string;
  reference: string;
  bundleLabel: string;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: Payment received (${params.reference}). Your ${params.bundleLabel} bundle is being processed.`;
  const ctx: SmsLogContext = {
    template: "order_payment_received",
    context: { reference: params.reference, ...params.context },
  };
  return sendArkeselSms([params.phone], message, ctx);
}

export async function smsOrderFulfilled(params: {
  phone: string;
  reference: string;
  bundleLabel: string;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: ${params.bundleLabel} delivered to your line. Ref ${params.reference}. Thank you!`;
  const ctx: SmsLogContext = {
    template: "order_fulfilled",
    context: { reference: params.reference, ...params.context },
  };
  return sendArkeselSms([params.phone], message, ctx);
}

export async function smsWalletTopup(params: {
  phone: string;
  amount: number;
  reference: string;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: Wallet topped up GHS ${params.amount.toFixed(2)}. Ref ${params.reference}.`;
  const ctx: SmsLogContext = {
    template: "wallet_topup",
    context: { reference: params.reference, amount: params.amount, ...params.context },
  };
  return sendArkeselSms([params.phone], message, ctx);
}
