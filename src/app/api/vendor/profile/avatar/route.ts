import { NextResponse } from "next/server";
import { getVendorApiContext, isVendorApiError } from "@/lib/auth/vendor-api";
import { uploadProfileAvatar } from "@/lib/profile/avatar-upload";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ctx = await getVendorApiContext();
  if (isVendorApiError(ctx)) return ctx;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const result = await uploadProfileAvatar(ctx.userId, file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ avatarUrl: result.avatarUrl });
}
