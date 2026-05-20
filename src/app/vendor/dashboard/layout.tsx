import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="vendor" title="Vendor Dashboard">{children}</DashboardShell>;
}
