import { NextResponse } from "next/server";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { fetchVendorWalletLedger } from "@/lib/data/vendor-agent";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return new NextResponse("Database not configured", { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const entries = await fetchVendorWalletLedger(ctx.vendorId, 5000);
  const header = "date,type,reference,amount,balance_after,note\n";
  const rows = entries
    .map((e) =>
      [
        e.createdAt,
        e.entryType,
        e.reference ?? "",
        e.amount,
        e.balanceAfter ?? "",
        (e.note ?? "").replace(/,/g, " "),
      ].join(","),
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="dcs-wallet-${Date.now()}.csv"`,
    },
  });
}
