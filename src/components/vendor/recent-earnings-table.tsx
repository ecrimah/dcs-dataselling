import Link from "next/link";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminSection,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/components/admin";
import { NetworkBadge } from "@/components/marketplace/network-badge";
import { formatGHS, formatDataAmount } from "@/lib/format";
import type { VendorEarningRow } from "@/lib/data/vendor-earnings";
import { cn } from "@/lib/utils";

interface Props {
  rows: VendorEarningRow[];
  compact?: boolean;
  showViewAll?: boolean;
}

function statusTone(label: string): string {
  if (label === "DELIVERED") return "bg-emerald-100 text-emerald-800";
  if (label === "FAILED") return "bg-red-100 text-red-700";
  if (label === "PROCESSING") return "bg-amber-100 text-amber-800";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

export function RecentEarningsTable({ rows, compact, showViewAll }: Props) {
  const display = compact ? rows.slice(0, 6) : rows;

  return (
    <AdminSection
      title="Recent Earnings"
      description="Profit from customers who bought on your storefront."
      icon={DollarSign}
      actions={
        showViewAll ? (
          <Link
            href="/vendor/dashboard/earnings"
            className="text-xs font-semibold text-amber-800 hover:underline"
          >
            View all
          </Link>
        ) : undefined
      }
    >
      {display.length === 0 ? (
        <AdminEmptyState
          icon={DollarSign}
          title="No storefront sales yet"
          description="Set your prices under My Prices, share your store link, and earnings will show here."
          action={
            <Link
              href="/vendor/dashboard/catalogue"
              className="inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
            >
              Set my prices
            </Link>
          }
        />
      ) : (
        <AdminDataTable minWidth={compact ? "720px" : "960px"}>
          <AdminTableHead>
            <AdminTh>Date</AdminTh>
            <AdminTh>Package</AdminTh>
            <AdminTh>Sale price</AdminTh>
            <AdminTh>Base price</AdminTh>
            <AdminTh>Profit</AdminTh>
            <AdminTh>Status</AdminTh>
          </AdminTableHead>
          <AdminTableBody>
            {display.map((row) => (
              <AdminTr key={row.id}>
                <AdminTd className="whitespace-nowrap text-xs text-muted-foreground">
                  {format(new Date(row.orderedAt), compact ? "MMM dd, HH:mm" : "MMM dd, yyyy HH:mm")}
                </AdminTd>
                <AdminTd>
                  <div className="flex items-center gap-2">
                    <NetworkBadge network={row.network} size="sm" />
                    <span className="text-sm font-medium">
                      {row.dataMb > 0 ? formatDataAmount(row.dataMb) : row.packageLabel}
                    </span>
                  </div>
                </AdminTd>
                <AdminTd className="font-medium tabular-nums">{formatGHS(row.salePrice)}</AdminTd>
                <AdminTd className="tabular-nums text-muted-foreground">
                  {formatGHS(row.basePrice)}
                </AdminTd>
                <AdminTd className="font-semibold tabular-nums text-emerald-600">
                  {formatGHS(row.profit)}
                </AdminTd>
                <AdminTd>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      statusTone(row.statusLabel),
                    )}
                  >
                    {row.statusLabel === "PENDING" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {row.statusLabel}
                  </span>
                </AdminTd>
              </AdminTr>
            ))}
          </AdminTableBody>
        </AdminDataTable>
      )}
    </AdminSection>
  );
}
