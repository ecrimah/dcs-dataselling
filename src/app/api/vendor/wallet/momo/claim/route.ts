import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { getMomoDirectConfig } from "@/lib/data/platform-config";
import { claimMomoWalletTopup } from "@/lib/payments/wallet-momo-claim";
import { getVendorNotifyPhone } from "@/lib/payments/wallet";
import { smsWalletTopup } from "@/lib/notifications/sms";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  transactionId: z.string().trim().min(4).max(40),
  reference: z.string().trim().min(3).max(40).optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const momo = await getMomoDirectConfig();
  if (!momo.enabled) {
    return NextResponse.json(
      { error: "MoMo ClaimIt is not enabled. Contact admin." },
      { status: 503 },
    );
  }

  try {
    const body = schema.parse(await request.json());
    const result = await claimMomoWalletTopup({
      vendorId: ctx.vendorId,
      transactionId: body.transactionId,
      reference: body.reference,
    });

    if (result.status === "amount_mismatch") {
      return NextResponse.json(
        {
          status: result.status,
          message: "The MoMo amount received is less than expected.",
          expectedAmount: result.orderAmount,
          receivedAmount: result.smsAmount,
        },
        { status: 400 },
      );
    }

    if (result.status === "paid" && result.amount != null && result.reference) {
      const phone = await getVendorNotifyPhone(ctx.vendorId);
      if (phone) {
        void smsWalletTopup({
          phone,
          amount: result.amount,
          reference: result.reference,
        });
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid transaction ID" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Claim failed" },
      { status: 500 },
    );
  }
}
