import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { getMomoDirectConfig } from "@/lib/data/platform-config";
import {
  createMomoWalletTopup,
  primaryMerchantNumber,
} from "@/lib/payments/wallet-momo-claim";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  amount: z.number().min(5).max(50000),
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

  const merchantNumber = primaryMerchantNumber(momo.merchantNumbers);
  if (!merchantNumber) {
    return NextResponse.json(
      { error: "Merchant MoMo number is not configured." },
      { status: 503 },
    );
  }

  try {
    const { amount } = schema.parse(await request.json());
    const topup = await createMomoWalletTopup(ctx.vendorId, amount);

    return NextResponse.json({
      reference: topup.reference,
      amount: topup.amount,
      merchantNumber,
      merchantName: momo.merchantName || "DCS Elite",
      merchantNumbers: momo.merchantNumbers,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Amount must be between ₵5 and ₵50,000" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate payment code" },
      { status: 500 },
    );
  }
}
