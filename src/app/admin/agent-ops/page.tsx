import { Badge } from "@/components/ui/badge";
import { formatGHS, formatPhone } from "@/lib/format";
import {
  fetchAdminMtnAfaApplications,
  fetchAdminPromoCodes,
  fetchAdminRewardWithdrawals,
  fetchAdminVendorApiKeys,
  fetchAdminVendorComplaints,
} from "@/lib/data/admin-agent-ops";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import {
  ApiKeyRevokeButton,
  ComplaintActions,
  MtnAfaActions,
  PromoCreateForm,
  PromoToggle,
  WithdrawalActions,
} from "./agent-ops-actions";

export const dynamic = "force-dynamic";

export default async function AdminAgentOpsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const [promos, withdrawals, complaints, mtnAfa, apiKeys] = await Promise.all([
    fetchAdminPromoCodes(),
    fetchAdminRewardWithdrawals(),
    fetchAdminVendorComplaints(),
    fetchAdminMtnAfaApplications(),
    fetchAdminVendorApiKeys(),
  ]);

  const pendingWithdrawals = withdrawals.filter((w) =>
    ["pending", "approved"].includes(w.status),
  );
  const openComplaints = complaints.filter((c) => ["open", "in_progress"].includes(c.status));
  const pendingAfa = mtnAfa.filter((a) => a.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Agent operations</h2>
        <p className="mt-1 text-sm text-muted">
          Manage ClaimIt promos, reward payouts, agent complaints, MTN AFA, and developer keys —
          mirrors the vendor More menu.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Pending payouts" value={String(pendingWithdrawals.length)} />
        <Metric label="Open complaints" value={String(openComplaints.length)} />
        <Metric label="MTN AFA queue" value={String(pendingAfa.length)} />
        <Metric label="Active promo codes" value={String(promos.filter((p) => p.active).length)} />
      </div>

      {/* ClaimIt promo codes */}
      <section className="card-elevated p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">ClaimIt promo codes</h3>
            <p className="mt-1 text-xs text-muted">
              Wallet credits agents redeem at{" "}
              <span className="font-mono">/vendor/dashboard/claim</span>
            </p>
          </div>
        </div>

        {promos.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No promo codes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {promos.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-slate-50/50 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-bold">{p.code}</p>
                  <p className="text-sm text-foreground">
                    {formatGHS(Number(p.amount))} · {p.redemption_count}
                    {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ""} redemptions
                  </p>
                  <p className="text-xs text-muted">
                    {p.expires_at
                      ? `Expires ${formatDistanceToNow(new Date(p.expires_at), { addSuffix: true })}`
                      : "No expiry"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.active ? "success" : "neutral"}>
                    {p.active ? "Active" : "Inactive"}
                  </Badge>
                  <PromoToggle promoId={p.id} active={p.active} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <PromoCreateForm />
      </section>

      {/* Reward withdrawals */}
      <section className="card-elevated p-5">
        <h3 className="font-semibold">Reward withdrawals</h3>
        <p className="mt-1 text-xs text-muted">
          Agents request MoMo payouts from{" "}
          <span className="font-mono">/vendor/dashboard/rewards</span>
        </p>

        {withdrawals.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No withdrawal requests.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {withdrawals.map((w) => (
              <li key={w.id} className="rounded-xl border border-border bg-slate-50/50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{w.vendor_name}</p>
                    <p className="text-sm">
                      {formatGHS(w.amount)} → {formatPhone(w.momo_number)}
                    </p>
                    {w.admin_note && (
                      <p className="mt-1 text-xs text-muted">Note: {w.admin_note}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      w.status === "paid"
                        ? "success"
                        : w.status === "rejected"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {w.status}
                  </Badge>
                </div>
                <WithdrawalActions withdrawalId={w.id} status={w.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Complaints */}
      <section className="card-elevated p-5">
        <h3 className="font-semibold">Agent complaints</h3>
        <p className="mt-1 text-xs text-muted">
          Inbox from <span className="font-mono">/vendor/dashboard/complaints</span>
        </p>

        {complaints.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No complaints.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {complaints.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-slate-50/50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.vendor_name}</p>
                    <p className="text-sm font-semibold">{c.subject ?? "Complaint"}</p>
                    <p className="mt-1 text-sm text-muted">{c.message}</p>
                    {c.admin_reply && (
                      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs">
                        <span className="font-semibold">Your reply:</span> {c.admin_reply}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      c.status === "resolved" || c.status === "closed" ? "success" : "warning"
                    }
                  >
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>
                <ComplaintActions
                  complaintId={c.id}
                  status={c.status}
                  existingReply={c.admin_reply}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* MTN AFA */}
      <section className="card-elevated p-5">
        <h3 className="font-semibold">MTN AFA applications</h3>
        <p className="mt-1 text-xs text-muted">
          Review agent IDs from <span className="font-mono">/vendor/dashboard/mtn-afa</span>
        </p>

        {mtnAfa.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No applications yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mtnAfa.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-slate-50/50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.vendor_name}</p>
                    <p className="font-mono text-sm">Agent ID: {a.agent_id}</p>
                    {a.admin_note && (
                      <p className="mt-1 text-xs text-muted">Note: {a.admin_note}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      Submitted{" "}
                      {formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.status === "verified"
                        ? "success"
                        : a.status === "rejected"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
                <MtnAfaActions applicationId={a.id} status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Developer API keys */}
      <section className="card-elevated p-5">
        <h3 className="font-semibold">Developer API keys</h3>
        <p className="mt-1 text-xs text-muted">
          Keys created at <span className="font-mono">/vendor/dashboard/developer</span> (prefix only)
        </p>

        {apiKeys.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No API keys issued.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Prefix</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-b border-border/50">
                    <td className="py-3 font-medium">{k.vendor_name}</td>
                    <td className="py-3">{k.name}</td>
                    <td className="py-3 font-mono text-xs">{k.key_prefix}…</td>
                    <td className="py-3">
                      <Badge variant={k.active ? "success" : "neutral"}>
                        {k.active ? "Active" : "Revoked"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <ApiKeyRevokeButton keyId={k.id} active={k.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
