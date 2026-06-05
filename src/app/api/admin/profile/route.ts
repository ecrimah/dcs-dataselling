import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

export async function PATCH(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.fullName === undefined && body.phone === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (body.fullName !== undefined) updates.full_name = body.fullName;
  if (body.phone !== undefined) updates.phone = body.phone || null;

  const service = createServiceClient();
  const { error } = await service.from("profiles").update(updates).eq("id", auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
