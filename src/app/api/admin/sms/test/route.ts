import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth/admin-api";
import {
  isArkeselConfigured,
  normalizeArkeselPhone,
  sendArkeselSms,
} from "@/lib/notifications/arkesel";
import { SITE } from "@/lib/constants";

const schema = z.object({
  phone: z.string().min(9).max(20),
  message: z.string().min(1).max(160).optional(),
});

export async function POST(request: Request) {
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

  if (!isArkeselConfigured()) {
    return NextResponse.json(
      { error: "ARKESEL_API_KEY and ARKESEL_SENDER_ID not set" },
      { status: 503 },
    );
  }

  const normalized = normalizeArkeselPhone(body.phone);
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid Ghana phone — use 0XXXXXXXXX or 233XXXXXXXXX" },
      { status: 400 },
    );
  }

  const message =
    body.message?.trim() ||
    `${SITE.name}: Test SMS from admin debugger at ${new Date().toLocaleTimeString("en-GH")}.`;

  const result = await sendArkeselSms([normalized], message, {
    template: "admin_test",
    triggeredBy: auth.userId,
    context: { source: "sms_debugger" },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "error" in result ? result.error : "SMS not sent",
        skipped: "skipped" in result ? result.skipped : false,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, recipient: normalized, message });
}
