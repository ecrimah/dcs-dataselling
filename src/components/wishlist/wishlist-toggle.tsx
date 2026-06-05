"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  bundleId: string;
  apiBase: "/api/vendor/wishlist" | "/api/admin/wishlist";
  initialSaved?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function WishlistToggle({
  bundleId,
  apiBase,
  initialSaved = false,
  size = "sm",
  className,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !saved;
    try {
      const res = await fetch(
        next
          ? apiBase
          : `${apiBase}?bundleId=${encodeURIComponent(bundleId)}`,
        {
          method: next ? "POST" : "DELETE",
          headers: next ? { "Content-Type": "application/json" } : undefined,
          body: next ? JSON.stringify({ bundleId }) : undefined,
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not update wishlist");
      setSaved(next);
      toast.success(next ? "Saved to wishlist" : "Removed from wishlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Wishlist update failed");
    } finally {
      setPending(false);
    }
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border transition-colors",
        dim,
        saved
          ? "border-rose-400/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
          : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <Heart className={cn(icon, saved && "fill-current")} />
    </button>
  );
}
