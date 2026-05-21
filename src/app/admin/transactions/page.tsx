import { Badge } from "@/components/ui/badge";
import { fetchAdminWalletLedger } from "@/lib/data/admin-agent-ops";
import { formatGHS } from "@/lib/format";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const ENTRY_LABEL: Record<string, string> = {
  topup: "Top-up",
  order_debit: "Order debit",
  refund: "Refund",
  adjustment: "Adjustment",
};

export default async function AdminTransactionsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const ledger = await fetchAdminWalletLedger(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Agent transactions</h2>
        <p className="mt-1 text-sm text-muted">
          Wallet ledger across all agents — mirrors{" "}
          <span className="font-mono">/vendor/dashboard/wallet</span>
        </p>
      </div>

      {ledger.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted">No wallet activity yet.</div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/80 text-left text-muted">
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Balance after</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.vendor_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.entry_type === "topup" ? "success" : "neutral"}>
                        {ENTRY_LABEL[row.entry_type] ?? row.entry_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 num font-semibold">
                      {row.amount >= 0 ? "+" : ""}
                      {formatGHS(row.amount)}
                    </td>
                    <td className="px-4 py-3 num text-muted">
                      {row.balance_after != null ? formatGHS(row.balance_after) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {row.reference ?? row.note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
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
