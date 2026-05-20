import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  Zap,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { PageHero } from "@/components/layout/page-hero";

export const metadata = {
  title: "Support",
  description: "Get help with orders, payments, and your DCS account. Fast WhatsApp support.",
};

const WA_LINK = `https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`;

const QUICK_HELP = [
  {
    icon: Package,
    title: "Track an order",
    desc: "Status, delivery, and receipts",
    href: "/account",
  },
  {
    icon: RefreshCw,
    title: "Refund or failed bundle",
    desc: "Auto-escalation on failed fulfilment",
    href: `${WA_LINK}?text=${encodeURIComponent("Hi DCS, I need help with an order")}`,
    external: true,
  },
  {
    icon: ShieldCheck,
    title: "Payment & security",
    desc: "MoMo, cards, and verification",
    href: "/#trust",
  },
  {
    icon: Store,
    title: "Vendor & KYC",
    desc: "Store setup and payouts",
    href: "/create-store",
  },
] as const;

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        imageSrc="/hero-support.png"
        imageAlt="DCS support specialist ready to help customers on WhatsApp"
        imagePosition="78% 30%"
        accent="emerald"
      >
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <Headphones className="h-3.5 w-3.5" />
            Help centre
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Real humans.{" "}
            <span className="text-aurora">Fast answers.</span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            WhatsApp is fastest for Ghana. Email works too — we reply to both every day.
          </p>
        </div>

        <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
          <StatPill icon={Zap} label="WhatsApp" value="< 5 min" />
          <StatPill icon={Clock} label="Email" value="Same day" />
          <StatPill icon={ShieldCheck} label="Orders" value="Tracked 24/7" />
        </div>
      </PageHero>

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Primary channels */}
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open WhatsApp chat"
              className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 p-6 shadow-lg transition-transform hover:-translate-y-0.5 sm:p-8"
              style={{
                background: `
                  radial-gradient(ellipse 80% 80% at 100% 0%, rgba(16, 185, 129, 0.25), transparent 50%),
                  linear-gradient(145deg, #064e3b 0%, #0a1124 60%, #060914 100%)
                `,
              }}
            >
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <MessageCircle className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                      Recommended
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">Chat on WhatsApp</p>
                    <p className="mt-1 text-sm text-emerald-100/80">
                      Orders, refunds, payments — message us anytime.
                    </p>
                  </div>
                </div>
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full bg-emerald-500 text-white shadow-md transition-transform group-hover:translate-x-0.5 sm:self-center"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </div>
            </a>

            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="card-elevated card-lift group flex flex-1 items-center gap-4 p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md">
                  <Mail className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-foreground">Email support</p>
                  <p className="truncate text-sm text-muted">{SITE.supportEmail}</p>
                  <p className="mt-0.5 text-[11px] text-muted">For statements & formal requests</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-cyan-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>

              <div className="rounded-2xl border border-border bg-slate-50 p-4 text-xs text-muted">
                <p className="font-semibold text-foreground">Before you message</p>
                <ul className="mt-2 space-y-1.5">
                  <li>· Have your order ID or payment reference ready</li>
                  <li>· Recipient number must match the bundle network</li>
                  <li>· Failed orders usually auto-refund within 24h</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick help */}
          <div className="mt-12">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-sm font-bold text-foreground">Common topics</h2>
              <Link
                href="/#faq"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-500"
              >
                Full FAQ →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_HELP.map((item) => {
                const Icon = item.icon;
                const className =
                  "card-elevated card-lift group flex gap-3 p-4 transition-colors hover:border-cyan-500/20";
                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted">{item.desc}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </>
                );
                return "external" in item && item.external ? (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={item.title} href={item.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border px-5 py-6 text-center sm:flex-row sm:text-left sm:px-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,9,20,0.02) 0%, rgba(34,211,238,0.06) 100%)",
            }}
          >
            <div>
              <p className="font-bold text-foreground">Still buying data?</p>
              <p className="mt-0.5 text-sm text-muted">
                Browse verified vendors and pay with MoMo in seconds.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-navy-950"
              style={{
                background: "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)",
                boxShadow: "0 6px 18px rgba(34, 211, 238, 0.3)",
              }}
            >
              Go to marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-400" />
        <div>
          <p className="num text-base font-extrabold leading-none text-white">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
