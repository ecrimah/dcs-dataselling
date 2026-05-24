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
import { getAgentTierSettings } from "@/lib/data/tier-settings";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatTierRolesSummary } from "@/lib/vendor/tier-rules";
import { getTierConfigFromSettings, VENDOR_TIERS } from "@/lib/vendor/tiers";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatGHS } from "@/lib/format";
import { RecalculateTiersButton } from "./recalculate-tiers-button";
import { TierRolesEditor } from "./tier-roles-editor";
import { VendorActions } from "./vendor-actions";
import type { VendorStatus, VendorTier } from "@/types";

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

const TIER_VARIANT: Record<VendorTier, "neutral" | "default" | "success"> = {
  starter: "neutral",
  verified: "default",
  pro: "success",
};

export default async function AdminVendorsPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  const [vendors, tierSettings] = await Promise.all([
    fetchAdminVendors(),
    getAgentTierSettings(),
  ]);

  const pending = vendors.filter((v) => v.status === "pending");
  const approved = vendors.filter((v) => v.status === "approved");
  const other = vendors.filter(
    (v) => v.status !== "pending" && v.status !== "approved",
  );
  const proCount = vendors.filter((v) => v.tier === "pro").length;
  const superCount = vendors.filter((v) => v.tier === "verified").length;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Vendor governance"
        description="Approve agents, assign roles, and manage platform access."
        meta={`${vendors.length} vendors · ${pending.length} pending approval`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RecalculateTiersButton />
            {pending.length > 0 ? (
              <Link href="/admin/kyc" className="susu-btn-gold">
                Review pending
              </Link>
            ) : null}
          </div>
        }
      />

      <AdminStatGrid className="lg:grid-cols-5">
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
        <AdminStatTile
          icon={<Store className="h-4 w-4" />}
          tone="sky"
          label="Super Agents"
          value={String(superCount)}
        />
        <AdminStatTile
          icon={<Store className="h-4 w-4" />}
          tone="emerald"
          label="Pro Agents"
          value={String(proCount)}
          valueAccent="emerald"
        />
      </AdminStatGrid>

      <AdminSection
        title="Agent role pricing"
        description="Set platform fee, rewards, and promotion thresholds for each agent role."
      >
        <TierRolesEditor initialSettings={tierSettings} />
      </AdminSection>

      <AdminSection title="Role summary" description={formatTierRolesSummary(tierSettings)}>
        <div className="grid gap-2 sm:grid-cols-3">
          {VENDOR_TIERS.map((tierId) => {
            const tier = getTierConfigFromSettings(tierId, tierSettings);
            return (
              <div key={tierId} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-bold text-foreground">{tier.label}</p>
                <p className="mt-1 text-xs text-muted">{tier.description}</p>
                <p className="mt-2 text-xs text-foreground">
                  {tier.commissionRate}% platform fee · {Math.round(tier.rewardRate * 100)}% rewards · min{" "}
                  {formatGHS(tier.minWithdrawal)} withdrawal
                </p>
              </div>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection title="All vendors" description="Live stores, roles, and onboarding status." icon={Store}>
        {vendors.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title="No vendors yet"
            description="Agents appear here after they submit a store application."
          />
        ) : (
          <AdminDataTable minWidth="860px">
            <AdminTableHead>
              <AdminTh>Vendor</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Role</AdminTh>
              <AdminTh>Onboarding</AdminTh>
              <AdminTh>Orders</AdminTh>
              <AdminTh>Rating</AdminTh>
              <AdminTh>Actions</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {vendors.map((v) => {
                const tierConfig = getTierConfigFromSettings(v.tier, tierSettings);
                return (
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
                      <Badge variant={TIER_VARIANT[v.tier]}>{tierConfig.label}</Badge>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {v.commission_rate}% fee · {Math.round(tierConfig.rewardRate * 100)}% rewards
                        {v.tier_manual ? " · manual" : ""}
                      </p>
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
                        tier={v.tier ?? "starter"}
                        tierManual={v.tier_manual ?? false}
                        tierLabels={tierSettings.tiers}
                      />
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>
    </AdminPageRoot>
  );
}
