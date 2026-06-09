"use client";

import Link from "next/link";
import { formatGHS } from "@/lib/format";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
  sessionEmail?: string;
  setupFeeGhs: number;
}

export function StepReview({ form, update, sessionEmail, setupFeeGhs }: Props) {
  const feeRequired = setupFeeGhs > 0;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">One last check</h2>
        <p className="mt-1 text-sm text-muted">
          Review your details, then submit to launch your storefront.
        </p>
      </div>

      <dl className="space-y-2 rounded-xl border border-border bg-slate-50 p-4 text-sm">
        <Row label="Login email" value={sessionEmail ?? form.accountEmail} />
        <Row label="Store" value={form.businessName} />
        <Row label="Handle" value={`/vendor/${form.slug}`} />
        <Row label="MoMo" value={`${form.momoNetwork.toUpperCase()} · ${form.momoNumber}`} />
        <Row
          label="Setup fee"
          value={
            !feeRequired
              ? "Free (no fee)"
              : form.setupFeePaid
                ? `Paid ${formatGHS(setupFeeGhs)}`
                : "Not paid"
          }
        />
      </dl>

      {feeRequired && !form.setupFeePaid && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800">
          Go back to the Store fee step and complete payment before submitting.
        </p>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm">
        <input
          type="checkbox"
          checked={form.agreedToTerms}
          onChange={(e) => update("agreedToTerms", e.target.checked)}
          className="mt-0.5 rounded border-border text-cyan-600 focus:ring-cyan-500"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-cyan-600 hover:underline">
            DCS Vendor Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-cyan-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-xs text-muted">
        <p className="font-medium text-cyan-700">What happens next?</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Your store goes live on DCS ELITE</li>
          <li>Open your dashboard and pick bundles from the wholesale catalogue</li>
          <li>Set markups, share your link, and start earning</li>
        </ol>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
