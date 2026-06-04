/** Plain GB number for bulk paste/export (no "GB" suffix). */
export function dataMbToVolumeGb(dataMb: number): number {
  if (!dataMb || dataMb <= 0) return 0;
  if (dataMb >= 1024) {
    const gb = dataMb / 1024;
    return gb % 1 === 0 ? gb : Math.round(gb * 10) / 10;
  }
  return Math.round((dataMb / 1024) * 100) / 100;
}

export function networkPackageLabel(network: string): string {
  const n = network.trim().toLowerCase();
  if (n === "mtn") return "MTN";
  if (n === "telecel") return "TELECEL";
  if (n === "at") return "AT";
  return network ? network.toUpperCase() : "—";
}

export function exportOrderTypeLabel(orderType: string): string {
  switch (orderType) {
    case "storefront":
      return "SINGLE";
    case "manual":
    case "internal":
      return "Internal";
    case "bulk":
      return "bulk";
    default:
      return orderType;
  }
}

/** One line for the bulk paste box: `0241234567 10` */
export function formatBulkPasteLine(phone: string, volumeGb: number): string {
  const vol = volumeGb % 1 === 0 ? String(volumeGb) : String(volumeGb);
  return `${phone} ${vol}`.trim();
}

export const BULK_TEMPLATE_HEADERS = ["Number", "Volume", "Order Type", "Package"] as const;

export const BULK_ORDER_TEMPLATE_CSV = [
  BULK_TEMPLATE_HEADERS.join(","),
  "0241234567,10,SINGLE,MTN",
  "0551234567,20,bulk,MTN",
  "0201234567,5,wholesale,MTN",
].join("\n");
