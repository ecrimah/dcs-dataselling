"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { PlatformConfig } from "@/lib/platform/config-types";

interface Props {
  initialConfig: PlatformConfig;
}

export function PlatformConfigEditor({ initialConfig }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [pending, setPending] = useState(false);

  async function save() {
    if (!Number.isFinite(config.vendorSetupFeeGhs) || config.vendorSetupFeeGhs < 1) {
      toast.error("Setup fee must be at least ₵1");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/platform-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = (await res.json()) as { error?: string; config?: PlatformConfig };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      if (data.config) setConfig(data.config);
      toast.success("Platform settings updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Vendor store setup fee (GHS)"
          hint="One-time fee every new agent pays before their store goes live."
        >
          <input
            type="number"
            min={1}
            step={1}
            value={config.vendorSetupFeeGhs}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                vendorSetupFeeGhs: Number(e.target.value),
              }))
            }
            className="admin-form-field-input"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="susu-btn-gold inline-flex items-center gap-2"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save platform settings
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}
