import Link from "next/link";
import { CreditCard, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { fetchAdminCustomerPayments } from "@/lib/data/admin-queries";
import { fetchAdminWalletLedger } from "@/lib/data/admin-agent-ops";
import { formatGHS, formatPhone } from "@/lib/format";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import type { OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ENTRY_LABEL: Record<string, string> = {
  topup: "Top-up",
  order_debit: "Order debit",
  refund: "Refund",
  adjustment: "Adjustment",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "success" | "warning" | "danger" | "neutral" | "default"
> = {
  fulfilled: "success",
  paid: "default",
  queued: "warning",
  processing: "warning",
  pending: "neutral",
  failed: "danger",
  refunded: "danger",
};

export default async function AdminTransactionsPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  const [customerPayments, walletLedger] = await Promise.all([
    fetchAdminCustomerPayments(100),
    fetchAdminWalletLedger(100),
  ]);

  const customerTotal = customerPayments.reduce((s, r) => s + r.amount, 0);
  const platformFees = customerPayments.reduce((s, r) => s + r.platform_fee, 0);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Money movement"
        description="Customer checkout payments (Paystack / MoMo) and agent wallet activity in one ledger."
        meta={`${customerPayments.length} payments · ${walletLedger.length} wallet entries`}
      />

      <AdminStatGrid>
        <AdminStatTile
          icon={<CreditCard className="h-4 w-4" />}
          tone="sky"
          label="Customer payments"
          value={String(customerPayments.length)}
        />
        <AdminStatTile
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
          label="Checkout volume"
          value={formatGHS(customerTotal)}
          valueAccent="emerald"
        />
        <AdminStatTile
          icon={<CreditCard className="h-4 w-4" />}
          tone="gold"
          label="Platform fees"
          value={formatGHS(platformFees)}
          valueAccent="gold"
        />
        <AdminStatTile
          icon={<Wallet className="h-4 w-4" />}
          tone="violet"
          label="Wallet entries"
          value={String(walletLedger.length)}
        />
      </AdminStatGrid>

      <AdminSection
        title="Customer payments"
        description="Storefront checkout via Paystack — these feed GMV on the dashboard."
        icon={CreditCard}
        actions={
          <Link href="/admin/orders" className="susu-btn-ghost text-xs">
            View all orders
          </Link>
        }
      >
        {customerPayments.length === 0 ? (
          <AdminEmptyState
            icon={CreditCard}
            title="No customer payments yet"
            description="Orders appear here once a buyer checks out on a vendor store."
          />
        ) : (
          <AdminDataTable minWidth="900px">
            <AdminTableHead>
              <AdminTh>Reference</AdminTh>
              <AdminTh>Store</AdminTh>
              <AdminTh>Bundle</AdminTh>
              <AdminTh>Recipient</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Platform fee</AdminTh>
              <AdminTh>Provider</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>When</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {customerPayments.map((row) => (
                <AdminTr key={row.id}>
                  <AdminTd>
                    <Link
                      href={`/orders/${row.id}`}
                      className="font-mono text-xs font-semibold text-amber-700 hover:underline"
                    >
                      {row.reference}
                    </Link>
                  </AdminTd>
                  <AdminTd className="font-medium">{row.vendor_name}</AdminTd>
                  <AdminTd className="text-muted">{row.bundle_name ?? "—"}</AdminTd>
                  <AdminTd>{formatPhone(row.recipient_phone)}</AdminTd>
                  <AdminTd className="num font-semibold">{formatGHS(row.amount)}</AdminTd>
                  <AdminTd className="num text-muted">{formatGHS(row.platform_fee)}</AdminTd>
                  <AdminTd className="capitalize text-muted">
                    {row.payment_provider ?? "—"}
                  </AdminTd>
                  <AdminTd>
                    <Badge variant={STATUS_VARIANT[row.status as OrderStatus] ?? "neutral"}>
                      {row.status}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>

      <AdminSection
        title="Agent wallet activity"
        description="Top-ups, wholesale debits, and adjustments across all agents."
        icon={Wallet}
      >
        {walletLedger.length === 0 ? (
          <AdminEmptyState
            icon={Wallet}
            title="No wallet activity yet"
            description="Entries appear when agents top up or buy wholesale data."
          />
        ) : (
          <AdminDataTable minWidth="760px">
            <AdminTableHead>
              <AdminTh>Agent</AdminTh>
              <AdminTh>Type</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Balance after</AdminTh>
              <AdminTh>Reference</AdminTh>
              <AdminTh>When</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {walletLedger.map((row) => (
                <AdminTr key={row.id}>
                  <AdminTd className="font-medium">{row.vendor_name}</AdminTd>
                  <AdminTd>
                    <Badge variant={row.entry_type === "topup" ? "success" : "neutral"}>
                      {ENTRY_LABEL[row.entry_type] ?? row.entry_type}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="num font-semibold">
                    {row.amount >= 0 ? "+" : ""}
                    {formatGHS(row.amount)}
                  </AdminTd>
                  <AdminTd className="num text-muted">
                    {row.balance_after != null ? formatGHS(row.balance_after) : "—"}
                  </AdminTd>
                  <AdminTd className="font-mono text-xs text-muted">
                    {row.reference ?? row.note ?? "—"}
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
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
