import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Bell, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { CreateStoreCta } from "@/components/home/create-store-cta";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentVendor } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StoreIcon } from "@/components/vendor/store-icon";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!hasSupabaseConfig()) {
    redirect("/auth/login");
  }
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const vendor = await getCurrentVendor();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </header>

        {!vendor && <CreateStoreCta />}

        {vendor && (
          <Link
            href="/vendor/dashboard"
            className="card-elevated flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: resolveThemeBackground(vendor.themeColor) }}
              >
                <StoreIcon icon={vendor.emoji} size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">{vendor.businessName}</p>
                <p className="text-xs text-muted">
                  {vendor.kycStatus === "verified"
                    ? "Manage your store"
                    : vendor.kycStatus === "pending_review"
                      ? "Verification pending"
                      : "Complete setup"}
                </p>
              </div>
            </div>
            <Badge
              variant={
                vendor.kycStatus === "verified"
                  ? "success"
                  : vendor.kycStatus === "rejected"
                    ? "danger"
                    : "warning"
              }
            >
              {vendor.kycStatus?.replace("_", " ")}
            </Badge>
          </Link>
        )}

        <ul className="space-y-2">
          <AccountLink href="/account/orders" icon={ShoppingBag} title="Orders" sub="Your purchase history" />
          <AccountLink href="/account/notifications" icon={Bell} title="Notifications" sub="Order updates and promos" />
          <AccountLink
            href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`}
            icon={MessageCircle}
            title="WhatsApp Support"
            sub="Chat with our team"
          />
          <AccountLink href="/account/settings" icon={SettingsIcon} title="Settings" sub="Profile, security, preferences" />
        </ul>
      </div>
    </div>
  );
}

function AccountLink({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <li>
      <Link href={href} className="card-elevated flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-5 w-5 text-muted" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted">{sub}</p>
        </div>
      </Link>
    </li>
  );
}
