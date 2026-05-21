import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { fetchVendorBySlug, fetchVendorBundles } from "@/lib/data/queries";
import { Badge } from "@/components/ui/badge";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { SITE } from "@/lib/constants";
import { formatCompact } from "@/lib/format";

import { StorefrontBundles } from "./storefront-bundles";
import { StorefrontActions } from "./storefront-actions";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) return { title: "Store Not Found" };
  return {
    title: `${vendor.businessName} — Data Vendor on DCS Elite`,
    description:
      vendor.tagline ??
      `Buy MTN, Telecel and AirtelTigo data bundles from ${vendor.businessName}. Fast delivery, secure payments.`,
    openGraph: {
      title: vendor.businessName,
      description: vendor.tagline ?? undefined,
    },
  };
}

export default async function VendorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) notFound();

  const bundles = await fetchVendorBundles(vendor.id);
  const heroBackground = resolveThemeBackground(vendor.themeColor);
  const storeUrl = `${SITE.url.replace(/\/$/, "")}/vendor/${vendor.slug}`;
  const memberSince = formatDistanceToNow(new Date(vendor.createdAt), {
    addSuffix: false,
  });

  const networksOffered = Array.from(new Set(bundles.map((b) => b.network)));
  const lowestPrice = bundles.length
    ? Math.min(...bundles.map((b) => b.price))
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <section
        className="relative overflow-hidden text-white"
        style={{ background: heroBackground }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(0,0,0,0.25) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-sm sm:h-24 sm:w-24"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
            >
              <StoreIcon
                icon={vendor.emoji}
                size={44}
                strokeWidth={1.5}
                className="text-white"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {vendor.businessName}
                </h1>
                {vendor.verified && (
                  <Badge variant="verified" className="gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {vendor.featured && (
                  <Badge className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                {vendor.tagline ??
                  "Fast, reliable data bundles delivered straight to your phone."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/80 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  <span className="font-semibold text-white">
                    {vendor.rating.toFixed(1)}
                  </span>
                  <span>rating</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="font-semibold text-white">
                    {formatCompact(vendor.totalOrders)}
                  </span>
                  <span>orders fulfilled</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  ~{vendor.fulfilmentMinutes} min delivery
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Selling on DCS for {memberSince}
                </span>
              </div>

              {networksOffered.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    Networks
                  </span>
                  {networksOffered.map((n) => (
                    <NetworkBadge key={n} network={n} size="sm" />
                  ))}
                </div>
              )}

              <div className="mt-5">
                <StorefrontActions
                  storeUrl={storeUrl}
                  businessName={vendor.businessName}
                  whatsappNumber={vendor.whatsappNumber}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="card-elevated grid grid-cols-2 divide-x divide-border overflow-hidden rounded-2xl bg-white sm:grid-cols-4">
          <Stat
            label="Bundles available"
            value={bundles.length.toString()}
            accent={bundles.length > 0 ? "text-emerald-600" : "text-muted"}
          />
          <Stat
            label="Networks served"
            value={networksOffered.length.toString()}
          />
          <Stat
            label="Avg delivery"
            value={`~${vendor.fulfilmentMinutes}m`}
          />
          <Stat
            label="Starting from"
            value={lowestPrice != null ? `GH₵${lowestPrice.toFixed(2)}` : "—"}
            accent="text-foreground"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              Available bundles
            </h2>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Tap any bundle to pay with MoMo. Data arrives instantly.
            </p>
          </div>
          {bundles.length > 0 && (
            <span className="num shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted">
              {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"}
            </span>
          )}
        </div>

        <StorefrontBundles bundles={bundles} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure payments"
            body="Pay safely through Paystack — MoMo, card, bank. Your details never touch the seller."
          />
          <TrustCard
            icon={<Zap className="h-5 w-5" />}
            title="Instant delivery"
            body="Data arrives the moment payment is confirmed. Average delivery under two minutes."
          />
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Buyer protection"
            body="Bundle didn't arrive? Open a dispute in your order page and DCS will resolve it."
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Powered by{" "}
          <span className="font-semibold text-foreground">DCS ELITE</span> · Secure
          payments and instant delivery
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`num mt-1 text-lg font-extrabold sm:text-xl ${
          accent ?? "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card-elevated p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
