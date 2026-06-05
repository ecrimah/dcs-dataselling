import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { uploadProfileAvatar } from "@/lib/profile/avatar-upload";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const auth = await assertAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const result = await uploadProfileAvatar(auth.userId, file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ avatarUrl: result.avatarUrl });
}
