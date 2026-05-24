import { redirect } from "next/navigation";
import { Eye, Share2, Store } from "lucide-react";
import Link from "next/link";
import {
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
} from "@/components/admin";
import { SITE } from "@/lib/constants";
import { getCurrentVendor } from "@/lib/auth/session";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { Button } from "@/components/ui/button";
import { ShareKit } from "@/components/vendor/share-kit";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");

  const storeUrl = `${SITE.url.replace(/\/$/, "")}/vendor/${vendor.slug}`;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Your store"
        description="Customize how buyers see your store and share your link."
        meta={storeUrl.replace(/^https?:\/\//, "")}
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/vendor/${vendor.slug}`} target="_blank">
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </Button>
        }
      />

      <div
        className="overflow-hidden rounded-xl p-5 text-white shadow-md"
        style={{ background: resolveThemeBackground(vendor.themeColor) }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <StoreIcon icon={vendor.emoji} size={24} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{vendor.businessName}</h3>
            <p className="text-xs text-white/80">{storeUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
      </div>

      <AdminSection title="Share your store" description="Send your link to friends, customers, and groups." icon={Share2}>
        <ShareKit storeUrl={storeUrl} businessName={vendor.businessName} />
      </AdminSection>

      <AdminSection title="Refer & earn" description="Invite friends to sell on DCS — earn ₵10 when they make their first sale." icon={Store}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2.5">
          <code className="admin-promo-code flex-1">{vendor.referralCode}</code>
          <Button size="sm" variant="ghost">
            Copy code
          </Button>
        </div>
      </AdminSection>
    </AdminPageRoot>
  );
}
