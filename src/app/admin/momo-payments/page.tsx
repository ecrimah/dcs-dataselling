import { CheckCircle2, MessageCircle, Smartphone, Inbox } from "lucide-react";

import {
  AdminConfigError,
  AdminDataTable,
  AdminEmptyState,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
  AdminStatGrid,
  AdminStatTile,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { getMomoDirectConfig } from "@/lib/data/platform-config";
import { formatGHS } from "@/lib/format";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

import { ManualMatchControl } from "./manual-match-control";

export const dynamic = "force-dynamic";

type SmsRow = {
  id: string;
  raw_body: string;
  sender_id: string | null;
  network: string | null;
  transaction_id: string | null;
  amount: number | string | null;
  sender_name: string | null;
  sender_phone: string | null;
  reference_hint: string | null;
  received_at: string | null;
  matched_order_id: string | null;
  matched_at: string | null;
  parse_status: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  reference: string;
  amount: number | string;
  recipient_phone: string;
  payment_reference: string | null;
  created_at: string;
  vendors: { business_name: string } | { business_name: string }[] | null;
  bundles: { name: string } | { name: string }[] | null;
};

export default async function AdminMomoPaymentsPage() {
  if (!hasSupabaseConfig()) return <AdminConfigError />;

  const service = createServiceClient();
  const config = await getMomoDirectConfig();

  const [smsRes, pendingRes] = await Promise.all([
    service
      .from("momo_sms")
      .select(
        "id, raw_body, sender_id, network, transaction_id, amount, sender_name, sender_phone, reference_hint, received_at, matched_order_id, matched_at, parse_status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(150),
    service
      .from("orders")
      .select(
        "id, reference, amount, recipient_phone, payment_reference, created_at, vendors:vendor_id ( business_name ), bundles:bundle_id ( name )",
      )
      .eq("payment_provider", "momo_direct")
      .eq("status", "awaiting_momo")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const allSms = (smsRes.data ?? []) as SmsRow[];
  const pendingOrders = (pendingRes.data ?? []) as OrderRow[];

  const unmatched = allSms.filter(
    (r) => !r.matched_order_id && r.parse_status !== "manual",
  );
  const matched = allSms.filter((r) => r.matched_order_id);
  const totalAmount = allSms.reduce(
    (s, r) => s + (r.amount != null ? Number(r.amount) : 0),
    0,
  );

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="MoMo direct"
        description="Mobile-money confirmations forwarded by the SMS-forwarder phone, with auto + manual matching to pending orders."
        meta={
          config.enabled
            ? `Enabled · MTN ${config.merchantNumbers.mtn || "—"} · Telecel ${
                config.merchantNumbers.telecel || "—"
              } · AT ${config.merchantNumbers.at || "—"}`
            : "Disabled — enable in Settings"
        }
      />

      <AdminStatGrid>
        <AdminStatTile
          icon={<Inbox className="h-4 w-4" />}
          tone="sky"
          label="SMS received"
          value={String(allSms.length)}
        />
        <AdminStatTile
          icon={<MessageCircle className="h-4 w-4" />}
          tone="amber"
          label="Awaiting match"
          value={String(unmatched.length)}
        />
        <AdminStatTile
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
          label="Auto-matched"
          value={String(matched.length)}
        />
        <AdminStatTile
          icon={<Smartphone className="h-4 w-4" />}
          tone="gold"
          label="SMS amount"
          value={formatGHS(totalAmount)}
          valueAccent="gold"
        />
      </AdminStatGrid>

      <AdminSection
        title="Unmatched SMS"
        description="Confirmations we received but couldn't auto-match. Match them to a pending order from this queue."
        icon={Inbox}
      >
        {unmatched.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title="Inbox clear"
            description="Every forwarded SMS has been matched to an order."
          />
        ) : (
          <AdminDataTable minWidth="960px">
            <AdminTableHead>
              <AdminTh>When</AdminTh>
              <AdminTh>Network</AdminTh>
              <AdminTh>Txn ID</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Sender</AdminTh>
              <AdminTh>Reference hint</AdminTh>
              <AdminTh>Raw body</AdminTh>
              <AdminTh>Match</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {unmatched.map((row) => (
                <AdminTr key={row.id}>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </AdminTd>
                  <AdminTd>
                    <Badge variant="neutral">
                      {(row.network ?? "?").toUpperCase()}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="num font-mono text-xs font-semibold">
                    {row.transaction_id ?? <span className="text-rose-600">unparsed</span>}
                  </AdminTd>
                  <AdminTd className="num font-semibold">
                    {row.amount != null ? formatGHS(Number(row.amount)) : "—"}
                  </AdminTd>
                  <AdminTd className="text-xs">
                    {row.sender_name ?? "—"}
                    {row.sender_phone ? (
                      <div className="text-muted">{row.sender_phone}</div>
                    ) : null}
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {row.reference_hint ?? "—"}
                  </AdminTd>
                  <AdminTd className="max-w-[260px] text-[11px] text-muted">
                    <span className="block truncate" title={row.raw_body}>
                      {row.raw_body}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    <ManualMatchControl smsId={row.id} pendingOrders={pendingOrders.map((o) => {
                      const v = Array.isArray(o.vendors) ? o.vendors[0] : o.vendors;
                      const b = Array.isArray(o.bundles) ? o.bundles[0] : o.bundles;
                      return {
                        id: o.id,
                        reference: o.reference,
                        amount: Number(o.amount),
                        recipient: o.recipient_phone,
                        vendor: v?.business_name ?? "—",
                        bundle: b?.name ?? "—",
                      };
                    })} />
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>

      <AdminSection
        title="Recently matched"
        description="Successfully auto-matched or admin-matched payments."
        icon={CheckCircle2}
      >
        {matched.length === 0 ? (
          <AdminEmptyState
            icon={CheckCircle2}
            title="No matches yet"
            description="Once an SMS lands and matches a pending order, it will appear here."
          />
        ) : (
          <AdminDataTable minWidth="780px">
            <AdminTableHead>
              <AdminTh>When</AdminTh>
              <AdminTh>Network</AdminTh>
              <AdminTh>Txn ID</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Order</AdminTh>
              <AdminTh>Matched at</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {matched.slice(0, 50).map((row) => (
                <AdminTr key={row.id}>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </AdminTd>
                  <AdminTd>
                    <Badge variant="neutral">
                      {(row.network ?? "?").toUpperCase()}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="num font-mono text-xs">
                    {row.transaction_id ?? "—"}
                  </AdminTd>
                  <AdminTd className="num font-semibold">
                    {row.amount != null ? formatGHS(Number(row.amount)) : "—"}
                  </AdminTd>
                  <AdminTd className="font-mono text-xs">
                    {row.matched_order_id?.slice(0, 8) ?? "—"}
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {row.matched_at
                      ? formatDistanceToNow(new Date(row.matched_at), { addSuffix: true })
                      : "—"}
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>
    </AdminPageRoot>
  );
}
