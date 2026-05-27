"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Lock,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import type { Bundle } from "@/types";
import type { NetworkId } from "@/lib/constants";
import { NETWORKS } from "@/lib/constants";
import { formatDataAmount, formatGHS } from "@/lib/format";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  bundle: Bundle | null;
  momoDirectEnabled?: boolean;
  momoMerchantName?: string;
}

type PayMethod = "paystack" | "momo_direct";

interface MomoInitResponse {
  provider: "momo_direct";
  orderId: string;
  reference: string;
  amount: number;
  merchantNumbers: Record<NetworkId, string>;
  merchantName: string;
}

const NETWORK_BAR: Record<NetworkId, string> = {
  mtn: "bg-mtn",
  telecel: "bg-telecel",
  at: "bg-at",
};

export function CheckoutForm({ bundle, momoDirectEnabled, momoMerchantName }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PayMethod>("paystack");
  const [momoState, setMomoState] = useState<MomoInitResponse | null>(null);
  const [txnId, setTxnId] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!bundle) {
    return (
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
        <div
          className="px-6 py-10 text-center"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,9,20,0.03) 0%, transparent 100%)",
          }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Smartphone className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">
            No bundle selected
          </p>
          <p className="mt-1 text-xs text-muted">
            Open your agent&apos;s store link to pick a bundle and continue checkout.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/">
              Open agent store
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const network = NETWORKS.find((n) => n.id === bundle.network);
  const savings =
    bundle.originalPrice && bundle.originalPrice > bundle.price
      ? bundle.originalPrice - bundle.price
      : null;

  async function handlePay() {
    if (!bundle) return;
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      toast.error("Enter a valid recipient phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          recipientPhone: phone,
          provider: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");

      if (data.provider === "momo_direct") {
        setMomoState(data as MomoInitResponse);
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      router.push(`/orders/${data.orderId}?ref=${data.reference}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmMomo() {
    if (!momoState) return;
    const trimmed = txnId.trim().toUpperCase();
    if (trimmed.length < 6) {
      toast.error("Paste the transaction ID from your MoMo SMS");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch("/api/payments/momo-direct/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: momoState.orderId, transactionId: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? "Could not confirm payment");
      }
      if (data.status === "paid" || data.alreadyProcessed) {
        toast.success("Payment confirmed — bundle is queued for delivery.");
        router.push(`/orders/${momoState.orderId}?ref=${momoState.reference}`);
        return;
      }
      if (data.status === "waiting") {
        toast.info(
          "We haven't received the SMS yet. Wait 10–30 seconds and try again. We'll notify you on delivery.",
        );
        return;
      }
      if (data.status === "amount_mismatch") {
        toast.error("Amount on the SMS is less than the order total.");
        return;
      }
      toast.message("Submitted. We'll match it when the SMS arrives.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm payment");
    } finally {
      setConfirming(false);
    }
  }

  function copyToClipboard(value: string, label: string) {
    void navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy — please copy manually"),
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      {/* Order summary — sticky on desktop */}
      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_40px_rgba(10,17,36,0.08)]">
          <div className={cn("h-1.5", NETWORK_BAR[bundle.network])} />

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <NetworkBadge network={bundle.network} size="sm" />
                <p className="num mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                  {formatDataAmount(bundle.dataMb)}
                </p>
                <p className="mt-0.5 text-sm text-muted">{bundle.name}</p>
              </div>
              <div className="text-right">
                <p className="num text-2xl font-extrabold text-foreground">
                  {formatGHS(bundle.price)}
                </p>
                {savings != null && bundle.originalPrice && (
                  <p className="num mt-0.5 text-xs text-muted line-through">
                    {formatGHS(bundle.originalPrice)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
              <Avatar
                name={bundle.vendor.businessName}
                size="sm"
                verified={bundle.vendor.verified}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {bundle.vendor.businessName}
                </p>
                <p className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    ~{bundle.vendor.fulfilmentMinutes} min delivery
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Zap className="h-3 w-3" />
                    Live
                  </span>
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Bundle" value={bundle.name} />
              <Row label="Network" value={network?.name ?? bundle.network} />
              <Row label="Validity" value={`${bundle.validityDays} days`} />
              <Row
                label="Total due"
                value={formatGHS(bundle.price)}
                highlight
              />
            </dl>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            TLS encrypted
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            BoG-licensed rails
          </span>
        </div>
      </aside>

      {/* Payment panel */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_40px_rgba(10,17,36,0.08)]">
        <div
          className="border-b border-border px-5 py-4 sm:px-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,9,20,0.02) 0%, rgba(34,211,238,0.04) 100%)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
            Payment details
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            Where should we send the data?
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Phone */}
          <div className="space-y-2">
            <label
              htmlFor="recipient-phone"
              className="text-sm font-semibold text-foreground"
            >
              Recipient number
            </label>
            <div className="flex overflow-hidden rounded-xl border border-border bg-white ring-0 transition-shadow focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
              <span className="flex items-center gap-1.5 border-r border-border bg-slate-50 px-3 text-sm font-semibold text-muted">
                <span aria-hidden>🇬🇭</span>
                +233
              </span>
              <input
                id="recipient-phone"
                type="tel"
                inputMode="tel"
                placeholder="24 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-soft focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted">
              Must match the network you&apos;re buying for ({network?.name})
            </p>
          </div>

          {/* Payment method picker */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Pay with</p>

            <button
              type="button"
              onClick={() => setMethod("paystack")}
              disabled={!!momoState}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:opacity-50",
                method === "paystack"
                  ? "border-sky-500 bg-sky-50/80 ring-1 ring-sky-500/40"
                  : "border-border bg-white hover:border-sky-300",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-lg font-black text-white">
                P
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Paystack</p>
                <p className="text-xs text-muted">MoMo · Visa · Mastercard · Auto-verified</p>
              </div>
              {method === "paystack" && <CheckCircle2 className="h-5 w-5 text-sky-600" />}
            </button>

            {momoDirectEnabled && (
              <button
                type="button"
                onClick={() => setMethod("momo_direct")}
                disabled={!!momoState}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:opacity-50",
                  method === "momo_direct"
                    ? "border-amber-500 bg-amber-50/80 ring-1 ring-amber-500/40"
                    : "border-border bg-white hover:border-amber-300",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-lg font-black text-white">
                  M
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">MoMo direct</p>
                  <p className="text-xs text-muted">
                    Send to our number, paste your transaction ID — no service fee.
                  </p>
                </div>
                {method === "momo_direct" && <CheckCircle2 className="h-5 w-5 text-amber-600" />}
              </button>
            )}
          </div>

          {/* MoMo-direct payment instructions (after initialize) */}
          {momoState ? (
            <MomoInstructions
              state={momoState}
              network={bundle.network}
              merchantName={momoState.merchantName || momoMerchantName || ""}
              txnId={txnId}
              onTxnChange={setTxnId}
              confirming={confirming}
              onConfirm={handleConfirmMomo}
              onCopy={copyToClipboard}
            />
          ) : (
            <>
              <div
                className="flex gap-3 rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 p-3.5"
                role="note"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                <p className="text-xs leading-relaxed text-muted">
                  Payment is verified via secure webhook. You&apos;ll get an SMS when
                  your bundle is delivered.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-navy-950 transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #F4D160 100%)",
                  boxShadow:
                    "0 8px 24px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.45)",
                }}
              >
                {loading ? (
                  "Processing…"
                ) : (
                  <>
                    {method === "momo_direct"
                      ? `Continue with MoMo direct · ${formatGHS(bundle.price)}`
                      : `Pay ${formatGHS(bundle.price)}`}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </>
          )}

          <p className="text-center text-[10px] text-muted">
            By paying you agree to DCS{" "}
            <Link href="/terms" className="text-cyan-600 hover:underline">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="text-cyan-600 hover:underline">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd
        className={cn(
          "num font-semibold",
          highlight ? "text-lg text-foreground" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MomoInstructions({
  state,
  network,
  merchantName,
  txnId,
  onTxnChange,
  confirming,
  onConfirm,
  onCopy,
}: {
  state: MomoInitResponse;
  network: NetworkId;
  merchantName: string;
  txnId: string;
  onTxnChange: (v: string) => void;
  confirming: boolean;
  onConfirm: () => void;
  onCopy: (value: string, label: string) => void;
}) {
  const merchantNumber = state.merchantNumbers[network] || "";
  const networkLabel = NETWORKS.find((n) => n.id === network)?.name ?? network.toUpperCase();

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
          Step 1 — send the payment
        </p>
        <p className="mt-1 text-sm text-foreground">
          Send <strong className="num">{formatGHS(state.amount)}</strong> from your{" "}
          <strong>{networkLabel}</strong> MoMo wallet to:
        </p>
      </div>

      <div className="space-y-2">
        <CopyRow
          label={`${networkLabel} merchant number`}
          value={merchantNumber || "Not configured"}
          onCopy={() => merchantNumber && onCopy(merchantNumber, "Merchant number")}
          mono
          disabled={!merchantNumber}
        />
        {merchantName ? (
          <CopyRow label="Merchant name" value={merchantName} onCopy={() => onCopy(merchantName, "Merchant name")} />
        ) : null}
        <CopyRow
          label="Reference / memo"
          value={state.reference}
          onCopy={() => onCopy(state.reference, "Reference")}
          mono
        />
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-white/60 p-3 text-xs text-muted">
        <p className="font-semibold text-amber-800">Tip</p>
        <p className="mt-0.5">
          Add the reference <strong className="num">{state.reference}</strong> as the
          memo/reason on your MoMo transfer. It helps us auto-match your payment
          even before you submit the transaction ID below.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
          Step 2 — paste your transaction ID
        </p>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="e.g. 6172948391"
          value={txnId}
          onChange={(e) => onTxnChange(e.target.value)}
          className="num h-12 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm font-semibold tracking-wider text-foreground placeholder:text-muted-soft focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        <p className="text-[11px] text-muted">
          Open your MoMo confirmation SMS and copy the Transaction ID. We&apos;ll
          match it to the SMS our system received from your telco.
        </p>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming || !merchantNumber}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60"
      >
        {confirming ? "Verifying…" : "Confirm payment"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  mono,
  disabled,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  mono?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-white px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-bold text-foreground",
            mono && "num tracking-wider",
            disabled && "text-muted-soft",
          )}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}
