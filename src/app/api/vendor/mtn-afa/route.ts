import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchMtnAfaStatus, submitMtnAfa } from "@/lib/vendor/extras";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) return NextResponse.json({ status: null });

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const status = await fetchMtnAfaStatus(ctx.vendorId);
  return NextResponse.json({ status });
}

const schema = z.object({ agentId: z.string().min(4).max(40) });

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const { agentId } = schema.parse(await request.json());
    const result = await submitMtnAfa(ctx.vendorId, agentId);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid agent ID" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Submission failed" },
      { status: 400 },
    );
  }
}
