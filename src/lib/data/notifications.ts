import "server-only";
import type { NetworkId } from "@/lib/constants";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export type NotificationStatusLabel = "PROCESSING" | "UNDELIVERED" | "QUEUED";

export interface PlatformNotification {
  id: string;
  kind: "order" | "mtn_afa" | "ops";
  network: string | null;
  statusLabel: NotificationStatusLabel | "PENDING";
  title: string;
  description: string;
  count: number;
  href: string;
  iconLetter: string;
}

const NETWORK_LABEL: Record<string, string> = {
  mtn: "MTN",
  telecel: "TELECEL",
  at: "AT",
};

function networkLabel(network: string): string {
  return NETWORK_LABEL[network] ?? network.toUpperCase();
}

function isAfaBundle(bundle: {
  network: string;
  name: string | null;
  sku: string | null;
  product_line?: string | null;
}): boolean {
  const hay = `${bundle.name ?? ""} ${bundle.sku ?? ""} ${bundle.product_line ?? ""}`.toLowerCase();
  return bundle.network === "mtn" && hay.includes("afa");
}

function bucketItemStatus(
  status: string,
  supplierStatus: string | null,
): NotificationStatusLabel | null {
  const sup = (supplierStatus ?? "").toLowerCase();
  if (status === "failed" || sup === "failed") return "UNDELIVERED";
  if (status === "processing" || sup.includes("process")) return "PROCESSING";
  if (status === "queued" || status === "pending") return "PROCESSING";
  return null;
}

function addGroup(
  map: Map<string, PlatformNotification>,
  key: string,
  partial: Omit<PlatformNotification, "id" | "count"> & { count?: number },
) {
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }
  map.set(key, { ...partial, id: key, count: partial.count ?? 1 });
}

export async function fetchPlatformNotifications(options?: {
  vendorId?: string;
  includeOps?: boolean;
}): Promise<PlatformNotification[]> {
  if (!hasSupabaseConfig()) return [];

  const service = createServiceClient();
  const map = new Map<string, PlatformNotification>();
  const vendorId = options?.vendorId;
  const includeOps = options?.includeOps ?? !vendorId;

  let wholesaleQuery = service
    .from("wholesale_order_items")
    .select(
      `
      id, status, supplier_status,
      wholesale_orders!inner ( id, status, vendor_id ),
      wholesale_bundles!inner ( network, name, sku, product_line )
    `,
    )
    .not("status", "eq", "fulfilled")
    .in("wholesale_orders.status", ["paid", "queued", "processing"]);

  if (vendorId) {
    wholesaleQuery = wholesaleQuery.eq("wholesale_orders.vendor_id", vendorId);
  }

  const { data: wholesaleItems } = await wholesaleQuery;

  type WItem = {
    status: string;
    supplier_status: string | null;
    wholesale_orders: { status: string; vendor_id: string };
    wholesale_bundles:
      | { network: string; name: string; sku: string; product_line: string | null }
      | { network: string; name: string; sku: string; product_line: string | null }[];
  };

  for (const row of (wholesaleItems ?? []) as unknown as WItem[]) {
    const wb = Array.isArray(row.wholesale_bundles)
      ? row.wholesale_bundles[0]
      : row.wholesale_bundles;
    if (!wb) continue;

    const bucket = bucketItemStatus(row.status, row.supplier_status);
    if (!bucket) continue;

    const net = networkLabel(wb.network);
    const afa = isAfaBundle(wb);

    if (afa && bucket === "UNDELIVERED") {
      addGroup(map, "mtn-afa-undelivered", {
        kind: "mtn_afa",
        network: "mtn",
        statusLabel: "UNDELIVERED",
        title: "MTN AFA UNDELIVERED",
        description: "You have AFA orders with status UNDELIVERED.",
        href: vendorId ? "/vendor/dashboard/orders" : "/admin/orders",
        iconLetter: "AFA",
      });
      const g = map.get("mtn-afa-undelivered")!;
      g.title = `MTN AFA UNDELIVERED - ${g.count} Order${g.count === 1 ? "" : "s"}`;
      g.description = `You have ${g.count} Afa order${g.count === 1 ? "" : "s"} with status UNDELIVERED.`;
      continue;
    }

    const key = `order-${wb.network}-${bucket}`;
    addGroup(map, key, {
      kind: "order",
      network: wb.network,
      statusLabel: bucket,
      title: `${net} - ${bucket}`,
      description: `You have ${bucket} orders related to network: ${net}.`,
      href: vendorId ? "/vendor/dashboard/orders" : "/admin/orders",
      iconLetter: bucket === "UNDELIVERED" ? "U" : "P",
    });
    const g = map.get(key)!;
    g.title = `${net} - ${bucket} - ${g.count} order${g.count === 1 ? "" : "s"}`;
    g.description = `You have ${bucket} - ${g.count} related to network: ${net}.`;
  }

  if (!vendorId) {
    let customerQuery = service
      .from("orders")
      .select("id, status, bundles ( network )")
      .in("status", ["queued", "processing", "failed"]);

    const { data: customerOrders } = await customerQuery;

    type CRow = {
      status: string;
      bundles: { network: NetworkId } | { network: NetworkId }[] | null;
    };

    for (const row of (customerOrders ?? []) as unknown as CRow[]) {
      const b = Array.isArray(row.bundles) ? row.bundles[0] : row.bundles;
      if (!b?.network) continue;
      const bucket = bucketItemStatus(row.status, null);
      if (!bucket) continue;

      const net = networkLabel(b.network);
      const key = `customer-${b.network}-${bucket}`;
      addGroup(map, key, {
        kind: "order",
        network: b.network,
        statusLabel: bucket,
        title: `${net} (store) - ${bucket}`,
        description: `Customer orders ${bucket} on ${net}.`,
        href: "/admin/orders",
        iconLetter: bucket === "UNDELIVERED" ? "U" : "P",
      });
      const g = map.get(key)!;
      g.title = `${net} (store) - ${bucket} - ${g.count} order${g.count === 1 ? "" : "s"}`;
      g.description = `You have ${g.count} customer order${g.count === 1 ? "" : "s"} ${bucket} on ${net}.`;
    }
  }

  if (includeOps) {
    const [pendingAfa, openComplaints, pendingVendors] = await Promise.all([
      service
        .from("vendor_mtn_afa")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      service
        .from("vendor_complaints")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      service
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const afaCount = pendingAfa.count ?? 0;
    if (afaCount > 0) {
      addGroup(map, "ops-mtn-afa-pending", {
        kind: "ops",
        network: "mtn",
        statusLabel: "PENDING",
        title: `MTN AFA applications - ${afaCount} pending`,
        description: "Agents waiting for AFA ID verification.",
        href: "/admin/agent-ops#mtn-afa",
        iconLetter: "AFA",
        count: afaCount,
      });
    }

    const complaintCount = openComplaints.count ?? 0;
    if (complaintCount > 0) {
      addGroup(map, "ops-complaints", {
        kind: "ops",
        network: null,
        statusLabel: "PENDING",
        title: `Complaints - ${complaintCount} open`,
        description: "Vendor complaints need a response.",
        href: "/admin/agent-ops#complaints",
        iconLetter: "C",
        count: complaintCount,
      });
    }

    const vendorCount = pendingVendors.count ?? 0;
    if (vendorCount > 0) {
      addGroup(map, "ops-vendors", {
        kind: "ops",
        network: null,
        statusLabel: "PENDING",
        title: `Vendor approvals - ${vendorCount} pending`,
        description: "New store applications awaiting review.",
        href: "/admin/vendors",
        iconLetter: "V",
        count: vendorCount,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
