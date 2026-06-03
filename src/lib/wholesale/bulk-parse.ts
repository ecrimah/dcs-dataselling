import type { NetworkId } from "@/lib/constants";
import type { WholesaleBundle } from "@/types";

export type BulkNetworkKey = "mtn" | "telecel" | "at-ishare" | "at-bigtime";

export const BULK_NETWORK_OPTIONS: {
  key: BulkNetworkKey;
  label: string;
  network: NetworkId;
  productLine: "ishare" | "bigtime" | null;
}[] = [
  { key: "mtn", label: "MTN", network: "mtn", productLine: null },
  { key: "telecel", label: "TELECEL", network: "telecel", productLine: null },
  { key: "at-ishare", label: "AT - iShare", network: "at", productLine: "ishare" },
  { key: "at-bigtime", label: "AT - BigTime", network: "at", productLine: "bigtime" },
];

export interface BulkOrderRow {
  row: number;
  phone: string;
  sku?: string;
  sizeLabel?: string;
  network?: NetworkId;
  dataMb?: number;
  validityDays?: number;
  quantity: number;
  bundle?: WholesaleBundle;
  error?: string;
}

export function catalogueForBulkNetwork(
  catalogue: WholesaleBundle[],
  networkKey: BulkNetworkKey,
): WholesaleBundle[] {
  const opt = BULK_NETWORK_OPTIONS.find((o) => o.key === networkKey);
  if (!opt) return [];
  return catalogue.filter((b) => {
    if (b.network !== opt.network) return false;
    if (opt.productLine) {
      if (b.productLine) return b.productLine === opt.productLine;
      const q = opt.productLine === "ishare" ? "ishare" : "bigtime";
      return b.name.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q);
    }
    if (b.network === "at" && b.productLine && b.productLine !== "standard") return false;
    return true;
  });
}

/** Parse size text: 2gb, 2gig, 1024mb, or plain 2 (= 2GB). */
export function parseDataSizeToMb(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;

  const mbMatch = s.match(/^(\d+(?:\.\d+)?)mb$/);
  if (mbMatch) return Math.round(parseFloat(mbMatch[1]));

  const gbMatch = s.match(/^(\d+(?:\.\d+)?)(?:gb|gig)$/);
  if (gbMatch) return Math.round(parseFloat(gbMatch[1]) * 1024);

  const plain = s.match(/^(\d+(?:\.\d+)?)$/);
  if (plain) return Math.round(parseFloat(plain[1]) * 1024);

  return null;
}

function findBundleForSize(
  catalogue: WholesaleBundle[],
  dataMb: number,
): WholesaleBundle | undefined {
  const exact = catalogue.filter((b) => b.dataMb === dataMb);
  if (exact.length === 0) return undefined;
  return (
    exact.find((b) => b.popular) ??
    exact.sort((a, b) => a.validityDays - b.validityDays)[0]
  );
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return "";
}

function looksLikePhone(token: string): boolean {
  const d = token.replace(/\D/g, "");
  return d.length >= 9 && d.length <= 12;
}

function looksLikeSize(token: string): boolean {
  return parseDataSizeToMb(token) !== null;
}

/** Split paste/file text into logical order entries (supports two-line phone then volume). */
function extractOrderEntries(text: string): { phoneRaw: string; sizeRaw: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = lines[0].toLowerCase();
  const skipHeader =
    first.includes("phone") &&
    (first.includes("gb") || first.includes("gig") || first.includes("sku") || first.includes("data"));
  const dataLines = skipHeader ? lines.slice(1) : lines;

  const entries: { phoneRaw: string; sizeRaw: string }[] = [];
  let i = 0;
  while (i < dataLines.length) {
    const line = dataLines[i];

    if (line.includes(",") || line.includes(";") || line.includes("\t")) {
      const cols = line.split(/[,;\t]/).map((c) => c.trim());
      entries.push({ phoneRaw: cols[0] ?? "", sizeRaw: cols[1] ?? cols[2] ?? "" });
      i += 1;
      continue;
    }

    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && looksLikePhone(parts[0])) {
      const phonePart = parts[0];
      const sizePart = parts.slice(1).join(" ");
      if (looksLikeSize(sizePart) || parseDataSizeToMb(sizePart) !== null) {
        entries.push({ phoneRaw: phonePart, sizeRaw: sizePart });
        i += 1;
        continue;
      }
    }

    if (
      looksLikePhone(line) &&
      i + 1 < dataLines.length &&
      !looksLikePhone(dataLines[i + 1])
    ) {
      entries.push({ phoneRaw: line, sizeRaw: dataLines[i + 1] });
      i += 2;
      continue;
    }

    entries.push({ phoneRaw: line, sizeRaw: "" });
    i += 1;
  }

  return entries;
}

