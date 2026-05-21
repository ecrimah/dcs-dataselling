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
  LogOut,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
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

/** Mirrors vendor agent sidebar — each item maps to the admin counterpart */
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutGrid,
        match: (p) => p === "/admin",
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: FileText,
        match: (p) => p.startsWith("/admin/orders"),
      },
      {
        href: "/admin/transactions",
        label: "Transactions",
        icon: Activity,
        match: (p) => p.startsWith("/admin/transactions"),
      },
      {
        href: "/admin/wholesale",
        label: "Checkout",
        icon: ShoppingCart,
        match: (p) => p.startsWith("/admin/wholesale"),
      },
      {
        href: "/admin/vendors",
        label: "Store",
        icon: Store,
        match: (p) => p.startsWith("/admin/vendors") || p.startsWith("/admin/kyc"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        href: "/admin/agent-ops#rewards",
        label: "Rewards",
        icon: Gift,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
      {
        href: "/admin/agent-ops#withdrawals",
        label: "Reward Withdrawals",
        icon: DollarSign,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
      {
        href: "/admin/agent-ops#complaints",
        label: "Agent Complaints",
        icon: MessageSquare,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
    ],
  },
  {
    title: "Extra services",
    items: [
      {
        href: "/admin/agent-ops#claimit",
        label: "ClaimIt",
        icon: Tag,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
      {
        href: "/admin/agent-ops#developer",
        label: "Developer",
        icon: Code,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
      {
        href: "/admin/agent-ops#mtn-afa",
        label: "MTN AFA",
        icon: Shield,
        match: (p) => p.startsWith("/admin/agent-ops"),
      },
      {
        href: "/admin/vendors",
        label: "Agent Profiles",
        icon: User,
        match: (p) => p.startsWith("/admin/vendors"),
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        href: "/admin/operations",
        label: "Operations",
        icon: ShieldCheck,
        match: (p) => p.startsWith("/admin/operations"),
      },
      {
        href: "/admin/disputes",
        label: "Disputes",
        icon: AlertTriangle,
        match: (p) => p.startsWith("/admin/disputes"),
      },
      {
        href: "/admin/promotions",
        label: "Customer Promotions",
        icon: Layers,
        match: (p) => p.startsWith("/admin/promotions"),
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        match: (p) => p.startsWith("/admin/analytics"),
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        match: (p) => p.startsWith("/admin/settings"),
      },
    ],
  },
];

interface AdminShellProps {
  adminName: string;
  adminRole: string;
  children: React.ReactNode;
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
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
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
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-gold/15 text-gold-dark shadow-sm"
                          : "text-muted hover:bg-slate-100 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
            {adminName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
              {adminName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{adminRole}</p>
          </div>
        </div>
        <Link
          href="/"
          className="mb-1 block px-3 py-1 text-sm font-medium text-muted hover:text-foreground"
        >
          Exit to store
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full px-3 py-1 text-left text-sm font-semibold text-red-500 hover:text-red-600"
          >
            Logout
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
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-white",
        className,
      )}
    >
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center border-b border-border px-4"
      >
        <DcsLogo size={36} className="max-w-full" />
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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AdminSidebar pathname={pathname} adminName={adminName} adminRole={adminRole} />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Platform Control</h1>
          </div>
          <button
            type="button"
            className="relative rounded-xl p-2.5 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-500" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile sidebar — same grouped layout as desktop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
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
