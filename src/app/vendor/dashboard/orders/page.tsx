import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";
import {
  AdminEmptyState,
  AdminList,
  AdminListItem,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
  AdminStatGrid,
  AdminStatTile,
} from "@/components/admin";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { Badge } from "@/components/ui/badge";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorWholesaleOrders } from "@/lib/payments/wholesale-order";
import { formatDataAmount, formatGHS, formatPhone } from "@/lib/format";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchCustomerOrders(vendorId: string) {
  if (!hasSupabaseConfig()) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("orders")
    .select("id, reference, recipient_phone, amount, status, created_at, bundle_id")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as {
    id: string;
    reference: string;
    recipient_phone: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "default",
  queued: "default",
  processing: "default",
  fulfilled: "success",
  failed: "danger",
  cancelled: "neutral",
};

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; ref?: string }>;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  if (!vendor.setupFeePaidAt) {
    return <SetupFeeGate />;
  }

  const params = await searchParams;
  const [wholesaleOrders, customerOrders] = await Promise.all([
    fetchVendorWholesaleOrders(vendor.id),
    fetchCustomerOrders(vendor.id),
  ]);

  return (
    <AdminPageRoot>
      {params.paid === "1" && (
        <div className="banner-success">
          <span className="banner-icon">
            <Package className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h4>Payment received</h4>
            <p>
              {params.ref ? `Ref ${params.ref} — ` : ""}Your order is queued for fulfilment.
            </p>
          </div>
        </div>
      )}

      <AdminPageIntro
        badge="Order history"
        description="Wholesale supply orders you placed with DCS, and customer orders through your store."
        meta={`${wholesaleOrders.length} wholesale · ${customerOrders.length} customer orders`}
        actions={
          <Link href="/vendor/dashboard/wholesale" className="susu-btn-gold">
            Place new order
          </Link>
        }
      />

      <AdminStatGrid className="lg:grid-cols-2">
        <AdminStatTile
          icon={<Package className="h-4 w-4" />}
          tone="sky"
          label="Wholesale orders"
          value={String(wholesaleOrders.length)}
        />
        <AdminStatTile
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="gold"
          label="Customer orders"
          value={String(customerOrders.length)}
        />
      </AdminStatGrid>

      <AdminSection title="Wholesale orders" description="You → DCS supply purchases." icon={Package}>
        {wholesaleOrders.length === 0 ? (
          <AdminEmptyState
            icon={Package}
            title="No wholesale orders yet"
            description="Buy data bundles from the DCS catalogue to start selling."
            action={
              <Link href="/vendor/dashboard/wholesale" className="susu-btn-gold">
                Buy data
              </Link>
            }
          />
        ) : (
          <AdminList>
            {wholesaleOrders.map((order) => (
              <AdminListItem key={order.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <p className="font-semibold">{order.reference}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()} · {order.itemCount} line
                      {order.itemCount === 1 ? "" : "s"} · {order.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{order.status}</Badge>
                    <p className="num font-bold">{formatGHS(order.totalAmount)}</p>
                  </div>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        {formatPhone(item.phone)} · {item.bundleName}{" "}
                        <span className="text-muted">({formatDataAmount(item.dataMb)})</span>
                        {item.quantity > 1 && (
                          <span className="text-muted"> × {item.quantity}</span>
                        )}
                      </span>
                      <span className="text-xs text-muted">{item.status}</span>
                    </li>
                  ))}
                </ul>
              </AdminListItem>
            ))}
          </AdminList>
        )}
      </AdminSection>

      <AdminSection title="Customer orders" description="Buyers checking out on your storefront." icon={ShoppingBag}>
        {customerOrders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title="No customer orders yet"
            description="Share your storefront link to start selling."
            action={
              <Link href="/vendor/dashboard/storefront" className="susu-btn-ghost">
                Open storefront
              </Link>
            }
          />
        ) : (
          <AdminList>
            {customerOrders.map((o) => (
              <AdminListItem key={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{o.reference}</p>
                    <p className="text-xs text-muted">
                      {formatPhone(o.recipient_phone)} · {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "neutral"}>{o.status}</Badge>
                    <span className="num text-sm font-bold">{formatGHS(Number(o.amount))}</span>
                  </div>
                </div>
              </AdminListItem>
            ))}
          </AdminList>
        )}
      </AdminSection>
    </AdminPageRoot>
  );
}
