"use client";

import { useRef, useState } from "react";
import {
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BULK_NETWORK_OPTIONS,
  BULK_ORDER_TEMPLATE_CSV,
  type BulkNetworkKey,
} from "@/lib/wholesale/bulk-parse";

type BulkInputMode = "paste" | "upload";

interface PreviewState {
  validCount: number;
  invalidCount: number;
  totalAmount: number;
  rows: {
    row: number;
    phone: string;
    sku?: string;
    bundleName?: string;
    sizeLabel?: string;
    quantity: number;
    lineTotal: number;
    error?: string;
  }[];
}

interface Props {
  balance: number;
  onBalanceChange: (balance: number) => void;
  onNeedTopup: () => void;
}

export function BulkOrdersPanel({ balance, onBalanceChange, onNeedTopup }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<BulkInputMode>("paste");
  const [networkKey, setNetworkKey] = useState<BulkNetworkKey | "">("");
  const [pasteText, setPasteText] = useState(
    "0241234567 10\n0551234567 20\n0201234567 5",
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordersPayload, setOrdersPayload] = useState("");

  function downloadTemplate() {
    const blob = new Blob([BULK_ORDER_TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcs-bulk-orders-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }

  async function readFile(file: File): Promise<string> {
    const text = await file.text();
    return text;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!networkKey) {
      toast.error("Select a network first");
      e.target.value = "";
      return;
    }
    try {
      const text = await readFile(file);
      setOrdersPayload(text);
      setPasteText(text);
      setPreview(null);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Could not read file");
    }
    e.target.value = "";
  }

  function currentOrdersText() {
    return inputMode === "upload" && ordersPayload ? ordersPayload : pasteText;
  }

  async function checkRecords() {
    if (!networkKey) {
      toast.error("Select a network first");
      return;
    }
    const orders = currentOrdersText().trim();
    if (!orders) {
      toast.error("Paste or upload orders first");
      return;
    }

    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/vendor/wholesale/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ networkKey, orders, confirm: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setPreview(data);
      setOrdersPayload(orders);
      if (data.validCount === 0) toast.error("No valid orders found");
      else toast.success(`${data.validCount} valid · ${formatGHS(data.totalAmount)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    if (!preview || preview.validCount === 0 || !networkKey) return;
    if (balance < preview.totalAmount) {
      toast.error("Insufficient balance — top up first");
      onNeedTopup();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vendor/wholesale/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkKey,
          orders: ordersPayload || pasteText,
          confirm: true,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Insufficient wallet balance");
        onNeedTopup();
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.success) {
        onBalanceChange(Number(data.balance ?? balance - preview.totalAmount));
        setPreview(null);
        toast.success(`Bulk order placed · ${data.reference}`);
        return;
      }
      toast.error(data.error ?? "Checkout failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex gap-2">
        {(
          [
            { id: "paste" as const, label: "Paste orders", icon: ClipboardPaste },
            { id: "upload" as const, label: "Upload file", icon: FileSpreadsheet },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setInputMode(m.id);
              setPreview(null);
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors",
              inputMode === m.id
                ? "bg-gold text-navy-950"
                : "bg-white/5 text-white/70 hover:bg-white/10",
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-navy-900/80 p-4">
        <label className="text-xs font-bold uppercase tracking-wide text-white/50">
          Network *
        </label>
        <select
          value={networkKey}
          onChange={(e) => {
            setNetworkKey(e.target.value as BulkNetworkKey | "");
            setPreview(null);
          }}
          className="mt-1.5 flex h-10 w-full rounded-lg border border-white/10 bg-navy-950/80 px-3 text-sm font-semibold text-white"
        >
          <option value="">Select network</option>
          {BULK_NETWORK_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {inputMode === "paste" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-navy-900/80 p-4">
          <h3 className="text-sm font-bold">Paste your orders</h3>
          <p className="text-[11px] text-white/45">
            One line per order: phone, space, size (GB as a number only). Network is set above —
            do not include MTN or GB in each line.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              setPreview(null);
            }}
            rows={10}
            disabled={!networkKey}
            placeholder={
              networkKey
                ? "0241234567 10\n0551234567 20\n0201234567 100"
                : "Select network first, then paste orders here"
            }
            className="w-full rounded-lg border border-white/10 bg-navy-950/60 p-3 font-mono text-xs text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none disabled:opacity-50"
          />
          <div className="rounded-lg border border-white/8 bg-navy-950/50 p-3 text-[11px] leading-relaxed text-white/50">
            <p className="font-semibold text-gold/90">Recommended</p>
            <p className="mt-1 text-white/45">
              <span className="font-mono text-gold/80">0241234567 10</span> — same as admin export
              columns <strong className="text-white/60">Number</strong> +{" "}
              <strong className="text-white/60">Volume</strong> (copy both columns from Excel).
            </p>
            <p className="mt-2 font-semibold text-white/40">Also accepted</p>
            <ul className="mt-1 space-y-0.5 text-white/40">
              <li>
                <span className="font-mono text-gold/70">0241234567,10</span> — from CSV template
              </li>
              <li>
                <span className="font-mono text-gold/70">0241234567 2gb</span> — with unit suffix
              </li>
            </ul>
            <p className="mt-2 text-white/40">
              Phone must be 10 digits starting with 0. Nine-digit numbers get a leading zero
              automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-navy-900/80 p-4">
          <h3 className="text-sm font-bold">Upload orders file</h3>
          <p className="text-[11px] text-white/45">
            Use the template: <strong className="text-white/70">Number</strong> and{" "}
            <strong className="text-white/70">Volume</strong> (plain GB, no unit). Select the
            matching network before upload.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={downloadTemplate}
            >
              <Download className="h-3.5 w-3.5" />
              Download template
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              disabled={!networkKey}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.tsv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {ordersPayload && (
            <p className="text-xs text-emerald-400/90">File loaded — tap Check records to verify.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10 sm:flex-none"
          onClick={checkRecords}
          disabled={loading || !networkKey}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check records"}
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-gold text-navy-950 hover:bg-gold-glow sm:flex-none"
          onClick={checkout}
          disabled={loading || !preview || preview.validCount === 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Checkout"}
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-navy-900/80 p-4">
        <h3 className="text-sm font-bold">Verification</h3>
        {!preview ? (
          <p className="mt-2 text-xs text-white/45">
            Select network, paste or upload orders, then tap Check records.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <span className="font-semibold text-emerald-400">{preview.validCount} valid</span>
              {preview.invalidCount > 0 && (
                <span className="font-semibold text-red-400">{preview.invalidCount} errors</span>
              )}
              <span className="ml-auto font-bold text-gold">{formatGHS(preview.totalAmount)}</span>
            </div>
            <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-[11px]">
              {preview.rows.map((r) => (
                <li
                  key={r.row}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5",
                    r.error ? "border-red-500/30 bg-red-500/10" : "border-white/8 bg-white/5",
                  )}
                >
                  <span className="font-mono">{r.phone}</span>
                  {r.bundleName && (
                    <span className="text-white/50"> · {r.bundleName}</span>
                  )}
                  {r.sizeLabel && !r.bundleName && (
                    <span className="text-white/50"> · {r.sizeLabel}</span>
                  )}
                  {r.error ? (
                    <span className="text-red-400"> — {r.error}</span>
                  ) : (
                    <span className="text-gold"> — {formatGHS(r.lineTotal)}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-white/35">
              Wallet {formatGHS(balance)} · charged at your role price
            </p>
          </>
        )}
      </div>
    </div>
  );
}
