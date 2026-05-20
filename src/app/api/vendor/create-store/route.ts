import { NextResponse } from "next/server";
import {
  getPaidSetupPaymentForUser,
  linkSetupPaymentToVendor,
} from "@/lib/payments/setup-fee";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

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
    const themeColor = String(fd.get("themeColor") ?? "#06b6d4");
    const whatsapp = String(fd.get("whatsapp") ?? "");
    const ghanaCardNumber = String(fd.get("ghanaCardNumber") ?? "");
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

    const front = fd.get("ghanaCardFront") as File | null;
    const back = fd.get("ghanaCardBack") as File | null;
    const selfie = fd.get("selfie") as File | null;
    if (!front || !back || !selfie) {
      return NextResponse.json({ error: "All KYC documents required" }, { status: 400 });
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

    await service
      .from("vendors")
      .update({
        momo_number: momoNumber,
        momo_network: momoNetwork,
        compliance_notes: `Ghana Card: ${ghanaCardNumber}`,
      })
      .eq("id", vendorId);

    const uploads: Array<{ doc_type: string; file: File }> = [
      { doc_type: "ghana_card_front", file: front },
      { doc_type: "ghana_card_back", file: back },
      { doc_type: "selfie", file: selfie },
    ];

    for (const u of uploads) {
      const ext = (u.file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${vendorId}/${u.doc_type}-${Date.now()}.${ext}`;
      const buf = Buffer.from(await u.file.arrayBuffer());
      const { error: upErr } = await service.storage
        .from("kyc-documents")
        .upload(path, buf, { contentType: u.file.type, upsert: true });
      if (upErr) {
        console.error("[storage]", upErr);
        continue;
      }
      await service.from("kyc_documents").upsert({
        vendor_id: vendorId,
        doc_type: u.doc_type,
        storage_path: path,
      });
    }

    await supabase.rpc("submit_kyc");

    await linkSetupPaymentToVendor(setupPayment.id, vendorId as string, setupFeeReference);

    return NextResponse.json({ vendorId, ok: true });
  } catch (e) {
    console.error("[create-store]", e);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
