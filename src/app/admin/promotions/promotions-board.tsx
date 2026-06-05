"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState, AdminSection } from "@/components/admin";
import { DashboardModal } from "@/components/shared/dashboard-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PromotionToggle } from "./promotion-toggle";

export interface PromotionRow {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface FormState {
  title: string;
  code: string;
  description: string;
  discountType: "percent" | "amount";
  discountPercent: string;
  discountAmount: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const emptyForm = (): FormState => ({
  title: "",
  code: "",
  description: "",
  discountType: "percent",
  discountPercent: "10",
  discountAmount: "",
  startsAt: "",
  endsAt: "",
  active: true,
});

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

function rowToForm(row: PromotionRow): FormState {
  const usePercent = row.discountPercent != null;
  return {
    title: row.title,
    code: row.code ?? "",
    description: row.description ?? "",
    discountType: usePercent ? "percent" : "amount",
    discountPercent: row.discountPercent != null ? String(row.discountPercent) : "",
    discountAmount: row.discountAmount != null ? String(row.discountAmount) : "",
    startsAt: toLocalInput(row.startsAt),
    endsAt: toLocalInput(row.endsAt),
    active: row.active,
  };
}

function buildPayload(form: FormState) {
  const discountPercent =
    form.discountType === "percent" && form.discountPercent.trim()
      ? Number(form.discountPercent)
      : null;
  const discountAmount =
    form.discountType === "amount" && form.discountAmount.trim()
      ? Number(form.discountAmount)
      : null;

  return {
    title: form.title.trim(),
    code: form.code.trim() || null,
    description: form.description.trim() || null,
    discountPercent,
    discountAmount,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    active: form.active,
  };
}

export function PromotionsBoard({ promos }: { promos: PromotionRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(row: PromotionRow) {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setModalOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = buildPayload(form);
    if (payload.discountPercent == null && payload.discountAmount == null) {
      toast.error("Set a discount percent or fixed amount");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/promotions/${editingId}` : "/api/admin/promotions";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save campaign");

      toast.success(editingId ? "Campaign updated" : "Campaign created");
      setModalOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not delete campaign");
      toast.success("Campaign deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete campaign");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <AdminSection
        title="Campaigns"
        description="Create, edit, or remove checkout promotions. Toggle active campaigns without deleting them."
        icon={Tag}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        }
      >
        {promos.length === 0 ? (
          <AdminEmptyState
            icon={Tag}
            title="No promotions yet"
            description="Create a campaign to offer discounts on customer checkout."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create first campaign
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {promos.map((p) => (
              <li key={p.id} className="admin-promo-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{p.title}</h3>
                    {p.code && <span className="admin-promo-code">{p.code}</span>}
                    <Badge variant={p.active ? "success" : "neutral"}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-xs text-white/60">{p.description}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-white/50">
                    {p.discountPercent != null && `${p.discountPercent}% off`}
                    {p.discountAmount != null && `GH₵${p.discountAmount} off`}
                    {p.endsAt &&
                      ` · ends ${formatDistanceToNow(new Date(p.endsAt), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(p)}
                    aria-label={`Edit ${p.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <PromotionToggle promoId={p.id} active={p.active} />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={deletingId === p.id}
                    onClick={() => void remove(p.id, p.title)}
                    aria-label={`Delete ${p.title}`}
                    className="border-rose-500/30 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <DashboardModal
        open={modalOpen}
        title={editingId ? "Edit campaign" : "New campaign"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Launch Promo"
          />
          <Input
            label="Promo code (optional)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="LAUNCH10"
            hint="Customers enter this at checkout"
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="10% off your first order"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Discount type</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  form.discountType === "percent"
                    ? "border-amber-400 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setForm((f) => ({ ...f, discountType: "percent" }))}
              >
                Percentage
              </button>
              <button
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  form.discountType === "amount"
                    ? "border-amber-400 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setForm((f) => ({ ...f, discountType: "amount" }))}
              >
                Fixed amount
              </button>
            </div>
          </div>

          {form.discountType === "percent" ? (
            <Input
              label="Discount percent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
              placeholder="10"
            />
          ) : (
            <Input
              label="Discount amount (GHS)"
              type="number"
              min={0}
              step="0.01"
              value={form.discountAmount}
              onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
              placeholder="5"
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Starts (optional)"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
            <Input
              label="Ends (optional)"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active immediately
          </label>

          <Button className="w-full" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Create campaign"}
          </Button>
        </div>
      </DashboardModal>
    </>
  );
}
