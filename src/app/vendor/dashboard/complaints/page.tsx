import { redirect } from "next/navigation";
import { SetupFeeGate } from "@/components/vendor/setup-fee-gate";
import { getCurrentVendor } from "@/lib/auth/session";
import { SITE } from "@/lib/constants";
import { ComplaintsForm } from "./complaints-form";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/auth/login");
  if (!vendor.setupFeePaidAt) return <SetupFeeGate />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-white">My complaints</h2>
      <p className="text-sm text-white/55">
        Report order or payment issues. For urgent help, WhatsApp{" "}
        <a href={`https://wa.me/${SITE.supportWhatsApp.replace(/\D/g, "")}`} className="text-gold">
          support
        </a>
        .
      </p>
      <ComplaintsForm />
    </div>
  );
}
