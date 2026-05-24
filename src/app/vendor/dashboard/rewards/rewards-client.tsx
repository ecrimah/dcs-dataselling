"use client";

import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminList,
  AdminListItem,
  AdminSection,
  AdminStatTile,
} from "@/components/admin";
import { formatGHS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface WithdrawalRow {
  id: string;
  amount: number;
  momo_number: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface Props {
  initialBalance: number;
  referralCode: string;
  withdrawals: WithdrawalRow[];
  minWithdrawal: number;
}

export function RewardsClient({ initialBalance, referralCode, withdrawals, minWithdrawal }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [amount, setAmount] = useState("");
  const [momo, setMomo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), momoNumber: momo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      toast.success("Withdrawal submitted — paid within 24–48h");
      setBalance((b) => b - Number(amount));
      setAmount("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminSection title="Referral code" description="Share this code to earn rewards." icon={Gift}>
        <p className="admin-promo-code text-base">{referralCode}</p>
      </AdminSection>

      <AdminSection
        id="withdraw"
        title="Reward withdrawal"
        description={`Minimum ${formatGHS(minWithdrawal)} · paid within 24–48h.`}
        icon={Gift}
      >
        <AdminStatTile
          icon={<Gift className="h-4 w-4" />}
          tone="gold"
          label="Available balance"
          value={formatGHS(balance)}
          valueAccent="gold"
        />
        <form onSubmit={withdraw} className="mt-3 space-y-3">
          <div className="admin-form-field">
            <label>Amount (min {formatGHS(minWithdrawal)})</label>
            <input
              type="number"
              min={minWithdrawal}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="admin-form-field">
            <label>MoMo number</label>
            <input type="tel" value={momo} onChange={(e) => setMomo(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={loading || balance < minWithdrawal}
            className="susu-btn-gold flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw to MoMo"}
          </button>
        </form>
      </AdminSection>

      {withdrawals.length > 0 && (
        <AdminSection title="Recent withdrawals" icon={Gift}>
          <AdminList>
            {withdrawals.map((w) => (
              <AdminListItem key={w.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="num font-semibold">{formatGHS(Number(w.amount))}</span>
                  <Badge variant={w.status === "paid" ? "success" : "warning"}>{w.status}</Badge>
                </div>
              </AdminListItem>
            ))}
          </AdminList>
        </AdminSection>
      )}
    </div>
  );
}
