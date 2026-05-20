import Link from "next/link";
import { ArrowRight, Clock, Star, Zap } from "lucide-react";
import type { Vendor } from "@/types";
import { formatCompact } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resolveThemeBackground } from "@/lib/vendor-theme";

interface VendorCardProps {
  vendor: Vendor;
  className?: string;
  featured?: boolean;
}

export function VendorCard({ vendor, className, featured }: VendorCardProps) {
  const barBackground = resolveThemeBackground(vendor.themeColor);

  return (
    <Link
      href={`/vendor/${vendor.slug}`}
      className={cn(
        "card-elevated card-lift group relative flex flex-col overflow-hidden p-0",
        featured && "ring-1 ring-cyan-500/25",
        className,
      )}
    >
      <div
        aria-hidden
        className="h-1"
        style={{ background: barBackground }}
      />

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <Avatar
            name={vendor.businessName}
            themeColor={vendor.themeColor}
            emoji={vendor.emoji}
            size={featured ? "md" : "sm"}
            verified={vendor.verified}
          />
          {vendor.featured && (
            <Badge variant="default" className="shrink-0 px-1.5 py-0 text-[8px] sm:text-[9px]">
              Featured
            </Badge>
          )}
        </div>

        <h2 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-cyan-700 sm:mt-3 sm:text-base">
          {vendor.businessName}
        </h2>
        {vendor.tagline && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted sm:text-xs sm:leading-relaxed">
            {vendor.tagline}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted sm:mt-3 sm:gap-x-3 sm:text-[10px]">
          <span className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
            <span className="num font-semibold text-foreground">{vendor.rating.toFixed(1)}</span>
          </span>
          <span className="num hidden min-[360px]:inline">{formatCompact(vendor.totalOrders)} orders</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            ~{vendor.fulfilmentMinutes}m
          </span>
          <span className="hidden items-center gap-0.5 text-emerald-600 min-[360px]:flex">
            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Live
          </span>
        </div>

        <span className="mt-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-700 transition-transform group-hover:translate-x-0.5 sm:mt-3 sm:gap-1 sm:text-xs">
          Visit store
          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      </div>
    </Link>
  );
}
