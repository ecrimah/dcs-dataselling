import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVendorSetupFee } from "@/lib/data/platform-config";
import { formatGHS } from "@/lib/format";

export async function SetupFeeGate() {
  const fee = await getVendorSetupFee();
  return (
    <div className="card-elevated mx-auto max-w-xl p-8 text-center">
      <CreditCard className="mx-auto h-12 w-12 text-cyan-500" />
      <h2 className="mt-4 text-xl font-bold">Store activation fee required</h2>
      <p className="mt-2 text-sm text-muted">
        Pay the one-time setup fee ({formatGHS(fee)}) to unlock your vendor dashboard and catalogue.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/create-store">Complete store setup</Link>
      </Button>
    </div>
  );
}
