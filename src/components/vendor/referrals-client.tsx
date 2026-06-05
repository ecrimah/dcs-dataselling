"use client";

import { Gift, Users } from "lucide-react";
import Link from "next/link";
import {
  DashboardInfoCard,
  DashboardPageHero,
} from "@/components/shared/dashboard-page-hero";
import { ReferralShareCard } from "@/components/vendor/referral-share-card";
import type { VendorReferralStats } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  stats: VendorReferralStats;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReferralsClient({ stats }: Props) {
  return (
    <div className="space-y-4">
      <DashboardPageHero
        icon={Gift}
        decorativeIcon={Gift}
        badge="Refer & earn"
        title="Referral program"
        subtitle={`Earn ₵${stats.rewardAmount.toFixed(0)} when someone you invite completes their first sale.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total invites" value={String(stats.totalInvites)} />
        <StatCard label="Pending" value={String(stats.pendingInvites)} />
        <StatCard label="Earned from referrals" value={`₵${stats.totalEarned.toFixed(2)}`} />
      </div>

      <DashboardInfoCard
        icon={Gift}
        title="Your referral link"
        description="Friends who sign up with your code or link count toward your referral rewards."
        iconTone="amber"
      >
        <ReferralShareCard
          referralCode={stats.referralCode}
          inviteLink={stats.inviteLink}
          rewardAmount={stats.rewardAmount}
        />
      </DashboardInfoCard>

      <DashboardInfoCard
        icon={Users}
        title="Recent invites"
        description={`${stats.rewardedInvites} rewarded · ${stats.pendingInvites} waiting for first sale`}
        iconTone="blue"
      >
        {stats.recent.length === 0 ? (
          <p className="text-sm text-slate-500">No invites yet. Share your link to start earning.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="admin-table w-full min-w-[480px]">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Rewarded</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.businessName}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <span
                        className={
                          row.status === "rewarded"
                            ? "text-emerald-600"
                            : row.status === "pending"
                              ? "text-amber-600"
                              : "text-slate-500"
                        }
                      >
                        {row.status === "rewarded"
                          ? "Rewarded"
                          : row.status === "pending"
                            ? "Pending"
                            : row.status}
                      </span>
                    </td>
                    <td>{formatDate(row.rewardedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pt-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/vendor/dashboard/rewards">View reward balance & withdraw</Link>
          </Button>
        </div>
      </DashboardInfoCard>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="section-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
