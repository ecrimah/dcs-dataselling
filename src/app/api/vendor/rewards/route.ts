import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchVendorRewards, requestRewardWithdrawal } from "@/lib/vendor/extras";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ balance: 0, withdrawals: [] });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const data = await fetchVendorRewards(ctx.vendorId);
  return NextResponse.json(data);
}

const withdrawSchema = z.object({
  amount: z.number().min(50).max(100000),
  momoNumber: z.string().min(10).max(20),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = withdrawSchema.parse(await request.json());
    const result = await requestRewardWithdrawal(ctx.vendorId, body.amount, body.momoNumber);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Minimum withdrawal is ₵50" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Withdrawal failed" },
      { status: 400 },
    );
  }
}
