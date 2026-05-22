import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        // Vault chip variants (dark surface)
        default: "border border-gold/25 bg-gold/14 text-[#f4d160]",
        success: "border border-emerald-500/30 bg-emerald-500/14 text-emerald-300",
        warning: "border border-amber-500/30 bg-amber-500/14 text-amber-300",
        danger: "border border-rose-500/30 bg-rose-500/14 text-rose-300",
        neutral: "border border-white/8 bg-white/5 text-white/65",
        verified: "border border-gold/35 bg-gold/18 text-[#fff5cd]",
        sky: "border border-sky-500/30 bg-sky-500/14 text-sky-300",
        violet: "border border-violet-500/30 bg-violet-500/14 text-violet-300",
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
