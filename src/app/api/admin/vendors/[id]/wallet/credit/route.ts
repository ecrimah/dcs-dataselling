import { NextResponse, after } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { smsWalletAdminCredit } from "@/lib/notifications/sms";
import {
  creditVendorWallet,
  generateAdminWalletReference,
  getOrCreateVendorWallet,
  getVendorNotifyPhone,
} from "@/lib/payments/wallet";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  amount: z.number().positive().max(50000),
  note: z.string().min(2).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: vendorId } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid amount or note" }, { status: 400 });
  }

  const reference = generateAdminWalletReference("credit");
  const note = `Admin credit: ${body.note}`;

  await creditVendorWallet(vendorId, body.amount, "adjustment", reference, note);
  const wallet = await getOrCreateVendorWallet(vendorId);

  const phone = await getVendorNotifyPhone(vendorId);
  if (phone) {
    after(() =>
      smsWalletAdminCredit({
        phone,
        amount: body.amount,
        reference,
        balanceAfter: wallet.balance,
        context: { vendorId, adminId: auth.userId },
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    reference,
    balance: wallet.balance,
    smsSent: Boolean(phone),
  });
}
