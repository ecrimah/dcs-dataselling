import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  wholesaleBundleId: z.string().uuid(),
  markupAmount: z.number().min(0).max(500),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = schema.parse(await request.json());
    const service = createServiceClient();

    const { data: vendor } = await service
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const v = vendor as { id: string } | null;
    if (!v) return NextResponse.json({ error: "No vendor account" }, { status: 404 });

    const { data: wholesale } = await service
      .from("wholesale_bundles")
      .select("*")
      .eq("id", body.wholesaleBundleId)
      .maybeSingle();
    const wb = wholesale as {
      id: string;
      sku: string;
      network: string;
      name: string;
      data_mb: number;
      validity_days: number;
      wholesale_price: number;
      suggested_retail: number;
      min_markup: number;
      max_markup: number | null;
      popular: boolean;
    } | null;
    if (!wb) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    const { data: inserted, error } = await service
      .from("vendor_listings")
      .insert({
        vendor_id: v.id,
        wholesale_bundle_id: body.wholesaleBundleId,
        markup_amount: body.markupAmount,
        active: true,
      })
      .select("id, vendor_id, wholesale_bundle_id, markup_amount, custom_name, active, sales_count")
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    }
    const listing = inserted as {
      id: string;
      vendor_id: string;
      wholesale_bundle_id: string;
      markup_amount: number;
      custom_name: string | null;
      active: boolean;
      sales_count: number;
    };

    return NextResponse.json({
      listing: {
        id: listing.id,
        vendorId: listing.vendor_id,
        wholesaleBundleId: listing.wholesale_bundle_id,
        markupAmount: Number(listing.markup_amount),
        customName: listing.custom_name,
        active: listing.active,
        salesCount: listing.sales_count,
        wholesale: {
          id: wb.id,
          sku: wb.sku,
          network: wb.network,
          name: wb.name,
          dataMb: wb.data_mb,
          validityDays: wb.validity_days,
          wholesalePrice: Number(wb.wholesale_price),
          suggestedRetail: Number(wb.suggested_retail),
          minMarkup: Number(wb.min_markup),
          maxMarkup: wb.max_markup ? Number(wb.max_markup) : null,
          popular: wb.popular,
        },
        finalPrice: Number(wb.wholesale_price) + Number(listing.markup_amount),
        vendorEarning: Number(listing.markup_amount),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[listings_post]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
