import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { fetchAdminOverview } from "@/lib/data/admin-queries";
import { Badge } from "@/components/ui/badge";
import { formatGHS, formatPhone } from "@/lib/format";
import { QueueActions } from "./queue-actions";

export const dynamic = "force-dynamic";

interface QueueRow {
  id: string;
  reference: string;
  recipient_phone: string;
  amount: number;
  status: string;
  vendor_name: string;
  waiting_minutes: number;
}

export default async function AdminOperationsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const metrics = await fetchAdminOverview();
  let queue: QueueRow[] = [];

  {
    const service = createServiceClient();
    const { data } = await service
      .from("orders")
      .select(
        `
        id, reference, recipient_phone, amount, status, created_at,
        vendors!inner ( business_name )
      `,
      )
      .in("status", ["paid", "queued", "processing"])
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) {
      queue = data.map((row) => {
        const r = row as {
          id: string;
          reference: string;
          recipient_phone: string;
          amount: number;
          status: string;
          created_at: string;
          vendors: { business_name: string } | { business_name: string }[];
        };
        const vendorName = Array.isArray(r.vendors)
          ? r.vendors[0]?.business_name
          : r.vendors.business_name;
        const waiting = Math.max(
          0,
          Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000),
        );
        return {
          id: r.id,
          reference: r.reference,
          recipient_phone: r.recipient_phone,
          amount: Number(r.amount),
          status: r.status,
          vendor_name: vendorName ?? "Vendor",
          waiting_minutes: waiting,
        };
      });
    }
  }

  const successRate = metrics?.successRate ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Operations</h2>
        <p className="mt-1 text-sm text-muted">
          Fulfilment queue and live platform health
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Queue depth" value={String(queue.length)} />
        <Metric label="Orders today" value={String(metrics?.ordersToday ?? 0)} />
        <Metric label="Fulfilled today" value={String(metrics?.ordersFulfilledToday ?? 0)} />
        <Metric label="Success rate" value={`${successRate}%`} />
      </div>

      <div className="card-elevated p-5">
        <h3 className="font-semibold">Fulfilment queue</h3>
        <p className="mt-1 text-xs text-muted">
          Orders awaiting vendor fulfilment or manual intervention
        </p>

        {queue.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">Queue is clear.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-slate-50/50 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-xs font-bold">{item.reference}</p>
                  <p className="text-sm text-foreground">
                    {item.vendor_name} · {formatGHS(item.amount)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatPhone(item.recipient_phone)} · waiting {item.waiting_minutes}m
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{item.status}</Badge>
                  <QueueActions orderId={item.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-elevated px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="num mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
