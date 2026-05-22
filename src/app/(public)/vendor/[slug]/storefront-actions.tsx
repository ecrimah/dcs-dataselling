"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  storeUrl: string;
  businessName: string;
  whatsappNumber?: string | null;
}

function buildWhatsappLink(raw: string, message: string) {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function StorefrontActions({ storeUrl, businessName, whatsappNumber }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success("Store link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function share() {
    const data = {
      title: businessName,
      text: `Buy data fast at ${businessName}`,
      url: storeUrl,
    };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // User cancelled — fall through to copy.
      }
    }
    await copyLink();
  }

  const waMessage = `Hi ${businessName}, I'd like to buy data from your DCS Elite store: ${storeUrl}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary CTA: jump to bundles */}
      <a
        href="#bundles"
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-5 text-sm font-black uppercase tracking-wide text-slate-900 shadow-md shadow-amber-400/35 transition-all hover:shadow-amber-400/50 hover:brightness-105"
      >
        Buy data now
        <ArrowRight className="h-4 w-4" />
      </a>

      {whatsappNumber && (
        <a
          href={buildWhatsappLink(whatsappNumber, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/50"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}

      <button
        type="button"
        onClick={share}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
