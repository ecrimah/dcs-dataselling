"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatGHS } from "@/lib/format";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
  setupFeeGhs: number;
}

export function StepSetupFee({ form, update, setupFeeGhs }: Props) {
  const [paying, setPaying] = useState(false);
  const fee = setupFeeGhs;

  // Admin has turned the setup fee off — store creation is free.
  if (fee <= 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Store setup fee</h2>
          <p className="mt-1 text-sm text-muted">
            Good news — there&apos;s no setup fee right now. Your store is free to create.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">No payment required</p>
            <p className="mt-1 text-muted">Tap Continue to review your details and submit.</p>
          </div>
        </div>
      </div>
    );
  }

  async function handlePay() {
    if (form.businessName.trim().length < 3 || form.slug.trim().length < 3) {
      toast.error("Complete store identity first");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/vendor/setup-fee/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          businessName: form.businessName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");

      update("setupFeeReference", data.reference);
      window.location.href = data.authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setPaying(false);
    }
  }

  if (form.setupFeePaid) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Store setup fee</h2>
          <p className="mt-1 text-sm text-muted">Payment received — you can continue to final review.</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">Paid {formatGHS(fee)}</p>
            <p className="mt-1 text-muted">
              Reference: <span className="font-mono text-xs">{form.setupFeeReference}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Store setup fee</h2>
        <p className="mt-1 text-sm text-muted">
          Pay the one-time activation fee to unlock your vendor application. This is required before
          you submit and access your dashboard tools.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Activation fee</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatGHS(fee)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
            <CreditCard className="h-6 w-6 text-cyan-600" />
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-xs text-muted">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
            Secure MoMo or card via Paystack
          </li>
          <li>· Store handle: /store/{form.slug || "your-handle"}</li>
          <li>· Non-refundable once your application is submitted</li>
        </ul>
      </div>

      <Button className="w-full" onClick={handlePay} disabled={paying}>
        {paying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to Paystack…
          </>
        ) : (
          <>
            Pay {formatGHS(fee)} with MoMo
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted">
        You&apos;ll return here automatically after payment. Then continue to review and submit.
      </p>
    </div>
  );
}
