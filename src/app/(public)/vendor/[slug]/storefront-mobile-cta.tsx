"use client";

import { MessageCircle, ShoppingBag } from "lucide-react";

interface Props {
  whatsappNumber?: string | null;
  businessName: string;
  storeUrl: string;
}

function buildWhatsappLink(raw: string, message: string) {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function StorefrontMobileCTA({
  whatsappNumber,
  businessName,
  storeUrl,
}: Props) {
  const waMessage = `Hi ${businessName}, I want to buy data from your DCS Elite store: ${storeUrl}`;
  const waHref = whatsappNumber ? buildWhatsappLink(whatsappNumber, waMessage) : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_4px_8px_rgba(17,17,17,0.06),0_12px_32px_rgba(10,46,93,0.18)] backdrop-blur-md">
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 transition active:scale-95"
            aria-label="WhatsApp seller"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
        <a
          href="#bundles"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-sm font-black uppercase tracking-wide text-slate-900 shadow-md shadow-amber-400/35 transition active:scale-[0.98]"
        >
          <ShoppingBag className="h-4 w-4" />
          Buy data now
        </a>
      </div>
    </div>
  );
}
