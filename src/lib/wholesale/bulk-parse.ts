import type { NetworkId } from "@/lib/constants";
import type { WholesaleBundle } from "@/types";

export interface BulkOrderRow {
  row: number;
  phone: string;
  sku?: string;
  network?: NetworkId;
  dataMb?: number;
  validityDays?: number;
  quantity: number;
  bundle?: WholesaleBundle;
  error?: string;
}

/** Parse CSV/TSV text: phone,sku OR phone,network,data_mb,validity_days[,quantity] */
export function parseBulkOrderCsv(
  text: string,
  catalogue: WholesaleBundle[],
): BulkOrderRow[] {
  const bySku = new Map(catalogue.map((b) => [b.sku.toUpperCase(), b]));
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("phone") || header.includes("sku") || header.includes("network");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, idx) => {
    const row = hasHeader ? idx + 2 : idx + 1;
    const cols = line.split(/[,;\t]/).map((c) => c.trim());
    const phone = normalizePhone(cols[0] ?? "");

    if (!phone) {
      return { row, phone: cols[0] ?? "", quantity: 1, error: "Invalid phone number" };
    }

    let bundle: WholesaleBundle | undefined;
    let quantity = 1;

    if (cols[1]?.toUpperCase().includes("-") || cols.length === 2) {
      const sku = (cols[1] ?? "").toUpperCase();
      bundle = bySku.get(sku);
      if (cols[2]) quantity = Math.max(1, parseInt(cols[2], 10) || 1);
      if (!bundle) {
        return { row, phone, sku: cols[1], quantity, error: `Unknown SKU: ${cols[1]}` };
      }
    } else {
      const network = cols[1]?.toLowerCase() as NetworkId;
      const dataMb = parseInt(cols[2] ?? "", 10);
      const validityDays = parseInt(cols[3] ?? "", 10);
      if (cols[4]) quantity = Math.max(1, parseInt(cols[4], 10) || 1);

      bundle = catalogue.find(
        (b) =>
          b.network === network &&
          b.dataMb === dataMb &&
          b.validityDays === validityDays,
      );

      if (!bundle) {
        return {
          row,
          phone,
          network,
          dataMb,
          validityDays,
          quantity,
          error: "No matching product in catalogue",
        };
      }
    }

    return { row, phone, sku: bundle.sku, quantity, bundle };
  });
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return "";
}

export function bulkRowsTotal(rows: BulkOrderRow[]): number {
  return rows
    .filter((r) => r.bundle && !r.error)
    .reduce((sum, r) => sum + (r.bundle!.wholesalePrice * r.quantity), 0);
}

export function validBulkRows(rows: BulkOrderRow[]): BulkOrderRow[] {
  return rows.filter((r) => r.bundle && !r.error);
}
