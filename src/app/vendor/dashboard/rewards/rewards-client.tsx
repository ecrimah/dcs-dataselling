"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
}

export function RewardsClient({ initialBalance, referralCode, withdrawals }: Props) {
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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-white/10 bg-navy-900 p-4">
        <p className="text-[10px] font-bold uppercase text-white/40">Your referral code</p>
        <p className="mt-1 font-mono text-2xl font-bold text-gold">{referralCode}</p>
      </div>

      <div id="withdraw" className="rounded-2xl border border-white/10 bg-navy-900 p-4">
        <h3 className="font-bold text-white">Reward withdrawal</h3>
        <p className="mt-1 text-sm text-white/55">Available balance</p>
        <p className="num mt-2 text-2xl font-bold text-gold">{formatGHS(balance)}</p>

        <form onSubmit={withdraw} className="mt-4 space-y-3">
          <input
            type="number"
            min={50}
            placeholder="Amount (min ₵50)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
          />
          <input
            type="tel"
            placeholder="MoMo number"
            value={momo}
            onChange={(e) => setMomo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || balance < 50}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw to MoMo"}
          </button>
        </form>
      </div>

      {withdrawals.length > 0 && (
        <ul className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-muted">Recent withdrawals</p>
          {withdrawals.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm"
            >
              <span>{formatGHS(Number(w.amount))}</span>
              <Badge variant={w.status === "paid" ? "success" : "warning"}>{w.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
