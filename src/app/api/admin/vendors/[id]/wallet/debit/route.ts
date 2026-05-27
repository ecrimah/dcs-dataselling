import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { smsWalletAdminDebit } from "@/lib/notifications/sms";
import {
  debitVendorWallet,
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

  const reference = generateAdminWalletReference("debit");
  const note = `Admin debit: ${body.note}`;

  const debited = await debitVendorWallet(
    vendorId,
    body.amount,
    reference,
    note,
    "adjustment",
  );

  if (!debited) {
    const wallet = await getOrCreateVendorWallet(vendorId);
    return NextResponse.json(
      {
        error: "Insufficient wallet balance",
        balance: wallet.balance,
        required: body.amount,
      },
      { status: 402 },
    );
  }

  const wallet = await getOrCreateVendorWallet(vendorId);
  const phone = await getVendorNotifyPhone(vendorId);
  if (phone) {
    void smsWalletAdminDebit({
      phone,
      amount: body.amount,
      reference,
      balanceAfter: wallet.balance,
      context: { vendorId, adminId: auth.userId },
    });
  }

  return NextResponse.json({
    ok: true,
    reference,
    balance: wallet.balance,
    smsSent: Boolean(phone),
  });
}
