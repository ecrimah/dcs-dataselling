import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE } from "@/lib/constants";
import {
  generateSetupFeeReference,
  getVendorStoreSetupFeeGhs,
} from "@/lib/payments/setup-fee";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  slug: z.string().min(3).max(40),
  businessName: z.string().min(3).max(80),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = schema.parse(await request.json());
    const slug = body.slug.trim().toLowerCase();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const service = createServiceClient();
    const amount = await getVendorStoreSetupFeeGhs();

    if (amount <= 0) {
      return NextResponse.json(
        { error: "No setup fee is required — you can create your store for free." },
        { status: 400 },
      );
    }

    const { data: slugTaken } = await service
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugTaken) {
      return NextResponse.json({ error: "This store handle is already taken" }, { status: 400 });
    }

    const reference = generateSetupFeeReference();

    const { error: insertErr } = await service.from("vendor_setup_payments").insert({
      user_id: user.id,
      slug,
      business_name: body.businessName.trim(),
      amount,
      reference,
      status: "pending",
      payment_provider: "paystack",
    });

    if (insertErr) {
      console.error("[setup-fee insert]", insertErr);
      return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to enable store setup payments." },
        { status: 503 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email ?? `vendor@${SITE.domain}`,
        amount: Math.round(amount * 100),
        currency: "GHS",
        reference,
        metadata: {
          type: "vendor_setup",
          user_id: user.id,
          slug,
        },
        channels: ["mobile_money", "card"],
        callback_url: `${siteUrl}/create-store?setup_fee=callback&ref=${encodeURIComponent(reference)}`,
      }),
    });

    const data = await res.json();
    if (!data.status || !data.data?.authorization_url) {
      return NextResponse.json({ error: "Payment provider unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference,
      amount,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[setup-fee initialize]", e);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
