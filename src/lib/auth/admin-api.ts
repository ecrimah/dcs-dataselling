import "server-only";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function assertAdminApi() {
  if (!hasSupabaseConfig()) return { ok: false as const, status: 503, error: "Not configured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "ops"].includes(profile.role as string)) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  return { ok: true as const, userId: user.id };
}
