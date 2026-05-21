"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  Phone,
  Plus,
  ShoppingCart,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { NetworkId } from "@/lib/constants";
import { formatDataAmount, formatGHS } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WholesaleBundle } from "@/types";

type NetworkFilter = "all" | NetworkId;
type Mode = "shop" | "bulk";

interface CartLine {
  key: string;
  bundleId: string;
  phone: string;
}

interface Props {
  wholesale: WholesaleBundle[];
  initialBalance: number;
  topupCallback?: string;
  initialNetwork?: NetworkFilter;
  initialLine?: "ishare" | "bigtime";
  initialMode?: Mode;
  openTopupOnMount?: boolean;
}

const TOPUP_PRESETS = [50, 100, 200, 500];

function phoneValid(raw: string) {
  return /^0\d{9}$/.test(raw.replace(/\D/g, "").slice(0, 10));
}

function normalizeInput(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 10);
}

export function WholesaleTerminal({
  wholesale,
  initialBalance,
  topupCallback,
  initialNetwork = "all",
  initialLine,
  initialMode = "shop",
  openTopupOnMount = false,
}: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [network, setNetwork] = useState<NetworkFilter>(initialNetwork);
  const [lineFilter] = useState<"ishare" | "bigtime" | undefined>(initialLine);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(openTopupOnMount);
  const [topupAmount, setTopupAmount] = useState("100");
  const [loading, setLoading] = useState(false);

  const [csv, setCsv] = useState(
    "phone,sku\n0241234567,MTN-1024MB-30D\n0559876543,MTN-2048MB-30D",
  );
  const [preview, setPreview] = useState<{
    validCount: number;
    invalidCount: number;
    totalAmount: number;
    rows: {
      row: number;
      phone: string;
      sku?: string;
      bundleName?: string;
      quantity: number;
      lineTotal: number;
      error?: string;
    }[];
  } | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/wallet");
      if (!res.ok) return;
      const data = await res.json();
      setBalance(Number(data.balance ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (topupCallback) {
      toast.success("Top-up received — balance updated");
      void refreshBalance();
    }
  }, [topupCallback, refreshBalance]);

  const filtered = useMemo(() => {
    let items = network === "all" ? wholesale : wholesale.filter((w) => w.network === network);
    if (lineFilter && network === "at") {
      const q = lineFilter === "ishare" ? "ishare" : "bigtime";
      items = items.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.sku.toLowerCase().includes(q) ||
          (lineFilter === "ishare" && !w.name.toLowerCase().includes("bigtime")),
      );
    }
    return items;
  }, [wholesale, network, lineFilter]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const b = wholesale.find((w) => w.id === line.bundleId);
        return sum + (b?.wholesalePrice ?? 0);
      }, 0),
    [cart, wholesale],
  );

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = { all: wholesale.length };
    for (const w of wholesale) {
      counts[w.network] = (counts[w.network] ?? 0) + 1;
    }
    return counts;
  }, [wholesale]);

  function addToCart(bundle: WholesaleBundle) {
    const phone = normalizeInput(phones[bundle.id] ?? "");
    if (!phoneValid(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setCart((prev) => [
      ...prev,
      { key: `${bundle.id}-${phone}-${Date.now()}`, bundleId: bundle.id, phone },
    ]);
    toast.success("Added to cart");
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((c) => c.key !== key));
  }

  async function startTopup() {
    const amount = Number(topupAmount);
    if (!amount || amount < 5) {
      toast.error("Minimum top-up is ₵5");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Top-up failed");
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      toast.error("Payment not available");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function checkoutCart() {
    if (cart.length === 0) return;
    if (balance < cartTotal) {
      toast.error("Insufficient balance — top up your wallet");
      setTopupOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/wholesale/orders/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            wholesaleBundleId: c.bundleId,
            recipientPhone: c.phone,
          })),
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error(`Need ${formatGHS(data.shortfall ?? 0)} more — top up wallet`);
        setTopupOpen(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      setCart([]);
      setCartOpen(false);
      setBalance(Number(data.balance ?? balance - cartTotal));
      toast.success(`Order placed · ${data.reference}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  async function previewBulk() {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/vendor/wholesale/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreview(data);
      if (data.validCount === 0) toast.error("No valid rows");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBulk() {
    if (!preview || preview.validCount === 0) return;
    if (balance < preview.totalAmount) {
      toast.error("Insufficient balance — top up first");
      setTopupOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/wholesale/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm: true }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Insufficient wallet balance");
        setTopupOpen(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Order failed");
      if (data.success) {
        setBalance(Number(data.balance ?? balance - preview.totalAmount));
        setPreview(null);
        toast.success(`Bulk order placed · ${data.reference}`);
        return;
      }
      toast.error(data.error ?? "Order failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  const networkPills: { id: NetworkFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "mtn", label: "MTN" },
    { id: "telecel", label: "TELECEL" },
    { id: "at", label: "AirtelTigo" },
  ];

  return (
    <div className="relative -mx-4 -mt-2 sm:-mx-6">
      <div className="overflow-hidden rounded-2xl border border-navy-800 bg-navy-950 text-white shadow-xl sm:mx-0">
        {/* Wallet bar */}
        <div className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Wallet balance
                </p>
                <p className="num truncate text-xl font-bold text-gold">{formatGHS(balance)}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
              onClick={() => setTopupOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Top Up
            </Button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-950">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mode + network */}
        <div className="space-y-3 px-4 py-3">
          <div className="flex gap-2">
            {(
              [
                { id: "shop" as const, label: "Products", icon: ShoppingCart },
                { id: "bulk" as const, label: "Bulk CSV", icon: FileSpreadsheet },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors",
                  mode === m.id
                    ? "bg-gold text-navy-950"
                    : "bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {mode === "shop" && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {networkPills.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setNetwork(pill.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                    network === pill.id
                      ? "bg-white text-navy-950"
                      : "bg-white/8 text-white/60 hover:bg-white/12",
                  )}
                >
                  {pill.label}
                  <span className="ml-1 opacity-60">({networkCounts[pill.id] ?? 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shop grid */}
        {mode === "shop" && (
          <div className="space-y-3 px-4 pb-6">
            <p className="text-xs text-white/45">
              {filtered.length} product{filtered.length === 1 ? "" : "s"} · enter customer number on each card
            </p>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-white/10 py-12 text-center text-sm text-white/50">
                No products for this network.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((wb) => (
                  <article
                    key={wb.id}
                    className="rounded-xl border border-white/10 bg-navy-900/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <NetworkBadge network={wb.network} size="xs" />
                          {wb.popular && (
                            <Badge variant="warning" className="text-[9px]">
                              Hot
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-bold leading-snug">{wb.name}</h3>
                        <p className="mt-0.5 text-[11px] text-white/45">
                          {formatDataAmount(wb.dataMb)} · {wb.validityDays}d
                        </p>
                      </div>
                      <p className="num shrink-0 text-lg font-bold text-gold">
                        {formatGHS(wb.wholesalePrice)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-navy-950/60 px-3 py-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-xs font-bold text-white/40">+233</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="0241234567"
                        value={phones[wb.id] ?? ""}
                        onChange={(e) =>
                          setPhones((p) => ({ ...p, [wb.id]: normalizeInput(e.target.value) }))
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold placeholder:text-white/25 focus:outline-none"
                      />
                    </div>

                    <Button
                      size="sm"
                      className="mt-3 w-full bg-gold text-navy-950 hover:bg-gold-glow"
                      onClick={() => addToCart(wb)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk */}
        {mode === "bulk" && (
          <div className="grid gap-4 px-4 pb-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-white/10 bg-navy-900/80 p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-bold">CSV / Excel export</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-white/45">
                Columns: <code className="text-gold/80">phone,sku</code> or{" "}
                <code className="text-gold/80">phone,network,data_mb,validity_days</code>
              </p>
              <textarea
                value={csv}
                onChange={(e) => {
                  setCsv(e.target.value);
                  setPreview(null);
                }}
                rows={8}
                className="w-full rounded-lg border border-white/10 bg-navy-950/60 p-3 font-mono text-xs text-white focus:border-gold/40 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={previewBulk}
                  disabled={loading}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="bg-gold text-navy-950"
                  onClick={confirmBulk}
                  disabled={loading || !preview || preview.validCount === 0}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place bulk order"}
                </Button>
              </div>
              <p className="text-[10px] text-white/35">Paid from wallet · {formatGHS(balance)} available</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-navy-900/80 p-4">
              <h3 className="text-sm font-bold">Preview</h3>
              {!preview ? (
                <p className="mt-3 text-xs text-white/45">Validate rows before placing order.</p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="font-semibold text-emerald-400">{preview.validCount} valid</span>
                    {preview.invalidCount > 0 && (
                      <span className="font-semibold text-red-400">{preview.invalidCount} errors</span>
                    )}
                    <span className="ml-auto font-bold text-gold">{formatGHS(preview.totalAmount)}</span>
                  </div>
                  <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-[11px]">
                    {preview.rows.map((r) => (
                      <li
                        key={r.row}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5",
                          r.error ? "border-red-500/30 bg-red-500/10" : "border-white/8 bg-white/5",
                        )}
                      >
                        #{r.row} {r.phone} · {r.sku ?? "—"}{" "}
                        {r.error ? (
                          <span className="text-red-400">— {r.error}</span>
                        ) : (
                          <span className="text-white/45">— {formatGHS(r.lineTotal)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative max-h-[85vh] overflow-hidden rounded-t-2xl border border-white/10 bg-navy-950 sm:mx-auto sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="font-bold">Cart ({cart.length})</h3>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <li className="py-8 text-center text-sm text-white/45">Cart is empty</li>
              ) : (
                cart.map((line) => {
                  const b = wholesale.find((w) => w.id === line.bundleId);
                  return (
                    <li
                      key={line.key}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-navy-900/80 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b?.name ?? "Bundle"}</p>
                        <p className="text-xs text-white/45">{line.phone}</p>
                      </div>
                      <p className="num text-sm font-bold text-gold">
                        {formatGHS(b?.wholesalePrice ?? 0)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.key)}
                        className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="border-t border-white/10 px-4 py-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-white/60">Total</span>
                <span className="num font-bold text-gold">{formatGHS(cartTotal)}</span>
              </div>
              <Button
                className="w-full bg-gold text-navy-950"
                disabled={loading || cart.length === 0}
                onClick={checkoutCart}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Place order · ${formatGHS(cartTotal)}`
                )}
              </Button>
              {balance < cartTotal && cart.length > 0 && (
                <p className="mt-2 text-center text-[11px] text-red-400">
                  Need {formatGHS(cartTotal - balance)} more — top up wallet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top-up modal */}
      {topupOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close top-up"
            onClick={() => setTopupOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-navy-950 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Top up wallet</h3>
              <button type="button" onClick={() => setTopupOpen(false)} className="rounded p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-white/45">Pay with MoMo or card via Paystack</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOPUP_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(String(amt))}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                    topupAmount === String(amt)
                      ? "bg-gold text-navy-950"
                      : "bg-white/8 text-white/70 hover:bg-white/12",
                  )}
                >
                  {formatGHS(amt)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-semibold text-white/60">Custom amount (GHS)</label>
            <input
              type="number"
              min={5}
              max={50000}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm font-semibold focus:border-gold/40 focus:outline-none"
            />
            <Button
              className="mt-4 w-full bg-gold text-navy-950"
              disabled={loading}
              onClick={startTopup}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to payment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
