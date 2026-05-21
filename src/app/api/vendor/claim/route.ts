import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { redeemPromoCode } from "@/lib/vendor/extras";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({ code: z.string().min(3).max(40) });

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const { code } = schema.parse(await request.json());
    const result = await redeemPromoCode(ctx.vendorId, code);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Claim failed" },
      { status: 400 },
    );
  }
}
