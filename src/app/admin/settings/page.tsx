import Link from "next/link";
import {
  Cable,
  Database,
  MessageSquare,
  Package,
  Settings,
  Store,
} from "lucide-react";
import {
  AdminIntegrationList,
  AdminIntegrationRow,
  AdminKvList,
  AdminKvRow,
  AdminPageIntro,
  AdminPageRoot,
  AdminQuickLink,
  AdminQuickLinks,
  AdminSection,
} from "@/components/admin";
import { SITE } from "@/lib/constants";
import { isArkeselConfigured } from "@/lib/notifications/arkesel";
import { isSkanka5Configured } from "@/lib/suppliers/skanka5";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const supabaseOk = hasSupabaseConfig();
  const paystackOk = Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_"));
  const arkeselOk = isArkeselConfigured();
  const skanka5Ok = isSkanka5Configured();
  const skanka5WebhookOk = Boolean(process.env.SKANKA5_WEBHOOK_SECRET);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Platform config"
        description="Brand identity, integration health, and admin shortcuts."
        meta={`${[supabaseOk, paystackOk, arkeselOk, skanka5Ok].filter(Boolean).length}/4 core integrations connected`}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminSection title="Brand" description="Public-facing platform identity." icon={Settings}>
          <AdminKvList>
            <AdminKvRow label="Platform name" value={SITE.name} />
            <AdminKvRow label="Domain" value={SITE.domain} />
            <AdminKvRow label="Public URL" value={SITE.url} />
            <AdminKvRow label="Support email" value={SITE.supportEmail} />
            <AdminKvRow label="Support WhatsApp" value={SITE.supportWhatsApp} />
          </AdminKvList>
        </AdminSection>

        <AdminSection
          title="Integrations"
          description="Environment-driven services — configure via .env.local or Vercel."
          icon={Cable}
        >
          <AdminIntegrationList>
            <AdminIntegrationRow label="Supabase" ok={supabaseOk} />
            <AdminIntegrationRow
              label="Paystack"
              ok={paystackOk}
              hint="Set PAYSTACK_SECRET_KEY in .env.local"
            />
            <AdminIntegrationRow
              label="Arkesel SMS"
              ok={arkeselOk}
              hint="Set ARKESEL_API_KEY and ARKESEL_SENDER_ID"
            />
            <AdminIntegrationRow
              label="Skanka5 supplier"
              ok={skanka5Ok}
              hint="Set SKANKA5_API_KEY and SKANKA5_NETWORK_ID_MTN"
            />
            <AdminIntegrationRow
              label="Skanka5 webhook signing"
              ok={skanka5WebhookOk}
              hint="Set SKANKA5_WEBHOOK_SECRET to verify supplier callbacks"
            />
          </AdminIntegrationList>
        </AdminSection>
      </div>

      <AdminSection title="Quick links" description="Jump to operational admin tools." icon={Database}>
        <AdminQuickLinks>
          <AdminQuickLink href="/admin/wholesale" icon={Package} label="Wholesale catalogue" />
          <AdminQuickLink href="/admin/vendors" icon={Store} label="Vendor governance" />
          <AdminQuickLink href="/admin/sms-debugger" icon={MessageSquare} label="SMS debugger" />
          <AdminQuickLink href="/admin/supplier" icon={Cable} label="Supplier (Skanka5) console" />
        </AdminQuickLinks>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Payment keys and service role secrets are managed via environment variables only — never
          commit <code className="rounded bg-slate-100 px-1">.env.local</code>.{" "}
          <Link href="/admin/supplier" className="font-semibold text-amber-800 hover:underline">
            Open supplier console
          </Link>{" "}
          for env var diagnostics.
        </p>
      </AdminSection>
    </AdminPageRoot>
  );
}
