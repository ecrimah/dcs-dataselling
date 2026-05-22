"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Wallet,
  MoreHorizontal,
  ShoppingCart,
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
  Search,
  type LucideIcon,
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
  { href: "#sidebar", label: "More", icon: MoreHorizontal, match: () => false },
] as const;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        href: "/vendor/dashboard",
        label: "Dashboard",
        icon: LayoutGrid,
        match: (p) => p === "/vendor/dashboard",
      },
      {
        href: "/vendor/dashboard/orders",
        label: "Orders",
        icon: FileText,
        match: (p) => p.startsWith("/vendor/dashboard/orders"),
      },
      {
        href: "/vendor/dashboard/wallet",
        label: "Transactions",
        icon: Activity,
        match: (p) =>
          p.startsWith("/vendor/dashboard/wallet") ||
          p.startsWith("/vendor/dashboard/transactions"),
      },
      {
        href: "/vendor/dashboard/wholesale",
        label: "Checkout",
        icon: ShoppingCart,
        match: (p) => p.startsWith("/vendor/dashboard/wholesale"),
      },
      {
        href: "/vendor/dashboard/storefront",
        label: "Store",
        icon: Store,
        match: (p) => p.startsWith("/vendor/dashboard/storefront"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        href: "/vendor/dashboard/rewards",
        label: "Rewards",
        icon: Gift,
        match: (p) => p === "/vendor/dashboard/rewards",
      },
      {
        href: "/vendor/dashboard/rewards#withdraw",
        label: "Reward Withdrawal",
        icon: DollarSign,
        match: (p) => p.startsWith("/vendor/dashboard/rewards"),
      },
      {
        href: "/vendor/dashboard/complaints",
        label: "My Complaints",
        icon: MessageSquare,
        match: (p) => p.startsWith("/vendor/dashboard/complaints"),
      },
    ],
  },
  {
    title: "Extra services",
    items: [
      {
        href: "/vendor/dashboard/developer",
        label: "Developer",
        icon: Code,
        match: (p) => p.startsWith("/vendor/dashboard/developer"),
      },
      {
        href: "/vendor/dashboard/mtn-afa",
        label: "MTN AFA",
        icon: Shield,
        match: (p) => p.startsWith("/vendor/dashboard/mtn-afa"),
      },
      {
        href: "/vendor/dashboard/profile",
        label: "Profile",
        icon: User,
        match: (p) => p.startsWith("/vendor/dashboard/profile"),
      },
    ],
  },
];

interface AgentShellProps {
  vendorName: string;
  businessName: string;
  tier: string;
  children: React.ReactNode;
}

function AgentSidebarNav({
  pathname,
  cartCount,
  vendorName,
  tier,
  onNavigate,
}: {
  pathname: string;
  cartCount: number;
  vendorName: string;
  tier: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.title === "Extra services" && (
                <li>
                  <Link
                    href="/vendor/dashboard/wholesale?cart=1"
                    onClick={onNavigate}
                    className="group flex items-center justify-between rounded-xl border border-gold/25 bg-gradient-to-r from-gold/10 to-transparent px-3 py-2.5 text-sm font-semibold text-white transition hover:border-gold/45"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-gold" />
                      Cart
                    </span>
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy-950">
                      {cartCount}
                    </span>
                  </Link>
                </li>
              )}
              {section.items.map((item) => {
                const active = item.match(pathname);
                return (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-gradient-to-r from-gold/20 via-gold/10 to-transparent text-gold"
                          : "text-white/55 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold" />
                      )}
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-gold" : "text-white/50 group-hover:text-white/80",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-glow text-xs font-bold text-navy-950 ring-2 ring-gold/40">
            {vendorName.slice(0, 2).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-950 bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{vendorName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold/80">{tier}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

function AgentSidebar({
  pathname,
  cartCount,
  vendorName,
  tier,
  onNavigate,
  className,
}: {
  pathname: string;
  cartCount: number;
  vendorName: string;
  tier: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("vault-sidebar flex h-full w-64 flex-col border-r", className)}>
      <Link
        href="/vendor/dashboard"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.06] px-4"
      >
        <DcsLogo size={32} className="max-w-full" />
        <span className="ml-1 chip chip-gold">Agent</span>
      </Link>
      <AgentSidebarNav
        pathname={pathname}
        cartCount={cartCount}
        vendorName={vendorName}
        tier={tier}
        onNavigate={onNavigate}
      />
    </aside>
  );
}

export function AgentShell({
  vendorName,
  businessName,
  tier,
  children,
}: AgentShellProps) {
  const pathname = usePathname();
  const { count: cartCount } = useVendorCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAgentHome = pathname === "/vendor/dashboard";
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  void businessName;

  return (
    <div className="vendor-agent-theme flex min-h-screen flex-col bg-[#f7f9fc] text-foreground lg:flex-row">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AgentSidebar
          pathname={pathname}
          cartCount={cartCount}
          vendorName={vendorName}
          tier={tier}
        />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="vault-chrome sticky top-0 z-30 border-b">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <button
              type="button"
              className="rounded-lg p-2 text-white/70 hover:bg-white/5 lg:hidden"
              onClick={openSidebar}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 chip chip-emerald">
              <span className="dot dot-emerald dot-pulse" />
              Open · 24/7
            </span>

            <div className="search-dark ml-auto hidden w-64 md:flex">
              <Search className="h-3.5 w-3.5" />
              <input type="text" placeholder="Search bundles, refs, customers…" aria-label="Search" />
              <span className="kbd">⌘K</span>
            </div>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <button
                type="button"
                className="relative rounded-lg p-2 text-white/70 hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
              </button>
              <Link
                href="/vendor/dashboard/wholesale?cart=1"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-glow text-navy-950 shadow-lg shadow-gold/30 lg:hidden"
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-navy-950 bg-navy-950 px-1 text-[9px] font-bold text-gold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "page-canvas relative flex-1 pb-24 lg:pb-6",
            isAgentHome ? "p-0 lg:p-0" : "p-0",
          )}
        >
          {children}
          <AgentFabStack />
        </main>

        {/* Mobile bottom nav */}
        <nav className="vault-chrome fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden">
          <ul className="grid grid-cols-4">
            {BOTTOM_NAV.map((item) => {
              const active =
                item.href === "#sidebar" ? sidebarOpen : item.match(pathname);
              const inner = (
                <>
                  <div
                    className={cn(
                      "relative flex h-7 w-7 items-center justify-center rounded-lg transition",
                      active && "bg-gold/15",
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4", active ? "text-gold" : "text-white/55")}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider",
                      active ? "text-gold" : "text-white/50",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              );
              if (item.href === "#sidebar") {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={openSidebar}
                      className="flex w-full flex-col items-center gap-1 py-2"
                    >
                      {inner}
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link href={item.href} className="flex flex-col items-center gap-1 py-2">
                    {inner}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile sidebar — same layout as desktop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={closeSidebar}
          />
          <div className="absolute left-0 top-0 h-full">
            <AgentSidebar
              pathname={pathname}
              cartCount={cartCount}
              vendorName={vendorName}
              tier={tier}
              onNavigate={closeSidebar}
              className="h-full w-[min(17rem,85vw)] shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
