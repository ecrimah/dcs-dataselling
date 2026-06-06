import {
  Code,
  DollarSign,
  Gift,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AdminConfigError,
  AdminDataTable,
  AdminEmptyState,
  AdminList,
  AdminListItem,
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
import { formatGHS, formatPhone } from "@/lib/format";
import {
  fetchAdminAgentRewardBalances,
  fetchAdminMtnAfaApplications,
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
  WithdrawalActions,
} from "./agent-ops-actions";

export const dynamic = "force-dynamic";

export default async function AdminAgentOpsPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  const [withdrawals, complaints, mtnAfa, apiKeys, rewardBalances] = await Promise.all([
    fetchAdminRewardWithdrawals(),
    fetchAdminVendorComplaints(),
    fetchAdminMtnAfaApplications(),
    fetchAdminVendorApiKeys(),
    fetchAdminAgentRewardBalances(),
  ]);

  const pendingWithdrawals = withdrawals.filter((w) =>
    ["pending", "approved"].includes(w.status),
  );
  const openComplaints = complaints.filter((c) => ["open", "in_progress"].includes(c.status));
  const pendingAfa = mtnAfa.filter((a) => a.status === "pending");

  return (
    <AdminPageRoot className="space-y-4">
      <AdminPageIntro
        badge="Agent operations"
        description="Rewards, complaints, MTN AFA, and developer keys — sidebar links jump to each section."
        meta={`${pendingWithdrawals.length} payouts · ${openComplaints.length} complaints · ${pendingAfa.length} AFA pending`}
      />

      <AdminStatGrid>
        <AdminStatTile
          icon={<DollarSign className="h-4 w-4" />}
          tone="amber"
          label="Pending payouts"
          value={String(pendingWithdrawals.length)}
        />
        <AdminStatTile
          icon={<MessageSquare className="h-4 w-4" />}
          tone="rose"
          label="Open complaints"
          value={String(openComplaints.length)}
        />
        <AdminStatTile
          icon={<Shield className="h-4 w-4" />}
          tone="sky"
          label="MTN AFA queue"
          value={String(pendingAfa.length)}
        />
      </AdminStatGrid>

      <AdminSection
        id="rewards"
        title="Agent rewards"
        description="Wallet and reward balances across all agents."
        icon={Gift}
      >
        {rewardBalances.length === 0 ? (
          <AdminEmptyState
            icon={Gift}
            title="No agent balances yet"
            description="Balances appear once agents earn rewards or top up their wallet."
          />
        ) : (
          <AdminDataTable minWidth="480px">
            <AdminTableHead>
              <AdminTh>Agent</AdminTh>
              <AdminTh>Wallet</AdminTh>
              <AdminTh>Reward balance</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {rewardBalances.map((r) => (
                <AdminTr key={r.id}>
                  <AdminTd className="font-medium">{r.vendor_name}</AdminTd>
                  <AdminTd className="num">{formatGHS(r.wallet_balance)}</AdminTd>
                  <AdminTd className="num font-semibold">{formatGHS(r.reward_balance)}</AdminTd>
                </AdminTr>
              ))}
            </AdminTableBody>
          </AdminDataTable>
        )}
      </AdminSection>

      <AdminSection
        id="withdrawals"
        title="Reward withdrawals"
        description="MoMo payout requests from agent reward balances."
        icon={DollarSign}
      >
        {withdrawals.length === 0 ? (
          <AdminEmptyState
            icon={DollarSign}
            title="No withdrawal requests"
            description="Agents request payouts from their rewards dashboard."
          />
        ) : (
          <AdminList>
            {withdrawals.map((w) => (
              <AdminListItem key={w.id}>
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
              </AdminListItem>
            ))}
          </AdminList>
        )}
      </AdminSection>

      <AdminSection
        id="complaints"
        title="Agent complaints"
        description="Support inbox from agent complaint forms."
        icon={MessageSquare}
      >
        {complaints.length === 0 ? (
          <AdminEmptyState
            icon={MessageSquare}
            title="No complaints"
            description="Agent support tickets will appear here for triage."
            tone="success"
          />
        ) : (
          <AdminList>
            {complaints.map((c) => (
              <AdminListItem key={c.id}>
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
              </AdminListItem>
            ))}
          </AdminList>
        )}
      </AdminSection>

      <AdminSection
        id="mtn-afa"
        title="MTN AFA applications"
        description="Review agent ID submissions for MTN AFA registration."
        icon={Shield}
      >
        {mtnAfa.length === 0 ? (
          <AdminEmptyState
            icon={Shield}
            title="No applications yet"
            description="Agents submit MTN AFA IDs from their dashboard."
          />
        ) : (
          <AdminList>
            {mtnAfa.map((a) => (
              <AdminListItem key={a.id}>
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
              </AdminListItem>
            ))}
          </AdminList>
        )}
      </AdminSection>

      <AdminSection
        id="developer"
        title="Developer API keys"
        description="Keys created by agents — prefix only, never full secret."
        icon={Code}
      >
        {apiKeys.length === 0 ? (
          <AdminEmptyState
            icon={Code}
            title="No API keys issued"
            description="Agents generate keys from their developer dashboard."
          />
        ) : (
          <AdminDataTable minWidth="640px">
            <AdminTableHead>
              <AdminTh>Agent</AdminTh>
              <AdminTh>Name</AdminTh>
              <AdminTh>Prefix</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh />
            </AdminTableHead>
            <AdminTableBody>
              {apiKeys.map((k) => (
                <AdminTr key={k.id}>
                  <AdminTd className="font-medium">{k.vendor_name}</AdminTd>
                  <AdminTd>{k.name}</AdminTd>
                  <AdminTd className="font-mono text-xs">{k.key_prefix}…</AdminTd>
                  <AdminTd>
                    <Badge variant={k.active ? "success" : "neutral"}>
                      {k.active ? "Active" : "Revoked"}
                    </Badge>
                  </AdminTd>
                  <AdminTd>
                    <ApiKeyRevokeButton keyId={k.id} active={k.active} />
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
