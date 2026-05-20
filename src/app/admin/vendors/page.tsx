import Link from "next/link";
import { fetchAdminVendors } from "@/lib/data/admin-queries";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCompact } from "@/lib/format";
import { VendorActions } from "./vendor-actions";
import type { VendorStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  VendorStatus,
  "success" | "warning" | "danger" | "neutral" | "default"
> = {
  approved: "success",
  pending: "warning",
  suspended: "danger",
  rejected: "danger",
};

export default async function AdminVendorsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const vendors = await fetchAdminVendors();

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const other = vendors.filter(
    (v) => v.status !== "pending" && v.status !== "approved",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vendor governance</h2>
          <p className="mt-1 text-sm text-muted">
            {vendors.length} vendors · {pending.length} pending approval
          </p>
        </div>
        <Link
          href="/admin/kyc"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-600"
        >
          KYC queue →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Approved" value={approved.length} />
        <Stat label="Pending" value={pending.length} />
        <Stat label="Suspended / rejected" value={other.length} />
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-left text-muted">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">KYC</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{v.business_name}</p>
                    <p className="text-xs text-muted">/{v.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
                    {v.featured && (
                      <Badge className="ml-1" variant="default">
                        featured
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-muted">
                      {v.kyc_status?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 num">{formatCompact(v.total_orders)}</td>
                  <td className="px-4 py-3">
                    <span className="num font-medium">{Number(v.rating).toFixed(1)}</span>
                    <span className="text-xs text-muted"> · ~{v.fulfilment_minutes}m</span>
                  </td>
                  <td className="px-4 py-3">
                    <VendorActions
                      vendorId={v.id}
                      slug={v.slug}
                      status={v.status}
                      featured={v.featured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-elevated px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="num mt-1 text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}
