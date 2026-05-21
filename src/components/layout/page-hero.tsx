import Image from "next/image";
import type { ReactNode } from "react";

interface PageHeroProps {
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  accent?: "cyan" | "emerald" | "gold";
  children: ReactNode;
  footer?: ReactNode;
}

export function PageHero({
  imageSrc,
  imageAlt,
  imagePosition = "70% 30%",
  accent = "cyan",
  children,
  footer,
}: PageHeroProps) {
  const aurora =
    accent === "emerald"
      ? `
          radial-gradient(ellipse 50% 40% at 8% 20%, rgba(16, 185, 129, 0.16), transparent 70%),
          radial-gradient(ellipse 40% 30% at 12% 90%, rgba(34, 211, 238, 0.12), transparent 70%),
          radial-gradient(ellipse 30% 30% at 92% 50%, rgba(34, 211, 238, 0.12), transparent 70%)
        `
      : accent === "gold"
        ? `
          radial-gradient(ellipse 50% 40% at 8% 20%, rgba(212, 175, 55, 0.16), transparent 70%),
          radial-gradient(ellipse 40% 30% at 12% 90%, rgba(10, 46, 93, 0.35), transparent 70%),
          radial-gradient(ellipse 30% 30% at 92% 50%, rgba(244, 209, 96, 0.10), transparent 70%)
        `
      : `
          radial-gradient(ellipse 50% 40% at 8% 20%, rgba(34, 211, 238, 0.18), transparent 70%),
          radial-gradient(ellipse 40% 30% at 12% 90%, rgba(139, 92, 246, 0.14), transparent 70%),
          radial-gradient(ellipse 30% 30% at 92% 50%, rgba(245, 158, 11, 0.08), transparent 70%)
        `;

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `
            linear-gradient(95deg,
              rgba(6, 9, 20, 0.94) 0%,
              rgba(6, 9, 20, 0.88) 35%,
              rgba(6, 9, 20, 0.5) 58%,
              rgba(6, 9, 20, 0.2) 78%,
              rgba(6, 9, 20, 0.45) 100%),
            linear-gradient(180deg,
              rgba(6, 9, 20, 0.15) 0%,
              rgba(6, 9, 20, 0.0) 45%,
              rgba(6, 9, 20, 0.88) 100%)
          `,
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: aurora, mixBlendMode: "screen" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </section>
  );
}
