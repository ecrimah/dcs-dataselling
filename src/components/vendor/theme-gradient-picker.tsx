"use client";

import { useMemo, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VENDOR_THEME_GRADIENTS,
  VENDOR_THEME_SOLIDS,
  buildCustomGradient,
  getGradientPreset,
  isThemeGradient,
  parseCustomGradient,
} from "@/lib/vendor-theme";

interface ThemeGradientPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ThemeGradientPicker({ value, onChange }: ThemeGradientPickerProps) {
  const preset = getGradientPreset(value);
  const parsedCustom = parseCustomGradient(value);
  const isCustom = isThemeGradient(value) && !preset;

  const [customFrom, setCustomFrom] = useState(parsedCustom?.from ?? "#06b6d4");
  const [customTo, setCustomTo] = useState(parsedCustom?.to ?? "#8b5cf6");

  const customPreview = useMemo(
    () => buildCustomGradient(customFrom, customTo),
    [customFrom, customTo],
  );

  function applyCustom() {
    onChange(buildCustomGradient(customFrom, customTo));
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-medium">Solid colours</p>
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
          {VENDOR_THEME_SOLIDS.map((c) => {
            const selected = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                className={cn(
                  "relative h-11 rounded-xl transition-all",
                  selected
                    ? "ring-2 ring-foreground ring-offset-2"
                    : "ring-1 ring-black/5 hover:ring-black/15",
                )}
                style={{
                  background: c.id,
                  boxShadow: selected
                    ? "0 4px 12px rgba(0,0,0,0.12)"
                    : "inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
                aria-label={c.name}
                aria-pressed={selected}
              >
                {selected && (
                  <Check
                    className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Gradient themes</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VENDOR_THEME_GRADIENTS.map((g) => {
            const selected = value === g.css;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange(g.css)}
                className={cn(
                  "relative flex h-12 items-end overflow-hidden rounded-xl p-2 text-left transition-all",
                  selected
                    ? "ring-2 ring-foreground ring-offset-2"
                    : "ring-1 ring-black/5 hover:ring-black/15",
                )}
                style={{ background: g.css }}
                aria-label={g.name}
                aria-pressed={selected}
              >
                <span className="text-[10px] font-semibold text-white drop-shadow-md">{g.name}</span>
                {selected && (
                  <Check
                    className="absolute right-2 top-2 h-3.5 w-3.5 text-white drop-shadow"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-slate-50/80 p-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-cyan-600" />
          <p className="text-sm font-medium">Custom gradient</p>
        </div>
        <p className="mt-1 text-xs text-muted">Blend two colours for a unique storefront look.</p>

        <div
          className="mt-3 h-12 rounded-xl ring-1 ring-black/5"
          style={{ background: isCustom ? value : customPreview }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            From
            <input
              type="color"
              value={isCustom ? parsedCustom?.from ?? customFrom : customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-white p-0.5"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            To
            <input
              type="color"
              value={isCustom ? parsedCustom?.to ?? customTo : customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-white p-0.5"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
              isCustom
                ? "bg-cyan-600 text-white"
                : "bg-white text-foreground ring-1 ring-border hover:bg-slate-100",
            )}
          >
            {isCustom ? "Selected" : "Apply gradient"}
          </button>
        </div>
      </div>
    </div>
  );
}
