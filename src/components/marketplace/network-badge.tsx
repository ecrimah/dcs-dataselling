import { NETWORKS } from "@/lib/constants";
import type { NetworkId } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NetworkBadgeProps {
  network: NetworkId;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function NetworkBadge({ network, size = "md", className }: NetworkBadgeProps) {
  const config = NETWORKS.find((n) => n.id === network);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg font-bold tracking-wide",
        size === "xs"
          ? "px-1.5 py-0 text-[8px] rounded-md"
          : size === "sm"
            ? "px-2 py-0.5 text-[10px]"
            : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: config.color,
        color: config.textColor,
      }}
    >
      {config.name}
    </span>
  );
}
