import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { fetchAdminWholesaleOrders } from "@/lib/data/admin-agent-ops";
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
import { formatGHS, formatPhone } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import type { OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  reference: string;
  recipient_phone: string;
  amount: number;
  status: OrderStatus;
  payment_provider: string | null;
  created_at: string;
  vendor_name: string;
  vendor_slug: string;
  bundle_name: string | null;
}

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

export default async function AdminOrdersPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  let orders: OrderRow[] = [];
  let wholesaleOrders: Awaited<ReturnType<typeof fetchAdminWholesaleOrders>> = [];

  {
    const service = createServiceClient();
    const [customerData, wholesale] = await Promise.all([
      service
        .from("orders")
        .select(
          `
        id, reference, recipient_phone, amount, status, payment_provider, created_at,
        vendors!inner ( business_name, slug ),
        bundles ( name )
      `,
        )
        .order("created_at", { ascending: false })
        .limit(100),
      fetchAdminWholesaleOrders(50),
    ]);

    wholesaleOrders = wholesale;

    const { data, error } = customerData;

    if (!error && data) {
      orders = data.map((row) => {
        const r = row as {
          id: string;
          reference: string;
          recipient_phone: string;
          amount: number;
          status: OrderStatus;
          payment_provider: string | null;
          created_at: string;
          vendors: { business_name: string; slug: string } | { business_name: string; slug: string }[];
          bundles: { name: string } | { name: string }[] | null;
        };
        const vendor = Array.isArray(r.vendors) ? r.vendors[0] : r.vendors;
        const bundle = Array.isArray(r.bundles) ? r.bundles[0] : r.bundles;
        return {
          id: r.id,
          reference: r.reference,
          recipient_phone: r.recipient_phone,
          amount: Number(r.amount),
          status: r.status,
          payment_provider: r.payment_provider,
          created_at: r.created_at,
          vendor_name: vendor?.business_name ?? "—",
          vendor_slug: vendor?.slug ?? "",
          bundle_name: bundle?.name ?? null,
        };
      });
    }
  }

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Order pipeline"
        description="Agent supply orders and customer storefront checkout — mirrors the vendor orders view."
        meta={`${wholesaleOrders.length} wholesale · ${orders.length} customer orders`}
      />

      <AdminStatGrid>
        <AdminStatTile
          icon={<Package className="h-4 w-4" />}
          tone="sky"
          label="Wholesale"
          value={String(wholesaleOrders.length)}
          hint="Agents → DCS"
        />
        <AdminStatTile
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="gold"
          label="Customer"
          value={String(orders.length)}
          hint="Storefront checkout"
        />
      </AdminStatGrid>

      <AdminSection
        title="Wholesale orders"
        description="Agents purchasing data bundles from the DCS catalogue."
        icon={Package}
      >
        {wholesaleOrders.length === 0 ? (
          <AdminEmptyState
            icon={Package}
            title="No wholesale orders yet"
            description="Orders appear when agents buy bundles from the wholesale checkout."
          />
        ) : (
          <AdminDataTable minWidth="720px">
            <AdminTableHead>
              <AdminTh>Reference</AdminTh>
              <AdminTh>Agent</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Lines</AdminTh>
              <AdminTh>Source</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>When</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {wholesaleOrders.map((o) => (
                <AdminTr key={o.id}>
                  <AdminTd className="font-mono text-xs font-semibold">{o.reference}</AdminTd>
                  <AdminTd>{o.vendor_name}</AdminTd>
                  <AdminTd className="num font-medium">{formatGHS(o.total_amount)}</AdminTd>
                  <AdminTd>{o.item_count}</AdminTd>
                  <AdminTd className="capitalize text-muted">{o.source}</AdminTd>
                  <AdminTd>
                    <Badge variant={o.status === "fulfilled" ? "success" : "warning"}>
                      {o.status}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>

      <AdminSection
        title="Customer orders"
        description="Buyers checking out on agent storefronts via Paystack."
        icon={ShoppingBag}
      >
        {orders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title="No customer orders yet"
            description="Orders appear once a buyer completes checkout on a vendor store."
          />
        ) : (
          <AdminDataTable minWidth="800px">
            <AdminTableHead>
              <AdminTh>Reference</AdminTh>
              <AdminTh>Vendor</AdminTh>
              <AdminTh>Bundle</AdminTh>
              <AdminTh>Recipient</AdminTh>
              <AdminTh>Amount</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>When</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {orders.map((o) => (
                <AdminTr key={o.id}>
                  <AdminTd>
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-mono text-xs font-semibold text-amber-700 hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </AdminTd>
                  <AdminTd>{o.vendor_name}</AdminTd>
                  <AdminTd className="text-muted">{o.bundle_name ?? "—"}</AdminTd>
                  <AdminTd>{formatPhone(o.recipient_phone)}</AdminTd>
                  <AdminTd className="num font-medium">{formatGHS(o.amount)}</AdminTd>
                  <AdminTd>
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </AdminTd>
                  <AdminTd className="text-xs text-muted">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
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
