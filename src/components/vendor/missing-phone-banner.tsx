import Link from "next/link";
import { PhoneOff } from "lucide-react";

/**
 * Shown in the vendor dashboard when an account has no phone number on file
 * (profile phone, MoMo, or WhatsApp). Without one we can't send wallet/order
 * SMS alerts, so we nudge them to add it.
 */
export function MissingPhoneBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4">
      <PhoneOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">Add a phone number for SMS alerts</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          You don&apos;t have a phone number on file, so we can&apos;t text you when your wallet is
          credited or an order is delivered. Add one to start receiving SMS alerts.
        </p>
      </div>
      <Link
        href="/vendor/dashboard/profile"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
      >
        Add phone
      </Link>
    </div>
  );
}
