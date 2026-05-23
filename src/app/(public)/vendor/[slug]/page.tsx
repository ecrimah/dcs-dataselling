import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  HeadphonesIcon,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { fetchVendorBySlug, fetchVendorBundles } from "@/lib/data/queries";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { SITE } from "@/lib/constants";
import { formatCompact } from "@/lib/format";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList, vendorStore } from "@/lib/seo/schema";

import { StorefrontBundles } from "./storefront-bundles";
import { StorefrontActions } from "./storefront-actions";
import { StorefrontFAQ } from "./storefront-faq";
import { StorefrontMobileCTA } from "./storefront-mobile-cta";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<import("next").Metadata> {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);
  if (!vendor) {
    return {
      title: "Store Not Found",
      robots: { index: false, follow: false },
    };
  }
  const url = `${SITE.url}/vendor/${vendor.slug}`;
  const title = `${vendor.businessName} — Buy MTN, Telecel & AirtelTigo Data in Ghana`;
  const description =
    vendor.tagline ??
    `Buy MTN, Telecel and AirtelTigo data bundles from ${vendor.businessName}. Instant delivery, secure MoMo payments, protected by DCS ELITE.`;
  return {
    title,
    description,
    alternates: { canonical: `/vendor/${vendor.slug}` },
    keywords: [
      vendor.businessName,
      `${vendor.businessName} data`,
      "buy data Ghana",
      "MTN data bundle",
      "Telecel data bundle",
      "AirtelTigo data bundle",
      "data store Ghana",
      "Mobile Money data",
    ],
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${vendor.businessName} on ${SITE.name}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: vendor.businessName,
      description,
      images: [`${url}/opengraph-image`],
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
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      <JsonLd
        data={[
          vendorStore({
            slug: vendor.slug,
            businessName: vendor.businessName,
            tagline: vendor.tagline,
            themeColor: vendor.themeColor,
            logoUrl: vendor.logoUrl ?? null,
            rating: vendor.rating,
            ratingCount: vendor.totalOrders,
            bundlesOffered: bundles.length,
          }),
          breadcrumbList([
            { name: "Home", url: "/" },
            { name: vendor.businessName, url: `/vendor/${vendor.slug}` },
          ]),
        ]}
      />
      {/* ===================== HERO ===================== */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: heroBackground }}
      >
        {/* Subtle mesh + grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(0,0,0,0.30) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 70%)",
          }}
        />
        {/* Gold ribbon at top edge */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255, 215, 130, 0.8) 50%, transparent 100%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              {/* Store identity */}
              <div className="flex items-start gap-4 sm:gap-5">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-sm sm:h-24 sm:w-24"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30)" }}
                >
                  <StoreIcon
                    icon={vendor.emoji}
                    size={48}
                    strokeWidth={1.5}
                    className="text-white"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
                      {vendor.businessName}
                    </h1>
                    {vendor.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/95 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-900 shadow-sm">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    {vendor.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-200 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-900 shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                    {vendor.tagline ??
                      "Fast, reliable data bundles delivered straight to your phone."}
                  </p>
                </div>
              </div>

              {/* Trust micro-row */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  <span className="font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {vendor.rating.toFixed(1)}
                  </span>
                  <span>rating</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-300" />
                  <span className="font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCompact(vendor.totalOrders)}
                  </span>
                  <span>orders fulfilled</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  ~{vendor.fulfilmentMinutes} min delivery
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  On DCS Elite for {memberSince}
                </span>
              </div>

              {/* Network chips */}
              {networksOffered.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                    Networks
                  </span>
                  {networksOffered.map((n) => (
                    <NetworkBadge key={n} network={n} size="sm" />
                  ))}
                </div>
              )}

              {/* Primary actions */}
              <div className="mt-6">
                <StorefrontActions
                  storeUrl={storeUrl}
                  businessName={vendor.businessName}
                  whatsappNumber={vendor.whatsappNumber}
                />
              </div>

              {/* Inline trust badges */}
              <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/75">
                <li className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-300" />
                  Paystack-secured payments
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  Money-back if data fails
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  Auto-delivery, 24/7
                </li>
              </ul>
            </div>

            {/* Right-side: featured deal teaser (only when there's a lowest price) */}
            {lowestPrice != null && (
              <aside className="hidden w-full max-w-sm rounded-2xl border border-white/20 bg-white/[0.06] p-5 backdrop-blur-sm lg:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                  Starting from
                </p>
                <p
                  className="mt-1 text-5xl font-extrabold leading-none tracking-tight text-white"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  GH₵{lowestPrice.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-white/75">
                  Pay with MoMo, card or bank. Data arrives in under{" "}
                  <span className="font-bold text-white">
                    {vendor.fulfilmentMinutes} min
                  </span>
                  .
                </p>
                <a
                  href="#bundles"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-md shadow-amber-400/40 transition hover:brightness-105"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Browse all bundles
                </a>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ===================== STAT STRIP (overlaps hero) ===================== */}
      <section className="mx-auto -mt-7 max-w-7xl px-4 sm:-mt-9 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_4px_rgba(17,17,17,0.04),0_12px_32px_rgba(10,46,93,0.10)] sm:grid-cols-4">
          <Stat
            label="Bundles available"
            value={bundles.length.toString()}
            accent={bundles.length > 0 ? "text-emerald-600" : "text-slate-400"}
          />
          <Stat label="Networks served" value={networksOffered.length.toString()} />
          <Stat
            label="Avg delivery"
            value={`~${vendor.fulfilmentMinutes}m`}
          />
          <Stat
            label="Starting from"
            value={lowestPrice != null ? `GH₵${lowestPrice.toFixed(2)}` : "—"}
            accent="text-slate-900"
          />
        </div>
      </section>

      {/* ===================== BUNDLES ===================== */}
      <section
        id="bundles"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
              Shop
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Available bundles
            </h2>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Tap any bundle to pay with MoMo, card, or bank. Data arrives instantly.
            </p>
          </div>
          {bundles.length > 0 && (
            <span
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"}
            </span>
          )}
        </div>

        <StorefrontBundles bundles={bundles} />
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
              Simple
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              From cart to data on your phone in under 2 minutes.
            </p>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            <Step
              number="1"
              title="Pick your bundle"
              body="Browse MTN, Telecel and AirtelTigo deals. Tap the one you want — no account needed."
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="amber"
            />
            <Step
              number="2"
              title="Pay with MoMo or card"
              body="Checkout is powered by Paystack. Use MTN MoMo, Telecel Cash, AT Money, card, or bank."
              icon={<CreditCard className="h-5 w-5" />}
              tone="sky"
            />
            <Step
              number="3"
              title="Data arrives instantly"
              body="The bundle is loaded onto the recipient SIM automatically — average under 2 minutes."
              icon={<Send className="h-5 w-5" />}
              tone="emerald"
            />
          </ol>
        </div>
      </section>

      {/* ===================== WHY BUY FROM US ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
            Why {vendor.businessName.split(" ")[0]}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Why customers trust this store
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure payments"
            body="Paystack-secured. Your card and MoMo details never touch the seller."
            tone="emerald"
          />
          <TrustCard
            icon={<Zap className="h-5 w-5" />}
            title="Instant delivery"
            body={`Average delivery under ${vendor.fulfilmentMinutes} minutes — fully automated.`}
            tone="amber"
          />
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Buyer protection"
            body="Bundle didn't arrive? Open a dispute and DCS Elite will resolve it."
            tone="sky"
          />
          <TrustCard
            icon={<HeadphonesIcon className="h-5 w-5" />}
            title="Real human help"
            body={
              vendor.whatsappNumber
                ? "Reach the seller directly on WhatsApp for fast support."
                : "Reach support on the order page if anything goes wrong."
            }
            tone="violet"
          />
        </div>
      </section>

      {/* ===================== SOCIAL PROOF ===================== */}
      {vendor.totalOrders > 0 && (
        <section className="border-y border-slate-200 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="grid items-center gap-6 sm:grid-cols-3 sm:gap-4">
              <BigStat
                value={formatCompact(vendor.totalOrders)}
                label="Orders fulfilled"
              />
              <BigStat
                value={`${vendor.rating.toFixed(1)} / 5`}
                label="Average rating"
                accent="amber"
              />
              <BigStat
                value={`~${vendor.fulfilmentMinutes}m`}
                label="Avg delivery time"
                accent="emerald"
              />
            </div>
          </div>
        </section>
      )}

      {/* ===================== FAQ ===================== */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
              Need help?
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>

          <StorefrontFAQ
            businessName={vendor.businessName}
            fulfilmentMinutes={vendor.fulfilmentMinutes}
            whatsappNumber={vendor.whatsappNumber}
          />

          {vendor.whatsappNumber && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-sm font-bold text-emerald-900">
                Still need a hand?
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Message {vendor.businessName.split(" ")[0]} directly — usually
                replies within a few minutes.
              </p>
              <a
                href={`https://wa.me/${vendor.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp chat
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Protected by{" "}
              <span className="font-extrabold text-slate-900">DCS ELITE</span>
            </span>
            <p className="max-w-md text-xs text-slate-500">
              {vendor.businessName} is an independent seller on DCS Elite —
              Ghana&apos;s premium platform for instant data bundle delivery.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span>Secure payments by Paystack</span>
              <span aria-hidden>·</span>
              <a href="/support" className="font-semibold text-slate-700 hover:underline">
                Get help
              </a>
              <span aria-hidden>·</span>
              <a href="/" className="font-semibold text-slate-700 hover:underline">
                Open another store
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <StorefrontMobileCTA
        whatsappNumber={vendor.whatsappNumber}
        businessName={vendor.businessName}
        storeUrl={storeUrl}
      />
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

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
    <div className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:py-5 sm:last:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-extrabold tracking-tight sm:text-xl ${
          accent ?? "text-slate-900"
        }`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  body,
  icon,
  tone,
}: {
  number: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  tone: "amber" | "sky" | "emerald";
}) {
  const palette = {
    amber: {
      ring: "from-amber-100 to-amber-50",
      icon: "bg-amber-100 text-amber-700",
      num: "text-amber-700",
    },
    sky: {
      ring: "from-sky-100 to-sky-50",
      icon: "bg-sky-100 text-sky-700",
      num: "text-sky-700",
    },
    emerald: {
      ring: "from-emerald-100 to-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
      num: "text-emerald-700",
    },
  }[tone];

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${palette.ring} to-white p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}
        >
          {icon}
        </span>
        <span
          className={`text-3xl font-black ${palette.num}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {number}
        </span>
      </div>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
    </li>
  );
}

function TrustCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "emerald" | "amber" | "sky" | "violet";
}) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(10,46,93,0.08)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${palette}`}>
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function BigStat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: "amber" | "emerald";
}) {
  const valueColor =
    accent === "amber"
      ? "text-amber-300"
      : accent === "emerald"
        ? "text-emerald-300"
        : "text-white";
  return (
    <div className="text-center sm:text-left">
      <p
        className={`text-4xl font-extrabold leading-none tracking-tight sm:text-5xl ${valueColor}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
    </div>
  );
}
