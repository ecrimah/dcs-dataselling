import Link from "next/link";
import { SITE } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const supabaseOk = hasSupabaseConfig();
  const paystackOk = Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_"));
  const moolreOk = Boolean(process.env.MOOLRE_API_KEY && process.env.MOOLRE_API_KEY !== "your-moolre-api-key");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-muted">Platform configuration and integrations</p>
      </div>

      <section className="card-elevated p-5">
        <h3 className="font-semibold">Brand</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Platform name" value={SITE.name} />
          <Row label="Domain" value={SITE.domain} />
          <Row label="Public URL" value={SITE.url} />
          <Row label="Support email" value={SITE.supportEmail} />
          <Row label="Support WhatsApp" value={SITE.supportWhatsApp} />
        </dl>
      </section>

      <section className="card-elevated p-5">
        <h3 className="font-semibold">Integrations</h3>
        <ul className="mt-4 space-y-2 text-sm">
          <StatusRow label="Supabase" ok={supabaseOk} />
          <StatusRow label="Paystack" ok={paystackOk} hint="Set PAYSTACK_SECRET_KEY in .env.local" />
          <StatusRow label="Moolre" ok={moolreOk} hint="Set MOOLRE_API_KEY in .env.local" />
        </ul>
      </section>

      <section className="card-elevated p-5">
        <h3 className="font-semibold">Quick links</h3>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-cyan-700">
          <li>
            <Link href="/admin/wholesale" className="hover:underline">
              Wholesale catalogue →
            </Link>
          </li>
          <li>
            <Link href="/admin/vendors" className="hover:underline">
              Vendor governance →
            </Link>
          </li>
          <li>
            <Link href="/marketplace" className="hover:underline">
              Public marketplace →
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted">
          Payment keys and service role secrets are managed via environment variables only —
          never commit <code className="rounded bg-slate-100 px-1">.env.local</code>.
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/50 pb-3 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span
        className={`text-xs font-bold uppercase tracking-wider ${
          ok ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {ok ? "Connected" : "Not configured"}
      </span>
      {!ok && hint && <span className="w-full text-xs text-muted">{hint}</span>}
    </li>
  );
}
