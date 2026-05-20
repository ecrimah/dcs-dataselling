import Link from "next/link";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
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
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  let orders: OrderRow[] = [];

  {
    const service = createServiceClient();
    const { data, error } = await service
      .from("orders")
      .select(
        `
        id, reference, recipient_phone, amount, status, payment_provider, created_at,
        vendors!inner ( business_name, slug ),
        bundles ( name )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">All orders</h2>
        <p className="mt-1 text-sm text-muted">{orders.length} recent orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted">No orders yet.</div>
      ) : (
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-left text-muted">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Bundle</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-mono text-xs font-semibold text-cyan-700 hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.vendor_name}</td>
                  <td className="px-4 py-3 text-muted">{o.bundle_name ?? "—"}</td>
                  <td className="px-4 py-3">{formatPhone(o.recipient_phone)}</td>
                  <td className="px-4 py-3 num font-medium">{formatGHS(o.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
