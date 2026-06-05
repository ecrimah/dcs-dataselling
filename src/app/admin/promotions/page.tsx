import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { AdminConfigError, AdminPageIntro, AdminPageRoot } from "@/components/admin";
import { PromotionsBoard, type PromotionRow } from "./promotions-board";

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
}

export default async function AdminPromotionsPage() {
  if (!hasSupabaseConfig()) {
    return <AdminConfigError />;
  }

  let promos: PromotionRow[] = [];

  const service = createServiceClient();
  const { data, error } = await service
    .from("promotions")
    .select(
      "id, code, title, description, discount_percent, discount_amount, active, starts_at, ends_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (!error && data) {
    promos = (data as PromoRow[]).map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      discountPercent: p.discount_percent ? Number(p.discount_percent) : null,
      discountAmount: p.discount_amount ? Number(p.discount_amount) : null,
      active: p.active,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
    }));
  }

  const active = promos.filter((p) => p.active);

  return (
    <AdminPageRoot>
      <AdminPageIntro
        badge="Customer campaigns"
        description="Platform-wide promotions applied at checkout on vendor storefronts."
        meta={`${active.length} active · ${promos.length} total campaigns`}
      />

      <PromotionsBoard promos={promos} />
    </AdminPageRoot>
  );
}
