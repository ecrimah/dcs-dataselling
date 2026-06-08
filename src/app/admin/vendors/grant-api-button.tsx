"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function GrantApiButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function grant() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/registrations/grant-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("API access granted. Set their role in the vendors list below.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={grant}>
      <Code2 className="mr-1 h-3.5 w-3.5" />
      {pending ? "Granting…" : "Grant API access"}
    </Button>
  );
}
