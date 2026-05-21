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
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-white/30">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.title === "Extra services" && (
                <li>
                  <Link
                    href="/vendor/dashboard/wholesale?cart=1"
                    onClick={onNavigate}
                    className="flex items-center justify-between rounded-xl bg-navy-950 px-3 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:ring-gold/30"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-gold" />
                      Cart
                    </span>
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy-950">
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
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-gold text-navy-950 shadow-md shadow-gold/20"
                          : "text-white/55 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-navy-950")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <User className="h-5 w-5 text-white/70" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase tracking-wide">{vendorName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{tier}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full px-3 py-1 text-left text-sm font-semibold text-red-400 hover:text-red-300"
          >
            Logout
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
    <aside className={cn("flex h-full w-64 flex-col border-r border-white/10 bg-navy-900", className)}>
      <Link
        href="/vendor/dashboard"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center border-b border-white/10 px-4"
      >
        <DcsLogo size={36} className="max-w-full" />
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
    <div className="vendor-agent-theme flex min-h-screen flex-col bg-navy-950 text-white lg:flex-row">
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
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
                onClick={openSidebar}
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
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy-950 shadow-lg lg:hidden"
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
              const active =
                item.href === "#sidebar" ? sidebarOpen : item.match(pathname);
              if (item.href === "#sidebar") {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={openSidebar}
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
