import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  actions?: React.ReactNode;
  decorativeIcon?: LucideIcon;
  className?: string;
}

export function DashboardPageHero({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  decorativeIcon: DecorativeIcon,
  className,
}: DashboardPageHeroProps) {
  return (
    <section className={cn("vault-hero-card relative", className)}>
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {badge && (
            <span className="vault-hero-chip mb-3">
              <Icon className="h-3.5 w-3.5" />
              {badge}
            </span>
          )}
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-xl text-sm text-white/65">{subtitle}</p>
          {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
        </div>
        {DecorativeIcon && (
          <div
            className="pointer-events-none hidden h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 sm:flex"
            aria-hidden
          >
            <DecorativeIcon className="h-10 w-10 text-white/35" />
          </div>
        )}
      </div>
    </section>
  );
}

interface ProfileHeroProps {
  initials: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  badges: React.ReactNode;
  actions: React.ReactNode;
}

export function DashboardProfileHero({
  initials,
  fullName,
  email,
  avatarUrl,
  badges,
  actions,
}: ProfileHeroProps) {
  return (
    <section className="vault-hero-card">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-20 w-20 rounded-full border-2 border-white/15 object-cover shadow-md sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 text-2xl font-bold text-white backdrop-blur-sm sm:h-24 sm:w-24">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold uppercase tracking-wide text-white sm:text-2xl">
              {fullName}
            </h1>
            <p className="mt-0.5 truncate text-sm text-white/70">{email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">{actions}</div>
      </div>
    </section>
  );
}

export function DashboardInfoCard({
  icon: Icon,
  title,
  description,
  children,
  iconTone = "blue",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  iconTone?: "blue" | "emerald" | "sky" | "violet" | "amber" | "indigo";
}) {
  const tones = {
    blue: "tile-icon-sky",
    emerald: "tile-icon-emerald",
    sky: "tile-icon-sky",
    violet: "tile-icon-violet",
    amber: "tile-icon-amber",
    indigo: "tile-icon-violet",
  };

  return (
    <article className="section-card">
      <header className="section-card-header flex items-start gap-3">
        <div className={cn("stat-tile-icon shrink-0", tones[iconTone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-extrabold tracking-tight text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </header>
      {children}
    </article>
  );
}

export function DashboardInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
