import type { UserRole } from "@/types";

const ROLE_ROUTES: Record<UserRole, string[]> = {
  customer: ["/account", "/orders", "/checkout"],
  vendor: ["/vendor/dashboard"],
  admin: ["/admin"],
  ops: ["/admin/operations", "/vendor/dashboard"],
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "admin") return pathname.startsWith("/admin");
  if (role === "ops") {
    return pathname.startsWith("/admin/operations") || pathname.startsWith("/vendor/dashboard");
  }
  if (role === "vendor") return pathname.startsWith("/vendor/dashboard");
  return !pathname.startsWith("/admin") && !pathname.startsWith("/vendor/dashboard");
}

export function getDashboardHome(role: UserRole): string {
  switch (role) {
    case "admin":
    case "ops":
      return "/admin";
    case "vendor":
      return "/vendor/dashboard";
    default:
      return "/account";
  }
}

export { ROLE_ROUTES };
