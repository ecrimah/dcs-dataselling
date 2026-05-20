import { NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { id } = await params;
  const { reason } = (await request.json()) as { reason?: string };
  if (!reason || reason.trim().length < 3) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_vendor_kyc", {
    p_vendor_id: id,
    p_reason: reason,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
