"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { NETWORKS } from "@/lib/constants";
import { formatGHS, formatDataAmount } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminWholesaleRow } from "@/lib/data/wholesale";

interface Props {
  bundles: AdminWholesaleRow[];
}

export function WholesaleAdmin({ bundles: initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newBundle, setNewBundle] = useState({
    network: "mtn" as "mtn" | "telecel" | "at",
    name: "",
    dataMb: 1024,
    validityDays: 30,
    wholesalePrice: 5,
    suggestedRetail: 7,
    minMarkup: 0.5,
    productLine: "standard" as "standard" | "ishare" | "bigtime",
  });

  async function saveRow(row: AdminWholesaleRow, draft: Partial<AdminWholesaleRow>) {
    setPending(row.id);
    try {
      const res = await fetch(`/api/admin/wholesale/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wholesalePrice: draft.wholesalePrice ?? row.wholesalePrice,
          suggestedRetail: draft.suggestedRetail ?? row.suggestedRetail,
          minMarkup: draft.minMarkup ?? row.minMarkup,
          maxMarkup: draft.maxMarkup ?? row.maxMarkup,
          active: draft.active ?? row.active,
          popular: draft.popular ?? row.popular,
          name: draft.name ?? row.name,
          productLine: draft.productLine ?? row.productLine ?? "standard",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Wholesale bundle updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  async function addBundle() {
    setPending("new");
    try {
      const res = await fetch("/api/admin/wholesale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBundle),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Bundle added to wholesale catalogue");
      setShowAdd(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Vendors buy at wholesale price and add markup in their catalogue.
        </p>
        <Button size="sm" variant="secondary" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Add bundle
        </Button>
      </div>

      {showAdd && (
        <div className="card-elevated grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-muted">
            Network
            <select
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.network}
              onChange={(e) =>
                setNewBundle((b) => ({
                  ...b,
                  network: e.target.value as "mtn" | "telecel" | "at",
                  productLine: e.target.value === "at" ? b.productLine : "standard",
                }))
              }
            >
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            Name
            <input
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.name}
              onChange={(e) => setNewBundle((b) => ({ ...b, name: e.target.value }))}
              placeholder="MTN 5GB"
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Data (MB)
            <input
              type="number"
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.dataMb}
              onChange={(e) =>
                setNewBundle((b) => ({ ...b, dataMb: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Validity (days)
            <input
              type="number"
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.validityDays}
              onChange={(e) =>
                setNewBundle((b) => ({ ...b, validityDays: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Wholesale ₵
            <input
              type="number"
              step="0.01"
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.wholesalePrice}
              onChange={(e) =>
                setNewBundle((b) => ({ ...b, wholesalePrice: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Suggested retail ₵
            <input
              type="number"
              step="0.01"
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.suggestedRetail}
              onChange={(e) =>
                setNewBundle((b) => ({ ...b, suggestedRetail: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Min markup ₵
            <input
              type="number"
              step="0.01"
              className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              value={newBundle.minMarkup}
              onChange={(e) =>
                setNewBundle((b) => ({ ...b, minMarkup: Number(e.target.value) }))
              }
            />
          </label>
          {newBundle.network === "at" && (
            <label className="text-xs font-medium text-muted">
              Product line
              <select
                className="mt-1 flex h-10 w-full rounded-xl border border-border px-3 text-sm"
                value={newBundle.productLine}
                onChange={(e) =>
                  setNewBundle((b) => ({
                    ...b,
                    productLine: e.target.value as "standard" | "ishare" | "bigtime",
                  }))
                }
              >
                <option value="standard">Standard</option>
                <option value="ishare">iShare</option>
                <option value="bigtime">BigTime</option>
              </select>
            </label>
          )}
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button className="w-full" onClick={addBundle} disabled={pending === "new"}>
              {pending === "new" ? "Saving…" : "Create bundle"}
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted">
          No wholesale bundles in the catalogue yet.
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/80 text-left text-muted">
                  <th className="px-4 py-3 font-medium">Bundle</th>
                  <th className="px-4 py-3 font-medium">Wholesale</th>
                  <th className="px-4 py-3 font-medium">Suggested retail</th>
                  <th className="px-4 py-3 font-medium">Min markup</th>
                  <th className="px-4 py-3 font-medium">Line</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <WholesaleRowEditor
                    key={row.id}
                    row={row}
                    saving={pending === row.id}
                    onSave={saveRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function WholesaleRowEditor({
  row,
  saving,
  onSave,
}: {
  row: AdminWholesaleRow;
  saving: boolean;
  onSave: (row: AdminWholesaleRow, draft: Partial<AdminWholesaleRow>) => void;
}) {
  const [wholesalePrice, setWholesalePrice] = useState(row.wholesalePrice);
  const [suggestedRetail, setSuggestedRetail] = useState(row.suggestedRetail);
  const [minMarkup, setMinMarkup] = useState(row.minMarkup);
  const [active, setActive] = useState(row.active);
  const [popular, setPopular] = useState(row.popular);
  const [productLine, setProductLine] = useState<"standard" | "ishare" | "bigtime">(
    row.productLine ?? "standard",
  );

  const dirty =
    wholesalePrice !== row.wholesalePrice ||
    suggestedRetail !== row.suggestedRetail ||
    minMarkup !== row.minMarkup ||
    active !== row.active ||
    popular !== row.popular ||
    (row.network === "at" && productLine !== (row.productLine ?? "standard"));

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <NetworkBadge network={row.network} size="xs" />
          <div>
            <p className="font-semibold">{formatDataAmount(row.dataMb)}</p>
            <p className="text-xs text-muted">
              {row.name} · {row.validityDays}d · <span className="font-mono">{row.sku}</span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          className="num w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
          value={wholesalePrice}
          onChange={(e) => setWholesalePrice(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          className="num w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
          value={suggestedRetail}
          onChange={(e) => setSuggestedRetail(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          className="num w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
          value={minMarkup}
          onChange={(e) => setMinMarkup(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-3">
        {row.network === "at" ? (
          <select
            className="rounded-lg border border-border px-2 py-1.5 text-xs"
            value={productLine}
            onChange={(e) =>
              setProductLine(e.target.value as "standard" | "ishare" | "bigtime")
            }
          >
            <option value="standard">Standard</option>
            <option value="ishare">iShare</option>
            <option value="bigtime">BigTime</option>
          </select>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={popular}
              onChange={(e) => setPopular(e.target.checked)}
            />
            Popular
          </label>
          {!active && <Badge variant="neutral">Hidden</Badge>}
        </div>
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() =>
            onSave(row, {
              wholesalePrice,
              suggestedRetail,
              minMarkup,
              active,
              popular,
              productLine: row.network === "at" ? productLine : "standard",
            })
          }
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "…" : "Save"}
        </Button>
        <p className="mt-1 text-[10px] text-muted">Was {formatGHS(row.wholesalePrice)}</p>
      </td>
    </tr>
  );
}
