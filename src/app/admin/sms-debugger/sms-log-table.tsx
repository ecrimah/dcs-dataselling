"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import type { SmsLogRow } from "@/lib/data/sms-logs";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "sent", "failed", "skipped"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_STYLES: Record<SmsLogRow["status"], string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-amber-100 text-amber-700",
};

export function SmsLogTable({ logs }: { logs: SmsLogRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        log.recipient.toLowerCase().includes(q) ||
        log.template.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        (log.error ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, statusFilter, search]);

  return (
    <div className="admin-data-table overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border p-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by phone, template, message, or error…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                statusFilter === s
                  ? "bg-navy-900 text-white"
                  : "bg-slate-100 text-muted hover:bg-slate-200",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">
          {logs.length === 0
            ? "No SMS messages logged yet."
            : "No messages match your filters."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((log) => {
            const isOpen = expanded === log.id;
            return (
              <li key={log.id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      STATUS_STYLES[log.status],
                    )}
                  >
                    {log.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="num text-sm font-bold text-foreground">
                        {log.recipient}
                      </span>
                      <span className="font-mono text-[11px] text-cyan-700">
                        {log.template}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">{log.message}</p>
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
                  <div className="space-y-2 border-t border-border bg-slate-50 px-4 py-3 text-xs">
                    <DetailRow label="Sent" value={new Date(log.createdAt).toLocaleString()} />
                    <DetailRow label="Provider" value={log.provider} />
                    <DetailRow
                      label="Triggered by"
                      value={log.triggeredByEmail ?? "system"}
                    />
                    {log.error && (
                      <DetailRow
                        label="Error"
                        value={log.error}
                        valueClass="text-red-600"
                      />
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Message
                      </p>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2 text-foreground">
                        {log.message}
                      </p>
                    </div>
                    {log.context && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          Context
                        </p>
                        <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-2 font-mono text-[11px] text-foreground">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </div>
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

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className={cn("text-right font-medium text-foreground", valueClass)}>
        {value}
      </span>
    </div>
  );
}
