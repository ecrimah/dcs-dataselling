"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Palette, Phone, Smartphone } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const WA_LINK = `https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`;
const THEMES = ["gold", "cyan", "emerald"] as const;

export function AgentFabStack() {
  const [themeIdx, setThemeIdx] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("dcs-agent-accent");
    if (saved) {
      const idx = THEMES.indexOf(saved as (typeof THEMES)[number]);
      if (idx >= 0) setThemeIdx(idx);
    }
  }, []);

  function cycleTheme() {
    const next = (themeIdx + 1) % THEMES.length;
    setThemeIdx(next);
    localStorage.setItem("dcs-agent-accent", THEMES[next]);
    document.documentElement.setAttribute("data-agent-accent", THEMES[next]);
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-30 flex flex-col gap-2 lg:bottom-6 lg:right-6">
      <Link
        href="/vendor/dashboard/claim"
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-white/20"
        aria-label="ClaimIt — top up wallet"
      >
        <Smartphone className="h-5 w-5" />
      </Link>
      <a
        href={`tel:${SITE.supportWhatsApp.replace(/\D/g, "")}`}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
        aria-label="Call support"
      >
        <Phone className="h-5 w-5" />
      </a>
      <button
        type="button"
        onClick={cycleTheme}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-gold text-navy-950 shadow-lg"
        aria-label="Change accent"
      >
        <Palette className="h-5 w-5" />
      </button>
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg",
        )}
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
