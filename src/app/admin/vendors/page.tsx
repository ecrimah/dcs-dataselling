import Link from "next/link";
import { CheckCircle2, Clock, ShieldAlert, Store } from "lucide-react";
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
    return <AdminConfigError />;
  }

  const vendors = await fetchAdminVendors();

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const other = vendors.filter(
    (v) => v.status !== "pending" && v.status !== "approved",
  );

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Vendor governance"
        description="Approve agents, monitor store health, and manage platform access."
        meta={`${vendors.length} vendors · ${pending.length} pending approval`}
        actions={
          pending.length > 0 ? (
            <Link href="/admin/kyc" className="susu-btn-gold">
              Review pending
            </Link>
          ) : undefined
        }
      />

      <AdminStatGrid className="lg:grid-cols-3">
        <AdminStatTile
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
          label="Approved"
          value={String(approved.length)}
          valueAccent="emerald"
        />
        <AdminStatTile
          icon={<Clock className="h-4 w-4" />}
          tone="amber"
          label="Pending"
          value={String(pending.length)}
        />
        <AdminStatTile
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="rose"
          label="Suspended / rejected"
          value={String(other.length)}
        />
      </AdminStatGrid>

      <AdminSection title="All vendors" description="Live stores and onboarding status." icon={Store}>
        {vendors.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title="No vendors yet"
            description="Agents appear here after they submit a store application."
          />
        ) : (
          <AdminDataTable minWidth="720px">
            <AdminTableHead>
              <AdminTh>Vendor</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Onboarding</AdminTh>
              <AdminTh>Orders</AdminTh>
              <AdminTh>Rating</AdminTh>
              <AdminTh>Actions</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {vendors.map((v) => (
                <AdminTr key={v.id}>
                  <AdminTd>
                    <p className="font-semibold text-foreground">{v.business_name}</p>
                    <p className="text-xs text-muted">/{v.slug}</p>
                  </AdminTd>
                  <AdminTd>
                    <Badge variant={STATUS_VARIANT[v.status]}>{v.status}</Badge>
                    {v.featured && (
                      <Badge className="ml-1" variant="default">
                        featured
                      </Badge>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <span className="text-xs capitalize text-muted">
                      {v.status === "approved" ? "Live" : v.kyc_status?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </AdminTd>
                  <AdminTd className="num">{formatCompact(v.total_orders)}</AdminTd>
                  <AdminTd>
                    <span className="num font-medium">{Number(v.rating).toFixed(1)}</span>
                    <span className="text-xs text-muted"> · ~{v.fulfilment_minutes}m</span>
                  </AdminTd>
                  <AdminTd>
                    <VendorActions
                      vendorId={v.id}
                      slug={v.slug}
                      status={v.status}
                      featured={v.featured}
                    />
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
