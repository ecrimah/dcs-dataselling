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

export async function smsWalletAdminCredit(params: {
  phone: string;
  amount: number;
  reference: string;
  balanceAfter: number;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: GHS ${params.amount.toFixed(2)} credited to your wallet by admin. Balance GHS ${params.balanceAfter.toFixed(2)}. Ref ${params.reference}.`;
  const ctx: SmsLogContext = {
    template: "wallet_admin_credit",
    context: { reference: params.reference, amount: params.amount, ...params.context },
  };
  return sendArkeselSms([params.phone], message, ctx);
}

export async function smsWalletAdminDebit(params: {
  phone: string;
  amount: number;
  reference: string;
  balanceAfter: number;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: GHS ${params.amount.toFixed(2)} debited from your wallet by admin. Balance GHS ${params.balanceAfter.toFixed(2)}. Ref ${params.reference}.`;
  const ctx: SmsLogContext = {
    template: "wallet_admin_debit",
    context: { reference: params.reference, amount: params.amount, ...params.context },
  };
  return sendArkeselSms([params.phone], message, ctx);
}

export async function smsPasswordReset(params: {
  phone: string;
  tempPassword: string;
  context?: Record<string, unknown>;
}): Promise<SmsResult> {
  const message = `${SITE.name}: Your password was reset by admin. New password: ${params.tempPassword}. Sign in and change it in Profile.`;
  const ctx: SmsLogContext = {
    template: "admin_password_reset",
    context: params.context,
  };
  return sendArkeselSms([params.phone], message, ctx);
}
