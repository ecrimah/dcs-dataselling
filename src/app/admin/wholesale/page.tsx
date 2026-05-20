import { fetchAdminWholesaleCatalogue } from "@/lib/data/wholesale";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { WholesaleAdmin } from "./wholesale-admin";

export const dynamic = "force-dynamic";

export default async function AdminWholesalePage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
  }

  const bundles = await fetchAdminWholesaleCatalogue();
  const active = bundles.filter((b) => b.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Wholesale catalogue</h2>
        <p className="mt-1 text-sm text-muted">
          {bundles.length} bundles · {active} active for vendors
        </p>
      </div>
      <WholesaleAdmin bundles={bundles} />
    </div>
  );
}
