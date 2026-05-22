"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  businessName: string;
  fulfilmentMinutes: number;
  whatsappNumber?: string | null;
}

export function StorefrontFAQ({
  businessName,
  fulfilmentMinutes,
  whatsappNumber,
}: Props) {
  const [open, setOpen] = useState<number | null>(0);

  const items: FaqItem[] = [
    {
      q: "How fast will I get my data?",
      a: `Most orders arrive in under ${fulfilmentMinutes} minutes. We route through the same network APIs that power official top-up systems, so delivery is automatic — no waiting on a human.`,
    },
    {
      q: "How do I pay?",
      a: "Payments go through Paystack, Ghana's largest payments platform. You can pay with MTN MoMo, Telecel Cash, AirtelTigo Money, debit card, or bank transfer. Your details never touch the seller.",
    },
    {
      q: "What if my data doesn't arrive?",
      a: `If your bundle hasn't arrived within 10 minutes, open your order page and click "Open dispute" — DCS Elite (the platform powering this store) will resolve it within hours. ${
        whatsappNumber
          ? `You can also message ${businessName} directly on WhatsApp for faster help.`
          : ""
      }`,
    },
    {
      q: "Which networks are supported?",
      a: "MTN, Telecel, and AirtelTigo (both iShare and BigTime). Just pick the bundle that matches the SIM you want to top up.",
    },
    {
      q: "Can I order for someone else?",
      a: "Yes — at checkout you'll enter the phone number that should receive the data. It doesn't have to match the number paying.",
    },
    {
      q: "Do you store my phone number or card?",
      a: "We only store the recipient number on your order so we can deliver the bundle and refund if needed. Card details are handled entirely by Paystack — we never see them.",
    },
  ];

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white transition-all",
              isOpen
                ? "border-slate-300 shadow-[0_4px_16px_rgba(10,46,93,0.06)]"
                : "border-slate-200",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-slate-900 sm:text-[15px]">
                {item.q}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
