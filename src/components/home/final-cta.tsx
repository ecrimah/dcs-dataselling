import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div
        className="mx-auto max-w-7xl overflow-hidden rounded-2xl"
        style={{
          background: `
            radial-gradient(at 18% 12%, rgba(6, 182, 212, 0.18) 0px, transparent 45%),
            radial-gradient(at 82% 8%, rgba(59, 130, 246, 0.16) 0px, transparent 50%),
            radial-gradient(at 70% 92%, rgba(20, 184, 166, 0.14) 0px, transparent 45%),
            linear-gradient(180deg, #060914 0%, #0a1124 60%, #111a35 100%)
          `,
        }}
      >
        <div className="relative px-6 py-12 text-center sm:px-12 lg:py-16">
          <span className="eyebrow text-cyan-300">Ready when you are</span>
          <h2 className="display-1 mx-auto mt-2 max-w-2xl text-white">
            Buy data in seconds.{" "}
            <span className="text-aurora">Or build a business selling it.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
            Customers buy through their agent&apos;s private link. Agents get their
            own branded store — same trust layer.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button size="sm" asChild>
              <Link href="/buy">
                Buy through your agent
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/create-store">Create your store</Link>
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            No signup needed to buy · 5-min setup to sell
          </p>
        </div>
      </div>
    </section>
  );
}
