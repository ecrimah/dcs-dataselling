"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Send, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  storeUrl: string;
  businessName: string;
}

export function ShareKit({ storeUrl, businessName }: Props) {
  const [copied, setCopied] = useState(false);

  const messages = {
    short: `Buy data fast at ${businessName} 👉 ${storeUrl}`,
    long: `🚀 Get all your MTN, Telecel, AT data here at ${businessName}.\n\n✅ Verified vendor\n⚡ Fast delivery\n💳 Pay with MoMo\n\n${storeUrl}`,
    promo: `🔥 Special data deals at ${businessName}\n\nMTN, Telecel, AT — best prices, instant delivery.\nShop now 👉 ${storeUrl}`,
  };

  function copyLink() {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function copyMsg(msg: string) {
    navigator.clipboard.writeText(msg);
    toast.success("Message copied");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          readOnly
          value={storeUrl}
          className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm"
        />
        <Button onClick={copyLink} variant="secondary">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(messages.short)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(messages.short)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white"
        >
          <Send className="h-4 w-4" />
          X
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white"
        >
          <Globe className="h-4 w-4" />
          Facebook
        </a>
      </div>

      <details className="rounded-xl border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Pre-made messages
        </summary>
        <div className="space-y-2 border-t border-border p-3">
          {Object.entries(messages).map(([key, msg]) => (
            <button
              key={key}
              type="button"
              onClick={() => copyMsg(msg)}
              className="block w-full rounded-lg bg-slate-50 p-3 text-left text-xs text-muted hover:bg-slate-100"
            >
              <span className="block font-medium capitalize text-foreground">{key}</span>
              <span className="mt-1 block whitespace-pre-line">{msg}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
