"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  LogOut,
  Menu,
  Shield,
  AlertTriangle,
  Store,
  Tag,
  Layers,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { DcsLogo } from "@/components/brand/dcs-logo";
import { cn } from "@/lib/utils";

type DashboardRole = "vendor" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VENDOR_NAV: NavItem[] = [
  { href: "/vendor/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/dashboard/wholesale", label: "Buy Data", icon: Layers },
  { href: "/vendor/dashboard/orders", label: "My Orders", icon: ShoppingCart },
  { href: "/vendor/dashboard/catalogue", label: "Resale Pricing", icon: Tag },
  { href: "/vendor/dashboard/storefront", label: "Storefront", icon: Store },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendor Governance", icon: Users },
  { href: "/admin/wholesale", label: "Wholesale Catalogue", icon: Layers },
  { href: "/admin/operations", label: "Operations", icon: Shield },
  { href: "/admin/orders", label: "All Orders", icon: ShoppingCart },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/promotions", label: "Promotions", icon: Package },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface DashboardShellProps {
  role: DashboardRole;
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, title, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = role === "admin" ? ADMIN_NAV : VENDOR_NAV;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href={role === "admin" ? "/admin" : "/vendor/dashboard"}
          className="flex h-16 items-center border-b border-border px-4"
        >
          <DcsLogo size={36} className="max-w-full" />
        </Link>
        <nav className="space-y-0.5 p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/vendor/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold/10 text-gold-dark"
                    : "text-muted hover:bg-slate-100 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 space-y-1 border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-slate-100"
          >
            Exit to Store
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-xl p-2.5 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-500" />
            </button>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white sm:flex">
              DC
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
