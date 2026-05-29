"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminSection,
  AdminTableBody,
  AdminTableHead,
  AdminTh,
} from "@/components/admin";
import { NETWORKS } from "@/lib/constants";
import { formatDataAmount } from "@/lib/format";
import type { WholesalePriceMatrix } from "@/lib/wholesale/tier-pricing";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminWholesaleRow } from "@/lib/data/wholesale";

interface Props {
  bundles: AdminWholesaleRow[];
}

const EMPTY_PRICES: WholesalePriceMatrix = {
  costPrice: 0,
  customerPrice: 0,
  customerProPrice: 0,
  agentPrice: 0,
  agentProPrice: 0,
  xpressAgentPrice: 0,
};

function pricesFromRow(row: AdminWholesaleRow): WholesalePriceMatrix {
  return {
    costPrice: row.costPrice,
    customerPrice: row.customerPrice,
    customerProPrice: row.customerProPrice,
    agentPrice: row.agentPrice,
    agentProPrice: row.agentProPrice,
    xpressAgentPrice: row.xpressAgentPrice,
  };
}

export function WholesaleAdmin({ bundles: initial }: Props) {
  const router = useRouter();
  const [rows] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newBundle, setNewBundle] = useState({
    network: "mtn" as "mtn" | "telecel" | "at",
    name: "",
    dataMb: 1024,
    validityDays: 30,
    minMarkup: 0.5,
    productLine: "standard" as "standard" | "ishare" | "bigtime",
    prices: { ...EMPTY_PRICES, costPrice: 4, agentPrice: 5, xpressAgentPrice: 4.8, agentProPrice: 4.6 },
  });

  async function saveRow(row: AdminWholesaleRow, draft: Partial<AdminWholesaleRow> & { prices?: WholesalePriceMatrix }) {
    setPending(row.id);
    try {
      const res = await fetch(`/api/admin/wholesale/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prices: draft.prices,
          minMarkup: draft.minMarkup ?? row.minMarkup,
          maxMarkup: draft.maxMarkup ?? row.maxMarkup,
          active: draft.active ?? row.active,
          popular: draft.popular ?? row.popular,
          name: draft.name ?? row.name,
          productLine: draft.productLine ?? row.productLine ?? "standard",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Pricing updated");
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
        body: JSON.stringify({
          network: newBundle.network,
          name: newBundle.name,
          dataMb: newBundle.dataMb,
          validityDays: newBundle.validityDays,
          minMarkup: newBundle.minMarkup,
          productLine: newBundle.productLine,
          prices: newBundle.prices,
        }),
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
    <AdminSection
      title="Pricing matrix"
      description="Set the cost and the buy price for each agent role per bundle. Agents see their role's price at checkout."
      icon={Package}
      actions={
        <Button size="sm" variant="secondary" onClick={() => setShowAdd((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Add bundle
        </Button>
      }
    >
      {showAdd && (
        <div className="admin-list-item mb-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-muted">
              Network
              <select
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
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
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
                value={newBundle.name}
                onChange={(e) => setNewBundle((b) => ({ ...b, name: e.target.value }))}
                placeholder="MTN 5GB"
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Data (MB)
              <input
                type="number"
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
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
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
                value={newBundle.validityDays}
                onChange={(e) =>
                  setNewBundle((b) => ({ ...b, validityDays: Number(e.target.value) }))
                }
              />
            </label>
          </div>
          <PriceMatrixInputs
            prices={newBundle.prices}
            onChange={(prices) => setNewBundle((b) => ({ ...b, prices }))}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-muted">
              Min markup ₵
              <input
                type="number"
                step="0.01"
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
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
                  className="mt-1 flex h-9 w-full rounded-lg border border-border px-2.5 text-sm"
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
            <div className="flex items-end">
              <Button className="w-full" onClick={addBundle} disabled={pending === "new"}>
                {pending === "new" ? "Saving…" : "Create bundle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No wholesale bundles"
          description="Add your first bundle to let agents purchase data at tier-specific prices."
        />
      ) : (
        <AdminDataTable minWidth="900px">
          <AdminTableHead>
            <AdminTh>Volume</AdminTh>
            <AdminTh>Cost price</AdminTh>
            <AdminTh>Agent</AdminTh>
            <AdminTh>Super Agent</AdminTh>
            <AdminTh>Pro Agent</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh />
          </AdminTableHead>
          <AdminTableBody>
            {rows.map((row) => (
              <WholesaleRowEditor
                key={row.id}
                row={row}
                saving={pending === row.id}
                onSave={saveRow}
              />
            ))}
          </AdminTableBody>
        </AdminDataTable>
      )}
    </AdminSection>
  );
}

function PriceMatrixInputs({
  prices,
  onChange,
  compact,
}: {
  prices: WholesalePriceMatrix;
  onChange: (p: WholesalePriceMatrix) => void;
  compact?: boolean;
}) {
  const fields: { key: keyof WholesalePriceMatrix; label: string }[] = [
    { key: "costPrice", label: "Cost ₵" },
    { key: "agentPrice", label: "Agent ₵" },
    { key: "xpressAgentPrice", label: "Super Agent ₵" },
    { key: "agentProPrice", label: "Pro Agent ₵" },
  ];

  return (
    <div className={compact ? "flex flex-wrap gap-1" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-4"}>
      {fields.map(({ key, label }) => (
        <label key={key} className="text-[10px] font-medium text-muted">
          {!compact && label}
          <input
            type="number"
            step="0.01"
            title={label}
            className={
              compact
                ? "num w-14 rounded-md border border-border px-1 py-0.5 text-xs"
                : "mt-0.5 flex h-8 w-full rounded-md border border-border px-2 text-sm"
            }
            value={prices[key]}
            onChange={(e) => onChange({ ...prices, [key]: Number(e.target.value) })}
          />
        </label>
      ))}
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  title,
}: {
  value: number;
  onChange: (v: number) => void;
  title: string;
}) {
  return (
    <input
      type="number"
      step="0.01"
      title={title}
      className="num w-16 rounded-md border border-border px-1.5 py-1 text-xs"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function WholesaleRowEditor({
  row,
  saving,
  onSave,
}: {
  row: AdminWholesaleRow;
  saving: boolean;
  onSave: (row: AdminWholesaleRow, draft: Partial<AdminWholesaleRow> & { prices?: WholesalePriceMatrix }) => void;
}) {
  const [prices, setPrices] = useState(() => pricesFromRow(row));
  const [minMarkup, setMinMarkup] = useState(row.minMarkup);
  const [active, setActive] = useState(row.active);
  const [popular, setPopular] = useState(row.popular);
  const [productLine, setProductLine] = useState<"standard" | "ishare" | "bigtime">(
    row.productLine ?? "standard",
  );

  const base = pricesFromRow(row);
  const dirty =
    Object.keys(base).some((k) => prices[k as keyof WholesalePriceMatrix] !== base[k as keyof WholesalePriceMatrix]) ||
    minMarkup !== row.minMarkup ||
    active !== row.active ||
    popular !== row.popular ||
    (row.network === "at" && productLine !== (row.productLine ?? "standard"));

  return (
    <tr className="admin-table-tr">
      <td className="admin-table-td">
        <div className="flex items-center gap-2">
          <NetworkBadge network={row.network} size="xs" />
          <div>
            <p className="font-semibold">{formatDataAmount(row.dataMb)}</p>
            <p className="text-xs text-muted">
              {row.name} · {row.validityDays}d · <span className="font-mono">{row.sku}</span>
            </p>
            {row.network === "at" && (
              <select
                className="mt-1 rounded border border-border px-1 py-0.5 text-[10px]"
                value={productLine}
                onChange={(e) =>
                  setProductLine(e.target.value as "standard" | "ishare" | "bigtime")
                }
              >
                <option value="standard">Standard</option>
                <option value="ishare">iShare</option>
                <option value="bigtime">BigTime</option>
              </select>
            )}
          </div>
        </div>
      </td>
      <td className="admin-table-td">
        <PriceInput
          title="Cost price"
          value={prices.costPrice}
          onChange={(v) => setPrices((p) => ({ ...p, costPrice: v }))}
        />
      </td>
      <td className="admin-table-td">
        <PriceInput
          title="Agent price"
          value={prices.agentPrice}
          onChange={(v) => setPrices((p) => ({ ...p, agentPrice: v }))}
        />
      </td>
      <td className="admin-table-td">
        <PriceInput
          title="Super Agent price"
          value={prices.xpressAgentPrice}
          onChange={(v) => setPrices((p) => ({ ...p, xpressAgentPrice: v }))}
        />
      </td>
      <td className="admin-table-td">
        <PriceInput
          title="Pro Agent price"
          value={prices.agentProPrice}
          onChange={(v) => setPrices((p) => ({ ...p, agentProPrice: v }))}
        />
      </td>
      <td className="admin-table-td">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} />
            Popular
          </label>
          {!active && <Badge variant="neutral">Hidden</Badge>}
        </div>
      </td>
      <td className="admin-table-td">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() =>
            onSave(row, {
              prices,
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
      </td>
    </tr>
  );
}
