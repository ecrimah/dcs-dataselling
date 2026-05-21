import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["verified", "rejected"]),
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

  const updates: Record<string, unknown> = {
    status: body.status,
    admin_note: body.adminNote?.trim() || null,
  };
  if (body.status === "verified") {
    updates.verified_at = new Date().toISOString();
  }

  const service = createServiceClient();
  const { error } = await service.from("vendor_mtn_afa").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
