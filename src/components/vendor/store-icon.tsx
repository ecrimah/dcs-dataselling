import { cn } from "@/lib/utils";
import { resolveVendorStoreIconComponent } from "@/lib/vendor-store-icons";

interface StoreIconProps {
  icon?: string | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function StoreIcon({
  icon,
  size = 20,
  strokeWidth = 2,
  className,
}: StoreIconProps) {
  const Icon = resolveVendorStoreIconComponent(icon);
  return (
    <Icon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
