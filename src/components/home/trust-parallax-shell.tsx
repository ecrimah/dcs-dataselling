import type { ReactNode } from "react";

interface TrustParallaxShellProps {
  children: ReactNode;
}

/**
 * Fixed-background parallax: the photo stays pinned to the viewport
 * while section content scrolls over it (background-attachment: fixed).
 */
export function TrustParallaxShell({ children }: TrustParallaxShellProps) {
  return (
    <section
      id="trust"
      className="relative isolate px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
    >
      <div
        aria-hidden
        className="trust-parallax-bg pointer-events-none absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-trust.png)" }}
      />

      {/* 20% dark overlay */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/20" />

      {/* Soft vignette for card readability */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(6, 9, 20, 0.2) 0%, transparent 50%, rgba(6, 9, 20, 0.25) 100%)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
}
