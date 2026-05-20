import Image from "next/image";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 614 / 377;

interface DcsLogoProps {
  className?: string;
  /** Lockup height in pixels */
  size?: number;
  priority?: boolean;
}

export function DcsLogo({ className, size = 36, priority = false }: DcsLogoProps) {
  const height = size;
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <Image
      src={SITE.logo}
      alt={SITE.name}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto shrink-0 object-contain", className)}
      style={{ width, height }}
    />
  );
}
