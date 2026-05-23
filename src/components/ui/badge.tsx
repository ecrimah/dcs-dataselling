import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        // Dual-tone variants: readable on both light susu canvas and dark navy cards.
        default: "border border-amber-300 bg-amber-50 text-amber-800",
        success: "border border-emerald-300 bg-emerald-50 text-emerald-800",
        warning: "border border-amber-300 bg-amber-50 text-amber-900",
        danger: "border border-rose-300 bg-rose-50 text-rose-800",
        neutral: "border border-slate-200 bg-slate-50 text-slate-700",
        verified: "border border-amber-400 bg-amber-100 text-amber-900",
        sky: "border border-sky-300 bg-sky-50 text-sky-800",
        violet: "border border-violet-300 bg-violet-50 text-violet-800",
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
