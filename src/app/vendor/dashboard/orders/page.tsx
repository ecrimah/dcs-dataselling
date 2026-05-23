import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-3xl space-y-8 text-foreground">
      {params.paid === "1" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          Payment received{params.ref ? ` — ref ${params.ref}` : ""}. Your order is queued for
          fulfilment.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Orders</h2>
          <p className="mt-1 text-sm text-muted">
            Wholesale supply orders you placed with DCS, and customer orders through your store.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/vendor/dashboard/wholesale">Place new order</Link>
        </Button>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
          Wholesale orders (you → DCS)
        </h3>
        {wholesaleOrders.length === 0 ? (
          <div className="card-elevated py-10 text-center text-sm text-muted">
            No wholesale orders yet.{" "}
            <Link href="/vendor/dashboard/wholesale" className="font-semibold text-gold-dark hover:underline">
              Buy data
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {wholesaleOrders.map((order) => (
              <li key={order.id} className="card-elevated overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold">{order.reference}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()} · {order.itemCount} line
                      {order.itemCount === 1 ? "" : "s"} · {order.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>
                      {order.status}
                    </Badge>
                    <p className="num font-bold">{formatGHS(order.totalAmount)}</p>
                  </div>
                </div>
                <ul className="divide-y divide-border px-4 py-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
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
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
          Customer orders (your store)
        </h3>
        {customerOrders.length === 0 ? (
          <div className="card-elevated py-10 text-center text-sm text-muted">
            No customer orders yet. Share your storefront link to start selling.
          </div>
        ) : (
          <ul className="space-y-2">
            {customerOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
              >
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
