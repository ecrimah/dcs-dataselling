import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.MOOLRE_WEBHOOK_SECRET;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  // TODO: Reconcile transaction, update order status, audit log
  console.info("[moolre] Webhook received:", payload);

  return NextResponse.json({ received: true });
}
