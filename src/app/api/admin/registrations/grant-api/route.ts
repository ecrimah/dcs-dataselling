import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/auth/admin-api";
import { ensureVendorReferralCode } from "@/lib/referrals/vendor-referral";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * Admin action: provision an API-only account for a user who registered but
 * never created a store. This gives them a vendor row (so the admin can then
 * assign a role/tier and they can use the developer API) without requiring a
 * storefront. The account is created already approved since the admin is the
 * one granting it.
 */

const schema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1).max(60).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function POST(request: Request) {
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

  const service = createServiceClient();

  // The user must exist and must not already have a vendor account.
  const { data: profile } = await service
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", body.userId)
    .maybeSingle();
  const p = profile as { id: string; email: string; full_name: string | null } | null;
  if (!p) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: existingVendor } = await service
    .from("vendors")
    .select("id")
    .eq("user_id", body.userId)
    .maybeSingle();
  if (existingVendor) {
    return NextResponse.json(
      { error: "This user already has an account.", vendorId: (existingVendor as { id: string }).id },
      { status: 409 },
    );
  }

  // Derive a name: prefer any intended store name from a setup payment, then
  // the admin-provided name, then the profile name, then the email prefix.
  const { data: setup } = await service
    .from("vendor_setup_payments")
    .select("business_name, slug")
    .eq("user_id", body.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const intended = setup as { business_name: string | null; slug: string | null } | null;

  const businessName =
    body.businessName?.trim() ||
    intended?.business_name?.trim() ||
    p.full_name?.trim() ||
    p.email.split("@")[0];

  const base = slugify(intended?.slug || businessName) || "api";
  const suffix = Math.random().toString(36).slice(2, 6);
  const slug = `${base}-${suffix}`.slice(0, 40);

  const { data: inserted, error: insErr } = await service
    .from("vendors")
    .insert({
      user_id: body.userId,
      slug,
      business_name: businessName,
      api_only: true,
      status: "approved",
      verified: false,
      kyc_status: "not_started",
      tier: "starter",
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    console.error("[grant-api] insert vendor", insErr);
    return NextResponse.json({ error: "Could not create API account" }, { status: 400 });
  }

  const vendorId = (inserted as { id: string }).id;

  // Promote the profile to vendor so they can sign in to the dashboard.
  await service.from("profiles").update({ role: "vendor" }).eq("id", body.userId);

  await ensureVendorReferralCode(vendorId);

  return NextResponse.json({ ok: true, vendorId });
}
