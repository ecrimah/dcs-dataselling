import { Tag } from "lucide-react";
import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  AdminConfigError,
  AdminEmptyState,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { PromotionToggle } from "./promotion-toggle";

export const dynamic = "force-dynamic";

interface PromoRow {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default async function AdminPromotionsPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  let promos: PromoRow[] = [];

  {
    const service = createServiceClient();
    const { data, error } = await service
      .from("promotions")
      .select(
        "id, code, title, description, discount_percent, discount_amount, active, starts_at, ends_at, created_at",
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      promos = (data as PromoRow[]).map((p) => ({
        ...p,
        discount_percent: p.discount_percent ? Number(p.discount_percent) : null,
        discount_amount: p.discount_amount ? Number(p.discount_amount) : null,
      }));
    }
  }

  const active = promos.filter((p) => p.active);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Customer campaigns"
        description="Platform-wide promotions applied at checkout on vendor storefronts."
        meta={`${active.length} active · ${promos.length} total campaigns`}
      />

      <AdminSection title="Active campaigns" description="Toggle campaigns on or off without redeploying." icon={Tag}>
        {promos.length === 0 ? (
          <AdminEmptyState
            icon={Tag}
            title="No promotions yet"
            description="Create a campaign to offer discounts on customer checkout."
          />
        ) : (
          <ul className="space-y-2">
            {promos.map((p) => (
              <li key={p.id} className="admin-promo-card">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{p.title}</h3>
                    {p.code && <span className="admin-promo-code">{p.code}</span>}
                    <Badge variant={p.active ? "success" : "neutral"}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-xs text-muted">{p.description}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted">
                    {p.discount_percent != null && `${p.discount_percent}% off`}
                    {p.discount_amount != null && ` · ₵${p.discount_amount} off`}
                    {p.ends_at &&
                      ` · ends ${formatDistanceToNow(new Date(p.ends_at), { addSuffix: true })}`}
                  </p>
                </div>
                <PromotionToggle promoId={p.id} active={p.active} />
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </AdminPageRoot>
  );
}
