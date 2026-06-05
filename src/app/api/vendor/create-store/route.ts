import { NextResponse } from "next/server";
import {
  getPaidSetupPaymentForUser,
  linkSetupPaymentToVendor,
} from "@/lib/payments/setup-fee";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import {
  attachReferralOnSignup,
  ensureVendorReferralCode,
} from "@/lib/referrals/vendor-referral";
import { tierUpdatesFor } from "@/lib/vendor/tiers";

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const fd = await request.formData();
    const businessName = String(fd.get("businessName") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim();
    const emoji = String(fd.get("emoji") ?? "store");
    const themeColor = String(fd.get("themeColor") ?? "#0A2E5D");
    const whatsapp = String(fd.get("whatsapp") ?? "");
    const momoNumber = String(fd.get("momoNumber") ?? "");
    const momoNetwork = String(fd.get("momoNetwork") ?? "mtn") as "mtn" | "telecel" | "at";
    const referralCode = String(fd.get("referralCode") ?? "");
    const setupFeeReference = String(fd.get("setupFeeReference") ?? "").trim();

    if (businessName.length < 3 || slug.length < 3) {
      return NextResponse.json({ error: "Invalid store details" }, { status: 400 });
    }

    if (!setupFeeReference) {
      return NextResponse.json(
        { error: "Store setup fee payment is required before submitting" },
        { status: 400 },
      );
    }

    const setupPayment = await getPaidSetupPaymentForUser(
      setupFeeReference,
      user.id,
      slug.toLowerCase(),
    );
    if (!setupPayment) {
      return NextResponse.json(
        { error: "Setup fee not paid or does not match this store handle" },
        { status: 402 },
      );
    }

    const { data: vendorId, error: rpcErr } = await supabase.rpc("create_store", {
      p_business_name: businessName,
      p_slug: slug,
      p_emoji: emoji,
      p_theme_color: themeColor,
      p_whatsapp: whatsapp || null,
      p_referral_code: referralCode || null,
    });

    if (rpcErr || !vendorId) {
      const msg =
        rpcErr?.message === "authentication_required"
          ? "Please sign in"
          : "Could not create store. Handle may already be taken.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const service = createServiceClient();
    const tierSettings = await getAgentTierSettings();

    await service
      .from("vendors")
      .update({
        momo_number: momoNumber,
        momo_network: momoNetwork,
        kyc_status: "verified",
        status: "approved",
        verified: true,
        ...tierUpdatesFor("starter", false, tierSettings),
      })
      .eq("id", vendorId);

    await linkSetupPaymentToVendor(setupPayment.id, vendorId as string, setupFeeReference);

    await ensureVendorReferralCode(vendorId as string);
    if (referralCode.trim()) {
      const refResult = await attachReferralOnSignup(vendorId as string, referralCode);
      if (!refResult.ok) {
        console.warn("[create-store] referral:", refResult.error);
      }
    }

    return NextResponse.json({ vendorId, ok: true });
  } catch (e) {
    console.error("[create-store]", e);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
