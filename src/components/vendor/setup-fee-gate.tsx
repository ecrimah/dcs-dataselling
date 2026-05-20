import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VENDOR_STORE_SETUP_FEE_GHS } from "@/lib/constants";
import { formatGHS } from "@/lib/format";

export function SetupFeeGate() {
  return (
    <div className="card-elevated mx-auto max-w-xl p-8 text-center">
      <CreditCard className="mx-auto h-12 w-12 text-cyan-500" />
      <h2 className="mt-4 text-xl font-bold">Store activation fee required</h2>
      <p className="mt-2 text-sm text-muted">
        Pay the one-time setup fee ({formatGHS(VENDOR_STORE_SETUP_FEE_GHS)}) to unlock your vendor
        dashboard and catalogue.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/create-store">Complete store setup</Link>
      </Button>
    </div>
  );
}