function resolveEntry(
  entry: { phoneRaw: string; sizeRaw: string },
  row: number,
  scopedCatalogue: WholesaleBundle[],
  fullCatalogue: WholesaleBundle[],
  opt: (typeof BULK_NETWORK_OPTIONS)[number],
): BulkOrderRow {
  const phone = normalizePhone(entry.phoneRaw);
  if (!phone) {
    return { row, phone: entry.phoneRaw, quantity: 1, error: "Invalid phone number" };
  }

  const dataMb = parseDataSizeToMb(entry.sizeRaw);
  if (dataMb === null) {
    return {
      row,
      phone,
      sizeLabel: entry.sizeRaw || undefined,
      quantity: 1,
      error: entry.sizeRaw ? `Unknown size: ${entry.sizeRaw}` : "Missing data size (e.g. 2gb)",
    };
  }

  let bundle = findBundleForSize(scopedCatalogue, dataMb);
  if (!bundle) {
    bundle = findBundleForSize(
      fullCatalogue.filter((b) => b.network === opt.network),
      dataMb,
    );
    if (bundle && opt.productLine && bundle.productLine !== opt.productLine) {
      return {
        row,
        phone,
        dataMb,
        sizeLabel: entry.sizeRaw,
        quantity: 1,
        error: `No ${opt.label} bundle for ${formatSizeLabel(dataMb)}`,
      };
    }
  }

  if (!bundle) {
    return {
      row,
      phone,
      dataMb,
      sizeLabel: entry.sizeRaw,
      quantity: 1,
      error: `No bundle for ${formatSizeLabel(dataMb)} on ${opt.label}`,
    };
  }

  return {
    row,
    phone,
    sku: bundle.sku,
    sizeLabel: entry.sizeRaw,
    network: bundle.network,
    dataMb: bundle.dataMb,
    validityDays: bundle.validityDays,
    quantity: 1,
    bundle,
  };
}

function formatSizeLabel(dataMb: number): string {
  if (dataMb >= 1024 && dataMb % 1024 === 0) return `${dataMb / 1024}GB`;
  return `${dataMb}MB`;
}

/** Paste or file content: phone + GB/gig/MB per line (Skanka5-style). */
export function parseBulkPasteOrders(
  text: string,
  networkKey: BulkNetworkKey,
  catalogue: WholesaleBundle[],
): BulkOrderRow[] {
  const opt = BULK_NETWORK_OPTIONS.find((o) => o.key === networkKey);
  if (!opt) return [];

  const scoped = catalogueForBulkNetwork(catalogue, networkKey);
  const entries = extractOrderEntries(text);

  return entries.map((entry, idx) =>
    resolveEntry(entry, idx + 1, scoped, catalogue, opt),
  );
}

/** Legacy CSV: phone,sku OR phone,network,data_mb,validity_days */
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

    if (cols[1] && !cols[1].toUpperCase().includes("-")) {
      const dataMb = parseDataSizeToMb(cols[1]);
      if (dataMb !== null) {
        bundle = findBundleForSize(catalogue, dataMb);
        if (!bundle) {
          return { row, phone, sizeLabel: cols[1], quantity, error: `No bundle for ${cols[1]}` };
        }
        return { row, phone, sku: bundle.sku, quantity, bundle };
      }
    }

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

export function parseBulkOrders(
  text: string,
  catalogue: WholesaleBundle[],
  networkKey?: BulkNetworkKey,
): BulkOrderRow[] {
  if (networkKey) return parseBulkPasteOrders(text, networkKey, catalogue);
  return parseBulkOrderCsv(text, catalogue);
}

export const BULK_ORDER_TEMPLATE_CSV = "phone,gb\n0241234567,2\n0551234567,5\n";

export function validBulkRows(rows: BulkOrderRow[]): BulkOrderRow[] {
  return rows.filter((r) => r.bundle && !r.error);
}
