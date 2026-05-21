"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
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
      <button
        type="button"
        onClick={share}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      {whatsappNumber && (
        <a
          href={buildWhatsappLink(whatsappNumber, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}
    </div>
  );
}
