import { Radio, Zap } from "lucide-react";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { NETWORKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NetworkStat {
  id: "mtn" | "telecel" | "at";
  bundles: number;
  startingPrice: number;
}

async function fetchNetworkStats(): Promise<NetworkStat[]> {
  if (!hasSupabaseConfig()) {
    return NETWORKS.map((n) => ({ id: n.id, bundles: 0, startingPrice: 0 }));
  }
  const service = createServiceClient();
  const stats: NetworkStat[] = [];
  for (const n of NETWORKS) {
    const { data } = await service
      .from("marketplace_bundles")
      .select("price")
      .eq("network", n.id)
      .order("price", { ascending: true })
      .limit(1);
    const { count } = await service
      .from("marketplace_bundles")
      .select("*", { count: "exact", head: true })
      .eq("network", n.id);
    const startingPrice = (data?.[0] as { price: number } | undefined)?.price ?? 0;
    stats.push({ id: n.id, bundles: count ?? 0, startingPrice });
  }
  return stats;
}

const NETWORK_DETAILS = {
  mtn: {
    name: "MTN",
    chipClass: "bg-mtn",
    coverage: "98%",
    speed: "4G/5G ready",
  },
  telecel: {
    name: "Telecel",
    chipClass: "bg-telecel",
    coverage: "92%",
    speed: "4G nationwide",
  },
  at: {
    name: "AirtelTigo",
    chipClass: "bg-at",
    coverage: "88%",
    speed: "4G nationwide",
  },
} as const;

export async function NetworkCoverage() {
  const stats = await fetchNetworkStats();

  return (
    <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-xl">
          <span className="eyebrow text-gold-dark">Network coverage</span>
          <h2 className="display-2 mt-2 text-foreground">
            Every major Ghanaian network.{" "}
            <span className="text-aurora">One platform.</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Agents on DCS sell bundles across all major networks — customers buy
            through each agent&apos;s private store link.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3 lg:grid-cols-3">
          {stats.map((s) => {
            const d = NETWORK_DETAILS[s.id];
            const priceLabel = s.startingPrice > 0 ? `₵${s.startingPrice.toFixed(2)}` : "—";
            return (
              <div
                key={s.id}
                className="card-elevated relative flex flex-col overflow-hidden p-0"
              >
                <div className={cn("h-1", d.chipClass)} />
                <div className="flex-1 p-2.5 sm:p-4">
                  <div className="flex items-start justify-between gap-1 sm:gap-2">
                    <span
                      className={cn(
                        "inline-flex max-w-[85%] items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        d.chipClass,
                      )}
                    >
                      {d.name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                      <Radio className="h-2.5 w-2.5" />
                      {d.coverage}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <p className="num text-xl font-extrabold leading-none tracking-tight text-foreground">
                      {s.bundles}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {s.bundles === 1 ? "bundle" : "bundles"} listed · {d.speed}
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-border pt-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        From
                      </p>
                      <p className="num mt-0.5 text-[17px] font-extrabold leading-none text-foreground">
                        {priceLabel}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[9px] text-emerald-600">
                      <Zap className="h-2.5 w-2.5 text-emerald-500" />
                      Instant
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
