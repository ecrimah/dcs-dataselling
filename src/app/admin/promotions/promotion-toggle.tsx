"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PromotionToggle({
  promoId,
  active,
}: {
  promoId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/promotions/${promoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(active ? "Promotion deactivated" : "Promotion activated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle} disabled={pending}>
      {pending ? "…" : active ? "Deactivate" : "Activate"}
    </Button>
  );
}
