import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { DisputeActions } from "./dispute-actions";

export const dynamic = "force-dynamic";

interface DisputeRow {
  id: string;
  order_id: string;
  order_reference: string;
  reason: string;
  status: string;
  resolution: string | null;
  created_at: string;
}

export default async function AdminDisputesPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  let disputes: DisputeRow[] = [];

  {
    const service = createServiceClient();
    const { data, error } = await service
      .from("disputes")
      .select(
        `
        id, order_id, reason, status, resolution, created_at,
        orders ( reference )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      disputes = data.map((row) => {
        const r = row as {
          id: string;
          order_id: string;
          reason: string;
          status: string;
          resolution: string | null;
          created_at: string;
          orders: { reference: string } | { reference: string }[] | null;
        };
        const orderRef = Array.isArray(r.orders)
          ? r.orders[0]?.reference
          : r.orders?.reference;
        return {
          id: r.id,
          order_id: r.order_id,
          order_reference: orderRef ?? r.order_id.slice(0, 8),
          reason: r.reason,
          status: r.status,
          resolution: r.resolution,
          created_at: r.created_at,
        };
      });
    }
  }

  const open = disputes.filter((d) => d.status === "open");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Disputes</h2>
        <p className="mt-1 text-sm text-muted">
          {open.length} open · {disputes.length} total
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted">No disputes.</div>
      ) : (
        <ul className="space-y-3">
          {disputes.map((d) => (
            <li key={d.id} className="card-elevated p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-cyan-700">
                    {d.order_reference}
                  </p>
                  <p className="mt-1 text-sm font-medium">{d.reason}</p>
                  {d.resolution && (
                    <p className="mt-2 text-xs text-muted">
                      <span className="font-semibold">Resolution:</span> {d.resolution}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={d.status === "open" ? "warning" : "success"}>
                  {d.status}
                </Badge>
              </div>
              {d.status === "open" && <DisputeActions disputeId={d.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
