"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DcsLogo } from "@/components/brand/dcs-logo";

const NAV = [
  { href: "/marketplace", label: "Buy Data" },
  { href: "/vendors", label: "Vendors" },
  { href: "/create-store", label: "Sell on DCS" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top status strip */}
      <div className="hidden border-b border-white/5 bg-navy-950 sm:block">
        <div className="mx-auto flex h-7 max-w-7xl items-center justify-between gap-4 px-4 text-[10px] font-medium sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="font-bold uppercase tracking-[0.16em] text-emerald-300">
                All systems operational
              </span>
            </span>
            <span className="hidden h-3 w-px bg-white/10 md:block" />
            <span className="hidden md:inline">
              <span className="text-slate-500">Avg fulfilment</span>{" "}
              <span className="font-bold text-white">&lt;2 min</span>
            </span>
            <span className="hidden h-3 w-px bg-white/10 lg:block" />
            <span className="hidden lg:inline">
              <span className="text-slate-500">Networks</span>{" "}
              <span className="font-bold text-white">MTN · Telecel · AT</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="hidden sm:inline">
              <span className="text-slate-500">Currency</span>{" "}
              <span className="font-bold text-white">GHS ₵</span>
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <a href={`mailto:${SITE.supportEmail}`} className="hover:text-white">
              {SITE.supportEmail}
            </a>
          </div>
        </div>
      </div>

      {/* Main header bar */}
      <div className="relative border-b border-white/10 bg-navy-900/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group inline-flex items-center">
            <span
              className="relative inline-flex"
              style={{
                filter:
                  "drop-shadow(0 8px 18px rgba(34, 211, 238, 0.25))",
              }}
            >
              <DcsLogo size={40} priority />
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-1 md:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "text-white"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-400/30"
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white"
            >
              Sign in
              <ChevronDown className="h-3 w-3" />
            </Link>
            <Link
              href="/marketplace"
              className="group relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-navy-950 transition-all"
              style={{
                background:
                  "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)",
                boxShadow:
                  "0 6px 18px rgba(34, 211, 238, 0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <span>Buy data</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Bottom hairline gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-white/10 bg-navy-900/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    active ? "bg-white/10 text-white" : "text-slate-300",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="rounded-full border border-white/15 px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/marketplace"
              className="rounded-full px-4 py-2 text-center text-sm font-bold text-navy-950"
              style={{
                background: "linear-gradient(135deg, #67e8f9 0%, #2dd4bf 100%)",
              }}
              onClick={() => setOpen(false)}
            >
              Buy data →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
