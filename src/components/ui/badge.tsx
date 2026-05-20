import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-cyan-500/10 text-cyan-700 border border-cyan-500/20",
        success: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
        danger: "bg-red-500/10 text-red-700 border border-red-500/20",
        neutral: "bg-slate-100 text-slate-600 border border-slate-200",
        verified: "bg-cyan-500/15 text-cyan-600 border border-cyan-400/30",
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
