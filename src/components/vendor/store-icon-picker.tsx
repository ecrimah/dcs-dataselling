"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VENDOR_STORE_ICON_CATEGORIES,
  VENDOR_STORE_ICONS,
  filterVendorStoreIcons,
  type VendorStoreIconCategory,
} from "@/lib/vendor-store-icons";
import { resolveThemeBackground } from "@/lib/vendor-theme";

interface StoreIconPickerProps {
  value: string;
  themeColor: string;
  onChange: (iconId: string) => void;
}

export function StoreIconPicker({ value, themeColor, onChange }: StoreIconPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VendorStoreIconCategory | "all">("all");

  const icons = useMemo(() => filterVendorStoreIcons(query, category), [query, category]);
  const selectedMeta = VENDOR_STORE_ICONS.find((i) => i.id === value);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">
          Store icon
          <span className="ml-2 font-normal text-muted">
            {VENDOR_STORE_ICONS.length} options
            {selectedMeta ? ` · ${selectedMeta.label}` : ""}
          </span>
        </p>
        <div className="relative w-full sm:max-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-3 text-xs outline-none ring-cyan-500/0 transition-shadow focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VENDOR_STORE_ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
              category === cat.id
                ? "bg-navy-900 text-white"
                : "bg-slate-100 text-muted hover:bg-slate-200 hover:text-foreground",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border bg-slate-50/50 p-2 sm:max-h-[320px]">
        {icons.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No icons match your search.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {icons.map(({ id, label, icon: Icon }) => {
              const selected = value === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange(id)}
                  title={label}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 transition-all",
                    selected
                      ? "border-cyan-500/40 bg-white ring-2 ring-cyan-500"
                      : "border-transparent bg-white hover:border-slate-200 hover:shadow-sm",
                  )}
                  aria-label={label}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      selected
                        ? "text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                    )}
                    style={
                      selected ? { background: resolveThemeBackground(themeColor) } : undefined
                    }
                  >
                    <Icon size={18} strokeWidth={2} aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "max-w-full truncate text-[9px] font-medium leading-none",
                      selected ? "text-cyan-700" : "text-muted",
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
