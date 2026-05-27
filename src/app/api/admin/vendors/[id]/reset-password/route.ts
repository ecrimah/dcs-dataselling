import crypto from "crypto";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { smsPasswordReset } from "@/lib/notifications/sms";
import { getVendorNotifyPhone } from "@/lib/payments/wallet";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

function tempPassword() {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: vendor } = await service
    .from("vendors")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const v = vendor as { user_id: string } | null;
  if (!v) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const password = tempPassword();
  const { error } = await service.auth.admin.updateUserById(v.user_id, { password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const phone = await getVendorNotifyPhone(id);
  if (phone) {
    void smsPasswordReset({ phone, tempPassword: password, context: { vendorId: id } });
  }

  return NextResponse.json({
    ok: true,
    tempPassword: password,
    smsSent: Boolean(phone),
    message: phone
      ? "Password reset. New password sent via SMS."
      : "Password reset. Share the temporary password with the agent securely.",
  });
}
