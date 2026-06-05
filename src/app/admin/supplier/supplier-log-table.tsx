"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

import type { SupplierLogRow } from "@/lib/data/supplier-logs";
import { cn } from "@/lib/utils";

const EVENT_FILTERS = [
  "all",
  "submit_single",
  "submit_bulk",
  "webhook",
  "status_poll",
  "ping",
] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];

export function SupplierLogTable({ logs }: { logs: SupplierLogRow[] }) {
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (eventFilter !== "all" && log.eventType !== eventFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (log.reference ?? "").toLowerCase().includes(q) ||
        (log.supplierReference ?? "").toLowerCase().includes(q) ||
        (log.error ?? "").toLowerCase().includes(q) ||
        (log.scope ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, eventFilter, search]);

  return (
    <div className="admin-data-table overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by reference, supplier reference, scope, or error…"
            className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {EVENT_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setEventFilter(s)}
              className={cn(
                "admin-filter-chip rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                eventFilter === s && "is-active",
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">
          {logs.length === 0
            ? "No supplier events logged yet."
            : "No events match your filters."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((log) => {
            const isOpen = expanded === log.id;
            return (
              <li key={log.id} className="admin-log-row">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="admin-log-row-trigger flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      log.ok === true
                        ? "admin-status-sent"
                        : log.ok === false
                          ? "admin-status-failed"
                          : "admin-status-neutral",
                    )}
                  >
                    {log.ok === true ? "ok" : log.ok === false ? "fail" : "info"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-mono text-xs font-bold text-cyan-700">
                        {log.eventType}
                      </span>
                      {log.reference && (
                        <span className="admin-log-ref text-xs font-bold">{log.reference}</span>
                      )}
                      {log.supplierReference && (
                        <span className="text-[11px] text-muted">→ {log.supplierReference}</span>
                      )}
                      {log.httpStatus != null && (
                        <span className="text-[11px] text-muted">HTTP {log.httpStatus}</span>
                      )}
                    </div>
                    {log.error && (
                      <p className="mt-0.5 truncate text-xs text-red-600">{log.error}</p>
                    )}
                  </div>
                  <span className="hidden shrink-0 text-[11px] text-muted sm:block">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  )}
                </button>
                {isOpen && (
                  <div className="admin-log-row-detail space-y-3 border-t border-border px-4 py-3 text-xs">
                    <DetailRow label="Time" value={new Date(log.createdAt).toLocaleString()} />
                    <DetailRow label="Supplier" value={log.supplier} />
                    {log.scope && <DetailRow label="Scope" value={log.scope} />}
                    {log.requestPayload != null && (
                      <Json label="Request" value={log.requestPayload} />
                    )}
                    {log.responsePayload != null && (
                      <Json label="Response" value={log.responsePayload} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function Json({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <pre className="admin-log-code-block mt-1 max-h-56 overflow-auto rounded-lg p-2 font-mono text-[11px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
