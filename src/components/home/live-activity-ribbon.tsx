import { CheckCircle2 } from "lucide-react";
import { fetchRecentActivity } from "@/lib/data/queries";

export async function LiveActivityRibbon() {
  const items = await fetchRecentActivity(12);
  if (items.length === 0) return null;

  const track = [...items, ...items];

  return (
    <div className="border-y border-white/10 bg-navy-950/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="pulse-dot" />
          <span className="eyebrow text-[9px] text-emerald-300">Live · Last 10 min</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-navy-950/80 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-navy-950/80 to-transparent"
          />
          <div className="marquee-track gap-3">
            {track.map((it, i) => (
              <div
                key={`${it.label}-${it.timeAgo}-${i}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="font-medium text-white">{it.label}</span>
                <span>bought</span>
                <span className="num font-semibold text-cyan-300">
                  {it.bundleLabel} {it.network}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-500">{it.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
