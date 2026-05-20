"use client";

import { useState } from "react";
import { Flame, Sparkles, Zap } from "lucide-react";
import type { Bundle } from "@/types";
import { BundleCard } from "@/components/marketplace/bundle-card";
import { cn } from "@/lib/utils";

interface Props {
  popular: Bundle[];
  bestValue: Bundle[];
  fastest: Bundle[];
}

const TABS = [
  { id: "popular", label: "Most popular", icon: Flame },
  { id: "best-value", label: "Best value", icon: Sparkles },
  { id: "fastest", label: "Fastest delivery", icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function FeaturedBundlesTabs({ popular, bestValue, fastest }: Props) {
  const [active, setActive] = useState<TabId>("popular");

  const map: Record<TabId, Bundle[]> = {
    popular,
    "best-value": bestValue,
    fastest,
  };

  const bundles = map[active];

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
              active === t.id
                ? "border-navy-900 bg-navy-900 text-white shadow"
                : "border-border bg-white text-muted hover:border-navy-900/30 hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {bundles.slice(0, 8).map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} variant="compact" showVendor />
        ))}
      </div>
    </div>
  );
}
