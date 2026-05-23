import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { fetchVendorComplaints } from "@/lib/vendor/extras";
import { SITE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ComplaintsForm } from "./complaints-form";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  const complaints = await fetchVendorComplaints(vendor.id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-foreground">My complaints</h2>
      <p className="text-sm text-muted">
        Urgent? WhatsApp{" "}
        <a href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`} className="font-semibold text-amber-700">
          support
        </a>
        .
      </p>
      <ComplaintsForm />

      {complaints.length > 0 && (
        <ul className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-muted">Your tickets</p>
          {complaints.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 bg-navy-900 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.subject ?? "Complaint"}</span>
                <Badge variant={c.status === "resolved" ? "success" : "warning"}>{c.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-white/55">{c.message}</p>
              {c.admin_reply && (
                <p className="mt-2 rounded-lg bg-white/5 p-2 text-xs text-gold">{c.admin_reply}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
