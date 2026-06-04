import { NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { getSupplierById } from "@/lib/suppliers/registry";
import { isSkanka5Configured, pingSupplier as pingSkanka5 } from "@/lib/suppliers/skanka5";
import { isSuccessBizHubConfigured, pingSupplier as pingSuccessBizHub } from "@/lib/suppliers/successbizhub";

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supplierId =
    new URL(request.url).searchParams.get("supplier")?.trim().toLowerCase() ?? "skanka5";

  if (supplierId === "successbizhub") {
    if (!isSuccessBizHubConfigured()) {
      return NextResponse.json({ error: "SUCCESSBIZHUB_API_KEY not set" }, { status: 503 });
    }
    const result = await pingSuccessBizHub();
    if (!result.ok || result.data.success === false) {
      return NextResponse.json(
        { ok: false, error: result.ok ? (result.data.error ?? "Ping failed") : result.error },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, supplier: "successbizhub", balance: result.data });
  }

  const client = getSupplierById(supplierId);
  if (client?.ping) {
    const result = await client.ping();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Ping failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, supplier: supplierId, raw: result.raw });
  }

  if (!isSkanka5Configured()) {
    return NextResponse.json({ error: "SKANKA5_API_KEY not set" }, { status: 503 });
  }
  const result = await pingSkanka5();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, status: result.status },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, supplier: "skanka5", networks: result.data });
}
