import { NextResponse } from "next/server";
import { getVendorSetupFee } from "@/lib/data/platform-config";

export const dynamic = "force-dynamic";

/**
 * Public read-only endpoint exposing the current vendor setup fee so the
 * create-store wizard (client component) can show the live price without
 * needing the admin API.
 */
export async function GET() {
  const fee = await getVendorSetupFee();
  return NextResponse.json({ vendorSetupFeeGhs: fee });
}
