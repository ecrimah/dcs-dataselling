import { NextResponse } from "next/server";
import { z } from "zod";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchVendorComplaints, submitVendorComplaint } from "@/lib/vendor/extras";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) return NextResponse.json({ complaints: [] });

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const complaints = await fetchVendorComplaints(ctx.vendorId);
  return NextResponse.json({ complaints });
}

const schema = z.object({
  message: z.string().min(10).max(2000),
  subject: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  try {
    const body = schema.parse(await request.json());
    const complaint = await submitVendorComplaint(ctx.vendorId, body.message, body.subject);
    return NextResponse.json({ success: true, complaint });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not submit" },
      { status: 400 },
    );
  }
}
