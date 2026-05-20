import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
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
    return (
      <div className="card-elevated p-8 text-center text-muted">Database not configured.</div>
    );
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Promotions</h2>
        <p className="mt-1 text-sm text-muted">
          {active.length} active · {promos.length} total campaigns
        </p>
      </div>

      {promos.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted">No promotions yet.</div>
      ) : (
      <ul className="space-y-3">
        {promos.map((p) => (
          <li key={p.id} className="card-elevated flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{p.title}</h3>
                {p.code && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">
                    {p.code}
                  </span>
                )}
                <Badge variant={p.active ? "success" : "neutral"}>
                  {p.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {p.description && (
                <p className="mt-1 text-sm text-muted">{p.description}</p>
              )}
              <p className="mt-2 text-xs text-muted">
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
    </div>
  );
}
