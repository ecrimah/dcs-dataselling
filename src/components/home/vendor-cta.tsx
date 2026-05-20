import Link from "next/link";
import { ArrowRight, Store, BarChart3, Wallet } from "lucide-react";
import { EarningsCalculator } from "./earnings-calculator";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const PERKS = [
  { icon: Store, label: "Store in 5 min" },
  { icon: BarChart3, label: "Your markup" },
  { icon: Wallet, label: "Daily MoMo" },
] as const;

const SUCCESS_STORIES = [
  {
    name: "Adjoa M.",
    role: "KNUST",
    earnings: "₵2,840",
    period: "1st month",
    color: "#06b6d4",
  },
  {
    name: "Kwabena S.",
    role: "Accra",
    earnings: "₵12,400",
    period: "90 days",
    color: "#8b5cf6",
  },
  {
    name: "Esi R.",
    role: "Kumasi",
    earnings: "₵27,600",
    period: "Quarter",
    color: "#f59e0b",
  },
];

export function VendorCta() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10">
          <div>
            <span className="eyebrow text-cyan-600">For vendors</span>
            <h2 className="display-2 mt-2 text-foreground">
              Sell data.{" "}
              <span className="text-aurora">Earn monthly.</span>
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Verified storefront, wholesale bundles, instant MoMo payouts.
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {PERKS.map((p) => (
                <li
                  key={p.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  <p.icon className="h-3.5 w-3.5 text-cyan-600" />
                  {p.label}
                </li>
              ))}
            </ul>

            <Button size="sm" className="mt-5" asChild>
              <Link href="/create-store">
                Create your store
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <EarningsCalculator />
        </div>

        <div className="mt-10">
          <div className="grid gap-3 sm:grid-cols-3">
            {SUCCESS_STORIES.map((s) => (
              <div
                key={s.name}
                className="card-elevated flex items-center gap-3 p-3.5"
              >
                <Avatar name={s.name} themeColor={s.color} size="sm" verified />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold text-foreground">
                      {s.name}
                    </p>
                    <p className="num shrink-0 text-sm font-extrabold text-foreground">
                      {s.earnings}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted">
                    {s.role} · {s.period}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
