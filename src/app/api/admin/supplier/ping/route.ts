import { NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { isSkanka5Configured, pingSupplier } from "@/lib/suppliers/skanka5";

export async function POST() {
  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isSkanka5Configured()) {
    return NextResponse.json(
      { error: "SKANKA5_API_KEY not set" },
      { status: 503 },
    );
  }
  const result = await pingSupplier();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, status: result.status },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, networks: result.data });
}
