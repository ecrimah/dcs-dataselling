import type { AdminOrderBoardRow } from "@/lib/data/admin-orders-board";

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildOrdersExportCsv(rows: AdminOrderBoardRow[]): string {
  const headers = [
    "Order Code",
    "Package",
    "Price (GHS)",
    "Beneficiary",
    "Order Reference",
    "Data Volume",
    "Order Date",
    "Agent",
    "Order Type",
    "Payment Method",
    "Order Status",
    "Payment Status",
    "Commission (GHS)",
    "API Status",
    "API Source",
    "API Reference",
    "Line Kind",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.orderCode,
        r.packageName,
        r.price.toFixed(2),
        r.beneficiary,
        r.orderReference,
        r.dataVolume,
        r.orderedAt,
        r.agentName,
        r.orderType,
        r.paymentMethod,
        r.orderStatus,
        r.paymentStatus,
        r.commission != null ? r.commission.toFixed(2) : "",
        r.apiStatus ?? "",
        r.apiSource ?? "",
        r.apiReference ?? "",
        r.kind,
      ]
        .map(csvCell)
        .join(","),
    ),
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
