"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { NetworkId } from "@/lib/constants";
import { formatGHS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOPUP_PRESETS = [50, 100, 200, 500];

export interface MomoClaimItConfig {
  enabled: boolean;
  merchantNumber: string;
  merchantName: string;
  merchantNumbers: Record<NetworkId, string>;
}

interface Props {
  config: MomoClaimItConfig;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  /** dark = wholesale modal; light = dashboard pages */
  variant?: "dark" | "light";
}

function maskMerchantNumber(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 6) return num;
  return `0${digits.slice(-9, -5)}XXXX${digits.slice(-3)}`;
}

export function MomoClaimItPanel({
  config,
  onSuccess,
  onCancel,
  showCancel = true,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
  const router = useRouter();
  const [amount, setAmount] = useState("100");
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [generatedAmount, setGeneratedAmount] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [claiming, setClaiming] = useState(false);

  if (!config.enabled || !config.merchantNumber) {
    return (
      <p className={cn("text-sm", isDark ? "text-white/60" : "text-slate-600")}>
        MoMo ClaimIt is not available yet. Ask your admin to enable MoMo direct payments and set
        merchant numbers in settings.
      </p>
    );
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function generateCode() {
    const value = Number(amount);
    if (!value || value < 5) {
      toast.error("Minimum top-up is ₵5");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/vendor/wallet/momo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate code");
      setPaymentCode(data.reference);
      setGeneratedAmount(Number(data.amount));
      toast.success("Payment code ready — send MoMo with this reference");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate code");
    } finally {
      setGenerating(false);
    }
  }

  async function claimManually() {
    const trimmed = txnId.trim();
    if (trimmed.length < 4) {
      toast.error("Enter your transaction ID from the MoMo SMS");
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch("/api/vendor/wallet/momo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: trimmed,
          reference: paymentCode ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Claim failed");

      if (data.status === "paid") {
        toast.success(`${formatGHS(data.amount)} credited to your wallet`);
        setTxnId("");
        setPaymentCode(null);
        setGeneratedAmount(null);
        onSuccess?.();
        router.refresh();
        return;
      }
      if (data.status === "waiting") {
        toast.message("Payment not found yet — try again in a minute");
        return;
      }
      if (data.status === "already_processed") {
        toast.error("This transaction was already claimed");
        return;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  }

  const textMuted = isDark ? "text-white/70" : "text-slate-600";
  const textStrong = isDark ? "text-white" : "text-slate-900";
  const labelClass = isDark
    ? "text-[11px] font-semibold uppercase tracking-wide text-white/50"
    : "text-[11px] font-bold uppercase tracking-wide text-slate-500";
  const inputClass = isDark
    ? "rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm font-semibold text-white focus:border-gold/40 focus:outline-none"
    : "rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20";
  const presetIdle = isDark
    ? "bg-white/8 text-white/70 hover:bg-white/12"
    : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50";
  const divider = isDark ? "bg-white/10" : "bg-slate-200";
  const dividerLabel = isDark ? "text-white/40" : "text-slate-400";
  const topUpBox = isDark
    ? "rounded-xl border border-gold/30 bg-gold/5 p-4"
    : "rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm";
  const codeBox = isDark
    ? "rounded-xl border border-gold/25 bg-navy-950/80 p-3"
    : "rounded-xl border border-amber-300 bg-white p-3 shadow-inner";
  const descClass = isDark ? "text-xs text-white/55" : "text-xs text-slate-600";
  const codeHint = isDark ? "text-xs text-white/50" : "text-xs text-slate-500";

  return (
    <div className="space-y-4">
      <p className={cn("text-sm", textMuted)}>
        Send payment to{" "}
        <button
          type="button"
          onClick={() => void copyText(config.merchantNumber, "Merchant number")}
          className="font-bold text-amber-700 underline-offset-2 hover:underline"
        >
          {maskMerchantNumber(config.merchantNumber)}
        </button>{" "}
        registered under <strong className={textStrong}>{config.merchantName}</strong>.
      </p>

      <div className={topUpBox}>
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="h-4 w-4" />
          <p className="text-sm font-bold">Instant Top-Up</p>
        </div>
        <p className={cn("mt-2", descClass)}>
          Generate a unique code. When you send MoMo with this code as reference, your wallet is
          credited automatically.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {TOPUP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                amount === String(preset) ? "bg-gold text-navy-950" : presetIdle,
              )}
            >
              {formatGHS(preset)}
            </button>
          ))}
        </div>

        <label className={cn("mt-3 block", labelClass)}>Amount (GHS)</label>
        <input
          type="number"
          min={5}
          max={50000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={cn("mt-1 w-full", inputClass)}
        />

        {paymentCode ? (
          <div className={cn("mt-3 space-y-2", codeBox)}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Your payment code
            </p>
            <div className="flex items-center gap-2">
              <p className="num flex-1 text-lg font-bold tracking-wider text-amber-800">{paymentCode}</p>
              <button
                type="button"
                onClick={() => void copyText(paymentCode, "Payment code")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-800"
                aria-label="Copy payment code"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className={codeHint}>
              Send <strong className={textStrong}>{formatGHS(generatedAmount ?? Number(amount))}</strong>{" "}
              and use <strong className="text-amber-700">{paymentCode}</strong> as the reference/memo.
            </p>
          </div>
        ) : null}

        <Button
          className="mt-3 w-full bg-gold text-navy-950 hover:bg-gold/90"
          disabled={generating}
          onClick={() => void generateCode()}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Payment Code"}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("h-px flex-1", divider)} />
        <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", dividerLabel)}>
          Or claim manually
        </span>
        <div className={cn("h-px flex-1", divider)} />
      </div>

      <div>
        <label className={labelClass}>
          Transaction ID <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Transaction ID from SMS"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className={cn(
            "mt-1.5 w-full uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal",
            inputClass,
          )}
        />
      </div>

      <div className="flex gap-2">
        {showCancel ? (
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "flex-1",
              isDark
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="button"
          className={cn("bg-gold text-navy-950 hover:bg-gold/90", showCancel ? "flex-1" : "w-full")}
          disabled={claiming || !txnId.trim()}
          onClick={() => void claimManually()}
        >
          {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
        </Button>
      </div>
    </div>
  );
}
