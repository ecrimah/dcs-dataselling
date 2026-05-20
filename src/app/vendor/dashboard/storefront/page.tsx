import { redirect } from "next/navigation";
import { Eye, Share2 } from "lucide-react";
import { SITE } from "@/lib/constants";
import { getCurrentVendor } from "@/lib/auth/session";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { Button } from "@/components/ui/button";
import { ShareKit } from "@/components/vendor/share-kit";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const storeUrl = `${SITE.url.replace(/\/$/, "")}/vendor/${vendor.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Your storefront</h2>
          <p className="mt-1 text-sm text-muted">Customize how buyers see your store.</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href={`/vendor/${vendor.slug}`} target="_blank">
            <Eye className="h-4 w-4" />
            Preview
          </Link>
        </Button>
      </div>

      <div
        className="rounded-2xl p-8 text-white shadow-lg"
        style={{ background: resolveThemeBackground(vendor.themeColor) }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <StoreIcon icon={vendor.emoji} size={32} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{vendor.businessName}</h3>
            <p className="text-sm text-white/80">{storeUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <h3 className="font-semibold">Share your store</h3>
        </div>
        <p className="mt-1 text-sm text-muted">Send your link to friends, customers, and groups.</p>
        <div className="mt-4">
          <ShareKit storeUrl={storeUrl} businessName={vendor.businessName} />
        </div>
      </div>

      <div className="card-elevated p-5">
        <h3 className="font-semibold">Refer & earn</h3>
        <p className="mt-1 text-sm text-muted">
          Invite friends to sell on DCS — earn ₵10 when they make their first sale.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-4 py-3">
          <code className="flex-1 font-mono text-sm font-bold tracking-wider">
            {vendor.referralCode}
          </code>
          <Button size="sm" variant="ghost">
            Copy code
          </Button>
        </div>
      </div>
    </div>
  );
}
