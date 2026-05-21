"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Store } from "lucide-react";
import { parseVendorStoreSlug } from "@/lib/vendor-slug";
import { cn } from "@/lib/utils";

interface VendorStoreEntryProps {
  variant?: "hero" | "page";
  className?: string;
}

export function VendorStoreEntry({ variant = "hero", className }: VendorStoreEntryProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const isHero = variant === "hero";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const slug = parseVendorStoreSlug(value);
    if (!slug || slug.length < 2) {
      setError("Enter your agent's store name or link");
      return;
    }
    setError("");
    router.push(`/vendor/${slug}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "overflow-hidden rounded-2xl border shadow-2xl",
        isHero
          ? "border-white/15"
          : "border-border bg-white shadow-lg shadow-royal/5",
        className,
      )}
      style={
        isHero
          ? {
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-3 py-2.5",
          isHero ? "border-white/10" : "border-border bg-surface-soft/60",
        )}
      >
        <Store
          className={cn("h-4 w-4 shrink-0", isHero ? "text-gold-glow" : "text-gold-dark")}
        />
        <p
          className={cn(
            "text-xs font-bold",
            isHero ? "text-white" : "text-foreground",
          )}
        >
          Open your agent&apos;s store
        </p>
      </div>

      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition-shadow focus-within:ring-gold/50",
            isHero
              ? "bg-black/30 ring-white/10"
              : "bg-surface-soft ring-border",
          )}
        >
          <Link2
            className={cn(
              "h-4 w-4 shrink-0",
              isHero ? "text-gold-glow" : "text-muted",
            )}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. mystore or dcselite.com/vendor/mystore"
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm font-medium focus:outline-none",
              isHero
                ? "text-white placeholder:text-slate-500"
                : "text-foreground placeholder:text-muted-soft",
            )}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white transition-all hover:brightness-105"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #F4D160 100%)",
            }}
          >
            Go
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {error ? (
          <p className="mt-2 text-[11px] font-medium text-red-400">{error}</p>
        ) : (
          <p
            className={cn(
              "mt-2 text-[11px]",
              isHero ? "text-slate-400" : "text-muted",
            )}
          >
            Use the store link your agent shared on WhatsApp or social media.
          </p>
        )}
      </div>
    </form>
  );
}
