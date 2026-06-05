import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { getPlatformConfig, savePlatformConfig } from "@/lib/data/platform-config";
import { normalizePlatformConfig } from "@/lib/platform/config-types";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  telecel: z.enum(["manual", "successbizhub"]),
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
  return NextResponse.json({
    telecel: config.supplierRouting.telecel ?? null,
    envDefault: process.env.SUPPLIER_FOR_TELECEL?.trim().toLowerCase() ?? "manual",
  });
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const current = await getPlatformConfig();
  const merged = normalizePlatformConfig({
    ...current,
    supplierRouting: { telecel: body.telecel },
  });

  await savePlatformConfig(merged);
  return NextResponse.json({
    ok: true,
    telecel: merged.supplierRouting.telecel ?? null,
  });
}
