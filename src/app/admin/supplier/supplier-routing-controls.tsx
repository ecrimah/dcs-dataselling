"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { TelecelSupplierMode } from "@/lib/platform/config-types";
import { cn } from "@/lib/utils";

interface Props {
  telecelMode: TelecelSupplierMode | null;
  envDefault: string;
  sbhConfigured: boolean;
}

export function SupplierRoutingControls({ telecelMode, envDefault, sbhConfigured }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const effective =
    telecelMode ?? (envDefault === "successbizhub" ? "successbizhub" : "manual");

  async function setTelecel(mode: TelecelSupplierMode) {
    if (mode === effective && telecelMode === mode) return;
    if (mode === "successbizhub" && !sbhConfigured) {
      toast.error("Set SUCCESSBIZHUB_API_KEY and SUCCESSBIZHUB_OFFER_SLUG_TELECEL first");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/supplier/routing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telecel: mode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update routing");
      toast.success(
        mode === "manual"
          ? "Telecel switched to manual fulfilment"
          : "Telecel switched to Success Biz Hub",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update routing");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-slate-50/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Telecel routing control
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Switch between automated Success Biz Hub and manual fulfilment without redeploying.
        {telecelMode == null && (
          <> Env default: <code>SUPPLIER_FOR_TELECEL={envDefault || "manual"}</code>.</>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <ModeButton
          active={effective === "successbizhub"}
          disabled={pending}
          onClick={() => void setTelecel("successbizhub")}
        >
          {pending && effective !== "successbizhub" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Success Biz Hub (automated)
        </ModeButton>
        <ModeButton
          active={effective === "manual"}
          disabled={pending}
          onClick={() => void setTelecel("manual")}
        >
          {pending && effective !== "manual" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Manual fulfilment
        </ModeButton>
      </div>
      {!sbhConfigured && (
        <p className="mt-2 text-xs text-amber-700">
          Success Biz Hub API key not set — automated mode will fail until configured.
        </p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        active
          ? "border-amber-400/50 bg-amber-50 text-amber-900"
          : "border-border bg-white text-foreground hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
