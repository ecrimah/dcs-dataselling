"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  MessageCircle,
  ShieldCheck,
  Zap,
  Store,
  CreditCard,
  Tags,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    icon: Zap,
    q: "How fast is delivery?",
    a: "Most bundles land in under 2 minutes. Track status live from payment to delivery.",
  },
  {
    icon: ShieldCheck,
    q: "What if data doesn't arrive?",
    a: "Failed orders auto-refund. Tap Get help on any order — we respond on WhatsApp fast.",
  },
  {
    icon: CreditCard,
    q: "Which payments work?",
    a: "MTN MoMo, Telecel Cash, AT Money, and cards — via Paystack or Moolre (BoG-licensed).",
  },
  {
    icon: Store,
    q: "Can I sell on DCS?",
    a: "Yes. Ghana Card + selfie KYC. Most vendors approved within a few hours.",
  },
  {
    icon: Tags,
    q: "How do vendor prices work?",
    a: "DCS wholesale catalogue + your markup. You choose what to list and what to charge.",
  },
  {
    icon: ShieldCheck,
    q: "Is my number safe?",
    a: "Only used for fulfilment. Encrypted in transit and never sold to third parties.",
  },
] as const;

const WA_LINK = `https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-10 lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <span className="eyebrow text-cyan-600">FAQ</span>
            <h2 className="display-2 mt-2 text-foreground">Questions, answered.</h2>
            <p className="mt-2 text-sm text-muted">
              Quick answers about buying, selling, and getting support.
            </p>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 transition-colors hover:border-emerald-500/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-bold text-foreground">Chat on WhatsApp</span>
                <span className="block text-xs text-muted">Usually under 5 minutes</span>
              </span>
            </a>

            <Link
              href="/support"
              className="mt-3 inline-block text-xs font-semibold text-cyan-600 hover:text-cyan-500"
            >
              Visit help centre →
            </Link>
          </aside>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <ul className="divide-y divide-border">
              {FAQS.map((item, i) => {
                const isOpen = open === i;
                const Icon = item.icon;
                return (
                  <li key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4",
                        isOpen ? "bg-cyan-500/[0.04]" : "hover:bg-slate-50",
                      )}
                      aria-expanded={isOpen}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isOpen
                            ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">{item.q}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                              isOpen && "rotate-180 text-cyan-600",
                            )}
                          />
                        </span>
                        <div
                          className={cn(
                            "grid transition-all duration-200 ease-out",
                            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <p className="overflow-hidden pt-2 text-xs leading-relaxed text-muted">
                            {item.a}
                          </p>
                        </div>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
