"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Wallet,
  MoreHorizontal,
  ShoppingCart,
  LogOut,
  LayoutGrid,
  FileText,
  Activity,
  Store,
  Gift,
  DollarSign,
  MessageSquare,
  Code,
  Shield,
  User,
  Menu,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { DcsLogo } from "@/components/brand/dcs-logo";
import { AgentFabStack } from "@/components/vendor/agent-fab-stack";
import { useVendorCart } from "@/components/vendor/vendor-cart-context";
import { cn } from "@/lib/utils";

const BOTTOM_NAV = [
  { href: "/vendor/dashboard", label: "Home", icon: Home, match: (p: string) => p === "/vendor/dashboard" },
  {
    href: "/vendor/dashboard/orders",
    label: "Orders",
    icon: Package,
    match: (p: string) => p.startsWith("/vendor/dashboard/orders"),
  },
  {
    href: "/vendor/dashboard/wallet",
    label: "Wallet",
    icon: Wallet,
    match: (p: string) =>
      p.startsWith("/vendor/dashboard/wallet") ||
      p.startsWith("/vendor/dashboard/transactions"),
  },
  { href: "#more", label: "More", icon: MoreHorizontal, match: () => false },
] as const;

const MORE_LINKS = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutGrid, section: "main" },
  { href: "/vendor/dashboard/orders", label: "Orders", icon: FileText, section: "main" },
  { href: "/vendor/dashboard/wallet", label: "Transactions", icon: Activity, section: "main" },
  { href: "/vendor/dashboard/wholesale", label: "Checkout", icon: ShoppingCart, section: "main" },
  { href: "/vendor/dashboard/storefront", label: "Store", icon: Store, section: "main" },
  { href: "/vendor/dashboard/rewards", label: "Rewards", icon: Gift, section: "account" },
  { href: "/vendor/dashboard/rewards#withdraw", label: "Reward Withdrawal", icon: DollarSign, section: "account" },
  { href: "/vendor/dashboard/complaints", label: "My Complaints", icon: MessageSquare, section: "account" },
  { href: "/vendor/dashboard/developer", label: "Developer", icon: Code, section: "extra" },
  { href: "/vendor/dashboard/mtn-afa", label: "MTN AFA", icon: Shield, section: "extra" },
  { href: "/vendor/dashboard/profile", label: "Profile", icon: User, section: "extra" },
  { href: "/vendor/dashboard/catalogue", label: "Resale Pricing", icon: Store, section: "extra" },
] as const;

interface AgentShellProps {
  vendorName: string;
  businessName: string;
  tier: string;
  children: React.ReactNode;
}

export function AgentShell({
  vendorName,
  businessName,
  tier,
  children,
}: AgentShellProps) {
  const pathname = usePathname();
  const { count: cartCount } = useVendorCart();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAgentHome = pathname === "/vendor/dashboard";

  return (
    <div className="vendor-agent-theme flex min-h-screen flex-col bg-navy-950 text-white lg:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-navy-900 lg:flex",
        )}
      >
        <Link href="/vendor/dashboard" className="flex h-16 items-center border-b border-white/10 px-4">
          <DcsLogo size={36} className="max-w-full" />
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {MORE_LINKS.filter((l) => l.section === "main" || l.href.includes("catalogue")).map(
            (item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    active ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>
        <div className="border-t border-white/10 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Open
              </span>
              <span className="hidden truncate text-[10px] font-semibold uppercase tracking-wide text-white/45 sm:inline">
                We are available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notifications">
                <Bell className="h-5 w-5 text-white/60" />
              </button>
              <Link
                href="/vendor/dashboard/wholesale?cart=1"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy-950 shadow-lg"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy-950 px-1 text-[9px] font-bold text-gold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "relative flex-1",
            isAgentHome ? "p-0 pb-24 lg:p-4 lg:pb-6" : "p-4 pb-24 lg:p-6 lg:pb-6",
          )}
        >
          {children}
          <AgentFabStack />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-navy-900/98 backdrop-blur-md lg:hidden">
          <ul className="grid grid-cols-4">
            {BOTTOM_NAV.map((item) => {
              const active = item.href === "#more" ? moreOpen : item.match(pathname);
              if (item.href === "#more") {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => setMoreOpen(true)}
                      className={cn(
                        "flex w-full flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
                        active ? "text-gold" : "text-white/45",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
                      active ? "text-gold" : "text-white/45",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-navy-900 p-4 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold">Menu</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="text-white/50">
                Close
              </button>
            </div>
            {(["main", "account", "extra"] as const).map((section) => (
              <div key={section} className="mb-4">
                {section !== "main" && (
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
                    {section === "account" ? "Account" : "Extra services"}
                  </p>
                )}
                <ul className="space-y-1">
                  {MORE_LINKS.filter((l) => l.section === section).map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/5"
                      >
                        <item.icon className="h-4 w-4 text-gold" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-white/10 bg-navy-950 p-3">
              <p className="font-bold">{vendorName}</p>
              <p className="text-xs text-white/45">{businessName}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gold">{tier}</p>
            </div>
            <form action={signOut} className="mt-3">
              <button type="submit" className="text-sm font-semibold text-red-400">
                Logout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-navy-900 p-4">
            <DcsLogo size={32} />
            <nav className="mt-6 space-y-1">
              {MORE_LINKS.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5"
                >
                  <item.icon className="h-4 w-4 text-gold" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
