import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { getPlatformConfig, savePlatformConfig } from "@/lib/data/platform-config";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  vendorSetupFeeGhs: z.number().min(1).max(100000),
});

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = await getPlatformConfig();
  return NextResponse.json({ config });
}

export async function PATCH(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  await savePlatformConfig(body);
  const config = await getPlatformConfig();
  return NextResponse.json({ ok: true, config });
}
