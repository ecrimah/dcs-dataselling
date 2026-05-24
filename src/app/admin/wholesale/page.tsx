import { fetchAdminWholesaleCatalogue } from "@/lib/data/wholesale";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { AdminConfigError, AdminPageIntro, AdminPageRoot } from "@/components/admin";
import { WholesaleAdmin } from "./wholesale-admin";

export const dynamic = "force-dynamic";

export default async function AdminWholesalePage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  const bundles = await fetchAdminWholesaleCatalogue();
  const active = bundles.filter((b) => b.active).length;

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Supply catalogue"
        description="Set wholesale prices agents pay — they add markup in their own storefront catalogue."
        meta={`${bundles.length} bundles · ${active} active for vendors`}
      />
      <WholesaleAdmin bundles={bundles} />
    </AdminPageRoot>
  );
}
