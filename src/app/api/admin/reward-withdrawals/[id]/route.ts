import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["approved", "paid", "rejected"]),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: row, error: fetchError } = await service
    .from("reward_withdrawals")
    .select("id, vendor_id, amount, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  }

  const withdrawal = row as {
    id: string;
    vendor_id: string;
    amount: number;
    status: string;
  };

  if (withdrawal.status === "paid" || withdrawal.status === "rejected") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: body.status,
    processed_at: body.status === "approved" ? null : now,
  };
  if (body.adminNote !== undefined) updates.admin_note = body.adminNote.trim() || null;

  const { error: updateError } = await service
    .from("reward_withdrawals")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (body.status === "rejected") {
    const { data: vendor } = await service
      .from("vendors")
      .select("reward_balance")
      .eq("id", withdrawal.vendor_id)
      .single();

    const balance = Number((vendor as { reward_balance: number }).reward_balance);
    await service
      .from("vendors")
      .update({ reward_balance: +(balance + Number(withdrawal.amount)).toFixed(2) })
      .eq("id", withdrawal.vendor_id);
  }

  return NextResponse.json({ ok: true });
}
