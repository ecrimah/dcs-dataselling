import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  AdminList,
  AdminListItem,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
} from "@/components/admin";
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
    <AdminPageRoot>
      <AdminPageIntro
        badge="Support"
        description={
          <>
            Submit issues about orders or payments. Urgent? WhatsApp{" "}
            <a
              href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`}
              className="font-semibold text-amber-800 hover:underline"
            >
              support
            </a>
            .
          </>
        }
        meta={`${complaints.length} tickets`}
      />

      <AdminSection title="New complaint" description="Describe the issue and we'll respond." icon={MessageSquare}>
        <ComplaintsForm />
      </AdminSection>

      {complaints.length > 0 && (
        <AdminSection title="Your tickets" description="Past submissions and admin replies." icon={MessageSquare}>
          <AdminList>
            {complaints.map((c) => (
              <AdminListItem key={c.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{c.subject ?? "Complaint"}</span>
                  <Badge variant={c.status === "resolved" ? "success" : "warning"}>{c.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{c.message}</p>
                {c.admin_reply && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span className="font-semibold">Reply:</span> {c.admin_reply}
                  </p>
                )}
              </AdminListItem>
            ))}
          </AdminList>
        </AdminSection>
      )}
    </AdminPageRoot>
  );
}
