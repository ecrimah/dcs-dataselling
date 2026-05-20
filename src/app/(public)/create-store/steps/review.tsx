"use client";

import Link from "next/link";
import { formatGHS } from "@/lib/format";
import { VENDOR_STORE_SETUP_FEE_GHS } from "@/lib/constants";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
  sessionEmail?: string;
}

export function StepReview({ form, update, sessionEmail }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">One last check</h2>
        <p className="mt-1 text-sm text-muted">
          Review your details. After submitting, our compliance team will verify within 24 hours.
        </p>
      </div>

      <dl className="space-y-2 rounded-xl border border-border bg-slate-50 p-4 text-sm">
        <Row label="Login email" value={sessionEmail ?? form.accountEmail} />
        <Row label="Store" value={form.businessName} />
        <Row label="Handle" value={`/vendor/${form.slug}`} />
        <Row label="MoMo" value={`${form.momoNetwork.toUpperCase()} · ${form.momoNumber}`} />
        <Row label="Ghana Card" value={form.ghanaCardNumber} />
        <Row
          label="Documents"
          value={`${[form.ghanaCardFront, form.ghanaCardBack, form.selfie].filter(Boolean).length}/3 uploaded`}
        />
        <Row
          label="Setup fee"
          value={form.setupFeePaid ? `Paid ${formatGHS(VENDOR_STORE_SETUP_FEE_GHS)}` : "Not paid"}
        />
      </dl>

      {!form.setupFeePaid && (
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
          I confirm the documents are mine and agree to the{" "}
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
          <li>Our team verifies your KYC (max 24h)</li>
          <li>You unlock your storefront + catalogue editor</li>
          <li>Set markups, share your link, start earning</li>
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
