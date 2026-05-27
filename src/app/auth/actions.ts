"use server";

import { redirect } from "next/navigation";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getPostLoginRedirect } from "@/lib/auth/onboarding";
import type { UserRole } from "@/types";

export type AuthActionState = {
  error?: string;
};

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!hasSupabaseConfig()) {
    return { error: "Authentication is not configured." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "Invalid email or password." : error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign-in failed after authentication." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole | undefined) ?? "customer";
  redirect(await getPostLoginRedirect(user.id, role));
}

export async function signOut() {
  if (!hasSupabaseConfig()) {
    redirect("/");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
