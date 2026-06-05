"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  ClipboardList,
  ClipboardPaste,
  Download,
  MoreHorizontal,
  RefreshCw,
  Search,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminSection,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminOrderBoardRow } from "@/lib/data/admin-orders-board";
import { downloadOrdersCsv } from "@/lib/admin/orders-export";
import { buildBulkExcelClipboard, dataMbToVolumeGb } from "@/lib/wholesale/bulk-format";
import { formatGHS, formatPhone } from "@/lib/format";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "default"> = {
  fulfilled: "success",
  paid: "default",
  queued: "warning",
  processing: "warning",
  pending: "neutral",
  failed: "danger",
  refunded: "danger",
};

const FILTER_STATUS = [
  { value: "all", label: "All statuses" },
  { value: "queued", label: "Queued (Q)" },
  { value: "processing", label: "Processing" },
  { value: "fulfilled", label: "Delivered" },
  { value: "failed", label: "Undelivered" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
] as const;

const FILTER_KIND = [
  { value: "all", label: "All order types" },
  { value: "wholesale", label: "Agent wholesale lines" },
  { value: "customer", label: "Storefront orders" },
] as const;

const WHOLESALE_BULK_STATUS = [
  { value: "queued", label: "Set to queued" },
  { value: "processing", label: "Set to processing" },
  { value: "fulfilled", label: "Mark delivered" },
  { value: "failed", label: "Mark undelivered" },
] as const;

const CUSTOMER_BULK_STATUS = [
  { value: "queued", label: "Set to queued" },
  { value: "processing", label: "Set to processing" },
  { value: "fulfilled", label: "Mark delivered" },
  { value: "failed", label: "Mark failed" },
  { value: "refunded", label: "Refund" },
] as const;

function rowKey(row: AdminOrderBoardRow) {
  return `${row.kind}:${row.id}`;
}

function shortOrderCode(code: string) {
  const tail = code.split("-").pop();
  if (tail && tail.length <= 10) return tail;
  return code.length > 10 ? `…${code.slice(-8)}` : code;
}

function channelLabel(row: AdminOrderBoardRow) {
  const type = row.orderType === "wholesale" ? "WS" : row.orderType === "bulk" ? "Bulk" : "Store";
  const pay = row.paymentMethod === "wallet" ? "Wallet" : row.paymentMethod;
  return `${type} · ${pay}`;
}

interface Props {
  rows: AdminOrderBoardRow[];
  initialStatus: string;
  initialKind: string;
  initialQ: string;
}

export function AdminOrdersBoard({ rows, initialStatus, initialKind, initialQ }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(initialQ);
  const [bulkStatus, setBulkStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [actionOpen, setActionOpen] = useState<string | null>(null);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(rowKey(r))),
    [rows, selected],
  );

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  const wholesaleSelected = selectedRows.some((r) => r.kind === "wholesale_item");
  const customerSelected = selectedRows.some((r) => r.kind === "customer");
  const mixedKinds = wholesaleSelected && customerSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map(rowKey)));
    }
  }

  function toggleRow(row: AdminOrderBoardRow) {
    const key = rowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function applyFilters(status: string, kind: string, q: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (kind && kind !== "all") params.set("kind", kind);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  }

  async function runBulkStatus(status: string, targetRows: AdminOrderBoardRow[]) {
    if (!status || targetRows.length === 0) return;

    const byKind = {
      wholesale_item: targetRows.filter((r) => r.kind === "wholesale_item"),
      customer: targetRows.filter((r) => r.kind === "customer"),
    };

    setPending(true);
    try {
      let totalUpdated = 0;
      for (const kind of ["wholesale_item", "customer"] as const) {
        const group = byKind[kind];
        if (group.length === 0) continue;
        const res = await fetch("/api/admin/orders/bulk-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, ids: group.map((r) => r.id), status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Bulk update failed");
        totalUpdated += Number(data.updated ?? 0);
        if (data.failed > 0) {
          toast.warning(`${data.failed} row(s) could not be updated`);
        }
      }
      toast.success(`Updated ${totalUpdated} order(s)`);
      setSelected(new Set());
      setBulkStatus("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setPending(false);
    }
  }

  function exportRows() {
    return selectedRows.length > 0 ? selectedRows : rows;
  }

  function handleExport() {
    const target = exportRows();
    if (target.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const stamp = format(new Date(), "yyyy-MM-dd-HHmm");
    downloadOrdersCsv(target, `dcs-orders-${stamp}.csv`);
    toast.success(
      `Exported ${target.length} row(s) — Number + Volume columns ready for bulk paste`,
    );
  }

  async function handleCopyForPaste() {
    const target = exportRows();
    if (target.length === 0) {
      toast.error("No orders to copy");
      return;
    }
    const clipboard = buildBulkExcelClipboard(
      target.map((r) => ({
        phone: r.beneficiary,
        volumeGb: dataMbToVolumeGb(r.dataMb),
      })),
    );
    if (!clipboard) {
      toast.error("Selected rows have no phone or volume");
      return;
    }
    const rowCount = clipboard.split("\n").length - 1;
    try {
      await navigator.clipboard.writeText(clipboard);
      toast.success(
        `Copied ${rowCount} row(s) — paste into Excel (Number + Volume columns)`,
      );
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  async function rowAction(row: AdminOrderBoardRow, status: string) {
    setActionOpen(null);
    await runBulkStatus(status, [row]);
  }

  const bulkOptions =
    mixedKinds || wholesaleSelected
      ? WHOLESALE_BULK_STATUS
      : customerSelected
        ? CUSTOMER_BULK_STATUS
        : WHOLESALE_BULK_STATUS;

  return (
    <AdminSection
      title="Order board"
      description="Copy for paste lands in Excel as Number + Volume columns, or export CSV when the API is down."
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-lg border border-border px-3 text-sm"
            value={initialStatus}
            onChange={(e) => applyFilters(e.target.value, initialKind, search)}
          >
            {FILTER_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-border px-3 text-sm"
            value={initialKind}
            onChange={(e) => applyFilters(initialStatus, e.target.value, search)}
          >
            {FILTER_KIND.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <form
            className="flex min-w-[200px] flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters(initialStatus, initialKind, search);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder="Search code, phone, agent…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Filter
            </Button>
          </form>
        </div>

        <div className="admin-action-bar flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
            onClick={toggleAll}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-amber-400" />
            ) : (
              <Square className="h-4 w-4 text-white/55" />
            )}
            {allSelected ? "Unmark all" : "Mark all"}
          </button>
          <span className="text-xs text-muted-foreground">
            {someSelected ? `${selected.size} selected` : `${rows.length} rows`}
          </span>
          {mixedKinds && (
            <span className="text-xs text-amber-700">
              Select only wholesale or only storefront rows for bulk status
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded-lg border border-border px-2 text-sm disabled:opacity-50"
              value={bulkStatus}
              disabled={!someSelected || mixedKinds || pending}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Bulk action…</option>
              {bulkOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!bulkStatus || !someSelected || mixedKinds || pending}
              onClick={() => void runBulkStatus(bulkStatus, selectedRows)}
            >
              <RefreshCw className={cn("mr-1 h-3.5 w-3.5", pending && "animate-spin")} />
              Update status
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={rows.length === 0}
              onClick={() => void handleCopyForPaste()}
            >
              <ClipboardPaste className="mr-1 h-3.5 w-3.5" />
              Copy for Excel
            </Button>
            <Button size="sm" variant="secondary" disabled={rows.length === 0} onClick={handleExport}>
              <Download className="mr-1 h-3.5 w-3.5" />
              Export bulk CSV
            </Button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="No orders match this filter"
          description="Try another status or clear filters to see recent agent and storefront orders."
        />
      ) : (
        <AdminDataTable fluid>
          <AdminTableHead>
            <AdminTh className="w-8">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-border"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Mark all"
              />
            </AdminTh>
            <AdminTh>Phone</AdminTh>
            <AdminTh>Package</AdminTh>
            <AdminTh>Price</AdminTh>
            <AdminTh>Code</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="w-8">···</AdminTh>
          </AdminTableHead>
          <AdminTableBody>
            {rows.map((row) => {
              const key = rowKey(row);
              const isSelected = selected.has(key);
              return (
                <AdminTr key={key} className={isSelected ? "bg-amber-50/50" : undefined}>
                  <AdminTd>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-border"
                      checked={isSelected}
                      onChange={() => toggleRow(row)}
                      aria-label={`Select ${row.orderCode}`}
                    />
                  </AdminTd>
                  <AdminTd className="num" title={formatPhone(row.beneficiary)}>
                    {formatPhone(row.beneficiary)}
                  </AdminTd>
                  <AdminTd title={`${row.packageName} · ${row.dataVolume}`}>
                    <span className="block truncate">{row.packageName}</span>
                  </AdminTd>
                  <AdminTd className="num font-medium">{formatGHS(row.price)}</AdminTd>
                  <AdminTd
                    className="font-mono font-semibold"
                    title={row.orderCode}
                  >
                    {shortOrderCode(row.orderCode)}
                  </AdminTd>
                  <AdminTd>
                    <Badge
                      variant={STATUS_VARIANT[row.orderStatus] ?? "default"}
                      className="max-w-full truncate text-[10px]"
                    >
                      {row.orderStatus}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="relative !overflow-visible">
                    <button
                      type="button"
                      className="rounded-lg p-1 hover:bg-slate-100"
                      aria-label="Actions"
                      onClick={() => setActionOpen(actionOpen === key ? null : key)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {actionOpen === key && (
                      <div
                        className="absolute right-0 top-full z-20 w-72 rounded-lg border border-slate-200 py-1 shadow-lg"
                        style={{ backgroundColor: "#ffffff", color: "#334155" }}
                      >
                        <div className="space-y-1 border-b border-slate-200 px-3 py-2 text-[11px]">
                          <p>
                            <span className="font-semibold text-slate-800">Ordered:</span>{" "}
                            {format(new Date(row.orderedAt), "yyyy-MM-dd HH:mm")}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Agent:</span>{" "}
                            {row.agentSlug ? `${row.agentName} (@${row.agentSlug})` : row.agentName}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Channel:</span>{" "}
                            {channelLabel(row)}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Code:</span>{" "}
                            <span className="font-mono">{row.orderCode}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Ref:</span>{" "}
                            <span className="font-mono">{row.orderReference}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Data:</span> {row.dataVolume}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Pay:</span>{" "}
                            {row.paymentStatus}
                            {row.commission != null ? ` · ${formatGHS(row.commission)} fee` : ""}
                          </p>
                          {(row.apiStatus || row.apiSource || row.apiReference) && (
                            <p>
                              <span className="font-semibold text-slate-800">API:</span>{" "}
                              {[row.apiStatus, row.apiSource, row.apiReference].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        {(row.kind === "wholesale_item"
                          ? WHOLESALE_BULK_STATUS
                          : CUSTOMER_BULK_STATUS
                        ).map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                            disabled={pending}
                            onClick={() => void rowAction(row, o.value)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </AdminTd>
                </AdminTr>
              );
            })}
          </AdminTableBody>
        </AdminDataTable>
      )}
    </AdminSection>
  );
}
