"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TIER_CONFIG, VENDOR_TIERS } from "@/lib/vendor/tiers";
import type { AgentTierPricing } from "@/lib/vendor/tier-settings-types";
import type { VendorStatus, VendorTier } from "@/types";

interface VendorActionsProps {
  vendorId: string;
  slug: string;
  status: VendorStatus;
  featured: boolean;
  tier: VendorTier;
  tierManual: boolean;
  tierLabels?: Record<VendorTier, AgentTierPricing>;
}

export function VendorActions({
  vendorId,
  slug,
  status,
  featured,
  tier,
  tierManual,
  tierLabels,
}: VendorActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  function tierLabel(id: VendorTier) {
    return tierLabels?.[id]?.label ?? TIER_CONFIG[id].label;
  }

  async function patch(payload: Record<string, unknown>, label: string) {
    setPending(label);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(label);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/vendor/${slug}`}
        target="_blank"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
      >
        <ExternalLink className="h-3 w-3" />
        Store
      </Link>
      <select
        value={tier}
        disabled={pending !== null}
        onChange={(e) => {
          const next = e.target.value as VendorTier;
          if (next === tier) return;
          patch({ tier: next }, `Role set to ${tierLabel(next)}`);
        }}
        title={tierManual ? "Manually assigned by admin" : "Auto tier eligible"}
        className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800"
      >
        {VENDOR_TIERS.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>
      {status !== "approved" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => patch({ status: "approved" }, "Vendor approved")}
        >
          {pending === "Vendor approved" ? "…" : "Approve"}
        </Button>
      )}
      {status === "approved" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending !== null}
          onClick={() => patch({ status: "suspended" }, "Vendor suspended")}
        >
          Suspend
        </Button>
      )}
      {status !== "rejected" && status !== "approved" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending !== null}
          onClick={() => patch({ status: "rejected" }, "Vendor rejected")}
        >
          Reject
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending !== null}
        onClick={() => patch({ featured: !featured }, featured ? "Unfeatured" : "Featured")}
        title={featured ? "Remove featured" : "Mark featured"}
      >
        <Star className={`h-3.5 w-3.5 ${featured ? "fill-amber-400 text-amber-400" : ""}`} />
      </Button>
    </div>
  );
}
