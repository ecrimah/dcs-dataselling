import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShoppingBag, Bell, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentVendor } from "@/lib/auth/session";
import {
  getPaidSetupAwaitingStore,
  reconcileUserSetupPayments,
} from "@/lib/payments/setup-fee";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { StoreIcon } from "@/components/vendor/store-icon";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!hasSupabaseConfig()) {
    redirect("/auth/login");
  }
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  await reconcileUserSetupPayments(user.id);

  const vendor = await getCurrentVendor();
  if (vendor) redirect("/vendor/dashboard");

  const paidSetup = await getPaidSetupAwaitingStore(user.id);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </header>

        {paidSetup ? (
          <Link
            href="/create-store?resume=1"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 transition hover:bg-amber-100"
          >
            <div>
              <p className="text-sm font-bold">Continue store setup</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                Your setup fee is paid for <strong>/{paidSetup.slug}</strong>. Finish your
                application to open the agent dashboard.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-amber-700 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <CreateStorePrompt />
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

function CreateStorePrompt() {
  return (
    <Link
      href="/create-store"
      className="group flex items-center justify-between gap-3 rounded-2xl bg-navy-900 p-4 text-white transition-all hover:bg-navy-800"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <StoreIcon icon="store" size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">Create Store</p>
          <p className="text-xs text-slate-400">Launch your storefront</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
    </Link>
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
