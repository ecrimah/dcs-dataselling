import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2).max(80),
  phone: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Authentication not configured" }, { status: 503 });
    }

    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const supabase = await createClient();
    const {
      data: { user: existing },
    } = await supabase.auth.getUser();

    if (existing) {
      const service = createServiceClient();
      const { data: vendor } = await service
        .from("vendors")
        .select("id")
        .eq("user_id", existing.id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        email: existing.email,
        alreadySignedIn: true,
        hasVendor: Boolean(vendor),
      });
    }

    const service = createServiceClient();
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName.trim(),
        phone: body.phone?.trim() || null,
      },
    });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return NextResponse.json(
          { error: "This email is already registered. Sign in to continue." },
          { status: 409 },
        );
      }
      console.error("[vendor register createUser]", createErr);
      return NextResponse.json({ error: "Could not create account" }, { status: 400 });
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (signInErr) {
      console.error("[vendor register signIn]", signInErr);
      return NextResponse.json(
        { error: "Account created but sign-in failed. Try signing in at /auth/login." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      userId: created.user.id,
      alreadySignedIn: false,
      hasVendor: false,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid registration details" },
        { status: 400 },
      );
    }
    console.error("[vendor register]", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
