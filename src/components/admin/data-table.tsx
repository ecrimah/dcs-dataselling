import { cn } from "@/lib/utils";

export function AdminDataTable({
  children,
  minWidth = "720px",
  fluid = false,
  className,
}: {
  children: React.ReactNode;
  minWidth?: string;
  /** Fit table to container width without horizontal scroll */
  fluid?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("admin-data-table", fluid && "admin-data-table-fluid", className)}>
      <div className={cn(!fluid && "overflow-x-auto")}>
        <table
          className="w-full text-sm"
          style={fluid ? undefined : { minWidth }}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="admin-table-head-row">{children}</tr>
    </thead>
  );
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="admin-table-body">{children}</tbody>;
}

export function AdminTh({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={cn("admin-table-th", className)}>{children}</th>;
}

export function AdminTd({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td className={cn("admin-table-td", className)} title={title}>
      {children}
    </td>
  );
}

export function AdminTr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={cn("admin-table-tr", className)}>{children}</tr>;
}
