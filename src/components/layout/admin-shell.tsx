"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Activity,
  ShoppingCart,
  Store,
  Gift,
  DollarSign,
  MessageSquare,
  Tag,
  Code,
  Shield,
  User,
  Menu,
  Bell,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Layers,
  MessageCircle,
  Cable,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { DcsLogo } from "@/components/brand/dcs-logo";
import { cn } from "@/lib/utils";

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
      { href: "/admin", label: "Dashboard", icon: LayoutGrid, match: (p) => p === "/admin" },
      { href: "/admin/orders", label: "Orders", icon: FileText, match: (p) => p.startsWith("/admin/orders") },
      { href: "/admin/transactions", label: "Transactions", icon: Activity, match: (p) => p.startsWith("/admin/transactions") },
      { href: "/admin/wholesale", label: "Checkout", icon: ShoppingCart, match: (p) => p.startsWith("/admin/wholesale") },
      { href: "/admin/vendors", label: "Store", icon: Store, match: (p) => p.startsWith("/admin/vendors") || p.startsWith("/admin/kyc") },
    ],
  },
  {
    title: "Agent ops",
    items: [
      { href: "/admin/agent-ops#rewards", label: "Rewards", icon: Gift, match: (p) => p.startsWith("/admin/agent-ops") },
      { href: "/admin/agent-ops#withdrawals", label: "Reward Withdrawals", icon: DollarSign, match: (p) => p.startsWith("/admin/agent-ops") },
      { href: "/admin/agent-ops#complaints", label: "Agent Complaints", icon: MessageSquare, match: (p) => p.startsWith("/admin/agent-ops") },
    ],
  },
  {
    title: "Extra services",
    items: [
      { href: "/admin/agent-ops#claimit", label: "ClaimIt", icon: Tag, match: (p) => p.startsWith("/admin/agent-ops") },
      { href: "/admin/agent-ops#developer", label: "Developer", icon: Code, match: (p) => p.startsWith("/admin/agent-ops") },
      { href: "/admin/agent-ops#mtn-afa", label: "MTN AFA", icon: Shield, match: (p) => p.startsWith("/admin/agent-ops") },
      { href: "/admin/vendors", label: "Agent Profiles", icon: User, match: (p) => p.startsWith("/admin/vendors") },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/admin/operations", label: "Operations", icon: ShieldCheck, match: (p) => p.startsWith("/admin/operations") },
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle, match: (p) => p.startsWith("/admin/disputes") },
      { href: "/admin/promotions", label: "Customer Promotions", icon: Layers, match: (p) => p.startsWith("/admin/promotions") },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, match: (p) => p.startsWith("/admin/analytics") },
      { href: "/admin/sms-debugger", label: "SMS Debugger", icon: MessageCircle, match: (p) => p.startsWith("/admin/sms-debugger") },
      { href: "/admin/supplier", label: "Supplier Console", icon: Cable, match: (p) => p.startsWith("/admin/supplier") },
      { href: "/admin/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/admin/settings") },
    ],
  },
];

interface AdminShellProps {
  adminName: string;
  adminRole: string;
  children: React.ReactNode;
}

function pageTitleFromPath(pathname: string): string {
  if (pathname === "/admin") return "Command Center";
  const segs = pathname.split("/").filter(Boolean); // ["admin","supplier"]
  const last = segs[segs.length - 1] ?? "";
  if (!last) return "Platform Control";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function AdminSidebarNav({
  pathname,
  adminName,
  adminRole,
  onNavigate,
}: {
  pathname: string;
  adminName: string;
  adminRole: string;
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
                      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-gold" : "text-white/50 group-hover:text-white/80")} />
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
            {adminName.slice(0, 2).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-950 bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{adminName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold/80">
              {adminRole}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="mb-1 block rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
        >
          Exit to store
        </Link>
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

function AdminSidebar({
  pathname,
  adminName,
  adminRole,
  onNavigate,
  className,
}: {
  pathname: string;
  adminName: string;
  adminRole: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("vault-sidebar flex h-full w-64 flex-col border-r", className)}>
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.06] px-4"
      >
        <DcsLogo size={32} className="max-w-full" />
        <span className="ml-1 chip chip-gold">Admin</span>
      </Link>
      <AdminSidebarNav
        pathname={pathname}
        adminName={adminName}
        adminRole={adminRole}
        onNavigate={onNavigate}
      />
    </aside>
  );
}

export function AdminShell({ adminName, adminRole, children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  useEffect(() => {
    const id = setInterval(
      () =>
        setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      30000,
    );
    return () => clearInterval(id);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);
  const title = pageTitleFromPath(pathname);

  return (
    <div className="vault-surface flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AdminSidebar pathname={pathname} adminName={adminName} adminRole={adminRole} />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="vault-chrome sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/80">
              Platform Control
            </p>
            <h1 className="truncate text-sm font-bold text-white">{title}</h1>
          </div>

          {/* Search */}
          <div className="search-dark ml-auto hidden w-72 md:flex">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search orders, vendors, refs…"
              aria-label="Search"
            />
            <span className="kbd">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="hidden items-center gap-1.5 chip chip-emerald sm:inline-flex">
              <span className="dot dot-emerald dot-pulse" />
              Live · {time}
            </span>
            <button
              type="button"
              className="relative rounded-lg p-2 text-white/70 hover:bg-white/5"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={closeSidebar}
          />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <AdminSidebar
              pathname={pathname}
              adminName={adminName}
              adminRole={adminRole}
              onNavigate={closeSidebar}
              className="h-full w-[min(17rem,85vw)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
