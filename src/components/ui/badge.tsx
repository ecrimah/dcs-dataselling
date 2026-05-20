import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border border-gold/25 bg-gold/10 text-gold-dark",
        success: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
        warning: "border border-gold/30 bg-gold/15 text-gold-dark",
        danger: "border border-red-500/20 bg-red-500/10 text-red-700",
        neutral: "border border-border bg-surface-soft text-muted",
        verified: "border border-gold/35 bg-gold/15 text-royal",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
