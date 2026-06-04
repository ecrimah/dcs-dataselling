import type { AdminOrderBoardRow } from "@/lib/data/admin-orders-board";
import {
  BULK_TEMPLATE_HEADERS,
  dataMbToVolumeGb,
  exportOrderTypeLabel,
  networkPackageLabel,
} from "@/lib/wholesale/bulk-format";

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Bulk-paste layout: Number + Volume side by side (matches dcs-bulk-orders-template.csv). */
export function buildOrdersExportCsv(rows: AdminOrderBoardRow[]): string {
  const headers = [...BULK_TEMPLATE_HEADERS];

  const lines = [
    headers.join(","),
    ...rows.map((r) => {
      const volume = dataMbToVolumeGb(r.dataMb);
      return [
        r.beneficiary,
        volume > 0 ? volume : "",
        exportOrderTypeLabel(r.orderType),
        networkPackageLabel(r.network),
      ]
        .map(csvCell)
        .join(",");
    }),
  ];

  return lines.join("\r\n");
}

export function downloadOrdersCsv(rows: AdminOrderBoardRow[], filename: string) {
  const csv = buildOrdersExportCsv(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
