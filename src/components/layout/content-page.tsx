import type { ReactNode } from "react";
import { PageHero } from "@/components/layout/page-hero";

interface ContentPageProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  accent?: "cyan" | "emerald" | "gold";
  children: ReactNode;
}

export function ContentPage({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  accent = "cyan",
  children,
}: ContentPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero imageSrc={imageSrc} imageAlt={imageAlt} accent={accent}>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            {subtitle}
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <article className="card-elevated space-y-6 p-6 sm:p-8">{children}</article>
      </div>
    </div>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
