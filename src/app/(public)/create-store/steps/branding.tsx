"use client";

import { SITE } from "@/lib/constants";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { StoreIcon } from "@/components/vendor/store-icon";
import { StoreIconPicker } from "@/components/vendor/store-icon-picker";
import { ThemeGradientPicker } from "@/components/vendor/theme-gradient-picker";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
}

export function StepBranding({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Make it yours</h2>
        <p className="mt-1 text-sm text-muted">
          Pick a solid colour or gradient theme, plus an icon for your storefront.
        </p>
      </div>

      <div
        className="flex items-center gap-4 rounded-2xl p-5 text-white shadow-md"
        style={{ background: resolveThemeBackground(form.themeColor) }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }}
        >
          <StoreIcon icon={form.emoji} size={28} strokeWidth={1.75} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{form.businessName || "Your Store"}</p>
          <p className="truncate text-xs text-white/85">
            {SITE.url.replace(/^https?:\/\//, "")}/vendor/{form.slug || "handle"}
          </p>
        </div>
      </div>

      <ThemeGradientPicker
        value={form.themeColor}
        onChange={(themeColor) => update("themeColor", themeColor)}
      />

      <StoreIconPicker
        value={form.emoji}
        themeColor={form.themeColor}
        onChange={(emoji) => update("emoji", emoji)}
      />
    </div>
  );
}
