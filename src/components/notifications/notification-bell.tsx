"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  iconLetter: string;
}

interface Props {
  apiUrl: string;
  /** light = admin/agent dark topbar; dark = light header */
  variant?: "dark" | "light";
}

export function NotificationBell({ apiUrl, variant = "dark" }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setTotal(Number(data.newCount ?? data.total ?? 0));
    } catch {
      /* ignore */
    }
  }, [apiUrl]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const btnClass =
    variant === "dark"
      ? "relative rounded-lg p-1.5 text-white/55 hover:bg-white/5"
      : "relative rounded-xl p-2.5 hover:bg-slate-100";

  const panelClass =
    variant === "dark"
      ? "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl"
      : "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-white shadow-xl";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={btnClass}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className={panelClass}>
          <div
            className={cn(
              "flex items-center justify-between border-b px-4 py-3",
              variant === "dark" ? "border-white/10" : "border-border",
            )}
          >
            <h3
              className={cn(
                "text-sm font-bold",
                variant === "dark" ? "text-white" : "text-foreground",
              )}
            >
              Notifications
            </h3>
            {total > 0 && (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                {total} New
              </span>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-muted">No alerts right now</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors",
                      variant === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        variant === "dark"
                          ? "bg-white/10 text-white/70"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {n.iconLetter.length > 3 ? "AFA" : n.iconLetter}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-xs font-bold leading-snug",
                          variant === "dark" ? "text-white" : "text-foreground",
                        )}
                      >
                        {n.title}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] leading-relaxed",
                          variant === "dark" ? "text-white/45" : "text-muted",
                        )}
                      >
                        {n.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
