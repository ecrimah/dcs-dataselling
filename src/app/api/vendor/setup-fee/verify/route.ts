import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPaidSetupPaymentForUser,
  verifySetupPaymentWithPaystack,
} from "@/lib/payments/setup-fee";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  reference: z.string().min(8),
  slug: z.string().min(3),
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

    let paid = await getPaidSetupPaymentForUser(body.reference, user.id, slug);

    if (!paid) {
      const service = createServiceClient();
      const { data: row } = await service
        .from("vendor_setup_payments")
        .select("id, status")
        .eq("reference", body.reference)
        .eq("user_id", user.id)
        .eq("slug", slug)
        .maybeSingle();

      if (!row) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (row.status === "pending") {
        const ok = await verifySetupPaymentWithPaystack(body.reference);
        if (!ok) {
          return NextResponse.json({ error: "Payment not completed yet" }, { status: 402 });
        }
        paid = await getPaidSetupPaymentForUser(body.reference, user.id, slug);
      }
    }

    if (!paid) {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    return NextResponse.json({
      ok: true,
      reference: paid.reference,
      amount: paid.amount,
      paidAt: paid.paid_at,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[setup-fee verify]", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
