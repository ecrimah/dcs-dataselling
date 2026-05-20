"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock,
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
}

const NETWORK_BAR: Record<NetworkId, string> = {
  mtn: "bg-mtn",
  telecel: "bg-telecel",
  at: "bg-at",
};

export function CheckoutForm({ bundle }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<"paystack" | "moolre">("paystack");
  const [loading, setLoading] = useState(false);

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
            Pick a bundle from the marketplace to continue checkout.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/marketplace">
              Browse marketplace
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
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
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

          {/* Payment rails */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Pay with</p>
            <div className="grid grid-cols-2 gap-2">
              <PaymentRail
                active={provider === "paystack"}
                onClick={() => setProvider("paystack")}
                name="Paystack"
                desc="MoMo · Visa · Mastercard"
                accent="from-sky-500 to-blue-600"
                icon={
                  <span className="text-lg font-black tracking-tighter text-white">
                    P
                  </span>
                }
              />
              <PaymentRail
                active={provider === "moolre"}
                onClick={() => setProvider("moolre")}
                name="Moolre"
                desc="Mobile Money only"
                accent="from-emerald-500 to-teal-600"
                icon={
                  <span className="text-lg font-black tracking-tighter text-white">
                    M
                  </span>
                }
              />
            </div>
          </div>

          {/* Trust note */}
          <div
            className="flex gap-3 rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 p-3.5"
            role="note"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <p className="text-xs leading-relaxed text-muted">
              Payment is verified via secure webhook. You&apos;ll get SMS and
              in-app confirmation the moment your bundle is delivered.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-navy-950 transition-all disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)",
              boxShadow:
                "0 8px 24px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
            {loading ? (
              "Processing…"
            ) : (
              <>
                Pay {formatGHS(bundle.price)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

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

function PaymentRail({
  active,
  onClick,
  name,
  desc,
  accent,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  desc: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-cyan-500 bg-cyan-500/5 ring-2 ring-cyan-500/25"
          : "border-border hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
          accent,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{name}</span>
        <span className="block text-[10px] text-muted">{desc}</span>
      </span>
      {active && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
