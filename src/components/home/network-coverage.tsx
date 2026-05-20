import Link from "next/link";
import { ArrowRight, Radio, Zap } from "lucide-react";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { NETWORKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NetworkStat {
  id: "mtn" | "telecel" | "at";
  bundles: number;
  startingPrice: number;
}

interface AfaStat {
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

async function fetchAfaStats(): Promise<AfaStat> {
  if (!hasSupabaseConfig()) {
    return { bundles: 0, startingPrice: 0 };
  }
  const service = createServiceClient();
  const { data } = await service
    .from("marketplace_bundles")
    .select("price")
    .or("name.ilike.%afa%,name.ilike.%afa bundle%")
    .order("price", { ascending: true })
    .limit(1);
  const { count } = await service
    .from("marketplace_bundles")
    .select("*", { count: "exact", head: true })
    .or("name.ilike.%afa%,name.ilike.%afa bundle%");
  const startingPrice = (data?.[0] as { price: number } | undefined)?.price ?? 0;
  return { bundles: count ?? 0, startingPrice };
}

const NETWORK_DETAILS = {
  mtn: {
    name: "MTN",
    chipClass: "bg-mtn",
    coverage: "98%",
    speed: "4G/5G ready",
    footer: "MTN marketplace",
  },
  telecel: {
    name: "Telecel",
    chipClass: "bg-telecel",
    coverage: "92%",
    speed: "4G nationwide",
    footer: "Telecel marketplace",
  },
  at: {
    name: "AirtelTigo",
    chipClass: "bg-at",
    coverage: "88%",
    speed: "4G nationwide",
    footer: "AirtelTigo marketplace",
  },
} as const;

const AFA_DETAILS = {
  name: "Afa bundle",
  chipClass: "bg-afa",
  coverage: "MTN",
  speed: "Agent & special packs",
  footer: "Afa marketplace",
  href: "/marketplace?search=afa",
} as const;

export async function NetworkCoverage() {
  const [stats, afa] = await Promise.all([fetchNetworkStats(), fetchAfaStats()]);

  return (
    <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow text-cyan-600">Network coverage</span>
            <h2 className="display-2 mt-2 text-foreground">
              Every major Ghanaian network.{" "}
              <span className="text-aurora">One marketplace.</span>
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-600"
          >
            See all bundles <ArrowRight className="ml-1 inline-block h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3 lg:grid-cols-4">
            {stats.map((s) => {
              const d = NETWORK_DETAILS[s.id];
              return (
                <CoverageCard
                  key={s.id}
                  href={`/marketplace?network=${s.id}`}
                  chipClass={d.chipClass}
                  name={d.name}
                  coverage={d.coverage}
                  bundles={s.bundles}
                  speed={d.speed}
                  startingPrice={s.startingPrice}
                  footer={d.footer}
                />
              );
            })}
            <CoverageCard
              href={AFA_DETAILS.href}
              chipClass={AFA_DETAILS.chipClass}
              name={AFA_DETAILS.name}
              coverage={AFA_DETAILS.coverage}
              bundles={afa.bundles}
              speed={AFA_DETAILS.speed}
              startingPrice={afa.startingPrice}
              footer={AFA_DETAILS.footer}
            />
        </div>
      </div>
    </section>
  );
}

function CoverageCard({
  href,
  chipClass,
  name,
  coverage,
  bundles,
  speed,
  startingPrice,
  footer,
}: {
  href: string;
  chipClass: string;
  name: string;
  coverage: string;
  bundles: number;
  speed: string;
  startingPrice: number;
  footer: string;
}) {
  const priceLabel =
    startingPrice > 0 ? `₵${startingPrice.toFixed(2)}` : "—";

  return (
    <Link
      href={href}
      className="card-elevated card-lift group relative flex flex-col overflow-hidden p-0"
    >
      <div className={cn("h-1", chipClass)} />

      <div className="flex-1 p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1 sm:gap-2">
          <span
            className={cn(
              "inline-flex max-w-[70%] items-center rounded-full px-1.5 py-0 text-[8px] font-bold sm:max-w-[85%] sm:px-2 sm:py-0.5 sm:text-[9px]",
              name === "Afa bundle" ? "normal-case" : "uppercase tracking-wider",
              chipClass,
            )}
          >
            {name}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 px-1 py-0 text-[8px] font-semibold text-muted sm:px-1.5 sm:py-0.5 sm:text-[9px]">
            <Radio className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
            {coverage}
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <p className="num text-base font-extrabold leading-none tracking-tight text-foreground sm:text-xl">
            {bundles}
          </p>
          <p className="mt-0.5 text-[9px] leading-tight text-muted sm:text-[11px]">
            <span className="block sm:inline">
              {bundles === 1 ? "bundle" : "bundles"}
            </span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">{speed}</span>
          </p>
        </div>

        <div className="mt-2 flex items-end justify-between gap-1 border-t border-border pt-2 sm:mt-2.5 sm:gap-2 sm:pt-2.5">
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wider text-muted sm:text-[10px]">
              From
            </p>
            <p className="num mt-0.5 text-sm font-extrabold leading-none text-foreground sm:text-[17px]">
              {priceLabel}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 px-2 py-1 text-[9px] font-bold text-white shadow shadow-cyan-500/25 transition-all group-hover:shadow-cyan-500/40 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
            <span className="hidden min-[380px]:inline">Browse </span>→
          </span>
        </div>
      </div>

      <div className="border-t border-border bg-slate-50 px-2.5 py-1.5 sm:px-4 sm:py-2">
        <div className="flex items-center justify-between gap-1 text-[9px] sm:gap-2 sm:text-[11px]">
          <span className="truncate font-semibold text-foreground">{footer}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-[8px] text-emerald-600 sm:text-[9px]">
            <Zap className="h-2 w-2 text-emerald-500 sm:h-2.5 sm:w-2.5" />
            <span className="hidden min-[360px]:inline">Instant fulfilment</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
